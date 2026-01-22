
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';

export const binarySummary: CalculatorDefinition<{ text: string, successValue: string }> = {
  metadata: {
    id: 'binary-summary',
    title: 'Binary Summary',
    category: Category.DESCRIPTIVE,
    description: 'Calculate proportions, odds, and percentages for binary (Yes/No, 0/1) data.',
    keywords: ['binary', 'proportion', 'odds', 'bernoulli']
  },
  schema: z.object({
    text: z.string().min(1, "Input data required"),
    successValue: z.string().min(1, "Define what counts as success (e.g., '1' or 'Yes')")
  }),
  examples: [
    { text: 'Yes, No, Yes, Yes, No', successValue: 'Yes' },
    { text: '1, 0, 1, 1, 1, 0', successValue: '1' }
  ],
  compute: (data) => {
    const items = data.text.split(/[,\n\s]+/).map(i => i.trim()).filter(i => i !== "");
    const n = items.length;
    if (n === 0) return { results: [], interpretation: "No data found." };

    const successCount = items.filter(i => i.toLowerCase() === data.successValue.toLowerCase()).length;
    const failureCount = n - successCount;
    const p = successCount / n;
    const odds = failureCount === 0 ? Infinity : successCount / failureCount;

    const rCode = `# Binary Analysis\nx_count <- ${successCount}\nn_total <- ${n}\n\n# Proportion and Confidence Interval\nprop.test(x_count, n_total)\n\n# Exact Binomial Test\nbinom.test(x_count, n_total, p = 0.5)`;

    return {
      results: [
        { label: 'Total N', value: n },
        { label: `Success Count (${data.successValue})`, value: successCount, isMain: true },
        { label: 'Failure Count', value: failureCount },
        { label: 'Proportion (p̂)', value: p.toFixed(4), isMain: true },
        { label: 'Percentage', value: (p * 100).toFixed(2) + '%' },
        { label: 'Odds', value: odds === Infinity ? '∞' : odds.toFixed(4) }
      ],
      interpretation: `Out of ${n} observations, ${successCount} were "${data.successValue}" (${(p * 100).toFixed(1)}%).`,
      rCode,
      formula: `p̂ = success / n\nOdds = p̂ / (1 - p̂)`
    };
  }
};
