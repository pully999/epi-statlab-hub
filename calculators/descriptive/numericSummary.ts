
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as utils from './utils';

export const numericSummary: CalculatorDefinition<{ numbers: string, precision: number, trim: number }> = {
  metadata: {
    id: 'numeric-summary',
    title: 'Numeric Summary',
    category: Category.DESCRIPTIVE,
    description: 'Comprehensive analysis of central tendency, dispersion, shape, and distribution.',
    keywords: ['summary', 'mean', 'skewness', 'kurtosis', 'cv']
  },
  schema: z.object({
    numbers: z.string().min(1, "Input data required"),
    precision: z.number().min(0).max(10).default(4),
    trim: z.number().min(0).max(25).default(5)
  }),
  examples: [
    { numbers: '10, 12, 12, 13, 15, 18, 22, 25, 30, 100', precision: 3, trim: 10 }
  ],
  references: [
    {
      author: "Tukey JW",
      year: 1977,
      title: "Exploratory Data Analysis",
      source: "Addison-Wesley",
      doi: "N/A"
    }
  ],
  compute: (data) => {
    const raw = utils.parseNumericInput(data.numbers);
    if (raw.length === 0) return { results: [], interpretation: "No numeric data detected." };
    
    const sorted = [...raw].sort((a, b) => a - b);
    const n = sorted.length;
    const m = utils.mean(sorted);
    const s = utils.stdev(sorted);
    const v = utils.variance(sorted);
    const med = utils.median(sorted);
    const q1 = utils.quantiles(sorted, 0.25);
    const q3 = utils.quantiles(sorted, 0.75);
    const iqr = q3 - q1;
    const { skew, kurt } = utils.moments(sorted);
    
    const trimCount = Math.floor(n * (data.trim / 100));
    const trimmedArr = sorted.slice(trimCount, n - trimCount);
    const tMean = utils.mean(trimmedArr);

    const f = (num: number) => num.toFixed(data.precision);

    const rCode = `# Create numeric vector\nx <- c(${sorted.join(', ')})\n\n# Basic Summary\nsummary(x)\nsd(x)\n\n# Advanced moments (Requires 'e1071')\n# install.packages("e1071")\nlibrary(e1071)\nskewness(x)\nkurtosis(x)\n\n# Trimmed Mean\nmean(x, trim = ${data.trim/100})\n\n# Visualization\npar(mfrow=c(1,2))\nhist(x, col="lightgreen", main="Histogram")\nboxplot(x, col="tomato", main="Boxplot")`;

    return {
      results: [
        { label: 'Sample Size (n)', value: n },
        { label: 'Mean', value: f(m), isMain: true },
        { label: 'Median', value: f(med), isMain: true },
        { label: 'Trimmed Mean ('+data.trim+'%)', value: f(tMean) },
        { label: 'Std. Deviation (s)', value: f(s), isMain: true },
        { label: 'Variance (s²)', value: f(v) },
        { label: 'Coeff. Variation (CV)', value: ((s/m)*100).toFixed(2) + '%' },
        { label: 'Min', value: sorted[0] },
        { label: 'Max', value: sorted[n-1] },
        { label: 'Q1 (25th)', value: f(q1) },
        { label: 'Q3 (75th)', value: f(q3) },
        { label: 'IQR', value: f(iqr) },
        { label: 'Skewness', value: f(skew) },
        { label: 'Excess Kurtosis', value: f(kurt) }
      ],
      interpretation: `Sample (n=${n}) mean is ${f(m)}. Data is ${Math.abs(skew) < 0.5 ? 'fairly symmetrical' : skew > 0 ? 'right-skewed' : 'left-skewed'}.`,
      rCode,
      formula: `Mean = Σx / n\ns = √[Σ(x - μ)² / (n - 1)]`
    };
  }
};
