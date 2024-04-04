import * as async from "async";
import * as fs from "fs";
import { BaseDataService } from "..";
import { ArrayHelper } from "../../helpers";
import { ProgressBar } from "../../utils";

interface DDBProject {
  "Item": {
    "UserId": {
      "N": string
    },
    "ProjectGuid": {
      "S": string
    },
    "ErrorCount": {
      "S": string
    },
    "PageCount": {
      "S": string
    },
    "CoverData": {
      "S": string
    },
    "Spreads": {
      "S": string[]
    },
    "Data": {
      "S": string
    },
    "UserEmail": {
      "S": string
    },
    "DateUpdated": {
      "S": string
    },
    "ProjectStatus": {
      "S": string
    },
    "WasAnonymousProject": {
      "S": string
    }
  }
}

interface DDBCoverData {
  "Guid": string,
  "SpreadType": string, 
  "Layout": {
    "Name": string,
    "AssetCount": number,
    "LayoutType": string,
    "LayoutGUID": string,
    "BackgroundImageUrl": string,
    "ImagePlaceholders": {
      "Top":number,
      "Left":number,
      "Width":number,
      "Height":number,
      "Circle":boolean,
      "Bleed":string
    }[],
    "TextPlaceholders": {
      "Top":number,
      "FontSizes":number[],
      "Left":number,
      "Width":number,
      "Height":number,
      "HorizontalAlignment":string,
      "VerticalAlignment":string,
      "FontSize":number,
      "FontStyles": string[],
      "LineHeight":number,
      "Kerning":number,
      "MirrorHorizontalAlignment":boolean,
      "DefaultText":string
    }[],
  },
  "CoverBackgroundUrl": string,
  "CoverOpenBackgroundUrl": string,
  "UpdatedTimestamp": number,
  "HideText":boolean,
  "HideCenterAlert": boolean
}

interface DDBData {
  "Guid":string,
  "Title":string,
  "ThemeId":string,
  "ProductId":number,
  "DateCreated":string,
  "DateUpdated":number,
  "ProjectSections":{"Name":string}[],
  "ProjectOptions":{"OptionGroupName":string,"OptionValue":string}[],
  "FontName":string,
  "Milestone"?: string
} 

interface SQLProject {
  Guid: string,
  UserId: string,
  ProductId: string,
  ThemeId: string,
  ProjectStatus: string,
  PageCount: string,
  Cover: string,
  PaperStock: string,
  Box: string,
  UvPrint: string,
  ErrorCount: string,
  CoverLayout: string,
  Milestone: string,
  WasAnonymous: number,
}

export class ProjectSyncService extends BaseDataService {

  private currentFileNumber = 0;
  private missingUserGuid = [];
  private directories: { [directory: string]: string } = {
    "root": `${process.cwd()}/data/ddb-export/`,
    "exports": `${process.cwd()}/data/ddb-export/exports/`,
    "sql": `${process.cwd()}/data/ddb-export/sql/`,
    "search": `${process.cwd()}/data/ddb-export/search/`,
    "items": `${process.cwd()}/data/ddb-export/items/`,
    "report": `${process.cwd()}/data/ddb-export/report/`,
    "sanitized": `${process.cwd()}/data/ddb-export/sanitized/`,
  }

  constructor(){ super(); }

  public async run(): Promise<void> {
    // // Data Collection and sanitation from DynamoExport files
    await this.extractProjectDataFromDynamoDB();
    // // Data Collection and organization from SQL
    await this._spreadDataForSearch();
    // await this.extractProjectDataFromSQL();
    // Compare the two datasets
    await this.reportMissingProjectInSQlFromDynamo();
    // Insert the reported missing data in SQL 
    await this.insertMissingDataToSQLInBulk();
  }

  public analytics(): Promise<void> {
    const missingProjectsSTR = fs.readFileSync(`${this.directories["report"]}missing-anonymous-project-list.json`, { encoding: "utf-8" });
    const missingProjects: SQLProject[] = JSON.parse(missingProjectsSTR);
    console.log("Missing Projects =>  ", missingProjects.length);
    return;
  }

  public async extractProjectDataFromDynamoDB(): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        await this._chunkJsons();
        await this._transformProjectDynamoDataToSqlSchema();
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  public async extractProjectDataFromSQL(): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        await this._sql.connect();
        this.currentFileNumber = 0;
        const table = "[MilkBooksAPI].[dbo].[EditorProject]";
        const totalItems = await this._getItemCount(table);
        let requestedItems = 0;
        let lastId = 0;
        do {
          const query = `SELECT TOP(1000) * FROM ${table} WHERE Id > ${lastId}`
          const results = await this._sql.query(query);
          fs.writeFileSync(`${this.directories["sql"]}${this.currentFileNumber}.json`, JSON.stringify(results));
          this.currentFileNumber++;
          lastId = results[results.length-1]["Id"];
          requestedItems += results.length;
          console.log({lastId, requestedItems, totalItems})
        }
        while (requestedItems < totalItems)
        await this._sql.disconnect();
        // Chunk data set in files per UserId to fasten the search later on
        await this._spreadDataForSearch();
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  public async reportMissingProjectInSQlFromDynamo(): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const reportGuidPath = `${this.directories["report"]}missing-anonymous-project-list.json`;
        // const reportUserPath = `${process.cwd()}${this.jsonBackupDir}report/missing-user-list.json`;
        const list: SQLProject[] = await this._getProjectsFromTransformedDynamoDB(); 
        const progressBar = new ProgressBar(list.length);
        const missingGuids = [];
        async.eachLimit(list, 10, async (item) => {
          const found = fs.existsSync(`${this.directories["search"]}${item.Guid.toLowerCase()}.json`)//await this._searchInFile(item.Guid, `search/${item.Guid}.json`);
          if (!found) {
            if (missingGuids.find(x => x.Guid === item.Guid) == undefined) {
              missingGuids.push(item);
            }
          }
          progressBar.progress(1);
        }, (err) => {
          if (err) {
            return reject(err);
          }
          fs.writeFileSync(reportGuidPath, JSON.stringify(missingGuids));
          console.log("Found %s missing projects", missingGuids.length);
          // fs.writeFileSync(reportUserPath, JSON.stringify(this.missingUserGuid));
          // console.log("Found %s missing users", this.missingUserGuid.length);
          
          return resolve();
        });
        
      } catch(err) {
        reject(err);
      }
    });
  }

  public async insertMissingDataToSQLInBulk(): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const missingProjectsSTR = fs.readFileSync(`${this.directories["report"]}missing-anonymous-project-list.json`, { encoding: "utf-8" });
        const missingProjects: SQLProject[] = JSON.parse(missingProjectsSTR);

        const progressBar = new ProgressBar(missingProjects.length);
        await this._sql.connect();
        const batches = ArrayHelper.getBatchesFromArray(missingProjects, 1000);
        const columns = Object.keys(missingProjects[0]).join(",");
        for (const batch of batches) {
          let query = `INSERT INTO [MilkBooksAPI].[dbo].[EditorProject] (${columns}) VALUES `;
          for (const [index, project] of batch.entries()) {
            const values = Object.values(project).map(value => {
              if (typeof value === "string") {
                return `'${value}'`;
              }
              return value;
            }).join(",");
            query += `(${values})`;
            if (index < batch.length-1) {
              query += ', ';
            }
          }
          await this._sql.query(query);
          progressBar.progress(batch.length);
          await new Promise( resolve => setTimeout(resolve, 1000));
        }

        // GENERATE CSV
        // this._generateCsvFromDataSet(missingProjects, `${process.cwd()}${this.jsonBackupDir}report/missing-entries.csv`);
        
        // BULK INSERT
        // await this._sql.connect();
        // const query = `
        //   BEGIN TRY
        //     BEGIN TRANSACTION;

            // BULK INSERT [MilkBooksAPI].[dbo].[EditorProject]
            // FROM '${process.cwd()}${this.jsonBackupDir}report/missing-entries.csv'
            // WITH (
            //   FIELDTERMINATOR = ',',
            //   ROWTERMINATOR = '0x0A',
            //   FIRSTROW = 2,
            //   ERRORFILE = '${process.cwd()}${this.jsonBackupDir}report/transaction-error.log',
            //   BATCHSIZE = 1000,
            //   TABLOCK
            // );

        //     COMMIT;
        //   END TRY
        //   BEGIN CATCH
        //     IF @@TRANCOUNT > 0
        //       ROLLBACK TRANSACTION;
        //     PRINT ERROR_MESSAGE();
        //   END CATCH;
        // `;
        // await this._sql.query(query);

        await this._sql.disconnect();
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _getProjectsFromTransformedDynamoDB(): Promise<SQLProject[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const projects: SQLProject[] = [];
        const filePaths = fs.readdirSync(`${this.directories["items"]}`, {encoding: "utf-8"});
        if (filePaths.length > 0) {
          for (const filePath of filePaths) {
            const jsonStr = fs.readFileSync(`${this.directories["items"]}${filePath}`, {encoding: "utf-8"});
            const SQLProject: SQLProject[] = JSON.parse(jsonStr);
            SQLProject.forEach( x => {
              projects.push(x);
            });
          }
        }
        resolve(projects);
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _searchInDirectory(value: any, targetFolder: string, verbose: boolean = false): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let hasFoundValue = false;
        let filePaths = fs.readdirSync(`${this.directories["root"]}${targetFolder}`, {encoding: "utf-8"});
        if (filePaths.length === 0) {
          console.log("No file found in %s", targetFolder);
          return resolve(false);
        }
        for(const filePath of filePaths) {

          hasFoundValue = await this._searchInFile(value, `${targetFolder}${filePath}`);
          if (hasFoundValue) {
            if (verbose) {
              console.log("Found in %s", filePath);
            }
            break;
          }
        }
        resolve(hasFoundValue);
      } catch(err) {
        reject(err);
      }
    }); 
  }

  private async _searchInFile(value: string, filePath: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!fs.existsSync(`${this.directories["root"]}${filePath}`)) {
          const file = filePath.split("/").pop();
          const userId = file.split(".").shift();
          if (!this.missingUserGuid.includes(userId)) {
            this.missingUserGuid.push(userId);
          }
          return resolve(false);
        }
        let hasFoundValue = false;
        let lastChunk: string = ""; // ensure data to not be cut off between chunks
        const stream = fs.createReadStream(`${this.directories["root"]}${filePath}`, {encoding: "utf-8"});
        stream.on("error", (err) => {
          reject(err);
        })
        stream.on("close", () => {
          resolve(hasFoundValue);
        });
        stream.on("end", () => {
          resolve(hasFoundValue);
        });
        stream.on("readable", () => {
          let chunk: string;
          do {
            const chunkedData = lastChunk + chunk;
            if (chunkedData.toLowerCase().match(value.toLowerCase()))  {
              hasFoundValue = true;
              console.log("Found in %s", filePath);
              stream.destroy();
              break;
            }
            if (chunk) {
              lastChunk = chunk;
            }
          }
          while ((chunk = stream.read()) !== null);
        })
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _getItemCount(tableName: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const query = `
          SELECT COUNT(*) AS TotalItems FROM ${tableName} 
        `;
        const result = await this._sql.query(query);
        resolve(result[0]["TotalItems"]);
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _transformProjectDynamoDataToSqlSchema(): Promise<void> {
    this.currentFileNumber = 0;
    let totalItems = 0;
    let items: SQLProject[] = [];
    let paths = fs.readdirSync(`${this.directories["sanitized"]}`, { encoding: "utf8" });
    for(const path of paths) {
      try {
        const jsonStr = fs.readFileSync(`${this.directories["sanitized"]}${path}`, { encoding: "utf-8" });
        const jsons: DDBProject[] = JSON.parse(jsonStr);
        for(const json of jsons) {
          try {

            if (
              !json.Item.Data || 
              !json.Item.Data.S || 
              json.Item.Data.S == '' || 
              json.Item.Data.S == ' ' || 
              json.Item.Data.S == '{}' ||
              !json.Item.CoverData ||
              !json.Item.ProjectStatus ||
              !json.Item.PageCount ||
              !json.Item.ErrorCount || isNaN(parseInt(json.Item.ErrorCount.S))
            ) {
              continue;
            }
            const data: DDBData = JSON.parse(json.Item.Data.S);
            const coverData: DDBCoverData = JSON.parse(json.Item.CoverData.S)
            if (json.Item.UserEmail == undefined || json.Item.UserEmail.S == undefined || json.Item.UserEmail.S != "") {
              continue; // Skipping Anonymous projects
            }

            const Guid = json.Item.ProjectGuid.S;
            const UserId = json.Item.UserId.N;
            const ProductId = data.ProductId.toString();
            const ThemeId = data.ThemeId;
            const ProjectStatus = json.Item.ProjectStatus.S;
            const PageCount = json.Item.PageCount?.S || undefined;
            const Cover = data.ProjectOptions.find(x => x.OptionGroupName === "CoverFabric")?.OptionValue || 'NULL';
            const PaperStock = data.ProjectOptions.find(x => x.OptionGroupName === "InternalsPaperStock")?.OptionValue || 'NULL';
            const Box = data.ProjectOptions.find(x => x.OptionGroupName === "PresentationBoxCover")?.OptionValue || 'NULL';
            const UvPrint = data.ProjectOptions.find(x => x.OptionGroupName === "OptionGroupName")?.OptionValue || 'NULL';
            const ErrorCount = json.Item.ErrorCount?.S || 'NULL';
            const CoverLayout = coverData?.Layout?.Name || 'NULL';
            const Milestone = data.Milestone || 'NULL';
            const WasAnonymous = parseInt(json.Item.WasAnonymousProject?.S) || 0;
            items.push({
              Guid,
              UserId,
              ProductId,
              ThemeId,
              ProjectStatus,
              PageCount,
              Cover,
              PaperStock,
              Box,
              UvPrint,
              ErrorCount,
              CoverLayout,
              Milestone,
              WasAnonymous,
            });
            totalItems++;
            if (items.length >= 5000) {
              fs.writeFileSync(`${this.directories["items"]}${this.currentFileNumber}.json`, JSON.stringify(items));
              items = [];
              this.currentFileNumber++;
            }

          } catch(err) {
            console.log(json);
            console.error(err);
          }
        }
      } catch(err) {
        console.error(path);
        console.error(err)
      }
      }
    fs.writeFileSync(`${this.directories["items"]}${this.currentFileNumber}.json`, JSON.stringify(items));
    console.log(totalItems);
  }

  private async _chunkJsons(): Promise<void> {
    const paths = fs.readdirSync(`${this.directories["exports"]}`, { encoding: "utf8" });
    for(const path of paths) {
      await this._transformDynamoDBExportDataToJSON(path);
    }
  }

  private async _transformDynamoDBExportDataToJSON(path: string): Promise<void> {
    return new Promise( async (resolve, reject) => {
      let data = "";
      let lines = [];

      console.log("Reading %s",`${this.directories["root"]}${path}`)
      const stream = fs.createReadStream(`${this.directories["root"]}${path}`, { encoding: "utf-8" });

      stream.on("error", (err) => {
        return reject(err);
      })
      stream.on("end", () => {
        return resolve() 
      });

      stream.on("data", (chunk: string) => {
        data += chunk;
        const matches = data.match(/\n/gm);
        const hasBreakline: boolean = matches != undefined && matches.length > 0;
        if (hasBreakline) {
          const chunkLines = data.split(/\n/gm);
          const remainingData = chunkLines.pop();
          if (lines.length > 5000) {
            fs.writeFileSync(`${this.directories["sanitized"]}${this.currentFileNumber}.json`, "[" + lines.join(",") + "]");
            console.log(`${this.currentFileNumber}.json`);
            lines = [];
            this.currentFileNumber++;
          } 
          lines= [...lines, ...chunkLines];
          data = remainingData;
        }
      });
    })

  }

  private async _spreadDataForSearch(): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const filePaths = fs.readdirSync(`${this.directories["sql"]}`, { encoding: "utf-8" });
        if (filePaths.length == 0){
          console.log("Directory %s is empty", this.directories["sql"]);
          return resolve();
        }
        const progressBar = new ProgressBar(filePaths.length);
        for(const path of filePaths) {
          const fileStr = fs.readFileSync(`${this.directories["sql"]}${path}`, { encoding: "utf-8" });
          const sqlProjects: SQLProject[] = JSON.parse(fileStr);
          for(const project of sqlProjects) {
            const guid = project.Guid;
            const userPath = `${this.directories["search"]}${guid.toLowerCase()}.json`;
            fs.writeFileSync(userPath, JSON.stringify(guid));
          }
          progressBar.progress(1)
        }
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  private _generateCsvFromDataSet(dataSet: any[], csvPath: string): void {
    if (dataSet.length === 0) {
      return;
    }

    let csvString = 'Id,';
    const columns = Object.keys(dataSet[0]).join(",");
    csvString += columns + "\n";
    for (const [index, item] of dataSet.entries()) {
      const row = " ," + Object.values(item).join(',');
      csvString += row;
      if (index !== dataSet.length-1) {
        csvString += '\n';
      }
    }
    fs.writeFileSync(csvPath, csvString);
  }

}