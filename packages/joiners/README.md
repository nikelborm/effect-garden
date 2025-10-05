# Joiners

[![Open in VS Code](https://img.shields.io/static/v1?logo=visualstudiocode&label=&message=Open%20in%20VS%20Code&labelColor=2c2c32&color=007acc&logoColor=007acc)](https://github.dev/nikelborm/joiners)
[![NPM package version](https://badge.fury.io/js/joiners.svg)](https://www.npmjs.com/package/joiners)
[![NPM downloads](https://img.shields.io/npm/dm/joiners.svg?style=flat)](https://npmjs.org/package/joiners)
[![NPM Last Update](https://img.shields.io/npm/last-update/joiners)](https://npmjs.org/package/joiners)
[![package.json Dependents count](https://badgen.net/npm/dependents/joiners)](https://www.npmjs.com/package/joiners?activeTab=dependents)
[![JSR package version](https://jsr.io/badges/@nikelborm/joiners)](https://jsr.io/@nikelborm/joiners)
[![JSR package Score](https://jsr.io/badges/@nikelborm/joiners/score)](https://jsr.io/@nikelborm/joiners)
[![JSR package owner](https://jsr.io/badges/@nikelborm)](https://jsr.io/@nikelborm)
[![GitHub commits per month](https://img.shields.io/github/commit-activity/m/nikelborm/joiners)](https://github.com/nikelborm/joiners/pulse)
[![GitHub Total commits Count](https://img.shields.io/github/commit-activity/t/nikelborm/joiners)](https://github.com/nikelborm/joiners/graphs/commit-activity)
[![NPM License](https://img.shields.io/npm/l/joiners)](https://github.com/nikelborm/joiners?tab=MIT-1-ov-file)
[![Coveralls Coverage Percentage](https://coveralls.io/repos/github/nikelborm/joiners/badge.svg?branch=main&rand=9148876)](https://coveralls.io/github/nikelborm/joiners?branch=main)
[![CodeFactor Code quality Grade](https://img.shields.io/codefactor/grade/github/nikelborm/joiners?label=codefactor)](https://www.codefactor.io/repository/github/nikelborm/joiners)
[![Code Climate Technical Debt](https://img.shields.io/codeclimate/tech-debt/nikelborm/joiners)](https://codeclimate.com/github/nikelborm/joiners/issues)
[![Code Climate Issues](https://img.shields.io/codeclimate/issues/nikelborm/joiners)](https://codeclimate.com/github/nikelborm/joiners/issues)
[![GitHub Tests Workflow status](https://github.com/nikelborm/joiners/actions/workflows/test.yml/badge.svg)](https://github.com/nikelborm/joiners/actions/workflows/test.yml)
[![GitHub Release Workflow status](https://github.com/nikelborm/joiners/actions/workflows/release.yml/badge.svg)](https://github.com/nikelborm/joiners/actions/workflows/release.yml)
[![Sonar Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_joiners&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=nikelborm_joiners)
[![Sonar Bugs Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_joiners&metric=bugs)](https://sonarcloud.io/summary/new_code?id=nikelborm_joiners)
[![Sonar Code Smells Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_joiners&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=nikelborm_joiners)
[![Sonar Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_joiners&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=nikelborm_joiners)
[![Sonar Lines of Code Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_joiners&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=nikelborm_joiners)
[![Sonar Reliability Grade](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_joiners&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=nikelborm_joiners)
[![Sonar Security Grade](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_joiners&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=nikelborm_joiners)
[![Sonar Technical Debt Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_joiners&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=nikelborm_joiners)
[![Sonar Maintainability Grade](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_joiners&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=nikelborm_joiners)
[![Sonar Vulnerabilities Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_joiners&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=nikelborm_joiners)
![OSS Lifecycle status](https://img.shields.io/osslifecycle?file_url=https%3A%2F%2Fgithub.com%2Fnikelborm%2Fjoiners%2Fblob%2Fmain%2FOSSMETADATA)

<!-- Commented because there's some bug in effect library or in bundlephobia that prevents proper rendering of this badge -->
<!-- [![npm minzipped bundle size](https://img.shields.io/bundlephobia/minzip/joiners)](https://bundlephobia.com/package/joiners) -->
<!-- [![package.json Dependencies count](https://badgen.net/bundlephobia/dependency-count/joiners)](https://www.npmjs.com/package/joiners?activeTab=dependencies) -->

<!-- commented because it seems that npms.io was acquired by somebody and is slowly dying -->
<!-- [![npms.io](https://img.shields.io/npms-io/final-score/joiners)](update_link_later) -->

<!-- commented because I haven't started following it yet -->
<!-- [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org) -->

<sup>(Don't judge me for my obsession with badges)</sup>

## What's this?

It's WIP continuation of ideas that were put into
[evologi/join](https://github.com/evologi/join) with **EXTREME** typescript
support, expanded join types and join aliases support, predefined result
mappers, ability to join any Iterable instead of just Maps and more!

## Installation

I highly recommend adding this line to your `.bashrc`:

```bash
export NODE_COMPILE_CACHE=~/.cache/nodejs-compile-cache
```

### Install package from [default NPM registry](https://www.npmjs.com/package/joiners)

```bash
npm i joiners
```

<details>
<summary>

### Install package from [JSR](https://jsr.io/@nikelborm/joiners)

</summary>

```bash
npx jsr add @nikelborm/joiners
```

</details>
<details>
<summary>

### Install package from [GitHub's NPM registry](https://github.com/nikelborm/joiners/pkgs/npm/joiners)

</summary>

1. [Generate `Personal access token (classic)` with `read:packages` scope](https://github.com/settings/tokens/new?description=Install%20packages%20from%20GitHub%20NPM%20registry&scopes=read:packages&default_expires_at=none)
2. Login to Github's NPM registry (yes you need to do it, even if the package is public):

   1. Run the following command (Info about `--auth-type=legacy` [here](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token)):

      ```bash
      npm login --scope=@nikelborm --auth-type=legacy --registry=https://npm.pkg.github.com
      ```

   2. Enter your username when asked
   3. Paste the access token as password value

3. Install the package by executing:

   ```bash
   npm i @nikelborm/joiners
   ```

</details>
<details>
<summary>

### Install package from [Github Releases](https://github.com/nikelborm/joiners/releases)

</summary>

```bash
# Either set specific tag
TAG=0.1.0 && npm i https://github.com/nikelborm/joiners/releases/download/$TAG/joiners.tgz
# or download the latest
npm i https://github.com/nikelborm/joiners/releases/latest/download/joiners.tgz
```

</details>

## Usage

### EcmaScript module

```ts
import { join, joinOnVennDiagramParts, getSpreadObjectMerger } from 'joiners';
// or '@nikelborm/joiners' for non-default installation methods

const brandA = Symbol('A');
const brandB = Symbol('B');

type A1 = {
  brand: typeof brandA;
  id: number;
  v: number;
  optionalColumnSpecificToTypeA?: typeof brandA;
  requiredColumnSpecificToTypeA: typeof brandA;
  optionalColumnTypeAgnostic?: typeof brandA;
  requiredColumnTypeAgnostic: typeof brandA;
};

type B1 = {
  brand: typeof brandB;
  id: number;
  v: number;
  optionalColumnSpecificToTypeB?: typeof brandB;
  requiredColumnSpecificToTypeB: typeof brandB;
  optionalColumnTypeAgnostic?: typeof brandB;
  requiredColumnTypeAgnostic: typeof brandB;
};

const asIsMerger = <const T>(t: T): T => t;

// prettier-ignore
const left = new Set<A1>([
  { brand: brandA, id: 1, v: 6, requiredColumnSpecificToTypeA: brandA, requiredColumnTypeAgnostic: brandA },
  { brand: brandA, id: 2, v: 6, requiredColumnSpecificToTypeA: brandA, requiredColumnTypeAgnostic: brandA },
  { brand: brandA, id: 3, v: 7, requiredColumnSpecificToTypeA: brandA, requiredColumnTypeAgnostic: brandA },
  { brand: brandA, id: 4, v: 7, requiredColumnSpecificToTypeA: brandA, requiredColumnTypeAgnostic: brandA },
  { brand: brandA, id: 5, v: 9, requiredColumnSpecificToTypeA: brandA, requiredColumnTypeAgnostic: brandA }
])

// prettier-ignore
const right = new Set<B1>([
  { brand: brandB, id: 1, v: 7 , requiredColumnSpecificToTypeB: brandB, requiredColumnTypeAgnostic: brandB },
  { brand: brandB, id: 2, v: 7 , requiredColumnSpecificToTypeB: brandB, requiredColumnTypeAgnostic: brandB },
  { brand: brandB, id: 3, v: 8 , requiredColumnSpecificToTypeB: brandB, requiredColumnTypeAgnostic: brandB },
  { brand: brandB, id: 4, v: 8 , requiredColumnSpecificToTypeB: brandB, requiredColumnTypeAgnostic: brandB },
  { brand: brandB, id: 5, v: 10, requiredColumnSpecificToTypeB: brandB, requiredColumnTypeAgnostic: brandB }
]);

for (const currentMergedTuple of join(left, right, 'crossJoin', asIsMerger)) {
  console.log(currentMergedTuple);
  //          ^? [A1, B1]
}

for (const currentMergedTuple of joinOnVennDiagramParts(
  left,
  right,
  '111',
  getSpreadObjectMerger('{ ...A, ...B }'),
  tuple => tuple[0].v === tuple[1].v,
)) {
  console.log(currentMergedTuple);
  //          ^? A1 | B1 | {
  //   brand: typeof brandB;
  //   id: number;
  //   v: number;
  //   requiredColumnTypeAgnostic: typeof brandB;
  //   optionalColumnTypeAgnostic: typeof brandA | typeof brandB | undefined;
  //   optionalColumnSpecificToTypeA?: typeof brandA;
  //   requiredColumnSpecificToTypeA: typeof brandA;
  //   optionalColumnSpecificToTypeB?: typeof brandB;
  //   requiredColumnSpecificToTypeB: typeof brandB;
  // }
}
```

## TODO

1. Ability to deduplicate entries on keyGenerator with ability to choose what to do with with duplicates where 1|2 slots are empty
2. Context Expander merger where entries of expandable context are accessible by Symbols and not string names
3. Pre-made join functions like `leftJoin(...)`
4. pipeline joiner which accepts multiple datasets and sequential instruction on how to join them. Pipeline types from [nikelborm/autism-stats/index.ts](https://github.com/nikelborm/autism-stats/blob/main/index.ts), allows to make multiple joins on them, can be used as a part of queryBuilder. Or integrate Integrate codegen from [ksxnodemodules/ts-pipe-compose](https://github.com/ksxnodemodules/ts-pipe-compose)
5. `USING` syntax in joins. Allow joining many columns by their respective names (also ability to determine from all the context are there any ambiguous column names with all previous datasets in join)
6. ability to name left side and right side so they can be extracted by name later (force uniqueness of the names) (just like aliases in sql)
7. ability to get generator on discarded values `not(...)`
8. remove never used stuff
9. Recursive `spreadObjectMerger`, which also merges nested objects
10. Joiner using indices
11. check how joiner aligns with [edgedb-js](https://github.com/edgedb/edgedb-js)
12. https://www.geeksforgeeks.org/introduction-of-relational-algebra-in-dbms/
13. https://github.com/dexie/Dexie.js/
14. add tests with empty objects to object merger
15. Make sure that it works the same with or without `exactOptionalPropertyTypes` <!-- https://t.me/Alexandroppolus написал в https://t.me/typescript_bowl/56?comment=244 В типе для мержа надо ещё не забыть проверить флаг exactOptionalPropertyTypes, если он не true, то с необязательных ключей может прилетать undefined: `type IsEOPT = [undefined] extends [1?] ? false : true;` -->
16. Add builder pattern as done [here](https://discord.com/channels/795981131316985866/1346967319385083968/1347160658105466913)
17. competitors comparison: [lodash-joins](https://www.npmjs.com/package/lodash-joins), [joiner](https://www.npmjs.com/package/joiner), [object-joiner](https://www.npmjs.com/package/object-joiner), [evologi/join](https://github.com/evologi/join), [joiner](https://github.com/mhkeller/joiner), [fast-cartesian-product](https://www.npmjs.com/package/fast-cartesian-product), [cartesian](https://www.npmjs.com/package/cartesian), [cartesian-product](https://www.npmjs.com/package/cartesian-product), [fast-cartesian](https://www.npmjs.com/package/fast-cartesian), [big-cartesian](https://www.npmjs.com/package/big-cartesian), [@lorefnon/collection-joiner](https://www.npmjs.com/package/@lorefnon/collection-joiner), [array-join](https://www.npmjs.com/package/array-join), [joins](https://www.npmjs.com/package/joins)

This project currently only well tested for the following `"compilerOptions"` in `tsconfig.json`

```json
{
  "exactOptionalPropertyTypes": true,
  "strictNullChecks": true
}
```
