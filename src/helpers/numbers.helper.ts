export abstract class NumberHelper {
  static addZeroPrefix(number: number): string {
    if (number.toString().length === 1) {
      return "0" + number;
    }
    return number.toString();
  }
}