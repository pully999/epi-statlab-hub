
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';

export const ciMean: CalculatorDefinition<{ mean: number, sd: number, n: number, conf: number }> = {
  metadata: {
    id: 'ci-mean',
    title: 'CI for a Mean',
    category: Category.CONFIDENCE_INTERVALS,
    description: 'Calculate confidence interval for a population mean given sample stats.',
    keywords: ['CI', 'mean', 'average']
  },
  schema: z.object({
    mean: z.number(),
    sd: z.number().min(0),
    n: z.number().min(2),
    conf: z.number().min(80).max(99.9)
  }),
  examples: [{ mean: 120, sd: 15, n: 50, conf: 95 }],
  compute: (data) => {
    const { mean, sd, n, conf } = data;
    const se = sd / Math.sqrt(n);
    const z = 1.96; 
    const me = z * se;
    
    return {
      results: [
        { label: 'Sample Mean', value: mean, isMain: true },
        { label: 'Standard Error', value: se.toFixed(4) },
        { label: 'Margin of Error', value: me.toFixed(4) },
        { label: 'Lower Bound', value: (mean - me).toFixed(4) },
        { label: 'Upper Bound', value: (mean + me).toFixed(4) }
      ],
      interpretation: `The true population mean is estimated to be between ${(mean - me).toFixed(2)} and ${(mean + me).toFixed(2)}.`,
      formula: `CI = \\bar{x} \\pm Z \\frac{s}{\\sqrt{n}}`
    };
  }
};
