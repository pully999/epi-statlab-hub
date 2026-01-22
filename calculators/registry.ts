import { descriptiveStats } from './descriptiveStats';
import { oneSampleT } from './oneSampleT';
import { twoSampleT } from './twoSampleT';
import { chiSquare } from './chiSquare';
import { epiMeasures } from './epiMeasures';
import { sampleSizeProp } from './sampleSizeProp';
import { numericSummary } from './descriptive/numericSummary';
import { categoricalSummary } from './descriptive/categoricalSummary';
import { outlierStats } from './descriptive/outlierStats';
import { binarySummary } from './descriptive/binarySummary';
import { bivariateSummary } from './descriptive/bivariateSummary';

// Advanced CI Module
import { ciMean } from './confidenceIntervals/ciMean';
import { ciProportion } from './confidenceIntervals/ciProportion';
import { ciEpi } from './confidenceIntervals/ciEpi';
import { ciVariance } from './confidenceIntervals/ciVariance';
import { ciRatePoisson } from './confidenceIntervals/ciRatePoisson';

// Sample Size Module
import { sampleSizeMeans, sampleSizeMeanEstimate } from './sampleSizeMeans';
import { sampleSizeTwoProps } from './sampleSizeTwoProps';
import { sampleSizePaired } from './sampleSizePaired';
import { sampleSizeNonInferiority } from './sampleSizeNonInferiority';
import { sampleSizeCluster } from './sampleSizeCluster';

// Power Module
import { powerMeans } from './powerMeans';
import { powerProportions } from './power/powerProportions';
import { powerPaired } from './power/powerPaired';
import { powerNonInf } from './power/powerNonInf';

// Epidemiology Sub-modules
import { incidenceProportion, incidenceRate, cfrCalculator } from './epidemiology/riskCalculators';
import { riskRatioCalc, oddsRatioCalc } from './epidemiology/ratioCalculators';
import { riskDiffCalc, vaccineEffectiveness } from './epidemiology/impactCalculators';
import { diagnosticTesting } from './epidemiology/diagnosticTesting';

// Legacy / Other
import { screeningImpact } from './epidemiology/screeningImpact';
import { standardizedRates } from './epidemiology/standardizedRates';

import { CalculatorDefinition } from '../types';

export const calculatorRegistry: Record<string, CalculatorDefinition<any>> = {
  // Descriptive
  'descriptive-stats': descriptiveStats,
  'numeric-summary': numericSummary,
  'categorical-summary': categoricalSummary,
  'outlier-stats': outlierStats,
  'binary-summary': binarySummary,
  'bivariate-summary': bivariateSummary,
  
  // Confidence Intervals
  'ci-mean-pro': ciMean,
  'ci-proportion-pro': ciProportion,
  'ci-epi-2x2': ciEpi,
  'ci-variance': ciVariance,
  'ci-rate-poisson': ciRatePoisson,
  
  // Hypothesis Tests
  'one-sample-t': oneSampleT,
  'two-sample-t': twoSampleT,
  'chi-square': chiSquare,
  
  // Epidemiology Sub-Modules
  'epi-incidence-prop': incidenceProportion,
  'epi-incidence-rate': incidenceRate,
  'epi-cfr': cfrCalculator,
  'epi-risk-ratio': riskRatioCalc,
  'epi-odds-ratio': oddsRatioCalc,
  'epi-risk-diff': riskDiffCalc,
  'epi-ve': vaccineEffectiveness,
  'diagnostic-testing': diagnosticTesting,
  
  // Legacy / Advanced Epi
  'epi-measures': epiMeasures,
  'screening-impact': screeningImpact,
  'standardized-rates': standardizedRates,
  
  // Sample Size & Power
  'sample-size-prop': sampleSizeProp,
  'sample-size-means': sampleSizeMeans,
  'sample-size-mean-est': sampleSizeMeanEstimate,
  'sample-size-two-props': sampleSizeTwoProps,
  'sample-size-paired': sampleSizePaired,
  'sample-size-noninf': sampleSizeNonInferiority,
  'sample-size-cluster': sampleSizeCluster,
  'power-means': powerMeans,
  'power-proportions': powerProportions,
  'power-paired': powerPaired,
  'power-noninf': powerNonInf
};

export const getCalculatorById = (id: string) => calculatorRegistry[id];
export const getAllCalculators = () => Object.values(calculatorRegistry);
