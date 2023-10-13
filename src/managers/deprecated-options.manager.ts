import { Addon, OptionGroupName, ProductTypeAlias, Theme, ThemeOptionImage, ThemeSection, ThemeSectionName } from "../models/index";
import { SqlProvider } from "../providers";
import { ThemeDataService } from "../services/index";
import { BaseManager } from "./base.manager";

export class ThemeManager implements BaseManager {
  readonly _dataService: ThemeDataService;
  readonly _sqlProvider: SqlProvider;
  
  constructor() {
    this._dataService = new ThemeDataService();
    this._sqlProvider = new SqlProvider("a.db.stag.milkbooks.net", "Staging_MilkBooksApi", "milkbooks", "Milkb00ks");
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

  async getThemesWithDeprecatedAddons(addonAliases: string[]): Promise<Theme[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const themes: Theme[] = await this._dataService.fetchData();
        const toDeprecate: Theme[] = [];
        themes.forEach( theme => {
          theme.ThemeSections.forEach( themeSection => {
            themeSection.ThemeOptionImages.find( themeOptionImage => {
              if (
                addonAliases.includes(themeOptionImage.OptionValue) ||
                addonAliases.includes(themeOptionImage.RelOptionValue)
              ) {
                const exists = toDeprecate.find(x => x.Id === theme.Id);
                if (!exists) {
                  toDeprecate.push(theme);
                } 
              }
            });
          }) 
        });
        resolve(toDeprecate);
      } catch(err) {
        reject(err);
      }
    });
  }

  async getProductIdFromName(name: string): Promise<any> {
    return new Promise( async (resolve, reject) => {
      try {
        const product = await this._sqlProvider.query(`
          SELECT * FROM [Product] INNER JOIN [ApplicationProduct] ON [ApplicationProduct].[ProductId] = [Product].[Id] WHERE [Product].[Name] = '${name}' AND [ApplicationProduct].[ApplicationId] = 121482
        `);
        resolve(product[0])
      } catch(err) {
        reject(err);
      }
    });
  }

  async getApplicationProductAddonFromProductAddonId(productAddonId: string): Promise<any> {
    return new Promise( async (resolve, reject) => {
      try {
        const applicationProductAddon = await this._sqlProvider.query(`
          SELECT * FROM [ApplicationProductAddOn] WHERE [ApplicationProductAddOn].[ProductAddOnId] = '${productAddonId}' AND [ApplicationProductAddOn].[ApplicationId] = 121482
        `);
        resolve(applicationProductAddon[0])
      } catch(err) {
        reject(err);
      }
    });
  }

  async getProductAddonIdFromProductIdAndThemeOptionName(productId: string, deprecatedAddonName: string, deprecatedAddonOptionGroupName: string): Promise<any> {
    return new Promise( async (resolve, reject) => {
      try {
        const productAddon = await this._sqlProvider.query(`
          SELECT * FROM [ProductAddOn] WHERE [ProductId] = '${productId}' AND [Name] = '${deprecatedAddonName}' AND [OptionGroupName] = '${deprecatedAddonOptionGroupName}'
        `);
        resolve(productAddon[0]);
      } catch(err) {
        reject(err);
      }
    });
  } 

  async deleteProductAddon(productAddonId: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this._sqlProvider.query(`
          DELETE FROM [ProductAddOn] WHERE [ProductAddOn].[Id] = ${productAddonId};
        `)
        resolve();
      } catch(err) {
        reject(err);
      }
    });  
  }

  async deleteApplicationProductAddon(applicationProductAddonId: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this._sqlProvider.query(`
        DELETE FROM [ApplicationProductAddOn] WHERE [ApplicationProductAddOn].[Id] = ${applicationProductAddonId};
        `);
        resolve();
      } catch(err) {
        reject(err);
      }
    });  
  }

  async restoreApplicationProductAddon(data: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this._sqlProvider.query(`
          INSERT INTO [ApplicationProductAddOn] (ApplicationId, ProductAddOnId, Guid, Sku) VALUES (${data["ApplicationId"]}, ${data["ProductAddOnId"]}, '${data["Guid"]}', '${data["Sku"]}')
        `);
        resolve();
      } catch(err) {
        reject(err);
      }
    }); 
  }

}