import { Promotion, PromotionName, PromotionNames } from "../models";

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

  static cleanNameForTranslation(name: string): string {
    let cleaned = name;
    if (name.includes("MILK A")) {
      cleaned = cleaned.replace("MILK A", "Premium");
    }
    if (name.includes("MILKA")) {
      cleaned = cleaned.replace("MILKA", "Premium");
    }
    if (name.includes("MILKO")) {
      cleaned = cleaned.replace("MILKO", "Classic");
    }
    if (name.includes("MILK")) {
      if (!name.includes("PRINT") && !name.includes("Pages")) {
        cleaned = cleaned.replace("MILK ", "");
      }
    }
    if (name.includes(" - Original")) {
      cleaned = cleaned.replace(" - Original", "");
      cleaned =`Classic ${cleaned}`;
    }
    if (name.includes(" - O")) {
      if (!name.includes(" - Original")) {
        cleaned = cleaned.replace(" - O", "");
        cleaned =`Classic ${cleaned}`;
      }
    }
    if (name.includes("O ")) {
      if (!name.includes(" - Original") && !name.includes("- O")) {
        cleaned = cleaned.replace("O ", "Classic ");
      }
    }
    if (name.includes("Leather")) {
      cleaned = cleaned.replace("Leather", "");
      cleaned = `Leather ${cleaned}`;
    }
    if (name.includes("Albums") || name.includes("Books")) {
      if (!name.includes("Photo")) {
        cleaned = cleaned.replace("Albums", "Photo Albums");
        cleaned = cleaned.replace("Books", "Photo Books");
      }
    }
    if (name.includes("Magazine")) {
      if (name.includes("Portrait")) {
        cleaned = cleaned.replace("Portrait Magazine", "Wedding Magazine");
      }
      if (name.includes("Wedding")) {
        cleaned = cleaned.replace("Wedding Magazines", "Magazines");
      }
    }
    if (name.includes("Softcover")) {
      if (name.includes("Luxe")) {
        cleaned = cleaned.replace("Luxe ", "");
      }
    }
    if (name.includes("Soft Cover")) {
      cleaned = cleaned.replace("Soft Cover", "Softcover");
    }
    if (name.includes("MSK")) {
      cleaned = cleaned.replace("MSK", "Moleskine");
    }
    if (name.includes("MKT - ")) {
      cleaned = cleaned.replace("MKT - ", "");
    }
    if (name.includes("MKT ")) {
      cleaned = cleaned.replace("MKT ", "");
    }
    if (name.includes("P Bks")) {
      cleaned = cleaned.replace("P Bks", "Photo Books");
    }
    if (name.includes("Pge")) {
      cleaned = cleaned.replace("Pge", "Pages");
    }
    if (name.includes("Med")) {
      if (!name.includes("Medium")) {
        cleaned = cleaned.replace("Med", "Medium");
      }
    }
    if (name.includes("Lrg")) {
      cleaned = cleaned.replace("Lrg", "Large");
    }
    if (name.includes(" PB")) {
      cleaned = cleaned.replace(" PB", " Photo Book");
    }
    if (name.includes("Albms")) {
      cleaned = cleaned.replace("Albms", "Albums");
    }
    if (name.includes("Pres Box")) {
      cleaned = cleaned.replace("Pres Box", "Presentation Box");
    }
    if (name.includes("L/P")) {
      cleaned = cleaned.replace("L/P", "Landscape/Portrait");
    }
    if (name.includes("LP/LL")) {
      cleaned = cleaned.replace("LP/LL", "Large Landscape/Large Portrait");
    }
    if (name.includes("MPB")) {
      cleaned = cleaned.replace("MPB", "Medium Photo Book");
    }
    if (name.includes("LLPB")) {
      cleaned = cleaned.replace("LLPB", "Large Landscape Photo Book");
    }
    if (name.includes("LSPB")) {
      cleaned = cleaned.replace("LSPB", "Large Square Photo Book");
    }
    if (name.includes("LPPB")) {
      cleaned = cleaned.replace("LPPB", "Large Portrait Photo Book");
    }
    if (name.includes("MLPB")) {
      cleaned = cleaned.replace("MLPB", "Medium Landscape Photo Book");
    }
    if (name.includes("MSPB")) {
      cleaned = cleaned.replace("MSPB", "Medium Square Photo Book");
    }
    if (name.includes("MPPB")) {
      cleaned = cleaned.replace("MPPB", "Medium Portrait Photo Book");
    }
    if (name.includes("LLPA")) {
      cleaned = cleaned.replace("LLPA", "Large Landscape Photo Album");
    }
    if (name.includes("LSPA")) {
      cleaned = cleaned.replace("LSPA", "Large Square Photo Album");
    }
    if (name.includes("LPPA")) {
      cleaned = cleaned.replace("LPPA", "Large Portrait Photo Album");
    }
    if (name.includes("MLPA")) {
      cleaned = cleaned.replace("MLPA", "Medium Landscape Photo Album");
    }
    if (name.includes("MSPA")) {
      cleaned = cleaned.replace("MSPA", "Medium Square Photo Album");
    }
    if (name.includes("MPPA")) {
      cleaned = cleaned.replace("MPPA", "Medium Portrait Photo Album");
    }
    if (name.includes("LLCA")) {
      cleaned = cleaned.replace("LLCA", "Large Landscape Photo Album");
    }
    return cleaned;
  }

}