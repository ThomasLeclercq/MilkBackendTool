import { OptionGroupName } from "./Enums";

export type ProductTypeAlias = BookTypeAlias | AlbumTypeAlias | SoftCoverTypeAlias | MagazineTypeAlias | MoleskineTypeAlias | PresentationBoxTypeAlias;
export type BookTypeAlias = "MILKA-MSPB" | "MILKA-MLPB" | "MILKA-MPPB" | "MILKA-LSPB" | "MILKA-LLPB" | "MILKA-LPPB" | "MILKO-SLPB" | "MILKO-MLPB" | "MILKO-LLPB";
export type AlbumTypeAlias = "MILKA-MSPA" | "MILKA-MLPA" | "MILKA-MPPA" | "MILKA-LSPA" | "MILKA-LLPA" | "MILKA-LPPA" | "MILKO-MLPA" | "MILKO-LLPA";
export type SoftCoverTypeAlias = "MSSC" | "MLSC" | "MPSC";
export type MagazineTypeAlias = "WM";
export type MoleskineTypeAlias = "MSKCP" | "MSKMS" | "MSKML" | "MSKLM" | "MSKCL";
export type PresentationBoxTypeAlias = "MSPB" | "MPPB" | "MLPB" | "LSPB" | "LPPB" | "LLPB" | "LLPBO" | "MLPBO" | "LLB"

export interface ThemeMapType { Alias: ProductTypeAlias, Filename: string };
export const ThemeMap: ThemeMapType[] = [
  { Alias: "MILKA-MSPB", Filename: "1.json" },  
  { Alias: "MILKA-MPPB", Filename: "2.json" },  
  { Alias: "MILKA-MLPB", Filename: "3.json" },  
  { Alias: "MILKA-LSPB", Filename: "4.json" },  
  { Alias: "MILKA-LPPB", Filename: "5.json" },  
  { Alias: "MILKA-LLPB", Filename: "6.json" },  
  { Alias: "MILKA-MSPA", Filename: "33.json" },  
  { Alias: "MILKA-MLPA", Filename: "35.json" },  
  { Alias: "MILKA-MPPA", Filename: "34.json" },  
  { Alias: "MILKA-LSPA", Filename: "7.json" },  
  { Alias: "MILKA-LLPA", Filename: "9.json" },  
  { Alias: "MILKA-LPPA", Filename: "8.json" },  
  { Alias: "MILKO-SLPB", Filename: "45.json" },  
  { Alias: "MILKO-MLPB", Filename: "10.json" },  
  { Alias: "MILKO-LLPB", Filename: "12.json" },  
  { Alias: "MILKO-MLPA", Filename: "61.json" },  
  { Alias: "MILKO-LLPA", Filename: "27.json" },  
  { Alias: "MSSC", Filename: "68.json" },  
  { Alias: "MLSC", Filename: "70.json" },  
  { Alias: "MPSC", Filename: "69.json" },
  { Alias: "MSKCP", Filename: "18.json" },
  { Alias: "MSKMS", Filename: "14.json" },
  { Alias: "MSKML", Filename: "15.json" },
  { Alias: "MSKML", Filename: "16.json" },
  { Alias: "MSKCL", Filename: "17.json" },
  { Alias: "MSPB", Filename: "19.json" },
  { Alias: "MPPB", Filename: "20.json" },
  { Alias: "MLPB", Filename: "21.json" },
  { Alias: "LSPB", Filename: "22.json" },
  { Alias: "LPPB", Filename: "23.json" },
  { Alias: "LLPB", Filename: "24.json" },
  { Alias: "LLPBO", Filename: "25.json" },
  { Alias: "MLPBO", Filename: "62.json" },
]

export type ThemeSectionName = "Cover" | "Pages" | "PresentationBox" | "Jacket";
export interface Theme { 
  Id: string;
  Name: ThemeSectionName;
  Size: string;
  Asseturl: string;
  ProductType: string;
  Publisher: string;
  ProductCategory: string;
  LayoutGroupId: string;
  MaxPlaceholdersOnSpread: string;
  ThemeSections: ThemeSection[];
}

export interface ThemeSection {
  Name: string;
  Required: boolean;
  ProductWidthMm: number;
  ProductHeightMm: number;
  ProductPosXMm: number;
  ProductPosYMm: number;
  PageNumMin: number;
  PageNumMax: number;
  NumFreePages: number;
  PageNumMultiple: number;
  DefaultLayoutId: string;
  PdfWidthMm: number;
  PdfHeightMm: number;
  PdfTrimWidthMm: number;
  PdfTrimHeightMm: number;
  PdfTrimPosXMm: number;
  PdfTrimPosYMm: number;
  RoundedCorners: string;
  ShadowImageUrl: string;
  SafeZoneMarginMm: number;
  GutterZoneWidthMm: number;
  SnapToSafeZone: boolean;
  SCCoverShadowUrl: string;
  Layouts: Layout[];
  ThemeOptions: ThemeSection[];
  ThemeOptionImages: ThemeOptionImage[];
}

export interface Layout {
  Name: string;
  AssetCount: number;
  LayoutType: string;
  LayoutGUID: string;
  BackgroundImageUrl: string;
  ImagePlaceholders: ImagePlaceholder[];
  TextPlaceholders: TextPlaceholder[];
}

export interface ImagePlaceholder {
  Top: number;
  Left: number;
  Width: number;
  Height: number;
  Circle: boolean;
  Bleed: string;
}

export interface TextPlaceholder {
  Top: number;
  Left: number;
  Width: number;
  Height: number;
  FontSizes: number[];
  FontSize: number;
  FontStyles: string[];
  HorizontalAlignment: string;
  VerticalAlignment: string;
  LineHeight: number;
  Kerning: number;
  MirrorHorizontalAlignment: boolean;
}

export interface ThemeOption {
  OptionGroupName: OptionGroupName;
}

export interface ThemeOptionImage {
  Id: number;
  Url: string;
  UrlBackground: string;
  AssetUrl: string;
  OptionGroupName: OptionGroupName;
  OptionValue: string;
  Label: string;
  RelOptionName?: OptionGroupName;
  RelOptionValue?: string;
}
