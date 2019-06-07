/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
export type LogLevel = 'debug'|'info'|'error'|'warn';
export type LogFunction = typeof console.debug;
export type Logger = {
  [key in LogLevel]?: LogFunction;
};

type LogMethod = (arg?: unknown, ...args: unknown[]) => void;

const LogLevels = ['debug', 'info', 'warn', 'error'] as LogLevel[];

export const prefixedLogger = (prefix: string, logger: Logger): Logger => {
  const newLogger: Logger = {};
  for (const logLevel of LogLevels) {
    newLogger[logLevel] = wrapLogMethod(
        logger,
        logLevel,
        (log: LogMethod, args: unknown[]) => log(prefix, ...args));
  }
  return newLogger;
};

export const leveledLogger =
    (logger: Logger, minimumLogLevel: LogLevel): Logger => {
      const newLogger: Logger = {};
      for (const logLevel of LogLevels) {
        if (LogLevels.indexOf(minimumLogLevel) > LogLevels.indexOf(logLevel)) {
          continue;
        }
        newLogger[logLevel] = wrapLogMethod(
            logger,
            logLevel,
            (log: LogMethod, args: unknown[]) => log(args.shift(), ...args));
      }
      return newLogger;
    };

const wrapLogMethod =
    (logger: Logger,
     method: LogLevel,
     callback: (log: LogMethod, args: unknown[]) => void): LogMethod|
    undefined => {
      const logFunction = logger[method];
      if (!logFunction) {
        return;
      }
      return (arg?: unknown, ...args: unknown[]) => callback(
                 (arg?: unknown, ...args: unknown[]) =>
                     logFunction.apply(logger, [arg, ...args]),
                 [arg, ...args]);
    };
