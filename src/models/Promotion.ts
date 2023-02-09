export interface Promotion {
  PromotionPageId: number;
  Name: string;
  PromotionStartDateUtc: string;
  PromotionEndDateUtc: string;
  Items: PromotionItem[]
}

export interface PromotionItem {
  ItemId: string;
  CategoryName: string;
  NumberOfPages: number;
  Discount: number;
  IsProductBasedPromotion: boolean;
  FreePages: number;
  Products: number[];
}

export interface PromotionName { Name: string, DisplayName: string };
export const PromotionNames: PromotionName[] = [
  { "Name": "MILKA Photo Books", "DisplayName": "MILK Premium Photo Books" },
  { "Name": "MILKA Albums", "DisplayName": "MILK Premium Albums" },
  { "Name": "MILKO Photo Books", "DisplayName": "Classic Photo Books" },
  { "Name": "MILKO Albums", "DisplayName": "MILK Classic Albums" },
  { "Name": "MKT MILKA Medium Photo Books", "DisplayName": "MILK Premium Medium Photo Books" },
  { "Name": "MKT MILKA Large Photo Books", "DisplayName": "MILK Premium Large Photo Books" },
  { "Name": "MKT MILKA Photo Albums", "DisplayName": "MILK Premium Photo Albums" },
  { "Name": "MKT All Photo Books and Albums", "DisplayName": "MILK Photo Books and Albums" },
  { "Name": "MKT Large Formats", "DisplayName": "Large format Photo Books and Albums" },
  { "Name": "MKT MILK A Boxes", "DisplayName": "MILK Premium Presentation Boxes" },
  { "Name": "MKT MILKO MLPB", "DisplayName": "MILK Classic Medium Landscape Photo Book" },
  { "Name": "MKT MILKO LLPB", "DisplayName": "MILK Classic Large Landscape Photo Book" },
  { "Name": "MKT MOLESKINE Medium PB", "DisplayName": "Moleskine Photo Books" },
  { "Name": "MKT MOLESKINE Classics", "DisplayName": "Moleskine Classic Photo Books" },
  { "Name": "MKT MOLESKINE Monograph", "DisplayName": "Moleskine Monograph Photo Book" },
  { "Name": "MKT MILKA LLPB and LPPB", "DisplayName": "MILK Premium Photo Book" },
  { "Name": "MKT MILKA LSPB", "DisplayName": "MILK Premium Large Square Photo Book" },
  { "Name": "MKT MILK A - 160 page Large PB", "DisplayName": "MILK Premium 160 page Large Photo Book" },
  { "Name": "MKT MILKO LLPB - with box", "DisplayName": "MILK Classic Large Landscape Photo Book + Box" },
  { "Name": " missing name? ", "DisplayName": "MILK Premium Large Landscape + Portrait Photo Book + Box" },
  { "Name": "MKT MILKA MPB - Box", "DisplayName": "MILK Premium Medium Photo Book + Pres Box" },
  { "Name": "MKT MILK A MEDIUM LANDSCAPE PH", "DisplayName": "MILK Premium Medium Landscape" },
  { "Name": "MKT All MILK Books and Albums", "DisplayName": "MILK Photo Books + Albums" },
  { "Name": "MKT Books with a Box", "DisplayName": "MILK Photo Book + Pres Box" },
  { "Name": "MKT All Photo Books", "DisplayName": "MILK Photo Books" },
  { "Name": "MKT - ALL MILK O Product", "DisplayName": "MILK Classic Range" },
  { "Name": "MILKA Pres Box", "DisplayName": "Premium Presentation Box" },
  { "Name": "MKT - ALL Photo Albums", "DisplayName": "MILK Photo Album" },
  { "Name": "MILKO Pres Box", "DisplayName": "Classic Presentation Box" },
  { "Name": "MKT - MILKA Albums + Box", "DisplayName": "MKT - MILKA Albums + Box" },
  { "Name": "MKT ALL MILK & Pages", "DisplayName": "MKT ALL MILK & Pages" },
  { "Name": "MKT All Photo Books+Box+UV+Pge", "DisplayName": "All Photo Books + upgrades" },
  { "Name": "MKT Premium Photo Books", "DisplayName": "Premium Photo Books" },
  { "Name": "MKT Premium Photo Albums", "DisplayName": "Premium Photo Albums" },
  { "Name": "MKT Premium Leather Photo Albums", "DisplayName": "Premium Leather Photo Albums" },
  { "Name": "Large Photo Books LP/LL", "DisplayName": "Large Photo Books Portrait and Landscape" },
  { "Name": "MKT Classic Photo Book Set", "DisplayName": "Classic 3 Piece Photo Book Set" },
  { "Name": "MKT Premium Photo Book Set", "DisplayName": "Premium 3 Piece Photo Book Set" },
  { "Name": "MKT Premium Wedding Album Set", "DisplayName": "Premium 3 Piece Wedding Album Set" },
  { "Name": "MKT Classic Family Set", "DisplayName": "Classic 3 Piece Family Set" },
  { "Name": "MKT Premium Family Set", "DisplayName": "Premium 3 Piece Family Set" },
  { "Name": "MKT Classic Wedding Album Set", "DisplayName": "Classic 3 Piece Wedding Album Set" },
  { "Name": "MKT Classic Baby Set", "DisplayName": "Classic 3 Piece Baby Set" },
  { "Name": "MKT MILKA Lrg Albums", "DisplayName": "Large Premium Wedding Album" },
  { "Name": "MKT MILKA Lrg Albums Leather", "DisplayName": "Large Premium Leather Wedding Album" },
  { "Name": "MKT MILKA Med Albums", "DisplayName": "Medium Premium Albums" },
  { "Name": "MKT MILKA Med Albums Leather", "DisplayName": "Medium Premium Leather Albums" },
  { "Name": "MKT MILKA Med Albums Leathers", "DisplayName": "Medium Premium Leather Albums" },
  { "Name": "MKT Soft Cover Photo Books", "DisplayName": "Soft Cover Photo Books" },
  { "Name": "MKT Magazines", "DisplayName": "Wedding Magazines" }
];