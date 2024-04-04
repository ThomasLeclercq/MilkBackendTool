import { BatchWriteItemCommandInput, QueryCommand, QueryCommandInput, QueryCommandOutput, WriteRequest } from "@aws-sdk/client-dynamodb";
import { BaseDataService } from "..";
import async from "async";
import { ArrayHelper } from "../../helpers";

interface DynamoAsset { ProjectGuid: string, AssetGuid: string, Data: string, DeletedFromS3?: string }

export class RestoreCleanupDynamoAssetService extends BaseDataService {
  constructor() {
    super();
  }

  public async RevertDeletedAssetsForUser(userId: number): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {

        const projectGuidList = await this.GetUserProjectGuidList(userId);
        console.log("Found %s projects for %s", projectGuidList.length, userId);

        async.eachLimit(projectGuidList, 5, async (projectGuid: string) => {

          const assetList = await this.GetProjectAssets(projectGuid);
          
          const affected = assetList.filter(x => x.DeletedFromS3 != undefined);
          console.log("Found %s affected assets on %s assets for project %s", affected.length, assetList.length, projectGuid);
          if (affected.length > 0) {
            await this.BatchUpdateDeletedAssets(assetList); 
            console.log("Reverted %s assets for %s", assetList.length, projectGuid)
          }
        }, (err) => {
          if (err) {
            console.error(err);
            return reject(err);
          } 
          return resolve();
        })

      } catch(err) {
        return reject(err);
      }
    });
  }

  protected async GetUserProjectGuidList(userId: number): Promise<string[]> {
    try {
      const projectGuidList = [];
      const queryInput: QueryCommandInput = {
        TableName: "Project",
        ExpressionAttributeValues: {
          ":user_id": { N: userId.toString() }
        },
        KeyConditionExpression: "UserId = :user_id",

      } 
      const output: QueryCommandOutput = await this._aws.DynamoDBProvider.query(queryInput);
      if (output && output.Items.length > 0) {
        for(const item of output.Items) {
          const projectGuid = item["ProjectGuid"].S;
          projectGuidList.push(projectGuid);
        }
      }
      return projectGuidList;
    }
    catch(err) {
      console.error(`Error with GetUserProjectGuidList => ${userId} => `, err);
      throw err;
    }
  }

  protected async GetProjectAssets(projectGuid: string): Promise<DynamoAsset[]> {
    try {

      const assetList: DynamoAsset[] = [];
      const queryInput: QueryCommandInput = {
        TableName: "Asset",
        ExpressionAttributeValues: {
          ":project_guid": { S: projectGuid }
        },
        KeyConditionExpression: "ProjectGuid = :project_guid"
      } 
      const output: QueryCommandOutput = await this._aws.DynamoDBProvider.query(queryInput);
      if (output && output.Items.length > 0) {
        for(const item of output.Items) {
          assetList.push({ 
            ProjectGuid: item["ProjectGuid"].S,
            AssetGuid: item["AssetGuid"].S,
            Data: item["Data"].S,
            DeletedFromS3: item["DeletedFromS3"] ? "true" : undefined
          });
        }
      }
      return assetList;

    } catch(err) {
      console.error(`Error with GetProjectAssets => ${projectGuid} => `, err);
      throw err;
    }
  }

  protected async BatchUpdateDeletedAssets(assets: DynamoAsset[]): Promise<void> {
    try {
      const batchList = ArrayHelper.getBatchesFromArray(assets, 25);
      for (const batch of batchList) {
        const writeRequestList: WriteRequest[] = [];
        for(const asset of batch) {
          const writeRequest: WriteRequest = {
            PutRequest: {
              Item: {
                "ProjectGuid": {S: asset.ProjectGuid},
                "AssetGuid": {S: asset.AssetGuid},
                "Data": {S: asset.Data},
              },
            }
          }
          writeRequestList.push(writeRequest);
        }
        const batchWriteInput: BatchWriteItemCommandInput = {
          RequestItems: {
            "Asset": writeRequestList
          }
        }
        await this._aws.DynamoDBProvider.batchWriteItems(batchWriteInput);
      }

    } catch(err) {
      console.error(`Error with BatchUpdateDeletedAssets => `, err);
      throw err;
    }
  }

}