import {resolve as resolvePath} from 'path';
import request from 'supertest';
import test from 'tape';

import createMiddleware from '../koa-npm-resolution';

import {createAndServe, squeezeHTML} from './test-utils';

test('transforms resolvable specifier in JavaScript module', async (t) => {
  t.plan(1);
  createAndServe(
      {
        middleware:
            [createMiddleware({packageRoot: resolvePath(__dirname, '../..')})],
        routes: {
          '/my-module.js': `import * as resolveFrom from 'resolve-from';`,
        },
      },
      async (server) => t.equal(
          (await request(server).get('/my-module.js')).text,
          `import * as resolveFrom from "./node_modules/resolve-from/index.js";`));
});

test('ignores unresolvable specifier in JavaScript module', async (t) => {
  t.plan(1);
  createAndServe(
      {
        middleware:
            [createMiddleware({packageRoot: resolvePath(__dirname, '../..')})],
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
        middleware:
            [createMiddleware({packageRoot: resolvePath(__dirname, '../..')})],
        routes: {
          '/my-page.html': `
            <script type="module">
            import * as resolveFrom from 'resolve-from';
            </script>
          `,
        },
      },
      async (server) => t.equal(
          squeezeHTML((await request(server).get('/my-page.html')).text),
          squeezeHTML(`
            <script type="module">
            import * as resolveFrom from "./node_modules/resolve-from/index.js";
            </script>
          `)));
});

test('ignores unresolvable specifier in inline module script', async (t) => {
  t.plan(1);
  createAndServe(
      {
        middleware:
            [createMiddleware({packageRoot: resolvePath(__dirname, '../..')})],
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
