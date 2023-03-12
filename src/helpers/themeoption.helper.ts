import { OptionGroupName } from "../models/Enums";
import { ProductTypeAlias } from "../models/Theme";

export abstract class ThemeOptionHelper {
  static generateThemeOptionImageUrl(productTypeAlias: ProductTypeAlias, optionGroupName: OptionGroupName, filename: string): string {
    let url = "https://media.milkbooks.com/data/theme/assets";
    let publisher;
    let alias;
    if (optionGroupName === OptionGroupName.InternalsPaperStock) {
      return `${url}/global/${filename}`;
    }
    if (optionGroupName === OptionGroupName.CoverFabric) {

      if (productTypeAlias.includes("MILKA")) {
        publisher = "milk-a";
      }
      if (productTypeAlias.includes("MILKO")) {
        publisher = "milk-o";
      }
      if (productTypeAlias.includes("-")) {
        alias = productTypeAlias.split("-")[1].toLowerCase();
      }
      alias = productTypeAlias.toLowerCase();
      return `${url}/${publisher}/book/${filename}`;
    }
    return url;
  }

  // Generate Url
  // Generate UrlBackground
  // Generate AssetUrl 

  // handle PaperStock
  // handle CoverFabric
  // handle PresentationBoxFabric
  // Handle Foiling / Paper / -- just AssetUrl
}