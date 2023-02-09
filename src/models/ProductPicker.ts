import { ProductCategoryName } from "./Constants";
import { ProductType, Publisher } from "./Enums";
/**
 * ProductPicker Type obtained from milk_product_picker.json
 */
export class ProductPicker {
  ProductCategory: ProductCategoryName;
  ProductId: number;
  Label: string;
  ProductType: ProductType;
  Publisher: Publisher;
  PageCount: number[];

  constructor(data) {
    this.ProductCategory = data.ProductCategory;
    this.ProductId = data.ProductId;
    this.Label = data.Label;
    this.ProductType = ProductType[data.ProductType];
    this.Publisher = Publisher[data.Publisher];
    this.PageCount = data.PageCount;
  }

}