import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Store } from '../../store/store';
import { StringBindingMapService } from '../../binding-map/string-binding-map.service';
import { GlobalStore } from '../global.store';

@Injectable()
export class ExampleStore extends Store {
  public state;

  constructor(protected bindingMap: StringBindingMapService, private globalStore: GlobalStore) {
    super(bindingMap);

    globalStore.dispatch({ key: 'accessLevel', payload: 1 });
    globalStore.dispatch({ key: 'currentLang', payload: 'en' });

    // single subscription => 1
    globalStore.subscribeTo('accessLevel', accessLevel => {
      this.state = this.reduce(this.state, { accessLevel });
    });

    // multiple subscriptions => [1, 'en']
    globalStore.subscribeTo(['accessLevel', 'currentLang'], ([accessLevel, currentLang]) => {
      this.state = this.reduce(this.state, { accessLevel, currentLang });
    });

    // total subscription => { accessLevel: 1, currentLang: 'en' }
    globalStore.subscribe(state => {
      this.state = this.reduce(this.state, { ...state });
    });
  }

  onClick(number) {
    this.globalStore.dispatch({ key: 'accessLevel', payload: number });
  }

  /**
   * @see inherit
   */
  public dispatch(data: any): void {
    switch (data.TYPE) {
      case 'example:command': {
        this.state = this.reduce(this.state, data);

        //dispatching something that many components need to the global store
        this.globalStore.dispatch({ key: 'exampleKey', payload: data.example });
        break;
      }
    }
  }
}
