
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../types';

export const sampleSizeCluster: CalculatorDefinition<{ 
  nIndividual: number, 
  m: number, 
  icc: number 
}> = {
  metadata: {
    id: 'sample-size-cluster',
    title: 'Sample Size: Cluster Adjustment',
    category: Category.SAMPLE_SIZE,
    description: 'Adjust individual-level sample size for cluster-randomized designs using ICC.',
    keywords: ['cluster', 'icc', 'design effect', 'randomization']
  },
  schema: z.object({
    nIndividual: z.number().min(1).describe("N required if randomized individually"),
    m: z.number().min(2).describe("Average Cluster Size"),
    icc: z.number().min(0).max(1).describe("Intracluster Correlation (ICC)")
  }),
  examples: [{ nIndividual: 200, m: 20, icc: 0.05 }],
  compute: (data) => {
    const { nIndividual, m, icc } = data;
    
    const designEffect = 1 + (m - 1) * icc;
    const nAdjusted = Math.ceil(nIndividual * designEffect);
    const numClusters = Math.ceil(nAdjusted / m);

    const rCode = `# Cluster Sample Size Adjustment
n_indiv <- ${nIndividual}
cluster_size <- ${m}
icc <- ${icc}

deff <- 1 + (cluster_size - 1) * icc
n_clustered <- ceiling(n_indiv * deff)
num_clusters <- ceiling(n_clustered / cluster_size)

print(paste("Adjusted N:", n_clustered))
print(paste("Clusters Needed:", num_clusters))`;

    return {
      results: [
        { label: 'Adjusted Total N', value: nAdjusted, isMain: true },
        { label: 'Required Clusters', value: numClusters, isMain: true },
        { label: 'Design Effect (DEFF)', value: designEffect.toFixed(3) },
        { label: 'Increase Factor', value: (designEffect * 100 - 100).toFixed(1) + '%' }
      ],
      interpretation: `Because of clustering (ICC=${icc}), the sample size must increase by ${((designEffect-1)*100).toFixed(1)}%.`,
      rCode,
      formula: `DEFF = 1 + (m - 1) * ICC\nN_adj = N_indiv * DEFF`
    };
  }
};
