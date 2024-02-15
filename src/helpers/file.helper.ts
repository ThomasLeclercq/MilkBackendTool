import fs from 'fs';
import zlib from "zlib";
import { Dictionary } from '../models/index';

/**
 * Helper to store or retrieve files and their folders in /data
 */
export abstract class FileHelper {

  static getFile(filename: string, directories: string[] = ["data"]): any { 
    directories = ["data", ...directories];
    const path = `${process.cwd()}/${directories.join("/")}/${filename}`;
    if (fs.existsSync(path)) {
      const str: string = fs.readFileSync(path, { encoding: 'utf-8' });
      return JSON.parse(str);
    } else {
      return;
    }
  }

  static storeFile(data: any, fileName: string, directories: string[] = ["data"]): void {
    directories = ["data", ...directories];
    const path = `${process.cwd()}/${directories.join('/')}/`;
    this.createFolders(directories);
    fs.writeFileSync(path + fileName, JSON.stringify(data))
  }

  static updateFile(data: any, fileName: string, directories: string[] = ["data"]): void {
    directories = ["data", ...directories];
    const path = `${process.cwd()}/${directories.join('/')}/`;
    if (fs.existsSync(path)) {
      fs.appendFileSync(path + fileName, JSON.stringify(data))
    } else {
      this.createFolders(directories);
      fs.writeFileSync(path + fileName, JSON.stringify(data))
    }
  }

  static storeImageFile(data: Buffer, fileName: string, directories: string[] = ["data"]): void {
    directories = ["data", ...directories];
    const path = `${process.cwd()}/${directories.join('/')}/`;
    this.createFolders(directories);
    fs.writeFileSync(path + fileName, data);
  }

  static storeImageFileV3(data: any, fileName: string, directories: string[] = ["data"]): void {
    directories = ["data", ...directories];
    const path = `${process.cwd()}/${directories.join('/')}/`;
    this.createFolders(directories);
    fs.writeFileSync(path + fileName, data);
  }

  static unzipFile(data: Buffer): Buffer {
    return zlib.gunzipSync(data);
  }

  static storeCSVFile(data: any, fileName: string): void {
    const path = `${process.cwd()}/data/`;
    this.createFolder(path);
    fs.writeFileSync(path + fileName, data)
  }

  static getCSVFile(filename: string): any { 
    const path = `${process.cwd()}/data/${filename}`;
    const str: string = fs.readFileSync(path, { encoding: 'utf-8' });
    return str;
  }

  static bufferToString(buffer: Buffer): string {
    return buffer.toString('utf-8');
  }

  static stringToBuffer(str: string): Buffer {
    return Buffer.from(str);
  }
  static createFolders(folders: string[]): void {
    let toCreate = `${process.cwd()}/`;
    folders.forEach( (folder: string) => {
      toCreate += folder + "/";
      this.createFolder(toCreate);
    })
  }

  static createFolder(folderPath: string): void {
    if ( !fs.existsSync(folderPath) ) {
      fs.mkdirSync(folderPath);
    }
  }

  static fileExists(fileName: string): boolean {
    const path = `${process.cwd()}/data/${fileName}`;
    return fs.existsSync(path);
  }

  static fromCSVToJSON(csvFile: string, hasTopHeaders: boolean = true, hasLeftHeaders: boolean = false): Dictionary {
    const dictionary: Dictionary = {};
    const rows = csvFile.split("\n");
    const headers = rows[0].split(",").map((x: string, index:number) => {
      if (hasTopHeaders === true && hasLeftHeaders === false) {
        return x.replace("\r", "");
      }
      if (hasTopHeaders === false && hasLeftHeaders === true) {
        return;
      }
      return index;
    }); 
    const body = rows.slice(1, rows.length-1);
    body.forEach(row => {
      const columns = row.split(",");
      const key = columns[0];
      columns.forEach((column: string, index: number) => {
        if (hasLeftHeaders === true) {
          dictionary[key] = column.replace("\r", "");
        } else {
          dictionary[headers[index]] = column.replace("\r", "");
        }
      })
    })
    return dictionary;
  }

  static readDir(directories: string[] = ["data"]): string[] {
    directories = ["data", ...directories];
    const path = `${process.cwd()}/${directories.join("/")}/`;
    return fs.readdirSync(path);
  }

  static async searchInDirectory(value: any, targetFolder: string, verbose: boolean = false): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let hasFoundValue = false;
        let filePaths = fs.readdirSync(`${process.cwd()}${targetFolder}`, {encoding: "utf-8"});
        if (filePaths.length === 0) {
          console.log("No file found in %s", targetFolder);
          return resolve(false);
        }
        for(const filePath of filePaths) {

          hasFoundValue = await this.searchInFile(value, `${targetFolder}${filePath}`);
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

  static async searchInFile(value: string, filePath: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!fs.existsSync(`${process.cwd()}${filePath}`)) {
          return resolve(false);
        }
        let hasFoundValue = false;
        let lastChunk: string = ""; // ensure data to not be cut off between chunks
        const stream = fs.createReadStream(`${process.cwd()}${filePath}`, {encoding: "utf-8"});
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

}