import { Orientation, Product, ProductCategoryName, ProductPicker, Size } from "../models";
import { SizeHelper } from "./size.helper";

/**
 * Helper that sorts Products by their Category or Size
 */
export abstract class ProductCategoryHelper {

  static getCategoryProducts(productCategoryName: ProductCategoryName, productPickerData: ProductPicker[], products: Product[]): Product[] { 
    if (productCategoryName === 'Leather Photo Albums') {
      return this.getLeatherPhotoAlbumsProducts(productPickerData, products);
    }
    const productIds = productPickerData.filter( x => x.ProductCategory === productCategoryName).map( x => x.ProductId);
    return products.filter( x => productIds.includes(x.Id) );
  }

  static getLeatherPhotoAlbumsProducts(productPickerData: ProductPicker[], products: Product[]): Product[] {
    return this.getCategoryProducts('Premium Photo Albums', productPickerData, products);
  }

  static getProductsBySize(products: Product[], size: Size): Product[] {
    return products.filter( x => SizeHelper.isProductOfSize(x.Name, size));
  }

  static getProductsByOrientation(products: Product[], orientation: Orientation): Product[] {
    return products.filter( x => SizeHelper.isProductOfOrientation(x.Name, orientation));
  }

  static getCategorySizes(products: Product[]): Size[] {
    const sizes = [];
    products.forEach( x => {
      const size = SizeHelper.getProductSize(x.Name);
      if ( !sizes.includes(size) ) {
        sizes.push(size);
      }
    });
    return sizes;
  }

}