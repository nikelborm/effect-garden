# ts-key-not-enum ([NPM](https://www.npmjs.com/package/ts-key-not-enum), [GitHub](https://github.com/nikelborm/effect-garden/tree/main/packages/ts-key-not-enum))

Keyboard events have untyped `.key` string property. This package allows
type-safe comparison of that property with non-printable values.

This is a rewrite of `ts-key-enum`
([GitHub](https://github.com/nfriend/ts-key-enum/),
[NPM](https://www.npmjs.com/package/ts-key-enum)) originally made by Nathan
Friend ([GitHub: @nfriend](https://github.com/nfriend/)). No code was copied,
but still, kudos to you for the idea, my dear dude. 😉 🐸

I brought a few improvements such as more robust scraping of keys with
[Effect.ts](https://effect.website/), and instead of using `const enum`s my
rewrite encourages usage of wildcard imports. With a bundler that's more or less
capable of dead-code elimination, this approach would be almost no different
from using Typescript's `const enum` feature. Except it would work fine with
`"erasableSyntaxOnly": true` in `tsconfig.json`, while `const enum` doesn't.

I specifically avoid saying `namespace imports`, and instead say `wildcard
imports` to make a distinction from `ts-key-namespace`
([NPM](https://www.npmjs.com/package/ts-key-namespace),
[GitHub](https://github.com/Heartade/ts-key-namespace)), which exports
typescript namespace and for this reason it's incompatible with
`erasableSyntaxOnly` as well.

## Additional features

1. More information is scraped from MDN, like platform/OS specific binary codes
   of keys, deprecation notices etc
2. Keys grouped by logical categories in certain files, and flat barrel imports
   available as well
3. Both constants and string literal types are exported
4. No enums here 💀
5. No super-mega-giga-deadly-dead dependencies like `bluebird`, `lodash`,
   `request-promise` etc 😊

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

We too. With this module, you can do this instead:

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

```ts
// You can use wildcard imports
import * as Key from 'ts-key-not-enum';
console.log(Key.ArrowLeft)

// Or you can import specific keys directly
import { ArrowRight } from 'ts-key-not-enum';
console.log(ArrowRight)

// No need in typeof here
type wow = ArrowRight
//   ^? "ArrowRight"


// You can either import pre-made subcategories as objects and reference their fields
import { FunctionKeys } from 'ts-key-not-enum/subcategories';
console.log(FunctionKeys.F8)

// Or you can import specific keys from subcategory files of the same name. If
// you'll wildcard-import these files, you'll get the same subcategory objects
import { F19 } from 'ts-key-not-enum/FunctionKeys';
console.log(F19)

// There are nested subcategories too
import { JapaneseKeyboardsOnly } from 'ts-key-not-enum/IMEAndCompositionKeys/subcategories';
console.log(JapaneseKeyboardsOnly.Hiragana)

import { Hiragana } from 'ts-key-not-enum/IMEAndCompositionKeys/JapaneseKeyboardsOnly';
console.log(Hiragana)

// pre-made subcategory files export everything nested in them as a flat
// structure, so IMEAndCompositionKeys will have all keys from
// JapaneseKeyboardsOnly, DeadKeycodesForLinux etc
import { KanjiMode } from 'ts-key-not-enum/IMEAndCompositionKeys';
console.log(KanjiMode)
```

[`index.ts`](./index.ts) is an entry point and exports all available keys. This
file, and everything in [`src`](./src/) directory is auto-generated from the
list of keys found at [MDN: Key values for keyboard
events](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)

## What's included

The package contains values for all standard non-printable keys such as
`"CapsLock"`, `"Backspace"`, and `"AudioVolumeMute"`. The package does _not_
contain values for printable keys such as `"a"`, `"A"`, `"#"`, `"é"`, or `"¿"`,
simply because the list of possible values is too vast to include everything.
Although some symbols/modifiers are still included, for example, in
[`DeadKeycodesForLinux.ts`](./src/IMEAndCompositionKeys/DeadKeycodesForLinux.ts).
To test for printable values, simply use a string comparison:

```ts
if (ev.key === 'é') { ... }
```

## Building

Run the scraper+generator script
([`scrapeMDNForKeyboardButtons.ts`](./scripts/scrapeMDNForKeyboardButtons.ts))
using:

```sh
bun scrape
```

This will overwrite [`index.ts`](./index.ts) and [`src`](./src/) with the
updated list of keys found in MDN.

# TODO: contributions welcome ❤️‍🔥

1. Add support for comparison with `.data` property. Currently
   `DeadKeycodesForLinux.ts` is incorrectly rendered. Symbols there are not in
   fact `.key` values. The table in MDN is supposed to be clarifying the usage
   of hex codes of `.data` property.
2. improve performance and use a matcher like typia instead of ts-pattern
3. improve caching stages. And cache not only the first fetch, but also byte
   results of rendering functions. Parallelize validation and passing file
   contents trough tspc, biome, prettier. Since many files do not depend on each
   other, they can easily formatted and rendered in parallel.
4. make a graph of functions like functions folding children, and functions that
   fold results of these functions, so that we folded child node, we have to
   search only a limit amount of potential parent folds

## License

MIT
