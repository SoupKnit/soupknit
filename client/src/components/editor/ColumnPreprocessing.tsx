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
                      <Select>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Imputation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {(
                              [
                                "none",
                                "mean",
                                "median",
                                "constant",
                                "knn",
                              ] as const
                            ).map((method) => (
                              <SelectItem value={method}>{method}</SelectItem>
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
                              <SelectItem value={method}>{method}</SelectItem>
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
                          {(
                            ["none", "onehot", "label", "ordinal"] as const
                          ).map((method) => (
                            <SelectItem value={method}>{method}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
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
