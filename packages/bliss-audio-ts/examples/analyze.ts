/**
 * Simple utility to print the result of an Analysis.
 *
 * Takes a list of files to analyze and prints the corresponding Analysis.
 *
 * Usage: bun examples/analyze.ts <file1> [file2] ...
 */
import { analyzeSong, isBlissError } from '../index.ts'

const paths = Bun.argv.slice(2)

for (const path of paths) {
  const result = analyzeSong(path)
  if (isBlissError(result)) {
    console.log(`${path}: ${result.message}`)
  } else {
    const features = Array.from(result.analysis.features).map(f => f.toFixed(6))
    console.log(
      `${path}: Analysis { features: [${features.join(', ')}], features_version: ${result.analysis.featuresVersion} }`,
    )
  }
}
