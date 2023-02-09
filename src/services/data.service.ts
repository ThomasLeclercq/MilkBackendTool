import * as dotenv from 'dotenv';
dotenv.config()

import * as async from 'async';

import { Currency } from '../models/Enums';
import { Product } from "../models/Product";
import { HttpsProvider } from "../providers/https.provider";
import { ProductPicker } from '../models/ProductPicker';
import { AwsProvider } from '../providers/aws.provider';
import { FileHelper } from '../helpers/file.helper';

/**
 * Service responsible of retrieving online data from Milkbooks
 */
export class DataService {
  private readonly _https: HttpsProvider;
  private readonly _aws: AwsProvider;
  private readonly _forceRefresh: boolean = false;

  private _products: { [key: string]: Product[] } = {};
  private _productPicker: ProductPicker[] = [];

  constructor() {
    this._https = new HttpsProvider(process.env.MILKAPIKEY);
    this._aws = new AwsProvider(process.env.AWSREGION);
    this._forceRefresh = (process.env.FORCE_REFRESH && process.env.FORCE_REFRESH === "true") || true;
  }

  /**
   * Fetch milk_product_picker.json and products.json for all all currencies
   * All currencies prices are stored into one file: products.json
   * Will fetch/update data if data has not already been stored in /data folder or if forcedRefresh is set to true in .env
   * @returns 
   */
  async fetchCompareRangeData(): Promise<{ Products: { [key: string]: Product[] }, ProductPicker: ProductPicker[] }> {
    return new Promise( async (resolve, reject) => {
      try {
        let Products, ProductPicker;

        if ( !FileHelper.fileExists('products.json') || !FileHelper.fileExists('milk_product_picker.json') || this._forceRefresh) {
          
          console.log("Fetching data, please wait...");
          
          [Products, ProductPicker] = await Promise.all([
            this.fetchProductData(),
            this.fetchProductPickerData()
          ]);
          FileHelper.storeJSON(Products, 'products.json');
          FileHelper.storeJSON(ProductPicker, 'milk_product_picker.json');

        } else {

          console.log("Data already exists, using data cached in /data folder");

          Products = FileHelper.getFile('products.json');
          ProductPicker = FileHelper.getFile('milk_product_picker.json');

        }
        resolve({ Products, ProductPicker});
      } catch (err) {
        reject(err);
      }
    })
  }

  /**
   * Fetch Product data for each currencies
   * @param currencies 
   * @returns 
   */
  async fetchProductData(currencies?: string[]): Promise<{ [key: string]: Product[]}> {
    return new Promise( async (resolve, reject) => {
      try {
        if (!process.env.API_HOST_URI || process.env.API_HOST_URI === "") {
          throw new Error("Missing Api Host Uri, please provide API_HOST_URI in .env file");
        }
        if (!currencies) {
          currencies = Object.keys(Currency);
        }
        async.eachLimit(currencies, currencies.length, async (currency: string) => {
          console.log("Fetching ", currency);
          const productDto = await this._https.get(process.env.API_HOST_URI, `/products/${currency}`);
          this._products[currency] = productDto.Products.map( x => new Product(x));
        }, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(this._products);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Fetch MilkProductPicker Data
   * @returns 
   */
  async fetchProductPickerData(): Promise<ProductPicker[]> {
    return new Promise( async (resolve, reject) => {
      try {
        if (!process.env.BUCKET || process.env.BUCKET === "") {
          throw new Error("Missing Bucket name, please provide BUCKET in .env");
        }
        if (!process.env.S3_MILK_PRODUCT_PICKER_PATH || process.env.S3_MILK_PRODUCT_PICKER_PATH === "") {
          throw new Error("Missing milk_product_picker.json path, please provide S3_MILK_PRODUCT_PICKER_PATH in .env");
        }
        const s3Data = await this._aws.getS3Object({
          Key: process.env.S3_MILK_PRODUCT_PICKER_PATH,
          Bucket: process.env.BUCKET
        });
        console.log("Fetching MilkProductPicker data")
        this._productPicker = s3Data.map( x => new ProductPicker(x));
        resolve(this._productPicker);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Upload a file to S3 bucket
   * Bucket is set from .env file
   * @param data 
   * @param fileName 
   * @returns 
   */
  async updateData(data: any, path: string): Promise<void> {
    console.log("Uploading %s to S3", path);
    if (!process.env.BUCKET || process.env.BUCKET === "") {
      throw new Error("Missing Bucket name, please provide BUCKET in .env");
    }
    return this._aws.putS3Object({
      Bucket: process.env.BUCKET,
      Key: path,
      Body: FileHelper.stringToBuffer(JSON.stringify(data))
    });
  }

}