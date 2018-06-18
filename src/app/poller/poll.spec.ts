import { async } from '@angular/core/testing';
import { Poll } from './poll';

fdescribe('poll', () => {
  let service: Poll;
  beforeEach(() => {
    service = new Poll(console.log);
  });

  it('should poll', async(() => {
    service.add('switch', 1000, 'SWITCH');
    service.initialize();

    setTimeout(() => {
      service.clear('switch');
    }, 3000);
    setTimeout(() => {
      service.clearAll();
    }, 5000);
  }));
});
