import { orgSetupApi } from "@/api/orgSetupApi"

import type { ClientEnvironment } from "@/lib/clientEnvironment"
import type { OrgSetupRequest } from "@soupknit/model/src/userAndOrgSchemas"

export async function createOrg(
  env: ClientEnvironment,
  payload: OrgSetupRequest,
) {
  return orgSetupApi(env, payload)
}
