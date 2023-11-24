import * as dotenv from 'dotenv';
dotenv.config()

import { AwsProvider, HttpsProvider, SqlProvider } from '../providers/index';
import { RabbitMQProvider } from '../providers/rmq.provider';

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
  public _sql: SqlProvider;
  protected _rmq: RabbitMQProvider;
  protected _forceRefresh: boolean = false;

  constructor() {
    this._https = new HttpsProvider();
    this._sql = new SqlProvider(process.env.SQL_SERVER, process.env.SQL_DATABASE, process.env.SQL_USERNAME, process.env.SQL_PASSWORD);
    this._aws = new AwsProvider(process.env.AWSREGION, process.env.S3_REGION, process.env.DYNAMO_REGION, process.env.LAMBDA_REGION);
    this._rmq = new RabbitMQProvider(process.env.RABBIT_MQ_SERVER);
    this._forceRefresh = (process.env.FORCE_REFRESH && process.env.FORCE_REFRESH === "true") || false;
  }

}