import fs from 'fs';
import { Dictionary } from '../models/index';

/**
 * Helper to store or retrieve files and their folders in /data
 */
export abstract class FileHelper {

  static getFile(filename: string, directories: string[] = ["data"]): any { 
    directories = ["data", ...directories];
    const path = `${process.cwd()}/${directories.join("/")}/${filename}`;
    const str: string = fs.readFileSync(path, { encoding: 'utf-8' });
    return JSON.parse(str);
  }

  static storeFile(data: any, fileName: string, directories: string[] = ["data"]): void {
    directories = ["data", ...directories];
    const path = `${process.cwd()}/${directories.join('/')}/`;
    this.createFolders(directories);
    fs.writeFileSync(path + fileName, JSON.stringify(data))
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

}