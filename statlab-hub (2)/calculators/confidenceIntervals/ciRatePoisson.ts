
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as ciUtils from './utils';

export const ciRatePoisson: CalculatorDefinition<{ 
  k: number, 
  T: number, 
  conf: number,
  precision: number 
}> = {
  metadata: {
    id: 'ci-rate-poisson',
    title: 'Poisson Rate CI',
    category: Category.CONFIDENCE_INTERVALS,
    description: 'Calculate confidence intervals for a Poisson rate (events per person-time) using Exact and Byar methods.',
    keywords: ['poisson', 'rate', 'incidence', 'person-time', 'byar', 'exact']
  },
  schema: z.object({
    k: z.number().int().min(0, "Events (k) must be a non-negative integer"),
    T: z.number().min(0.000001, "Person-time (T) must be positive"),
    conf: z.number().min(80).max(99.9).default(95),
    precision: z.number().min(0).max(8).default(4)
  }),
  examples: [
    { k: 5, T: 1000, conf: 95, precision: 4 },
    { k: 25, T: 500, conf: 95, precision: 4 }
  ],
  compute: (data) => {
    const { k, T, conf, precision } = data;
    const alpha = 1 - conf / 100;
    const rate = k / T;

    const exactLower = k === 0 ? 0 : ciUtils.getChiSqCritical(alpha / 2, 2 * k) / (2 * T);
    const exactUpper = ciUtils.getChiSqCritical(1 - alpha / 2, 2 * (k + 1)) / (2 * T);

    const zCrit = ciUtils.getZCritical(conf);
    const byarTerm = (zCrit / 3) * Math.sqrt(1 / (k + 0.5));
    const byarLower = ((k + 0.5) * Math.pow(1 - 1 / (9 * (k + 0.5)) - byarTerm, 3)) / T;
    const byarUpper = ((k + 0.5) * Math.pow(1 - 1 / (9 * (k + 0.5)) + byarTerm, 3)) / T;

    const rCode = `# Poisson Rate Analysis\nk <- ${k}\nTime <- ${T}\n\n# Exact Test\npoisson.test(k, Time, conf.level = ${conf/100})\n\n# For Byar's or other approximations, use 'epiR'\n# library(epiR); epi.conf(matrix(c(k, Time), nrow=1), ctype="inc.rate")`;

    const f = (val: number) => val.toFixed(precision);

    return {
      results: [
        { label: 'Observed Rate', value: f(rate), isMain: true },
        { label: 'Exact Poisson CI', value: ciUtils.formatCI(exactLower, exactUpper, precision), isMain: true },
        { label: "Byar's Approximation CI", value: ciUtils.formatCI(byarLower, byarUpper, precision) },
        { label: 'Events (k)', value: k },
        { label: 'Person-Time (T)', value: T }
      ],
      interpretation: `The observed rate is ${f(rate)} events per person-time unit.`,
      rCode,
      formula: `Exact Lower: χ²(α/2, 2k) / 2T\nExact Upper: χ²(1-α/2, 2k+2) / 2T`
    };
  }
};
