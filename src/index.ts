import * as dotenv from "dotenv";
dotenv.config();
import { Cli } from "./services/cli.service";
import { AssetCleanupService } from "./services/asset-cleanup.service";
import { NumberHelper } from "./helpers/numbers.helper";
import { RabbitMQProvider } from "./providers/rmq.provider";
import { ArrayHelper, FileHelper } from "./helpers";
import { ResentErrorQueueService } from "./services/resent-error-queue.service";
import { GetProjectCoverService } from "./services/cover-project.service";
import { AwsProvider, SqlProvider } from "./providers";
import { ResendEmailErrors } from "./services/resend-email-errors.service";
import { RepairHEICAssetsService } from "./services/repair-heic-assets.service";

const cli = new Cli();

(async () => {

  // process.on("exit", async () => {
  //   console.log("FORCED EXIT")
  //   await cli.exit();
  //   process.exit(0)
  // });

  try {
    // const assetCleanupService = new AssetCleanupService();
    // await assetCleanupService.run('2023-10-15', '2023-10-16');
    // const resendQService = new ResentErrorQueueService("design_studio_asset_cleanup_error", "design_studio_asset_cleanup");
    // await resendQService.collect();

    const userWithHEICIssues: number[] = [
      // 1001129,
      // 2545831,
      // 3273852,
      // 3244042,
      // 3287064,
      // 1054781,
      // 3295825,
      // 3263245,
      // 3295018,
      // 3292778,
      // 3281840, NOT REPAIRED
      // 573632,
      // 474336,
      // 794380,
      // 567865,
      // 3294767,
      // 3294243,
      // 3017732,
      // 3294134,
    ];
    const repairService = new RepairHEICAssetsService();
    for (const userId of userWithHEICIssues) {
      await repairService.repairHeicForUser(userId)
    }
    process.exit(0);
  } catch(error) {
    console.error(error);
    // await cli.exit()
    process.exit(1);
  }
})();