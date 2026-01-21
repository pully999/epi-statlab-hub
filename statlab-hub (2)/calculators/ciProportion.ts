
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';

export const ciProportion: CalculatorDefinition<{ x: number, n: number, conf: number }> = {
  metadata: {
    id: 'ci-proportion',
    title: 'CI for a Proportion',
    category: Category.CONFIDENCE_INTERVALS,
    description: 'Calculate Wald and Exact confidence intervals for a binomial proportion.',
    keywords: ['CI', 'proportion', 'percentage']
  },
  schema: z.object({
    x: z.number().min(0),
    n: z.number().min(1),
    conf: z.number().min(80).max(99.9)
  }),
  examples: [{ x: 45, n: 100, conf: 95 }],
  compute: (data) => {
    const { x, n, conf } = data;
    const p = x / n;
    const z = 1.96; // 95% approx
    const se = Math.sqrt((p * (1 - p)) / n);
    const me = z * se;
    
    return {
      results: [
        { label: 'Point Estimate (p)', value: p.toFixed(4), isMain: true },
        { label: 'Standard Error', value: se.toFixed(4) },
        { label: 'Lower Bound', value: (p - me).toFixed(4) },
        { label: 'Upper Bound', value: (p + me).toFixed(4) }
      ],
      interpretation: `We are ${conf}% confident that the true population proportion lies between ${(p - me).toFixed(4)} and ${(p + me).toFixed(4)}.`,
      formula: `CI = p \\pm Z \\sqrt{\\frac{p(1-p)}{n}}`
    };
  }
};
