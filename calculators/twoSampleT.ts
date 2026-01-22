
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';
import * as ciUtils from './confidenceIntervals/utils';

export const twoSampleT: CalculatorDefinition<{ m1: number, s1: number, n1: number, m2: number, s2: number, n2: number, conf: number }> = {
  metadata: {
    id: 'two-sample-t',
    title: 'Independent Two-Sample t-test',
    category: Category.HYPOTHESIS_TESTS,
    description: 'Compare means from two independent groups with p-values for all hypothesis directions.',
    keywords: ['t-test', 'compare', 'means', 'independent', 'p-value']
  },
  schema: z.object({
    m1: z.number(), s1: z.number().min(0.001), n1: z.number().min(2),
    m2: z.number(), s2: z.number().min(0.001), n2: z.number().min(2),
    conf: z.number().min(80).max(99.9).default(95)
  }),
  examples: [{ m1: 85, s1: 10, n1: 20, m2: 78, s2: 12, n2: 20, conf: 95 }],
  compute: (data) => {
    const { m1, s1, n1, m2, s2, n2, conf } = data;
    const df = n1 + n2 - 2;
    const pooledSD = Math.sqrt(((n1 - 1) * s1 ** 2 + (n2 - 1) * s2 ** 2) / df);
    const se = pooledSD * Math.sqrt(1 / n1 + 1 / n2);
    const t = (m1 - m2) / se;
    
    const pValues = ciUtils.getTPValue(t, df);
    const formatP = (p: number) => p < 0.001 ? "< 0.001" : p.toFixed(4);

    const rCode = `# Method 1: Using summary statistics (Requires 'BSDA' package)\n# install.packages("BSDA")\nlibrary(BSDA)\n\ntsum.test(mean.x = ${m1}, s.x = ${s1}, n.x = ${n1},\n          mean.y = ${m2}, s.y = ${s2}, n.y = ${n2},\n          var.equal = TRUE, conf.level = ${conf/100})\n\n# Method 2: If using raw data vectors x1 and x2\n# t.test(x1, x2, var.equal = TRUE, conf.level = ${conf/100})`;

    return {
      results: [
        { label: 't-statistic', value: t.toFixed(4), isMain: true },
        { label: 'p (Two-sided)', value: formatP(pValues.twoSided), isMain: true },
        { label: 'Pooled SD', value: pooledSD.toFixed(4) },
        { label: 'Degrees of Freedom (df)', value: df },
        { label: 'Mean Difference', value: (m1 - m2).toFixed(4) }
      ],
      interpretation: `The two-sample t-test yields p = ${formatP(pValues.twoSided)}. ${pValues.twoSided < (1 - conf/100) ? 'A significant difference exists' : 'No significant difference was detected'} between the group means.`,
      rCode,
      formula: `t = (x̄₁ - x̄₂) / (s_p * √(1/n₁ + 1/n₂))`
    };
  }
};
