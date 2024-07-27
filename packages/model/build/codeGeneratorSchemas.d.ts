import { z } from "zod";
export type ModelType = "KNN" | "KNN_Regressor" | "LogisticRegression" | "LinearRegression" | "RandomForestClassifier" | "RandomForest_Regressor" | "SVM" | "SVR" | "KMeans";
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
export declare const configSchema: z.ZodObject<{
    framework: z.ZodEnum<["sklearn", "pytorch", "tensorflow"]>;
    payload: z.ZodObject<{
        task: z.ZodEnum<["classification", "regression", "clustering"]>;
        model_type: z.ZodString;
        data_path: z.ZodString;
        target_column: z.ZodString;
        model_params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        task?: "classification" | "regression" | "clustering";
        model_type?: string;
        data_path?: string;
        target_column?: string;
        model_params?: Record<string, any>;
    }, {
        task?: "classification" | "regression" | "clustering";
        model_type?: string;
        data_path?: string;
        target_column?: string;
        model_params?: Record<string, any>;
    }>;
}, "strip", z.ZodTypeAny, {
    framework?: "sklearn" | "tensorflow" | "pytorch";
    payload?: {
        task?: "classification" | "regression" | "clustering";
        model_type?: string;
        data_path?: string;
        target_column?: string;
        model_params?: Record<string, any>;
    };
}, {
    framework?: "sklearn" | "tensorflow" | "pytorch";
    payload?: {
        task?: "classification" | "regression" | "clustering";
        model_type?: string;
        data_path?: string;
        target_column?: string;
        model_params?: Record<string, any>;
    };
}>;
export type Config = z.infer<typeof configSchema>;
export declare const generatedCodeSchema: z.ZodObject<{
    imports: z.ZodString;
    data_loading: z.ZodString;
    model_creation: z.ZodString;
    model_training: z.ZodString;
    evaluation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    imports?: string;
    data_loading?: string;
    model_creation?: string;
    model_training?: string;
    evaluation?: string;
}, {
    imports?: string;
    data_loading?: string;
    model_creation?: string;
    model_training?: string;
    evaluation?: string;
}>;
export declare const responseSchema: z.ZodObject<{
    generated_code: z.ZodObject<{
        imports: z.ZodString;
        data_loading: z.ZodString;
        model_creation: z.ZodString;
        model_training: z.ZodString;
        evaluation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        imports?: string;
        data_loading?: string;
        model_creation?: string;
        model_training?: string;
        evaluation?: string;
    }, {
        imports?: string;
        data_loading?: string;
        model_creation?: string;
        model_training?: string;
        evaluation?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    generated_code?: {
        imports?: string;
        data_loading?: string;
        model_creation?: string;
        model_training?: string;
        evaluation?: string;
    };
}, {
    generated_code?: {
        imports?: string;
        data_loading?: string;
        model_creation?: string;
        model_training?: string;
        evaluation?: string;
    };
}>;
export type GeneratedCode = z.infer<typeof generatedCodeSchema>;
export type ResponseSchema = z.infer<typeof responseSchema>;
