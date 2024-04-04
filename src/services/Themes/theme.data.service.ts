import { FileHelper } from "../../helpers/file.helper";
import { ProductTypeAlias, Theme, ThemeMap, ThemeMapType } from "../../models/index";
import { BaseDataService, DataService } from "../base.data.service";
import * as async from "async";

export class ThemeDataService extends BaseDataService implements DataService {

  private _themes: Theme[] = [];
  get themes(): Theme[] {
    return this._themes.slice();
  }

  constructor() {
    super();
  }

  async fetchData(products?: ProductTypeAlias[]): Promise<Theme[]> {
    return new Promise( (resolve, reject) => {
      const themes: ThemeMapType[] = products !== undefined ? ThemeMap.filter(x => products.includes(x.Alias)) : ThemeMap;
      async.eachLimit(themes, 5, async (themeMap: ThemeMapType) => {
        const theme: Theme = await this.downloadTheme(themeMap.Filename);
        this._themes.push(theme);
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.themes);
        }
      });
    })
  }

  async updateData(themes: Theme[]): Promise<void> {
    return new Promise( (resolve, reject) => {
      async.eachLimit(themes, 5, async (theme: Theme) => {
        await this.uploadTheme(theme, `${theme.Id}.json`);
      }, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve();
        }
      });
    });
  }

  private async downloadTheme(themeName: string): Promise<Theme> {
    return new Promise( async (resolve, reject) => {
      try {
        let theme: Theme;
        if (!FileHelper.getFile(themeName) || this._forceRefresh === true) {
          if (!process.env.BUCKET || process.env.BUCKET == "") {
            throw new Error("Missing BUCKET in .env file");
          }
          const themeBuffer = await this._aws.getS3Object({ Key: `data/theme/gzip/${themeName}`, Bucket: process.env.BUCKET }) as Buffer;
          theme = JSON.parse( FileHelper.bufferToString(themeBuffer) )
          FileHelper.storeFile(theme, themeName);
        } else {
          theme = FileHelper.getFile(themeName);
        }
        resolve(theme);
      } catch (error) {
        reject(error);
      }
    })
  }

  private async uploadTheme(data: any, themeName: string): Promise<void> {
    if (!process.env.BUCKET || process.env.BUCKET === "") {
      throw new Error("Missing Bucket name, please provide BUCKET in .env");
    }
    return this._aws.putS3Object({
      Bucket: process.env.BUCKET,
      Key: `data/theme/gzip/${themeName}`,
      Body: FileHelper.stringToBuffer(JSON.stringify(data))
    });
  }
}