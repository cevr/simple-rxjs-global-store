
import { TestBed, inject } from '@angular/core/testing';

import { StringBindingMapService } from './string-binding-map.service';
import { SocketService } from '../socket/socket.service';
import { AppContextService } from '../context/app-context.service';
import { FakeSocketService } from '../socket/fake-socket.service';

describe('StringBindingMapService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StringBindingMapService,
        { provide: SocketService, useClass: FakeSocketService },
        AppContextService
      ]
    });
  });

  it('should be created', inject([StringBindingMapService], (service: StringBindingMapService) => {
    expect(service).toBeTruthy();
  }));
});
