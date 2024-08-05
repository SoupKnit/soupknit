import React, { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { openDB } from "idb"
import Papa from "papaparse"

import { Check, Trash2, Upload } from "lucide-react"

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
  projectId: string
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
  const [userId, setUserId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { history } = useRouter()

  const getUserId = async () => {
    const {
      data: { user },
    } = await supa.auth.getUser()
    return user?.id
  }

  useEffect(() => {
    if (projectId) {
      loadExistingWorkbook()
    }
    const fetchUserId = async () => {
      const id = await getUserId()
      setUserId(id)
    }
    fetchUserId()
  }, [projectId])

  const loadExistingWorkbook = async () => {
    try {
      const { data, error } = await supa
        .from("workbooks")
        .select("*")
        .eq("project_id", parseInt(projectId))
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        const workbook = data[0]
        setWorkbookId(workbook.id)
        setWorkbookName(workbook.name)
        setWorkbookFileType(workbook.file_type)
        await fetchFirstRows(workbook.id)
      }
    } catch (error) {
      console.error("Error loading existing workbook:", error)
      setError("Error loading existing workbook")
    }
  }

  const fetchFirstRows = async (workbookId: string) => {
    setLoading(true)

    try {
      const { data, error } = await supa
        .from("workbook_data")
        .select("preview_data")
        .eq("workbook_id", workbookId)
        .single()

      if (error) throw error

      if (data && data.preview_data) {
        setHeaders(Object.keys(data.preview_data[0]))
        setCSVData(data.preview_data)
      } else {
        setHeaders([])
        setCSVData([])
      }
    } catch (error) {
      console.error("Error fetching preview data:", error)
      setError(`Error fetching preview data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async () => {
    if (!projectId) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      console.log("Attempting to delete project with ID:", projectId)

      // 1. Fetch the workbook associated with this project to get the file URL
      const { data: workbook, error: workbookError } = await supa
        .from("workbooks")
        .select("file_url")
        .eq("project_id", parseInt(projectId))
        .single()

      if (workbookError && workbookError.code !== "PGRST116")
        throw workbookError

      const fileUrl = workbook?.file_url

      // 2. Delete the project using the SQL function
      const { data, error: deleteError } = await supa.rpc("delete_project", {
        input_project_id: parseInt(projectId),
      })

      if (deleteError) throw deleteError

      console.log("Deletion results:", data)

      if (!data || data.length === 0) {
        console.log("No deletion results returned. The project may not exist.")
        return
      }

      const { workbook_data_deleted, workbooks_deleted, projects_deleted } =
        data[0]

      if (projects_deleted === 0) {
        console.log(
          "No project was deleted. It may not exist or couldn't be deleted.",
        )
        return
      }

      console.log(`Successfully deleted from database: 
        Workbook data: ${workbook_data_deleted}, 
        Workbooks: ${workbooks_deleted}, 
        Projects: ${projects_deleted}`)

      // 3. Delete the associated file if it exists
      if (fileUrl) {
        console.log("File URL to check/delete:", fileUrl)

        const url = new URL(fileUrl)
        const pathSegments = url.pathname.split("/")
        const bucketName = pathSegments[pathSegments.indexOf("public") + 1]
        const filePath = pathSegments
          .slice(pathSegments.indexOf(bucketName) + 1)
          .join("/")

        console.log("Extracted bucket name:", bucketName)
        console.log("Extracted file path:", filePath)

        if (filePath) {
          try {
            // Check if the file exists
            const { data: fileList, error: listError } = await supa.storage
              .from(bucketName)
              .list(filePath.split("/").slice(0, -1).join("/"), {
                limit: 1,
                offset: 0,
                sortBy: { column: "name", order: "asc" },
                search: filePath.split("/").pop(),
              })

            if (listError) {
              console.error("Error checking file existence:", listError)
            } else if (fileList && fileList.length > 0) {
              console.log("File exists, proceeding with deletion")

              const { data: deleteData, error: storageError } =
                await supa.storage.from(bucketName).remove([filePath])

              if (storageError) {
                console.error("Error deleting file from storage:", storageError)
              } else {
                console.log("Storage deletion response:", deleteData)
                if (
                  deleteData &&
                  deleteData.length > 0 &&
                  deleteData[0] === filePath
                ) {
                  console.log(
                    "Successfully deleted associated file from storage",
                  )
                } else {
                  console.log(
                    "File may not have been deleted. Deletion response:",
                    deleteData,
                  )
                }
              }
            } else {
              console.log("File does not exist in storage, skipping deletion")
            }
          } catch (fileError) {
            console.error("Error during file check/deletion:", fileError)
          }
        } else {
          console.log("Could not extract file path from file URL")
        }
      } else {
        console.log("No associated file to delete")
      }
    } catch (err) {
      console.error("Error deleting project:", err)
      setDeleteError(`Failed to delete project: ${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this project? This action cannot be undone.",
      )
    ) {
      await deleteProject()
      history.go(-1)
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

      if (!userId) {
        throw new Error("User ID not available")
      }

      // Create the file path with the new folder structure
      const filePath = `${userId}/project-${projectId}/${Date.now()}_${file.name}`

      // 1. Upload file to Supabase storage with the new path
      const { data: uploadData, error: uploadError } = await supa.storage
        .from("workbook-files")
        .upload(filePath, file)

      if (uploadError) throw uploadError
      console.log("File uploaded successfully:", uploadData)

      // 2. Get the public URL for the uploaded file
      const {
        data: { publicUrl },
        error: urlError,
      } = supa.storage.from("workbook-files").getPublicUrl(uploadData.path)

      if (urlError) throw urlError
      console.log("Public URL:", publicUrl)

      // Parse the CSV file
      const text = await file.text()
      const { data: parsedData, meta } = Papa.parse(text, { header: true })

      // Get the first 15 rows
      const previewData = parsedData.slice(0, 15)

      // Create a new workbook entry
      const { data: workbook, error: workbookError } = await supa
        .from("workbooks")
        .insert({
          project_id: parseInt(projectId),
          name: file.name,
          file_url: publicUrl,
          file_type: file.name.split(".").pop(),
          status: "draft",
        })
        .select()
        .single()

      if (workbookError) throw workbookError

      // Insert preview data into the workbook_data table
      const { error: insertError } = await supa.from("workbook_data").insert({
        workbook_id: workbook.id,
        preview_data: previewData,
      })

      if (insertError) throw insertError

      console.log("Preview data inserted successfully")

      // Set state with the preview data
      setHeaders(meta.fields || [])
      setCSVData(previewData)
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
      <div className="mt-8">
        <h3 className="mb-4 text-xl font-bold">Workbook Data</h3>

        {error && <div className="mb-4 text-red-500">{error}</div>}
        <Input
          type="file"
          accept=".csv,.xlsx,.xls,.xlsm"
          onChange={handleFileSelect}
          className="mb-4"
        />
        {workbookId && (
          <Button
            onClick={() => fetchFirstRows(workbookId)}
            disabled={loading}
            className="mb-4 ml-4"
          >
            Refresh Data
          </Button>
        )}
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
      <Button
        onClick={handleDelete}
        disabled={isDeleting}
        variant="destructive"
      >
        {isDeleting ? "Deleting..." : "Delete Project"}
        <Trash2 className="ml-2 h-4 w-4" />
      </Button>
      {deleteError && <div className="mb-4 text-red-500">{deleteError}</div>}
    </div>
  )
}
