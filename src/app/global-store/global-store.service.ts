import { Injectable } from '@angular/core';
import { BehaviorSubject, Subscription, forkJoin, of } from 'rxjs';
import { catchError, take, distinctUntilChanged } from 'rxjs/operators';

import { State, SyncState, Action } from './global-store.definitions';

@Injectable()
export class GlobalStore {
  private state: State;
  private state$: BehaviorSubject<SyncState> = new BehaviorSubject(undefined);

  constructor() {
    this.state = new Map();
  }

  /**
   * Returns an object with the synchronous value of every key in the state map
   * @returns {SyncState}
   */
  public value(): SyncState {
    let state = {};
    this.state.forEach((val, key) => (state = { ...state, [key]: val.getValue() }));
    return state;
  }

  /**
   * Updates the state with key = action.key and value = action.payload
   * @param {Action} action
   * @returns {void}
   */
  public dispatch(action: Action): void {
    this.state = this.reduce(this.state, action);
    this.state$.next(this.value());
  }

  /**
   * Subscribes to the current whole state
   * @param fnValue
   * @param fnErr
   * @param fnCompleted
   */
  public subscribe(fnValue, fnErr?, fnCompleted?): Subscription {
    return this.state$.pipe(distinctUntilChanged()).subscribe(fnValue, fnErr, fnCompleted);
  }

  /**
   * Subscribes to the observable at @param key;
   * If the key is an array, it will subscribe to every key in the array returning one subscription;
   * @example 'ex1' => Subscription[ex1]
   * @example ['ex1', 'ex2', 'ex3'] => Subscription[ex1, ex2, ex3]
   * @example ['ex2', 'ex1', 'ex3'] => Subscription[ex2, ex1, ex3]
   * @param  key
   * @param  fnValue
   * @param  fnErr
   * @param  fnCompleted
   * @returns Subscription
   */
  public subscribeTo(key: string | string[], fnValue, fnErr?, fnCompleted?): Subscription {
    if (typeof key !== 'string') {
      const subscription = forkJoin(
        ...key.map(k =>
          this.state.get(k).pipe(
            take(1),
            distinctUntilChanged()
          )
        )
      ).pipe(catchError(err => of(err)));
      return subscription.subscribe(fnValue, fnErr, fnCompleted);
    }

    return this.state
      .get(key)
      .pipe(distinctUntilChanged())
      .subscribe(fnValue, fnErr, fnCompleted);
  }

  /**
   * Updates the current state if the key does not exist
   * If the key exists, passes the new action.payload into the BehaviorSubject at action.key
   * @param state
   * @param action
   * @returns {State}
   */
  private reduce(state: State, action: Action): State {
    if (state.has(action.key)) {
      state.get(action.key).next(action.payload);
      return state;
    }
    return state.set(action.key, new BehaviorSubject(action.payload));
  }
}
