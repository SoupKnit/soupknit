import { SupabaseClient } from "@supabase/supabase-js"

import { useSupa } from "@/lib/supabaseClient"
import { PreprocessingConfig } from "@/types/preprocessing"

export const fetchPreprocessingConfig =
  async (): Promise<PreprocessingConfig> => {
    // This is our hardcoded JSON for now
    // In a real application, this would be an API call
    return {
      global_preprocessing: ["drop_missing", "pca"],
      global_params: {
        n_components: 0.95,
      },
      columns: [
        {
          name: "Column1",
          type: "numeric",
          imputation: "mean",
          scaling: "standard",
          params: {},
        },
        {
          name: "Column2",
          type: "categorical",
          encoding: "onehot",
          params: {},
        },
        // Add more columns as needed
      ],
    }
  }

export const deleteProject = async (
  supa: SupabaseClient,
  projectId: string,
): Promise<void> => {
  try {
    console.log(`Starting deletion process for project with ID: ${projectId}`)
    // 1. Fetch the workbooks associated with this project
    const { data: workbooks, error: workbooksError } = await supa
      .from("workbooks")
      .select("id, file_url")
      .eq("project_id", projectId)
    if (workbooksError) throw workbooksError

    // 2. Delete files from storage
    for (const workbook of workbooks) {
      if (workbook.file_url) {
        const filePathMatch = workbook.file_url.match(
          /\/storage\/v1\/object\/public\/workbook-files\/(.+)/,
        )
        if (filePathMatch) {
          const filePath = filePathMatch[1]
          const { error: deleteFileError } = await supa.storage
            .from("workbook-files")
            .remove([filePath])
          if (deleteFileError) {
            console.error(
              `Failed to delete file for workbook ${workbook.id}:`,
              deleteFileError,
            )
          } else {
            console.log(`Deleted file for workbook ${workbook.id}`)
          }
        }
      }
    }

    // 3. Delete workbook data
    const { error: workbookDataError } = await supa
      .from("workbook_data")
      .delete()
      .in(
        "workbook_id",
        workbooks.map((w) => w.id),
      )
    if (workbookDataError) throw workbookDataError
    console.log("Deleted associated workbook data")

    // 4. Delete workbooks
    const { error: workbooksDeleteError } = await supa
      .from("workbooks")
      .delete()
      .eq("project_id", projectId)
    if (workbooksDeleteError) throw workbooksDeleteError
    console.log("Deleted associated workbooks")

    // 5. Delete the project
    const { error: projectDeleteError } = await supa
      .from("Projects")
      .delete()
      .eq("id", projectId)
    if (projectDeleteError) throw projectDeleteError
    console.log(
      `Successfully deleted project ${projectId} and all associated data`,
    )
  } catch (error) {
    console.error("Error in deleteProject:", error)
    throw new Error(`Failed to delete project: ${error.message}`)
  }
}
