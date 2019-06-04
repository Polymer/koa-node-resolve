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

import {moduleSpecifierTransform, ModuleSpecifierTransformOptions} from './koa-module-specifier-transform';
import {Logger, prefixLogger} from './support/logger';
import {noLeadingSlash} from './support/path-utils';
import {resolveNodeSpecifier} from './support/resolve-node-specifier';

export {Logger} from './support/logger';

export type NodeResolveOptions =
    ModuleSpecifierTransformOptions&{root?: string, logger?: Logger};

/**
/**
* @param root The on-disk directory that maps to the served root URL, used to
*     resolve module specifiers in filesystem.  In most cases this should match
*     the root directory configured in your downstream static file server
*     middleware.
*/
export const nodeResolve =
    (options: NodeResolveOptions = {}): Koa.Middleware => {
      const logger = options.logger === false ?
          {} :
          prefixLogger('[koa-node-resolve]', options.logger || console);
      return moduleSpecifierTransform(
          (baseURL: string, specifier: string) => resolveNodeSpecifier(
              resolvePath(
                  resolvePath(options.root || '.'),
                  noLeadingSlash(parseURL(baseURL).pathname || '/')),
              specifier,
              logger),
          Object.assign({}, options, {logger}));
    };
