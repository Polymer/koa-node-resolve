import {DefaultTreeNode, Node, parse, serialize} from 'parse5';
import traverse from 'parse5-traverse';
import {resolve as resolveURL} from 'url';
import {TransformSpecifierFunction} from './koa-esm-specifier-transform';
import {getAttr, getTextContent, removeFakeRootElements, setTextContent} from './support/parse5-utils';
import {transformJavaScriptModuleString} from './transform-javascript-module';

export function transformHTMLAST(
    ast: Node, url: string, transformSpecifier: TransformSpecifierFunction) {
  const baseURL = getBaseURL(ast, url);
  getInlineModuleScripts(ast).forEach((scriptTag) => {
    const js = getTextContent(scriptTag);
    const transformedJs =
        transformJavaScriptModuleString(js, baseURL, transformSpecifier);
    setTextContent(scriptTag, transformedJs);
  })
  return;
}

export function transformHTMLString(
    html: string, url: string, transformSpecifier: TransformSpecifierFunction) {
  const ast = parse(html);
  removeFakeRootElements(ast);
  transformHTMLAST(ast, url, transformSpecifier);
  return serialize(ast);
}

function getBaseURL(ast: Node, location: string): string {
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

function getBaseTag(ast: Node): Node|undefined {
  return getTags(ast, 'base').shift();
}

function getInlineModuleScripts(ast: Node): Node[] {
  return getTags(ast, 'script')
      .filter(
          (node) =>
              getAttr(node, 'type') === 'module' && !getAttr(node, 'src'));
}

function getTags(ast: Node, name: string): Node[] {
  return query(ast, (node: Node) => (<DefaultTreeNode>node).nodeName === name);
}

function query(ast: Node, filter: (node: Node) => boolean): Node[] {
  const nodes: Node[] = [];
  traverse(ast, {
    pre: (node: Node) => {
      filter(node);
      nodes.push(node);
    }
  });
  return nodes;
}
