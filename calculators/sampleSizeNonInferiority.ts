
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';
import * as ciUtils from './confidenceIntervals/utils';

export const sampleSizeNonInferiority: CalculatorDefinition<{ 
  pStandard: number, 
  pTest: number, 
  margin: number,
  power: number, 
  alpha: number 
}> = {
  metadata: {
    id: 'sample-size-noninf',
    title: 'Sample Size: Non-Inferiority (Props)',
    category: Category.SAMPLE_SIZE,
    description: 'Determine N to prove a new treatment is not worse than a standard by a specific margin.',
    keywords: ['non-inferiority', 'clinical trial', 'pharma', 'margin']
  },
  schema: z.object({
    pStandard: z.number().min(0.01).max(0.99).describe("Success rate of Standard Treatment"),
    pTest: z.number().min(0.01).max(0.99).describe("Success rate of Test Treatment"),
    margin: z.number().min(0.001).max(0.2).describe("Non-inferiority Margin (δ)"),
    power: z.number().min(0.5).max(0.99).default(0.8),
    alpha: z.number().min(0.001).max(0.2).default(0.025).describe("One-sided Alpha (typically 0.025)")
  }),
  examples: [{ pStandard: 0.85, pTest: 0.85, margin: 0.10, power: 0.8, alpha: 0.025 }],
  compute: (data) => {
    const { pStandard, pTest, margin, power, alpha } = data;
    const zAlpha = ciUtils.getZCritical((1 - alpha * 2) * 100); 
    
    const calculateN = (targetPower: number) => {
      const zPower = ciUtils.getZCritical((targetPower * 2 - 1) * 100);
      const numerator = Math.pow(zAlpha + zPower, 2) * (pStandard * (1 - pStandard) + pTest * (1 - pTest));
      const denominator = Math.pow(pTest - pStandard - margin, 2);
      const nPerArm = Math.ceil(numerator / denominator);
      return { n: nPerArm, nTotal: nPerArm * 2 };
    };

    const mainN = calculateN(power);
    const n = mainN.n;

    const spectrumPowers = [0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 0.99];
    const powerSpectrum = spectrumPowers.map(p => ({
      power: p * 100,
      ...calculateN(p)
    }));

    const rCode = `# Non-Inferiority Sample Size
# Requires TrialSize or TrialDesign packages
# install.packages("TrialSize")
library(TrialSize)

TwoSampleProportion.NonInferiority(
  alpha = ${alpha}, 
  beta = ${1 - power}, 
  p1 = ${pStandard}, 
  p2 = ${pTest}, 
  delta = ${margin}
)`;

    return {
      results: [
        { label: 'Required per Group (n)', value: n, isMain: true },
        { label: 'Total Sample Size', value: n * 2 },
        { label: 'Z-Alpha (One-sided)', value: zAlpha.toFixed(3) }
      ],
      interpretation: `To demonstrate non-inferiority within a ${margin*100}% margin, you need ${n} subjects per arm.`,
      rCode,
      formula: `n = [(Z_α + Z_β)² * (p1q1 + p2q2)] / (p1 - p2 - δ)²`,
      powerSpectrum
    };
  }
};
