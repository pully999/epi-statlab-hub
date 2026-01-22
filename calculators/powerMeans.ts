
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';
import * as ciUtils from './confidenceIntervals/utils';

export const powerMeans: CalculatorDefinition<{ 
  n1: number, 
  n2: number, 
  m1: number, 
  m2: number, 
  sd: number, 
  alpha: number 
}> = {
  metadata: {
    id: 'power-means',
    title: 'Power: Two Independent Means',
    category: Category.SAMPLE_SIZE,
    description: 'Calculate the statistical power of a study comparing two means with fixed sample sizes.',
    keywords: ['power', 'beta', 'means', 't-test', 'post-hoc']
  },
  schema: z.object({
    n1: z.number().int().min(2).describe("Sample Size Group 1"),
    n2: z.number().int().min(2).describe("Sample Size Group 2"),
    m1: z.number().describe("Expected Mean Group 1"),
    m2: z.number().describe("Expected Mean Group 2"),
    sd: z.number().min(0.0001).describe("Expected Pooled SD"),
    alpha: z.number().min(0.001).max(0.5).default(0.05).describe("Type I Error Rate (α)")
  }),
  examples: [
    { n1: 50, n2: 50, m1: 100, m2: 110, sd: 20, alpha: 0.05 }
  ],
  compute: (data) => {
    const { n1, n2, m1, m2, sd, alpha } = data;
    const diff = Math.abs(m1 - m2);
    
    // Z-critical for alpha (two-sided)
    const zAlpha = ciUtils.getZCritical((1 - alpha) * 100);
    
    // Standard error of the difference
    const se = sd * Math.sqrt(1/n1 + 1/n2);
    
    // Non-centrality parameter (z-score of the difference)
    const lambda = diff / se;
    
    // Power = P(Z > zAlpha - lambda) + P(Z < -zAlpha - lambda)
    // Usually only the first term matters
    const power = ciUtils.getNormalCDF(lambda - zAlpha) + ciUtils.getNormalCDF(-lambda - zAlpha);

    const rCode = `# Requires 'pwr' package\nlibrary(pwr)\n\n# Cohen's d\nd_val <- ${diff} / ${sd}\n\n# Post-hoc Power\npwr.t2n.test(n1 = ${n1}, n2 = ${n2}, d = d_val, sig.level = ${alpha}, alternative = "two.sided")`;

    return {
      results: [
        { label: 'Statistical Power (1 - β)', value: (power * 100).toFixed(2) + '%', isMain: true },
        { label: 'Type II Error (β)', value: ((1 - power) * 100).toFixed(2) + '%' },
        { label: 'Effect Size (Cohen\'s d)', value: (diff / sd).toFixed(3) },
        { label: 'Critical Z (α/2)', value: zAlpha.toFixed(3) },
        { label: 'Standard Error', value: se.toFixed(4) }
      ],
      interpretation: `With the current design, you have a ${(power * 100).toFixed(1)}% chance of detecting a difference of ${diff} if it truly exists. ${power < 0.8 ? 'This study may be underpowered (standard target is 80%).' : 'The power is adequate.'}`,
      rCode,
      formula: `Power = Φ( (Δ / SE) - Z_α/2 ) + Φ( -(Δ / SE) - Z_α/2 )`
    };
  }
};
