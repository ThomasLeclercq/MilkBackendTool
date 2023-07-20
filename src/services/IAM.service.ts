import { AwsProvider } from "../providers/aws.provider";

export interface IAMDocument {
  RoleName: string;
  PolicyName: string;
  PolicyDocument: string;
}

export type AWSServiceName = "dynamodb" | "s3" | "lambda" | "iam" | "ec2";
export type AWSIAMDocumentAttribute = "Action" | "Resource" | "Effect";

export type AWSEventName = AWSDynamoEventName | AWSS3EventName;
export type AWSDynamoEventName = "dynamodb:GetItem" | "dynamodb:DeleteItem" | "dynamodb:PutItem" | "dynamodb:Scan" | "dynamodb:Query" | "dynamodb:UpdateItem" | "dynamodb:BatchWriteItem" | "dynamodb:BatchGetItem" | "dynamodb:DescribeTable" | "dynamodb:ConditionCheckItem"
export type AWSS3EventName = "s3:GetObject"|"s3:GetObjectAcl"|"s3:GetObjectVersion"|"s3:PutObject"|"s3:PutObjectAcl"|"s3:DeleteObject"|"s3:DeleteObjectTagging"|"s3:DeleteObjectVersionTagging"|"s3:GetObjectTagging"|"s3:GetObjectVersionTagging"|"s3:PutObjectTagging"|"s3:PutObjectVersionTagging";

export class IAMService {

  constructor(private _awsProvider: AwsProvider) { }

  async getPolicies(event?: AWSEventName, resource?: string, effect: "Allow" | "Deny" = "Allow"): Promise<IAMDocument[]> {
    try {
      let documents = await this._getPoliciesDocuments();
      console.log("Total Documents: %s", documents.length);
      if (event) {
        documents = await this._filterPoliciesByEvent(documents, event);
        console.log("Found %s Documents with event %s", documents.length, event);
      }
      if (resource) {
        documents = await this._filterPoliciesByResource(documents, resource);
        console.log("Found %s Documents with resource %s", documents.length, resource);
      }
      documents = await this._filterPoliciesByEffect(documents, effect);
      console.log("Found %s Documents with effect %s", documents.length, effect);
      return documents;
    } catch(e) {
      console.error(e);
      return [];
    }
  }

  private async _filterPoliciesByResource(documents: IAMDocument[], resource: string): Promise<IAMDocument[]> {
    return this._filterPoliciesBy(documents, "Resource", resource);
  }

  private async _filterPoliciesByEffect(documents: IAMDocument[], effect: "Allow" | "Deny"): Promise<IAMDocument[]> {
    return this._filterPoliciesBy(documents, "Effect", effect);
  }

  private async _filterPoliciesByEvent(documents: IAMDocument[], event: AWSEventName): Promise<IAMDocument[]> {
    return this._filterPoliciesBy(documents, "Action", event);
  }

  private async _filterPoliciesBy(documents: IAMDocument[], filter: AWSIAMDocumentAttribute, value: string): Promise<IAMDocument[]> {
    try {
      return documents.filter( x => {
        const json = JSON.parse(x.PolicyDocument);
        if (json["Statement"]) {
          return json["Statement"].find( statement => {
            if (statement[filter]) {
              if (typeof statement[filter] === "string") {
                return statement[filter].includes(value) || statement[filter] === "*";
              }
              return statement[filter].find(a => {
                return a.includes(value) || a === "*";
              }) !== undefined;
            }
          }) !== undefined;
        }
        return false;
      })
    } catch(e) {
      console.error(e);
      return documents;
    }
  }

  private async _getPoliciesDocuments(): Promise<IAMDocument[]> {
    return new Promise( async (resolve, reject) => {
      try {
        const documents: IAMDocument[] = [];
        const roles = await this._awsProvider.listIAMRoles();
        if (roles && roles.Roles) {
          for (const role of roles.Roles) {
            const policies = await this._awsProvider.listIAMRolePolicies(role.RoleName);
            for (const policyName of policies.PolicyNames) {
              const policy = await this._awsProvider.getIAMRolePolicy(policyName, role.RoleName);
              const doc = policy.PolicyDocument;
              const decoded = decodeURI(doc).replace(/%2C/g, ",").replace(/%3A/g, ":").replace(/%2F/g, "::");
              documents.push({
                RoleName: role.RoleName,
                PolicyName: policy.PolicyName,
                PolicyDocument: decoded,
              });
            }
          }
        }
        resolve(documents);
      } catch(e) {
        reject(e);
      }
    });
  }

}
