import { TestBed, inject } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';

import { Store, ActivityMode } from './store';
import { StringBindingMapService } from '../binding-map/string-binding-map.service';
import { SocketService } from '../socket/socket.service';
import { AppContextService } from '../context/app-context.service';
import { FakeSocketService } from '../socket/fake-socket.service';

describe('Store', () => {
  class MockStore extends Store {
    state = {};
    state$ = new BehaviorSubject(this.state);

    constructor(protected bindingMap: StringBindingMapService) {
      super(bindingMap);
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StringBindingMapService, { provide: SocketService, useClass: FakeSocketService }, AppContextService]
    });
  });

  it(
    'should be created',
    inject([StringBindingMapService], (bindingMap: StringBindingMapService) => {
      const model = new MockStore(bindingMap);
      expect(model).toBeTruthy();
    })
  );

  it(
    'should poll active commands when observed',
    inject([StringBindingMapService], (bindingMap: StringBindingMapService) => {
      const model = new MockStore(bindingMap);
      model['registerActiveCommand']('');

      expect(model.getActivityMode()).toEqual(ActivityMode.Active);
    })
  );

  it(
    'should be idle when not observed',
    inject([StringBindingMapService], (bindingMap: StringBindingMapService) => {
      const model = new MockStore(bindingMap);
      model['registerActiveCommand']('');
      expect(model.getActivityMode()).toEqual(ActivityMode.Idle);
    })
  );

  it(
    'should poll active commands',
    inject([StringBindingMapService], (bindingMap: StringBindingMapService) => {
      const model = new MockStore(bindingMap);
      model['registerActiveCommand']('');
      expect(model['activeCommands'].length).toEqual(1);
    })
  );

  it(
    'should update active commands',
    inject([StringBindingMapService], (bindingMap: StringBindingMapService) => {
      const model = new MockStore(bindingMap);
      model['registerActiveCommand']('mockCommand', null, ['roomId', 'equipId']);
      model['updateActiveCommand']('mockCommand', null, ['roomId2', 'equipId2']);
      expect(model['activeCommands'][0].parameters).toEqual(['roomId2', 'equipId2']);
    })
  );

  it(
    'should concat parameters when polling',
    inject([StringBindingMapService], (bindingMap: StringBindingMapService) => {
      const model = new MockStore(bindingMap);
      const concatenatedCommand = model['buildStringCommand']({
        command: 'mockCommand',
        parameters: ['roomId', 'equipId']
      });
      expect(concatenatedCommand).toEqual('mockCommand:roomId:equipId');
    })
  );
});
