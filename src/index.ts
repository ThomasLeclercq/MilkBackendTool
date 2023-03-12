import { FileHelper } from "./helpers/file.helper";
import { CloudtrailEventDataService } from "./services/cloudtrail-events.data.service";

( async () => {
  try {
    // const newMetallicBrownCoverOption: ThemeOptionImage = {
    //   Id: 0,
    //   Url: "https://media.milkbooks.com/data/theme/assets/",
    //   UrlBackground: "https://media.milkbooks.com/data/theme/assets/",
    //   AssetUrl: "https://media.milkbooks.com/data/theme/assets/",
    //   OptionGroupName: OptionGroupName.CoverFabric,
    //   OptionValue: "LinenMetallicBrown",
    //   Label: "Metallic Brown Linen",
    //   RelOptionName: OptionGroupName.PresentationBoxCover,
    //   RelOptionValue: "LinenMetallicBrown"
    // }
    // const newMetallicBrownPresentationBoxCoverOption: ThemeOptionImage = {
    //   Id: 0,
    //   Url: "https://media.milkbooks.com/data/theme/assets/",
    //   UrlBackground: "https://media.milkbooks.com/data/theme/assets/",
    //   AssetUrl: "https://media.milkbooks.com/data/theme/assets/",
    //   OptionGroupName: OptionGroupName.PresentationBoxCover,
    //   OptionValue: "LinenMetallicBrown",
    //   Label: "Metallic Brown Linen"
    // }


    const cloudtrailEventDataService = new CloudtrailEventDataService();
    await cloudtrailEventDataService.analyzeCloudtrailLogs(["TLSv1.0", "TLSv1.1"], "2022", "12");
    // const keys = await cloudtrailEventDataService.getLogKeys("2023", "02", "01");
    // const logs = await cloudtrailEventDataService.fetchCloudtrailLogs(keys);
    // const matchingLogs = await cloudtrailEventDataService.getLogsWithValue(logs,"TLSv1.1");
    // const names = matchingLogs.map(x=>x.Name);
    // FileHelper.storeFile(names, "results.json", ["tls"]);

    console.log("Done");
    process.exit(0);

  } catch (err) {
    console.error("Oops something went wrong ", err);
    process.exit(1);
  }
})()
