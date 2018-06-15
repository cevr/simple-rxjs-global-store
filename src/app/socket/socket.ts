import { WebSocketSubject, webSocket, WebSocketSubjectConfig } from 'rxjs/webSocket';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { QueueSubject } from '../queue/queue';

export interface SocketConfig {
  url: string;
  isRemote: boolean;
  sendOnInit?: string[];
}

export enum Port {
  communication = 9002,
  context = 9003
}

export class Socket implements Socket {
  private url: string;
  private isRemote: boolean;
  private sendOnInit: string[];

  private socket$: WebSocketSubject<any>;
  private inError$ = new Subject();
  private commandQueue$ = new QueueSubject();

  constructor(config: SocketConfig) {
    this.url = config.url;
    this.isRemote = config.isRemote;
    this.sendOnInit = (config.sendOnInit && config.sendOnInit) || undefined;
    this.openSocket();
  }

  get subject() {
    return this.socket$;
  }

  public send(command) {
    this.commandQueue$.add(command);
  }

  private openSocket() {
    const url = this.isRemote ? `wss:${this.url}` : `ws:${this.url}`;

    this.socket$ = webSocket({
      url,
      serializer: outgoing => {
        if (typeof outgoing !== 'string') {
          return JSON.stringify(outgoing);
        }
        return outgoing;
      },
      deserializer: (incoming: any) => {
        if (typeof incoming.data !== 'string') {
          return JSON.parse(incoming.data);
        }
        return incoming.data;
      }
    });
    this.initCommandQueue();
    this.initConnection();
  }

  private initCommandQueue() {
    this.commandQueue$.pipe(takeUntil(this.inError$)).subscribe(
      command => {
        this.socket$.next(command);
      },
      () => {},
      () => {
        console.log('command queue completed');
      }
    );
  }

  private initConnection() {
    if (this.sendOnInit) {
      this.sendOnInit.forEach(command => this.send(command));
    }
    this.socket$.pipe(takeUntil(this.inError$)).subscribe(
      () => {},
      () => {
        this.socketErrorHandler();
      }
    );
  }

  private socketErrorHandler() {
    this.inError$.next();
    console.error('Retrying...');
    setTimeout(() => {
      this.openSocket();
    }, 3000);
  }
}
