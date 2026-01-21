
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import { computeRD, formatPercent } from './utils';

export const riskDiffCalc: CalculatorDefinition<{ a: number, b: number, c: number, d: number }> = {
  metadata: {
    id: 'epi-risk-diff',
    title: 'Risk Difference & NNT',
    category: Category.EPIDEMIOLOGY,
    description: 'Absolute measure of the difference in risk between exposed and unexposed groups.',
    keywords: ['RD', 'NNT', 'absolute risk', 'impact']
  },
  schema: z.object({
    a: z.number().min(0), b: z.number().min(0),
    c: z.number().min(0), d: z.number().min(0)
  }),
  examples: [{ a: 10, b: 90, c: 50, d: 50 }],
  compute: (data) => {
    const res = computeRD(data);
    const rCode = `# Risk Difference & NNT Analysis\ntab <- matrix(c(${data.a}, ${data.c}, ${data.b}, ${data.d}), nrow = 2)\n\n# install.packages("epiR")\nlibrary(epiR)\nepi.2by2(tab, method = "cohort.count")`;

    return {
      results: [
        { label: 'Risk Difference (RD)', value: res.value.toFixed(4), isMain: true },
        { label: 'RD Percentage', value: formatPercent(res.value) },
        { label: 'NNT / NNH', value: isFinite(res.nnt) ? res.nnt : 'N/A', isMain: true, description: res.value < 0 ? 'Number Needed to Treat' : 'Number Needed to Harm' }
      ],
      interpretation: `The absolute risk difference is ${formatPercent(res.value)}. You would need to treat/expose ${res.nnt} people to see 1 additional outcome.`,
      rCode,
      formula: `RD = R1 - R2 \nNNT = 1 / |RD|`
    };
  }
};

export const vaccineEffectiveness: CalculatorDefinition<{ r_vac: number, r_unvac: number }> = {
  metadata: {
    id: 'epi-ve',
    title: 'Vaccine Effectiveness (VE)',
    category: Category.EPIDEMIOLOGY,
    description: 'Proportionate reduction in cases among vaccinated persons.',
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
    const rCode = `# Vaccine Effectiveness (VE)\nr_vac <- ${data.r_vac}\nr_unvac <- ${data.r_unvac}\n\nrr <- r_vac / r_unvac\nve <- 1 - rr\nprint(paste("Vaccine Effectiveness:", round(ve * 100, 2), "%"))`;

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
