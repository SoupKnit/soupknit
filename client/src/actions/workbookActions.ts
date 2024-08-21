import { WorkbookDataSchema } from "@soupknit/model/src/workbookSchemas"
import { z } from "zod"

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

// Modify the WorkbookDataSchema to allow null config
const WorkbookDataSchemaWithNullableConfig = WorkbookDataSchema.extend({
  config: z.object({}).nullish().optional(),
})

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

  if (data && data.length > 0) {
    console.log("Raw workbook data:", data[0]) // Log the raw data
    try {
      // Use the modified schema that allows null config
      const parsedData = WorkbookDataSchemaWithNullableConfig.parse(data[0])
      console.log("Parsed workbook data:", parsedData)
      return parsedData
    } catch (error) {
      console.error("Error parsing workbook data:", error)
      if (error instanceof z.ZodError) {
        console.error(
          "Zod error issues:",
          JSON.stringify(error.issues, null, 2),
        )
      }
      // Instead of throwing, return null or a default workbook structure
      return {
        id: data[0].id,
        project_id: data[0].project_id,
        files: data[0].files || [],
        preview_data: data[0].preview_data || [],
        config: null,
      }
    }
  } else {
    console.log("No workbook data found")
    return null
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

export async function loadWorkbookConfig(
  supa: SupabaseClient,
  workbookId: string,
) {
  const { data, error } = await supa
    .from("workbook_data")
    .select("config")
    .eq("id", workbookId)
    .single()

  if (error) throw error
  return data?.config
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
