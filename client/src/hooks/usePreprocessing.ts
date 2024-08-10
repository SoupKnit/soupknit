import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"

import { fetchPreprocessingConfig } from "@/api/preprocessing"
import { useEnv } from "@/lib/clientEnvironment"

import type {
  CategoricalEncodingMethod,
  GlobalPreprocessingOption,
  NumericImputationMethod,
  NumericScalingMethod,
  PreprocessingConfig,
} from "@soupknit/model/src/preprocessing"

export function usePreprocessing(headers: string[]) {
  const { supa } = useEnv()
  const [preprocessingConfig, setPreprocessingConfig] =
    useState<PreprocessingConfig>({
      global_preprocessing: [],
      global_params: {},
      columns: [],
    })

  const { data: fetchedConfig } = useQuery<PreprocessingConfig>({
    queryKey: ["preprocessingConfig", supa],
    queryFn: async () => fetchPreprocessingConfig(supa),
  })

  useEffect(() => {
    if (fetchedConfig && headers.length > 0) {
      setPreprocessingConfig(fetchedConfig)
    }
  }, [fetchedConfig, headers])

  const handleGlobalPreprocessingChange = (
    option: GlobalPreprocessingOption,
  ) => {
    setPreprocessingConfig((prev) => ({
      ...prev,
      global_preprocessing: prev.global_preprocessing.includes(option)
        ? prev.global_preprocessing.filter((item) => item !== option)
        : [...prev.global_preprocessing, option],
    }))
  }

  const handleColumnTypeChange = (
    columnName: string,
    type: "numeric" | "categorical",
  ) => {
    setPreprocessingConfig((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.name === columnName
          ? {
              ...col,
              type,
              imputation: undefined,
              scaling: undefined,
              encoding: undefined,
            }
          : col,
      ),
    }))
  }

  const handleColumnPreprocessingChange = (
    columnName: string,
    preprocessingType: "imputation" | "scaling" | "encoding",
    value:
      | NumericImputationMethod
      | NumericScalingMethod
      | CategoricalEncodingMethod,
  ) => {
    setPreprocessingConfig((prev) => ({
      ...prev,
      columns: prev.columns.map((col) =>
        col.name === columnName ? { ...col, [preprocessingType]: value } : col,
      ),
    }))
  }

  return {
    preprocessingConfig,
    handleGlobalPreprocessingChange,
    handleColumnTypeChange,
    handleColumnPreprocessingChange,
  }
}
