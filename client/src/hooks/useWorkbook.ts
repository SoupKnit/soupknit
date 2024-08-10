import { useEffect, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import Papa from "papaparse"
import { toast } from "sonner"

import * as workbookActions from "@/actions/workbookActions"
import { loadExistingWorkbook } from "@/actions/workbookActions"
import { useEnv } from "@/lib/clientEnvironment"
import { userSettingsStore } from "@/store/userSettingsStore"
import { activeProjectAndWorkbook, workbookStore } from "@/store/workbookStore"

import type { WorkbookDataFile } from "@soupknit/model/src/workbookSchemas"

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
export function useWorkbook(_projectId: string) {
  const [csvData, setCSVData] = useState<Record<string, any>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  // const [workbookId, setWorkbookId] = useState<string | null>(null)
  // const [workbookName, setWorkbookName] = useState<string | null>(null)
  // const [workbookFileType, setWorkbookFileType] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const env = useEnv()
  const [projectWorkbook, setProjectAndWorkbook] = useAtom(
    activeProjectAndWorkbook,
  )
  const [workbook] = useAtom(workbookStore)
  const [userSettings] = useAtom(userSettingsStore)

  const workbookQuery = useQuery({
    queryKey: ["workbook", _projectId, env.supa],
    queryFn: async () => {
      return await loadExistingWorkbook(env.supa, _projectId)
    },
  })

  const createWorkbook = useMutation({
    mutationFn: async (data: { preview_data: any; file: WorkbookDataFile }) => {
      return await workbookActions.createNewWorkbook(
        env.supa,
        _projectId,
        data.file,
        data.preview_data,
      )
    },
    onSuccess: (data) => {
      toast("Workbook created successfully")
    },
  })

  useEffect(() => {
    if (workbookQuery.isFetched && workbookQuery.isSuccess) {
      const data = workbookQuery.data
      if (!data || !data.id || !data.project_id) {
        toast.warning("No workbook / error fetching workbook")
        return
      }
      toast("Loading workbook...")
      setProjectAndWorkbook({
        projectId: data.project_id,
        workbookId: data.id,
        files: data.files?.map((f) => ({
          name: f.name,
          file_url: f.file_url,
          file_type: f.file_type,
        })),
      })
      if (
        data &&
        data.preview_data &&
        data.preview_data instanceof Array &&
        isNonEmptyArray(data.preview_data)
      ) {
        setHeaders(Object.keys(data.preview_data[0] as any))
        setCSVData(data.preview_data as any)
      } else {
        setHeaders([])
        setCSVData([])
      }
    }
  }, [workbookQuery.isFetched, workbookQuery.data, setProjectAndWorkbook])

  // setWorkbookId(workbook.id)
  // setWorkbookName(workbook.name)
  // setWorkbookFileType(workbook.file_type)

  // const fetchFirstRows = async (workbookId: string) => {
  //   setLoading(true)

  //   try {
  //     // use react-query
  //     // const { data, error } = await supa
  //     //   .from("workbook_data")
  //     //   .select("preview_data")
  //     //   .eq("workbook_id", workbookId)
  //     //   .single()

  //     if (error) throw error

  //     if (data && data.preview_data) {
  //       setHeaders(Object.keys(data.preview_data[0]))
  //       setCSVData(data.preview_data)
  //     } else {
  //       setHeaders([])
  //       setCSVData([])
  //     }
  //   } catch (error) {
  //     console.error("Error fetching preview data:", error)
  //     setError(`Error fetching preview data: ${error.message}`)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log("Uploading file:", file)

    setLoading(true)
    setError(null)

    try {
      const filePath = `${userSettings.userId}/project-${projectWorkbook?.projectId}/${Date.now()}_${file.name}`

      const { data: uploadData, error: uploadError } = await env.supa.storage
        .from("workbook-files")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = env.supa.storage.from("workbook-files").getPublicUrl(uploadData.path)

      const text = await file.text()
      const { data: parsedData, meta } = Papa.parse(text, { header: true })
      setHeaders(meta.fields ?? [])
      const previewData = parsedData.slice(0, 15)
      setCSVData(previewData as any) // fix types

      // react-query mutation
      createWorkbook.mutate({
        preview_data: previewData,
        file: {
          name: file.name,
          file_url: publicUrl,
          file_type: file.type,
        },
      })
    } catch (error: any) {
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
    handleFileUpload,
    // workbookId,
    // workbookName,
    // workbookFileType,
    // fetchFirstRows,
    // deleteProject,
  }
}

function isNonEmptyArray<T>(arr: T[] | null | undefined): arr is T[] {
  return Array.isArray(arr) && arr.length > 0
}
