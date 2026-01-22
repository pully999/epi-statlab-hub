
/**
 * EpiStatKit - Precision Statistical Utilities
 * Using rational approximations and Cornish-Fisher expansions for distributions.
 */

// Numerical approximation of the error function erf(x)
const erf = (x: number): number => {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return sign * y;
};

// Standard Normal CDF: P(Z < z)
export const getNormalCDF = (z: number): number => {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
};

// Precision Standard Normal Inverse CDF (Probit function)
export const getZCritical = (confidence: number): number => {
  const alpha = 1 - confidence / 100;
  const p = 1 - alpha / 2;
  
  const t = Math.sqrt(-2 * Math.log(1 - p));
  const c = [2.515517, 0.802853, 0.010328];
  const d = [1.432788, 0.189269, 0.001308];
  
  const num = c[0] + (c[1] * t) + (c[2] * t * t);
  const den = 1 + (d[0] * t) + (d[1] * t * t) + (d[2] * t * t * t);
  
  return t - (num / den);
};

// t-distribution Critical Value
export const getTCritical = (confidence: number, df: number): number => {
  if (df <= 0) return 0;
  const z = getZCritical(confidence);
  if (df > 500) return z;

  const z2 = z * z;
  const z3 = z2 * z;
  const z5 = z2 * z3;
  
  const term1 = (z3 + z) / (4 * df);
  const term2 = (5 * z5 + 16 * z3 + 3 * z) / (96 * df * df);
  const term3 = (3 * z5 * z2 + 19 * z5 + 17 * z3 - 15 * z) / (384 * df * df * df);
  
  return z + term1 + term2 + term3;
};

export const getTPValue = (t: number, df: number): { twoSided: number, lower: number, upper: number } => {
  const absT = Math.abs(t);
  if (df > 100) {
    const pZ = getNormalCDF(absT);
    const twoSided = 2 * (1 - pZ);
    const lower = t < 0 ? pZ : 1 - pZ;
    return { twoSided, lower, upper: 1 - lower };
  }

  const angle = Math.atan(absT / Math.sqrt(df));
  let p = 0;
  if (df === 1) {
    p = 1 - (2 / Math.PI) * angle;
  } else {
    let sin = Math.sin(angle);
    let cos = Math.cos(angle);
    if (df % 2 === 1) {
      let term = sin;
      let poly = sin;
      for (let i = 3; i <= df - 2; i += 2) {
        term *= (i - 1) / i * cos * cos;
        poly += term;
      }
      p = 1 - (2 / Math.PI) * (angle + poly * cos);
    } else {
      let term = sin;
      let poly = sin;
      for (let i = 2; i <= df - 2; i += 2) {
        term *= (i - 1) / i * cos * cos;
        poly += term;
      }
      p = 1 - poly * cos;
    }
  }

  const lower = t < 0 ? (1 - p / 2) : p / 2;
  return { 
    twoSided: Math.max(0, Math.min(1, p)), 
    lower: t < 0 ? 1 - p/2 : p/2,
    upper: t > 0 ? 1 - p/2 : p/2
  };
};

export const getChiSqPValue = (chi2: number, df: number): number => {
  if (chi2 <= 0) return 1;
  const z = Math.pow(chi2 / df, 1/3) - (1 - 2/(9*df));
  const denom = Math.sqrt(2 / (9 * df));
  const zStat = z / denom;
  return 1 - getNormalCDF(zStat);
};

export const getChiSqCritical = (p: number, df: number): number => {
  if (df <= 0) return 0;
  const z = getZCritical((1 - p) * 100);
  const inner = 1 - (2 / (9 * df)) + z * Math.sqrt(2 / (9 * df));
  return df * Math.pow(inner, 3);
};

/**
 * F-distribution critical value (used for Clopper-Pearson)
 * Using the relation: F_{1-alpha, d1, d2}
 */
export const getFCritical = (p: number, d1: number, d2: number): number => {
  const z = getZCritical(p * 100);
  const h = 2 / (1 / d1 + 1 / d2);
  const g = (d2 - d1) / (d1 * d2);
  const w = (z * Math.sqrt(h + lambda(z)) / h) - g * (z * z + 2); // Simple F approximation
  return Math.exp(2 * w);
};

const lambda = (z: number) => (z * z - 3) / 6;

/**
 * Generic Confidence Interval formatter.
 * Standardizes display as [Lower, Upper].
 */
export const formatCI = (low: number, high: number, precision: number) => {
  const l = isFinite(low) ? low.toFixed(precision) : "-∞";
  const h = isFinite(high) ? high.toFixed(precision) : "∞";
  return `[${l}, ${h}]`;
};

/**
 * Specialized Proportion CI formatter (clamped to 0-1).
 */
export const formatPropCI = (low: number, high: number, precision: number) => {
  const l = isFinite(low) ? Math.max(0, low).toFixed(precision) : "0.0000";
  const h = isFinite(high) ? Math.min(1, high).toFixed(precision) : "1.0000";
  return `[${l}, ${h}]`;
};
