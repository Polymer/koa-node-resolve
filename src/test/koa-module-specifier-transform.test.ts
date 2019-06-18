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
import request from 'supertest';
import test from 'tape';

import {moduleSpecifierTransform} from '../koa-module-specifier-transform';

import {createAndServe, squeeze, testLogger} from './test-utils';

test('moduleSpecifierTransform callback returns undefined to noop', async (t) => {
  t.plan(3);
  const logger = testLogger();
  createAndServe(
      {
        middleware: [moduleSpecifierTransform(
            (_baseURL, specifier, _logger) =>
                specifier === 'y' ? './node_modules/y/index.js' : undefined,
            {logger, logLevel: 'info'})],
        routes: {
          '/my-module.js': `
            import * as x from 'x';
            import * as y from 'y';
          `,
          '/my-page.html': `
            <script type="module">
            import * as x from 'x';
            import * as y from 'y';
            </script>
          `,
        },
      },
      async (server) => {
        t.equal(
            squeeze((await request(server).get('/my-module.js')).text),
            squeeze(`
              import * as x from 'x';
              import * as y from './node_modules/y/index.js';
            `),
            'should transform only defined specifiers in external module');
        t.equal(
            squeeze((await request(server).get('/my-page.html')).text),
            squeeze(`
              <script type="module">
              import * as x from 'x';
              import * as y from './node_modules/y/index.js';
              </script>
            `),
            'should transform only defined specifiers in inline module script');
        t.deepEqual(logger.infos.map((args) => args.join(' ')), [
          'Transformed 1 module specifier(s) in "/my-module.js"',
          'Transformed 1 module specifier(s) in "/my-page.html"',
        ]);
      });
});

test('moduleSpecifierTransform will convert dynamic imports', async (t) => {
  t.plan(3);
  const logger = testLogger();
  createAndServe(
      {
        middleware: [moduleSpecifierTransform(
            (_baseURL, specifier, _logger) =>
                `./node_modules/${specifier}/index.js`,
            {logger, logLevel: 'info'})],
        routes: {
          '/my-module.js': `
            import('x').then((x) => x.doStuff());
          `,
          '/my-page.html': `
            <script type="module">
            import('x').then((x) => x.doStuff());
            </script>
          `,
        }
      },
      async (server) => {
        t.equal(
            squeeze((await request(server).get('/my-module.js')).text),
            // NOTE(usergenic): @babel/generator doesn't have an option to
            // retain parenthesis around single parameter anonymous functions,
            // so `(x) => ...` is unavoidably transformed to `x => ...`
            squeeze(`
              import('./node_modules/x/index.js').then(x => x.doStuff());
            `),
            'should transform dynamic import in external module');
        t.equal(
            squeeze((await request(server).get('/my-page.html')).text),
            squeeze(`
              <script type="module">
              import('./node_modules/x/index.js').then(x => x.doStuff());
              </script>
            `),
            'should transform dynamic import in inline module script');
        t.deepEqual(logger.infos.map((args) => args.join(' ')), [
          'Transformed 1 module specifier(s) in "/my-module.js"',
          'Transformed 1 module specifier(s) in "/my-page.html"',
        ]);
      });
});

test('moduleSpecifierTransform default parser configuration', async (t) => {
  t.plan(1);
  const logger = testLogger();
  createAndServe(
      {
        middleware: [moduleSpecifierTransform(
            (_baseURL, specifier, _logger) =>
                `./node_modules/${specifier}/index.js`,
            {logger})],
        routes: {
          '/my-module.js': `
            export default from 'x';
            export * as y from 'y';
            async function* infiniteMeta() {
              while (true) {
                yield { ...import.meta };
              }
            }
          `
        }
      },
      async (server) => {
        t.equal(
            squeeze((await request(server).get('/my-module.js')).text),
            squeeze(`
              export default from './node_modules/x/index.js';
              export * as y from './node_modules/y/index.js';
              async function* infiniteMeta() {
                while (true) {
                  yield { ...import.meta };
                }
              }
            `),
            'should tolerate modern JavaScript syntax features');
      });
});

test('moduleSpecifierTransform middleware logs errors', async (t) => {
  t.plan(3);
  const logger = testLogger();
  createAndServe(
      {
        middleware: [moduleSpecifierTransform(
            (_baseURL, _specifier, _logger) => undefined, {logger})],
        routes: {
          '/my-module.js': `
            this is a syntax error;
          `,
          '/my-page.html': `
            <script type="module">
              this is syntax error;
            </script>
          `,
        },
      },
      async (server) => {
        t.equal(
            squeeze((await request(server).get('/my-module.js')).text),
            squeeze(`
              this is a syntax error;
            `),
            'should leave a file with unparseable syntax error alone');
        t.equal(
            squeeze((await request(server).get('/my-page.html')).text),
            squeeze(`
              <script type="module">
              this is syntax error;
              </script>
            `),
            'should leave a file with unparseable inline module script alone');
        t.deepEqual(
            logger.errors.map((args: unknown[]) => args.join(' ')),
            [
              'Unable to transform module specifiers in "/my-module.js" due to SyntaxError: Unexpected token, expected ";" (2:17)',
              'Unable to transform module specifiers in "/my-page.html" due to SyntaxError: Unexpected token, expected ";" (2:19)',
            ],
            'should log every error thrown');
      });
});

test('moduleSpecifierTransform middleware logs callback error', async (t) => {
  t.plan(3);
  const logger = testLogger();
  createAndServe(
      {
        middleware: [moduleSpecifierTransform(
            (_baseURL, _specifier, _logger) => {
              throw new Error('whoopsie daisy');
            },
            {logger})],
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
            'should not transform the external script when error occurs');
        t.equal(
            squeeze((await request(server).get('/my-page.html')).text),
            squeeze(`
              <script type="module">
              import * as wubbleFlurp from 'wubble-flurp';
              </script>
            `),
            'should not transform inline script when error occurs');
        t.deepEqual(
            logger.errors.map((args) => args.join(' ')),
            [
              'Unable to transform module specifiers in "/my-module.js" due to Error: whoopsie daisy',
              'Unable to transform module specifiers in "/my-page.html" due to Error: whoopsie daisy',
            ],
            'should log every error thrown');
      });
});
