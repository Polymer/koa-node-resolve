# koa-node-resolve

This is a middleware for Koa servers that resolves Node package specifiers in standard JS modules to relative paths for use on the web.  It is currently only intended for use as middleware in development servers to fascilitate build-free testing/iteration.

## What?

So you want to write your front-end code using standard JS modules and you're using NPM packages and you don't want to run a build step to transform those various import statements from convenient forms like: `import stuff from 'stuff'` into `import stuff from './node_modules/stuff/index.js'` etc.  This middleware simply transforms them when serving up the response from your server.

That means you can use the middleware in a simple server that delivers static files as well as in a proxy server that might be piping files from a test server such as the one `karma` starts up.  (See [karma testing setup](#karma-testing-setup) below.)

## Installation

```sh
$ npm install --save koa-node-resolve
```

## Usage

Create your own mini-development server in file `./dev-server.js`.  This one depends on `koa` and `koa-static`, so you'll need to `npm install --save-dev koa koa-static` for your project to use it.

```js
const Koa = require('koa');
const server = new Koa()
    .use(require('koa-node-resolve').middleware())
    .use(require('koa-static')('.'))
    .listen(3000);
```

```sh
$ node dev-server.js
```

Now you can serve up your web assets and NPM package specifiers will be transformed on request.

## Karma Testing Setup

In a `karma` setup, your `karma.conf.js` file could create the Koa server before exporting the config.  The Koa server uses the `koa-proxy` package (therefore `npm install --save-dev koa-proxy`) in between the browser and the Karma server, transforming all the NPM package specifiers encountered in documents located under the `base/` URL namespace, which is a special Karma behavior for partitioning the package resources under test from Karma support resources.

```js
const Koa = require('koa');
const server = new Koa()
    .use(require('koa-node-resolve').middleware({baseHref: 'base'}))
    .use(require('koa-proxy')({host: 'http://127.0.0.1:9876'}))
    .listen(9877);

module.exports = (config) => {
  config.set({
    upstreamProxy: {
      hostname: '127.0.0.1',
      port: 9877
    }
  });
}
```

In this setup, the Koa proxy server that runs the Node resolution middleware will be on port 9877 and the Karma server will be on port 9876, so be sure to open up `http://127.0.0.1:9877` in your browser rather than `http://127.0.0.1:9876`.  The `upstreamProxy` configuration block tells Karma, when it launches browsers, to points them to the Koa app instead of directly to the Karma server.
