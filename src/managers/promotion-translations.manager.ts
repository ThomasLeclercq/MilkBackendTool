import { rejects } from "assert";
import { FileHelper, PromotionHelper } from "../helpers/index";
import { alreadyTranslated, Culture, PromotionDictionary, Region } from "../models/index";
import { GoogleTranslationService } from "../services/Translations/google-translation.service";
import { PromotionTranslationDataService } from "../services/index";
import { BaseManager } from "./base.manager";

export class PromotionTranslationManager implements BaseManager {

  readonly _dataService: PromotionTranslationDataService;
  readonly _translationService: GoogleTranslationService;
  
  constructor() {
    this._dataService = new PromotionTranslationDataService();
    this._translationService = new GoogleTranslationService();
  }

  async generatePromotionDictionaries(): Promise<PromotionDictionary> {
    try {
      let names: string[] = await this._dataService.fetchData();
      const regions: string[] = ["original", "en-US", "de-DE", "es-ES", "fr-FR", "it-IT", "pt-BR"];
      let dictionary: { [key: string]: { [key: string]: string } } = {};
      for (const region of regions) {
        for(const name of names) {
          if (!dictionary[region]) {
            dictionary[region] = {}
          }
          if (region === "original") {
            dictionary[region][name] = name;
          } else if (region === "en-US") {
            dictionary[region][name] = PromotionHelper.cleanNameForTranslation(name);
          } else {
            let entry = "";
            if (alreadyTranslated[region]) {
              if (alreadyTranslated[region][name]) {
                entry = alreadyTranslated[region][name];
              }
              if (alreadyTranslated[region][PromotionHelper.cleanNameForTranslation(name)]) {
                entry = alreadyTranslated[region][PromotionHelper.cleanNameForTranslation(name)]
              }
            }
            dictionary[region][name] = entry;
          }
        }
      }
      dictionary = await this.translateEmptyDictionaryEntries(dictionary);
      FileHelper.storeFile(dictionary, "dictionary.json");
      return dictionary;
    } catch (err) {
      rejects(err);
    }
  }

  generateCSVForTranslations(dictionary: PromotionDictionary): void {
    let csvrows = [];
    const headers = Object.keys(dictionary).map( (region: Region) => region.split("-")[0]).join(",");
    csvrows.push(headers);

    const columns = Object.keys(dictionary);
    const rows = Object.keys(dictionary["en-US"]);
    rows.forEach( (row: string) => {
      const rowData = [];
      columns.forEach( (column: string) => {
        if (dictionary[column][row]) {
          rowData.push(dictionary[column][row]);
        } else {
          rowData.push("");
        }
      });
      csvrows.push(rowData.join(","))
    })

    let csv = "\uFEFF" + csvrows.join("\n");
    FileHelper.storeCSVFile(csv, "promotion_dictionary.csv");
  }

  feedDictionnaryFromCSV(fileName: string): PromotionDictionary {
    const dictionary: PromotionDictionary = {};
    const csvFile = FileHelper.getCSVFile(fileName);
    const rows = csvFile.split("\n");
    const headers = rows[0].split(",").map(x => x = x.replace("\r", ""));
    headers.forEach(header => dictionary[header] = {}); 
    const body = rows.slice(1, rows.length-1);
    body.forEach(row => {
      const columns = row.split(",");
      const key = columns[0];
      columns.forEach((column: string, index: number) => {
        dictionary[headers[index]][key] = column.replace("\r", "");
      })
    })
    return dictionary;
  }

  async translateEmptyDictionaryEntries(dictionary: PromotionDictionary): Promise<PromotionDictionary> {
    return new Promise( async (resolve, reject) => {
      try {
        const regions: string[] = ["de-DE", "es-ES", "fr-FR", "it-IT", "pt-BR"];
        for (const region of regions) {
          const emptyFields = Object.keys(dictionary[region]).filter( x => dictionary[region][x] === "");
          const toTranslate = emptyFields.map(x => dictionary["en-US"][x]);
          const translated = await this._translationService.translateText(toTranslate, region.split("-")[0] as Culture);
          const translationDict = {};
          emptyFields.forEach( (x, index) => {
            translationDict[x] = translated[index];
          })
          for (const key of Object.keys(dictionary[region]) ) {
            if (translationDict[key]) {
              dictionary[region][key] = translationDict[key]
            }
          }
        }
        resolve(dictionary);
      } catch (err) {
        reject(err);
      }
    })
  }

}