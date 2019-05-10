import {resolve as resolvePath} from 'path';
import test from 'tape';

import resolve from '../support/resolve-npm-specifier';

test('resolve', (t) => {
  t.plan(1);
  const path = resolve(resolvePath(__dirname, '../..') + '/', 'resolve-from');
  t.equal(path, './node_modules/resolve-from/index.js');
});
