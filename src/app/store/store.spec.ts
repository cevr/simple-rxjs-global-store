import { TestBed, inject } from '@angular/core/testing';

import { Store } from './store';
import { StringBindingMapService } from '../binding-map/string-binding-map.service';
import { SocketService } from '../socket/socket.service';
import { AppContextService } from '../context/app-context.service';
import { FakeSocketService } from '../socket/fake-socket.service';

describe('Store', () => {
  class MockStore extends Store {
    state = {};
    constructor(protected bindingMap: StringBindingMapService) {
      super(bindingMap);
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StringBindingMapService, { provide: SocketService, useClass: FakeSocketService }, AppContextService]
    });
  });

  it('should be created', inject([StringBindingMapService], (bindingMap: StringBindingMapService) => {
    const store = new MockStore(bindingMap);
    expect(store).toBeTruthy();
  }));

  it('should poll active commands when observed', inject(
    [StringBindingMapService],
    (bindingMap: StringBindingMapService) => {
      spyOn(global, 'setInterval').and.callThrough();
      const store = new MockStore(bindingMap);
      store.state$.subscribe(test => {});
      store['registerActiveCommand']('test');
      expect(global.setInterval).toHaveBeenCalled();
      store['clearAllCommandIntervals']();
    }
  ));

  it('should be idle when not observed', inject([StringBindingMapService], (bindingMap: StringBindingMapService) => {
    spyOn(global, 'setInterval').and.callThrough();
    const store = new MockStore(bindingMap);
    store['registerActiveCommand']('test');
    expect(global.setInterval).toHaveBeenCalledTimes(0);
    store['clearAllCommandIntervals']();
  }));

  it('should poll active commands', inject([StringBindingMapService], (bindingMap: StringBindingMapService) => {
    const store = new MockStore(bindingMap);
    store['registerActiveCommand']('test');
    expect(store['activeCommands'].length).toEqual(1);
    store['clearAllCommandIntervals']();
  }));

  it('should update active commands', inject([StringBindingMapService], (bindingMap: StringBindingMapService) => {
    const store = new MockStore(bindingMap);
    store.state$.subscribe(test => {});
    store['registerActiveCommand']('mockCommand', 2000, ['roomId', 'equipId']);
    store['updateActiveCommand']('mockCommand', 2000, ['roomId2', 'equipId2']);
    store['clearAllCommandIntervals']();
    expect(store['activeCommands'][0].parameters).toEqual(['roomId2', 'equipId2']);
  }));

  it('should concat parameters when polling', inject(
    [StringBindingMapService],
    (bindingMap: StringBindingMapService) => {
      const store = new MockStore(bindingMap);
      const concatenatedCommand = store['buildStringCommand']({
        command: 'mockCommand',
        parameters: ['roomId', 'equipId']
      });
      expect(concatenatedCommand).toEqual('mockCommand:roomId:equipId');
    }
  ));
});
