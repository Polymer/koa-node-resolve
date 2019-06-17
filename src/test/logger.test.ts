import test from 'tape';

import {leveledLogger, prefixedLogger} from '../support/logger';

import {testLogger} from './test-utils';

test('leveledLogger', (t) => {
  t.plan(4);
  const logger = testLogger();
  const wrappedLogger = leveledLogger(logger, 'warn');
  wrappedLogger.debug && wrappedLogger.debug('test debug');
  wrappedLogger.info && wrappedLogger.info('test info');
  wrappedLogger.warn && wrappedLogger.warn('test warn');
  wrappedLogger.error && wrappedLogger.error('test error');
  t.deepEqual(logger.debugs, []);
  t.deepEqual(logger.infos, []);
  t.deepEqual(logger.warns, [['test warn']]);
  t.deepEqual(logger.errors, [['test error']]);
});

test('prefixedLogger', (t) => {
  t.plan(4);
  const logger = testLogger();
  const wrappedLogger = prefixedLogger('[yo]', logger);
  wrappedLogger.debug && wrappedLogger.debug('test debug');
  wrappedLogger.info && wrappedLogger.info('test info');
  wrappedLogger.warn && wrappedLogger.warn('test warn');
  wrappedLogger.error && wrappedLogger.error('test error');
  t.deepEqual(logger.debugs, [['[yo]', 'test debug']]);
  t.deepEqual(logger.infos, [['[yo]', 'test info']]);
  t.deepEqual(logger.warns, [['[yo]', 'test warn']]);
  t.deepEqual(logger.errors, [['[yo]', 'test error']]);
});
