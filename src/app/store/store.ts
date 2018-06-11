import { ReplaySubject, Observable } from 'rxjs';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { isEqual, cloneDeep } from 'lodash';
import { WebSocketSubject } from 'rxjs/webSocket';

import { StringCommand, Intervals } from './definitions';
import { SocketService } from '../socket/socket.service';

export abstract class Store {
  abstract state: any;

  protected _state$ = new ReplaySubject(1);
  protected activeCommands: Array<StringCommand> = [];
  protected minRefreshTime = 2000;
  protected intervals: Intervals = {};
  protected socket$: WebSocketSubject<any>;

  private activeObserverCount = 0;
  private commandQueue: string[] = [];
  private inError = false;
  private listeners: string[] = [];

  get state$() {
    return Observable.create(observer => {
      this._state$.pipe(distinctUntilChanged(isEqual)).subscribe(observer);
      this.activeObserverCount++;
      this.setActivityMode();
      // To be called once subscription is completed
      return () => {
        this.activeObserverCount--;
        this.setActivityMode();
      };
    });
  }

  constructor(protected socket: SocketService) {
    this.socket$ = socket.socket$;
    this.initDispatcher();
  }

  /**
   * An active command will poll the API every X milliseconds, cannot be lower than 2000.
   * If no milliseconds provided, then it will default to 2000.
   * The intervalID will be equal to the command
   * @param command The expected API response
   * @param refreshTime The interval timer
   * @param parameters (Optional) List of parameters to add to the command when polling. The order is important.
   */
  protected registerActiveCommand(command: string, refreshTime?: number, parameters?: Array<string>) {
    if (refreshTime < this.minRefreshTime) {
      throw new Error(`Refresh time cannot be less than ${this.minRefreshTime}`);
    }

    this.activeCommands = this.activeCommands.concat({
      command,
      parameters,
      refreshTime: refreshTime || this.minRefreshTime,
      isPolling: false
    });
    this.addListener(command);
    this.setActivityMode();
  }

  /**
   * listens to data from the API but does not poll
   * @param command The expected response type. If array, will register each type in array.
   */
  protected registerListener(command: string | string[]) {
    if (typeof command !== 'string') {
      command.forEach((comm: string) => {
        this.addListener(comm);
      });
    } else {
      this.addListener(command);
    }
  }

  /**
   * Update an existing command to change its parameters and/or refreshTime
   * @param command The expected API response
   * @param refreshTime The interval timer
   * @param newParams New set of parameters to add to the command when polling. The order is important.
   */
  protected updateActiveCommand(command: string, refreshTime?: number, parameters?: Array<string>): void {
    this.clearCommandInterval(command);
    this.activeCommands = this.activeCommands.map((activeCommand: StringCommand) => {
      return activeCommand.command === command
        ? ({
            ...activeCommand,
            parameters,
            refreshTime: refreshTime || this.minRefreshTime,
            isPolling: false
          } as StringCommand)
        : activeCommand;
    });
    this.setActivityMode();
  }

  /**
   * Called by the String Binding Map Service with the data from the WebSocket
   * @param data
   */
  public dispatch(data?: any): void {}

  /**
   * First it finds how many observers are subscribed to this store.
   * Then if there are any observers subscribed, it creates Active Command Intervals for every registered Active Command.
   * If there are no observers, it clears all Active Commands
   */
  protected setActivityMode(): void {
    if (this.activeCommands && this.activeCommands.length > 0) {
      if (this.activeObserverCount > 0) {
        this.intervals = this.setCommandIntervals(this.intervals, this.activeCommands);
      } else {
        this.clearAllCommandIntervals();
      }
    }
  }

  /**
   * Takes the current intervals and adds an interval for every active command that is not polling
   * @returns the updated active command interval map
   * @param intervals
   * @param activeCommands
   */
  protected setCommandIntervals(intervals: Intervals, activeCommands: StringCommand[]): Intervals {
    return {
      ...intervals,
      ...Object.assign(
        {},
        ...activeCommands.map(command => {
          if (!command.isPolling) {
            command.isPolling = true;
            return {
              [command.command]: setInterval(() => {
                this.sendCommand(this.buildStringCommand(command));
              }, command.refreshTime)
            };
          }
        })
      )
    };
  }

  /**
   * Concat all parameters to the base string
   * @param stringCommand An object implementing the StringCommand interface
   */
  protected buildStringCommand(stringCommand: StringCommand): string {
    let commandToRefresh = stringCommand.command;
    if (stringCommand.parameters) {
      stringCommand.parameters.forEach(param => (commandToRefresh = commandToRefresh.concat(':' + param)));
    }
    return commandToRefresh;
  }

  /**
   * Returns a new state with the added modifications
   * If a function is used as the parameter, it will pass the current state.
   * The function must return the new modifications;
   * @example: setState(function(prevState) => { return {...prevState, modification: modification}})
   * @returns new state
   */
  protected setState(payload): any {
    const state = cloneDeep(this.state);
    let newState;
    if (typeof payload === 'function') {
      if (!payload(state)) {
        throw new Error('Function did not return any modification');
      }
      newState = { ...state, ...payload(state) };
    } else {
      newState = { ...state, ...cloneDeep(payload) };
    }
    this._state$.next(newState);
    return newState;
  }

  /**
   * Clears an active command interval using its command
   * @param id command string
   */
  protected clearCommandInterval(id: string): void {
    if (this.intervals[id]) {
      clearInterval(this.intervals[id]);
      delete this.intervals[id];
    } else {
      console.error(`${id} is not an active command!`);
    }
  }

  /**
   * Clears many active command intervals using an array of commands
   * @param ids array of commands
   */
  protected clearCommandIntervals(ids: Array<string>): void {
    ids.forEach((id: string) => this.clearCommandInterval(id));
  }

  /**
   * Clears all active command intervals
   */
  protected clearAllCommandIntervals(): void {
    Object.keys(this.intervals).forEach((id: string) => this.clearCommandInterval(id));
  }

  /**
   * This socket will only send changed data
   * If polling and data has not changed, it will not send multiple times
   */
  protected initDispatcher(dataFilter = this.defaultFilter, changeDetector = isEqual) {
    this.socket$
      .pipe(
        filter(dataFilter),
        distinctUntilChanged(changeDetector)
      )
      .subscribe(
        payload => {
          if (this.inError) {
            this.inError = false;
            this.commandQueue = [];
          }
          this.dispatch(payload);
        },
        () => {
          this.inError = true;
          this.socket.socketErrorHandler();
        }
      );
  }

  protected defaultFilter({ TYPE }): boolean {
    return this.listeners.includes(TYPE);
  }

  /**
   * If socket is open, will send command to backend
   * If socket is not open, will store command in queue
   * Queue is flushed on socket init
   */
  protected sendCommand(command: string) {
    if (this.socket$ && !this.inError) {
      if (this.socket.remoteMode) {
        this.socket$.next(this.socket.token + '^' + this.socket.serialNumber + '^' + command);
      } else {
        this.socket$.next(command);
      }
    } else {
      if (!this.commandQueue.includes(command)) {
        this.commandQueue = this.commandQueue.concat(command);
      }
    }
  }

  protected clearCommandQueue() {
    if (this.commandQueue.length > 0) {
      this.commandQueue.forEach(command => {
        this.sendCommand(command);
      });
    }
  }

  protected addListener(command: string): void {
    this.listeners = this.listeners.concat(command);
  }
}
