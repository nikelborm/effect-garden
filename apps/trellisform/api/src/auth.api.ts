import {
  CanUserCreateEducationalSpacesSchema,
  HowToAddressUserFieldSchema,
  IsUserEmailVerifiedFieldSchema,
  UserAvatarFieldSchema,
  UserCreatedAtDateFieldSchema,
  UserEmailFieldSchema,
  UserIdFromNumberSchema,
  UserUpdatedAtDateFieldSchema,
} from '@trellisform/model'

import * as Context from 'effect/Context'
import * as HttpApiEndpoint from 'effect/http-api/HttpApiEndpoint'
import { Unauthorized } from 'effect/http-api/HttpApiError'
import * as HttpApiGroup from 'effect/http-api/HttpApiGroup'
import * as HttpApiMiddleware from 'effect/http-api/HttpApiMiddleware'
import * as Schema from 'effect/Schema'

export class BetterAuthApiError extends Schema.TaggedError<BetterAuthApiError>()(
  'BetterAuthApiError',
  {
    cause: Schema.Unknown,
  },
  {
    httpApiStatus: 500,
  },
) {}

const String32Chars = Schema.String.check(Schema.isBetweenLength(32, 32))

const BetterAuthSessionSchema = Schema.Struct({
  betterAuthSessionId: String32Chars,
  betterAuthUserId: String32Chars,
  token: String32Chars,
  // TODO: make sure that in docker, here proper ip address is that and an IP of NGINX
  ipAddress: Schema.String,
  userAgent: Schema.String,
  expiresAt: Schema.Date,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).pipe(
  Schema.encodeKeys({
    betterAuthSessionId: 'id',
    betterAuthUserId: 'userId',
  }),
)

const BetterAuthUserSchema = Schema.Struct({
  id: UserIdFromNumberSchema,
  betterAuthUserId: String32Chars,
  howToAddressMe: HowToAddressUserFieldSchema,
  email: UserEmailFieldSchema,
  emailVerified: IsUserEmailVerifiedFieldSchema,
  canCreateEducationalSpaces: CanUserCreateEducationalSpacesSchema,
  avatar: UserAvatarFieldSchema,
  createdAt: UserCreatedAtDateFieldSchema,
  updatedAt: UserUpdatedAtDateFieldSchema,
}).pipe(
  Schema.encodeKeys({
    id: 'fastId',
    betterAuthUserId: 'id',
    howToAddressMe: 'name',
    avatar: 'image',
  }),
)

const UserWithSessionSchema = Schema.Struct({
  user: BetterAuthUserSchema,
  session: BetterAuthSessionSchema,
})

export type UserWithSessionDecoded = (typeof UserWithSessionSchema)['Type']

export class UserWithSession extends Context.Service<
  UserWithSession,
  (typeof UserWithSessionSchema)['Type']
>()('UserWithSession') {}

export const decodeUserWithSession = Schema.decodeUnknownResult(
  UserWithSessionSchema,
)

export class UserWithSessionMiddleware extends HttpApiMiddleware.Service<
  UserWithSessionMiddleware,
  { provides: UserWithSession }
>()('UserWithSessionMiddleware', {
  error: Unauthorized,
}) {}

export class AuthApiGroup extends HttpApiGroup.make('Auth')
  .add(
    HttpApiEndpoint.get('get', '/*', {
      success: Schema.Any,
      error: BetterAuthApiError,
    }),
  )
  .add(
    HttpApiEndpoint.post('post', '/*', {
      success: Schema.Any,
      error: BetterAuthApiError,
    }),
  ) {}

// export const EffectAuth = HttpApi.make('Effect.ts Auth')
//   .add(
//     HttpApiGroup.make('Local')
//       .add(
//         HttpApiEndpoint.post(
//           'Login with local email and password',
//         )`/local/login`.addSuccess(Schema.String),
//       )
//       .add(
//         HttpApiEndpoint.post(
//           'Register with local email and password',
//         )`/local/register`.addSuccess(Schema.String),
//       ),
//   )
//   .add(
//     HttpApiGroup.make('Google')
//       .add(
//         HttpApiEndpoint.get(
//           // GET or POST?
//           'Login with google account',
//         )`/google/login`.addSuccess(Schema.String),
//       )
//       .add(
//         HttpApiEndpoint.get(
//           'Login with google account stage 2 (callback)',
//         )`/google/loginCallback`.addSuccess(Schema.String),
//       )
//       .add(
//         HttpApiEndpoint.post(
//           'Register with google account',
//         )`/google/register`.addSuccess(Schema.String),
//       )
//       .add(
//         HttpApiEndpoint.post(
//           'Register with google account stage 2 (callback)',
//         )`/google/registerCallback`.addSuccess(Schema.String),
//       )
//       .add(
//         HttpApiEndpoint.post(
//           'Register with google account stage 3 (Additional user provided data or data confirmation)',
//         )`/google/finishRegister`.addSuccess(Schema.String),
//       ),
//   )
//   .add(
//     HttpApiGroup.make('Other', { topLevel: true })
//       .add(
//         HttpApiEndpoint.get('Logout from current session')`/logout`.addSuccess(
//           Schema.String,
//         ),
//       )
//       .add(
//         HttpApiEndpoint.get(
//           'Logout from every session of currently logged in user',
//         )`/logoutAllSessions`.addSuccess(Schema.String),
//       )
//       .add(
//         HttpApiEndpoint.get(
//           'Refresh token pair from http body in manual mode',
//         )`/refreshTokenPairFromHttpBody`.addSuccess(Schema.String),
//       )
//       .add(
//         HttpApiEndpoint.get(
//           'Refresh token pair from cookies in manual mode',
//         )`/refreshTokenPairFromCookies`.addSuccess(Schema.String),
//       )
//       .add(
//         HttpApiEndpoint.get(
//           'Request email letter to reset password',
//         )`/requestResettingPassword`.addSuccess(Schema.String),
//       )
//       .add(
//         HttpApiEndpoint.get(
//           'Reset password with token',
//         )`/resetPassword`.addSuccess(Schema.String),
//       ),
//   );
