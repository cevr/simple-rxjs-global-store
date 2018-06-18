import { Subject, timer, combineLatest, ReplaySubject, merge } from 'rxjs';
import { takeUntil, tap, switchMap, finalize } from 'rxjs/operators';

export interface IntervalMap {
  [key: string]: Subject<any>;
}
export class Poll {
  private intervalMap: IntervalMap = {};
  private pollArray = [];
  private poll$ = new ReplaySubject(1);
  private clear$ = new Subject();
  private onAdd$ = new Subject();

  constructor(private sideEffect: Function) {}

  initialize() {
    this.poll$
      .pipe(
        switchMap(poll => {
          this.pollArray = this.pollArray.concat(poll);
          return combineLatest(...this.pollArray.map(poller => poller.obs)).pipe(takeUntil(this.clear$));
        })
      )
      .subscribe();
  }

  add(command, refreshTime = 2000, type = 'DEFAULT') {
    this.onAdd$.next();
    this.intervalMap = { ...this.intervalMap, [command]: new Subject() };
    switch (type) {
      case 'SWITCH': {
        const poller = {
          obs: timer(0, refreshTime).pipe(
            takeUntil(merge(this.intervalMap[command], this.onAdd$)),
            tap(() => {
              this.sideEffect(command);
            }),
            finalize(() => {
              setTimeout(() => this.onAdd$.next());
            })
          ),
          command
        };
        this.poll$.next(poller);
        break;
      }
      default: {
        const poller = {
          obs: timer(0, refreshTime).pipe(
            takeUntil(this.intervalMap[command]),
            tap(() => {
              this.sideEffect(command);
            })
          ),
          command
        };
        this.poll$.next(poller);
        break;
      }
    }
  }

  clearAll() {
    this.clear$.next();
    this.intervalMap = {};
    this.pollArray = [];
  }

  clear(command: string) {
    if (this.intervalMap[command]) {
      this.intervalMap[command].next();
      delete this.intervalMap[command];
      this.pollArray = this.pollArray.filter(poller => poller.command !== command);
    } else {
      console.error(`${command} is not an active command!`);
    }
  }
  clearMany(commands: string[]) {
    commands.forEach(command => this.clear(command));
  }
}
