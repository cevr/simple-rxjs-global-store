import { Component, OnInit, OnDestroy } from '@angular/core';
import { ExampleModel } from './example.model';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';

@Component({
  providers: [ExampleModel],
  // One way of using the state observable with async pipe (angular preferred way)
  template: `
  <div *ngIf="(model.state$ | async)">
    <div> {{(model.state$ | async)?.accessLevel}} </div>
  </div>`
})
export class ExampleComponent implements OnInit, OnDestroy {
  private onDestroy$ = new Subject();

  constructor(public model: ExampleModel) {}

  ngOnInit() {
    // Conventional way of using the state observable
    this.model.state$
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
