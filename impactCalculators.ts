
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import { computeRD, formatPercent } from './utils';

export const riskDiffCalc: CalculatorDefinition<{ 
  exposed_cases: number, 
  unexposed_cases: number, 
  exposed_control: number, 
  unexposed_control: number 
}> = {
  metadata: {
    id: 'epi-risk-diff',
    title: 'Risk Difference & NNT',
    category: Category.EPIDEMIOLOGY,
    description: 'Absolute difference in risk between exposed and unexposed groups.',
    keywords: ['RD', 'NNT', 'absolute risk', 'impact']
  },
  schema: z.object({
    exposed_cases: z.number().min(0).describe("Exposed Cases"),
    unexposed_cases: z.number().min(0).describe("Unexposed Cases"),
    exposed_control: z.number().min(0).describe("Exposed Control"),
    unexposed_control: z.number().min(0).describe("Unexposed Control")
  }),
  examples: [{ exposed_cases: 10, unexposed_cases: 50, exposed_control: 90, unexposed_control: 50 }],
  compute: (data) => {
    const table = { 
      a: data.exposed_cases, 
      b: data.exposed_control, 
      c: data.unexposed_cases, 
      d: data.unexposed_control 
    };
    const res = computeRD(table);
    const rCode = `# Risk Difference & NNT\ntab <- matrix(c(${table.a}, ${table.c}, ${table.b}, ${table.d}), nrow = 2)\nlibrary(epiR)\nepi.2by2(tab, method = "cohort.count")`;

    return {
      results: [
        { label: 'Risk Difference (RD)', value: res.value.toFixed(4), isMain: true },
        { label: 'RD Percentage', value: formatPercent(res.value) },
        { label: res.value < 0 ? 'Number Needed to Treat (NNT)' : 'Number Needed to Harm (NNH)', value: isFinite(res.nnt) ? res.nnt : 'N/A', isMain: true }
      ],
      interpretation: `The absolute risk difference is ${formatPercent(res.value)}. To see one additional outcome, you need to study ${res.nnt} people.`,
      rCode,
      formula: `RD = [Exposed Cases / Total Exposed] - [Unexposed Cases / Total Unexposed]\nNNT = 1 / |RD|`
    };
  }
};

export const vaccineEffectiveness: CalculatorDefinition<{ r_vac: number, r_unvac: number }> = {
  metadata: {
    id: 'epi-ve',
    title: 'Vaccine Effectiveness (VE)',
    category: Category.EPIDEMIOLOGY,
    description: 'Proportionate reduction in disease incidence among vaccinated persons.',
    keywords: ['VE', 'vaccine', 'efficacy']
  },
  schema: z.object({
    r_vac: z.number().min(0).max(1).describe("Incidence in Vaccinated"),
    r_unvac: z.number().min(0.0001).max(1).describe("Incidence in Unvaccinated")
  }),
  examples: [{ r_vac: 0.02, r_unvac: 0.15 }],
  compute: (data) => {
    const rr = data.r_vac / data.r_unvac;
    const ve = (1 - rr);
    const rCode = `# Vaccine Effectiveness (VE)\nrr <- ${data.r_vac} / ${data.r_unvac}\nve <- 1 - rr\ncat("VE:", ve * 100, "%")`;

    return {
      results: [
        { label: 'Vaccine Effectiveness', value: formatPercent(ve), isMain: true },
        { label: 'Relative Risk (RR)', value: rr.toFixed(3) }
      ],
      interpretation: `The vaccine reduces the risk of disease by ${formatPercent(ve)} compared to the unvaccinated group.`,
      rCode,
      formula: `VE = (1 - RR) * 100%`
    };
  }
};
