// ColumnPreprocessing.tsx
import React from "react"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ColumnPreprocessing({ columns, onColumnChange }) {
  return (
    <div className="grid grid-cols-3 gap-8">
      <div className="font-bold">Column</div>
      <div className="font-bold">Type</div>
      <div className="font-bold">Preprocessing</div>
      {columns.map((column) => (
        <React.Fragment key={column.name}>
          <div>{column.name}</div>
          <div>
            <Select
              value={column.type}
              onValueChange={(value) =>
                onColumnChange(column.name, { type: value })
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
                <Select
                  value={column.preprocessing.imputation}
                  onValueChange={(value) =>
                    onColumnChange(column.name, {
                      preprocessing: {
                        ...column.preprocessing,
                        imputation: value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Imputation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {[
                        "mean",
                        "median",
                        "most_frequent",
                        "constant",
                        "knn",
                      ].map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select
                  value={column.preprocessing.scaling}
                  onValueChange={(value) =>
                    onColumnChange(column.name, {
                      preprocessing: {
                        ...column.preprocessing,
                        scaling: value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Scaling" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {["standard", "robust", "minmax"].map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Select
                  value={column.preprocessing.encoding}
                  onValueChange={(value) =>
                    onColumnChange(column.name, {
                      preprocessing: {
                        ...column.preprocessing,
                        encoding: value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Encoding" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {["onehot", "ordinal"].map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
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
