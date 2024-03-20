import { connect, Connection, Channel, ConsumeMessage, GetMessage } from "amqplib";

export class RabbitMQProvider {
  readonly server: string;

  constructor(server: string) {
    this.server = server;
    if (!server || server === '') {
      throw new Error("RABBIT_MQ_SERVER has not been configured in environment variables")
    } 
  }

  async publish(messages: string[], queue: string): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        const connection: Connection = await connect(`amqp://${this.server}`);
        console.log('RabbitMQProvider.connect: Success')

        const channel: Channel = await connection.createChannel();
        console.log('RabbitMQProvider.createChannel: Success')

        await channel.assertQueue(queue, { durable: true });
        console.log('RabbitMQProvider.publish: queue =', queue);
        console.log('RabbitMQProvider.publish: Publishing %s messages', messages.length);

        for (const message of messages) {
          const success: boolean = channel.sendToQueue(queue, Buffer.from(message), {
            headers: { 'Content-Type': 'application/vnd.masstransit+json' }
          });
          if (!success) {
            await this._waitBeforeSend(channel);
          }
          // console.log("Message Sent '%s'", message);
        }

        await channel.close();
        await connection.close();

        console.log('RabbitMQProvider.publish: Success')
        resolve()
      } catch (err) {
        console.error(err);
        reject(err);
      }
    })
  }

  async receive(queue: string, batchSize: number = 10, removeFromQueue: boolean = false): Promise<string[]>
  {
    return new Promise( async (resolve, reject) => {
      try {
        if (!queue || queue === '') {
          return reject("Queue is not defined");
        }
        const connection: Connection = await connect(`amqp://${this.server}`);
        console.log('RabbitMQProvider.connect: Success');

        const channel: Channel = await connection.createChannel();
        console.log('RabbitMQProvider.createChannel: Success')

        await channel.assertQueue(queue, { durable: true });
        console.log('RabbitMQProvider.receive: queue =', queue);
        console.log('RabbitMQProvider.receive: batchSizeLimit =', batchSize);

        const messages = await this._consume(channel, queue, [], batchSize, removeFromQueue);
        console.log('RabbitMQProvider.receive: Received %s messages', messages.length);

        await channel.close();
        await connection.close();

        console.log('RabbitMQProvider.receive: Success');
        resolve(messages);
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _consume(channel: Channel, queue: string, messages: string[] = [], batchSize: number = 10, noAck: boolean = false): Promise<string[]>
  {
    return new Promise( async (resolve, reject) => {
      try {
        const message: GetMessage | false = await channel.get(queue, { noAck });
        if (message) {
          messages.push(message.content.toString());
          if (batchSize == 0 || messages.length < batchSize) {
            messages = await this._consume(channel, queue, messages, batchSize, noAck);
          } else {
            console.log('RabbitMQProvider.receive: Reached BatchSize limit');
          }
          resolve(messages);
        } else {
          resolve(messages);
        }
      } catch(err) {
        reject(err);
      }
    });
  }

  private async _waitBeforeSend(channel: Channel): Promise<void> {
    return new Promise( resolve => {
      channel.once('drain', () => {
        resolve();
      });
    });
  }
}
