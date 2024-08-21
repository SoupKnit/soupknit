import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAtom, useSetAtom } from "jotai"
import Papa from "papaparse"
import { toast } from "sonner"

import * as workbookActions from "@/actions/workbookActions"
import { loadExistingWorkbook } from "@/actions/workbookActions"
import { useEnv } from "@/lib/clientEnvironment"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"
import { userSettingsStore } from "@/store/userSettingsStore"
import {
  activeFileAtom,
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
  const setActiveFile = useSetAtom(activeFileAtom)
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
      console.log("Fetching workbook for project:", _projectId)
      const workbook = await loadExistingWorkbook(env.supa, _projectId)
      console.log("Fetched workbook:", workbook)
      if (workbook && workbook.files && workbook.files.length > 0) {
        return workbook
      }
      return null
    },
    enabled: !!_projectId,
  })

  const createWorkbook = useMutation({
    mutationFn: async (data: { preview_data: any; file: WorkbookDataFile }) => {
      console.log("Creating new workbook", data)
      return await workbookActions.createNewWorkbook(
        env.supa,
        _projectId,
        data.file,
        data.preview_data,
      )
    },
    onSuccess: (data) => {
      console.log("Workbook created successfully", data)
      toast.success("Workbook created successfully")
      queryClient.invalidateQueries(["workbook", _projectId, env.supa])
    },
    onError: (error) => {
      console.error("Error creating workbook:", error)
      toast.error("Failed to create workbook")
    },
  })

  // Effect to update local state when workbook is fetched
  useEffect(() => {
    if (workbookQuery.isFetched && workbookQuery.isSuccess) {
      const data = workbookQuery.data
      console.log("Workbook query data:", data)
      if (data && data.id && data.project_id) {
        console.log("Setting workbook data")
        toast.success("Workbook loaded successfully")
        setProjectAndWorkbook({
          projectId: data.project_id,
          workbookId: data.id,
          files: data.files?.map((f) => ({
            name: f.name,
            file_url: f.file_url,
            file_type: f.file_type,
          })),
        })

        // Prioritize preprocessed data if available
        if (
          data.preview_data_preprocessed &&
          Array.isArray(data.preview_data_preprocessed) &&
          data.preview_data_preprocessed.length > 0
        ) {
          setHeaders(Object.keys(data.preview_data_preprocessed[0]))
          setCSVData(data.preview_data_preprocessed)
        } else if (
          data.preview_data &&
          Array.isArray(data.preview_data) &&
          data.preview_data.length > 0
        ) {
          setHeaders(Object.keys(data.preview_data[0]))
          setCSVData(data.preview_data)
        }

        if (data.config) {
          setWorkbookConfig((prevConfig) => ({
            ...prevConfig,
            ...data.config,
            preProcessingConfig:
              prevConfig.preProcessingConfig || data.config.preProcessingConfig,
          }))
        }
      } else {
        console.log("No existing workbook found")
        toast.info("No existing workbook found")
      }
    }
  }, [
    workbookQuery.isFetched,
    workbookQuery.data,
    setProjectAndWorkbook,
    setWorkbookConfig,
    setCSVData,
    setHeaders,
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

  // Update the preprocessFile mutation
  const preprocessFile = useMutation({
    mutationFn: async (data: {
      taskType: string
      targetColumn: string | null
      preProcessingConfig: any
      projectId: string
    }) => {
      console.log("Preprocessing file with", data)
      const response = await fetch(`${env.serverUrl}/app/preprocess_file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getSupabaseAccessToken()}`,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to preprocess file")
      }
      return response.json()
    },
    onSuccess: (data) => {
      toast.success("File preprocessing completed successfully")
      console.log("File preprocessing result:", data)

      // Update the active file to the preprocessed file
      if (data.preprocessedFileUrl) {
        setActiveFile({
          name:
            data.preprocessedFileUrl.split("/").pop() ||
            "preprocessed_file.csv",
          file_url: data.preprocessedFileUrl,
          file_type: "text/csv",
        })
      }

      // Update the preview data
      if (data.previewDataPreprocessed) {
        setCSVData(data.previewDataPreprocessed)
        if (data.previewDataPreprocessed.length > 0) {
          setHeaders(Object.keys(data.previewDataPreprocessed[0]))
        }
      }

      // Update the workbook config with the new preprocessing config
      setWorkbookConfig((prevConfig) => ({
        ...prevConfig,
        preProcessingConfig:
          data.preProcessingConfig || prevConfig.preProcessingConfig,
      }))

      // Invalidate the workbook query to trigger a refetch
      if (projectWorkbook?.projectId) {
        queryClient.invalidateQueries([
          "workbook",
          projectWorkbook.projectId,
          env.supa,
        ])
      }

      // Invalidate the workbook config query to trigger a refetch
      if (projectWorkbook?.workbookId) {
        queryClient.invalidateQueries([
          "workbookConfig",
          projectWorkbook.workbookId,
        ])
      }
    },
    onError: (error) => {
      toast.error(`Error preprocessing file: ${error.message}`)
      setError(`Error preprocessing file: ${error.message}`)
    },
  })

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

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
      setCSVData(previewData as any)

      const newActiveFile = {
        name: file.name,
        file_url: publicUrl,
        file_type: file.type,
      }
      setActiveFile(newActiveFile)

      console.log("File uploaded:", {
        newActiveFile,
        csvDataLength: previewData.length,
        headers: meta.fields,
      })

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
          projectId: _projectId,
        })
      } else {
        console.warn(
          "Workbook config is missing taskType or targetColumn. Skipping file analysis.",
        )
      }
      // Refetch the workbook query to update the UI
      queryClient.invalidateQueries(["workbook", _projectId, env.supa])
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
    workbookQuery,
    preprocessFile,
    setCSVData,
    setHeaders,
    setWorkbookConfig,
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
