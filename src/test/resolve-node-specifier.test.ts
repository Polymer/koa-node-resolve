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
import {resolve as resolvePath} from 'path';
import test from 'tape';

import {ensureTrailingSlash} from '../support/path-utils';
import {resolveNodeSpecifier} from '../support/resolve-node-specifier';

const fixturesPath =
    ensureTrailingSlash(resolvePath(__dirname, '../../test/fixtures/'));
const resolve = (specifier: string): string =>
    resolveNodeSpecifier(fixturesPath, specifier);

test('resolveNodeSpecifier resolves package name', (t) => {
  t.plan(3);
  t.equal(
      resolve('x'),
      './node_modules/x/main.js',
      'should resolve to `package.json` "main"');
  t.equal(
      resolve('y'),
      './node_modules/y/jsnext.js',
      'should resolve to `package.json` "jsnext:main"');
  t.equal(
      resolve('z'),
      './node_modules/z/module.js',
      'should resolve to `package.json` "module"');
});

test('resolveNodeSpecifier resolves extension-less module subpath', (t) => {
  t.plan(3);
  t.equal(
      resolve('z/jsnext'),
      './node_modules/z/jsnext.js',
      'should resolve to `.js` extension');
  t.equal(
      resolve('z/package'),
      './node_modules/z/package.json',
      'should resolve to `.json` extension');
  t.equal(
      resolve('z/binary-file'),
      './node_modules/z/binary-file.node',
      'should resolve to `.node` extension');
});

test('resolveNodeSpecifier resolves extension-less relative path', (t) => {
  t.plan(3);
  t.equal(
      resolve('./node_modules/z/jsnext'),
      './node_modules/z/jsnext.js',
      'should resolve to `.js` extension');
  t.equal(
      resolve('./node_modules/z/package'),
      './node_modules/z/package.json',
      'should resolve to `.json` extension');
  t.equal(
      resolve('./node_modules/z/binary-file'),
      './node_modules/z/binary-file.node',
      'should resolve to `.node` extension');
});
