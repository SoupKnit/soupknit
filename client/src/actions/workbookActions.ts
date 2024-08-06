import { api } from "./baseApi"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"

import type { ClientEnvironment } from "@/lib/clientEnvironment"
import type {
  ActiveProject,
  Workbook,
} from "@soupknit/model/src/workbookSchemas"

export async function runProjectAction(
  env: ClientEnvironment,
  data: { workbook: Workbook; project: ActiveProject },
) {
  console.log("runWorkbookQuery", data.workbook, data.project)
  return await api.post(`${env.serverUrl}/app/workbook`, data, {
    token: await getSupabaseAccessToken(),
  })
}
