
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';
import * as ciUtils from './confidenceIntervals/utils';

export const chiSquare: CalculatorDefinition<{ 
  exposed_cases: number, 
  unexposed_cases: number, 
  exposed_control: number, 
  unexposed_control: number, 
  yates: boolean 
}> = {
  metadata: {
    id: 'chi-square',
    title: 'Chi-Square Test (2x2)',
    category: Category.HYPOTHESIS_TESTS,
    description: 'Test for independence in a 2x2 contingency table using proper epidemiological terminology.',
    keywords: ['chi-square', 'independence', 'nominal', 'yates', 'p-value']
  },
  schema: z.object({
    exposed_cases: z.number().min(0).describe("Exposed Cases"), 
    unexposed_cases: z.number().min(0).describe("Unexposed Cases"), 
    exposed_control: z.number().min(0).describe("Exposed Control"), 
    unexposed_control: z.number().min(0).describe("Unexposed Control"),
    yates: z.boolean().default(false).describe("Apply Yates Correction?")
  }),
  examples: [{ exposed_cases: 10, unexposed_cases: 30, exposed_control: 20, unexposed_control: 40, yates: true }],
  compute: (data) => {
    const { 
      exposed_cases: a, 
      exposed_control: b, 
      unexposed_cases: c, 
      unexposed_control: d, 
      yates 
    } = data;
    const n = a + b + c + d;
    const row1 = a + b;
    const row2 = c + d;
    const col1 = a + c;
    const col2 = b + d;
    
    if (row1 === 0 || row2 === 0 || col1 === 0 || col2 === 0) {
      return { results: [], interpretation: "Table contains a row or column with zero totals." };
    }

    const numerator = Math.abs(a * d - b * c);
    const correctedNum = yates ? Math.max(0, numerator - n / 2) : numerator;
    const chi2 = (n * Math.pow(correctedNum, 2)) / (row1 * row2 * col1 * col2);
    
    const pValue = ciUtils.getChiSqPValue(chi2, 1);
    const formatP = (p: number) => p < 0.001 ? "< 0.001" : p.toFixed(4);

    const rCode = `# Chi-Square Test\ntab <- matrix(c(${a}, ${c}, ${b}, ${d}), nrow = 2)\ncolnames(tab) <- c("Cases", "Control")\nrownames(tab) <- c("Exposed", "Unexposed")\nchisq.test(tab, correct = ${yates ? "TRUE" : "FALSE"})`;

    return {
      results: [
        { label: 'Chi-Square (χ²)', value: chi2.toFixed(4), isMain: true },
        { label: 'p-value', value: formatP(pValue), isMain: true },
        { label: 'Degrees of Freedom', value: 1 },
        { label: 'Correction', value: yates ? 'Yates Correction applied' : 'None' }
      ],
      interpretation: `The Chi-square value is ${chi2.toFixed(3)} (p = ${formatP(pValue)}). ${pValue < 0.05 ? 'A statistically significant association exists.' : 'No statistically significant association was found.'}`,
      rCode,
      formula: `χ² = n(|ad-bc| - c)² / (R1*R2*C1*C2)`
    };
  }
};
