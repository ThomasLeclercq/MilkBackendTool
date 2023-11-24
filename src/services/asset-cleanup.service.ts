import { BatchWriteItemCommandInput, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { InvokeCommandInput } from "@aws-sdk/client-lambda";
import { DeleteObjectsCommandInput } from "@aws-sdk/client-s3";
import * as async from "async";
import { BaseDataService } from ".";
import { ArrayHelper } from "../helpers";

export interface DynamoProjectAssetSyncEntry { ProjectGuid: { S: string }, AssetGuid: { S: string } };
export interface Asset { Guid: string, Folder: string, OriginalFileName: string, ProjectGuid: string };

export class AssetCleanupService extends BaseDataService {
  
  constructor(
    private readonly _dynamoProjectAssetSyncTable = process.env.DYNAMO_PROJECT_ASSET_SYNC_TABLE,
    private readonly _s3AssetBucket = process.env.ASSET_BUCKET,
    private readonly _apiDatabase = process.env.API_DATABASE,
    private readonly _webDatabase = process.env.WEB_DATABASE
  ) {
    super();
    console.log("Parameters => ", {
      SQLServer: process.env.SQL_SERVER,
      DynamoRegion: process.env.DYNAMO_REGION,
      S3Region: process.env.S3_REGION,
      ProjectAssetSyncDynamoTable: _dynamoProjectAssetSyncTable,
      AssetS3Bucket: _s3AssetBucket,
      DryRun: process.env.DRY_RUN,
      Databases: { Api: this._apiDatabase, Web: this._webDatabase }
    })
  }

  async run(startDate: string, endDate: string): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        console.log("");
        console.log("");
        console.time("S3AssetsToDelete");
        await this._sql.connect();
    
        const { S3AssetKeyList, DynamoAssetList } = await this._getS3AssetKeyListToDeleteForDateRange(startDate, endDate);
        console.log("%s Asset key to Delete", S3AssetKeyList.length);
        console.log("%s Assets entries to Delete", DynamoAssetList.length);
        
        if (process.env.DRY_RUN === "false") {
          await Promise.all([
            this._deleteAssetProjectSyncDynamoDBEntries(DynamoAssetList),
            this._deleteS3Asset(S3AssetKeyList)
          ]);
        }
        
        await this._sql.disconnect();
        console.timeEnd("S3AssetsToDelete");
        console.log("");
        console.log("");
        resolve();
      } catch(err) {
        this._sql.disconnect();
        reject(err);
      }
    });
  }

  private async _getS3AssetKeyListToDeleteForDateRange(startDate: string, endDate: string): Promise<{S3AssetKeyList: string[], DynamoAssetList: DynamoProjectAssetSyncEntry[]}> {
    return new Promise( async (resolve, reject) => {
      try {
        console.log("Fetching Assets to Delete for %s to %s", startDate, endDate);
        
        const S3AssetKeyList: string[] = [];
        const DynamoAssetList: DynamoProjectAssetSyncEntry[] = []
        const userProjectsToDelete: { [userId: string]: string[] } = await this._getDeletedProjectsForPeriod(startDate, endDate);
        const userIdList = Object.keys(userProjectsToDelete);
        console.log("Will delete assets for %s different users", userIdList.length);
  
        for (const userId of userIdList) {
          console.log("");
          console.log("==========================================");
          console.log("");
          const projectsToDelete: string[] = userProjectsToDelete[userId];
          const activeProjectGuids: string[] = await this._getUserActiveProjects(userId);
    
          for (const deleted of projectsToDelete) {
            if (activeProjectGuids.includes(deleted)) {
              throw "QUERY IS WRONG !!!!!! => Both DELETED and ACTIVE: " + deleted;
            }
          }
    
          const assetList = await this._getAssetListFromDeletedProjectList(projectsToDelete);
          console.log("Found %s assets from %s deleted projects", assetList.length, projectsToDelete.length);
  
          for (const asset of assetList) {
            const dynamoDBEntry = {
              ProjectGuid: {
                S: asset.ProjectGuid
              }, 
              AssetGuid: {
                S: asset.Guid
              }
            };
            if (!DynamoAssetList.find(x => x.ProjectGuid.S === dynamoDBEntry.ProjectGuid.S && x.AssetGuid.S === dynamoDBEntry.AssetGuid.S)) {
              DynamoAssetList.push(dynamoDBEntry);
            }
          }
    
          const listTodelete = await this._getAssetGuidListToDelete(assetList, activeProjectGuids);
          console.log("Found %s assets to delete", listTodelete.length);
    
          for (const assetToDelete of listTodelete) {
            for (const assetType of ["original", "thumbnail", "small"]) {
              const s3KeyToDelete = `library/${userId}/${assetToDelete.Folder}/${assetType}/${assetToDelete.Guid}.${assetToDelete.OriginalFileName}`;
              if (!S3AssetKeyList.includes(s3KeyToDelete)) {
                S3AssetKeyList.push(s3KeyToDelete);
              }
            }
          }
        }
        resolve({
          S3AssetKeyList,
          DynamoAssetList
        });
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _getUserActiveProjects(userId: string): Promise<string[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const activeProjectQuery = `
          SELECT DISTINCT LOWER(p.Guid) as ProjectGuid, p.UserId
          FROM [${this._apiDatabase}].[dbo].[Project] p
          LEFT JOIN [${this._webDatabase}].[dbo].[uCommerce_OrderProperty] op ON op.[Value] = Convert(nvarchar(255), LOWER(p.Guid)) AND op.[Key] = 'ApiProjectId'
          WHERE p.UserId = '${userId}' AND ( op.[Value] IS NOT NULL OR p.IsDeleted = 0)
        `;
        const result = await this._sql.query(activeProjectQuery);
        console.log("Found %s Active projects for UserId %s", result.length, userId);
  
        resolve(result.map(x => x["ProjectGuid"]));
      } catch(err) {
        reject(err);
      }
    });
  }
  
  private async _getDeletedProjectsForPeriod(dateStart: string, dateEnd: string): Promise<{[UserId: string]: string[]}> {
    return new Promise( async (resolve, reject) => {
      try {
        const deletedProjectQuery = `
          SELECT LOWER(p.Guid) as ProjectGuid, p.UserId
          FROM [${this._apiDatabase}].[dbo].[Project] p
          LEFT JOIN [${this._webDatabase}].[dbo].[uCommerce_OrderProperty] op ON op.[Value] = Convert(nvarchar(255), LOWER(p.Guid)) AND op.[Key] = 'ApiProjectId'
          WHERE
          p.IsDeleted = 1
          AND 
          p.ApplicationId = 121482
          AND 
          p.LastSavedDateUtc >= Convert(datetime, '${dateStart}')
          AND 
          p.LastSavedDateUtc <= Convert(datetime, '${dateEnd}')
          AND 
          op."Key" IS NULL  
        `;
        const result = await this._sql.query(deletedProjectQuery);
        let deletedProjects = {};
        for (const userProject of result) {
          const userId = userProject["UserId"];
          const projectGuid = userProject["ProjectGuid"];
  
          if (!deletedProjects[userId]) {
            deletedProjects[userId] = [];
          }
          if (!deletedProjects[userId].includes(projectGuid)) {
            deletedProjects[userId].push(projectGuid);
          }
          
        }
        console.log("Found %s Deleted projects", result.length);
        resolve(deletedProjects)
      } catch(err) {
        reject(err);
      }
    });
  }
  
  private async _getAssetListFromDeletedProjectList(deletedProjectGuidList: string[]): Promise<Asset[]> {
    return new Promise( async (resolve, reject) => {
      let assetGuidList: Asset[] = [];
      async.eachLimit(deletedProjectGuidList, 10, async (projectGuid) => {
        const assets = await this._getProjectAssets(projectGuid);
        assetGuidList = [...assetGuidList, ...assets];
      }, (err) => {
        if(err) {
          reject(err) 
        } else {
          resolve(assetGuidList);
        }
      })
    });
  }
  
  private async _getAssetGuidListToDelete(assetList: Asset[], activeProjectsGuids: string[]): Promise<Asset[]> {
    return new Promise( async (resolve, reject) => {
      const assetsToDelete: Asset[] = [];
      async.eachLimit(assetList, 100, async (asset) => {
        const canDeleteAsset = await this._canDelete(asset.Guid, activeProjectsGuids);
        if (canDeleteAsset) {
          assetsToDelete.push(asset);
        }
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(assetsToDelete);
        }
      });
    });
  }
  
  private async _getProjectAssets(projectGuid: string): Promise<Asset[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const projectAssetsQuery: QueryCommandInput = {
          TableName: this._dynamoProjectAssetSyncTable,
          ExpressionAttributeValues: {
            ":project_guid": { S: projectGuid },
          },
          KeyConditionExpression: "ProjectGuid = :project_guid",
        }
        const output = await this._aws.DynamoDBProvider.query(projectAssetsQuery);
        const assets = output.Items.map(x => {
        const data = JSON.parse(x["Data"].S);
          return {
            Guid: x["AssetGuid"].S,
            Folder: data["Folder"],
            OriginalFileName: data["OriginalFileName"],
            ProjectGuid: projectGuid
          }
        });
        resolve(assets);
      } catch(err) {
        reject(err);
      }
    }); 
  }
  
  private async _canDelete(assetGuid: string, activeProjectsGuids: string[]): Promise<boolean> {
    return new Promise( async (resolve, reject) => {
      try {
        const payload = { AssetGuid: assetGuid, ProjectGuids: activeProjectsGuids };
        const input: InvokeCommandInput = {
          FunctionName: process.env.CAN_DELETE_FUNCTION_NAME,
          Payload: Buffer.from(JSON.stringify(payload), 'utf-8')
        }
        const output = await this._aws.LambdaProvider.invoke(input);
        const response = output.Payload.transformToString('utf-8');
        const { body } = JSON.parse(response);
        const { canDelete } = JSON.parse(body);
        resolve(canDelete);
      } catch(err) {
        reject(err);
      }
    });
  }
  
  private async _deleteAssetProjectSyncDynamoDBEntries(dynamoDBEntryList: DynamoProjectAssetSyncEntry[]): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const batchDeleteQueries = ArrayHelper.getBatchesFromArray(dynamoDBEntryList, 25);
        for (const batchQuery of batchDeleteQueries) {
          const batchDeleteQuery: BatchWriteItemCommandInput = {
            RequestItems: {
              [this._dynamoProjectAssetSyncTable]: batchQuery.map(x =>({ "DeleteRequest": { "Key": x } }))
            }
          }
          await this._aws.DynamoDBProvider.batchWriteItems(batchDeleteQuery);
        }
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }
  
  private async _deleteS3Asset(S3AssetKeyList: string[]): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const batches = ArrayHelper.getBatchesFromArray(S3AssetKeyList, 1000);
        for (const batch of batches) {
          const input: DeleteObjectsCommandInput = {
            Bucket: this._s3AssetBucket,
            Delete: {
              Objects: batch.map(x => ({Key: x}))
            }
          }
          await this._aws.S3Provider.deleteMultipleS3Objects(input);
        }
        resolve();
      } catch(err) {
        reject(err);
      }
    })
  }

  private async _pollDesignStudioDeletedAssets(): Promise<Asset[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const messages: string[] = await this._rmq.receive('asset_filter', 100);
        const payload: {Subject: string, Payload: any[]}[] = messages.map(x => JSON.parse(x));
        const assets: Asset[] = payload.map(x => x.Payload).reduce( (previous, current) => {
          return [...previous, ...current];
        });
        resolve(assets);
      } catch(err) {
        reject(err);
      }
    });
  }

}