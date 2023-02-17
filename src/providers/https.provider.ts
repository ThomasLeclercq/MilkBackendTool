import https from 'https';

export class HttpsProvider {
  
  protected _headers: { [key:string]: string };

  constructor() { 
    this._headers = {
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

  async post(host: string, path: string, body?: string): Promise<any> {
    return new Promise( async (resolve, reject) => {
      try {
        const req = https.request({hostname: host, path, method: 'POST', port: 443, headers: this._headers}, (res) => {
          var data = "";

          res.on('data', (chunk: Buffer) => {
            data += chunk;
          });

          res.on('end', () => resolve( JSON.parse( data.toString() ) ));

        });

        req.on('error', (err) => reject(err));
        if (body) {
          req.write(body);
        }
        req.end();

      } catch (err) {
        console.error(`<> https://${host}${path} request failed <> `, err.message);
        reject(err);
      }
    });
  }
}