# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

<!--
   PRs should document their user-visible changes (if any) in the
   Unreleased section, uncommenting the header as necessary.
-->

## Unreleased
- Added `logLevel` option which defaults to `warn` so info/debug transformations are supressed by default.
<!-- Add new unreleased items here -->

## [1.0.0-pre.3] - 2019-06-06
- Fix missing `@types/parse5` dependency for TypeScript users.
- Fix invalid TypeScript typings related to the logger option.

## [1.0.0-pre.2] - 2019-06-05
- Rewrites resolvable Node package specifiers in JavaScript module files.
- Rewrites resolvable Node package specifiers in HTML files in `<script type="module">` elements, honoring `<base href>` where present.
