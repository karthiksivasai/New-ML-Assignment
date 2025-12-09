export type ScalerType = 'None' | 'MinMax' | 'Standard';

export type ModelType = 'LogisticRegression' | 'DecisionTree';

export interface DataRow {
  [key: string]: string | number;
}

export interface ColumnStats {
  name: string;
  type: 'number' | 'string';
  min?: number;
  max?: number;
  mean?: number;
  std?: number;
  uniqueValues?: number;
}

export interface Dataset {
  raw: DataRow[];
  processed: DataRow[];
  columns: string[];
  stats: ColumnStats[];
  targetColumn: string | null;
  featureColumns: string[];
}

export interface PipelineState {
  step: number;
  dataset: Dataset | null;
  scaler: ScalerType;
  splitRatio: number; // 0-100 (Train %)
  selectedModel: ModelType | null;
  isTraining: boolean;
  results: TrainingResults | null;
  error: string | null;
}

export interface TrainingResults {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][]; // 2x2
  featureImportance: { name: string; value: number }[];
  insights: string;
}
