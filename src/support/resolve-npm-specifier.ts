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
import {relative} from 'path';
import resolveFrom from 'resolve-from';

export default (modulePath: string, specifier: string): string => {
  const resolved = resolveFrom.silent(modulePath, specifier);
  if (resolved) {
    return relativePath(modulePath, resolved);
  }
  return specifier;
};

export const relativePath = (from: string, to: string): string => {
  from = fslash(from);
  to = fslash(to);
  if (!from.endsWith('/')) {
    from = from.replace(/[^/]*$/, '');
  }
  return ensureLeadingDot(relative(from, to));
};

const ensureLeadingDot = (path: string): string =>
    (path.startsWith('../') || path.startsWith('./')) ? path : './' + path;

const fslash = (path: string): string => path.replace(/\\/g, '/');
