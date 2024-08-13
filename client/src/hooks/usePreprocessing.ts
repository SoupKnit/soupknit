import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"

import { fetchPreprocessingConfig } from "@/api/preprocessing"
import { useWorkbook } from "@/hooks/useWorkbook"
import { useEnv } from "@/lib/clientEnvironment"
import { workbookConfigStore } from "@/store/workbookStore"

import type {
  CategoricalEncodingMethod,
  GlobalPreprocessingOption,
  NumericImputationMethod,
  NumericScalingMethod,
  PreProcessingColumnConfig,
} from "@soupknit/model/src/preprocessing"
import type { WorkbookConfig } from "@soupknit/model/src/workbookSchemas"

export function useFetchPreprocessing(headers: string[], projectId: string) {
  const { supa } = useEnv()
  const [_, setWorkbookConfig] = useAtom(workbookConfigStore)
  const { workbookConfigQuery } = useWorkbook(projectId)

  const { data: fetchedDefaultConfig } = useQuery({
    queryKey: ["defaultPreProcessingConfig", supa],
    queryFn: async () => fetchPreprocessingConfig(supa),
    enabled: !workbookConfigQuery.data, // Only fetch default if no saved config
  })

  useEffect(() => {
    if (workbookConfigQuery.data && headers.length > 0) {
      // Use the saved workbook configuration
      setWorkbookConfig((prev: any) => ({
        ...prev,
        preProcessingConfig: workbookConfigQuery.data.preProcessingConfig || {},
      }))
    } else if (fetchedDefaultConfig && headers.length > 0) {
      // Fall back to default configuration if no saved config exists
      setWorkbookConfig((prev: any) => ({
        ...prev,
        preProcessingConfig: fetchedDefaultConfig,
      }))
    }
  }, [
    workbookConfigQuery.data,
    fetchedDefaultConfig,
    headers,
    setWorkbookConfig,
  ])
}

export function usePreProcessing() {
  const [_, setWorkbookConfig] = useAtom(workbookConfigStore)

  const handleGlobalPreprocessingChange = (change: {
    option?: GlobalPreprocessingOption
    global_params?: [string, any]
  }) => {
    console.log("Inside handleGlobalPreprocessingChange", change)
    setWorkbookConfig((prev: WorkbookConfig) => {
      const new_global_params = prev.preProcessingConfig.global_params ?? {}
      let new_global_preprocessing =
        prev.preProcessingConfig.global_preprocessing

      if (change.global_params)
        new_global_params[change.global_params[0]] = change.global_params[1]

      if (change.option) {
        new_global_preprocessing =
          prev.preProcessingConfig?.global_preprocessing.includes(change.option)
            ? prev.preProcessingConfig.global_preprocessing.filter(
                (item: string) => item !== change.option,
              )
            : [...prev.preProcessingConfig.global_preprocessing, change.option]
      }

      return {
        ...prev,
        preProcessingConfig: {
          ...prev.preProcessingConfig,
          global_params: new_global_params,
          global_preprocessing: new_global_preprocessing,
        },
      }
    })
  }

  const handleColumnTypeChange = (
    columnName: string,
    type: "numeric" | "categorical" | "date",
  ) => {
    setWorkbookConfig((prev: WorkbookConfig) => {
      const newColumns = prev.preProcessingConfig.columns?.map(
        (col: PreProcessingColumnConfig) =>
          col.name === columnName
            ? {
                ...col,
                type,
                preprocessing: {
                  imputation: undefined,
                  scaling: undefined,
                  encoding: undefined,
                },
              }
            : col,
      )

      return {
        ...prev,
        preProcessingConfig: {
          ...prev.preProcessingConfig,
          columns: newColumns,
        },
      }
    })
  }

  const handleColumnPreprocessingChange = (
    columnName: string,
    preprocessingType: "imputation" | "scaling" | "encoding",
    value:
      | NumericImputationMethod
      | NumericScalingMethod
      | CategoricalEncodingMethod,
  ) => {
    setWorkbookConfig((prev: WorkbookConfig) => ({
      ...prev,
      preProcessingConfig: {
        ...prev.preProcessingConfig,
        columns: prev.preProcessingConfig.columns?.map((col) =>
          col.name === columnName
            ? { ...col, [preprocessingType]: value }
            : col,
        ),
      },
    }))
  }

  return {
    handleGlobalPreprocessingChange,
    handleColumnTypeChange,
    handleColumnPreprocessingChange,
  }
}
