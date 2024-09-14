import { WorkbookDataSchema } from "@soupknit/model/src/workbookSchemas"
import { useMutation, useQueryClient } from "@tanstack/react-query"

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
  WorkbookData,
  WorkbookDataFile,
} from "@soupknit/model/src/workbookSchemas"
import type { MutationOptions } from "@tanstack/react-query"

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
    .order("updated_at", { ascending: false })
    .throwOnError()

  if (isNonEmptyArray(data)) {
    console.log("Raw workbook data:", data) // Log the raw data
    // validate the data with zod, and log any errors
    const validationResult = WorkbookDataSchema.safeParse(data[0])
    if (!validationResult.success) {
      console.error("Workbook data validation failed:", validationResult.error)
      throw new Error("Zod: Workbook data validation failed")
    }
    return validationResult.data
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", workbookId)
    .select("*")
    .single()
    .throwOnError()

  if (!data) {
    throw new Error("No data returned from updateWorkbookConfig")
  }

  return data as WorkbookData
}

const allWorkbookActions = {
  loadExistingWorkbook,
  createNewWorkbook,
  runProject,
  updateWorkbookConfig,
} as const satisfies ClientActionRegistry

export function useWorkbookActions() {
  const env = useEnv()
  return withClientContext(allWorkbookActions, env)
}

type WorkbookConfigMutationArgs = {
  projectId: string
  workbookId: string
  updatedConfig: WorkbookConfig
}

export function useWorkbookMutation(
  options: MutationOptions<WorkbookData, any, WorkbookConfigMutationArgs> = {},
) {
  const env = useEnv()
  const queryClient = useQueryClient()
  const updateWorkbookConfigMutation = useMutation({
    mutationFn: async ({
      projectId,
      workbookId,
      updatedConfig,
    }: WorkbookConfigMutationArgs) => {
      if (!workbookId || !projectId) {
        throw new Error("IDs are missing for saving config")
      }
      const updatedRow = await updateWorkbookConfig(env, {
        workbookId: workbookId,
        config: updatedConfig,
      })
      return updatedRow
    },
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData<WorkbookData>(
        ["workbook", variables.projectId],
        data,
      )
      options.onSuccess?.(data, variables, context)
    },
  })

  return updateWorkbookConfigMutation
}
