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
import traverse from '@babel/traverse';
import {NodePath} from '@babel/traverse';
import {CallExpression, ExportAllDeclaration, ExportNamedDeclaration, ImportDeclaration, isImport, isStringLiteral, Node, StringLiteral} from '@babel/types';
import {SpecifierTransform} from './koa-module-specifier-transform';

export const transformJSModule =
    (ast: Node, url: string, specifierTransform: SpecifierTransform) => {
      const importExportDeclaration = {
        enter(path: NodePath<ImportDeclaration|ExportAllDeclaration|
                             ExportNamedDeclaration>) {
          if (path.node && path.node.source &&
              isStringLiteral(path.node.source)) {
            const specifier = path.node.source.value;
            const transformedSpecifier = specifierTransform(url, specifier);
            if (typeof transformedSpecifier === 'undefined') {
              return;
            }
            path.node.source.value = transformedSpecifier;
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
              const transformedSpecifier = specifierTransform(url, specifier);
              if (typeof transformedSpecifier === 'undefined') {
                return;
              }
              argument.value = transformedSpecifier;
            }
          }
        }
      });
    };
