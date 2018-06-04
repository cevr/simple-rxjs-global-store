import { Injectable } from '@angular/core';
import { AppContextService } from '../context/app-context.service';

@Injectable()
export class SocketService {
  public url: string;
  public serialNumber: string;
  public token: string;
  public remoteMode: boolean;
  public loggedIn: boolean;

  public socket = undefined;
  public bindingMap: any; // StringBindingMapService or JSONBindingMapService
  // TODO? Create abstract binding map

  constructor(environment: AppContextService) {

    this.url = environment.getEnvironmentVars().websocketUrl;

    //SETUP FOR LAN ACCESS
    if(environment.getEnvironmentVars().production && !environment.isEdge()) {
      this.url = 'ws://' + window.location.host + ':9002';
    }

    this.openSocket();
  }

  public setBindingMap(bindingMap: any) {
    this.bindingMap = bindingMap;
  }

  public sendCommand(command: string) {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(command);
    }
  }

  private openSocket() {
    this.socket = new WebSocket(this.url);
    this.socket.onerror = error => this.socketErrorHandler(error);
    this.socket.onopen = event => this.initConnectionToEdge();
    this.socket.onmessage = event => this.receiveData(event.data);
  }
  private socketErrorHandler(error) {
    console.error('Retrying...');
    // Tries every 3 seconds
    // TODO: Maybe restart the controller if it doesn't work in 1 minute ?
    setTimeout(() => this.openSocket(), 3000);
  }
  private initConnectionToEdge() {
    this.socket.send('auth:slaveLogin:1'); // TODO: Use a real user when the authentication service is done
    // this.socket.send('auth:login-ns:admin:adminadmin');
    this.bindingMap.getMap().forEach(
      // TODO?: Replace this with a message queue
      (value, key) => {
        this.socket.send(key);
      }
    );
  }

  private receiveData(eventData: any) {
    this.bindingMap.dispatch(eventData);
  }

}
