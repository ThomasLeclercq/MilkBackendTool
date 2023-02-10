import { DataService } from "../services/base.data.service";

export interface BaseManager {
  readonly _dataService: DataService;
}