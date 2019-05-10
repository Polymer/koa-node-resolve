import {relative} from 'path';
import resolveFrom from 'resolve-from';

export default function resolveNPMSpecifier(
    modulePath: string, specifier: string): string {
  const resolved = resolveFrom.silent(modulePath, specifier);
  if (resolved) {
    return relativePath(modulePath, resolved);
  }
  return specifier;
}

export function relativePath(from: string, to: string): string {
  from = fslash(from);
  to = fslash(to);
  if (!from.endsWith('/')) {
    from = from.replace(/[^/]*$/, '');
  }
  return ensureLeadingDot(relative(from, to));
}

function ensureLeadingDot(path: string): string {
  if (path.startsWith('../') || path.startsWith('./')) {
    return path;
  }
  return './' + path;
}

function fslash(path: string): string {
  return path.replace(/\\/g, '/');
}
