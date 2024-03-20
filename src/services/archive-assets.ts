import { ListObjectsCommandInput, ListObjectsV2CommandInput, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { BaseDataService } from ".";
import { DateHelper, FileHelper } from "../helpers";

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

  public async listEmptyUsers(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const list: string[] = [];
        const users: { [userId:string]: string[] } = {};
        let NextContinuationtoken;
        do {
          const listRequest: ListObjectsV2CommandInput = {
            Bucket: 'milkbooks-archive',
            Prefix: 'milk2/printed-projects/',
            ContinuationToken: NextContinuationtoken
          };
          const output = await this._aws.S3Provider.listS3Objects(listRequest);
          if (output) {
            output.Contents.forEach(x => {
              const segments = x.Key.split("/");
              const userId = segments[2];
              if (!users[userId]) {
                users[userId] = [];
              }
              if (!users[userId].includes(x.Key)) {
                users[userId].push(x.Key);
              }
            })
            NextContinuationtoken = output.NextContinuationToken;
          }
        } while (NextContinuationtoken);
        for(const userId of Object.keys(users)) {
          if(users[userId].length == 1) {
            list.push(userId)
          }
        }
        console.log("Found %s users", list.length);
        FileHelper.storeFile(list, 'missing.json', ["archive"]);
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  public async publishMissing(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const toPush: string[] = FileHelper.getFile("rmq-9.json", ["archive"]);
        await this._rmq.publish(toPush.map(x => JSON.stringify(x)), "design_studio_asset_archive");
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  public async publishChunks(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const filePaths = FileHelper.readDir(["asset-archive"]);
        for (const filePath of filePaths) {
          const toPush: string[] = FileHelper.getFile(filePath, ["asset-archive"]);
          await this._rmq.publish(toPush, "design_studio_asset_archive");
        }
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  public async publishChunk(chunkName: string, destinationQueue: string, start: number = 0, size: number = 100): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const toPush: string[] = FileHelper.getFile(chunkName, ["asset-archive"]);
        await this._rmq.publish(toPush, destinationQueue);
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  public async chunkAssetArchiveQueue(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this._extractRMQArchiveIntoChunks("design_studio_asset_archive", 38896);
      } catch(err) {
        reject(err);
      }
    });
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

  private async _listUserAssetPaths(userId: number): Promise<string[]> {
    return new Promise( async (resolve, reject) => {
      try {

        let assetPathList: string[] = [];
        let Continuationtoken: string;

        do {

          const listObjectCommandInput: ListObjectsCommandInput = {
            Bucket: process.env.ASSET_BUCKET,
            Prefix: `library/${userId}/`,
            Delimiter: '/original/',
          }
          const output = await this._aws.S3Provider.listS3Objects(listObjectCommandInput);

          if (output.Contents && output.Contents.length > 0) {
            const paths: string[] = output.Contents.map(x => x.Key);
            assetPathList = [...assetPathList, ...paths];
          }

          Continuationtoken = output.NextContinuationToken;

        } while(Continuationtoken !== undefined);

        resolve(assetPathList);

      } catch(err) {
        reject(err);
      }
    });
  }

  private _groupAssetPathsPerFolders(assetpathList: string[], maxFolder: string = undefined): {[folder: string]: string[]} 
  {
    let maxDate: Date; 
    if(maxFolder) {
      maxDate = this._transformFolderNameIntoDate(maxFolder);
    }
    const folders: { [folder: string]: string[] } = {};

    for (const path of assetpathList) {
      const folder = this._extractFolderFromAssetS3Path(path);
      if (maxDate) {
        const date = this._transformFolderNameIntoDate(folder);
        if (date.getTime() >= maxDate.getTime()) {
          continue;
        }
      }

      if (folders[folder] == undefined) {
        folders[folder] = [];
      }

      folders[folder].push(path);

    }
    return folders;
  }

  private _transformFolderNameIntoDate(folder: string): Date {
    const segments: string[] = folder.split(".");
    const month: number = parseInt(segments[0]);
    const year: number = parseInt(segments[1]);
    return new Date(year, month-1,0);
  }

  private _extractFolderFromAssetS3Path(path: string): string {
    const segments = path.split("/");
    const folder = segments[2];
    return folder;
  }

  private async _generatePersistenceJSON(folders: {[folder:string]: string[]} ): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const now = new Date();
        const persistenceFile = {
          "Assets": [],
          "Folders": [],
          "LastArchiveDate": `${DateHelper.getStringMonth(now.getMonth())} ${now.getDate()}.${now.getFullYear()}`
        }

        for ( const key of Object.keys(folders) ) {
          persistenceFile.Folders.push(key);
          persistenceFile.Folders = folders[key];
        }

        const uploadCommandInput: PutObjectCommandInput = {
          Bucket: process.env.ARCHIVE_BUCKET,
          Body: JSON.stringify(persistenceFile),
          Key: ''
        }

      } catch(error) {
        reject(error);
      }
    });
  }

  private async _extractRMQArchiveIntoChunks(queue: string, queueSize: number): Promise<void> {
    return new Promise( async (resolve, reject) => {
      if (!process.env.RABBIT_MQ_SERVER || process.env.RABBIT_MQ_SERVER == '') {
        return reject("RABBIT_MQ_SERVER variable is missing!")
      }
      try {
        let messages: string[] = [];
        let processedMessages = 38400;
        let chunkNumber = 25;
        do {

          const data: string[] = await this._rmq.receive(queue, 100, true);
          processedMessages += data.length;

          messages = [...messages, ...data];

          if(messages.length >= 1600) {
            FileHelper.storeFile(messages, `chunk-${chunkNumber}.json`, ["asset-archive"]);
            chunkNumber++;
            messages = [];
          }

        } while(processedMessages < queueSize);

        if(messages.length > 0) {
          FileHelper.storeFile(messages, `chunk-${chunkNumber}.json`, ["asset-archive"]);
          chunkNumber++;
          messages = [];
        }
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

}