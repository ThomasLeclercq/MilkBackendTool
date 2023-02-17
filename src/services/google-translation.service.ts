import * as dotenv from 'dotenv';
dotenv.config()

import { TranslationServiceClient } from '@google-cloud/translate';
import { google } from '@google-cloud/translate/build/protos/protos';
import { Culture, Dictionary } from '../models/Constants';

export class GoogleTranslationService {

  private readonly _googleClient: TranslationServiceClient;

  constructor() {
    if (!process.env.GOOGLE_TRANSLATE_PROJECT_ID || process.env.GOOGLE_TRANSLATE_PROJECT_ID === "") {
      throw new Error("Please define GOOGLE_TRANSLATE_PROJECT_ID in .env file to be able to use Google Translate service");
    }
    if (!process.env.GOOGLE_TRANSLATE_LOCATION || process.env.GOOGLE_TRANSLATE_LOCATION === "") {
      throw new Error("Please define GOOGLE_TRANSLATE_LOCATION in .env file to be able to use Google Translate service");
    }
    this._googleClient = new TranslationServiceClient();
  }

  async translateText(texts: string[], targetLanguageCode: Culture): Promise<string[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const req: google.cloud.translation.v3.ITranslateTextRequest = {
          parent: `projects/${process.env.GOOGLE_TRANSLATE_PROJECT_ID}/locations/${process.env.GOOGLE_TRANSLATE_LOCATION}`,
          contents: texts,
          mimeType: "text/plain",
          sourceLanguageCode: "en",
          targetLanguageCode
        };
        const [response]: [google.cloud.translation.v3.ITranslateTextResponse, google.cloud.translation.v3.ITranslateTextRequest, {}] = await this._googleClient.translateText(req);
        const translations: string[] = response.translations.map(x=>x.translatedText);
        resolve(translations);
      } catch(err) {
        reject(err);
      }
    })
  }

  async translateDictionary(dictionary: Dictionary, language: Culture, translateOnlyEmptyFields: boolean = false): Promise<Dictionary> {
    return new Promise( async (resolve, reject) => {
      try {
        const toTranslate = translateOnlyEmptyFields ? Object.keys(dictionary).filter( x => dictionary[x] === "") : Object.keys(dictionary);
        const translated = await this.translateText(toTranslate, language);
        Object.keys(dictionary).forEach( (key: string, index: number) => {
          if (toTranslate.includes(key)) {
            dictionary[key] = translated[index];
          }
        });
        resolve(dictionary);
      } catch (err) {
        reject(err);
      }
    })
  }

}