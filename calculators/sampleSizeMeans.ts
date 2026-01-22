
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';
import * as ciUtils from './confidenceIntervals/utils';

export const sampleSizeMeans: CalculatorDefinition<{ 
  m1: number, 
  m2: number, 
  sd: number, 
  power: number, 
  alpha: number,
  ratio: number
}> = {
  metadata: {
    id: 'sample-size-means',
    title: 'Sample Size: Two Means',
    category: Category.SAMPLE_SIZE,
    description: 'Calculate the required sample size to detect a difference between two independent means.',
    keywords: ['sample size', 'power', 'means', 't-test', 'cohen d']
  },
  schema: z.object({
    m1: z.number(),
    m2: z.number(),
    sd: z.number().min(0.0001, "SD must be positive"),
    power: z.number().min(0.5).max(0.99).default(0.8),
    alpha: z.number().min(0.001).max(0.2).default(0.05),
    ratio: z.number().min(0.1).max(10).default(1)
  }),
  examples: [
    { m1: 100, m2: 110, sd: 15, power: 0.8, alpha: 0.05, ratio: 1 }
  ],
  compute: (data) => {
    const { m1, m2, sd, power, alpha, ratio } = data;
    const delta = Math.abs(m1 - m2);
    const zAlpha = ciUtils.getZCritical((1 - alpha) * 100);
    const zPower = ciUtils.getZCritical((power * 2 - 1) * 100);
    
    const n1 = Math.ceil(
      (Math.pow(sd, 2) * (1 + 1/ratio) * Math.pow(zAlpha + zPower, 2)) / Math.pow(delta, 2)
    );
    const n2 = Math.ceil(n1 * ratio);
    const d = delta / sd;

    const rCode = `# Requires 'pwr' package\n# install.packages("pwr")\nlibrary(pwr)\n\n# Power analysis for two means\npwr.t.test(d = ${d.toFixed(4)}, \n           sig.level = ${alpha}, \n           power = ${power}, \n           type = "two.sample", \n           alternative = "two.sided")\n\n# Note: pwr assumes equal n. For unequal n:\n# pwr.t2n.test(n1 = ${n1}, n2 = ${n2}, d = ${d.toFixed(4)}, ...)` ;

    return {
      results: [
        { label: 'Group 1 Size (n1)', value: n1, isMain: true },
        { label: 'Group 2 Size (n2)', value: n2, isMain: true },
        { label: 'Total Sample Size', value: n1 + n2 },
        { label: "Cohen's d", value: d.toFixed(3) }
      ],
      interpretation: `Required N: ${n1} in G1, ${n2} in G2.`,
      rCode,
      formula: `n1 = [σ²(1 + 1/k)(Z_α/2 + Z_β)²] / Δ²`
    };
  }
};

export const sampleSizeMeanEstimate: CalculatorDefinition<{ 
  sd: number, 
  precision: number, 
  conf: number 
}> = {
  metadata: {
    id: 'sample-size-mean-est',
    title: 'Sample Size: Estimate a Mean',
    category: Category.SAMPLE_SIZE,
    description: 'Sample size for estimating a population mean with a specific margin of error.',
    keywords: ['sample size', 'mean', 'precision', 'margin of error']
  },
  schema: z.object({
    sd: z.number().min(0.0001, "SD must be positive"),
    precision: z.number().min(0.0001, "Precision must be positive"),
    conf: z.number().min(80).max(99.9).default(95)
  }),
  examples: [{ sd: 20, precision: 5, conf: 95 }],
  compute: (data) => {
    const { sd, precision, conf } = data;
    const z = ciUtils.getZCritical(conf);
    const n = Math.ceil(Math.pow(z * sd / precision, 2));

    const rCode = `# Calculation using base R\nsd_val <- ${sd}\nme_val <- ${precision}\nconf_level <- ${conf/100}\n\nz_crit <- qnorm(1 - (1 - conf_level)/2)\nn_req <- ceiling((z_crit * sd_val / me_val)^2)\nprint(paste("Required n:", n_req))`;

    return {
      results: [
        { label: 'Required Sample Size (n)', value: n, isMain: true },
        { label: 'Z-Critical', value: z.toFixed(3) }
      ],
      interpretation: `You need a sample size of ${n}.`,
      rCode,
      formula: `n = (Z * σ / d)²`
    };
  }
};
