import { FileHelper } from "../../helpers/file.helper";
import { Category, Culture, Currency, Product, Promotion, PromotionNames } from "../../models/index";
import { MilkApiProvider } from "../../providers/index";
import { BaseDataService, DataService } from "../base.data.service";

export class PromotionTranslationDataService extends BaseDataService implements DataService {

  constructor() {
    super();
    this._https = new MilkApiProvider(process.env.MILKAPIKEY);
  }
  /**
   * Fetch Names for Translation
   * @returns 
   */
  async fetchData(): Promise<string[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const [
          categories,
          products,
        ] = await Promise.all([
          this.fetchCategories(),
          this.fetchProducts(),
        ]);
        const categoryNames = categories.map(x=>x.Name).sort();
        const productNames = products.map(x=>x.Name).sort();
        const displayNames = PromotionNames.map(x=>x.DisplayName).sort();
        resolve([...categoryNames, ...productNames, ...displayNames]);
      } catch (err) {
        reject(err);
      }
    })
  }

  async updateData(...params: any): Promise<void> {}

  async fetchProducts(): Promise<Product[]> {
    if (FileHelper.fileExists(`${Currency.USD}.json`)) {
      return FileHelper.getFile(`${Currency.USD}.json`);
    }
      return new Promise( async (resolve, reject) => {
        try {
          if (!process.env.API_HOST_URI || process.env.API_HOST_URI === "") {
            throw new Error("Missing Api Host Uri, please provide API_HOST_URI in .env file");
          }
          const productDto = await this._https.get(process.env.API_HOST_URI, `/products/${Currency.USD}`);
          const products: Product[] = productDto.Products.map( x => new Product(x));
          FileHelper.storeFile(products, `${Currency.USD}.json`);
          resolve(products);
        } catch (err) {
          reject(err);
        }
      });
  }

  async fetchCategories(): Promise<Category[]> {
    if (FileHelper.fileExists("categories.json")) {
      return FileHelper.getFile("categories.json");
    }
    return new Promise( async (resolve, reject) => {
      try {
        if (!process.env.HAWK_HOST_URI || process.env.HAWK_HOST_URI === "") {
          throw new Error("Please define HAWK_HOST_URI in .env file");
        }
        const categories: Category[] = await this._https.get(process.env.HAWK_POST_URI, "/app_plugins/milk/backoffice/data/categories.json");
        FileHelper.storeFile(categories, "categories.json");
        resolve(categories);
      } catch(err) {
        reject(err);
      }
    });
  }

  async fetchPromotions(culture: Culture = "en"): Promise<Promotion[]> {
    return new Promise( async (resolve, reject) => {
      let fileName = "promotion_discounts";
      if (culture !== "en") {
        fileName += "_" + culture;
      }
      fileName += ".json";
      if (FileHelper.fileExists(fileName)) {
        return FileHelper.getFile(fileName);
      }
      try {
        if (!process.env.HAWK_HOST_URI || process.env.HAWK_HOST_URI === "") {
          throw new Error("Please define HAWK_HOST_URI in .env file");
        }
        const promotions: Promotion[] = await this._https.get(process.env.HAWK_POST_URI, `/app_plugins/milk/backoffice/data/${fileName}`);
        FileHelper.storeFile(promotions, fileName);
        resolve(promotions);
      } catch(err) {
        reject(err);
      }
    });
  }

}