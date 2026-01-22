
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as ciUtils from '../confidenceIntervals/utils';

export const powerPaired: CalculatorDefinition<{ 
  n: number, 
  diff: number, 
  sdDiff: number, 
  alpha: number 
}> = {
  metadata: {
    id: 'power-paired',
    title: 'Power: Paired Means',
    category: Category.SAMPLE_SIZE,
    description: 'Calculate power for matched pairs or pre-test/post-test designs.',
    keywords: ['power', 'paired', 'matched', 'longitudinal']
  },
  schema: z.object({
    n: z.number().int().min(2).describe("Number of Pairs"),
    diff: z.number().describe("Expected Mean Difference"),
    sdDiff: z.number().min(0.001).describe("SD of Differences"),
    alpha: z.number().min(0.001).max(0.5).default(0.05)
  }),
  examples: [{ n: 30, diff: 5, sdDiff: 12, alpha: 0.05 }],
  compute: (data) => {
    const { n, diff, sdDiff, alpha } = data;
    const se = sdDiff / Math.sqrt(n);
    const delta = Math.abs(diff);
    const zAlpha = ciUtils.getZCritical((1 - alpha) * 100);
    const zBeta = (delta / se) - zAlpha;
    const power = ciUtils.getNormalCDF(zBeta);

    const rCode = `# Power for Paired Means
library(pwr)
d_val <- ${diff} / ${sdDiff}
pwr.t.test(n = ${n}, d = d_val, sig.level = ${alpha}, type = "paired")`;

    return {
      results: [
        { label: 'Statistical Power', value: (power * 100).toFixed(2) + '%', isMain: true },
        { label: 'Effect Size (dz)', value: (delta / sdDiff).toFixed(3) },
        { label: 'Standard Error', value: se.toFixed(4) }
      ],
      interpretation: `The design provides ${(power * 100).toFixed(1)}% power for the given difference.`,
      rCode,
      formula: `Power = Φ( (Δ / (σ_d/√n)) - Z_α/2 )`
    };
  }
};
