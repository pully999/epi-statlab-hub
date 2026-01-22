
import { z } from 'zod';
import { Category, CalculatorDefinition } from '../../types';
import { getMode } from './utils';

export const categoricalSummary: CalculatorDefinition<{ text: string, ignoreCase: boolean }> = {
  metadata: {
    id: 'categorical-summary',
    title: 'Categorical Summary',
    category: Category.DESCRIPTIVE,
    description: 'Analyze frequency and distribution of categorical or qualitative data.',
    keywords: ['frequency', 'mode', 'counts', 'categories']
  },
  schema: z.object({
    text: z.string().min(1, "Input text data required"),
    ignoreCase: z.boolean().default(true)
  }),
  examples: [
    { text: 'Red, Blue, Red, Green, Blue, Red, Yellow', ignoreCase: true }
  ],
  compute: (data) => {
    let items = data.text.split(/[,\n]+/).map(i => i.trim()).filter(i => i !== "");
    if (data.ignoreCase) items = items.map(i => i.toLowerCase());
    
    const n = items.length;
    const counts = new Map<string, number>();
    items.forEach(i => counts.set(i, (counts.get(i) || 0) + 1));
    
    const modes = getMode(items);
    const unique = counts.size;

    const freqResults = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([val, count]) => ({
        label: `Category: ${val}`,
        value: `${count} (${((count/n)*100).toFixed(1)}%)`
      }));

    const rCode = `# Categorical Analysis\nx <- c(${items.map(i => `"${i}"`).join(', ')})\n\n# Frequency Table\ntab <- table(x)\nprint(tab)\n\n# Proportions\nprop.table(tab)\n\n# Visualization\nbarplot(tab, col="lightblue", main="Frequency of Categories")`;

    return {
      results: [
        { label: 'Total Count (n)', value: n },
        { label: 'Unique Categories', value: unique, isMain: true },
        { label: 'Mode(s)', value: modes.join(', ') || 'None', isMain: true },
        ...freqResults
      ],
      interpretation: `There are ${unique} unique categories. The most frequent is "${modes[0]}" occurring ${counts.get(modes[0])} times.`,
      rCode,
      formula: `Relative Frequency = (Category Count / n) * 100%`
    };
  }
};
