import { ProductCategoryName, ProductCategoryNames } from "../models/Constants";
import { ProductCategory } from "../models/ProductCategory";
import { DataService } from "../services/base.data.service";
import { CompareRangeDataService } from "../services/compare-range-data.service";
import { BaseManager } from "./base.manager";

export class CompareRangeManager implements BaseManager {
  
  compareRangeData: ProductCategory[] = [];
  readonly _dataService: DataService;

  constructor() {
    this._dataService = new CompareRangeDataService();
  }
  /**
   * Generates data for compare-range.json
   * Fetch the data necessary (milk_product_picker.json, products.json // ALL currencies)
   * Then, from a list of ProductCategory, creates a list of ProductCategory that holds 
   * Name, Alias, Price and Options data
   * @returns ProductCategory[] // data that can be used as JSON format
   */
  async generateCompareRangeJSON(): Promise<ProductCategory[]> {
    console.log("Gathering data to generate compare-range.json");
    const { Products, ProductPicker } = await this._dataService.fetchData();
    console.log("Generating compare-range.json from milk_product_picker.json and products.json");
    this.compareRangeData = ProductCategoryNames.map( (name: ProductCategoryName) => {
      const productCategory = new ProductCategory(name);
      productCategory.hydrateFromProductPickerAndProductJSONs(ProductPicker, Products);
      return productCategory;
    });
    return this.compareRangeData;
  }

  /**
   * Will use the compare-range.json stored in the /data folder 
   * and upload it to the S3 Bucket and Path set in .env file
   */
  async uploadCompareRangeJSONToS3(): Promise<void> {
    if (!process.env.S3_COMPARE_RANGE_PATH || process.env.S3_COMPARE_RANGE_PATH === "") {
      throw new Error("Missing S3 path to store compare-range.json, please provide S3_COMPARE_RANGE_PATH in .env");
    }
    this._dataService.updateData(this.compareRangeData, process.env.S3_COMPARE_RANGE_PATH);
  }

}