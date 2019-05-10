import * as Koa from 'koa';
import {resolve as resolvePath} from 'path';
import {parse as parseURL} from 'url';
import esmSpecifierTransform from './koa-esm-specifier-transform';
import resolveNPMSpecifier from './support/resolve-npm-specifier';

export type Options = {
  /* On-disk package root path used for NPM package resolution; defaults to
     current folder. */
  packageRoot?: string,
  /* When serving the package from a base other than root.  If this option is
     given, no specifier resolution will be attempted for documents served
     outside the baseHref. */
  baseHref?: string,
};

export default middleware;
export function middleware(options: Options = {}): Koa.Middleware {
  const onDiskPackageRoot = resolvePath(options.packageRoot || '.');
  const baseHref =
      (options.baseHref || '').replace(/^\//, '').replace(/[^\/]+$/, '');
  return esmSpecifierTransform((baseURL: string, specifier: string) => {
    const path = (parseURL(baseURL).pathname || '/').replace(/^\//, '');
    if (!path.startsWith(baseHref)) {
      return specifier;
    }
    const debasedPath = path.slice(baseHref.length);
    const modulePath = resolvePath(onDiskPackageRoot, debasedPath);
    const resolvedPath = resolveNPMSpecifier(modulePath, specifier);
    return resolvedPath;
  });
}
