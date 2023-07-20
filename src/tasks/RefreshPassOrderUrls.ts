import { BaseTask } from ".";
import { TaskCommand } from "../models";
import { AwsProvider } from "../providers";

export class RefreshPassOrderUrls extends BaseTask {

  private readonly aws: AwsProvider;

  constructor() {
    super("Refresh Pass Order Urls", "RefreshPassOrderUrls");
    this.aws = new AwsProvider(process.env.AWSREGION);
  }

  async run(): Promise<void> {
    try {
      process.exit(0);
    } catch(err) {
      console.error(err);
      process.exit(1);
    }
  }
}