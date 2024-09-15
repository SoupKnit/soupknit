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
  useUpdateWorkbook,
  useWorkbookActions,
} from "@/actions/workbookActions"
import { useEnv } from "@/lib/clientEnvironment"
import { isNonEmptyArray } from "@/lib/utils"
import { userSettingsStore } from "@/store/userSettingsStore"
import { projectDetailsStore, workbookConfigStore } from "@/store/workbookStore"

import type { AnalyzePostData } from "@/actions/preprocessingActions"
import type { WorkbookDataFile } from "@soupknit/model/src/workbookSchemas"

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
  const [userSettings] = useAtom(userSettingsStore)
  const preprocessFile = usePreprocessFile(projectId, workbookId)
  const createModel = useCreateModel(projectId)
  const predictMutation = usePredictMutation(projectId)

  return {
    error,
    // handleFileUpload,
    preprocessFile,
    createModel,
    predictMutation,
  }
}
