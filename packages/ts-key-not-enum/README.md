# ts-key-not-enum ([NPM](https://www.npmjs.com/package/ts-key-not-enum), [GitHub](https://github.com/nikelborm/effect-garden/tree/main/packages/ts-key-not-enum))

Keyboard events have `.key` string property. This package allows type-safe
comparison of that property with non-printable values

This is a rewrite of `ts-key-enum`
([GitHub](https://github.com/nfriend/ts-key-enum/),
[NPM](https://www.npmjs.com/package/ts-key-enum)) originally made by Nathan
Friend ([GitHub: @nfriend](https://github.com/nfriend/)).

I brought a few improvements such as more robust scraping of keys with
[Effect.ts](https://effect.website/), and instead of using `const enum`s my
rewrite encourages usage of namespace imports. With a bundler that's more or
less capable of dead-code elimination, this approach would be almost no
different from using Typescript's `const enum` feature. Except it would work
fine with `"erasableSyntaxOnly": true` in `tsconfig.json`, while `const enum`
doesn't.

## Install

```sh
pnpm add ts-key-not-enum
```

```sh
bun add ts-key-not-enum
```

## Purpose

Tired of referencing keyboard keys with a string?

```ts
onKeyPress = (ev) => {
    // ...
    // whoops, it's actually ArrowLeft!
    if (ev.key === 'LeftArrow') {
        ...
    }
}
```

We too. With this module, you can do this instead (in a TypeScript file):

```ts
onKeyPress = (ev) => {
    // ...
    // much better
    if (ev.key === Key.ArrowLeft) {
        ...
    }
}
```

## How to use

To use this module, import all named key values either as a namespace, or import
individual key values at the top of your TypeScript file:

```ts
import * as Key from 'ts-key-not-enum';
// or
import { ArrowLeft } from 'ts-key-not-enum';
```

See [`index.ts`](./index.ts) for a complete list of available keys. This file is
auto-generated from the list of keys found at [MDN: Key values for keyboard
events](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)

## What's included

The package contains values for all standard non-printable keys such as
`"CapsLock"`, `"Backspace"`, and `"AudioVolumeMute"`. The package does _not_
contain values for printable keys such as `"a"`, `"A"`, `"#"`, `"é"`, or `"¿"`,
simply because the list of possible values is too vast to include everything. To
test for printable values, simply use a string comparison:

```ts
if (ev.key === 'é') { ... }
```

## Building

Run the scraper script ([`scrapeMDNForKeys.ts`](./scrapeMDNForKeys.ts)) using:

```sh
npm run scrape
```

This will overwrite [`index.ts`](./index.ts) with the updated list of keys found
in MDN.

Verify that the file builds without any TypeScript errors:

```sh
npm run build
```

## License

MIT
