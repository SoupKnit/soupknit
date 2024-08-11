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
export type NumericScalingMethod =
  | "scale_standard"
  | "scale_minmax"
  | "scale_robust";
export type CategoricalEncodingMethod =
  | "encode_onehot"
  | "encode_label"
  | "encode_ordinal";

export type PreProcessingColumnConfig = {
  name: string; // String, name of the column
  type: "numeric" | "categorical" | "date";
  params: Record<string, any>; // Object, parameters for preprocessing steps
  //List of preprocessing operations
  preprocessing: {
    imputation?:
      | "impute_mean"
      | "impute_median"
      | "impute_constant"
      | "impute_knn";
    scaling?: NumericScalingMethod;
    encoding?: CategoricalEncodingMethod;
  };
};
