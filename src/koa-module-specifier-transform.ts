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
import babelSerialize from '@babel/generator';
import {parse as babelParse} from '@babel/parser';
import {Node as BabelNode} from '@babel/types';
import getStream from 'get-stream';
import * as Koa from 'koa';
import {DefaultTreeNode as Parse5Node, parse as parse5Parse, serialize as parse5Serialize} from 'parse5';
import {Stream} from 'stream';

import {removeFakeRootElements} from './support/parse5-utils';
import {transformHTMLAST} from './transform-html-ast';
import {transformJavaScriptModuleAST} from './transform-javascript-module-ast';

export type HTMLASTTransformFunction = (ast: Parse5Node) => void;
export type HTMLStringTransformFunction =
    (html: string, transform: HTMLASTTransformFunction) => string;

export type JavaScriptModuleASTTransformFunction = (ast: BabelNode) => void;
export type JavaScriptModuleStringTransformFunction =
    (js: string, transform: JavaScriptModuleASTTransformFunction) => string;

export type TransformSpecifierFunction = (baseURL: string, specifier: string) =>
    string|undefined;

export type Logger = {
  error?: Function,
  info?: Function,
  debug?: Function
};

export type ModuleSpecifierTransformOptions = {
  logger?: Logger,
  html?: HTMLStringTransformFunction,
  js?: JavaScriptModuleStringTransformFunction,
};

const defaultHTMLStringTransformer =
    (html: string, transform: HTMLASTTransformFunction) => {
      const ast = parse5Parse(html) as Parse5Node;
      removeFakeRootElements(ast);
      transform(ast);
      return parse5Serialize(ast);
    };

const defaultJavaScriptModuleStringTransformer =
    (js: string, transform: JavaScriptModuleASTTransformFunction) => {
      const leadingSpace = js.match(/^\s*/)![0];
      const trailingSpace = js.match(/\s*$/)![0];
      const ast = babelParse(js, {sourceType: 'unambiguous'}) as BabelNode;
      transform(ast);
      return leadingSpace + babelSerialize(ast).code + trailingSpace;
    };

export const moduleSpecifierTransform =
    (transformSpecifier: TransformSpecifierFunction,
     options: ModuleSpecifierTransformOptions = {}): Koa.Middleware => {
      const logger = options.logger || console;
      const html = options.html || defaultHTMLStringTransformer;
      const js = options.js || defaultJavaScriptModuleStringTransformer;

      return async (ctx: Koa.Context, next: Function) => {
        await next();

        // When the response is not HTML or JavaScript, we have nothing to
        // transform.
        if (!(ctx.response.is('html') || ctx.response.is('js'))) {
          return;
        }

        const body = await getBodyAsString(ctx.body);
        // When there's no body to return, there's nothing to transform.
        if (!body) {
          return;
        }

        try {
          const url = ctx.request.url;
          if (ctx.response.is('html')) {
            ctx.body = html(body, (ast) => {
              transformHTMLAST(ast, url, transformSpecifier, js);
            });
          } else if (ctx.response.is('js')) {
            ctx.body = js(body, (ast) => {
              transformJavaScriptModuleAST(ast, url, transformSpecifier);
            });
          }
        } catch (error) {
          if (logger.error) {
            logger.error(error);
          }
        }
      };
    };

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
    typeof (value as {pipe: Function | undefined}).pipe === 'function';
