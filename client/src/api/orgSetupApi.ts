import { api } from "./baseApi"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"

import type { ClientEnvironment } from "@/lib/clientEnvironment"
import type { OrgSetupRequest } from "@soupknit/model/src/userAndOrgSchemas"

export async function orgSetupApi(
  env: ClientEnvironment,
  payload: OrgSetupRequest,
) {
  const access_token = await getSupabaseAccessToken()
  return api.post(`${env.serverUrl}/user/org/setup`, payload, {
    token: access_token,
  })
}
