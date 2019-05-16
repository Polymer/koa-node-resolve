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
import getStream from 'get-stream';
import * as Koa from 'koa';
import {Stream} from 'stream';
import {transformHTMLString} from './transform-html';
import {transformJavaScriptModuleString} from './transform-javascript-module';

export type TransformSpecifierFunction = (baseURL: string, specifier: string) =>
    string;

export const middleware = (transformSpecifier: TransformSpecifierFunction):
                              Koa.Middleware =>
    async (ctx: Koa.Context, next: Function) => {
  await next();

  if (ctx.response.is('html')) {
    ctx.body = transformHTMLString(
        await getBodyAsString(ctx.body), ctx.request.url, transformSpecifier);
  }

  if (ctx.response.is('js')) {
    ctx.body = transformJavaScriptModuleString(
        await getBodyAsString(ctx.body), ctx.request.url, transformSpecifier);
  }
};
export default middleware;

// TODO(usergenic): This should probably be published as a separate npm package.
const getBodyAsString = async(body: Buffer|Stream|string): Promise<string> => {
  if (Buffer.isBuffer(body)) {
    return body.toString();
  }
  if (isStream(body)) {
    return await getStream(body);
  }
  if (typeof body !== 'string') {
    return '';
  }
  return body;
};

const isStream = (value: Buffer|Stream|string): value is Stream =>
    value !== null && typeof value === 'object' &&
    typeof (<{pipe: Function | undefined}>value).pipe === 'function';
