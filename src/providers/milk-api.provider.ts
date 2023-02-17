import { HttpsProvider } from "./https.provider";

export class MilkApiProvider extends HttpsProvider {
  
  constructor(apiKey: string) {
    super();
    if (!apiKey || apiKey === "") {
      throw new Error("Api Key is missing, please providing MILKAPIKEY in .env");
    }
    this._headers = {
      ...this._headers,
      "X-MILK-Api-Key": apiKey,
    }
  }

}