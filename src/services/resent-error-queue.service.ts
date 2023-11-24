import { ArrayHelper, FileHelper } from "../helpers";
import { RabbitMQProvider } from "../providers/rmq.provider";

export class ResentErrorQueueService {
  
  constructor(private _errorQueue: string, private _destinationQueue: string) {}

  async collect(): Promise<void> {
    return new Promise( async (resolve, reject) => {
      if (!process.env.RABBIT_MQ_SERVER || process.env.RABBIT_MQ_SERVER == '') {
        return reject("RABBIT_MQ_SERVER variable is missing!")
      }
      try {
        const rmq = new RabbitMQProvider(process.env.RABBIT_MQ_SERVER);
        const messages = await rmq.receive(this._errorQueue, 0, false);
        FileHelper.storeFile(messages, `${this._errorQueue}-${new Date().getTime()}.json`, ["RMQ"]);
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
          const m = batch.map(x => JSON.stringify(x));
          await rmq.publish(m, this._destinationQueue);
        }
        resolve();
      } catch(err) {
        reject(err);
      }
    });
  }

} 