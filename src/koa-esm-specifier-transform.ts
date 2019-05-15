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
import isStream from 'is-stream';
import * as Koa from 'koa';
import {transformHTMLString} from './transform-html';
import {transformJavaScriptModuleString} from './transform-javascript-module';

export type TransformSpecifierFunction = (baseURL: string, specifier: string) =>
    string;

export default middleware;
export function middleware(transformSpecifier: TransformSpecifierFunction):
    Koa.Middleware {
  return async (ctx: Koa.Context, next: Function) => {
    await next();

    if (ctx.response.is('html')) {
      ctx.body = resolveSpecifiersInInlineScriptTags(
          await getBodyAsString(ctx.body), ctx.request.url, transformSpecifier);
    }

    if (ctx.response.is('js')) {
      ctx.body = resolveSpecifiersInJavaScriptModule(
          await getBodyAsString(ctx.body), ctx.request.url, transformSpecifier);
    }
  };
}

function resolveSpecifiersInInlineScriptTags(
    body: string,
    requestURL: string,
    transformSpecifier: TransformSpecifierFunction): string {
  return transformHTMLString(body, requestURL, transformSpecifier);
}

function resolveSpecifiersInJavaScriptModule(
    body: string,
    requestURL: string,
    transformSpecifier: TransformSpecifierFunction): string {
  return transformJavaScriptModuleString(body, requestURL, transformSpecifier);
}

// TODO(usergenic): This should probably be published as a separate npm package.
async function getBodyAsString(body: Buffer|string): Promise<string> {
  if (!body) {
    return '';
  }
  if (Buffer.isBuffer(body)) {
    return body.toString();
  }
  if (isStream(body)) {
    return await getStream(body);
  }
  if (typeof body === 'string') {
    return body;
  }
  return '';
}
