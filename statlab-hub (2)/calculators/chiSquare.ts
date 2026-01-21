
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';
import * as ciUtils from './confidenceIntervals/utils';

export const chiSquare: CalculatorDefinition<{ a: number, b: number, c: number, d: number, yates: boolean }> = {
  metadata: {
    id: 'chi-square',
    title: 'Chi-Square Test (2x2)',
    category: Category.HYPOTHESIS_TESTS,
    description: 'Test for independence in a 2x2 contingency table with calculated p-value and Yates correction.',
    keywords: ['chi-square', 'independence', 'nominal', 'yates', 'p-value']
  },
  schema: z.object({
    a: z.number().min(0), 
    b: z.number().min(0), 
    c: z.number().min(0), 
    d: z.number().min(0),
    yates: z.boolean().default(false)
  }),
  examples: [{ a: 10, b: 20, c: 30, d: 40, yates: true }],
  compute: (data) => {
    const { a, b, c, d, yates } = data;
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

    const rCode = `# Create matrix table\ntab <- matrix(c(${a}, ${c}, ${b}, ${d}), nrow = 2)\ncolnames(tab) <- c("Exposure+", "Exposure-")\nrownames(tab) <- c("Outcome+", "Outcome-")\n\n# Chi-Square Test\nchisq.test(tab, correct = ${yates ? "TRUE" : "FALSE"})\n\n# Fisher's Exact Test (Recommended for small cells)\nfisher.test(tab)`;

    return {
      results: [
        { label: 'Chi-Square (χ²)', value: chi2.toFixed(4), isMain: true },
        { label: 'p-value', value: formatP(pValue), isMain: true },
        { label: 'Degrees of Freedom', value: 1 },
        { label: 'Yates Correction', value: yates ? 'Applied' : 'Not Applied' }
      ],
      interpretation: `The Chi-square value is ${chi2.toFixed(3)} (p = ${formatP(pValue)}).`,
      rCode,
      formula: `χ² = n(|ad-bc| - c)² / (R1*R2*C1*C2)`
    };
  }
};
