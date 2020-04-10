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
import nodeResolve from 'resolve';

import {Logger} from './logger';

import {dirname, relativePathToUrl} from './path-utils';

export const resolveNodeSpecifier =
    (modulePath: string, specifier: string, logger: Logger): string => {
      if (isURL(specifier)) {
        return specifier;
      }
      try {
        const dependencyPath = nodeResolve.sync(specifier, {
          basedir: dirname(modulePath),
          extensions: ['.js', '.json', '.node'],
          packageFilter: (packageJson: {
            main?: string,
            module?: string,
            'jsnext:main'?: string,
          }) => Object.assign(packageJson, {
            main: packageJson.module || packageJson['jsnext:main'] ||
                packageJson.main
          })
        });
        const resolvedURL = relativePathToUrl(modulePath, dependencyPath);
        if (resolvedURL !== specifier) {
          logger.debug &&
              logger.debug(`Resolved Node module specifier "${specifier}" to "${
                  resolvedURL}"`);
        }
        return resolvedURL;
      } catch (error) {
        logger.warn &&
            logger.warn(
                `Unable to resolve Node module specifier "${specifier}" due to`,
                error);
        return specifier;
      }
    };

const isURL = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch (error) {
    return false;
  }
};
