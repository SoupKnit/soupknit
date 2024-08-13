import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAtom } from "jotai"
import Papa from "papaparse"
import { toast } from "sonner"

import * as workbookActions from "@/actions/workbookActions"
import { loadExistingWorkbook } from "@/actions/workbookActions"
import { useEnv } from "@/lib/clientEnvironment"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"
import { userSettingsStore } from "@/store/userSettingsStore"
import {
  activeProjectAndWorkbook,
  workbookConfigStore,
  workbookStore,
} from "@/store/workbookStore"

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
  const [workbookConfig, setWorkbookConfig] = useAtom(workbookConfigStore)
  const queryClient = useQueryClient()

  // Add a new mutation for saving the workbook config
  const saveWorkbookConfig = useMutation({
    mutationFn: async (config: any) => {
      if (!projectWorkbook?.workbookId) {
        throw new Error("No workbook ID found for saving config")
      }
      return await workbookActions.saveWorkbookConfig(
        env.supa,
        projectWorkbook.workbookId,
        config,
      )
    },
    onSuccess: () => {
      toast.success("Workbook configuration saved successfully")
    },
    onError: (error) => {
      toast.error(`Error saving workbook configuration: ${error.message}`)
    },
  })

  // Add a new query for loading the workbook config
  const workbookConfigQuery = useQuery({
    queryKey: ["workbookConfig", projectWorkbook?.workbookId],
    queryFn: async () => {
      if (!projectWorkbook?.workbookId) {
        throw new Error("No workbook ID found for loading config")
      }
      return await workbookActions.loadWorkbookConfig(
        env.supa,
        projectWorkbook.workbookId,
      )
    },
    enabled: !!projectWorkbook?.workbookId,
  })

  // Effect to save workbook config when component unmounts
  useEffect(() => {
    return () => {
      if (projectWorkbook?.workbookId && workbookConfig) {
        saveWorkbookConfig.mutate(workbookConfig)
      }
    }
  }, [projectWorkbook?.workbookId, workbookConfig])

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
      toast.success("Workbook created successfully")
    },
  })

  // Effect to update local state when workbook is fetched
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
        data.preview_data &&
        Array.isArray(data.preview_data) &&
        data.preview_data.length > 0
      ) {
        setHeaders(Object.keys(data.preview_data[0]))
        setCSVData(data.preview_data)
      } else {
        setHeaders([])
        setCSVData([])
      }
      // Set the workbook config if it exists
      if (data.config) {
        setWorkbookConfig(data.config)
      }
    }
  }, [
    workbookQuery.isFetched,
    workbookQuery.data,
    setProjectAndWorkbook,
    setWorkbookConfig,
  ])

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

  const analyzeFile = useMutation({
    mutationFn: async (data: {
      taskType: string
      targetColumn: string
      fileUrl: string
      projectId: string
    }) => {
      console.log("fetching analyze file with", data)
      const response = await fetch(`${env.serverUrl}/app/analyze_file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getSupabaseAccessToken()}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error("Failed to analyze file")
      }
      return response.json()
    },
    onSuccess: (data) => {
      toast.success("File analysis completed successfully")
      console.log("File analysis result:", data)
      // Invalidate the workbook config query to trigger a refetch
      if (projectWorkbook?.workbookId) {
        queryClient.invalidateQueries([
          "workbookConfig",
          projectWorkbook.workbookId,
        ])
      }
    },
    onError: (error) => {
      toast.error(`Error analyzing file: ${error.message}`)
    },
  })

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

      // Create workbook
      await createWorkbook.mutateAsync({
        preview_data: previewData,
        file: {
          name: file.name,
          file_url: publicUrl,
          file_type: file.type,
        },
      })

      // Analyze file
      if (
        workbookConfig &&
        workbookConfig.taskType &&
        workbookConfig.targetColumn
      ) {
        await analyzeFile.mutateAsync({
          taskType: workbookConfig.taskType,
          targetColumn: workbookConfig.targetColumn,
          fileUrl: publicUrl,
        })
      } else {
        console.warn(
          "Workbook config is missing taskType or targetColumn. Skipping file analysis.",
        )
      }
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
    analyzeFile,
    projectWorkbook,
    saveWorkbookConfig,
    workbookConfigQuery,
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
