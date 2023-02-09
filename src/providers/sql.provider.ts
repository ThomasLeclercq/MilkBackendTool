import { Connection, ConnectionConfig, Request } from "tedious";

export class SqlProvider {
  private readonly _sql: Connection;
  private readonly _config: ConnectionConfig;

  constructor(server: string, database: string, userName: string, password: string) {
    if (
      !server || !database || !userName || !password || 
      server === "" || database === "" || userName === ""
    ) {
      throw new Error("Missing info for SQL connection, please provide SQL_SERVER, SQL_DATABASE, SQL_USERNAME, SQL_PASSWORD in .env file");
      
    }
    this._config = {
      server,
      authentication: {
        type: 'default',
        options: {
          userName,
          password
        },
      },
      options: {
        database,
        rowCollectionOnRequestCompletion: true,
        encrypt: false, 
        trustServerCertificate: true, 
        cancelTimeout: 30 * 1000,
        requestTimeout: 30 * 1000
      }
    };
    this._sql = new Connection(this._config);
  }

  async connect(): Promise<void> {
    return new Promise( (resolve, reject) => {
      this._sql.on('connect', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
      this._sql.connect();
    });
  }

  async disconnect(): Promise<void> {
    return new Promise( (resolve, reject) => {
      this._sql.on("end", () => {
        resolve();
      });
      this._sql.close();
    });
  }

  async query(q: string): Promise<any[]> {
    if (process.env.DEBUG === "true") {
      console.log(q);
    }
    return new Promise( (resolve, reject) => {
      const request = new Request(q, (err, count, rows) => {
        if (err) {
          reject(err);
        } else {
          if (process.env.DEBUG === "true") {
            console.log(`Found ${count} results`);
          }
          resolve(this._formatResponse({ count, rows }));
        }
      });
      this._sql.execSql(request);
    });
  }

  private _formatResponse(response: {count: number, rows: any[]}): {[key: string]: string}[] {
    let formattedResponse: {[key: string]: string}[] = [];
    if (response.count && response.rows.length) {
      for (const row of response.rows) {
        const formattedRow: {[key: string]: string} = {};
        for (const column of row) {
          formattedRow[column.metadata.colName] = column.value;
        }
        formattedResponse.push(formattedRow)
      }
    }
    return formattedResponse;
  }

}