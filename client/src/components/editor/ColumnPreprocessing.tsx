import React from "react"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type {
  CategoricalEncodingMethod,
  NumericImputationMethod,
  NumericScalingMethod,
  PreprocessingConfig,
} from "@/types/preprocessing"

interface ColumnPreprocessingProps {
  preprocessingConfig: PreprocessingConfig
  handleColumnTypeChange: (
    columnName: string,
    type: "numeric" | "categorical",
  ) => void
  handleColumnPreprocessingChange: (
    columnName: string,
    preprocessingType: "imputation" | "scaling" | "encoding",
    value:
      | NumericImputationMethod
      | NumericScalingMethod
      | CategoricalEncodingMethod,
  ) => void
}

export function ColumnPreprocessing({
  preprocessingConfig,
  handleColumnTypeChange,
  handleColumnPreprocessingChange,
}: Readonly<ColumnPreprocessingProps>) {
  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="font-bold">Column</div>
      <div className="font-bold">Type</div>
      <div className="font-bold">Preprocessing</div>
      {preprocessingConfig.columns.map((column) => (
        <React.Fragment key={column.name}>
          <div>{column.name}</div>
          <div>
            <Select
              value={column.type}
              onValueChange={(value: "numeric" | "categorical") =>
                handleColumnTypeChange(column.name, value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="numeric">Numeric</SelectItem>
                <SelectItem value="categorical">Categorical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            {column.type === "numeric" ? (
              <div className="space-y-2">
                <div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Imputation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {(
                          ["none", "mean", "median", "constant", "knn"] as const
                        ).map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Scaling" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {(
                          ["none", "standard", "minmax", "robust"] as const
                        ).map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div>
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Encoding" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(["none", "onehot", "label", "ordinal"] as const).map(
                        (method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ),
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}
