import { z } from "zod";
export declare const helloMessageSchema: z.ZodObject<{
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
}, {
    message: string;
}>;
export declare const HelloMessage: "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function";
