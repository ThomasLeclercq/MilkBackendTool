import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { ArrayHelper, FileHelper } from "../helpers";
import { AwsProvider } from "../providers";
import async from "async";
import fs from "fs";

interface Asset {
  ProjectGuid: string;
  AssetGuid: string;
}

export class RepairHEICAssetsService {

  private _aws: AwsProvider;

  constructor(){
    this._aws = new AwsProvider(
      process.env.AWSREGION,
      process.env.S3_REGION,
      process.env.DYNAMO_REGION,
      process.env.LAMBDA_REGION,
    );
  }

  async repairHeicForUser(userId: number): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const heicAssetKeyList = await this._listHEICS3AssetsFromUser(userId);
        console.log("Found %s heic files for %s", heicAssetKeyList.length, userId, heicAssetKeyList);
        await this._copyUserAssets(heicAssetKeyList, userId);
        
        const projects: Record<string, AttributeValue>[] = await this._fetchUserProjects(userId);
        const activeProjects = projects.filter(x => {
          return x["ProjectStatus"] ? parseInt(x["ProjectStatus"].S) < 4 : false;
        });
        console.log("Found %s active projects for %s", activeProjects.length, userId, activeProjects.map( x => x["ProjectGuid"].S));

        for (const project of activeProjects) {
          const projectGuid: string = project["ProjectGuid"].S;
          const spreadGuids: string[] = JSON.parse(project["Spreads"].S);
          const spreadData: Record<string, AttributeValue>[] = await this._fetchProjectSpreadData(projectGuid, spreadGuids);
          console.log("Fetched %s spreads for Project %s", spreadData.length, projectGuid);

          
          const assetToUpdate: Record<string, AttributeValue>[] = []
          spreadData.filter(x => x["Data"].S.match(/heic/)).forEach(x => {
            const projectGuid = x["ProjectGuid"].S;
            FileHelper.storeFile(JSON.parse(x["Data"].S), `OriginalSpread-${x["SpreadGuid"].S}.json`, ['heic-recovery', userId.toString(), projectGuid])
            const data = JSON.parse(x["Data"].S);
            if (data.Layout?.ImagePlaceholders) {
              data.Layout?.ImagePlaceholders.filter( imagePlaceholder => imagePlaceholder.Asset !== undefined ).forEach( imagePlaceholder => {
                const asset = imagePlaceholder.Asset;
                FileHelper.storeFile(asset, `OriginalAsset-${asset.Guid}.json`, ['heic-recovery', userId.toString(), projectGuid])
                assetToUpdate.push({ 
                  ProjectGuid: { S: projectGuid }, 
                  AssetGuid: { S: asset.Guid }, 
                  Data: { S: JSON.stringify(asset).replace(/heic/gm, "jpg") }
                })
              })
            }
          });

          const spreadsToUpdate: Record<string, AttributeValue>[] = spreadData
            .filter(x => x["Data"].S.match(/heic/))
            .map(x => ({...x, "Data": { S: x["Data"].S.replace(/heic/gm, "jpg")} }) );

          if (assetToUpdate.length > 0) {
            console.log("Found Asset Data to Repair")
            FileHelper.storeFile(assetToUpdate, `AssetDataToUpdate.json`, ['heic-recovery', userId.toString(), projectGuid])
          }
          if (spreadsToUpdate.length > 0) {
            console.log("Found Spread Data to Repair")
            FileHelper.storeFile(spreadsToUpdate, `SpreadDataToUpdate.json`, ['heic-recovery', userId.toString(), projectGuid])
          } 

          await Promise.all([
            this._updateProjectSpreadData(projectGuid, spreadsToUpdate),
            this._updateAssetData(projectGuid, assetToUpdate)
          ])

        }
        console.log("Done");
        resolve();
      } catch(err) {
        reject(err);
      }
    })
  }

  private async _listHEICS3AssetsFromUser(userId: number): Promise<string[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const output = await this._aws.S3Provider.listS3Objects({
          Bucket: 'milkbooks-design',
          Prefix: `library/${userId}/11.2023/original/`
        });
        const HEICKeys: string[] = output.Contents.filter( x => x.Key.includes('.heic')).map(x => x.Key);
        resolve(HEICKeys)
      } catch(err) {
        console.error("Error listing HEIC files for user %s", userId);
        reject(err);
      }
    });
  }
  private async _copyUserAssets(heicAssetKeyList: string[], userId: number): Promise<void> {
    return new Promise( async (resolve, reject) => {
      async.eachLimit(heicAssetKeyList, 10, async (heicKey: string) => {
        await this._copyHEICToJPEG(heicKey)
      }, (err) => {
        if (err) {
          return reject(err);
        } else {
          console.log("Repaired %s assets for %s", heicAssetKeyList.length, userId);
          resolve();
        }
      });
    });
  }

  private async _copyHEICToJPEG(key: string): Promise<void> {
    return new Promise( async (resolve, reject) => {
      for( const assetType of ["small", "thumbnail"] ) {  
        const CopySource = key.replace("original", assetType);
        const Key = CopySource.replace("heic", "jpg");
        console.log("Will copy %s to %s", CopySource, Key);
        try {
          await this._aws.S3Provider.copyS3Object({
            Bucket: "milkbooks-design",
            CopySource: `/milkbooks-design/${CopySource}`,
            Key,
          });
        } catch(err) {
          console.error(err.message);
        }
      }
      resolve()
    });
  }

  private async _fetchUserProjects(userId: number): Promise<Record<string, AttributeValue>[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const output = await this._aws.DynamoDBProvider.query({
          TableName: "Project",
          ExpressionAttributeNames: {
            "#userId": "UserId"
          },
          ExpressionAttributeValues: {
            ":userId": { N: userId.toString() }
          },
          KeyConditionExpression: "#userId = :userId"
        });
        if (output && output.Items && output.Count > 0) {
          return resolve(output.Items);
        }
      } catch(err) {
        console.error("Error while fetch user projects - %s -> ", userId, err);
        reject(err);
      }
    });
  }

  private async _fetchProjectSpreadData(projectGuid: string, spreadGuids: string[]): Promise<Record<string, AttributeValue>[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const batches = ArrayHelper.getBatchesFromArray(spreadGuids, 100)
        let spreadData: Record<string, AttributeValue>[] = [];
        for (const batch of batches) {
          const output = await this._aws.DynamoDBProvider.batchGetItems({
            RequestItems: {
              ["Spread"]: { 
                Keys: batch.map( x => ({
                  "ProjectGuid": { S: projectGuid },
                  "SpreadGuid": { S: x }
                }))
              }
            }
          });
          if (output && output.Responses) {
            spreadData = [...spreadData, ...output.Responses["Spread"]];
          }
        }
        return resolve(spreadData);
      } catch(err) {
        console.error("Error fetching Project Spreads - %s", projectGuid);
        reject(err);
      }
    });
  }

  private async _updateProjectSpreadData(projectGuid: string, spreadData: Record<string, AttributeValue>[]): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const batches: Record<string, AttributeValue>[][] = ArrayHelper.getBatchesFromArray(spreadData, 10);
        for (const batch of batches) {
          await this._aws.DynamoDBProvider.batchWriteItems({
            "RequestItems": { "Spread": batch.map( x => ({ "PutRequest": { "Item": x } })) }
          });
        }
        resolve();
      } catch(err) {
        console.error("Error while updating %s ProjectSpreads - %s", projectGuid, err);
        reject(err);
      }
    });
  }

  private async _updateAssetData(projectGuid: string, assetData: Record<string, AttributeValue>[]): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const batches: Record<string, AttributeValue>[][] = ArrayHelper.getBatchesFromArray(assetData, 10);
        for (const batch of batches) {
          await this._aws.DynamoDBProvider.batchWriteItems({
            "RequestItems": { "Asset": batch.map( x => ({ "PutRequest": { "Item": x } })) }
          });
        }
        resolve();
      } catch(err) {
        console.error("Error while updating %s ProjectSpreads - %s", projectGuid, err);
        reject(err);
      }
    });
  }


}