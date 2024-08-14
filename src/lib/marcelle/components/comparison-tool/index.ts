import { ComparisonTool } from './comparison-tool.component';

export function comparisonTool(...args: ConstructorParameters<typeof ComparisonTool>): ComparisonTool {
  return new ComparisonTool(...args);
}

export type { ComparisonTool };
