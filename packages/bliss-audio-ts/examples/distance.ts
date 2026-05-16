/**
 * Simple utility to print distance between two songs according to bliss.
 *
 * Takes two file paths, analyzes the corresponding songs, and prints
 * the euclidean distance between them.
 *
 * Usage: bun examples/distance.ts <song1> <song2>
 */
import { analyzeSong, euclideanDistance, isBlissError } from '../index.ts'

const [firstPath, secondPath] = Bun.argv.slice(2)

if (!firstPath || !secondPath) {
  console.error('Help: bun examples/distance.ts <song1> <song2>')
  process.exit(1)
}

const song1 = analyzeSong(firstPath)
if (isBlissError(song1)) {
  console.error(song1.message)
  process.exit(1)
}

const song2 = analyzeSong(secondPath)
if (isBlissError(song2)) {
  console.error(song2.message)
  process.exit(1)
}

const dist = euclideanDistance(song1.analysis.features, song2.analysis.features)
console.log(
  `d(${JSON.stringify(song1.path)}, ${JSON.stringify(song2.path)}) = ${dist}`,
)
