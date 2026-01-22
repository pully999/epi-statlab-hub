
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import { computeRR, computeOR, formatPercent } from './utils';
import * as ciUtils from '../confidenceIntervals/utils';

export const riskRatioCalc: CalculatorDefinition<{ 
  exposed_cases: number, 
  unexposed_cases: number, 
  exposed_control: number, 
  unexposed_control: number 
}> = {
  metadata: {
    id: 'epi-risk-ratio',
    title: 'Risk Ratio (RR)',
    category: Category.EPIDEMIOLOGY,
    description: 'Compares the risk of an event among those exposed to those unexposed (Cohort Study).',
    keywords: ['RR', 'cohort', 'risk ratio', 'incidence']
  },
  schema: z.object({
    exposed_cases: z.number().min(0).describe("Exposed Cases"),
    unexposed_cases: z.number().min(0).describe("Unexposed Cases"),
    exposed_control: z.number().min(0).describe("Exposed Control"),
    unexposed_control: z.number().min(0).describe("Unexposed Control")
  }),
  examples: [{ exposed_cases: 45, unexposed_cases: 20, exposed_control: 55, unexposed_control: 80 }],
  compute: (data) => {
    const table = { 
      a: data.exposed_cases, 
      b: data.exposed_control, 
      c: data.unexposed_cases, 
      d: data.unexposed_control 
    };
    const res = computeRR(table);
    const rCode = `# Risk Ratio Analysis\ntab <- matrix(c(${table.a}, ${table.c}, ${table.b}, ${table.d}), nrow = 2)\ncolnames(tab) <- c("Cases", "Control")\nrownames(tab) <- c("Exposed", "Unexposed")\n\n# Using epiR\nlibrary(epiR)\nepi.2by2(tab, method = "cohort.count")`;

    return {
      results: [
        { label: 'Risk Ratio (RR)', value: res.value.toFixed(3), isMain: true },
        { label: '95% CI (Taylor Series)', value: ciUtils.formatCI(res.lower, res.upper, 3), isMain: true },
        { label: 'Risk in Exposed', value: formatPercent(table.a / (table.a + table.b)) },
        { label: 'Risk in Unexposed', value: formatPercent(table.c / (table.c + table.d)) }
      ],
      interpretation: `The risk of the outcome is ${res.value.toFixed(2)} times ${res.value > 1 ? 'higher' : 'lower'} in the exposed group compared to the unexposed group.`,
      rCode,
      formula: `RR = [Exposed Cases / Total Exposed] / [Unexposed Cases / Total Unexposed]`
    };
  }
};

export const oddsRatioCalc: CalculatorDefinition<{ 
  exposed_cases: number, 
  unexposed_cases: number, 
  exposed_control: number, 
  unexposed_control: number 
}> = {
  metadata: {
    id: 'epi-odds-ratio',
    title: 'Odds Ratio (OR)',
    category: Category.EPIDEMIOLOGY,
    description: 'Compares the odds of exposure among cases to the odds of exposure among control subjects (Case-Control Study).',
    keywords: ['OR', 'case-control', 'odds']
  },
  schema: z.object({
    exposed_cases: z.number().min(0).describe("Exposed Cases"),
    unexposed_cases: z.number().min(0).describe("Unexposed Cases"),
    exposed_control: z.number().min(0).describe("Exposed Control"),
    unexposed_control: z.number().min(0).describe("Unexposed Control")
  }),
  examples: [{ exposed_cases: 70, unexposed_cases: 40, exposed_control: 30, unexposed_control: 60 }],
  compute: (data) => {
    const table = { 
      a: data.exposed_cases, 
      b: data.exposed_control, 
      c: data.unexposed_cases, 
      d: data.unexposed_control 
    };
    const res = computeOR(table);
    const rCode = `# Odds Ratio Analysis\ntab <- matrix(c(${table.a}, ${table.c}, ${table.b}, ${table.d}), nrow = 2)\nfisher.test(tab)`;

    return {
      results: [
        { label: 'Odds Ratio (OR)', value: res.value.toFixed(3), isMain: true },
        { label: '95% CI (Woolf)', value: ciUtils.formatCI(res.lower, res.upper, 3), isMain: true },
        { label: 'Odds in Exposed', value: (table.a / table.b).toFixed(3) },
        { label: 'Odds in Unexposed', value: (table.c / table.d).toFixed(3) }
      ],
      interpretation: `The odds of exposure were ${res.value.toFixed(2)} times ${res.value > 1 ? 'greater' : 'less'} among cases than among control subjects.`,
      rCode,
      formula: `OR = (Exposed Cases * Unexposed Control) / (Exposed Control * Unexposed Cases)`
    };
  }
};
