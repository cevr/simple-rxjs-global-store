import { BehaviorSubject } from 'rxjs';
import { StringBindingMapService } from '../binding-map/string-binding-map.service';

export enum ActivityMode {
  ActiveHighPriority = 200, // Action in progress, user needs feedback right now
  Active = 1000, // User is actively looking at the page
  ActiveLowPriority = 10000, // User is looking at an unimportant page, update the model silently (refresh once every 10 seconds)
  Idle // User is not looking, stop polling
  // LazyLoading // We want to pre-load data because the user will probably need it in the future
}

interface IStringCommand {
  command: string;
  parameters: Array<string>;
  refreshTime: number;
}

export abstract class Store {
  abstract state: any;

  public state$: BehaviorSubject<any> = new BehaviorSubject(this.state);

  protected activeCommands: Array<IStringCommand> = [];
  protected defaultRefreshTime = 1000;

  private activityMode: ActivityMode;
  private activeObserverCount: number;
  private intervals: any;

  constructor(protected bindingMap: StringBindingMapService) {
    this.activityMode = ActivityMode.Idle;
    this.activeObserverCount = 1;
  }

  /**
   * An active command will poll the API every X milliseconds.
   * If no milliseconds provided, then it will default to 1000.
   * The intervalID will be equal to the command
   * @param command The expected API response
   * @param refreshTime The interval timer
   * @param parameters (Optional) List of parameters to add to the command when polling. The order is important.
   */
  protected registerActiveCommand(command: string, refreshTime?: number, parameters?: Array<string>) {
    this.activeCommands = this.activeCommands.concat({
      command,
      parameters,
      refreshTime: refreshTime || this.defaultRefreshTime
    });
    this.bindingMap.addBinding(command, this);
    this.setActivityMode();
  }

  /**
   * A passive command listens to data from the API but does not poll
   * @param command The expected API response
   */
  protected registerPassiveCommand(command: string) {
    this.bindingMap.addBinding(command, this);
  }

  /**
   * Update an existing command to change its parameters and/or refreshTime
   * @param command The expected API response
   * @param refreshTime The interval timer
   * @param newParams New set of parameters to add to the command when polling. The order is important.
   */
  protected updateActiveCommand(command: string, refreshTime?: number, newParams?: Array<string>): void {
    this.clearActiveCommand(command);
    this.activeCommands = this.activeCommands.map((activeCommand: IStringCommand) => {
      return activeCommand.command === command
        ? {
            ...activeCommand,
            parameters: newParams,
            refreshTime: refreshTime || this.defaultRefreshTime
          }
        : activeCommand;
    });
    this.setActivityMode();
  }

  public getActivityMode(): ActivityMode {
    return this.activityMode;
  }

  public dispatch(data?: any): void {}

  public onDestroy() {
    this.activeObserverCount = 0;
    this.setActivityMode();
  }

  private setActivityMode() {
    if (this.activeCommands && this.activeCommands.length > 0) {
      if (this.activeObserverCount > 0) {
        this.activityMode = ActivityMode.Active;
        this.intervals = {
          ...Object.assign(
            {},
            ...this.activeCommands.map(command => {
              return {
                [command.command]: setInterval(() => {
                  console.log(command);
                  this.bindingMap.sendCommand(this.buildStringCommand(command));
                }, command.refreshTime)
              };
            })
          )
        };
      } else {
        this.activityMode = ActivityMode.Idle;
        this.clearAllActiveCommands();
      }
    }
  }

  /**
   * Concat all parameters to the base string
   * @param stringCommand An object implementing the IStringCommand interface
   */
  private buildStringCommand(stringCommand: any): string {
    let commandToRefresh = stringCommand.command;
    if (stringCommand.parameters) {
      stringCommand.parameters.forEach(param => (commandToRefresh = commandToRefresh.concat(':' + param)));
    }
    return commandToRefresh;
  }

  protected reduce(state, action) {
    const newState = { ...state, ...action };
    this.state$.next(newState);
    return newState;
  }

  /**
   * Clears an interval using its command
   * @param id command string
   */
  clearActiveCommand(id: string) {
    console.log(id);
    if (this.intervals[id]) {
      clearInterval(this.intervals[id]);
    } else {
      console.error(`${id} is not an active command!`);
    }
  }

  /**
   * Clears many intervals using an array of commands
   * @param ids array of commands
   */
  clearActiveCommands(ids: Array<any>) {
    ids.forEach(id => this.clearActiveCommand(this.intervals[id]));
  }

  /**
   * Clears all active intervals
   */
  clearAllActiveCommands() {
    Object.keys(this.intervals).forEach((id: string) => this.clearActiveCommand(id));
  }
}
