// Fetch S3 object
// Update S3 object

import { AWSError, DynamoDB, S3 } from "aws-sdk";

export class AwsProvider {
  private S3: S3;
  private Dynamo: DynamoDB;

  constructor(region: string) {
    if (!region || region === "") {
      throw new Error("S3 region is missing, please provide AWSREGION in .env file");
    } 
    this.S3 = new S3({ region });
    this.Dynamo = new DynamoDB({ region });
  }
  async listS3Objects(params: S3.ListObjectsV2Request): Promise<S3.ObjectList> {
    return new Promise( (resolve, reject) => {
      let objects: S3.ObjectList = [];
      this.S3.listObjectsV2(params, async (err: AWSError, data: S3.ListObjectsV2Output) => {
        if (err) {
          reject(err);
        } else {
          objects = [...objects, ...data.Contents];
          if (data.NextContinuationToken) {
            const moreObjects = await this.listS3Objects({...params, ContinuationToken: data.NextContinuationToken})
            objects = [...objects, ...moreObjects];
          }
          resolve( objects );
        }
      })
    });
  }

  async getS3Object(params: S3.GetObjectRequest): Promise<S3.Body> {
    return new Promise( (resolve, reject) => {
      this.S3.getObject(params, (err: AWSError, data: S3.GetObjectOutput) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.Body);
        }
      })
    });
  }

  async putS3Object(params: S3.PutObjectRequest): Promise<void> {
    return new Promise( (resolve, reject) => {
      this.S3.putObject(params, (err: AWSError, data: S3.PutObjectOutput) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    });
  }

  async dynamoQuery(params: DynamoDB.QueryInput): Promise<DynamoDB.ItemList> {
    return new Promise( async (resolve, reject) => {
      try {
        this.Dynamo.query(params, (err, data: DynamoDB.QueryOutput) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.Items);
          }
        });

      } catch(e) {
        reject(e);
      }
    })
  }

}