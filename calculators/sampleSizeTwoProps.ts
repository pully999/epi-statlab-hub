
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';
import * as ciUtils from './confidenceIntervals/utils';

export const sampleSizeTwoProps: CalculatorDefinition<{ 
  p1: number, 
  p2: number, 
  power: number, 
  alpha: number,
  ratio: number
}> = {
  metadata: {
    id: 'sample-size-two-props',
    title: 'Sample Size: Two Proportions',
    category: Category.SAMPLE_SIZE,
    description: 'Calculate sample size for comparing two independent proportions (e.g. Trial vs Control).',
    keywords: ['sample size', 'power', 'proportions', 'risk', 'trial']
  },
  schema: z.object({
    p1: z.number().min(0).max(1).describe("Proportion in Group 1"),
    p2: z.number().min(0).max(1).describe("Proportion in Group 2"),
    power: z.number().min(0.5).max(0.99).default(0.8),
    alpha: z.number().min(0.001).max(0.2).default(0.05),
    ratio: z.number().min(0.1).max(10).default(1).describe("Allocation Ratio (n2/n1)")
  }),
  examples: [{ p1: 0.3, p2: 0.5, power: 0.8, alpha: 0.05, ratio: 1 }],
  compute: (data) => {
    const { p1, p2, power, alpha, ratio } = data;
    const q1 = 1 - p1;
    const q2 = 1 - p2;
    const pAvg = (p1 + ratio * p2) / (1 + ratio);
    const qAvg = 1 - pAvg;
    
    const zAlpha = ciUtils.getZCritical((1 - alpha) * 100);
    const zPower = ciUtils.getZCritical((power * 2 - 1) * 100);

    const n1 = Math.ceil(
      (Math.pow(zAlpha * Math.sqrt((1 + 1/ratio) * pAvg * qAvg) + zPower * Math.sqrt(p1 * q1 + (p2 * q2) / ratio), 2)) / 
      Math.pow(p1 - p2, 2)
    );
    const n2 = Math.ceil(n1 * ratio);

    const rCode = `# Requires 'pwr' package\n# install.packages("pwr")\nlibrary(pwr)\n\n# Compute effect size h\nh_val <- ES.h(${p1}, ${p2})\n\n# Sample size calculation\npwr.2p.test(h = h_val, sig.level = ${alpha}, power = ${power})`;

    return {
      results: [
        { label: 'Group 1 Size (n1)', value: n1, isMain: true },
        { label: 'Group 2 Size (n2)', value: n2, isMain: true },
        { label: 'Total N', value: n1 + n2 },
        { label: 'Difference (p1 - p2)', value: (p1 - p2).toFixed(4) },
        { label: 'Average Proportion', value: pAvg.toFixed(4) }
      ],
      interpretation: `To detect a difference between ${p1*100}% and ${p2*100}% with ${power*100}% power, a total of ${n1+n2} subjects are required.`,
      rCode,
      formula: `n1 = [Z_α√( (1+1/k)PQ ) + Z_β√( p1q1 + p2q2/k )]² / (p1 - p2)²`
    };
  }
};
