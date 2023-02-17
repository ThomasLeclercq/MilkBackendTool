import { OptionGroupName } from "./Enums";

export type Culture = "en" | "de" | "fr" | "es" | "it" | "pt";
export type Region = "en-US" | "fr-FR" | "de-DE" | "it-IT" | "es-ES" | "pt-BR";

export type ProductCategoryName = 
'Premium Photo Books' | 'Classic Photo Books' | 
'Premium Photo Albums' | 'Classic Photo Albums' | 'Leather Photo Albums' | 
'Moleskine Photo Books' |
'Magazines' | 'Soft Cover Photo Books';

export const ProductCategoryNames: ProductCategoryName[] = [
  'Premium Photo Books',
  'Classic Photo Books',
  'Premium Photo Albums',
  'Classic Photo Albums',
  'Magazines',
  'Leather Photo Albums',
  'Moleskine Photo Books',
  'Soft Cover Photo Books'
];

export type CategoryOptionName = "Extra Pages" | "Presentation Box" | "Designer Cover" | "Jacket" | "Vegan Leather" | "Paper Extra" | "Debrand";
export interface CategoryOptionLabel { Label: CategoryOptionName, OptionGroupName: OptionGroupName }; 
export const CategoryOptions: CategoryOptionLabel[] = [
  { Label: 'Extra Pages', OptionGroupName: OptionGroupName.PageExtent },
  { Label: 'Presentation Box', OptionGroupName: OptionGroupName.PresentationBoxCover },
  { Label: 'Designer Cover', OptionGroupName: OptionGroupName.Foiling },
  { Label: 'Jacket', OptionGroupName: OptionGroupName.Jacket },
  { Label: 'Vegan Leather', OptionGroupName: OptionGroupName.CoverFabric },
  { Label: 'Debrand', OptionGroupName: OptionGroupName.Debrand },
  { Label: 'Paper Extra', OptionGroupName: OptionGroupName.InternalsPaperStock },
]

export type ProductCategoryAlias = "MILKO-PB" | "MILKO-PA" | "MILKA-PB" | "MILKA-PA" | "MAG" | "SC" | "MSK";

export interface Dictionary { [key:string]: string }
