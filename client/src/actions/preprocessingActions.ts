import { withClientContext } from "./actionRegistry"
import { api } from "./baseApi"
import { useEnv } from "@/lib/clientEnvironment"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"

import type { ClientEnvironment } from "@/lib/clientEnvironment"
import type { PreProcessingColumnConfig } from "@soupknit/model/src/preprocessing"

export type AnalyzePostData = {
  taskType: string
  targetColumn: string
  fileUrl: string
  projectId: string
}

async function analyzeFilePost(env: ClientEnvironment, data: AnalyzePostData) {
  return (await api.post(`${env.serverUrl}/app/analyze_file`, data, {
    token: await getSupabaseAccessToken(),
  })) as PreProcessingColumnConfig
}

const allPreprocessingActions = {
  analyzeFilePost,
} as const

export function usePreprocessingActions() {
  const env = useEnv()
  return withClientContext(allPreprocessingActions, env)
}
