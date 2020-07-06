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
import {posix, resolve as resolvePath, sep as pathSeparator} from 'path';

const filenameRegex = process.platform === 'win32' ? /[^\\]+$/ : /[^\/]+$/;

/**
 * Similar to `path.dirname()` except includes trailing slash and for a
 * path `/like/this/` will return `/like/this/` instead of `/like` since the
 * trailing slash indicates `this` is a folder name not a file name.
 * (`path.dirname('/like/this/')` returns `/like`.)
 */
export const dirname = (path: string): string =>
    path.replace(filenameRegex, '');

export const ensureLeadingDotInURL = (path: string): string =>
    (path.startsWith('../') || path.startsWith('./')) ? path : './' + path;

export const ensureTrailingSlashInPath = (path: string): string =>
    path.endsWith(pathSeparator) ? path : path + pathSeparator;

export const forwardSlashesOnlyPlease = (path: string): string =>
    path.replace(/\\/g, '/');

export const getBaseURL = (href: string): string => href.replace(/[^\/]+$/, '');

export const noTrailingSlashInPath = (path: string): string =>
    path.replace(/\/$/, '');

export const noLeadingSlashInURL = (href: string): string =>
    href.replace(/^\//, '');

export const relativePathToURL = (from: string, to: string): string =>
    ensureLeadingDotInURL(posix.relative(
        getBaseURL(forwardSlashesOnlyPlease(from)),
        forwardSlashesOnlyPlease(to)));

export const resolvePathPreserveTrailingSlash =
    (from: string, to: string): string => {
      const resolvedPath = resolvePath(from, to);
      return isDirectorySpecifier(to) ? `${resolvedPath}/` : resolvedPath;
    };

const isDirectorySpecifier = (specifier: string) => ['', '.', '..'].includes(
    specifier.match(/([^\/]*$)/)![0]);