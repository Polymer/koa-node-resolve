import test from 'tape';

import {squeezeHTML} from './test-utils';

test('squeezeHTML will not put inject newlines where no-spaces exist', (t) => {
  t.plan(1);
  t.equal(squeezeHTML('<h1>Hello</h1>'), '<h1>Hello</h1>');
});

test('squeezeHTML will shrink multiple spaces to single spaces', (t) => {
  t.plan(1);
  t.equal(squeezeHTML('<h1> Hello </h1>'), '<h1>\nHello\n</h1>');
});
