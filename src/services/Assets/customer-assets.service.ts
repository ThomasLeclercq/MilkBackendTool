import async from "async";
import { FileHelper } from "../../helpers/index";
import { AwsProvider } from "../../providers/aws.provider";

export class CustomerAssetService {
  constructor(private _aws: AwsProvider) {}

  async getAssetsFromProject(projectGuid: string, userId: string): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {

        // get AssetGuid and Folder from Dynamo
        const projectAssets = await this._aws.dynamoQuery({ 
          TableName: "Asset",
          KeyConditionExpression: 'ProjectGuid = :vGuid',
          ExpressionAttributeValues: {
            ":vGuid": { "S": projectGuid } 
          }
        });
        if (projectAssets.length > 0) {
          async.eachLimit(projectAssets, 10, async (asset) => {
            const data = JSON.parse(asset.Data.S);
            const folder: string = data.Folder;
            const guid: string = data.Guid;
            const name: string = data.OriginalFileName;
            const params = { Bucket: 'milkbooks-design', Key: `library/${userId}/${folder}/original/${guid}.${name}` };
            console.log(params);
            const fileBuffer = await this._aws.getS3Object(params) as Buffer;
            if (fileBuffer) {
              FileHelper.storeImageFile(fileBuffer, `${name}`, [projectGuid]);
            }
          }, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          })
        }

      } catch(e) {
        reject(e);
      }
    });
  }

}