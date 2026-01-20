# Try to use .handler method on crafted commands in tests

([example](https://github.com/schickling/dilagent/blob/77d7d90d19d921841a18df350b6430c5bdc9eea3/apps/dilagent-cli/src/commands/manager/all.ts#L63))

# Make better tests

- [ ] Write tests to reach 90%+ coverage
- [ ] integrate arbitrariness like
- [ ] integrate mutation tests like [stryker-js](https://github.com/stryker-mutator/stryker-js) or [mutasaurus](https://github.com/christoshrousis/mutasaurus) or find something `effect` specific
- [ ] integrate property based tests like [fast-check](https://fast-check.dev/docs/tutorials/quick-start/our-first-property-based-test/)

https://github.com/tatethurston/embedded-typescript for tstyche

try to use [nounder/effect-memfs](https://github.com/nounder/effect-memfs) for
fs mocking

# Write docs for exported into JSR package functions and constants

- [ ] Integrate auto audit of JSDoc using GitHub Actions:
      https://deno.com/blog/document-javascript-package#audit-your-jsdoc
- [ ] Write JSDoc themselves
- [x] Rename all symbols related to error classes so they actually behave like
      classes. Extracted type of const should be of instance type not constructor
      type

Useful:

1. [How to document JS package in Deno](https://deno.com/blog/document-javascript-package)
2. [How to write docs for JSR](https://jsr.io/docs/writing-docs#symbol-documentation)
3. [All JSDoc tokens](https://jsdoc.app/)
4. [Supported JSDoc tags by Deno](https://docs.deno.com/runtime/reference/cli/doc/#supported-jsdoc-tags)

Fix the fact that in JSR it renders as shit (example: [GitHubApiThingNotExistsOrYouDontHaveAccessError](https://jsr.io/@nikelborm/fetch-github-folder/doc/~/GitHubApiThingNotExistsOrYouDontHaveAccessError))

Maybe cover this during fixing https://github.com/nikelborm/fetch-github-folder/issues/41

read and follow [diataxis guidelines](https://diataxis.fr/start-here/)

# Refactor Readme

1. Write more ways to install project (deno, bun)
2. Show CLI's --help
3. Record wizard gif
4. find and analyze competitors (e.g.
   [libraries.io search result with similar libs](https://libraries.io/search?q=fetch+github+folder&sort=latest_release_published_at))
   and their features

Competitor: https://github.com/gruntwork-io/fetch

Maybe use [asciicinema](https://asciinema.org/) to demo usage of the CLI?

# Better error reporting

Don't just crash and throw JSON of error. Filter some of them, retry, etc. Maybe
use [jpb06/effect-errors](https://github.com/jpb06/effect-errors)

1. Rewrite FS operations to use Stream and FileSystem modules
2. do retries in cases of FS operation failures

TODO: make PR to [jpb06/effect-errors](https://github.com/jpb06/effect-errors)
to support errors from CLI module?

![Image](https://github.com/user-attachments/assets/fc671c4e-5a40-4787-b075-25cad2390ecc)

Also add dts maps, so that it's easy to jump into ts source

# Add retries and rateLimit delays

Probably borrow [jpb06/effect-github-stats/.../handle-octokit-request-error.ts](https://github.com/jpb06/effect-github-stats/blob/main/src/layer/errors/handle-octokit-request-error.ts)

# Ability to parse targets from links

There are a lot of URLs that have all the data we need, and we can easily
extract target info from them such as blobSha, treeSha, branchName, repoName,
ownerName, etc...

# Add support for auth

- [ ] Ability to take token from env and prompt (CLI flag to enable prompt)
- [ ] Optimistically try to download repo, if fails with 404, make a few
      requests to determine if it's really an auth issue. Reflect responses and
      determine if that's a public repo and we don't need an API key. If it is
      private, don't block entire process from loading other shit in parallel, but
      send request to a queue of targets blocked by auth and keep downloading stuff,
      until interrupted by user to enter token.
- [ ] Hide auth token behind Effect.Redacted (do not provide CLI option for
      token directly because of bash history. (mention this in --help) )
- [ ] Ability to have independent failed auth queues so that we can ask for a
      different token if one was bad
- [ ] Possibility for quick request of token through browser (script opens a
      window and runs the request as authorized user)

# Support creating downloading plans

User should be able to specify more than one entity (folder/file) to download

# Add support for Git LFS

[Docs of GitHub API for repo contents](https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28)

[Docs of GitHub API for repos](https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28)

[Git LFS GitHub repo](https://github.com/git-lfs/git-lfs)

Schemas from [Git LFS API docs](https://github.com/git-lfs/git-lfs/blob/main/docs/api/README.md):

1. Request resources in batch
   1. [Request schema](https://github.com/git-lfs/git-lfs/blob/main/tq/schemas/http-batch-request-schema.json)
   2. [Response schema](https://github.com/git-lfs/git-lfs/blob/main/tq/schemas/http-batch-response-schema.json)
2. Create lock
   1. [Request schema](https://github.com/git-lfs/git-lfs/blob/main/locking/schemas/http-lock-create-request-schema.json)
   2. [Response schema](https://github.com/git-lfs/git-lfs/blob/main/locking/schemas/http-lock-create-response-schema.json)
3. Delete lock
   1. [Request schema](https://github.com/git-lfs/git-lfs/blob/main/locking/schemas/http-lock-delete-request-schema.json)
4. List locks
   1. [Response schema](https://github.com/git-lfs/git-lfs/blob/main/locking/schemas/http-lock-list-response-schema.json)
5. Verify lock
   1. [Response schema](https://github.com/git-lfs/git-lfs/blob/main/locking/schemas/http-lock-verify-response-schema.json)

# Make a buildfarm

1. either use https://mise.jdx.dev/ide-integration.html
2. or buildkit
3. or both
4. https://docs.blacksmith.sh/introduction/why-blacksmith

because fuck github actions. They are not portable.

https://docs.github.com/en/actions/sharing-automations/creating-actions/creating-a-composite-action

integrate tracing into building of docker images?
https://effect.website/docs/observability/tracing/

https://github.com/int128/docker-build-cache-config-action/
https://github.com/reproducible-containers/buildkit-cache-dance
https://github.com/isac322/buildkit-state
https://github.com/arcosx/image-build-benchmark

https://github.com/BretFisher/nodejs-rocks-in-docker

add a layer in tooling stages to compile my scripts with bytecode enabled

```bash
bun build --compile --minify --sourcemap --bytecode ./path/to/my/app.ts --outfile myapp
```

use https://github.com/project-copacetic/copacetic for security?

use [s6](https://github.com/just-containers/s6-overlay) and [with-contenv](https://github.com/just-containers/s6-overlay/blob/master/layout/rootfs-overlay/package/admin/s6-overlay-%40VERSION%40/command/with-contenv)

use [xx](https://github.com/tonistiigi/xx)

Add custom per-PR coverage deployments like in [cigale PR #661](https://github.com/cigaleapp/cigale/pull/661)?

<img width="1690" height="642" alt="Image" src="https://github.com/user-attachments/assets/78bdc569-7749-4f6c-b595-b38ef117b89c" />

https://github.com/rusdacent/cooking-docker-containers

# Add more publishing options

1. Split packages for different runtimes
2. Split lib/executable packages
3. Split packages on those bundled with all deps inside to make a standalone
   tree-shaken executable and those relying on dynamic dependencies resolution
4. add info about everything to README.md
5. build Nix CLI package
6. build AUR package
7. build [Fedora COPR](https://copr.fedorainfracloud.org/) package
8. maybe to [ubuntu universe repos](https://wiki.ubuntu.com/Spec/UbuntuPackagingGuide)?
9. maybe other package stores
10. [esm.sh](https://esm.sh/)? [unpkg.com](https://unpkg.com/)? I don't know how
    useful would it be considering that it's mostly a server-side library

example of deno AUR app: [cicada-bin](https://aur.archlinux.org/cgit/aur.git/tree/PKGBUILD?h=cicada-bin)
example of bun AUR app: [moo](https://aur.archlinux.org/cgit/aur.git/tree/PKGBUILD?h=moo)
example of node AUR app: [typedoc](https://aur.archlinux.org/cgit/aur.git/tree/PKGBUILD?h=typedoc)

- [Node.js AUR package guidelines](https://wiki.archlinux.org/title/Node.js_package_guidelines)
- [Git AUR package guidelines](https://wiki.archlinux.org/title/VCS_package_guidelines)
- [WebApp AUR package guidelines](https://wiki.archlinux.org/title/Web_application_package_guidelines) (for my life-tracker)
- [Electron AUR package guidelines](https://wiki.archlinux.org/title/Electron_package_guidelines) (for my life-tracker)

Nice badges to celebrate success: https://repology.org/

https://github.com/dsherret/jsr-publish-on-tag

https://github.com/ava1ar/customizepkg

[Discord: Optimizing CLI Package Startup Time](https://discord.com/channels/795981131316985866/1411873393224974440)

# Add community-related .md files such as CONTRIBUTING.md and others

- [ ] Finish all the recommendations from [Github Community page](https://github.com/nikelborm/fetch-github-folder/community)
- [ ] Add action https://github.com/marketplace/actions/first-interaction

examples of `CONTRIBUTING.md`:

- [GitHub](https://github.com/github/.github/blob/main/CONTRIBUTING.md)
- [Electrion](https://github.com/electron/electron/blob/main/CONTRIBUTING.md)

https://github.com/github-changelog-generator/github-changelog-generator

use https://coauthors.me/ ?

# Add more code-quality checks

- [ ] Add stricter eslint config
- [ ] integrate codacy, scorecard.dev, [checkov](https://github.com/bridgecrewio/checkov)

https://app.stepsecurity.io/securerepo?repo=https://github.com/nikelborm/fetch-github-folder

https://securityscorecards.dev/viewer/?uri=github.com/xmldom/xmldom
https://www.bestpractices.dev/en/projects/7879
https://socket.dev/npm/package/@xmldom/xmldom
https://snyk.io/advisor/npm-package/@xmldom/xmldom
https://www.greptile.com/
https://www.coderabbit.ai/
https://www.sourcery.ai/

integrate syncpack ([example](https://github.com/livestorejs/livestore/blob/dev/syncpack.config.mjs))

Look through my starred repos to find other analyzers

# Support other git and git LFS providers

- [ ] bitbucket
- [ ] gitlab
- [ ] forgejo
- [ ] gitea
- [ ] codeberg

maybe use native git APIs, that git makes requests to during sparse checkout?

TODO: study sparseCheckout

https://ryantm.github.io/nixpkgs/builders/fetchers/#fetchgit

https://git-scm.com/docs/git-sparse-checkout

regarding git LFS, maybe there are openapi shit in its repo, which I can using
Tim's project generate Effect code from?

# Automatically fix slow types at compile time

relevant: [Can I just generate typescript declarations locally and provide them with the source code? | discussion jsr-io/jsr#1087](https://github.com/jsr-io/jsr/discussions/1087/)

if I'm successful, report it here: [`jsr publish --fix` | issue jsr-io/jsr#15](https://github.com/jsr-io/jsr/issues/15)

## Potential solutions

- `deno lint --fix`
- [AugustinMauroy/typescript-package-template](https://github.com/AugustinMauroy/typescript-package-template) from [jsr-io/jsr#1087 (comment)](https://github.com/jsr-io/jsr/discussions/1087#discussioncomment-13030291)
- [mylesmmurphy/prettify-ts/typescript-plugin](https://github.com/mylesmmurphy/prettify-ts/tree/main/packages/typescript-plugin)
- [nonara/ts-patch](https://github.com/nonara/ts-patch)
- [microsoft/ts-fix](https://github.com/microsoft/ts-fix/) (I was blocked by incomplete PR https://github.com/microsoft/ts-fix/pull/43#issuecomment-2840178848)
- [JSR rolldown-plugin-jsr-self-types](https://jsr.io/@jsr-community/rolldown-plugin-jsr-self-types@0.0.1-beta.1)
- [dsherret/ts-factory-code-generator-generator](https://github.com/dsherret/ts-factory-code-generator-generator)
- [dsherret/ts-morph](https://github.com/dsherret/ts-morph/tree/latest/packages/ts-morph)
- [dsherret/code-block-writer](https://github.com/dsherret/code-block-writer)
- [gritql](https://github.com/getgrit/gritql) (maybe to try it to fix Effect.ts codebase and remove `_` in `Effect.gen`?)
- [ChiriVulpes/typescript-girlboss](https://github.com/ChiriVulpes/typescript-girlboss/)
- [stephenh/ts-poet](https://github.com/stephenh/ts-poet)
- [ast-grep](https://github.com/ast-grep/ast-grep)
- [facebook/jscodeshift](https://github.com/facebook/jscodeshift)
- https://code.lol/post/programming/towards-declarative-ast-transformation/
- [JoshuaKGoldberg/ts-api-utils](https://github.com/JoshuaKGoldberg/ts-api-utils)
- [unjs/magicast](https://github.com/unjs/magicast)
- [auvred/magic-esquery](https://github.com/auvred/magic-esquery)

# Support other JS runtimes

- [ ] Support bun (use [vitest-in-process-pool](https://github.com/oven-sh/bun/issues/4145#issuecomment-2551246135)?)
- [ ] Support deno (use [lishaduck/effect-utils/platform-deno](https://github.com/lishaduck/effect-utils/tree/main/packages/platform-deno)?)
- [ ] Create a GitHub workflow matrix to test builds on different platforms
- [ ] Report to JSR statuses about what is supported and what's not

https://developers.cloudflare.com/workers/testing/vitest-integration/write-your-first-test/
https://github.com/denoland/deno/issues/23882
https://github.com/vitest-dev/vscode/issues/528

# Automatically shorten links in releases

https://dub.co/tools/github-link-shortener

Compare the two:

```bash
curl -sL https://github.com/nikelborm/fetch-github-folder/releases/download/0.1.27/fetch-github-folder.js | node - --repoOwner apache --repoName superset
```

```bash
curl -sL git.new/git-dl.js | node - --repoOwner apache --repoName superset
```

# Reconsider license

https://choosealicense.com/appendix/

# Support for non-effect users

runPromise and runSync can do that, but errors will be thrown.

```ts
import { Effect } from 'effect';

type MyEffect = Effect.Effect<string>;

declare const myEffect: MyEffect;

// type: () => Promise<string>
export const run = () => Effect.runPromise(myEffect);
```

https://discord.com/channels/795981131316985866/1125094089281511474/1356762260231421952

# Integrate effect-native lib for extracting .tar.gz

Migrate .tar.gz extractor to
[leonitousconforti/eftar](https://github.com/leonitousconforti/eftar) the moment
it's ready

# Add better Logging and tracing

It would be perfect to have progress bar with stages (maybe use [parischap/effect-libs/ansi-styles](https://github.com/parischap/effect-libs/tree/master/packages/ansi-styles) for that?)

# Desktop URL handler

So that the CLI can handle some GitHub URLs as vscode does

[`.desktop` file specification](https://specifications.freedesktop.org/desktop-entry-spec/latest/)

# Parallelize fetching directories

After we fetched metadata of a directory we already know it's contents and if it
has nested directories, we can load them as subtrees in parallel, if there are a
finite amount of them (parallelizing loading of 20+ elements won't end good)

# Ability to restrict an entity to be of certain type: `folder`, `file`, etc

We initially make metadata request and before downloading actual file/folder, we
can already ensure, it's something we need, or don't

# Add ability to download everything except glob

# Properly support symbolic links

# Support git submodules
