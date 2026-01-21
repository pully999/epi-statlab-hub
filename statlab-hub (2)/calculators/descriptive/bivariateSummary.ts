
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import * as utils from './utils';

export const bivariateSummary: CalculatorDefinition<{ var1: string, var2: string, precision: number }> = {
  metadata: {
    id: 'bivariate-summary',
    title: 'Bivariate Summary',
    category: Category.DESCRIPTIVE,
    description: 'Correlation and covariance analysis between two numeric variables.',
    keywords: ['correlation', 'pearson', 'covariance', 'bivariate']
  },
  schema: z.object({
    var1: z.string().min(1, "Variable 1 data required"),
    var2: z.string().min(1, "Variable 2 data required"),
    precision: z.number().default(4)
  }),
  examples: [
    { var1: '1, 2, 3, 4, 5', var2: '2, 4, 5, 4, 5', precision: 4 }
  ],
  compute: (data) => {
    const x = utils.parseNumericInput(data.var1);
    const y = utils.parseNumericInput(data.var2);
    
    if (x.length !== y.length) return { results: [], interpretation: "Variables must have the same number of observations." };
    if (x.length < 2) return { results: [], interpretation: "At least 2 pairs required." };

    const n = x.length;
    const mx = utils.mean(x);
    const my = utils.mean(y);
    
    let cov = 0;
    let ssx = 0;
    let ssy = 0;
    
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx;
      const dy = y[i] - my;
      cov += dx * dy;
      ssx += dx * dx;
      ssy += dy * dy;
    }
    
    const covariance = cov / (n - 1);
    const r = cov / Math.sqrt(ssx * ssy);
    const r2 = r * r;

    const f = (n: number) => n.toFixed(data.precision);

    const rCode = `# Bivariate Data
x <- c(${x.join(', ')})
y <- c(${y.join(', ')})

# Pearson Correlation
cor.test(x, y, method = "pearson")

# Covariance
cov(x, y)

# Linear Regression Model
model <- lm(y ~ x)
summary(model)

# Plot
plot(x, y, pch=19, col="blue", main="Bivariate Scatterplot")
abline(model, col="red")`;

    return {
      results: [
        { label: 'Pairs (n)', value: n },
        { label: 'Pearson Correlation (r)', value: f(r), isMain: true },
        { label: 'Coeff. of Determination (r²)', value: f(r2) },
        { label: 'Covariance', value: f(covariance) },
        { label: 'Mean X', value: f(mx) },
        { label: 'Mean Y', value: f(my) }
      ],
      interpretation: `The correlation coefficient r = ${f(r)} suggests a ${Math.abs(r) > 0.7 ? 'strong' : 'moderate'} ${r > 0 ? 'positive' : 'negative'} linear relationship.`,
      rCode,
      formula: `r = Σ((x-x̄)(y-ȳ)) / √(Σ(x-x̄)²Σ(y-ȳ)²)`
    };
  }
};
