
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as ciUtils from '../confidenceIntervals/utils';

export const standardizedRates: CalculatorDefinition<{ observed: number, expected: number }> = {
  metadata: {
    id: 'standardized-rates',
    title: 'Standardized Ratios (SMR/SIR)',
    category: Category.EPIDEMIOLOGY,
    description: 'Compare observed events in a population to expected events based on standard rates.',
    keywords: ['SMR', 'SIR', 'standardization', 'mortality', 'incidence']
  },
  schema: z.object({
    observed: z.number().int().min(0).describe("Observed Events"),
    expected: z.number().min(0.0001).describe("Expected Events")
  }),
  examples: [{ observed: 45, expected: 32.5 }],
  compute: (data) => {
    const { observed, expected } = data;
    const ratio = observed / expected;
    const zCrit = 1.96;
    const lower = observed === 0 ? 0 : (observed * Math.pow(1 - 1/(9*observed) - zCrit/(3*Math.sqrt(observed)), 3)) / expected;
    const upper = ((observed+1) * Math.pow(1 - 1/(9*(observed+1)) + zCrit/(3*Math.sqrt(observed+1)), 3)) / expected;

    const rCode = `# SMR / SIR Analysis\nobs <- ${observed}\nexp <- ${expected}\n\n# Standardized Ratio\nsmr <- obs / exp\n\n# Poisson exact test for SMR\npoisson.test(obs, exp, conf.level = 0.95)`;

    return {
      results: [
        { label: 'Standardized Ratio', value: ratio.toFixed(3), isMain: true },
        { label: '95% CI (Byar)', value: ciUtils.formatCI(lower, upper, 3), isMain: true },
        { label: 'Excess Percentage', value: ((ratio - 1) * 100).toFixed(1) + '%' },
        { label: 'Observed / Expected', value: `${observed} / ${expected.toFixed(2)}` }
      ],
      interpretation: ratio > 1 
        ? `There are ${(ratio * 100 - 100).toFixed(1)}% more events than expected. ${lower > 1 ? 'This is statistically significant.' : 'This could be due to chance.'}`
        : `There are ${(100 - ratio * 100).toFixed(1)}% fewer events than expected.`,
      rCode,
      formula: `SMR = Observed / Expected\nCI based on Byar's Poisson approximation.`
    };
  },
  references: [
    {
      author: "Byar DP",
      year: 1985,
      title: "Standardized Rates",
      source: "In: Encyclopedia of Statistical Sciences (Kotz & Johnson)",
      doi: "N/A"
    },
    {
      author: "Rothman KJ, Boice JD Jr",
      year: 1979,
      title: "Epidemiologic Analysis with a Programmable Calculator",
      source: "NIH Publication No. 79-1649",
      doi: "N/A"
    }
  ]
};
