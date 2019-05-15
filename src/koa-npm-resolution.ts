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
import * as Koa from 'koa';
import {resolve as resolvePath} from 'path';
import {parse as parseURL} from 'url';
import esmSpecifierTransform from './koa-esm-specifier-transform';
import resolveNPMSpecifier from './support/resolve-npm-specifier';

export type Options = {
  /* On-disk package root path used for NPM package resolution; defaults to
     current folder. */
  packageRoot?: string,
  /* When serving the package from a base other than root.  If this option is
     given, no specifier resolution will be attempted for documents served
     outside the baseHref. */
  baseHref?: string,
};

export const middleware = (options: Options = {}): Koa.Middleware => {
  const onDiskPackageRoot = resolvePath(options.packageRoot || '.');
  const baseHref =
      (options.baseHref || '').replace(/^\//, '').replace(/[^\/]+$/, '');
  return esmSpecifierTransform((baseURL: string, specifier: string) => {
    const path = (parseURL(baseURL).pathname || '/').replace(/^\//, '');
    if (!path.startsWith(baseHref)) {
      return specifier;
    }
    const debasedPath = path.slice(baseHref.length);
    const modulePath = resolvePath(onDiskPackageRoot, debasedPath);
    const resolvedPath = resolveNPMSpecifier(modulePath, specifier);
    return resolvedPath;
  });
};

export default middleware;
