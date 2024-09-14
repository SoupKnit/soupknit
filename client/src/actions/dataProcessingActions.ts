import { preprocessFileResponseSchema } from "@soupknit/model/src/workbookSchemas"

import { withClientContext } from "./actionRegistry"
import { api } from "./baseApi"
import { useEnv } from "@/lib/clientEnvironment"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"

import type { ClientActionRegistry } from "./actionRegistry"
import type { ClientEnvironment } from "@/lib/clientEnvironment"

// TODO: Fix any
export async function preprocessFile(env: ClientEnvironment, data: any) {
  console.log("Preprocessing file with", data)
  const url = `${env.serverUrl}/app/preprocess_file`
  const response = await api.post(url, data, {
    token: await getSupabaseAccessToken(),
  })
  // validate response with zod
  const parsedResponse = preprocessFileResponseSchema.parse(response)
  return parsedResponse
}

const allDataProcessingActions = {
  preprocessFile,
} as const satisfies ClientActionRegistry

export function useDataProcessingActions() {
  const env = useEnv()
  return withClientContext(allDataProcessingActions, env)
}
