// create a zod schema for a simple object with a string property called message
import { z } from "zod";
export const helloMessageSchema = z.object({
    message: z.string(),
});
export const HelloMessage = typeof helloMessageSchema;
