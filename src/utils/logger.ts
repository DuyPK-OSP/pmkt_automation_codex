type LogLevel = 'info' | 'warn' | 'error';

/** Một log entry có timestamp, level, message và context tùy chọn. */
export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: Readonly<Record<string, unknown>>;
}

/** Thu thập structured log trong bộ nhớ để attach khi testcase thất bại. */
export class Logger {
  private readonly entries: LogEntry[] = [];

  /** Ghi log mức info vào bộ nhớ. */
  info(message: string, context?: Readonly<Record<string, unknown>>): void { this.write('info', message, context); }
  /** Ghi log mức warn vào bộ nhớ. */
  warn(message: string, context?: Readonly<Record<string, unknown>>): void { this.write('warn', message, context); }
  /** Ghi log mức error vào bộ nhớ. */
  error(message: string, context?: Readonly<Record<string, unknown>>): void { this.write('error', message, context); }
  /** Trả về bản sao bất biến của toàn bộ structured log hiện tại. */
  snapshot(): readonly LogEntry[] { return [...this.entries]; }

  /** Thêm log entry kèm timestamp vào bộ nhớ. */
  private write(level: LogLevel, message: string, context?: Readonly<Record<string, unknown>>): void {
    this.entries.push({ timestamp: new Date().toISOString(), level, message, ...(context ? { context } : {}) });
  }
}
