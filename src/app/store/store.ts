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
  abstract state$: BehaviorSubject<any>;

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
   * An active command will poll the API every X seconds
   * The intervalID to clear will be equal to the command
   * @param command The expected API response
   * @param refreshTime The interval timer
   * @param params (Optional) List of parameters to add to the command when polling. The order is important.
   */
  protected registerActiveCommand(command: string, refreshTime?: number, params?: Array<string>) {
    this.activeCommands = this.activeCommands.concat({
      command: command,
      parameters: params,
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
   * Update an existing command to change its parameters or refreshTime
   * @param command The expected API response
   * @param refreshTime The interval timer
   * @param newParams New set of parameters to add to the command when polling. The order is important.
   */
  protected updateActiveCommand(command: string, refreshTime?: number, newParams?: Array<string>) {
    this.activeCommands = this.activeCommands.map((activeCommand: IStringCommand) => {
      return activeCommand.command === command
        ? {
            ...activeCommand,
            parameters: newParams,
            refreshTime: refreshTime || this.defaultRefreshTime
          }
        : activeCommand;
    });
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
      if (this.activeObserverCount !== 0) {
        this.activityMode = ActivityMode.Active;
        this.intervals = {
          ...this.activeCommands.map(command => {
            return {
              [command.command]: setInterval(() => {
                this.bindingMap.sendCommand(this.buildStringCommand(command));
              }, command.refreshTime)
            };
          })
        };
      } else {
        this.activityMode = ActivityMode.Idle;
        this.clearAllIntervals();
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
   * Clear an interval using its ID
   * @param id interval ID
   */
  clearInterval(id: string) {
    if (this.intervals[id]) {
      clearInterval(this.intervals[id]);
    }
  }

  /**
   * Clear many intervals using an array of IDs
   * @param ids array of interval IDs
   */
  clearIntervals(ids: Array<any>) {
    ids.forEach(id => this.clearInterval(this.intervals[id]));
  }

  /**
   * Clear all active intervals
   */
  clearAllIntervals() {
    Object.values(this.intervals).forEach((id: string) => this.clearInterval(id));
  }
}
