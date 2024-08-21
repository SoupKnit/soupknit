import React from "react"
import { useAtom } from "jotai"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePreProcessing } from "@/hooks/usePreprocessing"
import { workbookConfigStore } from "@/store/workbookStore"

import type { WorkbookConfig } from "@/store/workbookStore"
import type { GlobalPreprocessingOption } from "@soupknit/model/src/preprocessing"

interface GlobalPreprocessingProps {
  // preProcessingConfig: WorkbookConfig["preProcessingConfig"]
}

const GlobalPreprocessingOptions: GlobalPreprocessingOption[] = [
  "drop_missing",
  "drop_constant",
  "drop_duplicate",
  "pca",
]

export function GlobalPreprocessing() {
  const [workbookConfig, setWorkbookConfig] = useAtom(workbookConfigStore)
  const { handleGlobalPreprocessingChange } = usePreProcessing()
  if (!workbookConfig.preProcessingConfig) {
    return null
  }
  console.log("GlobalPreprocessing config:", workbookConfig.preProcessingConfig)
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-lg font-semibold">Global Preprocessing</h3>
      <div className="flex flex-wrap gap-4">
        {workbookConfig.preProcessingConfig.global_preprocessing.map(
          (option) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={option}
                checked={workbookConfig.preProcessingConfig.global_preprocessing.includes(
                  option,
                )}
                onCheckedChange={() =>
                  handleGlobalPreprocessingChange({ option })
                }
              />
              <Label htmlFor={option}>{option.replace("_", " ")}</Label>
            </div>
          ),
        )}
      </div>
      {workbookConfig?.preProcessingConfig.global_preprocessing.includes(
        "pca",
      ) && (
        <div className="mt-2">
          <Label htmlFor="n_components">PCA components</Label>
          <Input
            id="n_components"
            type="number"
            value={
              workbookConfig?.preProcessingConfig.global_params?.n_components ??
              ""
            }
            onChange={(e) =>
              handleGlobalPreprocessingChange({
                global_params: ["n_components", parseFloat(e.target.value)],
              })
            }
            className="ml-2 w-24"
          />
        </div>
      )}
    </div>
  )
}
