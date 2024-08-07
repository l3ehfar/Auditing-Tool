import { DatasetExplorer } from './dataset-explorer.component';

export function datasetExplorer(...args: ConstructorParameters<typeof DatasetExplorer>): DatasetExplorer {
  return new DatasetExplorer(...args);
}

export type { DatasetExplorer };
