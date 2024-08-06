import React, { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { openDB } from "idb"
import Papa from "papaparse"

import { Check, FileInputIcon, Upload, UploadIcon } from "lucide-react"

import { Hide, Show } from "../util/ConditionalShow"
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
import { cn } from "@/lib/utils"

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

export function DatasetPreview() {
  const [csvData, setCSVData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [db, setDb] = useState<IDBPDatabase | null>(null)
  const [loading, setLoading] = useState(false)

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

  const fileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <div className="mt-2">
      <Hide when={headers.length > 0}>
        <FileInputArea fileUpload={fileUpload} />
      </Hide>
      <Show when={headers.length > 0}>
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
              <ScrollBar orientation="horizontal" />
            </div>
          </ScrollArea>
        </div>
        <GlobalPreprocessingOptions
          headers={headers}
          // config={preprocessingConfig}
          // handleGlobalPreprocessingChange={handleGlobalPreprocessingChange}
          // handleColumnPreprocessingChange={handleColumnPreprocessingChange}
          // setPreprocessingConfig={setPreprocessingConfig}
        />
      </Show>
    </div>
  )
}

function GlobalPreprocessingOptions({
  // config,
  headers,
  // handleColumnPreprocessingChange,
  // handleGlobalPreprocessingChange,
  // setPreprocessingConfig,
}: {
  headers: string[]
}) {
  const [config, setPreprocessingConfig] = useState<PreprocessingConfig>({
    global_preprocessing: [],
    global_params: {},
    columns: [],
  })

  const { data: fetchedConfig } = useQuery<PreprocessingConfig>({
    queryKey: ["preprocessingConfig"],
    queryFn: fetchPreprocessingConfig,
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
  return (
    <div>
      <div className="mb-4">
        <h3 className="mb-2 text-lg font-semibold">Global Preprocessing</h3>
        <div className="flex flex-wrap gap-4">
          {["drop_missing", "drop_constant", "drop_duplicate", "pca"].map(
            (option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={config.global_preprocessing.includes(
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
        {config.global_preprocessing.includes("pca") && (
          <div className="mt-2">
            <Label htmlFor="n_components">PCA components</Label>
            <Input
              id="n_components"
              type="number"
              value={config.global_params.n_components ?? ""}
              onChange={(e) =>
                setPreprocessingConfig((prev) => ({
                  ...prev,
                  global_params: {
                    ...prev.global_params,
                    n_components: parseFloat(e.target.value),
                  },
                }))
              }
              className="w-24"
            />
          </div>
        )}
      </div>
      <div>
        {config.columns.map((column) => (
          <div
            key={column.name}
            className="mb-4 rounded-lg border p-4 shadow-sm"
          >
            <div className="mb-2">
              <h4 className="text-md font-semibold">{column.name}</h4>
            </div>
            <div className="mb-2">
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
                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold">Imputation</Label>
                    <RadioGroup
                      className="flex flex-wrap space-x-5"
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
                          className="flex max-w-32 items-center space-x-2"
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
                      className="flex flex-wrap space-x-5"
                      onValueChange={(value) =>
                        handleColumnPreprocessingChange(
                          column.name,
                          "scaling",
                          value as NumericScalingMethod,
                        )
                      }
                    >
                      {(["none", "standard", "minmax", "robust"] as const).map(
                        (method) => (
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
                        ),
                      )}
                    </RadioGroup>
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="font-semibold">Encoding</Label>
                  <RadioGroup
                    className="flex flex-wrap space-x-5"
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
                          <Label htmlFor={`${column.name}-encoding-${method}`}>
                            {method}
                          </Label>
                        </div>
                      ),
                    )}
                  </RadioGroup>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FileInputArea({
  fileUpload,
  className,
}: Readonly<{
  fileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
}>) {
  return (
    <div
      className={cn(
        "relative h-96 w-full outline-dashed outline-gray-500",
        className,
      )}
    >
      <div className="absolute inset-0 top-[calc(50%-2rem)] m-auto w-1/3 text-gray-500">
        <FileInputIcon className="m-auto my-2 h-8 w-8" />
        <p className="text-center">Click here or drop files here to upload</p>
      </div>
      <input
        type="file"
        accept=".csv"
        onChange={fileUpload}
        className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
      />
    </div>
  )
}
