import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { distinctUntilChanged } from 'rxjs/operators';
import { isEqual } from 'lodash';
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
  public bindingMap: any; // StringBindingMapService or JSONBindingMapService
  // TODO? Create abstract binding map

  private commandQueue: string[] = [];
  private inError = false;

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
   * @param url: websocket url
   * @param serializer: function that transforms outgoing data
   * @param deserializer: function that transforms incoming data
   */
  private openSocket() {
    const target = this.remoteMode ? 'wss:' + this.url : 'ws:' + this.url + ':' + COMMUNICATION_PORT;
    this.socket$ = webSocket({
      url: target,
      serializer: value => value,
      deserializer: e => JSON.parse(e.data)
    });
    this.initDispatcher();
    this.initConnection();
  }

  private restartSocket() {
    this.socket$ = undefined;
    this.openSocket();
  }

  /**
   * This socket will only send changed data
   * If polling and data has not changed, it will not send multiple times
   */
  private initDispatcher() {
    this.socket$.pipe(distinctUntilChanged(isEqual)).subscribe(
      payload => {
        if (!this.inError) {
          this.inError = false;
        }
        this.receiveData(payload);
      },
      err => this.socketErrorHandler(err),
      () => {
        console.warn('Socket connected closed.');
      }
    );
  }

  /**
   * If socket is open, will send command to backend
   * If socket is not open, will store command in queue
   * Queue is flushed on socket init
   */
  public sendCommand(command: string) {
    if (this.socket$ && !this.inError) {
      this.commandQueue = [];
      if (this.remoteMode) {
        this.socket$.next(this.token + '^' + this.serialNumber + '^' + command);
      } else {
        this.socket$.next(command);
      }
    } else {
      if (!this.commandQueue.includes(command)) {
        this.commandQueue = this.commandQueue.concat(command);
      }
    }
  }

  public setBindingMap(bindingMap: any) {
    this.bindingMap = bindingMap;
  }

  private initRemoteConnection(data: any) {
    this.serialNumber = data.serialNumber;
    this.token = data.token;
    this.url = data.url;
    this.remoteMode = true;
    this.openSocket();
  }

  private socketErrorHandler(error) {
    this.inError = true;
    console.error('Retrying...');
    // TODO: Maybe restart the controller if it doesn't work in 1 minute ?
    setTimeout(() => this.openSocket(), 3000);
  }

  clearCommandQueue() {
    if (this.commandQueue.length > 0) {
      this.commandQueue.forEach(command => {
        this.sendCommand(command);
      });
    }
  }

  private initConnection() {
    this.clearCommandQueue();
    this.sendCommand('auth:slaveLogin:1');
  }

  private receiveData(data: any) {
    this.bindingMap.dispatch(data);
  }
}
