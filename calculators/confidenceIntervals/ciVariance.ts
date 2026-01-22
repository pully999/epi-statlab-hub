
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as ciUtils from './utils';

export const ciVariance: CalculatorDefinition<{ 
  sd: number, 
  n: number, 
  conf: number,
  precision: number 
}> = {
  metadata: {
    id: 'ci-variance',
    title: 'CI for Variance & SD',
    category: Category.CONFIDENCE_INTERVALS,
    description: 'Calculate confidence intervals for population variance and standard deviation using the Chi-square distribution.',
    keywords: ['variance', 'standard deviation', 'chi-square', 'dispersion']
  },
  schema: z.object({
    sd: z.number().min(0.00001, "Sample SD must be positive"),
    n: z.number().int().min(2, "Sample size must be at least 2"),
    conf: z.number().min(80).max(99.9).default(95),
    precision: z.number().min(0).max(6).default(4)
  }),
  examples: [
    { sd: 15, n: 30, conf: 95, precision: 4 }
  ],
  compute: (data) => {
    const { sd, n, conf, precision } = data;
    const df = n - 1;
    const alpha = 1 - conf / 100;
    const s2 = sd * sd;
    
    const chiLower = ciUtils.getChiSqCritical(1 - alpha / 2, df);
    const chiUpper = ciUtils.getChiSqCritical(alpha / 2, df);

    const varLower = (df * s2) / chiUpper;
    const varUpper = (df * s2) / chiLower;

    const sdLower = Math.sqrt(varLower);
    const sdUpper = Math.sqrt(varUpper);

    const rCode = `# Variance CI (Chi-Square method)\ns_sd <- ${sd}\nn <- ${n}\nconf_level <- ${conf/100}\n\ndf <- n - 1\nalpha <- 1 - conf_level\n\n# Variance bounds\nvar_lower <- (df * s_sd^2) / qchisq(1 - alpha/2, df)\nvar_upper <- (df * s_sd^2) / qchisq(alpha/2, df)\n\n# SD bounds\nprint(paste("SD CI:", sqrt(var_lower), "to", sqrt(var_upper)))`;

    const f = (val: number) => val.toFixed(precision);

    return {
      results: [
        { label: 'Sample Variance (s²)', value: f(s2), isMain: true },
        { label: 'Degrees of Freedom (df)', value: df },
        { label: 'χ² Critical (Lower)', value: f(chiLower) },
        { label: 'χ² Critical (Upper)', value: f(chiUpper) },
        { label: 'CI for Variance', value: ciUtils.formatCI(varLower, varUpper, precision), isMain: true },
        { label: 'CI for Std. Deviation', value: ciUtils.formatCI(sdLower, sdUpper, precision), isMain: true }
      ],
      interpretation: `We are ${conf}% confident that the true population SD lies between ${f(sdLower)} and ${f(sdUpper)}.`,
      rCode,
      formula: `Variance CI = [(n-1)s² / χ²_{α/2, df}, (n-1)s² / χ²_{1-α/2, df}]`
    };
  }
};
