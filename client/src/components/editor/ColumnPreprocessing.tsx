import React from "react"

import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ColumnPreprocessingProps {
  columns: Array<{
    name: string
    type: string
    preprocessing: {
      imputation?: string
      scaling?: string
      encoding?: string
    }
    params: {
      [key: string]: any
    }
  }>
  onColumnChange: (columnName: string, changes: any) => void
  onDeleteColumn: (columnName: string) => void
}

export function ColumnPreprocessing({
  columns,
  onColumnChange,
  onDeleteColumn,
}: ColumnPreprocessingProps) {
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-lg font-semibold">Column Preprocessing</h3>
      {columns.map((column) => (
        <div key={column.name} className="mb-4 rounded border p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold">{column.name}</h4>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeleteColumn(column.name)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <p>Type: {column.type}</p>
          {column.type === "numeric" && (
            <>
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
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue placeholder="Select imputation method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="mean">Mean</SelectItem>
                  <SelectItem value="median">Median</SelectItem>
                  <SelectItem value="mode">Mode</SelectItem>
                  <SelectItem value="constant">Constant</SelectItem>
                </SelectContent>
              </Select>
              {column.preprocessing.imputation === "constant" && (
                <Input
                  type="number"
                  placeholder="Constant value"
                  value={column.params.fill_value || ""}
                  onChange={(e) =>
                    onColumnChange(column.name, {
                      params: {
                        ...column.params,
                        fill_value: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="mt-2"
                />
              )}
              <Select
                value={column.preprocessing.scaling}
                onValueChange={(value) =>
                  onColumnChange(column.name, {
                    preprocessing: { ...column.preprocessing, scaling: value },
                  })
                }
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue placeholder="Select scaling method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="standard">Standard Scaling</SelectItem>
                  <SelectItem value="minmax">Min-Max Scaling</SelectItem>
                  <SelectItem value="robust">Robust Scaling</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
          {column.type === "categorical" && (
            <>
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
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue placeholder="Select imputation method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="mode">Mode</SelectItem>
                  <SelectItem value="constant">Constant</SelectItem>
                </SelectContent>
              </Select>
              {column.preprocessing.imputation === "constant" && (
                <Input
                  type="text"
                  placeholder="Constant value"
                  value={column.params.fill_value || ""}
                  onChange={(e) =>
                    onColumnChange(column.name, {
                      params: { ...column.params, fill_value: e.target.value },
                    })
                  }
                  className="mt-2"
                />
              )}
              <Select
                value={column.preprocessing.encoding}
                onValueChange={(value) =>
                  onColumnChange(column.name, {
                    preprocessing: { ...column.preprocessing, encoding: value },
                  })
                }
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue placeholder="Select encoding method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onehot">One-Hot Encoding</SelectItem>
                  <SelectItem value="ordinal">Ordinal Encoding</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
