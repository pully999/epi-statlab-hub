
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';

export const sampleSizeProp: CalculatorDefinition<{ p: number, d: number, conf: number }> = {
  metadata: {
    id: 'sample-size-prop',
    title: 'Sample Size for a Proportion',
    category: Category.SAMPLE_SIZE,
    description: 'Determine the required sample size for estimating a population proportion with a specific margin of error.',
    keywords: ['sample size', 'proportion', 'power']
  },
  schema: z.object({
    p: z.number().min(0).max(1, "Proportion must be between 0 and 1"),
    d: z.number().min(0.001).max(0.5, "Margin of error must be small (e.g., 0.05)"),
    conf: z.number().min(80).max(99.9, "Confidence level usually 90-99%")
  }),
  examples: [
    { p: 0.5, d: 0.05, conf: 95 }
  ],
  references: [
    {
      author: "Cochran WG",
      year: 1977,
      title: "Sampling Techniques",
      source: "John Wiley & Sons, 3rd Edition",
      doi: "N/A"
    }
  ],
  compute: (data) => {
    const { p, d, conf } = data;
    const zMap: Record<number, number> = { 90: 1.645, 95: 1.96, 99: 2.576 };
    const zVal = zMap[conf] || 1.96;
    const n = Math.ceil((Math.pow(zVal, 2) * p * (1 - p)) / Math.pow(d, 2));

    const rCode = `# Sample size for a proportion\np_val <- ${p}\nd_val <- ${d}\nconf_level <- ${conf/100}\n\nz_crit <- qnorm(1 - (1 - conf_level)/2)\nn_req <- ceiling((z_crit^2 * p_val * (1 - p_val)) / d_val^2)\nprint(paste("Required Sample Size:", n_req))`;

    return {
      results: [
        { label: 'Estimated Proportion (p)', value: p },
        { label: 'Margin of Error (d)', value: d },
        { label: 'Confidence Level', value: conf + '%' },
        { label: 'Required Sample Size (n)', value: n, isMain: true }
      ],
      interpretation: `At ${conf}% confidence, you need at least ${n} participants.`,
      rCode,
      formula: `n = (Z² * p * (1-p)) / d²`
    };
  }
};
