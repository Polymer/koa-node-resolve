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

import {leveledLogger, Logger, LogLevel} from './support/logger';
import {removeFakeRootElements} from './support/parse5-utils';
import {preserveSurroundingWhitespace} from './support/string-utils';
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

export type SpecifierTransform =
    (baseURL: string, specifier: string, logger: Logger) => string|undefined;

export type ModuleSpecifierTransformOptions = {
  logger?: Logger|false,
  logLevel?: LogLevel,
  htmlParser?: HTMLParser,
  htmlSerializer?: HTMLSerializer,
  jsParser?: JSParser,
  jsSerializer?: JSSerializer,
};

const defaultHTMLParser = (html: string): Parse5Node =>
    parse5Parse(html) as Parse5Node;

const defaultHTMLSerializer = (ast: Parse5Node): string => {
  removeFakeRootElements(ast);
  return parse5Serialize(ast);
};

const defaultJSParser = (js: string): BabelNode =>
    babelParse(js, {
      sourceType: 'unambiguous',
      allowAwaitOutsideFunction: true,
      plugins: [
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'importMeta',
      ],
    }) as BabelNode;

// TODO(usergenic): Send PR to update `@types/babel__generator`
declare module '@babel/generator' {
  interface GeneratorOptions {
    jsescOption: {
      quotes: 'single'|'double',
    };
    retainFunctionParens: Boolean;
  }
}

const defaultJSSerializer = (ast: BabelNode): string =>
    babelSerialize(ast, {
      concise: false,
      jsescOption: {
        quotes: 'single',
      },
      retainFunctionParens: true,
      retainLines: true,
    }).code;

export const moduleSpecifierTransform =
    (specifierTransform: SpecifierTransform,
     options: ModuleSpecifierTransformOptions = {}): Koa.Middleware => {
      const logLevel = options.logLevel || 'warn';
      const logger = options.logger === false ?
          {} :
          leveledLogger(options.logger || console, logLevel);
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

        let specifierTransformCount = 0;
        const countedSpecifierTransform =
            (baseURL: string, specifier: string, logger: Logger): undefined|
            string => {
              const result = specifierTransform(baseURL, specifier, logger);
              if (result && result !== specifier) {
                ++specifierTransformCount;
              }
              return result;
            };

        try {
          if (ctx.response.is('html')) {
            ctx.body = preserveSurroundingWhitespace(
                body,
                htmlSourceStrategy(
                    body,
                    (ast) => transformHTML(
                        ast,
                        url,
                        countedSpecifierTransform,
                        jsSourceStrategy,
                        logger)));
          } else if (ctx.response.is('js')) {
            ctx.body = preserveSurroundingWhitespace(
                body,
                jsSourceStrategy(
                    body,
                    (ast) => transformJSModule(
                        ast, url, countedSpecifierTransform, logger)));
          }
          if (specifierTransformCount > 0) {
            logger.info &&
                logger.info(`Transformed ${
                    specifierTransformCount} module specifier(s) in "${url}"`);
          }
        } catch (error) {
          logger.error &&
              logger.error(
                  `Unable to transform module specifiers in "${url}" due to`,
                  error);
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
