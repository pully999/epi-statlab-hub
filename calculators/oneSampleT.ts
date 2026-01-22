
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';
import * as ciUtils from './confidenceIntervals/utils';

export const oneSampleT: CalculatorDefinition<{ mean: number, mu0: number, sd: number, n: number, conf: number }> = {
  metadata: {
    id: 'one-sample-t',
    title: 'One-Sample t-test',
    category: Category.HYPOTHESIS_TESTS,
    description: 'Compare a sample mean to a hypothesized population mean.',
    keywords: ['t-test', 'hypothesis', 'mean', 'p-value']
  },
  schema: z.object({
    mean: z.number(),
    mu0: z.number(),
    sd: z.number().min(0.0001),
    n: z.number().int().min(2),
    conf: z.number().min(80).max(99.9).default(95)
  }),
  examples: [{ mean: 105, mu0: 100, sd: 15, n: 30, conf: 95 }],
  compute: (data) => {
    const { mean, mu0, sd, n, conf } = data;
    const se = sd / Math.sqrt(n);
    const t = (mean - mu0) / se;
    const df = n - 1;
    const tCrit = ciUtils.getTCritical(conf, df);
    const pValues = ciUtils.getTPValue(t, df);
    const lower = mean - (tCrit * se);
    const upper = mean + (tCrit * se);

    const rCode = `# Method 1: Using summary statistics (Requires 'BSDA' package)\n# install.packages("BSDA")\nlibrary(BSDA)\n\ntsum.test(mean.x = ${mean}, s.x = ${sd}, n.x = ${n},\n          mu = ${mu0}, conf.level = ${conf/100})\n\n# Method 2: If you had raw data 'x'\n# t.test(x, mu = ${mu0}, conf.level = ${conf/100})`;

    return {
      results: [
        { label: 't-statistic', value: t.toFixed(4), isMain: true },
        { label: 'p (Two-sided)', value: pValues.twoSided.toFixed(4), isMain: true },
        { label: 'Degrees of Freedom', value: df },
        { label: `${conf}% CI`, value: ciUtils.formatCI(lower, upper, 4) }
      ],
      interpretation: `t=${t.toFixed(3)}, p=${pValues.twoSided.toFixed(4)}.`,
      rCode,
      formula: `t = (x̄ - μ₀) / (s/√n)`
    };
  }
};
