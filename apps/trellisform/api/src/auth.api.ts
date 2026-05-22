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

import {
  HttpApiEndpoint,
  HttpApiGroup,
  HttpApiMiddleware,
  HttpApiSchema,
} from '@effect/platform'
import { Unauthorized } from '@effect/platform/HttpApiError'
import { Context, Schema } from 'effect'
import { decodeUnknownEither } from 'effect/Schema'

export class BetterAuthApiError extends Schema.TaggedError<BetterAuthApiError>(
  'BetterAuthApiError',
)(
  'BetterAuthApiError',
  {
    cause: Schema.Unknown,
  },
  HttpApiSchema.annotations({
    status: 500,
  }),
) {}

const String32Chars = Schema.String.pipe(Schema.length(32))

const BetterAuthSessionSchema = Schema.Struct({
  betterAuthSessionId: Schema.propertySignature(String32Chars).pipe(
    Schema.fromKey('id'),
  ),
  betterAuthUserId: Schema.propertySignature(String32Chars).pipe(
    Schema.fromKey('userId'),
  ),
  token: String32Chars,
  // TODO: make sure that in docker, here proper ip address is that and an IP of NGINX
  ipAddress: Schema.String,
  userAgent: Schema.String,
  expiresAt: Schema.Date,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
})

const BetterAuthUserSchema = Schema.Struct({
  id: Schema.propertySignature(UserIdFromNumberSchema).pipe(
    Schema.fromKey('fastId'),
  ),
  betterAuthUserId: Schema.propertySignature(String32Chars).pipe(
    Schema.fromKey('id'),
  ),
  howToAddressMe: Schema.propertySignature(HowToAddressUserFieldSchema).pipe(
    Schema.fromKey('name'),
  ),
  email: UserEmailFieldSchema,
  emailVerified: IsUserEmailVerifiedFieldSchema,
  canCreateEducationalSpaces: CanUserCreateEducationalSpacesSchema,
  avatar: Schema.propertySignature(UserAvatarFieldSchema).pipe(
    Schema.fromKey('image'),
  ),
  createdAt: UserCreatedAtDateFieldSchema,
  updatedAt: UserUpdatedAtDateFieldSchema,
})

const UserWithSessionSchema = Schema.Struct({
  user: BetterAuthUserSchema,
  session: BetterAuthSessionSchema,
})

export type UserWithSessionDecoded = (typeof UserWithSessionSchema)['Type']

export class UserWithSession extends Context.Tag('UserWithSession')<
  UserWithSession,
  (typeof UserWithSessionSchema)['Type']
>() {}

export const decodeUserWithSession = decodeUnknownEither(UserWithSessionSchema)

export class UserWithSessionMiddleware extends HttpApiMiddleware.Tag<UserWithSessionMiddleware>()(
  'UserWithSessionMiddleware',
  {
    provides: UserWithSession,
    failure: Unauthorized,
  },
) {}

export class AuthApiGroup extends HttpApiGroup.make('Auth')
  .add(
    HttpApiEndpoint.get('get', '/*')
      .addSuccess(Schema.Any)
      .addError(BetterAuthApiError),
  )
  .add(
    HttpApiEndpoint.post('post', '/*')
      .addSuccess(Schema.Any)
      .addError(BetterAuthApiError),
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
