/**
 * Parse #RRGGBB to RGB. Returns null if invalid.
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Euclidean distance in RGB, max ~441 */
export function colorDistance(a: string, b: string): number {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return 0;
  const dr = ra[0] - rb[0];
  const dg = ra[1] - rb[1];
  const db = ra[2] - rb[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export function averagePairwiseDistance(colorsA: string[], colorsB: string[]): number {
  if (colorsA.length === 0 || colorsB.length === 0) return 0;
  let sum = 0;
  let n = 0;
  const limit = Math.min(colorsA.length, colorsB.length, 6);
  for (let i = 0; i < limit; i++) {
    sum += colorDistance(colorsA[i]!, colorsB[i]!);
    n++;
  }
  return n ? sum / n : 0;
}
