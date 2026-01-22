
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';

export const screeningImpact: CalculatorDefinition<{ r_exposed: number, r_control: number }> = {
  metadata: {
    id: 'screening-impact',
    title: 'Clinical Impact (NNT/NNH)',
    category: Category.EPIDEMIOLOGY,
    description: 'Calculate Absolute Risk Reduction (ARR), NNT, and NNH to evaluate clinical utility.',
    keywords: ['NNT', 'NNH', 'ARR', 'Impact', 'Public Health']
  },
  schema: z.object({
    r_exposed: z.number().min(0).max(1).describe("Incidence in Treated/Exposed"),
    r_control: z.number().min(0).max(1).describe("Incidence in Control/Unexposed")
  }),
  examples: [{ r_exposed: 0.05, r_control: 0.12 }],
  compute: (data) => {
    const { r_exposed, r_control } = data;
    const arr = Math.abs(r_control - r_exposed);
    const nnt = arr === 0 ? Infinity : 1 / arr;
    const rrr = Math.abs(r_control - r_exposed) / r_control;

    const rCode = `# Clinical Impact Measures
r_exp <- ${r_exposed}
r_con <- ${r_control}

arr <- abs(r_con - r_exp)
rrr <- arr / r_con
nnt <- ceiling(1 / arr)

cat("ARR:", arr, "\\nNNT:", nnt, "\\nRRR:", rrr)`;

    return {
      results: [
        { label: 'Absolute Risk Reduction (ARR)', value: (arr * 100).toFixed(2) + '%', isMain: true },
        { label: 'Number Needed to Treat (NNT)', value: Math.ceil(nnt), isMain: true },
        { label: 'Relative Risk Reduction (RRR)', value: (rrr * 100).toFixed(2) + '%' },
        { label: 'Number Needed to Harm (NNH)', value: r_exposed > r_control ? Math.ceil(1 / (r_exposed - r_control)) : 'N/A' }
      ],
      interpretation: arr > 0 
        ? `You would need to treat ${Math.ceil(nnt)} patients to prevent one additional adverse outcome.`
        : "No difference in risk detected.",
      rCode,
      formula: `ARR = |R_control - R_exposed|\nNNT = 1 / ARR`
    };
  }
};
