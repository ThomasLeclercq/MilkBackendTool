import * as dotenv from "dotenv";
import { Cli } from "./services/cli.service";
dotenv.config();

const cli = new Cli();

(async () => {

  process.on("exit", async () => {
    console.log("FORCED EXIT")
    await cli.exit();
    process.exit(0)
  });

  try {
    await cli.run();
    process.exit(0);
  } catch(error) {
    console.error(error);
    await cli.exit()
    process.exit(1);
  }
})();