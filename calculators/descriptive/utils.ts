
/**
 * EpiStatKit - Core Statistics Utilities
 */

export const parseNumericInput = (input: string): number[] => {
  if (!input) return [];
  // Split by any sequence of common delimiters: space, comma, semicolon, tab, newline
  return input
    .split(/[,\s;:\t\n\r]+/)
    .map(v => v.trim())
    .filter(v => v !== "")
    .map(v => parseFloat(v))
    .filter(v => !isNaN(v));
};

export const mean = (arr: number[]) => {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

export const median = (arr: number[]) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const variance = (arr: number[], population = false) => {
  if (arr.length < 2 && !population) return 0;
  const m = mean(arr);
  const df = population ? arr.length : arr.length - 1;
  return arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / df;
};

export const stdev = (arr: number[], population = false) => Math.sqrt(variance(arr, population));

// Method 7 R-style quantiles (standard for biostats)
export const quantiles = (arr: number[], p: number) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

export const moments = (arr: number[]) => {
  const n = arr.length;
  if (n < 3) return { skew: 0, kurt: 0, excessKurt: 0 };
  const m = mean(arr);
  let m2 = 0, m3 = 0, m4 = 0;
  for (const x of arr) {
    const dev = x - m;
    const d2 = dev * dev;
    m2 += d2;
    m3 += d2 * dev;
    m4 += d2 * d2;
  }
  m2 /= n; m3 /= n; m4 /= n;
  const s = Math.sqrt(m2);
  // Adjusted Fisher-Pearson skewness
  const skew = (Math.sqrt(n * (n - 1)) / (n - 2)) * (m3 / Math.pow(s, 3));
  // Sample excess kurtosis
  const kurt = ((n - 1) / ((n - 2) * (n - 3))) * ((n + 1) * (m4 / (m2 * m2)) - 3 * (n - 1));
  return { skew, kurt, excessKurt: kurt + 3 };
};

export const getMode = (arr: any[]) => {
  if (arr.length === 0) return [];
  const counts = new Map();
  arr.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
  let max = 0;
  let modes: any[] = [];
  counts.forEach((count, val) => {
    if (count > max) {
      max = count;
      modes = [val];
    } else if (count === max) {
      modes.push(val);
    }
  });
  return modes.length === counts.size && counts.size > 1 ? [] : modes;
};
