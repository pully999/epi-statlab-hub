
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';

export const diagnosticTesting: CalculatorDefinition<{ tp: number, fp: number, fn: number, tn: number, prevalence?: number }> = {
  metadata: {
    id: 'diagnostic-testing',
    title: 'Diagnostic Test Accuracy',
    category: Category.EPIDEMIOLOGY,
    description: 'Calculate Sensitivity, Specificity, PPV, NPV, and Likelihood Ratios from a 2x2 table or prevalence.',
    keywords: ['sensitivity', 'specificity', 'PPV', 'NPV', 'likelihood ratio', 'prevalence']
  },
  schema: z.object({
    tp: z.number().min(0).describe("True Positives"),
    fp: z.number().min(0).describe("False Positives"),
    fn: z.number().min(0).describe("False Negatives"),
    tn: z.number().min(0).describe("True Negatives"),
    prevalence: z.number().min(0).max(100).optional().describe("Clinical Prevalence % (Optional)")
  }),
  examples: [{ tp: 80, fp: 20, fn: 10, tn: 190, prevalence: 5 }],
  compute: (data) => {
    const { tp, fp, fn, tn } = data;
    const sens = tp / (tp + fn);
    const spec = tn / (tn + fp);
    const ppvTable = tp / (tp + fp);
    const npvTable = tn / (tn + fn);
    const lrPlus = sens / (1 - spec);
    const lrMinus = (1 - sens) / spec;
    
    let ppvAdj = ppvTable;
    let npvAdj = npvTable;
    if (data.prevalence !== undefined) {
      const prev = data.prevalence / 100;
      ppvAdj = (sens * prev) / (sens * prev + (1 - spec) * (1 - prev));
      npvAdj = (spec * (1 - prev)) / (spec * (1 - prev) + (1 - sens) * prev);
    }

    const rCode = `# Requires 'epiR' package\n# install.packages("epiR")\nlibrary(epiR)\n\n# Create 2x2 table for diagnostic tests\n# Table format: [TP, FP, FN, TN]\ndat <- as.table(matrix(c(${tp}, ${fn}, ${fp}, ${tn}), nrow = 2, byrow = TRUE))\n\n# Detailed diagnostic metrics\nepi.tests(dat, conf.level = 0.95)`;

    const f = (v: number) => (v * 100).toFixed(2) + '%';

    return {
      results: [
        { label: 'Sensitivity (TPR)', value: f(sens), isMain: true },
        { label: 'Specificity (TNR)', value: f(spec), isMain: true },
        { label: 'PPV', value: f(ppvAdj), isMain: true },
        { label: 'NPV', value: f(npvAdj), isMain: true },
        { label: 'LR+', value: lrPlus.toFixed(2) },
        { label: 'LR-', value: lrMinus.toFixed(2) }
      ],
      interpretation: `Test catches ${f(sens)} of diseased individuals.`,
      rCode,
      formula: `Sens = TP/(TP+FN)\nSpec = TN/(TN+FP)`
    };
  }
};
