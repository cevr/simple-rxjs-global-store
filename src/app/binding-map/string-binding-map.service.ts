import { Injectable } from '@angular/core';
import { SocketService } from '../socket/socket.service';

@Injectable()
export class StringBindingMapService {
  public bindingsMap: any;
  constructor(protected socket: SocketService) {
    this.bindingsMap = new Map();
    this.socket.setBindingMap(this);
  }

  public getMap(): Map<string, any> {
    return this.bindingsMap;
  }

  public addBinding(command: string, model: any) {
    this.bindingsMap.set(command, model);
  }

  public sendCommand(command: string) {
    this.socket.sendCommand(command);
  }

  public dispatch(eventData: any) {
    const jsonData = JSON.parse(eventData);
    const store = this.bindingsMap.get(jsonData.TYPE);
    if (store) {
      store.dispatch(jsonData);
    }
  }
}
