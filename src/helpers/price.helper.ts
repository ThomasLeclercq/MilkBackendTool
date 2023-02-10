import { Addon, OptionGroupName, Product } from "../models";

/**
 * Helper that provides Price information about a Product or AddOns
 */
export abstract class PriceHelper {
  static getMinimumPrice(prices: number[]): number { 
    return prices.filter( price => price !== 0).sort( (a: number, b: number) => (a-b))[0];
  }

  static getProductPrices(products: Product[]): number {
    return this.getMinimumPrice( products.map( x => x.Price) );
  }

  static getAddonPrices(products: Product[], optionGroupName: OptionGroupName): number { 
    const addonsPrices = []
    products.forEach( (product: Product) => {
      this.getAddonsByOptionGroupName(product.AddOns, optionGroupName)
        .forEach( addOn => addonsPrices.push(addOn.Price) );
    });
    return this.getMinimumPrice(addonsPrices);
  }

  static getVeganLeatherFabricAddonPrices(products: Product[]): number { 
    const addonsPrices = []
    products.forEach( (product: Product) => {
      this.getAddonsByOptionGroupName(product.AddOns, OptionGroupName.CoverFabric)
        .filter( x => x.Name.toLowerCase().includes('leather'))
        .forEach( addOn => addonsPrices.push(addOn.Price) );
    });
    return this.getMinimumPrice(addonsPrices);
  }

  private static getAddonsByOptionGroupName(addons: Addon[], optionGroupName: OptionGroupName): Addon[] {
    return addons.filter( (addOn: Addon) => addOn.OptionGroup === optionGroupName && addOn.Price !== 0);
  }
}