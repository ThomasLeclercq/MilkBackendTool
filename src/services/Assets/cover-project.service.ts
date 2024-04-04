import { FileHelper } from "../../helpers";
import { AwsProvider, SqlProvider } from "../../providers";
import async from "async";
import fs from "fs";

export class GetProjectCoverService {
  constructor(private _aws: AwsProvider, private _sql: SqlProvider) {}

  async run(): Promise<void> {
    const startDate = '2023-10-15';
    const endDate = '2023-10-31';
    const userProjects = await this.fetchSQLProject(startDate, endDate);
    async.eachLimit(userProjects, 5, async (userProject) => {
      const projectCoverData = await this.fetchProjectCover(userProject.ProjectGuid, userProject.UserId);
      if (projectCoverData) {
        const image = projectCoverData.Layout.ImagePlaceholders[0]?.Asset;
        if (image) {
          try {
            await this.downloadFrontImage(userProject.ProjectGuid, image.Folder, image.OriginalFileName, userProject.UserId, image.Guid);
          } catch(err) {
            console.log("Asset deleted");
          }
        }
      }
    }, (err) => {
      if (err) {
        throw err;
      } else {
        console.log("done");
      }
    })
  }

  async fetchSQLProject(startDate: string, endDate: string): Promise<{UserId: string, ProjectGuid: string}[]> {
    await this._sql.connect();
    const query = `
      SELECT TOP (2000)
        p.[Guid] as ProjectGuid
        ,U.[Id] as UserId
        ,U.[EmailAddress]
        ,P.[LastSavedDateUtc]
      FROM [MilkBooksAPI].[dbo].[Project] P
      JOIN [MilkBooksAPI].[dbo].[User] U on U.Id = P.UserId 
      JOIN [MilkBooksAPI].[dbo].[EditorProject] EP ON P.Guid = EP.Guid
      JOIN [MilkBooksAPI].[dbo].[Product] Pr ON Pr.Id = P.ProductId
      WHERE 
      EP.Cover LIKE '%LinenIvory%'
      AND
      Pr.Name LIKE '%Large Landscape Photo Album%'
      AND
      P.LastSavedDateUtc >= Convert(datetime, '${startDate}')
      AND 
      p.[LastSavedDateUtc] <= Convert(datetime, '${endDate}') 
      ORDER BY P.LastSavedDateUtc DESC
    `;
    const data = await this._sql.query(query);
    await this._sql.disconnect();
    console.log("Found %s projects", data.length);
    return data.map(x => ({ UserId: x.UserId, ProjectGuid: x.ProjectGuid.toLowerCase() }))
  }

  async downloadFrontImage(ProjectGuid: string, Folder: string, OriginalFileName: string, UserId: string, Guid: string): Promise<void> {
    const key = `library/${UserId}/${Folder}/original/${Guid}.${OriginalFileName}`;
    const fileData = await this._aws.S3Provider.getS3Object(key, "milkbooks-design");
    const data = await fileData.Body.transformToByteArray();
    fs.writeFileSync(`${process.cwd()}/data/cover-data/${UserId}-${ProjectGuid}-${OriginalFileName}`, data)
  }

  async fetchProjectCover(projectGuid: string, userId: string): Promise<any | undefined> {
    const data = await this._aws.DynamoDBProvider.getItem({
      TableName: "Project",
      Key: {
        "UserId": { N: userId },
        "ProjectGuid": { S: projectGuid }
      }
    });
    if (data.Item) {
      return JSON.parse(data.Item["CoverData"].S);
    }
    return undefined;
  }

}