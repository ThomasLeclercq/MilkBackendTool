import { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { BaseDataService } from ".";

export interface DynamoProjectAssetSyncEntry { ProjectGuid: { S: string }, AssetGuid: { S: string } };
export interface Asset { Guid: string, Folder: string, OriginalFileName: string, ProjectGuid: string };

export class ArchivePrintedProjectAssets extends BaseDataService {

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

  private async _isPrintedProject(guid: string): Promise<boolean> {
    return new Promise( async (resolve, reject) => {
      try {
        const activeProjectQuery = `
          SELECT DISTINCT LOWER(p.Guid) as ProjectGuid, p.UserId
          FROM [${this._apiDatabase}].[dbo].[Project] p
          LEFT JOIN [${this._webDatabase}].[dbo].[uCommerce_OrderProperty] op ON op.[Value] = Convert(nvarchar(255), LOWER(p.Guid)) AND op.[Key] = 'ApiProjectId'
          WHERE 
          LOWER(p.Guid) = '${guid}' 
          AND 
          op.[Value] IS NOT NULL
        `;
        const result = await this._sql.query(activeProjectQuery);
        const isPrintedProject = result.length !== 0;
        console.log("Project %s is printed? ", guid, isPrintedProject);
        resolve(isPrintedProject);
      } catch(err) {
        reject(err);
      }
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

}