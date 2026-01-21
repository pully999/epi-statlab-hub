
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';
import { parseNumericInput } from './descriptive/utils';

export const descriptiveStats: CalculatorDefinition<{ numbers: string }> = {
  metadata: {
    id: 'descriptive-stats',
    title: 'Descriptive Statistics',
    category: Category.DESCRIPTIVE,
    description: 'Calculate mean, median, standard deviation, variance, and quartiles from a sample.',
    keywords: ['mean', 'median', 'sd', 'variance', 'quartiles']
  },
  schema: z.object({
    numbers: z.string().min(1, "Please enter numbers separated by spaces or commas.")
  }),
  examples: [
    { numbers: '10 15 20 25 30 35 40' },
    { numbers: '1.2, 4.5, 3.3, 8.9, 2.1' }
  ],
  references: [
    {
      author: "Altman DG",
      year: 1991,
      title: "Practical Statistics for Medical Research",
      source: "Chapman & Hall/CRC",
      doi: "10.1201/9780429258589"
    }
  ],
  compute: (data) => {
    const arr = parseNumericInput(data.numbers).sort((a, b) => a - b);
    if (arr.length === 0) return { results: [], interpretation: "No valid numbers found." };

    const n = arr.length;
    const sum = arr.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const squaredDiffs = arr.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (n - 1);
    const sd = Math.sqrt(variance);
    const getMedian = (values: number[]) => {
      const mid = Math.floor(values.length / 2);
      return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
    };
    const medianValue = getMedian(arr);
    const q1 = getMedian(arr.slice(0, Math.floor(n / 2)));
    const q3 = getMedian(arr.slice(Math.ceil(n / 2)));

    const rCode = `# Create dataset\ndata <- c(${arr.join(', ')})\n\n# Summary Statistics\nsummary(data)\nsd(data)\nvar(data)\n\n# Boxplot for visualization\nboxplot(data, main="Sample Distribution", col="skyblue")`;

    return {
      results: [
        { label: 'Sample Size (n)', value: n },
        { label: 'Mean', value: mean.toFixed(4), isMain: true },
        { label: 'Median', value: medianValue.toFixed(4) },
        { label: 'Std. Deviation (SD)', value: sd.toFixed(4), isMain: true },
        { label: 'Variance', value: variance.toFixed(4) }
      ],
      interpretation: `Average: ${mean.toFixed(2)}, SD: ${sd.toFixed(2)}.`,
      rCode,
      formula: `Mean = (Σx) / n\nSample Variance (s²) = Σ(x - x̄)² / (n - 1)`
    };
  }
};
