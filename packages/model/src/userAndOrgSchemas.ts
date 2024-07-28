import { z } from "zod";

export const orgSetupRequestSchema = z.object({
  orgName: z.string(),
  orgId: z.string(),
});

export type OrgSetupRequest = z.infer<typeof orgSetupRequestSchema>;
