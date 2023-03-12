// Fetch S3 object
// Update S3 object

import { AWSError, S3 } from "aws-sdk";
import { FileHelper } from "../helpers";
import zlib from "zlib";

export class AwsProvider {
  private S3: S3;

  constructor(region: string) {
    if (!region || region === "") {
      throw new Error("S3 region is missing, please provide AWSREGION in .env file");
    } 
    this.S3 = new S3({ region });
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

  async getS3Object(params: S3.GetObjectRequest): Promise<any> {
    return new Promise( (resolve, reject) => {
      this.S3.getObject(params, (err: AWSError, data: S3.GetObjectOutput) => {
        if (err) {
          reject(err);
        } else {
          const buffer = zlib.gunzipSync(data.Body as Buffer);
          const str = FileHelper.bufferToString(buffer);
          resolve( JSON.parse(str) );
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

}