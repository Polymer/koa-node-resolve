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

import {nodeResolve} from '../koa-node-resolve';

import {createAndServe, squeeze, testLogger} from './test-utils';

const fixturesPath = resolvePath(__dirname, '../../test/fixtures/');

test('nodeResolve middleware transforms resolvable specifiers', async (t) => {
  t.plan(4);
  const logger = testLogger();
  createAndServe(
      {
        middleware:
            [nodeResolve({root: fixturesPath, logger, logLevel: 'debug'})],
        routes: {
          '/my-module.js': `import * as x from 'x';`,
          '/my-page.html': `
            <script type="module">
            import * as x from 'x';
            </script>
          `,
        },
      },
      async (server) => {
        t.equal(
            squeeze((await request(server).get('/my-module.js')).text),
            squeeze(`
              import * as x from './node_modules/x/main.js';
            `),
            'should transform specifiers in JavaScript module');
        t.equal(
            squeeze((await request(server).get('/my-page.html')).text),
            squeeze(`
              <script type="module">
              import * as x from './node_modules/x/main.js';
              </script>
            `),
            'should transform specifiers in inline module script');
        t.deepEqual(logger.debugs.map((args) => args.join(' ')), [
          '[koa-node-resolve] Resolved Node module specifier "x" to "./node_modules/x/main.js"',
          '[koa-node-resolve] Resolved Node module specifier "x" to "./node_modules/x/main.js"',
        ]);
        t.deepEqual(logger.infos.map((args) => args.join(' ')), [
          '[koa-node-resolve] Transformed 1 module specifier(s) in "/my-module.js"',
          '[koa-node-resolve] Transformed 1 module specifier(s) in "/my-page.html"',
        ]);
      });
});

test('nodeResolve middleware ignores unresolvable specifiers', async (t) => {
  t.plan(2);
  const logger = testLogger();
  createAndServe(
      {
        middleware: [nodeResolve({root: fixturesPath, logger})],
        routes: {
          '/my-module.js': `
            import * as wubbleFlurp from 'wubble-flurp';
          `,
          '/my-page.html': `
            <script type="module">
            import * as wubbleFlurp from 'wubble-flurp';
            </script>
          `,
        },
      },
      async (server) => {
        t.equal(
            squeeze((await request(server).get('/my-module.js')).text),
            squeeze(`
              import * as wubbleFlurp from 'wubble-flurp';
            `),
            'should leave unresolvable specifier in external scripts alone');
        t.equal(
            squeeze((await request(server).get('/my-page.html')).text),
            squeeze(`
              <script type="module">
              import * as wubbleFlurp from 'wubble-flurp';
              </script>
            `),
            'should leave unresolvable specifier in inline scripts alone');
      });
});
