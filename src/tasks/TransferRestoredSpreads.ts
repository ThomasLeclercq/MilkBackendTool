import { AttributeValue, BatchGetItemCommandInput, BatchGetItemCommandOutput, BatchWriteItemCommandInput, GetItemCommandOutput, PutItemCommandOutput, QueryCommandInput, QueryCommandOutput, WriteRequest } from "@aws-sdk/client-dynamodb";
import { BaseTask } from ".";
import { TaskCommand } from "../models";
import { AwsProvider, DynamoDBProvider } from "../providers";
import { ArrayHelper, FileHelper } from "../helpers";
import { AttributeMap, ItemList } from "aws-sdk/clients/dynamodb";

export class TransferRestoredSpreads extends BaseTask {

  private readonly awsProd: AwsProvider;
  private readonly awsDev: AwsProvider;

  constructor() {
    super("Transfer Restored Spreads", "TransferRestoredSpreads");
    this.awsProd = new AwsProvider(process.env.AWSREGION, process.env.S3_REGION, "us-east-1", process.env.LAMBDA_REGION);
    this.awsDev = new AwsProvider(process.env.AWSREGION, process.env.S3_REGION, "ap-southeast-2", process.env.LAMBDA_REGION);

  }

  async run(): Promise<void> {
    try {
      const projectGuid = '07da4b60-ded6-4e10-8a55-fd948f78b871';//await this.reply("Please enter the project guid you wish to transfer:");
      const copyProjectGuid = '3d790513-f5ce-4605-bbbd-b9866ec1bb9e'; //await this.reply("Please enter the copy of the project guid you wish to transfer the spread data:");
      if (projectGuid) {
        // Get Spreads Query from us-east-1 provider
        const originalSpreadData = await this.getSpreadDataForProject(this.awsProd.DynamoDBProvider, 'Spread', projectGuid);
        FileHelper.storeFile(originalSpreadData.Items, `${projectGuid}.json`);
        // Backup data
        // Get Spreads Query from sydney provider
        const restoredSpreadData = await this.getSpreadDataForProject(this.awsDev.DynamoDBProvider, 'spreads-recovery-13-10-2023-11h28', projectGuid);
        FileHelper.storeFile(restoredSpreadData.Items, `restored_${projectGuid}.json`);
        // BatchWriteRequest from provider1 data to provider2
        const transferData: Record<string, AttributeValue>[] = [];
        for (const data of restoredSpreadData.Items) {
          data["ProjectGuid"].S = copyProjectGuid;
          transferData.push(data);
        }
        await this.transferData(transferData, 'Spread', this.awsProd.DynamoDBProvider);
      }
      process.exit(0);
    } catch(err) {
      console.error(err);
      process.exit(1);
    }
  }

  async getSpreadDataForProject(dynamoDBProvider: DynamoDBProvider, tableName: string, projectGuid: string): Promise<QueryCommandOutput> {
    return new Promise( async (resolve, reject) => {
      try {
        const input: QueryCommandInput = {
          TableName: tableName,
          ExpressionAttributeNames: {
            "#project_guid": "ProjectGuid"
          },
          ExpressionAttributeValues: {
            ":project_guid": { S: projectGuid }
          },
          KeyConditionExpression: "#project_guid = :project_guid"
        }
        const output = await dynamoDBProvider.query(input);
        resolve(output);
      } catch(err) {
        reject(err);
      }
    });
  }

  async transferData(data: Record<string, AttributeValue>[], tableName: string, dynamoDBProvider: DynamoDBProvider): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const batches = ArrayHelper.getBatchesFromArray(data, 25);
        for (const batch of batches) {
          const input: BatchWriteItemCommandInput = {
            "RequestItems": { "Spread": batch.map( x => ({ "PutRequest": { "Item": x } })) }
          }
          await dynamoDBProvider.batchWriteItems(input);
        }
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }


}