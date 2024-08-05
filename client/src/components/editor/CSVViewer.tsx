import React, { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { openDB } from "idb"
import Papa from "papaparse"

import { Check, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { IDBPDatabase } from "idb"

type GlobalPreprocessingOption =
  | "drop_missing"
  | "drop_constant"
  | "drop_duplicate"
  | "pca"
type NumericImputationMethod = "none" | "mean" | "median" | "constant" | "knn"
type NumericScalingMethod = "none" | "standard" | "minmax" | "robust"
type CategoricalEncodingMethod = "none" | "onehot" | "label" | "ordinal"

interface ColumnPreprocessing {
  name: string
  type: "numeric" | "categorical"
  imputation?: NumericImputationMethod
  scaling?: NumericScalingMethod
  encoding?: CategoricalEncodingMethod
  params: Record<string, any>
}

interface PreprocessingConfig {
  global_preprocessing: GlobalPreprocessingOption[]
  global_params: Record<string, any>
  columns: ColumnPreprocessing[]
}

const fetchPreprocessingConfig = async (): Promise<PreprocessingConfig> => {
  // This is our hardcoded JSON for now
  return {
    global_preprocessing: ["drop_missing", "pca"],
    global_params: {
      n_components: 0.95,
    },
    columns: [
      {
        name: "Column1",
        type: "numeric",
        imputation: "mean",
        scaling: "standard",
        params: {},
      },
      {
        name: "Column2",
        type: "categorical",
        encoding: "onehot",
        params: {},
      },
      // Add more columns as needed
    ],
  }
}

export function CSVViewer() {
  const [csvData, setCSVData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [db, setDb] = useState<IDBPDatabase | null>(null)
  const [loading, setLoading] = useState(false)
  const [preprocessingConfig, setPreprocessingConfig] =
    useState<PreprocessingConfig>({
      global_preprocessing: [],
      global_params: {},
      columns: [],
    })

  const { data: fetchedConfig } = useQuery<PreprocessingConfig>({
    queryKey: ["preprocessingConfig"],
    queryFn: fetchPreprocessingConfig,
  })

  useEffect(() => {
    const initDb = async () => {
      const database = await openDB("CSVDatabase", 1, {
        upgrade(db) {
          db.createObjectStore("csvFiles")
        },
      })
      setDb(database)
    }
    initDb()
  }, [])

  useEffect(() => {
    if (fetchedConfig && headers.length > 0) {
      setPreprocessingConfig(fetchedConfig)
    }
  }, [fetchedConfig, headers])

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (file && db) {
      setLoading(true)
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const result = Papa.parse(text, { header: true })
        const headers = result.meta.fields ?? []
        const data = result.data
          .slice(0, 15)
          .map((row: any) => headers.map((header) => row[header]))

        setHeaders(headers)
        setCSVData(data)

        if (db) {
          await db.put("csvFiles", { headers, data }, "currentFile")
        }
        setLoading(false)
      }
      reader.readAsText(file)
    }
  }

  const renderTableContent = () => {
    if (loading) {
      return Array.from({ length: 15 }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: headers.length }).map((_, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))
    }

    return csvData.map((row, rowIndex) => (
      <TableRow key={rowIndex}>
        {row.map((cell, cellIndex) => (
          <TableCell key={cellIndex} className="px-2">
            {cell}
          </TableCell>
        ))}
      </TableRow>
    ))
  }

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

  return (
    <div className="p-4">
      <Input
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="mb-4"
      />
      <div className="mb-4 rounded-md border">
        <ScrollArea className="h-[400px]">
          <div className="min-w-full max-w-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="px-2">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>{renderTableContent()}</TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <div>
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
                  setPreprocessingConfig((prev) => ({
                    ...prev,
                    global_params: {
                      ...prev.global_params,
                      n_components: parseFloat(e.target.value),
                    },
                  }))
                }
                className="ml-2 w-24"
              />
            </div>
          )}
        </div>
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
                              [
                                "none",
                                "mean",
                                "median",
                                "constant",
                                "knn",
                              ] as const
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
                                <Label
                                  htmlFor={`${column.name}-scaling-${method}`}
                                >
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
                          {(
                            ["none", "onehot", "label", "ordinal"] as const
                          ).map((method) => (
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
                          ))}
                        </RadioGroup>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
