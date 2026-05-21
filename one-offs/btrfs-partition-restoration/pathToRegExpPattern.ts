export function pathToRegExpPattern(path: string) {
  const mangledPath = path
    // Strip leading/trailing slashes
    .replace(/^\//, '')
    .replace(/\/*$/, '')

    // Escape regex special characters (except * and ? which are wildcards)
    .replaceAll(/[.+|()[\]\\{}]/g, '\\$&')

    // Translate shell wildcards to regex equivalents
    .replaceAll('*', '.*')
    .replaceAll('?', '.')

  // Count path separators
  // @ts-expect-error bad upstream types. `matchAll` can accept strings
  const slashCount = mangledPath.matchAll('/').toArray().length

  return (
    '^/(|' +
    mangledPath.replaceAll('/', '(|/') +
    '(|/.*)' +
    ')'.repeat(slashCount) +
    ')$'
  )
}
// console.log(pathToRegExpPattern('@home/nikel/.config/google-chrome/Default/Sync Data/LevelDB'))
// ^/(|@home(|/nikel(|/\.config(|/google-chrome(|/Default(|/Sync Data(|/LevelDB(|/.*))))))))$
