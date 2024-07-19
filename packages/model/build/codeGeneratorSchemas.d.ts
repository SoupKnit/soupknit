import { z } from 'zod';
export declare const configSchema: z.ZodObject<{
    framework: z.ZodEnum<["sklearn", "pytorch", "tensorflow"]>;
    task: z.ZodEnum<["classification", "regression"]>;
    model_type: z.ZodString;
    data_path: z.ZodString;
    target_column: z.ZodString;
    model_params: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    framework: "sklearn" | "pytorch" | "tensorflow";
    task: "classification" | "regression";
    model_type: string;
    data_path: string;
    target_column: string;
    model_params?: Record<string, any> | undefined;
}, {
    framework: "sklearn" | "pytorch" | "tensorflow";
    task: "classification" | "regression";
    model_type: string;
    data_path: string;
    target_column: string;
    model_params?: Record<string, any> | undefined;
}>;
export type Config = z.infer<typeof configSchema>;
export declare const generatedCodeSchema: z.ZodObject<{
    imports: z.ZodString;
    data_loading: z.ZodString;
    model_creation: z.ZodString;
    model_training: z.ZodString;
    evaluation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    imports: string;
    data_loading: string;
    model_creation: string;
    model_training: string;
    evaluation: string;
}, {
    imports: string;
    data_loading: string;
    model_creation: string;
    model_training: string;
    evaluation: string;
}>;
export declare const responseSchema: z.ZodObject<{
    generated_code: z.ZodObject<{
        imports: z.ZodString;
        data_loading: z.ZodString;
        model_creation: z.ZodString;
        model_training: z.ZodString;
        evaluation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        imports: string;
        data_loading: string;
        model_creation: string;
        model_training: string;
        evaluation: string;
    }, {
        imports: string;
        data_loading: string;
        model_creation: string;
        model_training: string;
        evaluation: string;
    }>;
}, "strip", z.ZodTypeAny, {
    generated_code: {
        imports: string;
        data_loading: string;
        model_creation: string;
        model_training: string;
        evaluation: string;
    };
}, {
    generated_code: {
        imports: string;
        data_loading: string;
        model_creation: string;
        model_training: string;
        evaluation: string;
    };
}>;
export type GeneratedCode = z.infer<typeof generatedCodeSchema>;
export type ResponseSchema = z.infer<typeof responseSchema>;
