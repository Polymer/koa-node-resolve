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
import {DefaultTreeNode} from 'parse5';
import {resolve as resolveURL} from 'url';

import {JSModuleSourceStrategy, SpecifierTransform} from './koa-module-specifier-transform';
import {getAttr, getTextContent, nodeWalkAll, setTextContent} from './support/parse5-utils';
import {preserveSurroundingWhitespace} from './support/string-utils';
import {transformJSModule} from './transform-js-module';

export const transformHTML =
    (ast: DefaultTreeNode,
     url: string,
     specifierTransform: SpecifierTransform,
     jsModuleTransform: JSModuleSourceStrategy): DefaultTreeNode => {
      const baseURL = getBaseURL(ast, url);
      getInlineModuleScripts(ast).forEach((scriptTag) => {
        const originalJS = getTextContent(scriptTag);
        const transformedJS = preserveSurroundingWhitespace(
            originalJS,
            jsModuleTransform(
                originalJS,
                (ast) => transformJSModule(ast, baseURL, specifierTransform)));
        setTextContent(scriptTag, transformedJS);
      });
      return ast;
    };

const getBaseURL = (ast: DefaultTreeNode, location: string): string => {
  const baseTag = getBaseTag(ast);
  if (!baseTag) {
    return location;
  }
  const baseHref = getAttr(baseTag, 'href');
  if (!baseHref) {
    return location;
  }
  return resolveURL(location, baseHref);
};

const getBaseTag = (ast: DefaultTreeNode): DefaultTreeNode|undefined =>
    getTags(ast, 'base').shift();

const getInlineModuleScripts = (ast: DefaultTreeNode): DefaultTreeNode[] =>
    getTags(ast, 'script')
        .filter(
            (node) =>
                getAttr(node, 'type') === 'module' && !getAttr(node, 'src'));

const getTags = (ast: DefaultTreeNode, name: string): DefaultTreeNode[] =>
    nodeWalkAll(ast, (node) => node.nodeName === name);
