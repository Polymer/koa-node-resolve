import serialize from '@babel/generator';
import {parse} from '@babel/parser';
import traverse from '@babel/traverse';
import {NodePath} from '@babel/traverse';
import {CallExpression, ExportAllDeclaration, ExportNamedDeclaration, ImportDeclaration, isImport, isStringLiteral, Node, StringLiteral} from '@babel/types';
import {TransformSpecifierFunction} from './koa-esm-specifier-transform';

export function transformJavaScriptModuleAST(
    ast: Node, url: string, transformSpecifier: TransformSpecifierFunction) {
  const importExportDeclaration = {
    enter(path: NodePath<ImportDeclaration|ExportAllDeclaration|
                         ExportNamedDeclaration>) {
      if (path.node && path.node.source && isStringLiteral(path.node.source)) {
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
          const argument = <StringLiteral>path.node.arguments[0];
          const specifier = argument.value;
          const rewrittenSpecifier = transformSpecifier(url, specifier);
          argument.value = rewrittenSpecifier;
        }
      }
    }
  });
}

export function transformJavaScriptModuleString(
    js: string, url: string, transformSpecifier: TransformSpecifierFunction):
    string {
  const ast = parse(js, {sourceType: 'unambiguous'});
  const leadingSpace = js.match(/^\s*/)![0];
  const trailingSpace = js.match(/\s*$/)![0];
  transformJavaScriptModuleAST(ast, url, transformSpecifier);
  return leadingSpace + serialize(ast).code + trailingSpace;
}
