// GlobalPreprocessing.tsx
import React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function GlobalPreprocessing({
  options,
  selectedOptions,
  onOptionChange,
  globalParams,
  onParamChange,
}) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-lg font-semibold">Global Preprocessing</h3>
      <div className="flex flex-wrap gap-4">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={option}
              checked={selectedOptions.includes(option)}
              onCheckedChange={() => onOptionChange(option)}
            />
            <Label htmlFor={option}>{option.replace("_", " ")}</Label>
          </div>
        ))}
      </div>
      {selectedOptions.includes("pca") && (
        <div className="mt-2">
          <Label htmlFor="n_components">PCA components</Label>
          <Input
            id="n_components"
            type="number"
            value={globalParams?.n_components ?? ""}
            onChange={(e) =>
              onParamChange("n_components", parseFloat(e.target.value))
            }
            className="ml-2 w-24"
          />
        </div>
      )}
      {selectedOptions.includes("feature_selection") && (
        <div className="mt-2">
          <Label htmlFor="n_features_to_select">Features to select</Label>
          <Input
            id="n_features_to_select"
            type="number"
            value={globalParams?.n_features_to_select ?? ""}
            onChange={(e) =>
              onParamChange(
                "n_features_to_select",
                parseInt(e.target.value, 10),
              )
            }
            className="ml-2 w-24"
          />
        </div>
      )}
    </div>
  )
}
