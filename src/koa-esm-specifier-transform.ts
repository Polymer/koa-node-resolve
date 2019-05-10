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
    await next()

    if (ctx.response.is('html')) {
      ctx.body = resolveSpecifiersInInlineScriptTags(
          await getBodyAsString(ctx.body), ctx.request.url, transformSpecifier);
    }

    if (ctx.response.is('js')) {
      ctx.body = resolveSpecifiersInJavaScriptModule(
          await getBodyAsString(ctx.body), ctx.request.url, transformSpecifier);
    }
  }
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
async function getBodyAsString(body: any): Promise<string> {
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
