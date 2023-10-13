// Fetch S3 object
// Update S3 object

import {
  BatchGetItemCommand, BatchGetItemCommandInput, BatchGetItemCommandOutput,
  BatchWriteItemCommand, BatchWriteItemCommandInput, BatchWriteItemCommandOutput,
  DeleteItemCommand, DeleteItemCommandInput, DeleteItemCommandOutput,
  DynamoDBClient,
  GetItemCommand, GetItemCommandInput, GetItemCommandOutput,
  PutItemCommand, PutItemCommandInput, PutItemCommandOutput,
  QueryCommand, QueryCommandInput, QueryCommandOutput, ScanCommand,
  ScanCommandOutput
} from "@aws-sdk/client-dynamodb";
import {
  InvokeCommand, InvokeCommandInput, InvokeCommandOutput,
  LambdaClient,
} from "@aws-sdk/client-lambda";
import {
  DeleteObjectsCommand, DeleteObjectsCommandInput, DeleteObjectsCommandOutput,
  GetObjectCommand, GetObjectCommandInput, GetObjectCommandOutput,
  PutObjectCommand, PutObjectCommandInput, PutObjectCommandOutput,
  S3Client
} from "@aws-sdk/client-s3";
import { AWSError, DynamoDB, IAM, S3 } from "aws-sdk";

export class AwsProvider {
  public S3Provider: S3Provider;
  public DynamoDBProvider: DynamoDBProvider;
  public LambdaProvider: LambdaProvider;
  private S3: S3;
  private Dynamo: DynamoDB;
  private Iam: IAM;

  constructor(awsRegion: string, s3Region: string, dynamoRegion: string, lambdaRegion: string) {
    if (!s3Region || s3Region === "") {
      throw new Error("S3 region is missing, please provide AWSREGION in .env file");
    } 
    this.S3 = new S3({ region: s3Region });
    this.Dynamo = new DynamoDB({region: dynamoRegion});
    this.S3Provider = new S3Provider(s3Region);
    this.DynamoDBProvider = new DynamoDBProvider(dynamoRegion);
    this.Iam = new IAM({ region: awsRegion });
    this.LambdaProvider = new LambdaProvider(lambdaRegion);
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

  async deleteMultipleS3Objects(input: DeleteObjectsCommandInput): Promise<DeleteObjectsCommandOutput> {
    return new Promise( async (resolve, reject) => {
      try {
        const command = new DeleteObjectsCommand(input);
        const output = await this.client.send(command);
        if (output.Errors && output.Errors.length > 0) {
          console.error(output.Errors);
          throw "Err while deleting multiple objects";
        } else {
          resolve(output);
        }
      } catch(err) {
        console.error("S3Provider.DeleteMultipleS3Objects ==> ", err);
        reject(err);
      }
    })
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

class LambdaProvider {
  readonly client: LambdaClient;
  constructor(region: string) {
    if (!region || region === '') {
      throw new Error("AWS_REGION is missing");
    }
    this.client = new LambdaClient({ region });
  }

  async invoke(input: InvokeCommandInput): Promise<InvokeCommandOutput> {
    return new Promise( async (resolve, reject) => {
      try {
        const command = new InvokeCommand(input);
        const output = await this.client.send(command);
        resolve(output);
      } catch(err) {
        reject(err);
      }
    });
  }
}