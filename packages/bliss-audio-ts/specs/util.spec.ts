import { resolve } from 'node:path'

import { arange, loadNpySync, convolve as npConvolve, ones } from 'numpy-ts'
import { expect, test } from 'vitest'

// Tests rewritten in pure TypeScript:
//   test_mean, test_geometric_mean, test_hz_to_octs_inplace, test_reflect_pad
//
// Tests rewritten using numpy-ts (npy snapshot comparison):
//   test_convolve
//
// Tests skipped — require ffmpeg feature + STFT implementation:
//   test_compute_stft (STFT over decoded audio; compares against librosa-stft.npy)

const DATA = resolve(import.meta.dirname, '..', 'bliss-audio', 'data')

// ── mean ──────────────────────────────────────────────────────────────────────

function mean(input: number[]): number {
  return input.reduce((sum, x) => sum + x, 0) / input.length
}

// ── geometric_mean ────────────────────────────────────────────────────────────

// Port of Jacques-Henri Jourdan's finely optimised Rust geometric_mean.
// Input length must be a multiple of 8; values must be in [0; 2^65].
// Uses DataView bit-manipulation to mirror Rust's u64::to_bits / f64::from_bits.
function geometricMean(input: number[]): number {
  let exponents = 0 // i32 accumulator
  let mantissas = 1.0 // f64 accumulator
  const buf = new ArrayBuffer(8)
  const view = new DataView(buf)

  for (let base = 0; base + 8 <= input.length; base += 8) {
    let m =
      input[base]! * input[base + 1]! * (input[base + 2]! * input[base + 3]!)
    m *= 3.273390607896142e150 // 2^500: avoid underflows and denormals
    m *=
      input[base + 4]! *
      input[base + 5]! *
      (input[base + 6]! * input[base + 7]!)
    if (m === 0) return 0

    view.setFloat64(0, m, false)
    const hi = BigInt(view.getUint32(0, false))
    const lo = BigInt(view.getUint32(4, false))
    const bits = (hi << 32n) | lo

    exponents = (exponents + Number(bits >> 52n)) | 0 // keep as int32
    const mantissaBits =
      (bits & 0x000f_ffff_ffff_ffffn) | 0x3ff0_0000_0000_0000n
    view.setUint32(0, Number(mantissaBits >> 32n), false)
    view.setUint32(4, Number(mantissaBits & 0xffff_ffffn), false)
    mantissas *= view.getFloat64(0, false)
  }

  const n = input.length
  // Mirrors Rust: (((mantissas as f32).log2() + exponents as f32) / n as f32
  //               - (1023. + 500.) / 8.).exp2()
  const mantissasF32 = Math.fround(mantissas)
  const logm = Math.fround(Math.log2(mantissasF32))
  const shifted = Math.fround(
    Math.fround(Math.fround(logm + Math.fround(exponents)) / Math.fround(n)) -
      Math.fround((1023 + 500) / 8),
  )
  return Math.fround(2 ** shifted)
}

// ── hzToOctsInplace ──────────────────────────────────────────────────────────

function hzToOctsInplace(
  frequencies: number[],
  tuning: number,
  binsPerOctave: number,
): number[] {
  const a440 = 440.0 * 2 ** (tuning / binsPerOctave)
  for (let i = 0; i < frequencies.length; i++) {
    frequencies[i] = Math.log2(frequencies[i]! / (a440 / 16))
  }
  return frequencies
}

// ── reflectPad ────────────────────────────────────────────────────────────────

function reflectPad(array: number[], pad: number): number[] {
  const prefix = array.slice(1, pad + 1).reverse()
  const suffix = array.slice(array.length - 1 - pad, array.length - 1).reverse()
  return [...prefix, ...array, ...suffix]
}

// ── test_mean ─────────────────────────────────────────────────────────────────

test('test_mean', () => {
  const numbers = [0.0, 1.0, 2.0, 3.0, 4.0]
  expect(mean(numbers)).toBe(2.0)
})

// ── test_geometric_mean ───────────────────────────────────────────────────────

test('test_geometric_mean: zero value collapses to zero', () => {
  const numbers = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]
  expect(geometricMean(numbers)).toBe(0.0)
})

test('test_geometric_mean: balanced input returns 2.0', () => {
  const numbers = [4.0, 2.0, 1.0, 4.0, 2.0, 1.0, 2.0, 2.0]
  expect(Math.abs(2.0 - geometricMean(numbers))).toBeLessThan(0.0001)
})

test('test_geometric_mean: 256-heavy input returns ~3.668', () => {
  const numbers = [256.0, 4.0, 2.0, 1.0, 4.0, 2.0, 1.0, 2.0]
  expect(Math.abs(3.668016172818685 - geometricMean(numbers))).toBeLessThan(
    0.0001,
  )
})

test('test_geometric_mean: subnormal value', () => {
  const subnormal = [4.0, 2.0, 1.0, 4.0, 2.0, 1.0, 2.0, Math.fround(1.0e-40)]
  expect(
    Math.abs(1.8340080864093417e-5 - geometricMean(subnormal)),
  ).toBeLessThan(0.0001)
})

test('test_geometric_mean: maximum (2^65) repeated 256 times', () => {
  const maximum = Array.from<number>({ length: 256 }).fill(2 ** 65)
  // Mirrors Rust: assert!(0.0001 > (2_f32.powi(65) - geometric_mean(&maximum).abs()))
  expect(0.0001).toBeGreaterThan(2 ** 65 - Math.abs(geometricMean(maximum)))
})

test('test_geometric_mean: large 256-element input within 1e-8 of expected', () => {
  // Use Float32Array so each literal is rounded to f32 exactly as in Rust.
  const inputF32 = new Float32Array([
    0.024454033, 0.08809689, 0.44554362, 0.82753503, 0.15822093, 1.4442245,
    3.6971385, 3.6789556, 1.5981572, 1.0172718, 1.4436096, 3.1457102, 2.7641108,
    0.8395235, 0.24896829, 0.07063173, 0.3554194, 0.3520014, 0.7973651,
    0.6619708, 0.784104, 0.8767957, 0.28738266, 0.04884128, 0.3227065,
    0.33490747, 0.18588875, 0.13544942, 0.14017746, 0.11181582, 0.15263161,
    0.22199312, 0.056798387, 0.08389257, 0.07000965, 0.20290329, 0.37071738,
    0.23154318, 0.02334859, 0.013220183, 0.035887096, 0.02950549, 0.09033857,
    0.17679504, 0.08142187, 0.0033268086, 0.012269007, 0.016257336, 0.027027424,
    0.017253408, 0.017230038, 0.021678915, 0.018645158, 0.005417136,
    0.0066501745, 0.020159671, 0.026623515, 0.0051667937, 0.016880387,
    0.0099352235, 0.011079361, 0.013200151, 0.0053205723, 0.0050702896,
    0.008130498, 0.009006041, 0.0036024998, 0.0064403876, 0.004656151,
    0.0025131858, 0.0030845597, 0.008722531, 0.017871628, 0.022656294,
    0.017539924, 0.0094395885, 0.00308572, 0.0013586166, 0.0027467872,
    0.0054130103, 0.004140312, 0.00014358714, 0.0013718408, 0.004472961,
    0.003769122, 0.0032591296, 0.00363724, 0.0024453322, 0.00059036893,
    0.00064789865, 0.001745297, 0.0008671655, 0.0021562362, 0.0010756068,
    0.0020091995, 0.0015373885, 0.0009846204, 0.00029200249, 0.0009211624,
    0.0005351118, 0.0014912765, 0.0020651375, 0.00066112226, 0.00085005426,
    0.0019005901, 0.0006395845, 0.002262803, 0.0030940182, 0.0020891617,
    0.001215059, 0.0013114084, 0.000470959, 0.0006654807, 0.00143032,
    0.0017918893, 0.00086320075, 0.0005604455, 0.00082841754, 0.0006694539,
    0.000822765, 0.0006165758, 0.001189319, 0.0007300245, 0.0006237481,
    0.0012076444, 0.0014746742, 0.002033916, 0.0015001699, 0.00052051,
    0.00044564332, 0.00055846275, 0.00089778664, 0.00080524705, 0.00072653644,
    0.0006730526, 0.0009940645, 0.0011093937, 0.0012950997, 0.0009826822,
    0.0008766518, 0.0016549287, 0.00092906435, 0.00029130623, 0.00025049047,
    0.00022848802, 0.00026967315, 0.00023737509, 0.0009694061, 0.0010638118,
    0.00079342886, 0.00059083506, 0.0004763899, 0.0009516641, 0.00069223146,
    0.0005571137, 0.0008517697, 0.0010710277, 0.0006102439, 0.00074687623,
    0.00084989844, 0.0004958062, 0.000526994, 0.00021524922, 0.000096684314,
    0.0006545544, 0.0012206973, 0.0012103583, 0.00092045433, 0.0009248435,
    0.0008121284, 0.00023953256, 0.0009318224, 0.0010439663, 0.00048373415,
    0.00029895222, 0.0004844254, 0.0006668295, 0.0009983985, 0.0008604897,
    0.00018315323, 0.0003091808, 0.0005426462, 0.0010403915, 0.0007554566,
    0.0002846017, 0.0006009793, 0.0007650569, 0.00056281046, 0.00034661655,
    0.00023622432, 0.0005987106, 0.00029568427, 0.00038697806, 0.000584258,
    0.0005670976, 0.0006136444, 0.0005645493, 0.00023538452, 0.0002855746,
    0.00038535293, 0.00043193565, 0.0007312465, 0.0006030728, 0.0010331308,
    0.0011952162, 0.0008245007, 0.00042218363, 0.00082176016, 0.001132246,
    0.00089140673, 0.0006351588, 0.00037268156, 0.00023035, 0.0006286493,
    0.0008061599, 0.00066162215, 0.00022713901, 0.00021469496, 0.0006654577,
    0.000513901, 0.00039176678, 0.0010790947, 0.0007353637, 0.00017166573,
    0.00043964887, 0.0002951453, 0.00017704708, 0.00018295897, 0.00092653604,
    0.0008324083, 0.0008041684, 0.0011318093, 0.0011871496, 0.0008069488,
    0.00062862475, 0.0005913861, 0.0004721823, 0.00016365231, 0.00017787657,
    0.00042536375, 0.0005736993, 0.00043467924, 0.00009028294, 0.00017257355,
    0.0005019574, 0.0006147168, 0.0002167805, 0.0001489743, 0.000055081473,
    0.00029626413, 0.00037805567, 0.00014736196, 0.00026251364, 0.00016211842,
    0.0001853477, 0.0001387354,
  ])
  const input = Array.from(inputF32)
  expect(Math.abs(0.0025750597 - geometricMean(input))).toBeLessThan(0.00000001)
})

// ── test_hz_to_octs_inplace ───────────────────────────────────────────────────

test('test_hz_to_octs_inplace', () => {
  const frequencies = [32.0, 64.0, 128.0, 256.0]
  const expected = [0.16864029, 1.16864029, 2.16864029, 3.16864029]
  hzToOctsInplace(frequencies, 0.5, 10).forEach((x, i) => {
    expect(Math.abs(x - expected[i]!)).toBeLessThan(0.0001)
  })
})

// ── test_reflect_pad ──────────────────────────────────────────────────────────

test('test_reflect_pad', () => {
  const array = Array.from<unknown, number>({ length: 100000 }, (_, i) => i)
  const output = reflectPad(array, 3)
  expect(output.slice(0, 4)).toEqual([3.0, 2.0, 1.0, 0.0])
  expect(output.slice(3, 100003)).toEqual(array)
  expect(output.slice(100003, 100006)).toEqual([99998.0, 99997.0, 99996.0])
})

// ── test_convolve ─────────────────────────────────────────────────────────────

// Mirrors test_convolve: computes same-mode convolution using numpy-ts and
// checks element-by-element against pinned npy snapshots. Rust tolerance: 1e-7.
test('test_convolve: even-length kernel (100) matches convolve.npy', () => {
  const expected = loadNpySync(resolve(DATA, 'convolve.npy'))
  const input = arange(0, 1000, 0.5)
  const kernel = ones([100])
  const output = npConvolve(input, kernel, 'same')
  const n = expected.shape[0] as number
  for (let i = 0; i < n; i++) {
    expect(Math.abs(Number(expected[i]) - Number(output[i]))).toBeLessThan(
      0.0000001,
    )
  }
})

test('test_convolve: odd-length kernel (99) matches convolve_odd.npy', () => {
  const expected = loadNpySync(resolve(DATA, 'convolve_odd.npy'))
  const input = arange(0, 1000, 0.5)
  const kernel = ones([99])
  const output = npConvolve(input, kernel, 'same')
  const n = expected.shape[0] as number
  for (let i = 0; i < n; i++) {
    expect(Math.abs(Number(expected[i]) - Number(output[i]))).toBeLessThan(
      0.0000001,
    )
  }
})
