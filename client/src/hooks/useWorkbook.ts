import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import Papa from "papaparse"
import { toast } from "sonner"

import * as dataProcessingActions from "@/actions/dataProcessingActions"
import * as modelActions from "@/actions/modelActions"
import * as workbookActions from "@/actions/workbookActions"
import { analyzeFilePost } from "@/actions/workbookActions"
import { useEnv } from "@/lib/clientEnvironment"
import { getSupabaseAccessToken } from "@/lib/supabaseClient"
import { isNonEmptyArray } from "@/lib/utils"
import { userSettingsStore } from "@/store/userSettingsStore"
import {
  activeProjectAndWorkbook,
  setActiveFileWithPreviewAtom,
  setDataPreviewAtom,
  workbookConfigStore,
} from "@/store/workbookStore"

import type { AnalyzePostData } from "@/actions/workbookActions"
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
 * @deprecated
 */
export function useWorkbook(_projectId: string) {
  const [error, setError] = useState<string | null>(null)
  const env = useEnv()
  const projectWorkbook = useAtomValue(activeProjectAndWorkbook)
  const [userSettings] = useAtom(userSettingsStore)
  const [workbookConfig, setWorkbookConfig] = useAtom(workbookConfigStore)
  const [predictionResult, setPredictionResult] = useState<any>(null) // TODO: no local state for prediction result
  const setActiveFileWithPreview = useSetAtom(setActiveFileWithPreviewAtom)
  const setDataPreview = useSetAtom(setDataPreviewAtom)

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
      queryClient.invalidateQueries({
        queryKey: ["workbook", _projectId, env.supa],
      })
    },
    onError: (error) => {
      console.error("Error creating workbook:", error)
      toast.error("Failed to create workbook")
    },
  })

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
    mutationFn: async (data: AnalyzePostData) => {
      console.log("fetching analyze file with", data)
      const response = analyzeFilePost(env, data)

      return response
    },
    onSuccess: (data) => {
      toast.success("File analysis completed successfully")
      console.log("File analysis result:", data)
      // Invalidate the workbook config query to trigger a refetch
      if (projectWorkbook?.workbookId) {
        queryClient.invalidateQueries({
          queryKey: ["workbookConfig", projectWorkbook.workbookId],
        })
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
      return await dataProcessingActions.preprocessFile(env, data)
    },
    onSuccess: (data) => {
      // Update the active file to the preprocessed file
      if (data.preprocessedFileUrl) {
        setActiveFileWithPreview({
          name:
            data.preprocessedFileUrl.split("/").pop() ||
            "preprocessed_file.csv",
          file_url: data.preprocessedFileUrl,
          file_type: "text/csv",
          preview: data.previewDataPreprocessed,
        })
      }

      // Update the workbook config with the new preprocessing config
      setWorkbookConfig((prevConfig) => ({
        ...prevConfig,
        preProcessingConfig:
          data.preProcessingConfig || prevConfig.preProcessingConfig,
      }))

      // Invalidate the workbook query to trigger a refetch
      if (projectWorkbook?.projectId) {
        queryClient.invalidateQueries({
          queryKey: ["workbook", projectWorkbook.projectId, env.supa],
        })
      }

      // Invalidate the workbook config query to trigger a refetch
      if (projectWorkbook?.workbookId) {
        queryClient.invalidateQueries({
          queryKey: ["workbookConfig", projectWorkbook.workbookId],
        })
      }
    },
    onError: (error) => {
      toast.error(`Error preprocessing file: ${error.message}`)
      setError(`Error preprocessing file: ${error.message}`)
    },
  })

  const createModel = useMutation({
    mutationFn: async (data: any) => {
      return await modelActions.createModel(env, data)
    },
    onSuccess: (data) => {
      toast.success("Model created successfully")
      console.log("Model creation result:", data)

      // Update the workbook config with the new model results
      setWorkbookConfig((prevConfig) => ({
        ...prevConfig,
        modelResults: data,
      }))

      // Invalidate the workbook query to trigger a refetch
      if (_projectId) {
        queryClient.invalidateQueries({
          queryKey: ["workbook", _projectId, env.supa],
        })
      }

      // Invalidate the workbook config query to trigger a refetch
      queryClient.invalidateQueries({
        queryKey: ["workbookConfig", _projectId],
      })
    },
    onError: (error) => {
      toast.error(`Error creating model: ${error.message}`)
    },
  })

  const predictMutation = useMutation({
    mutationFn: async (inputData: Record<string, string>) => {
      return await modelActions.predict(env, {
        projectId: _projectId,
        inputData,
      })
    },
    onSuccess: (data) => {
      setPredictionResult(data)
      toast.success("Prediction completed successfully")
    },
    onError: (error) => {
      console.error("Error running prediction:", error)
      toast.error("Error running prediction")
    },
  })

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

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

      if (!isNonEmptyArray(parsedData)) {
        throw new Error("Failed to parse file data")
      }

      setActiveFileWithPreview({
        name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        preview: parsedData as Record<string, any>[],
      })

      console.log("File uploaded:", {
        csvDataLength: parsedData.length,
        headers: meta.fields,
      })

      // Create workbook
      await createWorkbook.mutateAsync({
        preview_data: parsedData,
        file: {
          name: file.name,
          file_url: publicUrl,
          file_type: file.type,
        },
      })

      // Analyze file
      if (workbookConfig?.taskType && workbookConfig?.targetColumn) {
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
      queryClient.invalidateQueries({
        queryKey: ["workbook", _projectId, env.supa],
      })
    } catch (error: any) {
      console.error("Error processing file:", error)
      setError(`Error processing file: ${error.message}`)
    }
  }

  return {
    error,
    handleFileUpload,
    analyzeFile,
    projectWorkbook,
    saveWorkbookConfig,
    preprocessFile,
    setWorkbookConfig,
    createModel,
    predictMutation,
  }
}
