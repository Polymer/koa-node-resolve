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

/**
 * TODO(usergenic): The following set of helper functions are more-or-less
 * copied from the npm package dom5 which could not be brought in at this
 * time because it is bound to `parse5@4` where this package uses `parse5@5`.
 * Once dom5 is updated, we can just use that package and not maintain these
 * here.
 */
import {DefaultTreeCommentNode, DefaultTreeDocument, DefaultTreeDocumentFragment, DefaultTreeElement, DefaultTreeNode, DefaultTreeParentNode, DefaultTreeTextNode, Location} from 'parse5';

export function filter<T>(
    iter: IterableIterator<T>,
    predicate: (t: T) => boolean,
    matches: T[] = []) {
  for (const value of iter) {
    if (predicate(value)) {
      matches.push(value);
    }
  }
  return matches;
}

export function getAttr(element: DefaultTreeNode, name: string): string {
  if (isElement(element)) {
    const attr = element.attrs.find(({name: attrName}) => attrName === name);
    if (attr) {
      return attr.value;
    }
  }
  return '';
}

export function getTextContent(node: DefaultTreeNode): string {
  if (isCommentNode(node)) {
    return node.data;
  }
  if (isTextNode(node)) {
    return node.value;
  }
  const subtree = nodeWalkAll(node, isTextNode);
  return subtree.map(getTextContent).join('');
}

export function setAttr(element: DefaultTreeNode, name: string, value: string) {
  if (!isElement(element)) {
    return;
  }
  const attr = element.attrs.find(({name: attrName}) => attrName === name);
  if (attr) {
    attr.value = value;
  } else {
    element.attrs.push({name, value});
  }
}

export function insertBefore(
    parent: DefaultTreeNode,
    oldNode: DefaultTreeNode,
    newNode: DefaultTreeNode) {
  if (!isParent(parent)) {
    return;
  }
  const index = parent.childNodes.indexOf(oldNode);
  insertNode(parent, index, newNode);
}

export function insertNode(
    parent: DefaultTreeNode,
    index: number,
    newNode: DefaultTreeNode,
    replace: DefaultTreeNode|undefined = undefined) {
  if (!isParent(parent)) {
    return;
  }
  let newNodes: DefaultTreeNode[] = [];
  let removedNode = replace ? parent.childNodes[index] : null;
  if (newNode) {
    if (isDocumentFragment(newNode)) {
      if (newNode.childNodes) {
        newNodes = [...newNode.childNodes];
        newNode.childNodes.length = 0;
      }
    } else {
      newNodes = [newNode];
      removeNode(newNode);
    }
  }
  if (replace) {
    removedNode = parent.childNodes[index];
  }
  parent.childNodes.splice(index, replace ? 1 : 0, ...newNodes);
  newNodes.forEach((n) => {
    if (isChild(n)) {
      n.parentNode = parent;
    }
  });

  if (removedNode && isChild(removedNode)) {
    (<{parentNode: DefaultTreeParentNode | undefined}>removedNode).parentNode =
        undefined;
  }
}

export function isChild(node: DefaultTreeNode): node is DefaultTreeTextNode|
    DefaultTreeCommentNode|DefaultTreeElement {
  return isCommentNode(node) || isElement(node) || isTextNode(node);
}

export function isCommentNode(node: DefaultTreeNode):
    node is DefaultTreeCommentNode {
  return node.nodeName === '#comment';
}

export function isDocument(node: DefaultTreeNode): node is DefaultTreeDocument {
  return node.nodeName === '#document';
}

export function isDocumentFragment(node: DefaultTreeNode):
    node is DefaultTreeDocumentFragment {
  return node.nodeName === '#document-fragment';
}

export function isElement(node: DefaultTreeNode): node is DefaultTreeElement {
  return !node.nodeName.startsWith('#');
}

export function isParent(node: DefaultTreeNode): node is DefaultTreeDocument|
    DefaultTreeDocumentFragment|DefaultTreeElement {
  return isElement(node) || isDocumentFragment(node) || isDocument(node);
}

export function isTextNode(node: DefaultTreeNode): node is DefaultTreeTextNode {
  return node.nodeName === '#text';
}

export const defaultChildNodes = (node: DefaultTreeParentNode) =>
    node.childNodes;

export function*
    depthFirst(
        node: DefaultTreeNode,
        getChildNodes: typeof defaultChildNodes = defaultChildNodes):
        IterableIterator<DefaultTreeNode> {
  yield node;
  if (isParent(node)) {
    const childNodes = getChildNodes(node);
    if (childNodes === undefined) {
      return;
    }
    for (const child of childNodes) {
      yield* depthFirst(child, getChildNodes);
    }
  }
}

export function nodeWalkAll(
    node: DefaultTreeNode,
    predicate: (node: DefaultTreeNode) => boolean,
    matches: DefaultTreeNode[] = [],
    getChildNodes: typeof defaultChildNodes = defaultChildNodes) {
  return filter(depthFirst(node, getChildNodes), predicate, matches);
}

export function removeFakeRootElements(node: DefaultTreeNode) {
  const fakeRootElements: DefaultTreeElement[] = [];
  nodeWalkAll(node, (node) => {
    if (node.nodeName && node.nodeName.match(/^(html|head|body)$/i) &&
        !(<DefaultTreeElement&{sourceCodeLocation: Location | undefined}>node)
             .sourceCodeLocation) {
      fakeRootElements.unshift(node as DefaultTreeElement);
    }
    return false;
  });
  fakeRootElements.forEach(removeNodeSaveChildren);
}

export function removeNode(node: DefaultTreeNode) {
  if (isChild(node)) {
    const parent = node.parentNode;
    if (parent && parent.childNodes) {
      const idx = parent.childNodes.indexOf(node);
      parent.childNodes.splice(idx, 1);
    }
  }
  (node as unknown as {parentNode: Object | undefined}).parentNode = undefined;
}

export function removeNodeSaveChildren(node: DefaultTreeNode) {
  // We can't save the children if there's no parent node to provide
  // for them.
  if (!isChild(node)) {
    return;
  }
  const fosterParent = node.parentNode;
  if (!fosterParent) {
    return;
  }
  if (isParent(node)) {
    const children = (node.childNodes || []).slice();
    for (const child of children) {
      insertBefore(fosterParent as unknown as DefaultTreeNode, node, child);
    }
  }
  removeNode(node);
}

export function setTextContent(node: DefaultTreeNode, value: string) {
  if (isCommentNode(node)) {
    node.data = value;
  } else if (isTextNode(node)) {
    node.value = value;
  } else if (isParent(node)) {
    newTextNode(value, node);
  }
}

export function newTextNode(
    value: string, parentNode: DefaultTreeParentNode): DefaultTreeTextNode {
  const textNode: DefaultTreeTextNode = {nodeName: '#text', value, parentNode};
  parentNode.childNodes = [textNode];
  return textNode;
}
