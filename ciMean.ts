
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as ciUtils from './utils';
import { parseNumericInput, mean as calcMean, stdev as calcSD } from '../descriptive/utils';

export const ciMean: CalculatorDefinition<{ 
  numbers?: string,
  mean?: number, 
  sd?: number, 
  n?: number, 
  mu0?: number,
  conf: number, 
  precision: number 
}> = {
  metadata: {
    id: 'ci-mean-pro',
    title: 'CI for Mean (Dataset or Summary)',
    category: Category.CONFIDENCE_INTERVALS,
    description: 'Calculate confidence intervals and p-values for a population mean using the t-distribution.',
    keywords: ['mean', 'average', 'dataset', 'raw data', 't-distribution', 'p-value']
  },
  schema: z.object({
    numbers: z.string().optional(),
    mean: z.number().optional(),
    sd: z.number().min(0.00001).optional(),
    n: z.number().int().min(2).optional(),
    mu0: z.number().optional().default(0),
    conf: z.number().min(80).max(99.9).default(95),
    precision: z.number().min(0).max(6).default(4)
  }).refine(data => data.numbers || (data.mean !== undefined && data.sd !== undefined && data.n !== undefined), {
    message: "Provide either a Raw Dataset or Summary Statistics (Mean, SD, N)."
  }),
  examples: [
    { numbers: '12, 15, 14, 11, 19, 13, 15, 17', mu0: 10, conf: 95, precision: 4 },
    { mean: 120, sd: 15, n: 50, mu0: 100, conf: 95, precision: 4 }
  ],
  compute: (data) => {
    let { mean, sd, n, conf, precision, numbers, mu0 } = data;
    if (numbers) {
      const arr = parseNumericInput(numbers);
      n = arr.length;
      mean = calcMean(arr);
      sd = calcSD(arr);
    }
    
    if (mean === undefined || sd === undefined || n === undefined) {
      return { results: [], interpretation: "Insufficient data provided." };
    }

    const se = sd / Math.sqrt(n);
    const df = n - 1;
    const tCrit = ciUtils.getTCritical(conf, df);
    const lower = mean - tCrit * se;
    const upper = mean + tCrit * se;
    
    const h0 = mu0 ?? 0;
    const tStat = (mean - h0) / se;
    const pVals = ciUtils.getTPValue(tStat, df);

    const rCode = numbers 
      ? `# t-test from raw data\nx <- c(${numbers})\nt.test(x, mu = ${h0}, conf.level = ${conf/100})`
      : `# t-test from summary statistics\n# install.packages("BSDA")\nlibrary(BSDA)\ntsum.test(mean.x = ${mean}, s.x = ${sd}, n.x = ${n}, mu = ${h0}, conf.level = ${conf/100})`;

    return {
      results: [
        { label: 'Sample Mean (x̄)', value: mean.toFixed(precision), isMain: true },
        { label: `${conf}% Confidence Interval`, value: ciUtils.formatCI(lower, upper, precision), isMain: true },
        { label: 'Standard Error (SE)', value: se.toFixed(precision) },
        { label: 't-statistic', value: tStat.toFixed(precision) },
        { label: 'p-value (Two-sided)', value: pVals.twoSided < 0.0001 ? "< 0.0001" : pVals.twoSided.toFixed(4), isMain: true, description: `H₀: μ = ${h0}` }
      ],
      interpretation: `The population mean is estimated to fall within [${lower.toFixed(precision)}, ${upper.toFixed(precision)}]. The p-value (${pVals.twoSided.toFixed(4)}) indicates the difference from H₀=${h0} is ${pVals.twoSided < 0.05 ? 'statistically significant' : 'not statistically significant'} at α=0.05.`,
      rCode,
      formula: `SE = s / √n\nCI = x̄ ± (t_{α/2, n-1} * SE)\nt = (x̄ - μ₀) / SE`
    };
  }
};
