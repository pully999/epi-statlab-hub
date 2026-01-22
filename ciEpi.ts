
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as ciUtils from './utils';

export const ciEpi: CalculatorDefinition<{ 
  exposed_cases: number, 
  unexposed_cases: number, 
  exposed_control: number, 
  unexposed_control: number, 
  conf: number 
}> = {
  metadata: {
    id: 'ci-epi-2x2',
    title: 'Epi 2x2 CI Toolkit',
    category: Category.CONFIDENCE_INTERVALS,
    description: 'Detailed confidence intervals for Odds Ratio, Relative Risk, and Risk Difference.',
    keywords: ['OR', 'RR', 'Risk', 'Epidemiology', 'Woolf', 'Taylor', 'p-value']
  },
  schema: z.object({
    exposed_cases: z.number().min(0).describe("Exposed Cases"),
    unexposed_cases: z.number().min(0).describe("Unexposed Cases"),
    exposed_control: z.number().min(0).describe("Exposed Control"),
    unexposed_control: z.number().min(0).describe("Unexposed Control"),
    conf: z.number().min(80).max(99.9).default(95)
  }),
  examples: [
    { exposed_cases: 20, unexposed_cases: 10, exposed_control: 80, unexposed_control: 90, conf: 95 }
  ],
  compute: (data) => {
    const { 
      exposed_cases: a, 
      exposed_control: b, 
      unexposed_cases: c, 
      unexposed_control: d, 
      conf 
    } = data;
    const zCrit = ciUtils.getZCritical(conf);
    
    // Woolf correction (standard 0.5 addition for stability)
    const ac = a + 0.5, bc = b + 0.5, cc = c + 0.5, dc = d + 0.5;
    
    // OR
    const orPoint = (a * d) / (b * c) || 0;
    const seLogOr = Math.sqrt(1/ac + 1/bc + 1/cc + 1/dc);
    const orLower = Math.exp(Math.log((ac * dc) / (bc * cc)) - zCrit * seLogOr);
    const orUpper = Math.exp(Math.log((ac * dc) / (bc * cc)) + zCrit * seLogOr);

    // RR
    const r1 = a / (a + b) || 0;
    const r2 = c / (c + d) || 0;
    const rrPoint = r2 === 0 ? Infinity : r1 / r2;
    const seLogRr = Math.sqrt((1/ac - 1/(ac+bc)) + (1/cc - 1/(cc+dc)));
    const rrLower = rrPoint === 0 ? 0 : Math.exp(Math.log(rrPoint) - zCrit * seLogRr);
    const rrUpper = rrPoint === Infinity ? Infinity : Math.exp(Math.log(rrPoint) + zCrit * seLogRr);

    // RD
    const rdPoint = r1 - r2;
    const seRd = Math.sqrt((r1*(1-r1))/(a+b+0.5) + (r2*(1-r2))/(c+d+0.5));
    const rdLower = rdPoint - zCrit * seRd;
    const rdUpper = rdPoint + zCrit * seRd;

    const rCode = `# Advanced Epi 2x2 Report\ntab <- matrix(c(${a}, ${c}, ${b}, ${d}), nrow = 2)\ncolnames(tab) <- c("Cases", "Control")\nrownames(tab) <- c("Exposed", "Unexposed")\nepi.2by2(tab, method = "cohort.count")`;

    return {
      results: [
        { label: 'Odds Ratio (OR)', value: isFinite(orPoint) ? orPoint.toFixed(3) : '∞', isMain: true },
        { label: 'OR 95% CI (Woolf)', value: ciUtils.formatCI(orLower, orUpper, 3) },
        { label: 'Relative Risk (RR)', value: isFinite(rrPoint) ? rrPoint.toFixed(3) : '∞', isMain: true },
        { label: 'RR 95% CI (Taylor)', value: ciUtils.formatCI(rrLower, rrUpper, 3) },
        { label: 'Risk Difference (RD)', value: rdPoint.toFixed(4) },
        { label: 'RD 95% CI', value: ciUtils.formatCI(rdLower, rdUpper, 4) }
      ],
      interpretation: `Point estimates: OR=${orPoint.toFixed(2)}, RR=${rrPoint.toFixed(2)}. This summarizes the strength of association between exposure and outcome.`,
      rCode,
      formula: `OR = (ad)/(bc)\nRR = [a/(a+b)] / [c/(c+d)]\nRD = [a/(a+b)] - [c/(c+d)]`
    };
  }
};
