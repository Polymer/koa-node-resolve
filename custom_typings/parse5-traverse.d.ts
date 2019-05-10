
declare module 'parse5-traverse' {
import * as p5 from 'parse5';
  export type Node = p5.Node;

  export default function traverse(
      root: Node,
      options: {pre?: (node: Node) => void, post?: (node: Node) => void}): void;
}
