import { Orientation, Size } from "../models";
/**
 * Helper that provides information about a Product sizes
 */
export abstract class SizeHelper {

  static getProductSize(productName: string): Size {
    if (this.isSmall(productName)) {
      return Size.Small;
    }
    if (this.isMedium(productName)) {
      return Size.Medium;
    }
    if (this.isLarge(productName)) {
      return Size.Large;
    }
    if (this.isClassic(productName)) {
      return Size.Classic;
    }
    if (this.isMonograph(productName)) {
      return Size.Monograph;
    }
  }

  static isProductOfSize(productName: string, size: Size): boolean {
    return this.getProductSize(productName) === size;
  }

  static isSmall(productName: string): boolean {
    return productName.toLowerCase().includes(Size.Small.toLowerCase());
  }

  static isMedium(productName: string): boolean {
    return productName.toLowerCase().includes(Size.Medium.toLowerCase());
  }

  static isLarge(productName: string): boolean {
    return productName.toLowerCase().includes(Size.Large.toLowerCase());
  }

  static isClassic(productName: string): boolean {
    return productName.toLowerCase().includes(Size.Classic.toLowerCase());
  }

  static isMonograph(productName: string): boolean {
    return productName.toLowerCase().includes(Size.Monograph.toLowerCase());
  }

  static getProductOrientation(productName: string): Orientation {
    if (this.isSquare(productName)) {
      return Orientation.Square;
    }
    if (this.isLandscape(productName)) {
      return Orientation.Landscape;
    }
    if (this.isPortrait(productName)) {
      return Orientation.Portrait;
    }
    return undefined;
  }

  static isProductOfOrientation(productName: string, orientation: Orientation): boolean {
    return this.getProductOrientation(productName) === orientation;
  }

  static isSquare(productName: string): boolean {
    return productName.toLocaleLowerCase().includes(Orientation.Square.toLocaleLowerCase());
  }

  static isLandscape(productName: string): boolean {
    return productName.toLocaleLowerCase().includes(Orientation.Landscape.toLocaleLowerCase());
  }

  static isPortrait(productName: string): boolean {
    return productName.toLocaleLowerCase().includes(Orientation.Portrait.toLocaleLowerCase());
  }

}