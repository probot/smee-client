export class VoidLogger {
  // This logger does not log anything, it just collects the calls made to it.
  // This is useful for testing purposes where you want to verify that certain
  // logging calls were made without actually outputting anything to the console.
  infoCalls: any[] = [];
  errorCalls: any[] = [];

  info(...args: any[]): void {
    this.infoCalls.push(args);
  }

  error(...args: any[]): void {
    this.errorCalls.push(args);
  }

  reset(): void {
    this.infoCalls = [];
    this.errorCalls = [];
  }
}
