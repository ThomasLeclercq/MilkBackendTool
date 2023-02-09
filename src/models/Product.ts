import { Currency, OptionGroupName } from "./Enums";
/**
 * Product Type obtained from products.json
 */
export class Product {
  Id: number;
  Name: string;
  Price: number;
  Currency: Currency;
  AddOns: Addon[];
  OptionGroups: { Name: OptionGroupName, AddOns: Addon[] }[];

  constructor(data) {
    this.Id = data.Id;
    this.Name = data.Name;
    this.Price = data.Price;
    this.Currency = Currency[data.Currency];
    this.AddOns = data.AddOns.map( x => new Addon(x));
    this.OptionGroups = data.OptionGroups.map( x => ({ 
      Name: OptionGroupName[x.Name],
      Addons: x.AddOns.map( x => new Addon(x))
    }));
  }
}

export interface AddonDto {
  Id: number;
  Name: string;
  OptionGroup: string;
  Price: number;
}

export class Addon implements AddonDto {
  Id: number;
  Name: string;
  OptionGroup: OptionGroupName;
  Price: number;

  constructor(dto: AddonDto) {
    this.Id = dto.Id;
    this.Name = dto.Name;
    this.OptionGroup = OptionGroupName[dto.OptionGroup];
    this.Price = dto.Price;
  }
}