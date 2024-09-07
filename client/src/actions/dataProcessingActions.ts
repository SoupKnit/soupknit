import { preprocessFileResponseSchema } from "@soupknit/model/src/workbookSchemas"

import { api } from "./baseApi"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"

import type { ClientEnvironment } from "@/lib/clientEnvironment"

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
