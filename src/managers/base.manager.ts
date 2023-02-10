import { DataService } from "../services";

export interface BaseManager {
  readonly _dataService: DataService;
}