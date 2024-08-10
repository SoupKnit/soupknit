import React from "react"
import {
  GlobalPreprocessingOption,
  PreprocessingConfig,
} from "@soupknit/model/src/preprocessing"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GlobalPreprocessingProps {
  preprocessingConfig: PreprocessingConfig
  handleGlobalPreprocessingChange: (option: GlobalPreprocessingOption) => void
}

export function GlobalPreprocessing({
  preprocessingConfig,
  handleGlobalPreprocessingChange,
}: GlobalPreprocessingProps) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-lg font-semibold">Global Preprocessing</h3>
      <div className="flex flex-wrap gap-4">
        {["drop_missing", "drop_constant", "drop_duplicate", "pca"].map(
          (option) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={option}
                checked={preprocessingConfig.global_preprocessing.includes(
                  option as GlobalPreprocessingOption,
                )}
                onCheckedChange={() =>
                  handleGlobalPreprocessingChange(
                    option as GlobalPreprocessingOption,
                  )
                }
              />
              <Label htmlFor={option}>{option.replace("_", " ")}</Label>
            </div>
          ),
        )}
      </div>
      {preprocessingConfig.global_preprocessing.includes("pca") && (
        <div className="mt-2">
          <Label htmlFor="n_components">PCA components</Label>
          <Input
            id="n_components"
            type="number"
            value={preprocessingConfig.global_params.n_components ?? ""}
            onChange={(e) =>
              handleGlobalPreprocessingChange({
                ...preprocessingConfig,
                global_params: {
                  ...preprocessingConfig.global_params,
                  n_components: parseFloat(e.target.value),
                },
              })
            }
            className="ml-2 w-24"
          />
        </div>
      )}
    </div>
  )
}
