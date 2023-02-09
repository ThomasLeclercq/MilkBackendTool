import { Promotion, PromotionName, PromotionNames } from "../models/Promotion";

/** 
 * Used to browse and filer Promotions from promotion_discounts.json on Hawk data.
*/
export abstract class PromotionHelper {

  static findCategoryNameInPromotions(promotions: Promotion[], promotionName: PromotionName): Promotion | undefined {
    return promotions.find( x => {
      return x.Items.find( item => item.CategoryName === promotionName.Name) !== undefined
    });
  }

  static getDeprecatedPromotionNames(promotions: Promotion[]): PromotionName[] {
    const promotionNames: PromotionName[] = [];
    PromotionNames.forEach( x => {
      if (this.findCategoryNameInPromotions(promotions, x) === undefined) {
        promotionNames.push(x);
      }
    })
    return promotionNames;
  }

  static generateNewPromotionNamesArray(deprecatedPromotionNames: PromotionName[]): PromotionName[] {
    const deprecatedNames = deprecatedPromotionNames.map( x => x.Name);
    return PromotionNames.filter( x => {
      return !deprecatedNames.includes(x.Name);
    });
  }

}