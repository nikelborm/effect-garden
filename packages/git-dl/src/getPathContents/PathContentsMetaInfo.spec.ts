import { describe, it, type TestContext } from '@effect/vitest';
import { Octokit } from '@octokit/core';
import { RequestError } from '@octokit/request-error';
import { UnknownException } from 'effect/Cause';
import {
  andThen,
  asVoid,
  die,
  type Effect,
  either,
  flatMap,
  gen,
  map,
  provide,
  succeed,
} from 'effect/Effect';
import { isRight } from 'effect/Either';
import { pipe } from 'effect/Function';
import { text } from 'node:stream/consumers';
import { assert, typeGuard } from 'tsafe';
import { allWithInheritedConcurrencyByDefault } from '../allWithInheritedConcurrency.ts';
import { FailedToCastDataToReadableStreamError } from '../castToReadableStream.ts';
import {
  GitHubApiAuthRatelimitedError,
  GitHubApiBadCredentialsError,
  GitHubApiGeneralServerError,
  GitHubApiGeneralUserError,
  GitHubApiNoCommitFoundForGitRefError,
  GitHubApiRatelimitedError,
  GitHubApiRepoIsEmptyError,
  GitHubApiThingNotExistsOrYouDontHaveAccessError,
} from '../commonErrors.ts';
import { type InputConfig, provideInputConfig } from '../configContext.ts';
import { OctokitLayer } from '../octokit.ts';
import { UnparsedMetaInfoAboutPathContentsFromGitHubAPI } from './ParsedMetaInfoAboutPathContentsFromGitHubAPI.ts';
import { PathContentsMetaInfo } from './PathContentsMetaInfo.ts';
import { RawStreamOfRepoPathContentsFromGitHubAPI } from './RawStreamOfRepoPathContentsFromGitHubAPI.ts';

const defaultRepo = {
  owner: 'fetch-gh-stuff-tests',
  name: 'public-repo',
};

const UnexpectedErrors = [
  RequestError,
  UnknownException,
  GitHubApiAuthRatelimitedError,
  GitHubApiRatelimitedError,
  GitHubApiGeneralServerError,
  FailedToCastDataToReadableStreamError,
];

type ErrorExpectedToBeThrown = (typeof UnexpectedErrors)[number] extends new (
  ...args: any
) => infer UnexpectedErrorInstance
  ? Exclude<
      typeof RawStreamOfRepoPathContentsFromGitHubAPI extends Effect<
        unknown,
        infer AllPotentialErrorInstances,
        unknown
      >
        ? AllPotentialErrorInstances
        : never,
      UnexpectedErrorInstance
    >
  : never;

const effectsToTestForErrors = {
  RawStreamOfRepoPathContentsFromGitHubAPI,
  UnparsedMetaInfoAboutPathContentsFromGitHubAPI,
};

const testValidityOfErrorThrownByEffect =
  <const ExpectedErrorClass extends ErrorExpectedToBeThrown>(
    ctx: TestContext,
    ExpectedErrorClass: new (...args: any) => ExpectedErrorClass,
    effectDescription: string,
  ) =>
  <
    EffectToTest extends
      (typeof effectsToTestForErrors)[keyof typeof effectsToTestForErrors],
  >(
    effectToTest: EffectToTest,
  ) =>
    effectToTest.pipe(
      asVoid as <E, R>(self: Effect<any, E, R>) => Effect<void, E, R>,
      either,
      flatMap(function (res) {
        if (isRight(res))
          return die({
            message:
              `Effect ${effectDescription} succeeded when expected to fail` as const,
            unexpectedlySuccessfulResult: res.right,
          });

        const err = res.left;

        ctx
          .expect(
            err,
            `Error thrown by ${effectDescription} was expected to be instance of ${
              ExpectedErrorClass.name
            }, but it's instance of ${err.constructor.name} instead`,
          )
          .toBeInstanceOf(ExpectedErrorClass);

        for (const ErrorClassThatShouldNotBeReturned of UnexpectedErrors) {
          ctx
            .expect(
              err,
              `Error thrown by ${effectDescription} should not be instance of ${ErrorClassThatShouldNotBeReturned.name}`,
            )
            .not.toBeInstanceOf(ErrorClassThatShouldNotBeReturned);
        }

        assert(
          typeGuard<
            Exclude<
              ErrorExpectedToBeThrown,
              InstanceType<(typeof UnexpectedErrors)[number]>
            >
          >(err, true),
        );

        return succeed(err);
      }),
    );

const expectError = <const ExpectedErrorClass extends ErrorExpectedToBeThrown>({
  when,
  ExpectedErrorClass,
  authToken,
  repo = defaultRepo,
  gitRef = '',
  pathToEntityInRepo,
}: {
  when: string;
  ExpectedErrorClass: new (...args: any) => ExpectedErrorClass;
  authToken?: string | undefined;
  repo?: InputConfig['repo'];
  gitRef?: string | undefined;
  pathToEntityInRepo: string;
}) =>
  it.effect(`Should throw ${ExpectedErrorClass.name} when ${when}`, ctx =>
    gen(function* () {
      const validateErrorOf = <T extends keyof typeof effectsToTestForErrors>(
        chosenEffectName: T,
      ) => {
        const inputConfig = {
          repo,
          gitRef,
          pathToEntityInRepo,
        };
        const newKey = `ExpectedFailureOf${chosenEffectName}` as const;
        const newVal = effectsToTestForErrors[chosenEffectName].pipe(
          testValidityOfErrorThrownByEffect(
            ctx,
            ExpectedErrorClass,
            `${chosenEffectName} (${JSON.stringify(inputConfig)})`,
          ),
          provideInputConfig(inputConfig),
          provide(OctokitLayer({ auth: authToken })),
        );
        return { [newKey]: newVal } as {
          [k in typeof newKey]: typeof newVal;
        };
      };

      const {
        ExpectedFailureOfRawStreamOfRepoPathContentsFromGitHubAPI,
        ExpectedFailureOfUnparsedMetaInfoAboutPathContentsFromGitHubAPI,
      } = yield* allWithInheritedConcurrencyByDefault({
        ...validateErrorOf('RawStreamOfRepoPathContentsFromGitHubAPI'),
        ...validateErrorOf('UnparsedMetaInfoAboutPathContentsFromGitHubAPI'),
      });

      ctx
        .expect(ExpectedFailureOfUnparsedMetaInfoAboutPathContentsFromGitHubAPI)
        .toStrictEqual(
          ExpectedFailureOfRawStreamOfRepoPathContentsFromGitHubAPI,
        );
    }),
  );

const expectNotFail = (
  descriptionOfWhatItShouldReturn: string,
  pathToEntityInRepo: string,
  testEffect: (
    ctx: TestContext,
    pathContentsMetaInfo: typeof PathContentsMetaInfo,
  ) => Effect<unknown, unknown, Octokit | InputConfig>,
  authToken: string = '',
) =>
  it.effect('Should return ' + descriptionOfWhatItShouldReturn, ctx =>
    pipe(
      testEffect(ctx, PathContentsMetaInfo),
      provideInputConfig({
        pathToEntityInRepo,
        gitRef: '',
        repo: defaultRepo,
      }),
      provide(OctokitLayer(authToken ? { auth: authToken } : void 0)),
    ),
  );

describe('PathContentsMetaInfo', { concurrent: true }, () => {
  expectError({
    when: 'asked for empty repo',
    ExpectedErrorClass: GitHubApiRepoIsEmptyError,
    pathToEntityInRepo: 'levelParent/levelChild/temp2.txt',
    repo: {
      owner: 'fetch-gh-stuff-tests',
      name: 'empty-repo',
    },
  });

  expectError({
    when: 'provided bad auth token and actually existing repo',
    ExpectedErrorClass: GitHubApiBadCredentialsError,
    pathToEntityInRepo: '',
    repo: {
      owner: 'fetch-gh-stuff-tests',
      name: 'real-private-repo',
    },
    authToken: 'bad auth token',
  });

  expectError({
    when: 'asked for a private repo',
    ExpectedErrorClass: GitHubApiThingNotExistsOrYouDontHaveAccessError,
    pathToEntityInRepo: '',
    repo: {
      owner: 'fetch-gh-stuff-tests',
      name: 'real-private-repo',
    },
  });

  expectError({
    when: 'asked for nonexistent repo',
    ExpectedErrorClass: GitHubApiThingNotExistsOrYouDontHaveAccessError,
    pathToEntityInRepo: '',
    repo: {
      owner: 'fetch-gh-stuff-tests',
      name: 'llllllllllllllllllllllllllll',
    },
  });

  expectError({
    when: 'asked for nonexistent owner',
    ExpectedErrorClass: GitHubApiThingNotExistsOrYouDontHaveAccessError,
    pathToEntityInRepo: '',
    repo: {
      owner: 'llllllllllllllllllllllllllll',
      name: 'llllllllllllllllllllllllllll',
    },
  });

  expectError({
    when: 'given broken path',
    ExpectedErrorClass: GitHubApiGeneralUserError,
    pathToEntityInRepo: '///',
  });

  expectError({
    when: 'given broken git ref',
    ExpectedErrorClass: GitHubApiNoCommitFoundForGitRefError,
    pathToEntityInRepo: '',
    gitRef: '807070987097809870987',
  });

  expectNotFail(`children of root directory`, '', (ctx, pathContentsMetaInfo) =>
    map(pathContentsMetaInfo, e =>
      ctx.expect(e).toMatchInlineSnapshot(`
        {
          "entries": [
            {
              "name": ".gitattributes",
              "path": ".gitattributes",
              "sha": "5e99d3f05d533acca63b519c079a9adea552cedd",
              "size": 53,
              "type": "file",
            },
            {
              "name": "1023kb+1023b_file.txt",
              "path": "1023kb+1023b_file.txt",
              "sha": "4ef7ad24ca43c487151fc6a194eb40fb715bf689",
              "size": 1048575,
              "type": "file",
            },
            {
              "name": "1mb_file.txt",
              "path": "1mb_file.txt",
              "sha": "7c7377879f52df073befeb0cb7df4d1a4b6b7563",
              "size": 1048576,
              "type": "file",
            },
            {
              "name": "2mb_lfs_file.txt",
              "path": "2mb_lfs_file.txt",
              "sha": "949b64f08bed89afc8de31addc4836432e31d5a2",
              "size": 132,
              "type": "file",
            },
            {
              "name": "2mb_plain_file.txt",
              "path": "2mb_plain_file.txt",
              "sha": "64a7c1a36a6972183ec97e15c75a788d4079e24e",
              "size": 2097152,
              "type": "file",
            },
            {
              "name": "Readme.md",
              "path": "Readme.md",
              "sha": "f247396548e37f8f6be1fb71ff2e45fd63abed94",
              "size": 14,
              "type": "file",
            },
            {
              "name": "index.js",
              "path": "index.js",
              "sha": "3b68c5767b33aad77e0a94ed3c6cf11c38b00d77",
              "size": 193,
              "type": "file",
            },
            {
              "name": "package.json",
              "path": "package.json",
              "sha": "3dbc1ca591c0557e35b6004aeba250e6a70b56e3",
              "size": 23,
              "type": "file",
            },
            {
              "name": "parentFolderDirectlyInRoot",
              "path": "parentFolderDirectlyInRoot",
              "sha": "51106992bea30bb953ac5754e54bb968ab0dcbe5",
              "size": 0,
              "type": "dir",
            },
          ],
          "meta": "This root directory of the repo can be downloaded as a git tree",
          "treeSha": "5343ad8f694ee4ba37fa388a11e6b34f369806dd",
          "type": "dir",
        }
      `),
    ),
  );

  expectNotFail(
    `little inlined file directly in root directory`,
    'Readme.md',
    (ctx, pathContentsMetaInfo) =>
      gen(function* () {
        const info = yield* pathContentsMetaInfo;

        if (
          info.meta !==
          'This file is small enough that GitHub API decided to inline it'
        )
          throw new Error("File wasn't inlined");

        const { contentStream, ...rest } = info;

        ctx.expect({
          ...rest,
          content: yield* andThen(contentStream, text),
        }).toMatchInlineSnapshot(`
          {
            "blobSha": "f247396548e37f8f6be1fb71ff2e45fd63abed94",
            "content": "# public-repo
          ",
            "meta": "This file is small enough that GitHub API decided to inline it",
            "name": "Readme.md",
            "path": "Readme.md",
            "size": 14,
            "type": "file",
          }
        `);
      }),
  );

  expectNotFail(
    `inlined file with size 1 byte less than 1mb placed directly in root directory`,
    '1023kb+1023b_file.txt',
    (ctx, pathContentsMetaInfo) =>
      gen(function* () {
        const info = yield* pathContentsMetaInfo;

        if (
          info.meta !==
          'This file is small enough that GitHub API decided to inline it'
        )
          throw new Error("File wasn't inlined");

        const { contentStream, ...rest } = info;

        ctx
          .expect({
            ...rest,
            content: yield* andThen(contentStream, text),
          })
          .toEqual({
            type: 'file',
            size: 1024 * 1024 - 1,
            name: '1023kb+1023b_file.txt',
            path: '1023kb+1023b_file.txt',
            blobSha: '4ef7ad24ca43c487151fc6a194eb40fb715bf689',
            meta: 'This file is small enough that GitHub API decided to inline it',
            content: 'a'.repeat(1024 * 1024 - 1),
          });
      }),
  );

  expectNotFail(
    `blob info for file with size exactly 1mb`,
    '1mb_file.txt',
    (ctx, pathContentsMetaInfo) =>
      map(pathContentsMetaInfo, e =>
        ctx.expect(e).toMatchInlineSnapshot(`
        {
          "blobSha": "7c7377879f52df073befeb0cb7df4d1a4b6b7563",
          "meta": "This file can be downloaded as a blob",
          "name": "1mb_file.txt",
          "path": "1mb_file.txt",
          "size": 1048576,
          "type": "file",
        }
      `),
      ),
  );

  expectNotFail(
    `Git-LFS info`,
    '2mb_lfs_file.txt',
    (ctx, pathContentsMetaInfo) =>
      map(pathContentsMetaInfo, e =>
        ctx.expect(e).toMatchInlineSnapshot(`
          {
            "blobSha": "949b64f08bed89afc8de31addc4836432e31d5a2",
            "gitLFSObjectIdSha256": "5256ec18f11624025905d057d6befb03d77b243511ac5f77ed5e0221ce6d84b5",
            "gitLFSVersion": "https://git-lfs.github.com/spec/v1",
            "meta": "This file can be downloaded as a git-LFS object",
            "name": "2mb_lfs_file.txt",
            "path": "2mb_lfs_file.txt",
            "size": 2097152,
            "type": "file",
          }
        `),
      ),
  );

  expectNotFail(
    `little inlined file inside of a nested directory`,
    'parentFolderDirectlyInRoot/childFolder/nestedFile.md',
    (ctx, pathContentsMetaInfo) =>
      gen(function* () {
        const info = yield* pathContentsMetaInfo;

        if (
          info.meta !==
          'This file is small enough that GitHub API decided to inline it'
        )
          throw new Error("File wasn't inlined");

        const { contentStream, ...rest } = info;

        ctx.expect({
          ...rest,
          content: yield* andThen(contentStream, text),
        }).toMatchInlineSnapshot(`
        {
          "blobSha": "24ebb076f9e46157c4abdc6e7b69a775eb38d6a4",
          "content": "# Nested file
        ",
          "meta": "This file is small enough that GitHub API decided to inline it",
          "name": "nestedFile.md",
          "path": "parentFolderDirectlyInRoot/childFolder/nestedFile.md",
          "size": 14,
          "type": "file",
        }
      `);
      }),
  );

  expectNotFail(
    `children of nested directory`,
    'parentFolderDirectlyInRoot/childFolder',
    (ctx, pathContentsMetaInfo) =>
      map(pathContentsMetaInfo, e =>
        ctx.expect(e).toMatchInlineSnapshot(`
        {
          "entries": [
            {
              "name": "nestedFile.md",
              "path": "parentFolderDirectlyInRoot/childFolder/nestedFile.md",
              "sha": "24ebb076f9e46157c4abdc6e7b69a775eb38d6a4",
              "size": 14,
              "type": "file",
            },
          ],
          "meta": "This nested directory can be downloaded as a git tree",
          "name": "childFolder",
          "path": "parentFolderDirectlyInRoot/childFolder",
          "treeSha": "ea5690c87fc1cb6b88cb953f29f826daeb2e43ab",
          "type": "dir",
        }
      `),
      ),
  );
});
