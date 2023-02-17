import * as dotenv from 'dotenv';
dotenv.config()

import { AwsProvider, HttpsProvider } from '../providers/index';

export interface DataService {
  fetchData(...params: any): Promise<any>;
  updateData(...params: any): Promise<any>;
}

/**
 * Service responsible of retrieving online data from Milkbooks
 */
export abstract class BaseDataService {
  protected _https: HttpsProvider;
  protected _aws: AwsProvider;
  protected _forceRefresh: boolean = false;

  constructor() {
    this._https = new HttpsProvider();
    this._aws = new AwsProvider(process.env.AWSREGION);
    this._forceRefresh = (process.env.FORCE_REFRESH && process.env.FORCE_REFRESH === "true") || true;
  }

}