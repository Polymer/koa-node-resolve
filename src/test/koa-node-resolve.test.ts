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
import {resolve as resolvePath} from 'path';
import request from 'supertest';
import test from 'tape';

import createMiddleware from '../koa-node-resolve';
import {createAndServe, squeezeHTML} from './test-utils';

test('transforms resolvable specifier in JavaScript module', async (t) => {
  t.plan(1);
  createAndServe(
      {
        middleware: [createMiddleware(resolvePath(__dirname, '../..'))],
        routes: {
          '/my-module.js': `import * as resolve from 'resolve';`,
        },
      },
      async (server) => t.equal(
          (await request(server).get('/my-module.js')).text,
          `import * as resolve from "./node_modules/resolve/index.js";`));
});

test('ignores unresolvable specifier in JavaScript module', async (t) => {
  t.plan(1);
  createAndServe(
      {
        middleware: [createMiddleware(resolvePath(__dirname, '../..'))],
        routes: {
          '/my-module.js': `import * as wubbleFlurp from 'wubble-flurp';`,
        },
      },
      async (server) => t.equal(
          (await request(server).get('/my-module.js')).text,
          `import * as wubbleFlurp from 'wubble-flurp';`));
});

test('transforms resolvable specifier in inline module script', async (t) => {
  t.plan(1);
  createAndServe(
      {
        middleware: [createMiddleware(resolvePath(__dirname, '../..'))],
        routes: {
          '/my-page.html': `
            <script type="module">
            import * as resolve from 'resolve';
            </script>
          `,
        },
      },
      async (server) => t.equal(
          squeezeHTML((await request(server).get('/my-page.html')).text),
          squeezeHTML(`
            <script type="module">
            import * as resolve from "./node_modules/resolve/index.js";
            </script>
          `)));
});

test('ignores unresolvable specifier in inline module script', async (t) => {
  t.plan(1);
  createAndServe(
      {
        middleware: [createMiddleware(resolvePath(__dirname, '../..'))],
        routes: {
          '/my-page.html': `
            <script type="module">
            import * as resolveFrom from 'wubble-flurp';
            </script>
          `,
        },
      },
      async (server) => t.equal(
          squeezeHTML((await request(server).get('/my-page.html')).text),
          squeezeHTML(`
            <script type="module">
            import * as resolveFrom from 'wubble-flurp';
            </script>
          `)));
});
