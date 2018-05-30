import { TestBed, inject } from '@angular/core/testing';

import { GlobalStore } from './global-store.service';

fdescribe('GlobalStore', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GlobalStore]
    });
  });

  it(
    'should be created',
    inject([GlobalStore], (service: GlobalStore) => {
      expect(service).toBeTruthy();
    })
  );

  it(
    'should update the state',
    inject([GlobalStore], (service: GlobalStore) => {
      service.dispatch({ key: 'testSubscription', payload: 'hello' });

      service.subscribeTo('testSubscription', test => expect(test).toEqual('hello'));
    })
  );

  it(
    'should return the state',
    inject([GlobalStore], (service: GlobalStore) => {
      service.dispatch({ key: 'test', payload: 'test' });
      service.dispatch({ key: 'test1', payload: 'test1' });
      const map = service.value();
      console.log(map);
      expect(Object.keys(map).length).toBe(2);
    })
  );
});
