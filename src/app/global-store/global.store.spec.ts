import { GlobalStore } from './global.store';

describe('GlobalStore', () => {
  let store;

  beforeEach(() => {
    store = new GlobalStore();
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should update the state', () => {
    store.dispatch({ key: 'testSubscription', payload: 'hello' });
    store.dispatch({ key: 'testSubscription', payload: 'hello1' });

    const map = store.value();

    expect(Object.keys(map).length).toBe(1);
    store.subscribeTo('testSubscription', test => expect(test).toEqual('hello1'));
  });

  it('should return the state', () => {
    store.dispatch({ key: 'test', payload: 'test' });
    store.dispatch({ key: 'test1', payload: 'test1' });
    const map = store.value();
    expect(Object.keys(map).length).toBe(2);
  });

  it('should subscribe to all keys entered', () => {
    store.dispatch({ key: 'test', payload: 'a' });
    store.dispatch({ key: 'test1', payload: 'b' });
    store.dispatch({ key: 'test2', payload: 'c' });
    store.dispatch({ key: 'test3', payload: 'd' });

    store.subscribeTo(['test2', 'test', 'test3', 'test1'], test => {
      expect(test).toEqual(['c', 'a', 'd', 'b']);
    });
  });

  it('should subscribe to the sync state', () => {
    store.dispatch({ key: 'test', payload: 'test' });
    store.dispatch({ key: 'test1', payload: 'test1' });

    store.subscribe(state => {
      expect(state).toEqual({
        test: 'test',
        test1: 'test1'
      });
    });
  });
});
