import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface Action {
  key: string;
  payload: any;
}

interface State {
  [key: string]: BehaviorSubject<any>;
}

@Injectable()
export class GlobalStore {
  private state: State;

  constructor() {
    this.state = {};
  }

  public value() {
    return this.state;
  }

  public dispatch(action: Action): void {
    this.state = this.reduce(this.state, action);
  }

  private reduce(state: State, action: Action) {
    return { ...state, [action.key]: new BehaviorSubject(action.payload) };
  }

  public subscribeTo(key: string, fn) {
    return this.state[key].subscribe(fn);
  }
}
