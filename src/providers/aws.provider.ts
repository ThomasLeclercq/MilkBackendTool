// Fetch S3 object
// Update S3 object

import { AWSError, S3 } from "aws-sdk";
import { FileHelper } from "../helpers";

export class AwsProvider {
  private S3: S3;

  constructor(region: string) {
    if (!region || region === "") {
      throw new Error("S3 region is missing, please provide AWSREGION in .env file");
    } 
    this.S3 = new S3({ region });
  }

  async getS3Object(params: S3.GetObjectRequest): Promise<any> {
    return new Promise( (resolve, reject) => {
      this.S3.getObject(params, (err: AWSError, data: S3.GetObjectOutput) => {
        if (err) {
          reject(err);
        } else {
          const str = FileHelper.bufferToString(data.Body as Buffer);
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