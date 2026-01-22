
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import { computeRR, computeOR, formatPercent } from './utils';
import * as ciUtils from '../confidenceIntervals/utils';

export const riskRatioCalc: CalculatorDefinition<{ Exposed_cases: number, Unexposed_cases: number, Exposed_control: number, Unexposed_control: number }> = {
  metadata: {
    id: 'epi-risk-ratio',
    title: 'Risk Ratio (RR)',
    category: Category.EPIDEMIOLOGY,
    description: 'Compares the risk of an event among those exposed to those unexposed.',
    keywords: ['RR', 'cohort', 'risk ratio']
  },
  schema: z.object({
    a: z.number().min(0), b: z.number().min(0),
    c: z.number().min(0), d: z.number().min(0)
  }),
  examples: [{ Exposed_cases: 45, Unexposed_cases: 55, Exposed_control: 20, Unexposed_control: 80 }],
  compute: (data) => {
    const res = computeRR(data);
    const rCode = `# Create 2x2 matrix\ntab <- matrix(c(${data.a}, ${data.c}, ${data.b}, ${data.d}), nrow = 2)\n\n# install.packages("epiR")\nlibrary(epiR)\nepi.2by2(tab, method = "cohort.count", conf.level = 0.95)`;

    return {
      results: [
        { label: 'Risk Ratio (RR)', value: res.value.toFixed(3), isMain: true },
        { label: '95% CI (Log Method)', value: ciUtils.formatCI(res.lower, res.upper, 3), isMain: true },
        { label: 'Exposed Risk', value: formatPercent(data.a / (data.a + data.b)) },
        { label: 'Unexposed Risk', value: formatPercent(data.c / (data.c + data.d)) }
      ],
      interpretation: `Exposed group has ${res.value > 1 ? 'higher' : 'lower'} risk (RR=${res.value.toFixed(2)}).`,
      rCode,
      formula: `RR = [a / (a+b)] / [c / (c+d)]`
    };
  }
};

export const oddsRatioCalc: CalculatorDefinition<{ Exposed_cases: number, Unexposed_cases: number, Exposed_control: number, Unexposed_control: number }> = {
  metadata: {
    id: 'epi-odds-ratio',
    title: 'Odds Ratio (OR)',
    category: Category.EPIDEMIOLOGY,
    description: 'Compares the odds of exposure among cases to the odds of exposure among controls.',
    keywords: ['OR', 'case-control', 'odds']
  },
  schema: z.object({
    a: z.number().min(0), b: z.number().min(0),
    c: z.number().min(0), d: z.number().min(0)
  }),
  examples: [{ Exposed_cases: 70, Unexposed_cases: 30, Exposed_control: 40, Unexposed_control: 60 }],
  compute: (data) => {
    const res = computeOR(data);
    const rCode = `# Odds Ratio via Fisher Test\ntab <- matrix(c(${data.a}, ${data.c}, ${data.b}, ${data.d}), nrow = 2)\nfisher.test(tab, conf.level = 0.95)\n\n# Woolf method via 'epiR'\n# library(epiR); epi.2by2(tab, method = "case-control")`;

    return {
      results: [
        { label: 'Odds Ratio (OR)', value: res.value.toFixed(3), isMain: true },
        { label: '95% CI (Woolf)', value: ciUtils.formatCI(res.lower, res.upper, 3), isMain: true },
        { label: 'Exposed Odds', value: (data.a / data.b).toFixed(3) },
        { label: 'Unexposed Odds', value: (data.c / data.d).toFixed(3) }
      ],
      interpretation: `The odds ratio is ${res.value.toFixed(3)}.`,
      rCode,
      formula: `OR = (a * d) / (b * c)`
    };
  }
};
