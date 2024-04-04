import * as dotenv from "dotenv";
import { RestoreCleanupDynamoAssetService } from "./services/AssetCleanup/restore-cleanedup-dynamo-assets.service";
import { Cli } from "./services/CLI/cli.service";
dotenv.config();

const cli = new Cli();

(async () => {

  // process.on("exit", async () => {
  //   console.log("FORCED EXIT")
  //   await cli.exit();
  //   process.exit(0)
  // });

  try {
    // await cli.run();
    // const service = new ResentErrorQueueService(
    //   "design_studio_asset_archive",
    //   "design_studio_asset_archive_error", 
    // );
//     // queue_two
//     // const messages = [
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1385456","Folder":"3.2022"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3180062","Folder":"12.2023"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3306037","Folder":"12.2023"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3372488","Folder":"12.2023"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3363491","Folder":"12.2023"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3120442","Folder":"12.2023"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3243145","Folder":"12.2023"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"772014","Folder":"12.2023"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3337875","Folder":"12.2023"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3285180","Folder":"11.2023"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]}
//     // ];

//     // Queue One
//     // const messages = [
//       // {"message":{"Subject":"AssetArchive","EventData":{"UserId":"894626"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//       // {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2760508"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//       // {"message":{"Subject":"AssetArchive","EventData":{"UserId":"891626"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     // ];
//     // Queue Four
//     // const messages = [
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3030794"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2273139"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2010884"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1316240"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2011923"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2039180"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2063424"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2050733"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2076718"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"354217"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2201133"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2011442"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2158800"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3068753"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3070637"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3078104"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1152382"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2508398"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1106754"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3237722"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2517932"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3302700"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3276222"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3254502"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3302853"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3268837"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2492536"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3126208"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3316919"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3315807"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2609924"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2036899"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2034206"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"325390"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"325748"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"325818"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"326465"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
//     // wo
  
//     // Queue 2
// //     const messages = [
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1007496",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1012546",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1013305",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1018234",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1023404",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1031002",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1034538",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1041569",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1044371",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1047906",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1049272",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1054787",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1058505",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1060612",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1062181",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1064103",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1067378",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1070381",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1083896",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1089199",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1089481",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1090039",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1090754",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1093008",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1094998",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1095381",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1095562",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1097364",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1103372",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1103975",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1110231",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1110273",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1112441",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1112470",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1119161",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1126682",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1130102",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1137324",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1158446",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1171200",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1178924",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1182806",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1186051",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1192136",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1231550",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1266733",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1287911",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1306875",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1327518",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1385456",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1407513",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1437192",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1472631",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1553442",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1586020",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1616481",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1633646",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1690297",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1713354",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1754713",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1756739",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1769701",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1789262",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1829292",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1829726",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1834703",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1850383",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1870122",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1871294",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1879631",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1905572",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"1983964",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2004629",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2060959",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2070787",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2127186",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2132846",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2143083",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2170608",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2184643",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2213094",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2222375",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2223110",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2229891",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2234148",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2234582",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2239876",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2243710",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2248613",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2252111",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2252785",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2253599",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2258587",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2258977",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2260108",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2302403",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2335992",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"247439",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2514342",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2569700",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2577953",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"259344",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2622377",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2635314",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"265129",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"267870",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"268004",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2681499",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2687240",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2699083",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2704135",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2953719",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"405374",}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// //     {"message":{"Subject":"AssetArchive","EventData":{"UserId":"887498"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
// // ]

      // const messages = [
      //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"2687240","Folder":"4.2023"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
      //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"3321810","Folder":"12.2023"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
      //   {"message":{"Subject":"AssetArchive","EventData":{"UserId":"394186","Folder":"12.2020"}},"messageType":["urn:message:MILKBooks.API.Messages:AssetArchiveMessage"]},
      // ]

      // await service.resend(messages.map(x => JSON.stringify(x)));
      // await service.resendAllMessages();
      // await service.collect();

// const service = new ArchiveAssetService(process.env.API_DATABASE);
// await service.sendUsersToAssetArchiveRMQ();

    const service = new RestoreCleanupDynamoAssetService();
    await service.RevertDeletedAssetsForUser(961975);

    process.exit(0);
  } catch(error) {
    console.error(error);
    await cli.exit()
    process.exit(1);
  }
})();