
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as ciUtils from '../confidenceIntervals/utils';

export const powerNonInf: CalculatorDefinition<{ 
  nPerGroup: number, 
  pStandard: number, 
  pTest: number, 
  margin: number, 
  alpha: number 
}> = {
  metadata: {
    id: 'power-noninf',
    title: 'Power: Non-Inferiority (Props)',
    category: Category.SAMPLE_SIZE,
    description: 'Calculate power to prove a test treatment is not inferior to a standard treatment.',
    keywords: ['power', 'non-inferiority', 'clinical trials']
  },
  schema: z.object({
    nPerGroup: z.number().int().min(2).describe("N per Arm"),
    pStandard: z.number().min(0.01).max(0.99).describe("Standard Success Rate"),
    pTest: z.number().min(0.01).max(0.99).describe("Test Success Rate"),
    margin: z.number().min(0.001).max(0.3).describe("NI Margin (δ)"),
    alpha: z.number().min(0.001).max(0.2).default(0.025).describe("One-sided Alpha")
  }),
  examples: [{ nPerGroup: 150, pStandard: 0.8, pTest: 0.8, margin: 0.1, alpha: 0.025 }],
  compute: (data) => {
    const { nPerGroup, pStandard, pTest, margin, alpha } = data;
    const zAlpha = ciUtils.getZCritical((1 - alpha * 2) * 100);
    const se = Math.sqrt((pStandard * (1 - pStandard) + pTest * (1 - pTest)) / nPerGroup);
    const zBeta = (pTest - pStandard + margin) / se - zAlpha;
    const power = ciUtils.getNormalCDF(zBeta);

    const rCode = `# Power for Non-Inferiority Proportion
# install.packages("TrialSize")
library(TrialSize)

TwoSampleProportion.NonInferiority(
  alpha = ${alpha}, 
  n = ${nPerGroup}, 
  p1 = ${pStandard}, 
  p2 = ${pTest}, 
  delta = ${margin}
) # Note: returns power required or solves for N`;

    return {
      results: [
        { label: 'Statistical Power', value: (power * 100).toFixed(2) + '%', isMain: true },
        { label: 'Standard Error', value: se.toFixed(4) },
        { label: 'Z-Alpha (One-sided)', value: zAlpha.toFixed(3) }
      ],
      interpretation: `With ${nPerGroup} subjects per group, power is ${(power * 100).toFixed(1)}% to show non-inferiority within ${margin*100}%.`,
      rCode,
      formula: `Z_β = (pT - pS + δ) / SE - Z_α`
    };
  }
};
