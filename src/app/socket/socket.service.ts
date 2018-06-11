import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import { DeviceContextService } from '../device-context/device-context.service';

const COMMUNICATION_PORT = 9002;

@Injectable()
export class SocketService {
  public url: string;
  public serialNumber: string;
  public token: string;
  public remoteMode: boolean;
  public loggedIn: boolean;
  public socket$: WebSocketSubject<any>;

  constructor(device: DeviceContextService) {
    this.remoteMode = false;
    device.getContext().subscribe(data => {
      if (data) {
        if (data.token !== undefined) {
          this.initRemoteConnection(data);
        }
        if (data.ipAdd && data.ipAdd !== '') {
          if (this.url === undefined) {
            this.url = data.ipAdd;
            this.openSocket();
          } else if (this.url !== data.ipAdd) {
            this.url = data.ipAdd;
            this.restartSocket();
          }
        }
      }
    });
  }

  /**
   * Opens the websocket with a WebSocketSubjectConfiguration object
   * @prop url: websocket url
   * @prop serializer: function that transforms outgoing data
   * @prop deserializer: function that transforms incoming data
   */
  private openSocket() {
    const target = this.remoteMode ? 'wss:' + this.url : 'ws:' + this.url + ':' + COMMUNICATION_PORT;
    this.socket$ = webSocket({
      url: target,
      serializer: value => value,
      deserializer: e => JSON.parse(e.data)
    });
    this.socket$.next('auth:slaveLogin:1');
  }

  private restartSocket() {
    this.socket$ = undefined;
    this.openSocket();
  }

  private initRemoteConnection(data: any) {
    this.serialNumber = data.serialNumber;
    this.token = data.token;
    this.url = data.url;
    this.remoteMode = true;
    this.openSocket();
  }

  public socketErrorHandler() {
    console.error('Retrying...');
    // TODO: Maybe restart the controller if it doesn't work in 1 minute ?
    setTimeout(() => this.openSocket(), 3000);
  }
}
