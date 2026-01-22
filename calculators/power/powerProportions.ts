
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as ciUtils from '../confidenceIntervals/utils';

export const powerProportions: CalculatorDefinition<{ 
  n1: number, 
  n2: number, 
  p1: number, 
  p2: number, 
  alpha: number 
}> = {
  metadata: {
    id: 'power-proportions',
    title: 'Power: Two Proportions',
    category: Category.SAMPLE_SIZE,
    description: 'Calculate statistical power for comparing two independent proportions (e.g., success rates in Trial vs. Control).',
    keywords: ['power', 'proportions', 'binary', 'chi-square', 'z-test']
  },
  schema: z.object({
    n1: z.number().int().min(2).describe("Sample Size Group 1"),
    n2: z.number().int().min(2).describe("Sample Size Group 2"),
    p1: z.number().min(0).max(1).describe("Proportion Group 1"),
    p2: z.number().min(0).max(1).describe("Proportion Group 2"),
    alpha: z.number().min(0.001).max(0.5).default(0.05).describe("Alpha (α)")
  }),
  examples: [{ n1: 100, n2: 100, p1: 0.20, p2: 0.35, alpha: 0.05 }],
  compute: (data) => {
    const { n1, n2, p1, p2, alpha } = data;
    const q1 = 1 - p1, q2 = 1 - p2;
    const pAvg = (n1 * p1 + n2 * p2) / (n1 + n2);
    const qAvg = 1 - pAvg;
    
    const zAlpha = ciUtils.getZCritical((1 - alpha) * 100);
    const se0 = Math.sqrt(pAvg * qAvg * (1/n1 + 1/n2));
    const seA = Math.sqrt(p1 * q1 / n1 + p2 * q2 / n2);
    
    const diff = Math.abs(p1 - p2);
    const zBeta = (diff - zAlpha * se0) / seA;
    const power = ciUtils.getNormalCDF(zBeta);

    const rCode = `# Power for Two Proportions
# Method 1: pwr package
# install.packages("pwr")
library(pwr)
h <- ES.h(${p1}, ${p2})
pwr.2p2n.test(h = h, n1 = ${n1}, n2 = ${n2}, sig.level = ${alpha})

# Method 2: Base R approximation
power.prop.test(n = ${Math.min(n1, n2)}, p1 = ${p1}, p2 = ${p2}, sig.level = ${alpha})`;

    return {
      results: [
        { label: 'Statistical Power', value: (power * 100).toFixed(2) + '%', isMain: true },
        { label: 'Type II Error (β)', value: ((1 - power) * 100).toFixed(2) + '%' },
        { label: 'Risk Difference', value: diff.toFixed(4) },
        { label: 'Pooled Proportion', value: pAvg.toFixed(4) }
      ],
      interpretation: `A study with these parameters has a ${(power * 100).toFixed(1)}% chance of detecting the ${diff.toFixed(2)} difference.`,
      rCode,
      formula: `Z_β = (|p1-p2| - Z_α/2 * SE_null) / SE_alt`
    };
  }
};
