import * as dotenv from "dotenv";
dotenv.config();
import { Cli } from "./services/cli.service";
import { AssetCleanupService } from "./services/asset-cleanup.service";
import { NumberHelper } from "./helpers/numbers.helper";

// const cli = new Cli();

(async () => {

  // process.on("exit", async () => {
  //   console.log("FORCED EXIT")
  //   await cli.exit();
  //   process.exit(0)
  // });

  try {
    const assetCleanupService = new AssetCleanupService();
    await assetCleanupService.run('2023-07-01', '2023-08-01');
    // await cli.run();
    // process.exit(0);
  } catch(error) {
    console.error(error);
    // await cli.exit()
    process.exit(1);
  }
})();