
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import { formatPercent, safeDivide } from './utils';

export const incidenceProportion: CalculatorDefinition<{ cases: number, population: number }> = {
  metadata: {
    id: 'epi-incidence-prop',
    title: 'Incidence Proportion (Risk)',
    category: Category.EPIDEMIOLOGY,
    description: 'The proportion of a population that develops a disease during a specific time period.',
    keywords: ['risk', 'cumulative incidence', 'proportion']
  },
  schema: z.object({
    cases: z.number().min(0),
    population: z.number().min(1)
  }),
  examples: [{ cases: 50, population: 1000 }],
  compute: (data) => {
    const risk = safeDivide(data.cases, data.population);
    const rCode = `# Risk / Cumulative Incidence\ncases <- ${data.cases}\npop <- ${data.population}\nrisk <- cases / pop\n\n# Confidence Interval for Proportion\nprop.test(cases, pop, conf.level = 0.95)`;

    return {
      results: [
        { label: 'Risk / Incidence Proportion', value: risk.toFixed(4), isMain: true },
        { label: 'As Percentage', value: formatPercent(risk) },
        { label: 'Per 1,000 People', value: (risk * 1000).toFixed(2) }
      ],
      interpretation: `Risk is ${formatPercent(risk)}.`,
      rCode,
      formula: `Risk = New Cases / Population at Risk`
    };
  }
};

export const incidenceRate: CalculatorDefinition<{ cases: number, personTime: number }> = {
  metadata: {
    id: 'epi-incidence-rate',
    title: 'Incidence Rate (Density)',
    category: Category.EPIDEMIOLOGY,
    description: 'Frequency with which a disease occurs in a population, using person-time in the denominator.',
    keywords: ['rate', 'density', 'person-time']
  },
  schema: z.object({
    cases: z.number().min(0),
    personTime: z.number().min(0.0001)
  }),
  examples: [{ cases: 10, personTime: 500 }],
  compute: (data) => {
    const rate = safeDivide(data.cases, data.personTime);
    const rCode = `# Incidence Rate / Density\ncases <- ${data.cases}\npt <- ${data.personTime}\nrate <- cases / pt\n\n# Poisson exact test for rate CI\npoisson.test(cases, pt, conf.level = 0.95)`;

    return {
      results: [
        { label: 'Incidence Rate', value: rate.toFixed(6), isMain: true },
        { label: 'Per 100 Person-Years', value: (rate * 100).toFixed(4) }
      ],
      interpretation: `The incidence density is ${rate.toFixed(4)} per unit person-time.`,
      rCode,
      formula: `Rate = Cases / Person-Time`
    };
  }
};

export const cfrCalculator: CalculatorDefinition<{ deaths: number, cases: number }> = {
  metadata: {
    id: 'epi-cfr',
    title: 'Case Fatality Rate (CFR)',
    category: Category.EPIDEMIOLOGY,
    description: 'Proportion of people with a specified condition who die from that condition.',
    keywords: ['cfr', 'fatality', 'mortality']
  },
  schema: z.object({
    deaths: z.number().min(0),
    cases: z.number().min(1)
  }),
  examples: [{ deaths: 15, cases: 300 }],
  compute: (data) => {
    const cfr = safeDivide(data.deaths, data.cases);
    const rCode = `# Case Fatality Rate\ndeaths <- ${data.deaths}\ncases <- ${data.cases}\ncfr <- deaths / cases\n\n# CI for binomial proportion\nprop.test(deaths, cases, conf.level = 0.95)`;

    return {
      results: [
        { label: 'Case Fatality Rate', value: formatPercent(cfr), isMain: true },
        { label: 'Point Estimate', value: cfr.toFixed(4) }
      ],
      interpretation: `Fatality rate is ${formatPercent(cfr)}.`,
      rCode,
      formula: `CFR = Deaths / Total Cases`
    };
  }
};
