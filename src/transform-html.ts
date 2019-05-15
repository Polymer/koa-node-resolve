import {DefaultTreeNode, Node, parse, serialize} from 'parse5';
import {resolve as resolveURL} from 'url';

import {TransformSpecifierFunction} from './koa-esm-specifier-transform';
import {getAttr, getTextContent, nodeWalkAll, removeFakeRootElements, setTextContent} from './support/parse5-utils';
import {transformJavaScriptModuleString} from './transform-javascript-module';

export function transformHTMLAST(
    ast: DefaultTreeNode,
    url: string,
    transformSpecifier: TransformSpecifierFunction) {
  const baseURL = getBaseURL(ast, url);
  getInlineModuleScripts(ast).forEach((scriptTag) => {
    const js = getTextContent(scriptTag);
    const transformedJs =
        transformJavaScriptModuleString(js, baseURL, transformSpecifier);
    setTextContent(scriptTag, transformedJs);
  });
  return;
}

export function transformHTMLString(
    html: string, url: string, transformSpecifier: TransformSpecifierFunction) {
  const ast = <DefaultTreeNode>parse(html);
  removeFakeRootElements(ast);
  transformHTMLAST(ast, url, transformSpecifier);
  return serialize(ast);
}

function getBaseURL(ast: DefaultTreeNode, location: string): string {
  const baseTag = getBaseTag(ast);
  if (!baseTag) {
    return location;
  }
  const baseHref = getAttr(baseTag, 'href');
  if (!baseHref) {
    return location;
  }
  return resolveURL(location, baseHref);
}

function getBaseTag(ast: DefaultTreeNode): DefaultTreeNode|undefined {
  return getTags(ast, 'base').shift();
}

function getInlineModuleScripts(ast: DefaultTreeNode): DefaultTreeNode[] {
  return getTags(ast, 'script')
      .filter(
          (node) =>
              getAttr(node, 'type') === 'module' && !getAttr(node, 'src'));
}

function getTags(ast: DefaultTreeNode, name: string): DefaultTreeNode[] {
  return nodeWalkAll(ast, (node) => node.nodeName === name);
}
