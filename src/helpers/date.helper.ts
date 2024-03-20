import { NumberHelper } from "./numbers.helper";

export abstract class DateHelper {

  public static getStringMonth(monthIndex: number): string {
    switch(monthIndex) {
      case 0:
        return "January";
      case 1:
        return "February";
      case 1:
        return "March";
      case 3:
        return "April";
      case 4:
        return "May";
      case 5:
        return "June";
      case 6:
        return "July";
      case 7:
        return "August";
      case 8:
        return "September";
      case 9:
        return "October";
      case 10:
        return "November";
      case 11:
        return "December";
    }
  }

  public static addZeroPrefix(number: number): string {
    return NumberHelper.addZeroPrefix(number);
  }

}