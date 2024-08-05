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
import supa from "@/lib/supabaseClient"

import type { IDBPDatabase } from "idb"

interface CSVViewerProps {
  projectId: number
}

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

// Simulated API call
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

export function CSVViewer({ projectId }: CSVViewerProps) {
  const [csvData, setCSVData] = useState<Record<string, any>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [workbookId, setWorkbookId] = useState<string | null>(null)
  const [workbookName, setWorkbookName] = useState<string | null>(null)
  const [workbookFileType, setWorkbookFileType] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
    loadProjectWorkbook()
  }, [projectId])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supa.auth.getUser()
    setUser(user)
    console.log("Current user:", user)
  }

  const fetchFirstRows = async (workbookId: string) => {
    setLoading(true)

    try {
      console.log("Fetching first 15 rows for workbook:", workbookId)

      // Fetch the first 15 rows using our custom function
      const { data, error } = await supa.rpc("get_first_15_rows", {
        workbook_id: workbookId,
      })

      if (error) {
        console.error("Error fetching rows:", error)
        throw error
      }

      console.log("Fetched data:", data)

      if (data && data.length > 0) {
        console.log("First row data:", data[0])
        setHeaders(Object.keys(data[0].data))
        setCSVData(data.map((row) => row.data))
        setWorkbookName(data[0].workbook_name)
        setWorkbookFileType(data[0].workbook_file_type)
      } else {
        console.log("No data returned from get_first_15_rows")
        setHeaders([])
        setCSVData([])

        // Additional debugging: fetch workbook details
        const { data: workbook, error: workbookError } = await supa
          .from("workbooks")
          .select("*")
          .eq("id", workbookId)
          .single()

        if (workbookError) {
          console.error("Error fetching workbook details:", workbookError)
        } else {
          console.log("Workbook details:", workbook)
        }

        // Check if workbook_data exists
        const { data: workbookData, error: workbookDataError } = await supa
          .from("workbook_data")
          .select("id")
          .eq("workbook_id", workbookId)
          .limit(1)

        if (workbookDataError) {
          console.error("Error checking workbook_data:", workbookDataError)
        } else {
          console.log("Workbook data exists:", workbookData.length > 0)
        }
      }
    } catch (error) {
      console.error("Error fetching rows:", error)
      setError(`Error fetching rows: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectWorkbook = async () => {
    if (!projectId) return

    setLoading(true)
    setError(null)

    try {
      // Fetch the workbook associated with the project
      const { data: workbooks, error: fetchError } = await supa
        .from("workbooks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)

      if (fetchError) throw fetchError

      if (workbooks && workbooks.length > 0) {
        const workbook = workbooks[0]
        setWorkbookId(workbook.id)
        setWorkbookName(workbook.name)
        setWorkbookFileType(workbook.file_type)

        // Fetch the data for this workbook
        await fetchFirstRows(workbook.id)
      } else {
        console.log("No workbook found for this project")
        setError("No workbook found for this project. Please upload a file.")
        setHeaders([])
        setCSVData([])
      }
    } catch (error) {
      console.error("Error loading project workbook:", error)
      setError(`Error loading project workbook: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      console.log("Starting file upload process")

      // 1. Upload file to Supabase storage
      const { data: uploadData, error: uploadError } = await supa.storage
        .from("workbook-files")
        .upload(`${projectId}/${Date.now()}_${file.name}`, file)

      if (uploadError) throw uploadError
      console.log("File uploaded successfully:", uploadData)

      // 2. Get the public URL for the uploaded file
      const {
        data: { publicUrl },
        error: urlError,
      } = supa.storage.from("workbook-files").getPublicUrl(uploadData.path)

      if (urlError) throw urlError
      console.log("Public URL:", publicUrl)

      // 3. Create a new workbook entry
      const { data: workbook, error: workbookError } = await supa
        .from("workbooks")
        .insert({
          name: file.name,
          file_url: publicUrl,
          file_type: file.name.split(".").pop(),
          status: "draft",
          project_id: projectId,
        })
        .select()
        .single()

      if (workbookError) throw workbookError
      console.log("Workbook created successfully:", workbook)

      // 4. Parse the CSV file and insert data into workbook_data table
      const text = await file.text()
      const { data: parsedData } = Papa.parse(text, { header: true })
      console.log("Parsed data (first 3 rows):", parsedData.slice(0, 3))

      const workbookData = parsedData.map((row, index) => ({
        workbook_id: workbook.id,
        row_number: index + 1,
        data: row,
        file_path: uploadData.path, // Add this line
      }))

      console.log(
        "Prepared workbook data (first 3 rows):",
        workbookData.slice(0, 3),
      )

      const { error: insertError } = await supa
        .from("workbook_data")
        .insert(workbookData)

      if (insertError) throw insertError
      console.log("Data inserted successfully")

      // 5. Fetch the first 15 rows
      await fetchFirstRows(workbook.id)

      setWorkbookId(workbook.id)
      setWorkbookName(workbook.name)
      setWorkbookFileType(workbook.file_type)
    } catch (error) {
      console.error("Error processing file:", error)
      setError(`Error processing file: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

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
        {headers.map((header, cellIndex) => (
          <TableCell key={cellIndex} className="px-2">
            {row[header]}
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
      <div className="p-4">
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {user ? (
          <>
            <Input
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm"
              onChange={handleFileSelect}
              className="mb-4"
            />
            <Button
              onClick={() => workbookId && fetchFirstRows(workbookId)}
              disabled={loading}
              className="mb-4 ml-4"
            >
              Refresh Data
            </Button>
            {workbookName && (
              <div className="mb-4">
                Current Workbook: {workbookName} ({workbookFileType})
              </div>
            )}
            {loading ? (
              <div>Loading...</div>
            ) : csvData.length > 0 ? (
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
                      <TableBody>
                        {csvData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {headers.map((header, cellIndex) => (
                              <TableCell key={cellIndex} className="px-2">
                                {row[header]}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            ) : (
              <div>No data available</div>
            )}
          </>
        ) : (
          <div>Please log in to upload and view files.</div>
        )}
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
