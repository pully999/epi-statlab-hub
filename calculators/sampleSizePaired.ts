
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';
import * as ciUtils from './confidenceIntervals/utils';

export const sampleSizePaired: CalculatorDefinition<{ 
  diff: number, 
  sdDiff: number, 
  power: number, 
  alpha: number 
}> = {
  metadata: {
    id: 'sample-size-paired',
    title: 'Sample Size: Paired Means',
    category: Category.SAMPLE_SIZE,
    description: 'Calculate N for paired samples (pre-test/post-test) based on the expected mean difference.',
    keywords: ['paired t-test', 'pre-post', 'matched pairs', 'sample size']
  },
  schema: z.object({
    diff: z.number().describe("Expected Mean Difference"),
    sdDiff: z.number().min(0.0001, "SD of differences must be positive"),
    power: z.number().min(0.5).max(0.99).default(0.8),
    alpha: z.number().min(0.001).max(0.2).default(0.05)
  }),
  examples: [{ diff: 5, sdDiff: 15, power: 0.8, alpha: 0.05 }],
  compute: (data) => {
    const { diff, sdDiff, power, alpha } = data;
    const zAlpha = ciUtils.getZCritical((1 - alpha) * 100);
    const zPower = ciUtils.getZCritical((power * 2 - 1) * 100);
    
    const n = Math.ceil(Math.pow(sdDiff * (zAlpha + zPower) / diff, 2));

    const rCode = `# Requires 'pwr' package\nlibrary(pwr)\n\n# Cohen's d for paired samples\nd_val <- ${diff} / ${sdDiff}\n\n# Power analysis\npwr.t.test(d = d_val, sig.level = ${alpha}, power = ${power}, type = "paired")`;

    return {
      results: [
        { label: 'Required Pairs (n)', value: n, isMain: true },
        { label: 'Total Observations', value: n * 2 },
        { label: 'Standardized Effect Size (dz)', value: (diff / sdDiff).toFixed(3) }
      ],
      interpretation: `To detect a mean difference of ${diff} with ${power*100}% power, you need to study ${n} pairs (individuals measured twice).`,
      rCode,
      formula: `n = [σ_diff * (Z_α/2 + Z_β) / Δ]²`
    };
  }
};
