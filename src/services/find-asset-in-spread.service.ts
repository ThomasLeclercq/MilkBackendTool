import { AttributeValue } from "@aws-sdk/client-dynamodb";
import { ArrayHelper } from "../helpers";
import { AwsProvider } from "../providers";

export class FindAssetInSpread {
  
  private readonly _aws: AwsProvider;
  
  constructor() {
    this._aws
  }

  async getSpreadGuidThatContainsAssetGuid(projectGuid: string, userId: number, assetGuid: string): Promise<{SpreadGuid: string, Page: string}> {
    return new Promise( async (resolve, reject) => {
      try {
        let spreadGuid = "";
        const projectData = await this._getProjectData(projectGuid, userId);
        const spreadGuids = JSON.parse(projectData["Spreads"].S);
        const spreadData = await this._getSpreadData(projectGuid, spreadGuids);

        for (const spread of spreadData) {
          const data = JSON.parse(spread["Data"].S);
          const spreadMatch = data.Layout.ImagePlaceholders.filter( x => x.Asset !== undefined).find( x => x.Asset.Guid === assetGuid);
          if (spreadMatch) {
            spreadGuid = spread["SpreadGuid"].S;
          }
        }
        const page = this.getSpreadPage(projectData, spreadGuid);
        resolve({ SpreadGuid: spreadGuid, Page: page });
      } catch(err) {
        reject(err);
      }
    });
  }

  getSpreadPage(projectData: Record<string, AttributeValue>, spreadGuid: string): string {
    const spreadGuids = JSON.parse(projectData["Spreads"].S);
    let index = spreadGuids.indexOf(spreadGuid);

    const data = JSON.parse(projectData["Data"].S);
    const hasPresentationBox = data.ProjectSections.find(x => x.Name === 'Presentation Box') !== undefined;
    if (index === 0) {
      return hasPresentationBox ? "Presentation Box" : "Cover";
    }
    if (index === spreadGuids.length) {
      return `Page ${projectData["PageCount"].S}`;
    }
    if (hasPresentationBox) { 
      index--; // box excluded
    } 
    index--; // cover excluded
    const left = (2 * index) + '';
    const right = (2 * index  + 1) + '';
    if (index === 0) {
      return `Page 1`;
    }
    return `Page ${left}-${right}`;
  }

  private async _getProjectData(projectGuid: string, userId: number): Promise<Record<string, AttributeValue>> {
    return new Promise( async (resolve, reject) => {
      try {
        const output = await this._aws.DynamoDBProvider.query({
          TableName: "Project",
          ExpressionAttributeNames: {
            "#userId": "UserId",
            "#projectGuid": "ProjectGuid"
          },
          ExpressionAttributeValues: {
            ":userId": { N: userId.toString() },
            ":projectGuid": { S: projectGuid.toString() },
          },
          KeyConditionExpression: "#userId = :userId AND #projectGuid = :projectGuid" 
        });
        if (output && output.Items.length > 0) {
          return resolve(output.Items[0]);
        }
        resolve(undefined);
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _getSpreadData(projectGuid: string, spreadGuids: string[]): Promise<Record<string, AttributeValue>[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const batches = ArrayHelper.getBatchesFromArray(spreadGuids, 100)
        let spreadData: Record<string, AttributeValue>[] = [];
        for (const batch of batches) {
          const spreadDataOutput = await this._aws.DynamoDBProvider.batchGetItems({
            RequestItems: {
              ["Spread"]: { 
                Keys: batch.map( x => ({
                  "ProjectGuid": { S: projectGuid },
                  "SpreadGuid": { S: x }
                }))
              }
            }
          });
          if (spreadDataOutput && spreadDataOutput.Responses) {
            spreadData = [...spreadData, ...spreadDataOutput.Responses["Spread"]];
          }
        }
        resolve(spreadData);
      } catch(err) {
        reject(err);
      }
    });
  }

}