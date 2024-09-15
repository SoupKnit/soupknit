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

type CreateNewWorkbookArgs = Omit<
  Partial<WorkbookData>,
  "project_id" | "config"
> & {
  project_id: string
  config: Partial<WorkbookConfig>
}

export async function createNewWorkbook(
  env: ClientEnvironment,
  workbookData: CreateNewWorkbookArgs,
) {
  if (!workbookData.project_id) {
    throw new Error("Project ID is required to create a new workbook")
  }
  console.log(
    `Creating new workbook for project with ID: ${workbookData.project_id} with data: `,
    workbookData,
  )

  // add defaults for required fields
  const workbookDataToInsert: Omit<
    WorkbookData,
    "id" | "updated_at" | "created_at" | "created_by"
  > = {
    files: [],
    preview_data: [],
    preview_data_preprocessed: [],
    ...workbookData, // merge with the workbookData passed in
    config: {
      featureColumns: [],
      targetColumn: null,
      taskType: null,
      preProcessingConfig: {
        global_preprocessing: [],
        columns: [],
        global_params: {},
      },
      modelParams: {},
      modelResults: {},
      ...workbookData.config, // merge with the workbookData.config passed in
    },
  }

  const { data } = await env.supa
    .from("workbook_data")
    .insert(workbookDataToInsert)
    .select()
    .single()
    .throwOnError()
  if (!data) {
    throw new Error("No data returned from createNewWorkbook")
  }
  console.log("Created new workbook:", data)
  return data as WorkbookData
}

async function updateWorkbook(
  env: ClientEnvironment,
  args: {
    workbookId: string
    updatedData?: Partial<WorkbookData>
    config?: WorkbookConfig
  },
) {
  const { workbookId, updatedData, config } = args
  console.log(
    `Updating workbook ID: ${workbookId} with data ${JSON.stringify(updatedData)} and config ${JSON.stringify(config)}`,
  )
  const updatedConfig = config ? { config: config } : {}
  const { data } = await env.supa
    .from("workbook_data")
    .update({
      ...updatedData,
      ...{ config: updatedConfig },
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
  updateWorkbook,
} as const satisfies ClientActionRegistry

export function useWorkbookActions() {
  const env = useEnv()
  return withClientContext(allWorkbookActions, env)
}

type WorkbookConfigMutationArgs = {
  workbookId: string
  updatedConfig: WorkbookConfig
}

type WorkbookDataMutationArgs = {
  workbookId: string
  updatedData: Partial<WorkbookData>
}

export function useUpdateWorkbook(args: {
  projectId: string
  updateConfigOptions?: MutationOptions<
    WorkbookData,
    any,
    WorkbookConfigMutationArgs
  >
  updateDataOptions?: MutationOptions<
    WorkbookData,
    any,
    WorkbookDataMutationArgs
  >
  optimisticUpdate?: boolean
}) {
  const env = useEnv()
  const queryClient = useQueryClient()
  const optimisticUpdate = args.optimisticUpdate === false ? false : true
  const setCacheData = (data: WorkbookData) => {
    queryClient.setQueryData<WorkbookData>(["workbook", args.projectId], data)
  }
  const updateWorkbookConfigMutation = useMutation({
    mutationFn: async ({
      workbookId,
      updatedConfig,
    }: WorkbookConfigMutationArgs) => {
      const updatedRow = await updateWorkbook(env, {
        workbookId: workbookId,
        config: updatedConfig,
      })
      return updatedRow
    },
    ...args.updateConfigOptions,
    onSuccess: (data, variables, context) => {
      optimisticUpdate && setCacheData(data)
      args.updateConfigOptions?.onSuccess?.(data, variables, context)
    },
  })

  const updateWorkbookDataMutation = useMutation({
    mutationFn: async ({
      workbookId,
      updatedData,
    }: WorkbookDataMutationArgs) => {
      return await updateWorkbook(env, {
        workbookId,
        updatedData,
      })
    },
    ...args.updateDataOptions,
    onSuccess: (data, variables, context) => {
      optimisticUpdate && setCacheData(data)
      args.updateDataOptions?.onSuccess?.(data, variables, context)
    },
  })
  return { updateWorkbookConfigMutation, updateWorkbookDataMutation }
}

export const useCreateWorkbook = (
  projectId: string,
  options: MutationOptions<
    WorkbookData,
    any,
    Omit<CreateNewWorkbookArgs, "project_id">
  > = {},
) => {
  const env = useEnv()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<CreateNewWorkbookArgs, "project_id">) => {
      console.log("Creating new workbook", data)
      return await createNewWorkbook(env, {
        project_id: projectId,
        ...data,
      })
    },
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData<WorkbookData>(["workbook", projectId], data)
      options.onSuccess?.(data, variables, context)
    },
  })
}
