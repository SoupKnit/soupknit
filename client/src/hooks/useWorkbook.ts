import { useEffect, useState } from "react"
import Papa from "papaparse"

import supa from "@/lib/supabaseClient"

export function useWorkbook(projectId: string) {
  const [csvData, setCSVData] = useState<Record<string, any>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [workbookId, setWorkbookId] = useState<string | null>(null)
  const [workbookName, setWorkbookName] = useState<string | null>(null)
  const [workbookFileType, setWorkbookFileType] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

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
        .eq("project_id", parseInt(projectId))
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
          project_id: parseInt(projectId),
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
  }
}
