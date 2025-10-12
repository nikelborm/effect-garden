# <img src="https://nikelborm.github.io/git-dl/logo.png" align="right" width="40px" height="40px"/> Get git repo contents (git-dl) :lizard:

[![Open in VS Code](https://img.shields.io/static/v1?logo=visualstudiocode&label=&message=Open%20in%20VS%20Code&labelColor=2c2c32&color=007acc&logoColor=007acc)](https://github.dev/nikelborm/git-dl)
[![NPM package version](https://badge.fury.io/js/git-dl.svg)](https://www.npmjs.com/package/git-dl)
[![NPM downloads](https://img.shields.io/npm/dm/git-dl.svg?style=flat)](https://npmjs.org/package/git-dl)
[![NPM Last Update](https://img.shields.io/npm/last-update/git-dl)](https://npmjs.org/package/git-dl)
[![package.json Dependents count](https://badgen.net/npm/dependents/git-dl)](https://www.npmjs.com/package/git-dl?activeTab=dependents)
[![JSR package version](https://jsr.io/badges/@nikelborm/git-dl)](https://jsr.io/@nikelborm/git-dl)
[![JSR package Score](https://jsr.io/badges/@nikelborm/git-dl/score)](https://jsr.io/@nikelborm/git-dl)
[![JSR package owner](https://jsr.io/badges/@nikelborm)](https://jsr.io/@nikelborm)
[![GitHub commits per month](https://img.shields.io/github/commit-activity/m/nikelborm/git-dl)](https://github.com/nikelborm/git-dl/pulse)
[![GitHub Total commits Count](https://img.shields.io/github/commit-activity/t/nikelborm/git-dl)](https://github.com/nikelborm/git-dl/graphs/commit-activity)
[![NPM License](https://img.shields.io/npm/l/git-dl)](https://github.com/nikelborm/git-dl?tab=MIT-1-ov-file)
[![Coveralls Coverage Percentage](https://coveralls.io/repos/github/nikelborm/git-dl/badge.svg?branch=main&rand=9148876)](https://coveralls.io/github/nikelborm/git-dl?branch=main)
[![CodeFactor Code quality Grade](https://img.shields.io/codefactor/grade/github/nikelborm/git-dl?label=codefactor)](https://www.codefactor.io/repository/github/nikelborm/git-dl)
[![Code Climate Technical Debt](https://img.shields.io/codeclimate/tech-debt/nikelborm/git-dl)](https://codeclimate.com/github/nikelborm/git-dl/issues)
[![Code Climate Issues](https://img.shields.io/codeclimate/issues/nikelborm/git-dl)](https://codeclimate.com/github/nikelborm/git-dl/issues)
[![GitHub Tests Workflow status](https://github.com/nikelborm/git-dl/actions/workflows/test.yml/badge.svg)](https://github.com/nikelborm/git-dl/actions/workflows/test.yml)
[![GitHub Release Workflow status](https://github.com/nikelborm/git-dl/actions/workflows/release.yml/badge.svg)](https://github.com/nikelborm/git-dl/actions/workflows/release.yml)
[![Sonar Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Bugs Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=bugs)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Code Smells Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Lines of Code Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Reliability Grade](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Security Grade](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Technical Debt Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Maintainability Grade](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
[![Sonar Vulnerabilities Count](https://sonarcloud.io/api/project_badges/measure?project=nikelborm_fetch-github-folder&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=nikelborm_fetch-github-folder)
![OSS Lifecycle status](https://img.shields.io/osslifecycle?file_url=https%3A%2F%2Fgithub.com%2Fnikelborm%2Ffetch-github-folder%2Fblob%2Fmain%2FOSSMETADATA)

<!-- Commented because there's some bug in effect library or in bundlephobia that prevents proper rendering of this badge -->
<!-- [![npm minzipped bundle size](https://img.shields.io/bundlephobia/minzip/git-dl)](https://bundlephobia.com/package/git-dl) -->
<!-- [![package.json Dependencies count](https://badgen.net/bundlephobia/dependency-count/git-dl)](https://www.npmjs.com/package/git-dl?activeTab=dependencies) -->

<!-- commented because it seems that npms.io was acquired by somebody and is slowly dying -->
<!-- [![npms.io](https://img.shields.io/npms-io/final-score/git-dl)](update_link_later) -->

<!-- commented because I haven't started following it yet -->
<!-- [![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org) -->

<sup>(Don't judge me for my obsession with badges)</sup>

> [!CAUTION]
>
> This project currently is not stable, but I'm actively working on writing tests and handling edge cases, such as support for Git-LFS and other.
> Check out the `dev` branch to see the latest updates! 😉 (except that I currently don't care and just push to main)

## What this library+CLI does?

It allows you to download any folder or a file from a repo on github.

## Requirements

1. Latest Node.js (You can install it easily via [mise](https://github.com/jdx/mise))
2. Git for development

## Installation

We support various installation options. Regardless of what you choose, if you want to make
CLIs written in JS run faster, I highly recommend adding this line to your `.bashrc`:

```bash
export NODE_COMPILE_CACHE=~/.cache/nodejs-compile-cache
```

### Install package with CLI and functions from [default NPM registry](https://www.npmjs.com/package/git-dl)

```bash
npm i git-dl
```

<details>
<summary>

### Install package with only functions from [JSR](https://jsr.io/@nikelborm/git-dl)

</summary>

Unfortunately JSR doesn't support publishing executables yet, so you can install
only script library with functions that will allow you to fetch github folder
from other scripts.

```bash
npx jsr add @nikelborm/git-dl
```

</details>
<details>
<summary>

### Install package with CLI and functions from [GitHub's NPM registry](https://github.com/nikelborm/git-dl/pkgs/npm/git-dl)

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
   npm i @nikelborm/git-dl
   ```

</details>
<details>
<summary>

### Install package with CLI and functions from [Github Releases](https://github.com/nikelborm/git-dl/releases)

</summary>

```bash
PACKAGE=git-dl

# Either set specific tag
TAG=0.1.28 && npm i https://github.com/nikelborm/$PACKAGE/releases/download/$TAG/$PACKAGE.tgz
# or download the latest
npm i https://github.com/nikelborm/$PACKAGE/releases/latest/download/$PACKAGE.tgz
```

</details>
<details open>
<summary>

### Install only the CLI directly into the system from [Github Releases](https://github.com/nikelborm/git-dl/releases)

</summary>

```bash
set -euo pipefail
PACKAGE=git-dl

path_to_the_script=/usr/bin/$PACKAGE

# Either set specific tag
TAG=0.1.28 && sudo curl -sLo $path_to_the_script https://github.com/nikelborm/$PACKAGE/releases/download/$TAG/$PACKAGE.js
# or download the latest
sudo curl -sLo $path_to_the_script https://github.com/nikelborm/$PACKAGE/releases/latest/download/$PACKAGE.js

sudo chmod +x $path_to_the_script
```

</details>
<details>
<summary>

### Setup the repo for local development

</summary>

```bash
git clone -b main git@github.com:nikelborm/git-dl.git
cd git-dl
npm install
cp template.env .env
read -sp 'Enter github access token: ' gh_token; echo;
sed -i "s/\(GITHUB_ACCESS_TOKEN\)='.*'/\1='$gh_token'/" .env
```

</details>

## Usage

### EcmaScript module

```ts
import {
  downloadEntityFromRepo,
  OctokitLayer,
  FailedToParseGitLFSInfoError,
  GitHubApiBadCredentialsError,
  type InputConfig,
  type OutputConfig,
  type SingleTargetConfig,
  repoNameCLIOptionBackedByEnv,
  repoOwnerCLIOptionBackedByEnv,
  // etc...
} from 'git-dl';
// or '@nikelborm/git-dl' for non-default installation methods
```

### Execution of CLI installed with NPM

The **easiest way** to execute the CLI (preliminary installation is not required) is
like this:

```bash
npx git-dl --repoOwner apache --repoName superset
```

Also there's a shorter form available (preliminary installation is required):

```bash
npx gdl --repoOwner apache --repoName superset
```

<details>
<summary>

### Non-interactive CLI execution on the fly from [Github Releases](https://github.com/nikelborm/git-dl/releases)

</summary>

If you already know the supported arguments (e.g. `--help` to print them all),
you can pipe the bundled and minified script version into node directly and pass
your arguments after `node -`:

```bash
set -euo pipefail

# Either set specific tag
TAG=0.1.28 && curl -sL https://github.com/nikelborm/$PACKAGE/releases/download/$TAG/$PACKAGE.js | node - --repoOwner apache --repoName superset
# or download the latest
curl -sL https://github.com/nikelborm/$PACKAGE/releases/latest/download/$PACKAGE.js | node - --repoOwner apache --repoName superset
```

</details>
<details>
<summary>

### Interactive CLI execution from [Github Releases](https://github.com/nikelborm/git-dl/releases)

</summary>

The script also supports interactive mode (`--wizard`), where you will be asked
to pass arguments sequentially and interactively. Since it requires user input,
it can't be piped and needs to be saved to a temporary file:

```bash
set -euo pipefail
tmp_js=$(mktemp --suffix .js)

# Either set specific tag
TAG=0.1.28 && curl -sLo $tmp_js https://github.com/nikelborm/$PACKAGE/releases/download/$TAG/$PACKAGE.js
# or download the latest
curl -sLo $tmp_js https://github.com/nikelborm/$PACKAGE/releases/latest/download/$PACKAGE.js

node $tmp_js --wizard
rm $tmp_js
```

</details>
<details open>
<summary>

### Execution of CLI installed directly into the system

</summary>

```bash
git-dl --repoOwner apache --repoName superset
```

</details>

## Environment Variables

If you often use the CLI, you can permanently set the arguments via env
variables, and they will be used as a backup if arguments weren't provided
explicitly.

- `GITHUB_ACCESS_TOKEN`: This is your personal access token from GitHub. It is
  used to authenticate your requests to the GitHub API. You can generate one
  [here](https://github.com/settings/tokens/new?description=Read%20repo%20contents%20access%20to%20fetch-github-folder&scopes=public_repo&default_expires_at=none).
- `REPO_OWNER`: This is the username of the owner of the repository you are
  trying to download from. For example, if the repository's URL is
  `https://github.com/apache/superset`, the owner is `apache`.
- `REPO_NAME`: This is the name of the repository you are trying to download
  from. In the example above, the repository name is `superset`.
- `PATH_TO_ENTITY_IN_REPO`: This is the path to the directory you want to
  download. It can be directory that lies inside root of repo like `docker` or
  it can be some nested directory like `docker/nginx`.
- `GIT_REF`: This is the commit SHA hash, branch name, or tag name you want to
  download from. If you don't specify it, the default branch in the repository
  will be used.
- `DESTINATION_PATH`: If entity at `PATH_TO_ENTITY_IN_REPO` is a file, then
  destination path is a path to downloaded file. If it's a directory, then all
  files and directories from target directory of remote repository at
  `PATH_TO_ENTITY_IN_REPO` will be put into a directory having
  `DESTINATION_PATH` path. If the directory doesn't exist, it will be
  automatically created.
