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

import {koaNodeResolve} from '../koa-node-resolve';
import {createAndServe, squeezeHTML} from './test-utils';

const fixturesPath = resolvePath(__dirname, '../../test/fixtures/');

test('transforms resolvable specifier in JavaScript module', async (t) => {
  t.plan(1);
  createAndServe(
      {
        middleware: [koaNodeResolve(fixturesPath)],
        routes: {
          '/my-module.js': `import * as x from 'x';`,
        },
      },
      async (server) => t.equal(
          (await request(server).get('/my-module.js')).text,
          `import * as x from "./node_modules/x/main.js";`));
});

test('ignores unresolvable specifier in JavaScript module', async (t) => {
  t.plan(1);
  createAndServe(
      {
        middleware: [koaNodeResolve(fixturesPath)],
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
        middleware: [koaNodeResolve(fixturesPath)],
        routes: {
          '/my-page.html': `
            <script type="module">
            import * as x from 'x';
            </script>
          `,
        },
      },
      async (server) => t.equal(
          squeezeHTML((await request(server).get('/my-page.html')).text),
          squeezeHTML(`
            <script type="module">
            import * as x from "./node_modules/x/main.js";
            </script>
          `)));
});

test('ignores unresolvable specifier in inline module script', async (t) => {
  t.plan(1);
  createAndServe(
      {
        middleware: [koaNodeResolve(fixturesPath)],
        routes: {
          '/my-page.html': `
            <script type="module">
            import * as wubbleFlurp from 'wubble-flurp';
            </script>
          `,
        },
      },
      async (server) => t.equal(
          squeezeHTML((await request(server).get('/my-page.html')).text),
          squeezeHTML(`
            <script type="module">
            import * as wubbleFlurp from 'wubble-flurp';
            </script>
          `)));
});
