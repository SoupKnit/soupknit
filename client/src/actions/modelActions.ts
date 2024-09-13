import { api } from "./baseApi"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"

import type { ClientEnvironment } from "@/lib/clientEnvironment"

export async function createModel(
  env: ClientEnvironment,
  data: { projectId: string; modelConfig: any },
) {
  console.log("Creating model with", data)
  const url = `${env.serverUrl}/app/create_model`
  const response = await api.post(url, data, {
    token: await getSupabaseAccessToken(),
  })

  // TODO: validate response with zod
  return response
}

export async function predict(
  env: ClientEnvironment,
  data: { projectId: string; inputData: Record<string, string> },
) {
  const url = `${env.serverUrl}/app/predict`

  const response = await api.post(url, data, {
    token: await getSupabaseAccessToken(),
  })

  return await response
}
