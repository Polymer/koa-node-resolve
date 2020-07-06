/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
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
import test from 'tape';

import {dirname, resolvePathPreserveTrailingSlash} from '../support/path-utils';

test('dirname returns portion of path representing directory', (t) => {
  t.plan(2);
  t.equal(
      dirname('/a/b/c'),
      '/a/b/',
      'should treat lack of trailing slash as file');
  t.equal(
      dirname('/a/b/c/'),
      '/a/b/c/',
      'should treat segment before trailing slash as directory name');
});

test('resolvePathPreserveTrailingSlash may return trailing slash', (t) => {
  t.plan(3);
  t.equal(
      resolvePathPreserveTrailingSlash('/a/b', 'c/'),
      '/a/b/c/',
      'should contain trailing slash when destination has trailing slash');
  t.equal(
      resolvePathPreserveTrailingSlash('/a/b', 'c'),
      '/a/b/c',
      'should not contain trailing slash if destination does not have trailing slash');
  t.equal(
      resolvePathPreserveTrailingSlash('/a/b', ''),
      '/a/b/',
      'should contain trailing slash if destination is current directory');
});