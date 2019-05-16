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
const Koa = require("koa");
const server = new Koa()
  .use(require("koa-node-resolve").middleware())
  .use(require("koa-static")("."))
  .listen(3000);
```

```sh
$ node dev-server.js
```

Now you can serve up your web assets and Node package specifiers will be transformed on request.

## Karma Testing Setup

In a `karma` setup, your `karma.conf.js` file could create the Koa server before exporting the config. The Koa server uses the `koa-proxy` package (therefore `npm install --save-dev koa-proxy`) in between the browser and the Karma server, transforming all the Node package specifiers encountered in documents located under the `base/` URL namespace, which is a special Karma behavior for partitioning the package resources under test from Karma support resources.

```js
const Koa = require("koa");
const server = new Koa()
  .use(require("koa-node-resolve").middleware({ baseHref: "base" }))
  .use(require("koa-proxy")({ host: "http://127.0.0.1:9876" }))
  .listen(9877);

module.exports = config => {
  config.set({
    upstreamProxy: {
      hostname: "127.0.0.1",
      port: 9877,
    },
  });
};
```

In this setup, the Koa proxy server that runs the Node resolution middleware will be on port 9877 and the Karma server will be on port 9876, so be sure to open up `http://127.0.0.1:9877` in your browser rather than `http://127.0.0.1:9876`. The `upstreamProxy` configuration block tells Karma, when it launches browsers, to points them to the Koa app instead of directly to the Karma server.
