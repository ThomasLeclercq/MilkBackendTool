// Fetch S3 object
// Update S3 object

import { AWSError, DynamoDB, S3, IAM } from "aws-sdk";
import { GetObjectCommand, GetObjectCommandInput, GetObjectCommandOutput, PutObjectCommand, PutObjectCommandInput, PutObjectCommandOutput, S3Client } from "@aws-sdk/client-s3";
import {
  BatchWriteItemCommand, BatchWriteItemCommandInput, BatchWriteItemCommandOutput,
  DeleteItemCommand, DeleteItemCommandInput, DeleteItemCommandOutput,
  DynamoDBClient,
  PutItemCommand, PutItemCommandInput, PutItemCommandOutput,
  QueryCommand, QueryCommandInput, QueryCommandOutput, ScanCommand,
  ScanCommandOutput,
  BatchGetItemCommand, BatchGetItemCommandInput, BatchGetItemCommandOutput,
  GetItemCommand, GetItemCommandInput, GetItemCommandOutput
} from "@aws-sdk/client-dynamodb";

export class AwsProvider {
  public S3Provider: S3Provider;
  public DynamoDBProvider: DynamoDBProvider;
  private S3: S3;
  private Dynamo: DynamoDB;
  private Iam: IAM;

  constructor(region: string) {
    if (!region || region === "") {
      throw new Error("S3 region is missing, please provide AWSREGION in .env file");
    } 
    this.S3 = new S3({ region });
    this.Dynamo = new DynamoDB({region});
    this.S3Provider = new S3Provider(region);
    this.DynamoDBProvider = new DynamoDBProvider(region);
    this.Iam = new IAM({ region });
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

  async listIAMRoles(): Promise<IAM.ListRolesResponse> {
    return new Promise( async (resolve, reject) => {
      try {
        this.Iam.listRoles((err: AWSError, data: IAM.ListRolesResponse) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        })
      } catch (e) {
        reject(e);
      }
    });
  }

  async listIAMRolePolicies(RoleName: string): Promise<IAM.ListRolePoliciesResponse> {
    return new Promise( async (resolve, reject) => {
      try {
        this.Iam.listRolePolicies({ RoleName }, (err: AWSError, data: IAM.ListRolePoliciesResponse) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        })
      } catch (e) {
        reject(e);
      }
    });
  }

  async getIAMRolePolicy(PolicyName: string, RoleName: string): Promise<IAM.GetRolePolicyResponse> {
    return new Promise( async (resolve, reject) => {
      try {
        this.Iam.getRolePolicy({ PolicyName, RoleName }, (err: AWSError, data: IAM.GetRolePolicyResponse) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        })
      } catch (e) {
        reject(e);
      }
    });
  }

}

class S3Provider {
  
  readonly client: S3Client;

  constructor(region: string) {
    this.client = new S3Client({ region });
  }

  async getS3Object(key: string, bucket: string): Promise<GetObjectCommandOutput> {
    return new Promise( async (resolve, reject) => {
      try {
        const input: GetObjectCommandInput = {
          Key: key,
          Bucket: bucket
        };
        const command = new GetObjectCommand(input);
        const output = await this.client.send(command);
        resolve(output);
      } catch (error) {
        console.error("S3Provider.GetS3Object ==> ", error);
        reject(error);
      }
    });
  }

  async putS3Object(key: string, bucket: string, body: any): Promise<PutObjectCommandOutput> {
    return new Promise( async (resolve, reject) => {
      try {
        const input: PutObjectCommandInput = {
          Key: key, 
          Bucket: bucket,
          Body: Buffer.from(JSON.stringify(body))
        }
        const command = new PutObjectCommand(input);
        const output = await this.client.send(command);
        resolve(output);
      } catch (error) {
        console.error("S3Provider.PutS3Object ==> ", error);
        reject(error);
      }
    });
  }

  async getS3ObjectOutputBodyToString(output: GetObjectCommandOutput): Promise<string> {
    return new Promise( async (resolve, reject) => {
      try {
        const str = await output.Body.transformToString("utf-8");
        resolve(str);
      } catch (error) {
        console.error("S3Provider.GetObjectOutputBodytoString ==> ", error);
        reject(error);
      }
    });
  }
}

  class DynamoDBProvider {
    readonly client: DynamoDBClient;
  
    constructor(region: string) {
      this.client = new DynamoDBClient({ region }); 
    }
  
    async count(tableName: string): Promise<number> {
      return new Promise(async (resolve, reject) => {
        try {
          const command = new ScanCommand({
            TableName: tableName,
            Select: "COUNT"
          });
          const output: ScanCommandOutput = await this.client.send(command);
          resolve(output.Count || 0);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
    }
  
    async query(input: QueryCommandInput): Promise<QueryCommandOutput> {
      return new Promise( async (resolve, reject) => {
        try {
          const command = new QueryCommand(input);
          const result = await this.client.send(command);
          resolve(result);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
    }
  
    async batchWriteItems(input: BatchWriteItemCommandInput): Promise<BatchWriteItemCommandOutput> {
      return new Promise( async (resolve, reject) => {
        try {
          const command = new BatchWriteItemCommand(input);
          const output: BatchWriteItemCommandOutput = await this.client.send(command);
          resolve(output);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
    }

    async batchGetItems(input: BatchGetItemCommandInput): Promise<BatchGetItemCommandOutput> {
      return new Promise( async (resolve, reject) => {
        try {
          const command = new BatchGetItemCommand(input);
          const output: BatchGetItemCommandOutput = await this.client.send(command);
          resolve(output);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
    }
  
    async putItem(input: PutItemCommandInput): Promise<PutItemCommandOutput> {
      return new Promise( async (resolve, reject) => {
        try {
          const command = new PutItemCommand(input);
          const output = await this.client.send(command);
          resolve(output);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
    }

    async getItem(input: GetItemCommandInput): Promise<GetItemCommandOutput> {
      return new Promise( async (resolve, reject) => {
        try {
          const command = new GetItemCommand(input);
          const output = await this.client.send(command);
          resolve(output);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
    }
  
    async deleteItem(query: DeleteItemCommandInput): Promise<DeleteItemCommandOutput> {
      return new Promise( async (resolve, reject) => {
        try {
          const command = new DeleteItemCommand(query);
          const output = await this.client.send(command);
          resolve(output);
        } catch (error) {
          console.error(error);
          reject(error);
        }
      });
    }
  
  }