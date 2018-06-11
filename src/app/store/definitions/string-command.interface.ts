export interface StringCommand {
  command: string;
  parameters: Array<string>;
  refreshTime: number;
  isPolling: boolean;
}
