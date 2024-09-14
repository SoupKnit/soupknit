import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAtom, useAtomValue } from "jotai"
import Papa from "papaparse"
import { toast } from "sonner"

import * as dataProcessingActions from "@/actions/dataProcessingActions"
import { useDataProcessingActions } from "@/actions/dataProcessingActions"
import * as modelActions from "@/actions/modelActions"
import { useModelActions } from "@/actions/modelActions"
import { usePreprocessingActions } from "@/actions/preprocessingActions"
import {
  useWorkbookActions,
  useWorkbookMutation,
} from "@/actions/workbookActions"
import { useEnv } from "@/lib/clientEnvironment"
import { isNonEmptyArray } from "@/lib/utils"
import { userSettingsStore } from "@/store/userSettingsStore"
import { projectDetailsStore, workbookConfigStore } from "@/store/workbookStore"

import type { AnalyzePostData } from "@/actions/preprocessingActions"
import type { WorkbookDataFile } from "@soupknit/model/src/workbookSchemas"

const useCreateWorkbook = (projectId: string) => {
  const { createNewWorkbook } = useWorkbookActions()
  return useMutation({
    mutationFn: async (data: { preview_data: any; file: WorkbookDataFile }) => {
      console.log("Creating new workbook", data)
      return await createNewWorkbook(projectId, data.file, data.preview_data)
    },
    onSuccess: (data) => {
      console.log("Workbook created successfully", data)
      toast.success("Workbook created successfully")
    },
    onError: (error) => {
      console.error("Error creating workbook:", error)
      toast.error("Failed to create workbook")
    },
  })
}

export const useAnalyzeFile = (workbookId: string) => {
  const { analyzeFilePost } = usePreprocessingActions()
  return useMutation({
    mutationFn: async (data: AnalyzePostData) => {
      console.log("fetching analyze file with", data)
      return analyzeFilePost(data)
    },
    onSuccess: (data) => {
      toast.success("File analysis completed successfully")
      console.log("File analysis result:", data)
    },
    onError: (error) => {
      toast.error(`Error analyzing file: ${error.message}`)
    },
  })
}

// move this to dataProcessingActions.ts
const usePreprocessFile = (projectId: string, workbookId: string) => {
  const { preprocessFile } = useDataProcessingActions()
  return useMutation({
    mutationFn: async (data: any) => {
      return await preprocessFile(data)
    },
    onSuccess: (data) => {
      if (data.preprocessedFileUrl) {
        // Update active file logic should be handled in a separate function or store
        console.log("Preprocessed file URL:", data.preprocessedFileUrl)
      }

      toast.success("File preprocessed successfully")
    },
    onError: (error) => {
      toast.error(`Error preprocessing file: ${error.message}`)
    },
  })
}

// move this to modelActions.ts
const useCreateModel = (projectId: string) => {
  const { createModel } = useModelActions()
  return useMutation({
    mutationFn: async (data: any) => {
      return await createModel(data)
    },
    onSuccess: (data) => {
      toast.success("Model created successfully")
      console.log("Model creation result:", data)
    },
    onError: (error) => {
      toast.error(`Error creating model: ${error.message}`)
    },
  })
}

// move this to modelActions.ts
const usePredictMutation = (projectId: string) => {
  const { predict } = useModelActions()
  return useMutation({
    mutationFn: async (inputData: Record<string, string>) => {
      return await predict({
        projectId,
        inputData,
      })
    },
    onSuccess: (data) => {
      // setPredictionResult should be handled in a separate function or store
      console.log("Prediction result:", data)
      toast.success("Prediction completed successfully")
    },
    onError: (error) => {
      console.error("Error running prediction:", error)
      toast.error("Error running prediction")
    },
  })
}

// this is actually analyzeFile and set config
export function useWorkbook(projectId: string, workbookId: string) {
  const [error, setError] = useState<string | null>(null)
  const env = useEnv()
  const projectDetails = useAtomValue(projectDetailsStore)
  const [userSettings] = useAtom(userSettingsStore)
  const [workbookConfig, setWorkbookConfig] = useAtom(workbookConfigStore)

  const createWorkbook = useCreateWorkbook(projectId)
  const analyzeFile = useAnalyzeFile(workbookId)
  const preprocessFile = usePreprocessFile(projectId, workbookId)
  const createModel = useCreateModel(projectId)
  const predictMutation = usePredictMutation(projectId)

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)

    try {
      const filePath = `${userSettings.userId}/project-${projectId}/${Date.now()}_${file.name}`

      // TODO: move this to a new fileActions.ts
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

      // setActiveFileWithPreview should be handled in a separate function or store
      console.log("File uploaded:", {
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
          projectId,
        })
      } else {
        console.warn(
          "Workbook config is missing taskType or targetColumn. Skipping file analysis.",
        )
      }
    } catch (error: any) {
      console.error("Error processing file:", error)
      setError(`Error processing file: ${error.message}`)
    }
  }

  return {
    error,
    handleFileUpload,
    preprocessFile,
    createModel,
    predictMutation,
  }
}
