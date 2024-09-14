import { WorkbookDataSchema } from "@soupknit/model/src/workbookSchemas"

import { withClientContext } from "./actionRegistry"
import { api } from "./baseApi"
import { useEnv } from "@/lib/clientEnvironment"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"
import { isNonEmptyArray } from "@/lib/utils"

import type { ClientActionRegistry } from "./actionRegistry"
import type { ClientEnvironment } from "@/lib/clientEnvironment"
import type {
  ActiveProject,
  WorkbookConfig,
  WorkbookDataFile,
} from "@soupknit/model/src/workbookSchemas"

/** @deprecated */
async function runProject(
  env: ClientEnvironment,
  data: { project: ActiveProject },
) {
  return await api.post(`${env.serverUrl}/app/workbook`, data, {
    token: await getSupabaseAccessToken(),
  })
}

async function loadExistingWorkbook(env: ClientEnvironment, projectId: string) {
  if (!projectId) {
    throw new Error("No project ID provided")
  }
  console.log(`Fetching workbook data for project with ID: ${projectId}`)
  const { data } = await env.supa
    .from("workbook_data")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .throwOnError()

  if (isNonEmptyArray(data)) {
    console.log("Raw workbook data:", data) // Log the raw data
    const parsedData = WorkbookDataSchema.parse(data[0])
    return parsedData
  }
  return null
}

export async function createNewWorkbook(
  env: ClientEnvironment,
  projectId: string,
  file: WorkbookDataFile,
  preview_data?: any,
) {
  console.log(
    `Creating new workbook for project with ID: ${projectId} with data: `,
    file,
    preview_data,
  )
  const { data } = await env.supa
    .from("workbook_data")
    .insert({
      project_id: projectId,
      files: [file],
      preview_data: preview_data,
    })
    .select()
    .single()
    .throwOnError()
  return data
}

async function updateWorkbookConfig(
  env: ClientEnvironment,
  args: { workbookId: string; config: WorkbookConfig },
) {
  const { workbookId, config } = args
  console.log(
    `Updating workbook config for workbook with ID: ${workbookId}: `,
    config,
  )
  const { data } = await env.supa
    .from("workbook_data")
    .update({
      config: config,
    })
    .eq("id", workbookId)
    .select()
    .throwOnError()
  return data
}

async function saveWorkbookConfig(
  env: ClientEnvironment,
  workbookId: string,
  config: any,
) {
  const { data, error } = await env.supa
    .from("workbook_data")
    .update({ config: config })
    .eq("id", workbookId)

  if (error) throw error
  return data
}

const allWorkbookActions = {
  saveWorkbookConfig,
  loadExistingWorkbook,
  createNewWorkbook,
  runProject,
  updateWorkbookConfig,
} as const satisfies ClientActionRegistry

export function useWorkbookActions() {
  const env = useEnv()
  return withClientContext(allWorkbookActions, env)
}
