
import { PriceHelper, ProductCategoryHelper } from "../helpers";
import { CategoryOptionLabel, CategoryOptionName, ProductCategoryName } from "./Constants";
import { Currency, Orientation, OrientationAlias, ProductNameAlias, SectionNameAlias, Size, SizeAlias } from "./Enums";
import { Price } from "./Price";
import { Product } from "./Product";

/**
 * Options of a ProductCategory that is used for the compare-range.json data
 * Name
 * Alias
 * Size
 * Price
 */
export class CategoryOption {
  Name: CategoryOptionName;
  Alias: string;
  Size: Size;
  Orientation?: Orientation;
  Price: Price = new Price();

  constructor(categoryName: ProductCategoryName, optionGroup: CategoryOptionLabel, size: Size, orientation?: Orientation) {
    this.Name = optionGroup.Label;
    this.Size = size;
    this.Alias = ProductNameAlias[categoryName] + "-" + SizeAlias[size] + "-" + SectionNameAlias[this.Name];
    if (orientation) {
      this.Orientation = orientation;
      this.Alias = ProductNameAlias[categoryName] + "-" + SizeAlias[size] + "-" + OrientationAlias[this.Orientation] + "-" + SectionNameAlias[this.Name];
    }
  }

  setPrice(sectionOptionGroup: CategoryOptionLabel, products: Product[], currency: Currency): void {
    let amount = 0;
    if (this.Name === "Vegan Leather") {
      amount = PriceHelper.getVeganLeatherFabricAddonPrices(products);
    } else {
      if (this.Orientation) {
        products = ProductCategoryHelper.getProductsByOrientation(products, this.Orientation); 
      }
      amount = PriceHelper.getAddonPrices(products, sectionOptionGroup.OptionGroupName);
    }
    this.Price.setPrice(amount, currency);
  }

}