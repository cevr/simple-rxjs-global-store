import { WebSocket, Server } from 'mock-socket';
import { async } from '@angular/core/testing';

import { Socket } from './socket';

fdescribe('webSocket', () => {
  let local: Socket;
  let mockServer;
  beforeEach(() => {
    mockServer = new Server('ws://localhost:9002');
  });

  afterEach(() => {
    mockServer.stop();
  });

  it('should receive messages', async(() => {
    mockServer.on('connection', server => {
      mockServer.send('test message 1');
      mockServer.send('test message 2');
    });

    local = new Socket({ url: '//localhost:9002', isRemote: false });

    const subject = local.subject;

    const messages = [];
    subject.subscribe(message => {
      messages.push(message);
    });

    setTimeout(() => {
      const messageLength = messages.length;
      expect(messageLength).toEqual(2);
    }, 100);
  }));

  it('should send messages', async(() => {
    const sent = 'ping pong';
    mockServer.on('message', message => {
      expect(message).toEqual(sent);
    });

    local = new Socket({ url: '//localhost:9002', isRemote: false });

    local.send(sent);
  }));
});
