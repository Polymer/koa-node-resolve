
export type LogLevel = 'debug'|'info'|'error'|'warn';
export type LogFunction = typeof console.debug;
export type Logger = {
  [key in LogLevel]?: LogFunction;
};

export const prefixLogger = (prefix: string, logger: Logger): Logger => {
  const newLogger: Logger = {};
  for (const method of ['debug', 'info', 'wrap', 'error'] as LogLevel[]) {
    newLogger[method] = wrapLoggerMethod(prefix, logger, method);
  }
  return newLogger;
};

const wrapLoggerMethod = (prefix: string, logger: Logger, method: LogLevel) =>
    (...args: unknown[]): void => {
      if (!logger) {
        return;
      }
      const logFunction = logger[method];
      if (!logFunction) {
        return;
      }
      logFunction.apply(logger, [prefix, ...args]);
    };
