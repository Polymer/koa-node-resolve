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
import serialize from '@babel/generator';
import {parse} from '@babel/parser';
import traverse from '@babel/traverse';
import {NodePath} from '@babel/traverse';
import {CallExpression, ExportAllDeclaration, ExportNamedDeclaration, ImportDeclaration, isImport, isStringLiteral, Node, StringLiteral} from '@babel/types';
import {TransformSpecifierFunction} from './koa-module-specifier-transform';

export const transformJavaScriptModuleAST =
    (ast: Node,
     url: string,
     transformSpecifier: TransformSpecifierFunction) => {
      const importExportDeclaration = {
        enter(path: NodePath<ImportDeclaration|ExportAllDeclaration|
                             ExportNamedDeclaration>) {
          if (path.node && path.node.source &&
              isStringLiteral(path.node.source)) {
            const specifier = path.node.source.value;
            path.node.source.value = transformSpecifier(url, specifier);
          }
        }
      };
      traverse(ast, {
        ImportDeclaration: importExportDeclaration,
        ExportAllDeclaration: importExportDeclaration,
        ExportNamedDeclaration: importExportDeclaration,
        CallExpression: {
          enter(path: NodePath<CallExpression>) {
            if (path.node && path.node.callee && isImport(path.node.callee) &&
                path.node.arguments.length === 1 &&
                isStringLiteral(path.node.arguments[0])) {
              const argument = path.node.arguments[0] as StringLiteral;
              const specifier = argument.value;
              const rewrittenSpecifier = transformSpecifier(url, specifier);
              argument.value = rewrittenSpecifier;
            }
          }
        }
      });
    };

export const transformJavaScriptModuleString =
    (js: string, url: string, transformSpecifier: TransformSpecifierFunction):
        string => {
          const ast = parse(js, {sourceType: 'unambiguous'});
          const leadingSpace = js.match(/^\s*/)![0];
          const trailingSpace = js.match(/\s*$/)![0];
          transformJavaScriptModuleAST(ast, url, transformSpecifier);
          return leadingSpace + serialize(ast).code + trailingSpace;
        };
