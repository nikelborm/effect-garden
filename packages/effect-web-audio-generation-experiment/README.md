# effect-web-audio-generate

Generates missing Effect wrappers for Web Audio API using @webref/idl.

## Overview

This package uses the [@webref/idl](https://www.npmjs.com/package/@webref/idl) package to parse Web Audio API IDL definitions and generate Effect-compatible wrappers for missing interfaces.

## Installation

```bash
bun install
```

## Usage

Generate the Effect wrappers:

```bash
bun run generate
```

Generate with watch mode:

```bash
bun run generate:watch
```

## Generated Output

The generated wrappers are placed in `src/generated/` and include:

- AudioNode (base class for audio processing modules)
- AudioScheduledSourceNode (base class for audio sources)
- AudioBufferSourceNode (for playing audio samples)
- AudioWorkletNode (for custom audio processing)
- AnalyserNode (for frequency/time data analysis)
- GainNode (for gain control)
- DelayNode (for delay effects)
- BiquadFilterNode (for filter effects)
- WaveShaperNode (for distortion)
- PannerNode (for spatial audio)
- StereoPannerNode (for stereo positioning)
- ConvolverNode (for convolution reverb)
- DynamicsCompressorNode (for compression)
- And more...

## Architecture

The generator script (`scripts/generate.ts`) performs the following steps:

1. Uses `@webref/idl` to parse Web Audio IDL definitions
2. Filters out already-implemented interfaces (AudioBuffer, AudioContext)
3. Generates Effect-compatible wrappers with:
   - Type-safe brand types for numeric values
   - Error mapping using Schema.TaggedError
   - Proper Effect typing for async operations
   - Inspectable and Pipeable integration

## Integration

The generated wrappers integrate with the existing `effect-web-audio` package:

```typescript
import * as EAudioContext from 'effect-web-audio/EAudioContext'
import * as EAudioBufferSourceNode from 'effect-web-audio-generate/EAudioBufferSourceNode'

const program = Effect.gen(function* () {
  const audioContext = yield* EAudioContext.EAudioContext
  const buffer = yield* EAudioBufferSourceNode.make({ buffer: audioBuffer })
})
```

## License

MIT
