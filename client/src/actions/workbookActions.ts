import { WorkbookDataSchema } from "@soupknit/model/src/workbookSchemas"
import { z } from "zod"

import { api } from "./baseApi"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"
import { isNonEmptyArray } from "@/lib/utils"

import type { ClientEnvironment } from "@/lib/clientEnvironment"
import type { PreProcessingColumnConfig } from "@soupknit/model/src/preprocessing"
import type {
  ActiveProject,
  Workbook,
  WorkbookConfig,
  WorkbookData,
  WorkbookDataFile,
} from "@soupknit/model/src/workbookSchemas"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function runProject(
  env: ClientEnvironment,
  data: { project: ActiveProject },
) {
  return await api.post(`${env.serverUrl}/app/workbook`, data, {
    token: await getSupabaseAccessToken(),
  })
}

export type AnalyzePostData = {
  taskType: string
  targetColumn: string
  fileUrl: string
  projectId: string
}

export async function analyzeFilePost(
  env: ClientEnvironment,
  data: AnalyzePostData,
) {
  return (await api.post(`${env.serverUrl}/app/analyze_file`, data, {
    token: await getSupabaseAccessToken(),
  })) as PreProcessingColumnConfig
}

export async function loadExistingWorkbook(
  supa: SupabaseClient,
  projectId: string,
) {
  if (!projectId) {
    throw new Error("No project ID provided")
  }
  console.log(`Fetching workbook data for project with ID: ${projectId}`)
  const { data } = await supa
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
  supa: SupabaseClient,
  projectId: string,
  file: WorkbookDataFile,
  preview_data?: any,
) {
  console.log(
    `Creating new workbook for project with ID: ${projectId} with data: `,
    file,
    preview_data,
  )
  const { data } = await supa
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

export async function updateWorkbookConfig(
  supa: SupabaseClient,
  args: { workbookId: string; config: WorkbookConfig },
) {
  const { workbookId, config } = args
  console.log(
    `Updating workbook config for workbook with ID: ${workbookId}: `,
    config,
  )
  const { data } = await supa
    .from("workbook_data")
    .update({
      config: config,
    })
    .eq("id", workbookId)
    .select()
    .throwOnError()
  return data
}

export async function saveWorkbookConfig(
  supa: SupabaseClient,
  workbookId: string,
  config: any,
) {
  const { data, error } = await supa
    .from("workbook_data")
    .update({ config: config })
    .eq("id", workbookId)

  if (error) throw error
  return data
}

export async function deleteProject(
  supa: SupabaseClient,
  workbook: ActiveProject,
) {
  console.log(`Starting deletion process for project: ${workbook}`)
  // //1. Fetch the workbooks associated with this project
  // const { data: workbooks, error: workbooksError } = await supa
  //   .from("workbooks")
  //   .select("id, file_url")
  //   .eq("project_id", projectId)
  // if (workbooksError) throw workbooksError

  // 2. Delete files from storage

  if (workbook.files?.length && workbook.files[0]?.file_url) {
    const filePathMatch = workbook.files[0]?.file_url.match(
      /\/storage\/v1\/object\/public\/workbook-files\/(.+)/,
    )
    if (filePathMatch) {
      const filePath = filePathMatch[1]
      if (!filePath) {
        throw new Error("Failed to extract file path from URL")
      }
      const { error: deleteFileError } = await supa.storage
        .from("workbook-files")
        .remove([filePath])
      if (deleteFileError) {
        console.error(
          `Failed to delete file for workbook ${workbook.projectId}:`,
          deleteFileError,
        )
      } else {
        console.log(`Deleted file for workbook ${workbook.projectId}`)
      }
    }
  }

  // // 3. Delete workbook data
  // await supa
  //   .from("workbook_data")
  //   .delete()
  //   .in(
  //     "workbook_id",
  //     workbooks.map((w) => w.id),
  //   )
  //   .throwOnError()

  // 5. Delete the project
  const { error: projectDeleteError } = await supa
    .from("projects")
    .delete()
    .eq("id", workbook.projectId)
    .throwOnError()
  if (projectDeleteError) throw projectDeleteError
  console.log(
    `Successfully deleted project ${workbook.projectId} and all associated data`,
  )
}
