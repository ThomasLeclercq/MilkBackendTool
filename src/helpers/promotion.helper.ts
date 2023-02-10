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

  static findOutDatedPromotions(promotions: Promotion[]): Promotion[] {
    const now = new Date().getTime(); 
    return promotions.filter(x=> {
      const endDate = new Date(x.PromotionEndDateUtc).getTime();
      return endDate < now;
    })
  }

  static generateNewPromotionNamesArray(deprecatedPromotionNames: PromotionName[]): PromotionName[] {
    const deprecatedNames = deprecatedPromotionNames.map( x => x.Name);
    return PromotionNames.filter( x => {
      return !deprecatedNames.includes(x.Name);
    });
  }

  static findDuplicatedCampaigns(promotions: Promotion[]): Promotion[] {
    const uniquePromotions: Promotion[] = [];
    const duplicatedPromotions: Promotion[] = [];
    promotions.forEach(x => {
      if (!uniquePromotions.find( uniq => uniq.Name === x.Name && uniq.PromotionPageId === x.PromotionPageId)) {
        uniquePromotions.push(x);
      } else {
        duplicatedPromotions.push(x);
      }
    });
    return duplicatedPromotions;
  }

  static findPromotionsWithDifferentDiscountsinPageCount(promotions: Promotion[]): Promotion[] {
    return promotions.filter( promotion => {
      let promo: { discount: number, name: string, pageCount: number, promotion: string } = { discount: 0, name: "", pageCount: 0, promotion: promotion.Name };
      return promotion.Items.find( item => {
        if (promo.name !== item.CategoryName) {
          promo.name = item.CategoryName;
          promo.pageCount = item.NumberOfPages;
          promo.discount = item.Discount;
        }
        if (promo.name === item.CategoryName) {
          if (promo.pageCount !== item.NumberOfPages) {
            promo.pageCount = item.NumberOfPages;
            if (promo.discount !== item.Discount) {
              return true;
            }
          }
        }
        return false;
      }) !== undefined;
    });
  }

}