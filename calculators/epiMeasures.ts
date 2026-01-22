
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';

export const epiMeasures: CalculatorDefinition<{ 
  exposed_cases: number, 
  unexposed_cases: number, 
  exposed_control: number, 
  unexposed_control: number 
}> = {
  metadata: {
    id: 'epi-measures',
    title: 'Relative Risk & Odds Ratio',
    category: Category.EPIDEMIOLOGY,
    description: 'Calculate basic risk and odds measures from a 2x2 contingency table.',
    keywords: ['RR', 'OR', 'Risk', 'Epidemiology', '2x2']
  },
  schema: z.object({
    exposed_cases: z.number().min(0).describe("Exposed Cases"),
    unexposed_cases: z.number().min(0).describe("Unexposed Cases"),
    exposed_control: z.number().min(0).describe("Exposed Control"),
    unexposed_control: z.number().min(0).describe("Unexposed Control")
  }),
  examples: [{ exposed_cases: 20, unexposed_cases: 10, exposed_control: 80, unexposed_control: 90 }],
  compute: (data) => {
    const { 
      exposed_cases: a, 
      exposed_control: b, 
      unexposed_cases: c, 
      unexposed_control: d 
    } = data;
    const n1 = a + b, n2 = c + d;
    const r1 = a / n1, r2 = c / n2;
    const rr = r1 / r2, or = (a * d) / (b * c);

    const rCode = `# Association Analysis\ntab <- matrix(c(${a}, ${c}, ${b}, ${d}), nrow = 2)\ndimnames(tab) <- list(Exposure = c("Yes", "No"), Status = c("Case", "Control"))\n\n# Using epiR\nlibrary(epiR)\nepi.2by2(tab, method = "cohort.count")`;

    return {
      results: [
        { label: 'Relative Risk (RR)', value: rr.toFixed(3), isMain: true },
        { label: 'Odds Ratio (OR)', value: or.toFixed(3), isMain: true }
      ],
      interpretation: `RR is ${rr.toFixed(2)}, OR is ${or.toFixed(2)}. This suggests a ${rr > 1 ? 'positive' : 'negative'} association between exposure and outcome.`,
      rCode,
      formula: `RR = [a/(a+b)] / [c/(c+d)]\nOR = (a*d) / (b*c)`
    };
  }
};
