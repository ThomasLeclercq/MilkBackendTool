import { connect, Connection, Channel } from "amqplib";

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

        for (const message of messages) {
          const success: boolean = channel.sendToQueue(queue, Buffer.from(message));
          if (!success) {
            await this._waitBeforeSend(channel);
          }
          console.log("Message Sent '%s'", message);
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

  private async _waitBeforeSend(channel: Channel): Promise<void> {
    return new Promise( resolve => {
      channel.once('drain', () => {
        resolve();
      });
    });
  }
}
