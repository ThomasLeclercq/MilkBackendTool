import { ArrayHelper, FileHelper } from "../../helpers";
import { RabbitMQProvider } from "../../providers/rmq.provider";

export class ResentErrorQueueService {
  
  constructor(private _errorQueue: string, private _destinationQueue: string) {}

  async resendAllMessages(): Promise<void> {
    return new Promise( async (resolve, reject) => {
      if (!process.env.RABBIT_MQ_SERVER || process.env.RABBIT_MQ_SERVER == '') {
        return reject("RABBIT_MQ_SERVER variable is missing!")
      }
      try {
        const rmq = new RabbitMQProvider(process.env.RABBIT_MQ_SERVER);
        let messages: string[] = [];
        do {

          messages = await rmq.receive(this._errorQueue, 100, true);
          FileHelper.storeFile(messages, `${this._errorQueue}-${new Date().getTime()}.json`, ["RMQ"]);

          for (const batch of ArrayHelper.getBatchesFromArray(messages))
          {
            await rmq.publish(batch, this._destinationQueue);
          }

        } while(messages.length > 0);
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  async collect(): Promise<void> {
    return new Promise( async (resolve, reject) => {
      if (!process.env.RABBIT_MQ_SERVER || process.env.RABBIT_MQ_SERVER == '') {
        return reject("RABBIT_MQ_SERVER variable is missing!")
      }
      try {
        const rmq = new RabbitMQProvider(process.env.RABBIT_MQ_SERVER);
        const messages = await rmq.receive(this._errorQueue, 100, true);
        FileHelper.storeFile(messages, `${this._errorQueue}-${new Date().getTime()}.json`, ["RMQ", "AssetArchive"]);
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

  async resend(messages: string[]): Promise<void>{
    return new Promise( async (resolve, reject) => {
      if (!process.env.RABBIT_MQ_SERVER || process.env.RABBIT_MQ_SERVER == '') {
        return reject("RABBIT_MQ_SERVER variable is missing!")
      }
      try {
        const rmq = new RabbitMQProvider(process.env.RABBIT_MQ_SERVER);
        for (const batch of ArrayHelper.getBatchesFromArray(messages))
        {
          await rmq.publish(batch, this._destinationQueue);
        }
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

} 