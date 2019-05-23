# koa-node-resolve

Middleware for Koa servers that resolves Node package specifiers in standard JS modules to relative paths for use on the web.

The following import uses a _bare module specifier_, which won't currently load natively in browsers (until [import maps](https://www.chromestatus.com/feature/5315286962012160) are available):

```js
import { foo } from "stuff";
```

`koa-node-resolve` solves this problem by resolving `stuff` using the same rules as [Node `require()`](https://nodejs.org/api/modules.html#modules_all_together), and transforming the import specifier to a path that can be loaded natively by any browser that [supports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Browser_compatibility) standard JS modules:

```js
import { foo } from "./node_modules/stuff/index.js";
```

Because this is middleware, you can use it in a simple static file server as well as a proxy server sitting in front of a test server such as the one `karma` starts up. (See [karma testing setup](#karma-testing-setup) below.)

Note: HTML and JavaScript are parsed on every request for those content-types, it is intended for use in development context to facilitate build-free testing/iteration as opposed to in a high volume production web server.

## Installation

```sh
$ npm install --save koa-node-resolve
```

## Usage

Create your own mini-development server in file `./dev-server.js`. This one depends on `koa` and `koa-static`, so you'll need to `npm install --save-dev koa koa-static` for your project to use it.

```js
const Koa = require('koa');
const staticFiles = require('koa-static');
const { nodeResolve } = require('koa-node-resolve');

const server = new Koa()
  .use(nodeResolve())
  .use(staticFiles('.'))
  .listen(3000);
```

```sh
$ node dev-server.js
```

Now you can serve up your web assets and Node package specifiers will be transformed on request.

## Configuration

`nodeResolve(options={})`

### Options

 - `root` the on-disk directory that maps to the served root URL, used to resolve module specifiers in filesystem.  In most cases this should match the root directory configured in your downstream static file server middleware.
 - `logger` an alternative logger to use (`console` is the default).
 - `html` an alternate parse/serialize strategy function for HTML documents of the following form:
    ```js
    (source: string, transform: (ast: parse5.DefaultTreeNode) => void) => string
    ```
    The `transform` parameter is a function that takes as its paramter a `DefaultTreeNode` from the `parse5` package.  The purpose of the strategy function is to allow customization of the parsing, pre-processing and serializing of HTML content encountered by the middleware.  The default behavior is represented below:
    ```js
    import { removeFakeRootElements} from 'koa-node-resolve/lib/support/parse5-utils.js';
    const parse5 = require('parse5');
    const nodeResolve = require('koa-node-resolve');

    nodeResolve({html: (soruce, transform) => {
      const ast = parse5.parse(source);
      // The `parse5` library adds "synthetic" html, head and body elements
      // when it parses a document that doesn't contain them.  This function
      // removes these synthetic elements to preserve the literal form of
      // content that passes through the middleware.
      removeFakeRootElements(ast);
      transform(ast);
      return parse5.serialize(ast);
    }});
    ```

 - `js` an alternate parse/serialize strategy function for JavaScript modules.  Takes the form:
    ```js
    (source: string, transform: (ast: babel.Node) => void) => string
    ```
    The `transform` parameter is a function that takes as its parameter a `Node` from the `babel` package.  The purpose of the strategy function is to allow customization of the parsing, processing and serializing of the JavaScript module content encountered by the middleware.  The default behavior is represented below:
    ```js
    const parser = require('@babel/parse');
    const serialize = require('@babel/generator');
    const nodeResolve = require('koa-node-resolve');

    nodeResolve({js: (source, transform) => {
      const ast = parser.parse(source, {sourceType: 'unambiguous'});
      transform(ast);
      return serialize(ast).code;
    }})
    ```
    The most common reason to define your own JavaScript transform strategy is to parse using babel syntax plugins that your project is making use of, such as decorators, dynamic imports or import meta etc. 

## Karma Testing Setup

In a `karma` setup, your `karma.conf.js` file could create the Koa server before exporting the config. The Koa server uses the `koa-proxy` package (therefore `npm install --save-dev koa-proxy`) in between the browser and the Karma server, transforming all the Node package specifiers encountered in documents located under the `base/` URL namespace, which is a special Karma behavior for partitioning the package resources under test from Karma support resources.

```js
const Koa = require('koa');
const mount = require('koa-mount');
const proxy = require('koa-proxy');
const { nodeResolve } = require('koa-node-resolve');

const server = new Koa()
  .use(mount('/base', nodeResolve()))
  .use(proxy({ host: 'http://127.0.0.1:9876' }))
  .listen(9877);

module.exports = config => {
  config.set({
    upstreamProxy: {
      hostname: '127.0.0.1',
      port: 9877,
    },
    files: [
      { pattern: 'test/**/*.js', type: 'module' },
      { pattern: '**/*.js', included: false },
      { pattern: 'node_modules/**/*', included: false },
    ],
  });
};
```

In this setup, the Koa proxy server that runs the Node resolution middleware will be on port 9877 and the Karma server will be on port 9876, so be sure to open up `http://127.0.0.1:9877` in your browser rather than `http://127.0.0.1:9876`. The `upstreamProxy` configuration block tells Karma, when it launches browsers, to points them to the Koa app instead of directly to the Karma server.

Note also that in this configuration its important to tell Karma that the test files are modules and to serve those up, but to list the other files, like the ones in `node_modules` as available but not "included" (i.e. Karma can serve them by request, but shouldn't add inline dependencies on them when generating its "context" HTML).
