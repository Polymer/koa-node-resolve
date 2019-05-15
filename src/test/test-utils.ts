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
import {Server} from 'http';
import Koa from 'koa';
import route from 'koa-route';

export type AppOptions = {
  middleware?: Koa.Middleware[],
  routes?: {[key: string]: string|Function},
};

export function createApp(options: AppOptions): Koa {
  const app = new Koa();
  const {middleware, routes} = options;
  if (middleware) {
    for (const m of middleware) {
      app.use(m);
    }
  }
  if (routes) {
    for (const key of Object.keys(routes)) {
      const value = routes[key];
      app.use(route.get(key, (ctx) => {
        if (key.endsWith('.js')) {
          ctx.type = 'js';
        }
        if (key.endsWith('.html')) {
          ctx.type = 'html';
        }
        ctx.body = value;
      }));
    }
  }
  return app;
}

export async function createAndServe(
    options: AppOptions, callback: (server: Server) => void) {
  serveApp(createApp(options), callback);
}

export async function serveApp(app: Koa, callback: (server: Server) => void) {
  const port = process.env.PORT || 3000;
  const server =
      app.listen(port).on('error', (e) => `ERROR: ${console.log(e)}`);
  await callback(server);
  server.close();
}

export function squeezeHTML(html: string): string {
  return html.replace(/\s+/mg, ' ')
      .replace(/>\s</g, '><')
      .replace(/>\s/g, '>\n')
      .replace(/\s</g, '\n<')
      .trim();
}
