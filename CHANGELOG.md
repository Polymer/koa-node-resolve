# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

<!--
   PRs should document their user-visible changes (if any) in the
   Unreleased section, uncommenting the header as necessary.
-->

<!-- ## Unreleased -->
<!-- Add new unreleased items here -->

## [1.0.0-pre.5] - 2019-06-25
- Fixed issue where `nodeResolve()` did not properly effect the level of the provided `logger` where individual specifier transform logging was concerned.
- Fix `Module '@babel/generator' resolves to an untyped module` error for TypeScript users.
- Fix issue where html/head/body tags were stripped out by default parser/serializer.

## [1.0.0-pre.4] - 2019-06-07
- Added `logLevel` option which defaults to `warn` so info/debug transformations are supressed by default.
- Added `dynamicImport`, `importMeta`, `exportDefaultFrom` and `exportNamespaceFrom` to default Babel parser configuration.
- Added single-quoted strings, `retainFunctionParens` and `retainLines` to default Babel generator configuration.

## [1.0.0-pre.3] - 2019-06-06
- Fix missing `@types/parse5` dependency for TypeScript users.
- Fix invalid TypeScript typings related to the logger option.

## [1.0.0-pre.2] - 2019-06-05
- Rewrites resolvable Node package specifiers in JavaScript module files.
- Rewrites resolvable Node package specifiers in HTML files in `<script type="module">` elements, honoring `<base href>` where present.
