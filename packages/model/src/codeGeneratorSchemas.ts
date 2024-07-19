import { z } from "zod";

export type ModelType =
  | "KNN"
  | "KNN_Regressor"
  | "LogisticRegression"
  | "LinearRegression"
  | "RandomForestClassifier"
  | "RandomForest_Regressor"
  | "SVM"
  | "SVR"
  | "KMeans";

export type TaskType = "classification" | "regression" | "clustering";

export type Framework = "sklearn" | "tensorflow" | "pytorch";

export interface ModelConfig {
  task: TaskType;
  model_type: ModelType | "";
  framework: Framework;
  data_path: string;
  X_columns: string[];
  y_column: string;
  scale_features: boolean;
  test_size: number;
  tune_hyperparameters: boolean;
  param_grid: Record<string, (string | number)[]>;
  model_params: Record<string, any>;
}

export const configSchema = z.object({
  framework: z.enum(["sklearn", "pytorch", "tensorflow"]),
  payload: z.object({
    task: z.enum(["classification", "regression", "clustering"]),
    model_type: z.string(),
    data_path: z.string(),
    target_column: z.string(),
    model_params: z.record(z.any()).optional(),
  }),
});

export type Config = z.infer<typeof configSchema>;

export const generatedCodeSchema = z.object({
  imports: z.string(),
  data_loading: z.string(),
  model_creation: z.string(),
  model_training: z.string(),
  evaluation: z.string(),
});

export const responseSchema = z.object({
  generated_code: generatedCodeSchema,
});

export type GeneratedCode = z.infer<typeof generatedCodeSchema>;
export type ResponseSchema = z.infer<typeof responseSchema>;
