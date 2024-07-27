import { z } from "zod";
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
