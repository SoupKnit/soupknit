import { z } from "zod";

export const GlobalPreprocessingOptionSchema = z.enum([
  "drop_missing",
  "drop_constant",
  "drop_duplicate",
  "pca",
]);
export type GlobalPreprocessingOption = z.infer<
  typeof GlobalPreprocessingOptionSchema
>;

export const NumericImputationMethodSchema = z.enum([
  "none",
  "mean",
  "median",
  "constant",
  "knn",
]);
export type NumericImputationMethod = z.infer<
  typeof NumericImputationMethodSchema
>;

export const NumericScalingMethodSchema = z.enum([
  "standard",
  "minmax",
  "robust",
]);
export type NumericScalingMethod = z.infer<typeof NumericScalingMethodSchema>;

export const CategoricalEncodingMethodSchema = z.enum([
  "onehot",
  "label",
  "ordinal",
]);

export type CategoricalEncodingMethod = z.infer<
  typeof CategoricalEncodingMethodSchema
>;

export const PreProcessingColumnConfigSchema = z.object({
  name: z.string(), // String, name of the column
  type: z.enum(["numeric", "categorical", "date"]),
  params: z.record(z.string(), z.any()), // Object, parameters for preprocessing steps
  preprocessing: z.object({
    imputation: z.optional(NumericImputationMethodSchema),
    scaling: z.optional(NumericScalingMethodSchema),
    encoding: z.optional(CategoricalEncodingMethodSchema),
  }),
});

export type PreProcessingColumnConfig = z.infer<
  typeof PreProcessingColumnConfigSchema
>;
