import { BehaviorSubject } from 'rxjs';

export interface Action {
  key: string;
  payload: any;
}

export interface SyncState {
  [key: string]: any;
}

export type State = Map<string, BehaviorSubject<any>>;
