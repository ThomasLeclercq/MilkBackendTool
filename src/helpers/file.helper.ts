import fs from 'fs';

/**
 * Helper to store or retrieve files and their folders in /data
 */
export abstract class FileHelper {

  static getFile(filename: string): any { 
    const path = `${process.cwd()}/data/${filename}`;
    const str: string = fs.readFileSync(path, { encoding: 'utf-8' });
    return JSON.parse(str);
  }

  static storeFile(data: any, fileName: string): void {
    const path = `${process.cwd()}/data/`;
    this.createFolder(path);
    fs.writeFileSync(path + fileName, JSON.stringify(data))
  }

  static bufferToString(buffer: Buffer): string {
    return buffer.toString('utf-8');
  }

  static stringToBuffer(str: string): Buffer {
    return Buffer.from(str);
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

}