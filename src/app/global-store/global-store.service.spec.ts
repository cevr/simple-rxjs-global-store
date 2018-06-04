import { GlobalStore } from './global-store.service';

fdescribe('GlobalStore', () => {
  let service;

  beforeEach(() => {
    service = new GlobalStore();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update the state', () => {
    service.dispatch({ key: 'testSubscription', payload: 'hello' });
    service.dispatch({ key: 'testSubscription', payload: 'hello1' });

    const map = service.value();

    expect(Object.keys(map).length).toBe(1);
    service.subscribeTo('testSubscription', test => expect(test).toEqual('hello1'));
  });

  it('should return the state', () => {
    service.dispatch({ key: 'test', payload: 'test' });
    service.dispatch({ key: 'test1', payload: 'test1' });
    const map = service.value();
    expect(Object.keys(map).length).toBe(2);
  });

  it('should subscribe to all keys entered', () => {
    service.dispatch({ key: 'test', payload: 'a' });
    service.dispatch({ key: 'test1', payload: 'b' });
    service.dispatch({ key: 'test2', payload: 'c' });
    service.dispatch({ key: 'test3', payload: 'd' });

    service.subscribeTo(['test2', 'test', 'test3', 'test1'], test => {
      expect(test).toEqual(['c', 'a', 'd', 'b']);
    });
  });

  it('should subscribe to the sync state', () => {
    service.dispatch({ key: 'test', payload: 'test' });
    service.dispatch({ key: 'test1', payload: 'test1' });

    service.subscribe(state => {
      expect(state).toEqual({
        test: 'test',
        test1: 'test1'
      });
    });
  });
});
