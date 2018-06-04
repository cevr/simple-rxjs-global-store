import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Model } from 'modules/web-core/services/model/model';
import { StringBindingMapService } from 'modules/web-core/services/binding-map/string-binding-map.service';
import { GlobalStore } from '../global-store.service';

@Injectable()
export class ExampleModel extends Model {
  public dataStore;
  public state;
  public state$ = new BehaviorSubject(this.state);

  constructor(protected bindingMap: StringBindingMapService, private globalStore: GlobalStore) {
    super(bindingMap);

    // single subscription
    globalStore.subscribeTo('accessLevel', accessLevel => {
      this.state = this.reduce(this.state, { accessLevel });
    });

    // multiple subscriptions
    globalStore.subscribeTo(['accessLevel', 'currentLang'], ([accessLevel, currentLang]) => {
      this.state = this.reduce(this.state, { accessLevel, currentLang });
    });
  }

  private reduce(state, action) {
    const newState = { ...state, ...action };
    this.state$.next(newState);
    return newState;
  }
  /**
   * @see inherit
   */
  public updateData(data: any): void {
    switch (data.TYPE) {
      case 'example:command': {
        this.state = this.reduce(this.state, data);
        this.globalStore.dispatch({ key: 'exampleKey', payload: data.example });
        break;
      }
    }
  }
}
