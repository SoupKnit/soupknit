export type GlobalPreprocessingOption =
  | "drop_missing"
  | "drop_constant"
  | "drop_duplicate"
  | "pca";

export type NumericImputationMethod =
  | "none"
  | "mean"
  | "median"
  | "constant"
  | "knn";
export type NumericScalingMethod = "none" | "standard" | "minmax" | "robust";
export type CategoricalEncodingMethod = "none" | "onehot" | "label" | "ordinal";

export interface ColumnPreprocessing {
  name: string;
  type: "numeric" | "categorical";
  imputation?: NumericImputationMethod;
  scaling?: NumericScalingMethod;
  encoding?: CategoricalEncodingMethod;
  params: Record<string, any>;
}

export interface PreprocessingConfig {
  global_preprocessing: GlobalPreprocessingOption[];
  global_params: Record<string, any>;
  columns: ColumnPreprocessing[];
}
