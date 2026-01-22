
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as utils from './utils';

export const outlierStats: CalculatorDefinition<{ numbers: string }> = {
  metadata: {
    id: 'outlier-stats',
    title: 'Outliers & Robust Stats',
    category: Category.DESCRIPTIVE,
    description: 'Detect outliers using Tukey Fences (IQR) and calculate robust statistics.',
    keywords: ['outliers', 'tukey', 'iqr', 'mad', 'robust']
  },
  schema: z.object({
    numbers: z.string().min(1, "Input data required")
  }),
  examples: [
    { numbers: '1, 10, 11, 12, 13, 14, 15, 16, 50, 100' }
  ],
  compute: (data) => {
    const arr = utils.parseNumericInput(data.numbers).sort((a, b) => a - b);
    const n = arr.length;
    if (n < 4) return { results: [], interpretation: "Sample size too small for reliable IQR detection." };
    
    const q1 = utils.quantiles(arr, 0.25);
    const q3 = utils.quantiles(arr, 0.75);
    const iqr = q3 - q1;
    const lowerFence = q1 - 1.5 * iqr;
    const upperFence = q3 + 1.5 * iqr;
    
    const outliers = arr.filter(x => x < lowerFence || x > upperFence);
    const med = utils.median(arr);
    
    const diffs = arr.map(x => Math.abs(x - med));
    const mad = utils.median(diffs);

    const rCode = `# Robust Statistics and Outliers\nx <- c(${arr.join(', ')})\n\n# Tukey Outliers\nboxplot.stats(x)$out\n\n# Median Absolute Deviation\nmad(x, constant = 1) # Note: R default constant is 1.4826\n\n# Summary with IQR\nsummary(x)\nIQR(x)\n\n# Plotting fences\nboxplot(x, main="Tukey Outlier Detection")`;

    return {
      results: [
        { label: 'Lower Fence', value: lowerFence.toFixed(4) },
        { label: 'Upper Fence', value: upperFence.toFixed(4) },
        { label: 'Outlier Count', value: outliers.length, isMain: true },
        { label: 'Outliers Found', value: outliers.join(', ') || 'None' },
        { label: 'Median (Robust Central)', value: med.toFixed(4), isMain: true },
        { label: 'MAD (Robust Dispersion)', value: mad.toFixed(4) }
      ],
      interpretation: outliers.length > 0 
        ? `${outliers.length} outliers detected outside [${lowerFence.toFixed(2)}, ${upperFence.toFixed(2)}].`
        : "No outliers detected using the 1.5xIQR Tukey method.",
      rCode,
      formula: `Lower = Q1 - 1.5*IQR\nUpper = Q3 + 1.5*IQR\nMAD = Median(|x_i - Median|)`
    };
  }
};
