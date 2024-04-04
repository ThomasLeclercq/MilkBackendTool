import { ArrayHelper } from "../../helpers";
import { AwsProvider } from "../../providers";
import { RabbitMQProvider } from "../../providers/rmq.provider";
import async from "async";

export interface EmailErrorMandrill {
  "message": {
    "Subject": string,
    "EventData": {
      "Error": string,
      "Records": EmailErrorMandrillRecord[]
    }
  },
  "messageType": any[]
}
export interface EmailErrorMandrillRecord {
  "Sns": {
    "Subject": string,
    "Message": string
  }
}

export class ResendEmailErrors {
  private _rmq: RabbitMQProvider;
  private _aws: AwsProvider;

  constructor() {
    this._aws = new AwsProvider(
      process.env.AWSREGION,
      process.env.S3_REGION,
      process.env.DYNAMO_REGION,
      process.env.LAMBDA_REGION,
    );
    this._rmq = new RabbitMQProvider(process.env.RABBIT_MQ_SERVER);
  }

  async fetchEmailErrorQueue(): Promise<EmailErrorMandrill[]> {
    return;
  }

  async resendErrorsToSns(emailQueueErrors: EmailErrorMandrill[]): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const records: EmailErrorMandrillRecord[] = emailQueueErrors.map( msg => msg.message.EventData.Records[0] );
        const batches = ArrayHelper.getBatchesFromArray(records, 10);
        async.eachLimit(batches, 10, async (batch: EmailErrorMandrillRecord[]) => {
          const out = await this._aws.SnsProvider.publishBatch({
            TopicArn: process.env.MANDRILL_SNS_TOPIC_ARN,
            PublishBatchRequestEntries: batch.map( (record: EmailErrorMandrillRecord) => ({
              Id: new Date().getTime().toString() + Math.ceil(Math.random() * 999).toString(),
              Message: record.Sns.Message,
              Subject: record.Sns.Subject
            }))
          })
          const { Successful, Failed } = out;
          console.log({ Successful, Failed })
        }, (err) => {
          if (err) {
            console.error("Resend to MANDRILL SNS Error - ", err);
            reject(err)
          } else {
            console.log('Done');
            resolve();
          }
        })
      } catch(err) {
        console.error("Resend to MANDRILL SNS Error - ", err);
        reject(err);
      }
    });
  }


}