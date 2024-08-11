import { WorkbookDataSchema } from "@soupknit/model/src/workbookSchemas"

import { api } from "./baseApi"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"
import { WorkbookConfig } from "@/store/workbookStore"

import type { ClientEnvironment } from "@/lib/clientEnvironment"
import type { DBWorkbookData } from "@soupknit/model/src/dbTables"
import type {
  ActiveProject,
  Workbook,
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
    .limit(1)
    .throwOnError()

  if (data) {
    if (data.length === 0) {
      return null
    }
    return WorkbookDataSchema.parse(data[0])
  } else {
    throw new Error("No workbook data found")
  }
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

export async function deleteProject(supa: SupabaseClient, projectId: string) {
  console.log(`Starting deletion process for project with ID: ${projectId}`)
  // 1. Fetch the workbooks associated with this project
  // const { data: workbooks, error: workbooksError } = await supa
  //   .from("workbooks")
  //   .select("id, file_url")
  //   .eq("project_id", projectId)
  // if (workbooksError) throw workbooksError

  // // 2. Delete files from storage
  // for (const workbook of workbooks) {
  //   if (workbook.file_url) {
  //     const filePathMatch = workbook.file_url.match(
  //       /\/storage\/v1\/object\/public\/workbook-files\/(.+)/,
  //     )
  //     if (filePathMatch) {
  //       const filePath = filePathMatch[1]
  //       const { error: deleteFileError } = await supa.storage
  //         .from("workbook-files")
  //         .remove([filePath])
  //       if (deleteFileError) {
  //         console.error(
  //           `Failed to delete file for workbook ${workbook.id}:`,
  //           deleteFileError,
  //         )
  //       } else {
  //         console.log(`Deleted file for workbook ${workbook.id}`)
  //       }
  //     }
  //   }
  // }

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
    .eq("id", projectId)
    .throwOnError()
  if (projectDeleteError) throw projectDeleteError
  console.log(
    `Successfully deleted project ${projectId} and all associated data`,
  )
}
