import { OptionGroupName, ProductTypeAlias, Theme, ThemeOptionImage, ThemeSection, ThemeSectionName } from "../models/index";
import { ThemeDataService } from "../services/index";
import { BaseManager } from "./base.manager";

export class ThemeManager implements BaseManager {
  readonly _dataService: ThemeDataService;
  
  constructor() {
    this._dataService = new ThemeDataService();
  }

  async addNewThemeOptionImage(themeOptionImage: ThemeOptionImage, products: ProductTypeAlias[]): Promise<void> {
    return new Promise( async (resolve, reject) => {
      try {
        let sectionName: ThemeSectionName;
        switch (themeOptionImage.OptionGroupName) {
          case OptionGroupName.Foiling:
          case OptionGroupName.CoverFabric:
            sectionName = "Cover";
            break;
          case OptionGroupName.PresentationBoxCover:
            sectionName = "PresentationBox";
            break;
          case OptionGroupName.Jacket:
            sectionName = "Jacket";
            break;
          default:
            sectionName = "Pages";
            break;
        }
        const themes: Theme[] = await this._dataService.fetchData(products);
        themes.forEach((theme: Theme) => {
          const section = theme.ThemeSections.find(x=>x.Name === sectionName);
          section.ThemeOptionImages.push(themeOptionImage);
        });
        await this._dataService.updateData(themes);
      } catch(error) {
        reject(error);
      }
    });
  }

}