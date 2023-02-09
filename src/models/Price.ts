import { Currency } from "./Enums";
/**
 * Price class used to store Currency prices
 */
export class Price {
  USD: number;
  EUR: number;
  NZD: number;
  AUD: number;
  GBP: number;
  CAD: number;
  HKD: number;

  constructor() { }

  setPrice(amount: number, currency: Currency) {
    if (this.hasOwnProperty(currency)) {
      this[currency] = amount;
    } 
  }

  isNull(): boolean {
    return (this.USD === undefined && 
      this.EUR === undefined &&
      this.NZD === undefined &&
      this.AUD === undefined &&
      this.GBP === undefined &&
      this.CAD === undefined &&
      this.HKD === undefined ) 
      || 
      (this.USD === 0 && 
        this.EUR === 0 &&
        this.NZD === 0 &&
        this.AUD === 0 &&
        this.GBP === 0 &&
        this.CAD === 0 &&
        this.HKD === 0 )
  }

}
