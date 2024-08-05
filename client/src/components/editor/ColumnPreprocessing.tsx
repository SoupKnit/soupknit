import React from "react"

import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
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
import {
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
}: ColumnPreprocessingProps) {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Preprocessing</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {preprocessingConfig.columns.map((column) => (
            <TableRow key={column.name}>
              <TableCell>{column.name}</TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>
                {column.type === "numeric" ? (
                  <div className="space-y-2">
                    <div>
                      <Label className="font-semibold">Imputation</Label>
                      <RadioGroup
                        value={column.imputation ?? "none"}
                        onValueChange={(value) =>
                          handleColumnPreprocessingChange(
                            column.name,
                            "imputation",
                            value as NumericImputationMethod,
                          )
                        }
                      >
                        {(
                          ["none", "mean", "median", "constant", "knn"] as const
                        ).map((method) => (
                          <div
                            key={method}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={method}
                              id={`${column.name}-imputation-${method}`}
                            />
                            <Label
                              htmlFor={`${column.name}-imputation-${method}`}
                            >
                              {method}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                    <div>
                      <Label className="font-semibold">Scaling</Label>
                      <RadioGroup
                        value={column.scaling ?? "none"}
                        onValueChange={(value) =>
                          handleColumnPreprocessingChange(
                            column.name,
                            "scaling",
                            value as NumericScalingMethod,
                          )
                        }
                      >
                        {(
                          ["none", "standard", "minmax", "robust"] as const
                        ).map((method) => (
                          <div
                            key={method}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={method}
                              id={`${column.name}-scaling-${method}`}
                            />
                            <Label htmlFor={`${column.name}-scaling-${method}`}>
                              {method}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="font-semibold">Encoding</Label>
                    <RadioGroup
                      value={column.encoding ?? "none"}
                      onValueChange={(value) =>
                        handleColumnPreprocessingChange(
                          column.name,
                          "encoding",
                          value as CategoricalEncodingMethod,
                        )
                      }
                    >
                      {(["none", "onehot", "label", "ordinal"] as const).map(
                        (method) => (
                          <div
                            key={method}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={method}
                              id={`${column.name}-encoding-${method}`}
                            />
                            <Label
                              htmlFor={`${column.name}-encoding-${method}`}
                            >
                              {method}
                            </Label>
                          </div>
                        ),
                      )}
                    </RadioGroup>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
