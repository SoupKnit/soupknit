import * as z from "zod";
export declare function validate<T>(schema: z.ZodType<T>, data: unknown): T;
