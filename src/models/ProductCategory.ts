import { PriceHelper, ProductCategoryHelper } from "../helpers";
import { CategoryOption } from "./CategoryOption";
import { CategoryOptions, ProductCategoryName } from "./Constants";
import { Currency, OptionGroupName, Orientation, ProductNameAlias, Size } from "./Enums";
import { Price } from "./Price";
import { Product } from "./Product";
import { ProductPicker } from "./ProductPicker";

/**
 * Main Object of compare-range.json data
 * Holds information about a "Range" and its options
 * Responsible of retrieving data from milk_product_picker.json and products.json
 */
export class ProductCategory {
  Name: ProductCategoryName;
  Alias: string;
  Price: Price;
  CategoryOptions: CategoryOption[] = [];

  constructor(name: ProductCategoryName) {
    this.Name = name;
    this.Alias = ProductNameAlias[name];
    this.Price = new Price();
  }

  hydrateFromProductPickerAndProductJSONs(productPickerData: ProductPicker[], allProducts: { [key: string]: Product[] }): void {
    const currencies = Object.keys(Currency);
    currencies.forEach( (currency: Currency) => {

      const products = ProductCategoryHelper.getCategoryProducts(this.Name, productPickerData, allProducts[currency]);

      // Set Price for the category
      const amount = PriceHelper.getProductPrices(products);
      this.Price.setPrice(amount, currency);

      // Generate one Section per size and set its price
      const sizes = ProductCategoryHelper.getCategorySizes(products);
      sizes.forEach( (size: Size) => {
        CategoryOptions.forEach( priceCategory => {
          let categoryOption = this.CategoryOptions.find(x => x.Name == priceCategory.Label && x.Size == size);
          if (!categoryOption) {
            categoryOption = new CategoryOption(this.Name, priceCategory, size);
            this.CategoryOptions.push( categoryOption );
          }
          const sizedProducts = ProductCategoryHelper.getProductsBySize(products, size);
          categoryOption.setPrice(priceCategory, sizedProducts, currency);

          // Exception for Square Format on Premium Photo Books
          if (priceCategory.OptionGroupName === OptionGroupName.PageExtent && size === Size.Large && this.Name === "Premium Photo Books") {
            let squareCategoryOption = this.CategoryOptions.find(x => x.Name == priceCategory.Label && x.Size == size && x.Orientation == Orientation.Square);
            if (!squareCategoryOption) {
              squareCategoryOption = new CategoryOption(this.Name, priceCategory, size, Orientation.Square);
              this.CategoryOptions.push( squareCategoryOption );
            }
            squareCategoryOption.setPrice(priceCategory, sizedProducts, currency);
          }
        })
      });

    });

    this.CategoryOptions = this.CategoryOptions.filter( x => !x.Price.isNull() );
  }

}