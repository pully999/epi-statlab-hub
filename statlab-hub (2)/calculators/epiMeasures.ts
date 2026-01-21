
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';

export const epiMeasures: CalculatorDefinition<{ a: number, b: number, c: number, d: number }> = {
  metadata: {
    id: 'epi-measures',
    title: 'Relative Risk & Odds Ratio',
    category: Category.EPIDEMIOLOGY,
    description: 'Calculate risk and odds measures from a 2x2 contingency table.',
    keywords: ['RR', 'OR', 'Risk', 'Epidemiology', '2x2']
  },
  schema: z.object({
    a: z.number().min(0),
    b: z.number().min(0),
    c: z.number().min(0),
    d: z.number().min(0)
  }),
  examples: [{ a: 20, b: 80, c: 10, d: 90 }],
  compute: (data) => {
    const { a, b, c, d } = data;
    const n1 = a + b, n2 = c + d;
    const r1 = a / n1, r2 = c / n2;
    const rr = r1 / r2, or = (a * d) / (b * c);

    const rCode = `# Create 2x2 table matrix\ntab <- matrix(c(${a}, ${c}, ${b}, ${d}), nrow = 2)\ndimnames(tab) <- list(Disease = c("Yes", "No"), Exposure = c("Yes", "No"))\n\n# Association Tests\nchisq.test(tab)\nfisher.test(tab)\n\n# For Relative Risk and Odds Ratio (Requires 'epiR' package)\n# install.packages("epiR")\nlibrary(epiR)\nepi.2by2(tab, method = "cohort.count")`;

    return {
      results: [
        { label: 'Relative Risk (RR)', value: rr.toFixed(3), isMain: true },
        { label: 'Odds Ratio (OR)', value: or.toFixed(3), isMain: true }
      ],
      interpretation: `RR is ${rr.toFixed(2)}, OR is ${or.toFixed(2)}.`,
      rCode,
      formula: `RR = [a/(a+b)] / [c/(c+d)]\nOR = (a*d) / (b*c)`
    };
  }
};
