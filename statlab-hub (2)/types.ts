
import { z } from 'zod';

export enum Category {
  DESCRIPTIVE = 'Descriptive Statistics',
  CONFIDENCE_INTERVALS = 'Confidence Intervals',
  HYPOTHESIS_TESTS = 'Hypothesis Testing',
  EPIDEMIOLOGY = 'Epidemiology Tools',
  SAMPLE_SIZE = 'Sample Size & Power'
}

export interface CalculatorMetadata {
  id: string;
  title: string;
  category: Category;
  description: string;
  keywords: string[];
}

export interface CalculationResult {
  label: string;
  value: string | number;
  description?: string;
  isMain?: boolean;
}

export interface Reference {
  author: string;
  year: number | string;
  title: string;
  source: string;
  doi?: string;
}

export interface CalculatorDefinition<T extends Record<string, any>> {
  metadata: CalculatorMetadata;
  schema: z.ZodType<T>;
  compute: (data: T) => {
    results: CalculationResult[];
    interpretation: string;
    steps?: string[];
    formula?: string;
    rCode?: string; // Generated R code string based on inputs
  };
  examples: T[];
  references?: Reference[];
}
