
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as ciUtils from './utils';

export const ciProportion: CalculatorDefinition<{ 
  successes: number, 
  total_n: number, 
  conf: number, 
  precision: number 
}> = {
  metadata: {
    id: 'ci-proportion-pro',
    title: 'CI for Proportion (Advanced)',
    category: Category.CONFIDENCE_INTERVALS,
    description: 'Calculate Wald, Wilson Score, and Clopper-Pearson Exact intervals for a binomial proportion.',
    keywords: ['proportion', 'wilson', 'clopper-pearson', 'binomial', 'wald']
  },
  schema: z.object({
    successes: z.number().int().min(0, "Successes cannot be negative"),
    total_n: z.number().int().min(1, "Sample size must be at least 1"),
    conf: z.number().min(80).max(99.9).default(95),
    precision: z.number().min(0).max(6).default(4)
  }).refine(data => data.successes <= data.total_n, {
    message: "Successes cannot exceed total sample size"
  }),
  examples: [
    { successes: 5, total_n: 100, conf: 95, precision: 4 },
    { successes: 45, total_n: 100, conf: 95, precision: 4 }
  ],
  compute: (data) => {
    const { successes: x, total_n: n, conf, precision } = data;
    const p = x / n;
    const alpha = 1 - conf / 100;
    const zCrit = ciUtils.getZCritical(conf);
    const z2 = zCrit * zCrit;

    // 1. Normal Approximation (Wald)
    const seWald = Math.sqrt((p * (1 - p)) / n);
    const wLow = p - zCrit * seWald;
    const wHigh = p + zCrit * seWald;

    // 2. Wilson Score
    const wilsonDenom = 1 + z2 / n;
    const wilsonCenter = p + z2 / (2 * n);
    const wilsonSpread = zCrit * Math.sqrt((p * (1 - p) / n) + (z2 / (4 * n * n)));
    const wilsonLow = (wilsonCenter - wilsonSpread) / wilsonDenom;
    const wilsonHigh = (wilsonCenter + wilsonSpread) / wilsonDenom;

    // 3. Wilson Score with Continuity Correction (CC)
    // Ref: Newcombe (1998)
    const wilsonCCLow = (2 * n * p + z2 - 1 - zCrit * Math.sqrt(z2 - (2 + 1/n) + 4 * p * (n * (1 - p) + 1))) / (2 * (n + z2));
    const wilsonCCHigh = (2 * n * p + z2 + 1 + zCrit * Math.sqrt(z2 + (2 - 1/n) + 4 * p * (n * (1 - p) - 1))) / (2 * (n + z2));

    // 4. Clopper-Pearson (Exact)
    let cpLow = 0;
    if (x > 0) {
      const v1L = 2 * (n - x + 1);
      const v2L = 2 * x;
      const fValL = ciUtils.getFCritical(1 - alpha / 2, v1L, v2L);
      cpLow = x / (x + (n - x + 1) * fValL);
    }
    let cpHigh = 1;
    if (x < n) {
      const v1U = 2 * (x + 1);
      const v2U = 2 * (n - x);
      const fValU = ciUtils.getFCritical(1 - alpha / 2, v1U, v2U);
      cpHigh = ((x + 1) * fValU) / ((n - x) + (x + 1) * fValU);
    }
    
    const rCode = `# Proportion Analysis
x <- ${x}
n <- ${n}
conf <- ${conf/100}

# 1. Normal (Wald)
p <- x/n
se <- sqrt(p*(1-p)/n)
wald_ci <- c(p - qnorm(1-(1-conf)/2)*se, p + qnorm(1-(1-conf)/2)*se)

# 2. Wilson (No Correction)
prop.test(x, n, conf.level=conf, correct=FALSE)$conf.int

# 3. Wilson (With CC)
prop.test(x, n, conf.level=conf, correct=TRUE)$conf.int

# 4. Clopper-Pearson (Exact)
binom.test(x, n, conf.level=conf)$conf.int`;

    return {
      results: [
        { label: 'Observed Proportion (p̂)', value: p.toFixed(precision), isMain: true },
        { label: 'Wilson Score CI', value: ciUtils.formatCI(wilsonLow, wilsonHigh, precision), isMain: true, description: "Standard recommended interval" },
        { label: 'Clopper-Pearson CI', value: ciUtils.formatCI(cpLow, cpHigh, precision), isMain: true, description: "Exact (Conservative) interval" },
        { label: 'Wilson Score (with CC) CI', value: ciUtils.formatCI(wilsonCCLow, wilsonCCHigh, precision), description: "With continuity correction" },
        { label: 'Normal (Wald) CI', value: ciUtils.formatCI(wLow, wHigh, precision), description: "Approximation (unreliable if n*p < 5)" }
      ],
      interpretation: `The point estimate is ${p.toFixed(precision)}. The Wilson Score interval is ${ciUtils.formatCI(wilsonLow, wilsonHigh, precision)}. For clinical exactness, the Clopper-Pearson interval is ${ciUtils.formatCI(cpLow, cpHigh, precision)}.`,
      rCode,
      formula: `Wilson: [p + z²/2n ± z√{p(1-p)/n + z²/4n²}] / (1 + z²/n)\nWald: p ± z√(p(1-p)/n)`
    };
  }
};
