import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';

import { ExampleStore } from './example.store';
import { StringBindingMapService } from '../../binding-map/string-binding-map.service';
import { SocketService } from '../../socket/socket.service';

@Component({
  // One way of using the state observable with async pipe (angular preferred way)
  template: `
  <div >
    <div> {{(store.state$ | async)?.accessLevel}} </div>
    <button (click)="store.onClick(number); number = number + 1">Add 1</button>
  </div>`,
  providers: [ExampleStore],
  selector: 'example-store'
})
export class ExampleComponent implements OnInit, OnDestroy {
  private onDestroy$ = new Subject();

  number = 1;
  constructor(public store: ExampleStore) {}

  ngOnInit() {
    // Conventional way of using the state observable
    this.store.state$
      .pipe(
        takeUntil(this.onDestroy$),
        distinctUntilChanged()
      )
      .subscribe(state => {
        // do stuff
      });
  }
  ngOnDestroy() {
    this.onDestroy$.next();
  }
}
