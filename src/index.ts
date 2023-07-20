import * as dotenv from "dotenv";
dotenv.config();
import { Cli } from "./services/cli.service";
const cli = new Cli();


(async () => {

  process.on("exit", async () => {
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