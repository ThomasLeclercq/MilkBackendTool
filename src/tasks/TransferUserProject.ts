import { BatchGetItemCommandInput, BatchGetItemCommandOutput, GetItemCommandOutput, PutItemCommandOutput } from "@aws-sdk/client-dynamodb";
import { BaseTask } from ".";
import { TaskCommand } from "../models";
import { AwsProvider } from "../providers";

export class TransferUserProjectTask extends BaseTask {

  private readonly aws: AwsProvider;

  constructor() {
    super("Transfer User project", "TransferUserProject");
    this.aws = new AwsProvider(process.env.AWSREGION);

  }

  async run(): Promise<void> {
    try {
      const oldUserId = await this.reply("Please enter source userId:");
      const newUserId = await this.reply("Please enter destination userId:");
      const projectGuid = await this.reply("Please enter the project guid you wish to transfer:");
      if (oldUserId && newUserId && projectGuid && oldUserId != "" && newUserId != "" && projectGuid != "") {
        const projectData: GetItemCommandOutput = await this.getProjectData(projectGuid, oldUserId);
        // TODO update projectGuid with new userid
        const spreadsGuids: string[] = JSON.parse(projectData.Item["Spreads"].S);
        const spreadsData: BatchGetItemCommandOutput = await this.getSpreadsData(projectGuid, spreadsGuids);
        for (const spreadData of spreadsData.Responses["Spread"]) {
          const updatedData = spreadData["Data"].S.replace(oldUserId, newUserId);
          await this.updateSpreadData(spreadData["ProjectGuid"].S, spreadData["SpreadGuid"].S, updatedData);
        }
      }
      process.exit(0);
    } catch(err) {
      console.error(err);
      process.exit(1);
    }
  }

  async getProjectData(projectGuid: string, userId: string): Promise<GetItemCommandOutput> {
    console.log("Getting Project Data...");
    return this.aws.DynamoDBProvider.getItem({
      TableName: "Project",
      Key: {
        "UserId": { N: userId },
        "ProjectGuid": { S: projectGuid }
      }
    });
  }

  async getSpreadsData(projectGuid: string, spreadsGuids: string[]): Promise<BatchGetItemCommandOutput> {
    console.log("Getting Spread Data...");
    const getRequests = spreadsGuids.map( x => ({
      "ProjectGuid": { S: projectGuid },
      "SpreadGuid": { S: x }
    }));

    const batchGetItemCommandInput: BatchGetItemCommandInput = {
      RequestItems: {
        ["Spread"]: { Keys: getRequests }
      }
    }
    return this.aws.DynamoDBProvider.batchGetItems(batchGetItemCommandInput);
  }

  async updateSpreadData(projectGuid: string, spreadGuid: string, data: string): Promise<PutItemCommandOutput> {
    console.log("Updating Spread Data...", spreadGuid);
    return this.aws.DynamoDBProvider.putItem({
      TableName: "Spread",
      Item: {
        "ProjectGuid": { S: projectGuid },
        "SpreadGuid": { S: spreadGuid },
        "Data": { S: data }
      }
    });
  }

}