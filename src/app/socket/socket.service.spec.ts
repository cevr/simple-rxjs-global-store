import { TestBed, inject } from '@angular/core/testing';

import { SocketService } from './socket.service';
import { FakeSocketService } from './fake-socket.service';

describe('SocketService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: SocketService, useClass: FakeSocketService }]
    });
  });

  it('should be created', inject([SocketService], (service: SocketService) => {
    expect(service).toBeTruthy();
  }));
});
