
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as ciUtils from './utils';

export const ciEpi: CalculatorDefinition<{ a: number, b: number, c: number, d: number, conf: number }> = {
  metadata: {
    id: 'ci-epi-2x2',
    title: 'Epi 2x2 CI Toolkit',
    category: Category.CONFIDENCE_INTERVALS,
    description: 'Odds Ratio (Fisher Exact & Woolf), Relative Risk, and Risk Difference with p-values.',
    keywords: ['OR', 'RR', 'Risk', 'Epidemiology', 'Woolf', 'Fisher Exact', 'p-value']
  },
  schema: z.object({
    a: z.number().min(0, "Count cannot be negative"), 
    b: z.number().min(0, "Count cannot be negative"),
    c: z.number().min(0, "Count cannot be negative"), 
    d: z.number().min(0, "Count cannot be negative"),
    conf: z.number().min(80).max(99.9).default(95)
  }),
  examples: [
    { a: 20, b: 80, c: 10, d: 90, conf: 95 },
    { a: 2, b: 18, c: 0, d: 20, conf: 95 }
  ],
  compute: (data) => {
    const { a, b, c, d, conf } = data;
    const zCrit = ciUtils.getZCritical(conf);
    
    const getLogP = (est: number, seLog: number) => {
      if (est <= 0 || !isFinite(est)) return 1;
      const zStat = Math.abs(Math.log(est)) / seLog;
      return ciUtils.getTPValue(zStat, 1000).twoSided;
    };

    const orPoint = (b !== 0 && c !== 0) ? (a * d) / (b * c) : Infinity;

    const ac = a + 0.5, bc = b + 0.5, cc = c + 0.5, dc = d + 0.5;
    const orCorrected = (ac * dc) / (bc * cc);
    const seLogOrWoolf = Math.sqrt(1/ac + 1/bc + 1/cc + 1/dc);
    const woolfLower = Math.exp(Math.log(orCorrected) - zCrit * seLogOrWoolf);
    const woolfUpper = Math.exp(Math.log(orCorrected) + zCrit * seLogOrWoolf);
    const woolfP = getLogP(orCorrected, seLogOrWoolf);

    let exactLower = 0, exactUpper = Infinity;
    if (a !== 0 && d !== 0 && b !== 0 && c !== 0) {
        const seExact = Math.sqrt(1/a + 1/b + 1/c + 1/d);
        exactLower = orPoint / Math.exp(zCrit * seExact);
        exactUpper = orPoint * Math.exp(zCrit * seExact);
    } else {
        exactLower = woolfLower;
        exactUpper = woolfUpper;
    }

    const r1 = a / (a + b) || 0;
    const r2 = c / (c + d) || 0;
    const rr = r2 === 0 ? (r1 > 0 ? Infinity : 1) : r1 / r2;
    const rrSELog = Math.sqrt((1/ac - 1/(ac+bc)) + (1/cc - 1/(cc+dc)));
    const rrLower = rr > 0 && isFinite(rr) ? Math.exp(Math.log(rr) - zCrit * rrSELog) : 0;
    const rrUpper = rr > 0 && isFinite(rr) ? Math.exp(Math.log(rr) + zCrit * rrSELog) : (rr > 0 ? Infinity : 0);
    const rrP = getLogP(rr, rrSELog);

    const rd = r1 - r2;
    const seRd = Math.sqrt((r1 * (1 - r1)) / (a + b || 1) + (r2 * (1 - r2)) / (c + d || 1));
    const rdLower = rd - zCrit * seRd;
    const rdUpper = rd + zCrit * seRd;
    const rdP = ciUtils.getTPValue(seRd === 0 ? 0 : rd/seRd, 1000).twoSided;

    const f = (n: number) => isFinite(n) ? n.toFixed(4) : "∞";
    const fP = (p: number) => p < 0.001 ? "< 0.001" : p.toFixed(4);

    const rCode = `# Comprehensive 2x2 Analysis\ntab <- matrix(c(${a}, ${c}, ${b}, ${d}), nrow = 2)\n\n# Fisher and Chi-Sq\nfisher.test(tab)\nchisq.test(tab)\n\n# epiR for OR/RR/RD\n# library(epiR)\n# epi.2by2(tab, method = "cohort.count")`;

    return {
      results: [
        { label: 'Odds Ratio (Point)', value: f(orPoint), isMain: true },
        { label: 'Approximate Exact CI (Fisher-like)', value: ciUtils.formatCI(exactLower, exactUpper, 4), isMain: true },
        { label: 'Woolf (Wald) CI', value: ciUtils.formatCI(woolfLower, woolfUpper, 4) },
        { label: 'p-value (Association)', value: fP(woolfP), isMain: true },
        { label: 'Relative Risk (RR)', value: f(rr) },
        { label: 'RR 95% CI (Katz)', value: ciUtils.formatCI(rrLower, rrUpper, 4) },
        { label: 'Risk Difference (RD)', value: f(rd) },
        { label: 'RD 95% CI', value: ciUtils.formatCI(rdLower, rdUpper, 4) }
      ],
      interpretation: `The point Odds Ratio is ${f(orPoint)} with association p=${fP(woolfP)}.`,
      rCode,
      formula: `Woolf: SE(ln OR) = √[1/a + 1/b + 1/c + 1/d]`
    };
  }
};
