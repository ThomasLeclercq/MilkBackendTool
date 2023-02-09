import https from 'https';

export class HttpsProvider {
  
  private _headers: { [key:string]: string };

  constructor(apiKey: string) { 
    if (!apiKey || apiKey === "") {
      throw new Error("Api Key is missing, please providing MILKAPIKEY in .env");
    }
    this._headers = {
      "X-MILK-Api-Key": apiKey,
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  }

  async get(host: string, path: string): Promise<any> {
    return new Promise( async (resolve, reject) => {
      try {
        const req = https.request({host, path, method: 'GET', port: 443, headers: this._headers}, (res) => {
          var data = "";

          res.on('data', (chunk: Buffer) => {
            data += chunk;
          });

          res.on('end', () => resolve( JSON.parse( data.toString() ) ));

        });

        req.on('error', (err) => reject(err));
        req.end();

      } catch (err) {
        console.error(`<> https://${host}${path} request failed <> `, err.message);
        reject(err);
      }
    });
  }
}