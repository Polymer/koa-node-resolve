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
import {preserveOriginalWhitespaceBuffer} from './support/string-utils';
import {transformHTML} from './transform-html';
import {transformJSModule} from './transform-js-module';

export type HTMLASTTransform = (ast: Parse5Node) => Parse5Node;
export type HTMLSourceStrategy = (html: string, transform: HTMLASTTransform) =>
    string;
export type HTMLParser = (html: string) => Parse5Node;
export type HTMLSerializer = (ast: Parse5Node) => string;

export type JSModuleASTTransform = (ast: BabelNode) => BabelNode;
export type JSModuleSourceStrategy =
    (js: string, transform: JSModuleASTTransform) => string;
export type JSParser = (js: string) => BabelNode;
export type JSSerializer = (ast: BabelNode) => string;

export type SpecifierTransform = (baseURL: string, specifier: string) =>
    string|undefined;

export type Logger = {
  error?: Function,
  info?: Function,
  debug?: Function
};

export type ModuleSpecifierTransformOptions = {
  logger?: Logger,
  htmlParser?: HTMLParser,
  htmlSerializer?: HTMLSerializer,
  jsParser?: JSParser,
  jsSerializer?: JSSerializer,
};

const defaultHTMLParser = (html: string): Parse5Node => {
  const ast = parse5Parse(html) as Parse5Node;
  removeFakeRootElements(ast);
  return ast;
};

const defaultHTMLSerializer = (ast: Parse5Node): string => parse5Serialize(ast);

const defaultJSParser = (js: string): BabelNode =>
    babelParse(js, {sourceType: 'unambiguous'}) as BabelNode;

const defaultJSSerializer = (ast: BabelNode): string =>
    babelSerialize(ast).code;

export const moduleSpecifierTransform =
    (specifierTransform: SpecifierTransform,
     options: ModuleSpecifierTransformOptions = {}): Koa.Middleware => {
      const logger = options.logger || console;
      const htmlParser = options.htmlParser || defaultHTMLParser;
      const htmlSerializer = options.htmlSerializer || defaultHTMLSerializer;
      const jsParser = options.jsParser || defaultJSParser;
      const jsSerializer = options.jsSerializer || defaultJSSerializer;

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

        const url = ctx.request.url;

        const htmlSourceStrategy =
            (html: string, transform: HTMLASTTransform): string =>
                htmlSerializer(transform(htmlParser(html)));

        const jsSourceStrategy =
            (js: string, transform: JSModuleASTTransform): string =>
                jsSerializer(transform(jsParser(js)));

        try {
          if (ctx.response.is('html')) {
            ctx.body = preserveOriginalWhitespaceBuffer(
                body,
                htmlSourceStrategy(
                    body,
                    (ast) => transformHTML(
                        ast, url, specifierTransform, jsSourceStrategy)));
          } else if (ctx.response.is('js')) {
            ctx.body = preserveOriginalWhitespaceBuffer(
                body,
                jsSourceStrategy(
                    body,
                    (ast) => transformJSModule(ast, url, specifierTransform)));
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
