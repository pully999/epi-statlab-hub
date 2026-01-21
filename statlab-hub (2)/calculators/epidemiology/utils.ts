import * as ciUtils from '../confidenceIntervals/utils';

export interface Table2x2 {
  a: number; // Exposed + Disease
  b: number; // Exposed - Disease
  c: number; // Unexposed + Disease
  d: number; // Unexposed - Disease
}

export const safeDivide = (num: number, den: number): number => {
  if (den === 0) return 0;
  return num / den;
};

export const formatPercent = (val: number, precision = 2): string => {
  return (val * 100).toFixed(precision) + '%';
};

export const applyContinuityCorrection = (table: Table2x2): Table2x2 => {
  const hasZero = table.a === 0 || table.b === 0 || table.c === 0 || table.d === 0;
  if (!hasZero) return table;
  return {
    a: table.a + 0.5,
    b: table.b + 0.5,
    c: table.c + 0.5,
    d: table.d + 0.5
  };
};

export const computeRR = (table: Table2x2, conf = 95) => {
  const t = applyContinuityCorrection(table);
  const r1 = t.a / (t.a + t.b);
  const r2 = t.c / (t.c + t.d);
  const rr = r1 / r2;
  
  const seLog = Math.sqrt((1/t.a - 1/(t.a+t.b)) + (1/t.c - 1/(t.c+t.d)));
  const z = ciUtils.getZCritical(conf);
  
  return {
    value: rr,
    lower: Math.exp(Math.log(rr) - z * seLog),
    upper: Math.exp(Math.log(rr) + z * seLog)
  };
};

export const computeOR = (table: Table2x2, conf = 95) => {
  const t = applyContinuityCorrection(table);
  const or = (t.a * t.d) / (t.b * t.c);
  const seLog = Math.sqrt(1/t.a + 1/t.b + 1/t.c + 1/t.d);
  const z = ciUtils.getZCritical(conf);
  
  return {
    value: or,
    lower: Math.exp(Math.log(or) - z * seLog),
    upper: Math.exp(Math.log(or) + z * seLog)
  };
};

export const computeRD = (table: Table2x2, conf = 95) => {
  const r1 = table.a / (table.a + table.b);
  const r2 = table.c / (table.c + table.d);
  const rd = r1 - r2;
  const se = Math.sqrt((r1 * (1-r1))/(table.a+table.b) + (r2 * (1-r2))/(table.c+table.d));
  const z = ciUtils.getZCritical(conf);
  
  return {
    value: rd,
    lower: rd - z * se,
    upper: rd + z * se,
    nnt: rd === 0 ? Infinity : Math.ceil(Math.abs(1/rd))
  };
};
