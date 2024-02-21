import { BaseDataService } from ".";

export interface DynamoProjectAssetSyncEntry { ProjectGuid: { S: string }, AssetGuid: { S: string } };
export interface Asset { Guid: string, Folder: string, OriginalFileName: string, ProjectGuid: string };

export class ArchiveAssetService extends BaseDataService {

  constructor(
    private readonly _apiDatabase = process.env.API_DATABASE,
  ) {
    super();
  }

  public async sendUsersToAssetArchiveRMQ(): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const eventDataList = await this._listUserIdsWithPrintedProject();
        console.log("Found %s results", eventDataList.length);
        await this._publisUserIdsToAssetArchiveQueue(eventDataList);
        resolve();
      } catch(err) {
        reject(err);
      }
    })
  }

  private async _listUserIdsWithPrintedProject(): Promise<{ UserId: number, Folder: string }[]> {
    return new Promise( async (resolve, reject) => {
      try {
        await this._sql.connect();
        const activeProjectQuery = `
          SELECT P.UserId, MAX(P.LastSavedDateUtc) AS LastSavedDateUtc
          FROM [${this._apiDatabase}].[dbo].[Project] as P
          INNER JOIN [${this._apiDatabase}].[dbo].[EditorProject] EP ON EP.Guid = P.Guid 
          WHERE EP.ProjectStatus = 4
          AND P.ApplicationId = 147298
          GROUP BY P.UserId
          ORDER BY LastSavedDateUtc ASC
        `;
        const result = await this._sql.query(activeProjectQuery);
        await this._sql.disconnect();
        const users = result.map(x => ({
          UserId: x["UserId"],
          Folder: this._convertDateStringToFolder(x["LastSavedDateUtc"])
        }));
        resolve(users);
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _publisUserIdsToAssetArchiveQueue(eventDataList: {UserId: number, Folder: string}[]): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const messages: string[] = [];
        for(const EventData of eventDataList) {
          const msg = {
            message: {
              Subject: "AssetArchive",
              EventData,
            },
            messageType: ["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]
          }
          messages.push(JSON.stringify(msg));
        }
        this._rmq.publish(messages, "design_studio_asset_archive")
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  private _convertDateStringToFolder(dateUTC: Date): string {
    return `${dateUTC.getUTCMonth()+1}.${dateUTC.getUTCFullYear()}`;
  }

}