import { AttributeValue, BatchWriteItemCommandInput } from "@aws-sdk/client-dynamodb";
import { ArrayHelper, FileHelper } from "../helpers";
import { AwsProvider, SqlProvider } from "../providers";
import async from "async";

export interface Asset {
  Guid: string;
  Folder: string;
  OriginalFileName: string;
  ProjectGuid: string;
  UserId: string;
}

export class AssetDeletedReportService {
  
  private readonly _aws: AwsProvider;
  private readonly _sql: SqlProvider;

  constructor() {
    this._aws = new AwsProvider(
      process.env.AWSREGION,
      process.env.S3_REGION,
      process.env.DYNAMO_REGION,
      process.env.LAMBDA_REGION,
    );
    this._sql = new SqlProvider(
      process.env.SQL_SERVER,
      process.env.SQL_DATABASE,
      process.env.SQL_USERNAME,
      process.env.SQL_PASSWORD,
    )
  }

  async collectData(
    //lastuserId: number
    userIds: number[]
  ): Promise<void> {
    let brokenProjects = 0;
    let browsedUsers = 0;
    const projectList = await this._fetchEditedProjects(userIds);
    let users = Object.keys(projectList);
    // if (lastUserId) {
    //   const lastIndex = users.indexOf(lastUserId);
    //   users = users.slice(lastIndex, users.length-1);
    // }
    console.log("Found %s Users possibly affected", users.length);
    for (const userId of users) {
      const projects = projectList[userId];
      console.log("Checking %s projects for user %s", projects.length, userId);
      for (const projectGuid of projects) {
        const assets = await this._fetchProjectAssets(projectGuid, userId);
        console.log("Project %s has %s assets", projectGuid, assets.length);
        const missingAssets = await this._getProjectMissingAsset(assets, projectGuid);
        if (missingAssets.length > 0) {
          brokenProjects += 1;
          const brokenReport = { UserId: userId, ProjectGuid: projectGuid, AssetMissingNumber: missingAssets.length, AssetMissing: missingAssets };
          FileHelper.storeFile(brokenReport, `${userId}-${projectGuid}.json`, ["report", "asset-broken"])
          console.log("");
          console.log("!!!! Broken Project found !!!!");
          console.log("--- UserId: %s", userId);
          console.log("--- ProejctGuid: %s", projectGuid);
          console.log("--- Assets Missing: %s", missingAssets.length);
          console.log("");
          console.log("Total Broken Projects: %s", brokenProjects);
          console.log("");
        }
      } 
      browsedUsers += 1
      console.log("Progress %s%", (browsedUsers / users.length * 100))
    }
  }

  async generateReport(): Promise<void> {
    const brokenProjects = FileHelper.readDir(["report", "asset-broken"]);
    console.log("Total Broken Projects: %s", brokenProjects.length);
    const users = [];
    const projects = [];
    let assetBrokenNumber: number[] = [];
    for (const brokenProjectFileName of brokenProjects) {
      const splitted = brokenProjectFileName.split("-");
      const userId = splitted.shift();
      const projectGuid = splitted.join("-").replace(".json", "");
      if (!users.includes(userId)) {
        users.push(userId);
      }
      projects.push({userId,projectGuid});
      const report = FileHelper.getFile(brokenProjectFileName, ["report", "asset-broken"]);
      const assetBrokenInt = parseInt(report.AssetMissingNumber);
      assetBrokenNumber.push(assetBrokenInt);
    }

    console.log("%s Users affected and %s projects", users.length, brokenProjects.length);
    const averageAssetPerProject = assetBrokenNumber.reduce( (prev: number, next: number) => (prev+next), 0) / assetBrokenNumber.length;
    const middle = Math.floor(assetBrokenNumber.length/2);
    assetBrokenNumber = assetBrokenNumber.sort( (a,b) => (a-b));
    const medianAssetPerProject = assetBrokenNumber.length % 2 ? assetBrokenNumber[middle] : (assetBrokenNumber[middle-1] + assetBrokenNumber[middle]) / 2;
    console.log("Assets/project - Average: %s - Median %s", averageAssetPerProject, medianAssetPerProject);
    const maxBroken = assetBrokenNumber.pop();
    console.log("Max damaged %s", maxBroken);

    const projectStatus = await this._getProjectsStatus(projects);
    const projectReport = {};
    for (const status of projectStatus) {
      if (!projectReport[status.ProjectStatus]) {
        projectReport[status.ProjectStatus] = { number: 0, guid: [] };
      }
      projectReport[status.ProjectStatus].number++;
      projectReport[status.ProjectStatus].guid.push(status.ProjectGuid);
    }
    console.log("Broken Project Status")
    console.log(projectReport);
    console.log("=====================")
  }

  async collectMissingAndAssignedData(status: "printed" | "ready-to-print" | "basket" | "in-progress"): Promise<void> {
    const brokenProjects = FileHelper.readDir(["report", status]);
    for (const brokenProjectFileName of brokenProjects) {
      await this._getProjectAssignedAssets(brokenProjectFileName, status);
    }
  }

  async collectAnonymousData(): Promise<void> {
    const brokenProjects = FileHelper.readDir(["report", "asset-broken"]);
    const userIds = brokenProjects.map( x => x.split("-").shift());
    const userTypes = await this._getUserType(userIds);
    console.log(userTypes);
    for (const fileName of brokenProjects) {
      const userId = fileName.split("-").shift();
      const status = userTypes.find(x => userId === x.UserId);
      const file = FileHelper.getFile(fileName, ["report", "asset-broken"]);
      if (!status.IsAnonymous) {
        FileHelper.storeFile(file, fileName, ["report", "in-progress"])
      } else {
        FileHelper.storeFile(file, fileName, ["report", "anonymous"])
      }
    }
  }

  getMissingImagesNames(directory: string): void {
    const brokenProjects = FileHelper.readDir(["report", directory]);
    for (const fileName of brokenProjects) {
      const file = FileHelper.getFile(fileName, ["report", directory]);
      const assignedAssets = file.AssignedAndMissing;
      FileHelper.storeFile(assignedAssets.map(x => x.OriginalFileName), fileName, ["report", "assets-names"]);
    }
  }

  async removeAssetsFromBrokenProjects(): Promise<void> {
    try {

      const statuses = ["ready-to-print", "in-progress"];
      for (const status of statuses) {
        const files = FileHelper.readDir(["report", status]);
        for (const fileName of files) {
          const file = FileHelper.getFile(fileName, ["report", status]);
          const splitted = fileName.split("-");
          const userId = splitted.shift();
          const projectGuid = splitted.join("-").replace(".json", "");
          if (file.AssignedAndMissingNumber <= 5) {
            console.log("%s - %s -> %s", status, fileName, file.AssignedAndMissingNumber)
  
            const spreadRecords = await this._getProjectSpreadData(projectGuid);
            FileHelper.storeFile(spreadRecords, fileName, ["report", "modified-projects", "backup", "spreads"]);
    
            const missingAssets = file.AssignedAndMissing;
    
            const spreadsToOveride = [];
            for (const record of spreadRecords) {
              const data = JSON.parse(record["Data"].S);
              let modified = false;
              for (const missingAsset of missingAssets) {
                const imagePlaceholder = data.Layout.ImagePlaceholders.find(x => (
                  x.Asset !== undefined && 
                  x.Asset.Guid === missingAsset.Guid &&
                  x.Asset.OriginalFileName === missingAsset.OriginalFileName
                ));
                if (imagePlaceholder) {
                  imagePlaceholder.Asset = undefined;
                  imagePlaceholder.ImageTransform = undefined;
                  modified = true;
                }
              }
              if (modified) {
                record["Data"].S = JSON.stringify(data);
                spreadsToOveride.push(record);
              }
            }
            console.log("Will Overide %s spreads", spreadsToOveride.length);
            FileHelper.storeFile(spreadsToOveride, fileName, ["report", "modified-projects", "updated", "spreads"]);
  
          }
          if (file.AssetMissingNumber > 0) {
            const toDelete = [];
            const assetRecords = await this._getProjectAssetRecords(projectGuid);
            FileHelper.storeFile(assetRecords, fileName, ["report", "modified-projects", "backup", "assets"]);
            for(const assetRecord of assetRecords) {
              const missing = file.AssetMissing.find(x => x.Guid === assetRecord["AssetGuid"].S);
              if(missing) {
                toDelete.push(assetRecord);
              }
            }
            FileHelper.storeFile(toDelete, fileName, ["report", "modified-projects", "deleted", "assets"]);
          }
        }
      }
    } catch(err) {
      throw err;
    }
  }

  async updateBrokenProjectsRecords(): Promise<void> {
    const filedRecordsToUpdate = FileHelper.readDir(["report", "modified-projects", "updated", "spreads"]);
    for (const toUpdate of filedRecordsToUpdate) {
      console.log(toUpdate)
      const updatedRecords = FileHelper.getFile(toUpdate, ["report", "modified-projects", "updated", "spreads"]);
      console.log("Will update %s spreads records", updatedRecords.length);
      await this._writeRecords("Spread", updatedRecords);
    }
    const fileRecordsToDelete = FileHelper.readDir(["report", "modified-projects", "deleted", "assets"]);
    for (const toDelete of fileRecordsToDelete) {
      console.log(toDelete)
      const deletedRecords = FileHelper.getFile(toDelete, ["report", "modified-projects", "deleted", "assets"]);
      console.log("Will delete %s assets records", deletedRecords.length);
      await this._deleteRecords("Asset", deletedRecords.map(x => {
        const copy = {...x};
        delete copy["Data"];
        return copy;
      }));
    }
  }

  async restoreBrokenProject(): Promise<void> {
    const filedRecordsToUpdate = FileHelper.readDir(["report", "modified-projects", "backup", "spreads"]);
    for (const restoreUpdated of filedRecordsToUpdate) {
      const updatedRecords = FileHelper.getFile(restoreUpdated, ["report", "modified-projects", "backup", "spreads"]);
      await this._writeRecords("Spread", updatedRecords);
    }
    const fileRecordsToDelete = FileHelper.readDir(["report", "modified-projects", "backup", "assets"]);
    for (const restoreDeleted of fileRecordsToDelete) {
      const deletedRecords = FileHelper.getFile(restoreDeleted, ["report", "modified-projects", "backup", "assets"]);
      await this._writeRecords("Asset", deletedRecords);
    }
  }

  private async _fetchEditedProjects(userIds: number[]): Promise<{ [userId: number]: string[] }> {
    // const query = `SELECT UserId, Guid FROM Project WHERE LastSavedDateUtc >= '${startTime}' AND LastSavedDateUtc < '${endTime}' AND ApplicationId = 147298 AND IsDeleted = 0 ORDER BY LastSavedDateUtc DESC`;
    // await this._sql.connect();
    // const results = await this._sql.query(query);
    // await this._sql.disconnect();
    // const userProjects: { [userId: number]: string[] } = {};
    // for (const row of results) {
    //   const userId = row["UserId"];
    //   const projectGuid = row["Guid"].toLowerCase();
    //   if (!userProjects[userId]) {
    //     userProjects[userId] = [];
    //   }
    //   if (!userProjects[userId].includes(projectGuid)) {
    //     userProjects[userId].push(projectGuid);
    //   }
    // }
    // return userProjects;
    return new Promise(async (resolve, reject) => {
      try {
        const batch: number[][] = ArrayHelper.getBatchesFromArray(userIds, 10);
        const output = await this._aws.DynamoDBProvider.batchGetItems({
          RequestItems: {
            ["Project"]: { 
              Keys: batch.map( x => ({
                "UserId": { N: x.toString() },
              }))
            }
          }
        });
        const userProjectMap = {};
        output.Responses["Project"].map(x => {
          if (!userProjectMap[x["UserId"].N]) {
            userProjectMap[x["UserId"].N] = [];
          }
          const project = userProjectMap[x["UserId"].N].find(x => x === x["ProjectGuid"].S);
          if(!project) {
            userProjectMap[x["UserId"].N].push(x["ProjectGuid"].S);
          }
        })
        resolve(userProjectMap);
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _fetchProjectAssets(projectGuid: string, userId: string): Promise<Asset[]> {
    const output = await this._aws.DynamoDBProvider.query({
      TableName: "Asset",
      ExpressionAttributeValues: {
        ":project_guid": { S: projectGuid },
      },
      KeyConditionExpression: "ProjectGuid = :project_guid",
    });
    const assets = output.Items.map(x => {
      const data = JSON.parse(x["Data"].S);
      return {
        Guid: x["AssetGuid"].S,
        Folder: data["Folder"],
        OriginalFileName: data["OriginalFileName"],
        ProjectGuid: projectGuid,
        UserId: userId
      }
    });
    return assets;
  }

  private async _getProjectAssetRecords(projectGuid: string): Promise<Record<string, AttributeValue>[]> {
    const output = await this._aws.DynamoDBProvider.query({
      TableName: "Asset",
      ExpressionAttributeValues: {
        ":project_guid": { S: projectGuid },
      },
      KeyConditionExpression: "ProjectGuid = :project_guid",
    });
    return output.Items;
  }

  // private async _getProjectMissingAsset(assets: Asset[]): Promise<any> {
  //   return new Promise( async (resolve, reject) => {
  //     let missingAssets = [];
  //     async.eachLimit(assets, 100, async (asset) => {
  //       try {
  //         await this._aws.S3Provider.headObject({ 
  //           "Bucket": "milkbooks-design",
  //           "Key": `library/${asset.UserId}/${asset.Folder}/original/${asset.Guid}.${asset.OriginalFileName}`
  //         })
  //       } catch(err) {
  //         missingAssets.push(asset);
  //       }
  //     }, err => {
  //       if (err) {
  //         reject(err)
  //       } else {
  //         resolve(missingAssets);
  //       }
  //     })
  //   })
  // }

  private async _getProjectMissingAsset(assets: Asset[], projectGuid: string): Promise<Asset[]> {
    return new Promise(async (resolve, reject) => {
      try {

        const output = await this._aws.DynamoDBProvider.query({
          TableName: "ProjectAssetSync",
          ExpressionAttributeValues: {
            ":project_guid": { S: projectGuid },
          },
          KeyConditionExpression: "ProjectGuid = :project_guid",
        });
        const unRemovedAssets = output.Items.map(x => {
          const data = JSON.parse(x["Data"].S);
          return {
            Guid: x["AssetGuid"].S,
            Folder: data["Folder"],
            OriginalFileName: data["OriginalFileName"],
            ProjectGuid: projectGuid,
            UserId: 0
          }
        });
        const missingAssets= [];
        for (const asset of assets) {
          const isInSync = unRemovedAssets.find(x => x.Guid === asset.Guid);
          if (!isInSync) {
            missingAssets.push(asset);
          }
        }
        resolve(assets);

      } catch(err) {
        reject(err);
      }
    });
  }

  private async _getProjectsStatus(projects: {userId: string, projectGuid: string}[]): Promise<{ ProjectGuid: string, UserId: string, ProjectStatus: string }[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const batches:{userId: string, projectGuid: string}[][] = ArrayHelper.getBatchesFromArray(projects, 10);
        const projectStatus: { ProjectGuid: string, UserId: string, ProjectStatus: string }[] = [];
        for (const batch of batches) {
          const output = await this._aws.DynamoDBProvider.batchGetItems({
            RequestItems: {
              ["Project"]: { 
                Keys: batch.map( x => ({
                  "UserId": { N: x.userId },
                  "ProjectGuid": { S: x.projectGuid },
                }))
              }
            }
          });
          if (output && output.Responses) {
            output.Responses["Project"].map( x => {
              const ProjectGuid = x["ProjectGuid"].S;
              const UserId = x["UserId"].N;
              const ProjectStatus = x["ProjectStatus"].S;
              projectStatus.push({ ProjectGuid, UserId, ProjectStatus })
            })
          }
        }
        resolve(projectStatus);
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _getUserType(userIds: string[]): Promise<{ UserId: string, IsAnonymous: boolean }[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const userTypes = [];
        const q = `SELECT Id, EmailAddress FROM [MilkBooksAPI].[dbo].[User] WHERE Id IN ('${userIds.join("', '")}')`;
        await this._sql.connect();
        const results = await this._sql.query(q);
        await this._sql.disconnect();
        for (const row of results) {
          if (!row["EmailAddress"]) {
            userTypes.push({ UserId: row["Id"], IsAnonymous: true });
          } else {
            userTypes.push({ UserId: row["Id"], IsAnonymous: false });
          }
        }
        resolve(userTypes)
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _getProjectAssignedAssets(fileName: string, status: "printed" | "ready-to-print" | "basket" | "in-progress"): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const splitted = fileName.split("-");
        const userId = splitted.shift();
        const projectGuid = splitted.join("-").replace(".json", ""); 
        const file = FileHelper.getFile(`${userId}-${projectGuid}.json`, ["report", status]);
        const assets = file.AssetMissing;
        const assignedAndMissing = [];
        const spreadRecords = await this._getProjectSpreadData(projectGuid);
        for (const spreadRecord of spreadRecords) {
          const data = JSON.parse(spreadRecord["Data"].S);
          const assignedAssets = data.Layout.ImagePlaceholders.filter( ip => ip.Asset !== undefined).map( ip => ip.Asset);
          for (const assignedAsset of assignedAssets) {
            const match = assets.find( a => a.Guid === assignedAsset.Guid && a.OriginalFileName === assignedAsset.OriginalFileName);
            if (match) {
              assignedAndMissing.push(assignedAsset);
            }
          }
        }
        file.AssignedAndMissing = assignedAndMissing;
        file.AssignedAndMissingNumber = assignedAndMissing.length;
        FileHelper.storeFile(file, fileName, ["report", status])
        console.log("%s - %s -> %s", status, fileName, assignedAndMissing.length)
        if (status === "in-progress") {
          if (assignedAndMissing.length <= 10) {
            FileHelper.storeFile(file, fileName, ["report", "in-progress-low-damage"])
          } else if (assignedAndMissing.length > 10 && assignedAndMissing.length <= 30) {
            FileHelper.storeFile(file, fileName, ["report", "in-progress-medium-damage"])
          } else {
            FileHelper.storeFile(file, fileName, ["report", "in-progress-heavy-damage"])
          }
        }
        resolve()
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _getProjectSpreadData(projectGuid: string): Promise<Record<string, AttributeValue>[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const output = await this._aws.DynamoDBProvider.query({
          TableName: 'Spread',
          ExpressionAttributeValues: {
            ":project_guid": { S: projectGuid },
          },
          KeyConditionExpression: "ProjectGuid = :project_guid",
        })
        if (output && output.Items.length > 0) {
          return resolve(output.Items);
        }
        resolve([]);
      } catch(err) {
        console.error(err);
        reject(err);
      }
    });
  }

  private async _deleteRecords(table: string, records: Record<string, AttributeValue>[]): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const batchDeleteQueries: Record<string, AttributeValue>[][] = ArrayHelper.getBatchesFromArray(records, 25);
        for (const batchQuery of batchDeleteQueries) {
          const batchDeleteQuery: BatchWriteItemCommandInput = {
            RequestItems: {
              [table]: batchQuery.map(x =>({ "DeleteRequest": { "Key": x } }))
            }
          }
          await this._aws.DynamoDBProvider.batchWriteItems(batchDeleteQuery);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  private async _writeRecords(table: string, records: Record<string, AttributeValue>[]): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const batchUpdateQueries: Record<string, AttributeValue>[][] = ArrayHelper.getBatchesFromArray(records, 25);
        for (const batchQuery of batchUpdateQueries) {
          const batchUpdateQuery: BatchWriteItemCommandInput = {
            RequestItems: {
              [table]: batchQuery.map(x =>({ "PutRequest": { "Item": x } }))
            }
          }
          await this._aws.DynamoDBProvider.batchWriteItems(batchUpdateQuery);
        }
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }


}
