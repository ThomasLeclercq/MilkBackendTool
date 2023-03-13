import { BaseDataService } from "./base.data.service";
import async from "async";
import { FileHelper } from "../helpers/file.helper";
import { NumberHelper } from "../helpers/numbers.helper";

export class CloudtrailEventDataService extends BaseDataService {

  private _logs: CloudTrailLog[] = [];
  get logs(): CloudTrailLog[] {
    return this._logs.slice();
  }
  private _lookUpResults: CloudTrailLog[] = [];
  get lookUpResults(): CloudTrailLog[] {
    return this._lookUpResults.slice();
  }
  private progress = { day: 0 };
  private readonly cloudtrailLogsBucket = 'milkbooks-logs';

  constructor() {
    super()
  }

  async analyzeCloudtrailLogs(values: string[], year: string, month: string): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        let totalDays = new Date(parseInt(year), parseInt(month), 0).getDate();
        const currentMonth = NumberHelper.addZeroPrefix( new Date().getMonth() + 1 );
        if (month === currentMonth) {
          totalDays = new Date().getDate();
        }
        const progress = FileHelper.getFile("progress.json", ["tls"]);
        const startFrom = progress.day || 0;
        const days = [...Array(totalDays+1).keys()].filter(x => x > startFrom).map(x=> NumberHelper.addZeroPrefix(x));
        
        for (const day of days) {
          console.log("Listing Logs for %s/%s/%s", day, month, year);
          const keys = await this.getLogKeys(year, month, day);
          console.log("Will starting fetching logs, please wait...");
          const logs = await this.fetchCloudtrailLogs(keys);
  
          console.log("Fetched all logs, starting analysis...");
          for (const value of values) {
            const matchingLogs = await this.getLogsWithValue(logs, value);
            console.log("Found %s matching logs", matchingLogs.length);
            if (matchingLogs.length > 0) {
              const names = matchingLogs.map(x=>x.Name);
              FileHelper.storeFile(names, `${year}-${month}-${day}-${value}-results.json`, ["tls"]);
            }
          }
  
          this.progress.day += 1;
          FileHelper.storeFile(this.progress, "progress.json", ["tls"]);
          console.log("Total analysis progress - %s%", (this.progress.day/days.length * 100).toFixed(2) );
        }
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  async getLogKeys(year: string, month: string, day: string): Promise<string[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const date = [year, month, day].join("/");
        const s3Content = await this._aws.listS3Objects({ 
          Bucket: this.cloudtrailLogsBucket, 
          Prefix: `S3/AWSLogs/396046420680/CloudTrail/us-east-1/${date}/`,
          Delimiter: "/",
        });
        resolve(s3Content.map(x=>x.Key))
      } catch(err) {
        reject(err);
      }
    })
  }

  async fetchCloudtrailLogs(keys: string[]): Promise<CloudTrailLog[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const logs = [];
        async.eachLimit(keys, 10, async (key: string) => {
          const logGZIPBuffer = await this._aws.getS3Object({ Bucket: this.cloudtrailLogsBucket, Key: key });
          const logBuffer = FileHelper.unzipFile(logGZIPBuffer as Buffer);
          const log = JSON.parse( logBuffer.toString("utf-8") );
          log.Name = key;
          logs.push(log);
          console.log("Progress - %s on %s - (%s%)", logs.length, keys.length, ((logs.length/keys.length)*100).toFixed(2));
        }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(logs);
          }
        })

      } catch(err) {
        reject(err);
      }
    });
  }

  getLogsWithValue(logs: CloudTrailLog[], value: string): CloudTrailLog[] {
    const matches = logs.filter( log => this.lookUp(log, value));
    return matches;
  }

  private lookUp(object: any, value: string, foundKey: boolean = false): boolean {
    for (const key in object) {
      
      if (foundKey == true) continue;

      if (Array.isArray(object[key])) {
        foundKey = object[key].find(x => this.matches(x, value)) !== undefined;
      }
      if (typeof object[key] === "object") {
        foundKey = this.lookUp(object[key], value, foundKey);
      }
      if (typeof object[key] === "string") {
        foundKey = this.matches(object[key], value);
      }
    }
    return foundKey;
  }

  private matches(key: string, value: string): boolean {
    const regex = new RegExp(value, 'gi');
    const matches = regex.exec(key);
    return matches !== null;
  }

}

export interface CloudTrailLog {
  Name?: string;
  Records: {
    eventVersion?: string;
    userIdentity?: {
      type?: string;
      principalId?: string;
      arn?: string;
      accountId?: string;
      accessKeyId?: string;
      userName?: string;
    };
    eventTime?: string;
    eventSource?: string;
    eventName?: string;
    awsRegion?: string;
    sourceIPAddress?: string;
    userAgent?: string;
    requestParameters?: {
      bucketName?: string;
      Host?: string;
      key?: string;
    };
    responseElements?: string;
    additionalEventData?: {
      SignatureVersion?: string;
      CipherSuite?: string;
      bytesTransferredIn?: string;
      AuthenticationMethod?: string;
      bytesTransferredOut?: string;
      "x-amz-id-2": string;
    };
    requestID?: string;
    eventID?: string;
    readOnly?: string;
    resources?: {
      type?: string;
      ARN?: string;
      accountId?: string;
    }[];
    eventType?: string;
    managementEvent?: string;
    recipientAccountId?: string;
    eventCategory?: string;
    tlsDetails?: {
      tlsVersion?: string;
      cipherSuite?: string;
      clientProvidedHostHeader?: string;
    };
  }[];
}