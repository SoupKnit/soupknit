import { useEffect, useState } from "react"
import Papa from "papaparse"

import * as workbookActions from "@/actions/workbookActions"
import { useSupa } from "@/lib/supabaseClient"
import { workbookStore } from "@/store/workbookStore"

/**
 * TODO: refactor needed here
 *   - This needs to tie in with the Workbook store, and jotai global state
 *   - This hook should also interface with react-query to keep the workbook state synced with the database
 *   - Split this hook into smaller hooks and functions. Only state management should be here
 *   - All other logic should be moved to actions/stores
 *
 * {@link workbookStore}
 * {@link workbookActions}
 */
export function useWorkbook(projectId: string) {
  const [csvData, setCSVData] = useState<Record<string, any>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [workbookId, setWorkbookId] = useState<string | null>(null)
  const [workbookName, setWorkbookName] = useState<string | null>(null)
  const [workbookFileType, setWorkbookFileType] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const supa = useSupa()

  useEffect(() => {
    if (projectId) {
      loadExistingWorkbook()
    }
    const fetchUserId = async () => {
      const {
        data: { user },
      } = await supa.auth.getUser()
      setUserId(user?.id)
    }
    fetchUserId()
  }, [projectId])

  const loadExistingWorkbook = async () => {
    try {
      const { data, error } = await supa
        .from("workbooks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        const workbook = data[0]
        setWorkbookId(workbook.id)
        setWorkbookName(workbook.name)
        setWorkbookFileType(workbook.file_type)
        await fetchFirstRows(workbook.id)
      }
    } catch (error) {
      console.error("Error loading existing workbook:", error)
      setError("Error loading existing workbook")
    }
  }

  const fetchFirstRows = async (workbookId: string) => {
    setLoading(true)

    try {
      const { data, error } = await supa
        .from("workbook_data")
        .select("preview_data")
        .eq("workbook_id", workbookId)
        .single()

      if (error) throw error

      if (data && data.preview_data) {
        setHeaders(Object.keys(data.preview_data[0]))
        setCSVData(data.preview_data)
      } else {
        setHeaders([])
        setCSVData([])
      }
    } catch (error) {
      console.error("Error fetching preview data:", error)
      setError(`Error fetching preview data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      if (!userId) {
        throw new Error("User ID not available")
      }

      const filePath = `${userId}/project-${projectId}/${Date.now()}_${file.name}`

      const { data: uploadData, error: uploadError } = await supa.storage
        .from("workbook-files")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
        error: urlError,
      } = supa.storage.from("workbook-files").getPublicUrl(uploadData.path)

      if (urlError) throw urlError

      const text = await file.text()
      const { data: parsedData, meta } = Papa.parse(text, { header: true })

      const previewData = parsedData.slice(0, 15)

      const { data: workbook, error: workbookError } = await supa
        .from("workbooks")
        .insert({
          project_id: projectId,
          name: file.name,
          file_url: publicUrl,
          file_type: file.name.split(".").pop(),
          status: "draft",
        })
        .select()
        .single()

      if (workbookError) throw workbookError

      const { error: insertError } = await supa.from("workbook_data").insert({
        workbook_id: workbook.id,
        preview_data: previewData,
      })

      if (insertError) throw insertError

      setHeaders(meta.fields || [])
      setCSVData(previewData)
      setWorkbookId(workbook.id)
      setWorkbookName(workbook.name)
      setWorkbookFileType(workbook.file_type)
    } catch (error) {
      console.error("Error processing file:", error)
      setError(`Error processing file: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (
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
        .from("projects")
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

  return {
    csvData,
    headers,
    loading,
    error,
    workbookId,
    workbookName,
    workbookFileType,
    handleFileSelect,
    fetchFirstRows,
    deleteProject,
  }
}
