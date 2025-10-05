export type PreserveUndefinedOnlyIfWasExplicit<T, Key extends keyof T> = {
  [K in Key]: T[Key];
} extends { [K in Key]: Exclude<T[Key], undefined> }
  ? Exclude<T[Key], undefined>
  : T[Key];
