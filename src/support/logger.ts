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
