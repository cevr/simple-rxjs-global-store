/**
 * The goal of this class is to use the socket service without a socket connection for testing
 */
export class FakeSocketService {
  public bindingMap: any;

  public setBindingMap(bindingMap: any) {
    this.bindingMap = bindingMap;
  }

  public sendCommand(command: string) {
    return;
  }
}
