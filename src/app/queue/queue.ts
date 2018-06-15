import { Subject } from 'rxjs';

export class QueueSubject extends Subject<any> {
  private items = [];

  add(item) {
    if (this.observers.length > 0) {
      this.next(item);
    } else if (!this.hasItem(item)) {
      this.items = this.items.concat(item);
    }
  }

  subscribe(observer) {
    const subscription = super.subscribe(observer);
    this.items.forEach(item => this.next(item));
    this.items = [];
    return subscription;
  }

  hasItem(item) {
    if (typeof item === 'object') {
      return this.items.filter(it => it.command === item.command).length > 0;
    }
    return this.items.includes(item);
  }
}
