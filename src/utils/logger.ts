type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: Readonly<Record<string, unknown>>;
}

export class Logger {
  private readonly entries: LogEntry[] = [];

  info(message: string, context?: Readonly<Record<string, unknown>>): void { this.write('info', message, context); }
  warn(message: string, context?: Readonly<Record<string, unknown>>): void { this.write('warn', message, context); }
  error(message: string, context?: Readonly<Record<string, unknown>>): void { this.write('error', message, context); }
  snapshot(): readonly LogEntry[] { return [...this.entries]; }

  private write(level: LogLevel, message: string, context?: Readonly<Record<string, unknown>>): void {
    this.entries.push({ timestamp: new Date().toISOString(), level, message, ...(context ? { context } : {}) });
  }
}
