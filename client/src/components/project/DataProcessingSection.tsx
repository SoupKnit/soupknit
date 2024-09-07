import React, { useEffect, useState } from "react"
import { useAtom } from "jotai"
import { toast } from "sonner"

import { ColumnPreprocessing } from "../editor/ColumnPreprocessing"
import { DatasetPreview, FileInputArea } from "../editor/DatasetPreview"
import { GlobalPreprocessing } from "../editor/GlobalPreprocessing"
import { CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
// import { useFetchWorkbook } from "@/hooks/useFetchWorkbook"
import { useWorkbook } from "@/hooks/useWorkbook"
import { filesStore, workbookConfigStore } from "@/store/workbookStore"

export function DataProcessingSection({
  projectId,
}: Readonly<{
  projectId: string
}>) {
  const [workbookConfig, setWorkbookConfig] = useAtom(workbookConfigStore)
  const [activeFile] = useAtom(filesStore)
  // const [isAnalyzing, setIsAnalyzing] = useState(false)
  // const [isPreprocessing, setIsPreprocessing] = useState(false)
  // const { setCSVData, setHeaders, workbookQuery, csvData, headers } =
  //   useFetchWorkbook(projectId)
  const { error, handleFileUpload, analyzeFile, preprocessFile } =
    useWorkbook(projectId)

  const hasUploadedFile =
    activeFile && activeFile.file_url && csvData.length > 0
  const hasPreprocessingConfig =
    workbookConfig.preProcessingConfig &&
    Object.keys(workbookConfig.preProcessingConfig).length > 0

  console.log("DataProcessingSection state:", {
    hasUploadedFile,
    activeFile,
    csvDataLength: csvData.length,
    workbookConfig,
    hasPreprocessingConfig,
    isAnalyzing,
  })

  const isAnalyzeButtonDisabled = () => {
    const reasons = []
    if (isAnalyzing) reasons.push("isAnalyzing")
    if (!hasUploadedFile) reasons.push("!hasUploadedFile")
    if (!workbookConfig.taskType) reasons.push("!taskType")
    if (
      workbookConfig.taskType !== "Clustering" &&
      !workbookConfig.targetColumn
    )
      reasons.push("!targetColumn")
    if (
      workbookConfig.taskType === "Clustering" &&
      !workbookConfig.modelParams?.n_clusters
    )
      reasons.push("!n_clusters")

    const isDisabled = reasons.length > 0
    console.log("Analyze button disabled:", isDisabled, "Reasons:", reasons)
    return isDisabled
  }

  const triggerFileAnalysis = async () => {
    if (!activeFile?.file_url) {
      console.warn("Missing file URL for analysis")
      toast.error("No file selected for analysis")
      return
    }
    if (!workbookConfig.taskType) {
      console.warn("Missing task type for analysis")
      toast.error("Please select a task type before analysis")
      return
    }
    try {
      setIsAnalyzing(true)
      const result = await analyzeFile.mutateAsync({
        taskType: workbookConfig.taskType,
        targetColumn: workbookConfig.targetColumn || "",
        fileUrl: activeFile.file_url,
        projectId,
        modelParams: workbookConfig.modelParams,
      })
      console.log("File analysis result:", result)
      if (result.preProcessingConfig) {
        setWorkbookConfig((prev) => ({
          ...prev,
          preProcessingConfig: result.preProcessingConfig,
        }))
      }
      toast.success("File analysis completed successfully")
    } catch (error) {
      console.error("Error in file analysis:", error)
      toast.error(`Error analyzing file:`) //${(error as Error).message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const setTargetColumn = (value: string) => {
    setWorkbookConfig((prev) => {
      const featureColumns = headers.filter((header) => header !== value)
      return { ...prev, targetColumn: value, featureColumns }
    })
  }

  const setNumClusters = (value: string) => {
    setWorkbookConfig((prev) => ({
      ...prev,
      modelParams: {
        ...prev.modelParams,
        n_clusters: parseInt(value, 10),
      },
    }))
  }

  const globalPreprocessingOptions = [
    "drop_constant",
    "drop_duplicate",
    "pca",
    "feature_selection",
  ]

  const handleGlobalPreprocessingChange = (option: string) => {
    setWorkbookConfig((prev) => ({
      ...prev,
      preProcessingConfig: {
        ...prev.preProcessingConfig,
        global_preprocessing:
          prev.preProcessingConfig.global_preprocessing.includes(option)
            ? prev.preProcessingConfig.global_preprocessing.filter(
                (item) => item !== option,
              )
            : [...prev.preProcessingConfig.global_preprocessing, option],
      },
    }))
  }

  const handleGlobalParamChange = (param: string, value: number) => {
    setWorkbookConfig((prev) => ({
      ...prev,
      preProcessingConfig: {
        ...prev.preProcessingConfig,
        global_params: {
          ...prev.preProcessingConfig.global_params,
          [param]: value,
        },
      },
    }))
  }

  const handlePreprocess = async () => {
    if (!workbookConfig.preProcessingConfig) {
      toast.error("Please configure preprocessing steps first")
      return
    }

    try {
      setIsPreprocessing(true)
      const result = await preprocessFile.mutateAsync({
        taskType: workbookConfig.taskType || "",
        targetColumn: workbookConfig.targetColumn || null,
        preProcessingConfig: workbookConfig.preProcessingConfig,
        projectId,
        modelParams: workbookConfig.modelParams,
      })

      console.log("Raw preprocessing result:", JSON.stringify(result, null, 2))

      if (result.previewDataPreprocessed) {
        const newHeaders = Object.keys(result.previewDataPreprocessed[0])
        setPreprocessedHeaders(newHeaders)
        setPreprocessedData(result.previewDataPreprocessed)
      }

      toast.success("Data preprocessed successfully")
    } catch (error) {
      console.error("Error preprocessing data:", error)
      toast.error(`Error preprocessing data`)
    } finally {
      setIsPreprocessing(false)
    }
  }

  const handleDeleteColumn = (columnName: string) => {
    setWorkbookConfig((prev) => {
      // Remove the column from the preprocessing config
      const updatedColumns = prev.preProcessingConfig.columns.filter(
        (col) => col.name !== columnName,
      )

      // Update the target column if it's the deleted column
      let updatedTargetColumn = prev.targetColumn
      if (prev.targetColumn === columnName) {
        updatedTargetColumn = ""
      }

      // Update feature columns
      const updatedFeatureColumns =
        prev.featureColumns?.filter((col) => col !== columnName) || []

      return {
        ...prev,
        preProcessingConfig: {
          ...prev.preProcessingConfig,
          columns: updatedColumns,
        },
        targetColumn: updatedTargetColumn,
        featureColumns: updatedFeatureColumns,
      }
    })

    // Remove the column from preprocessed data if it exists
    if (preprocessedData.length > 0) {
      setPreprocessedData(
        preprocessedData.map((row) => {
          const { [columnName]: _, ...rest } = row
          return rest
        }),
      )
      setPreprocessedHeaders(
        preprocessedHeaders.filter((h) => h !== columnName),
      )
    }

    toast.success(`Column "${columnName}" removed from preprocessing`)
  }

  // Add this effect to set a default task type if it's not set
  useEffect(() => {
    if (!workbookConfig.taskType) {
      setWorkbookConfig((prev) => ({ ...prev, taskType: "Regression" }))
    }
  }, [workbookConfig.taskType, setWorkbookConfig])

  useEffect(() => {
    if (headers.length > 0 && workbookConfig.targetColumn) {
      const featureColumns = headers.filter(
        (header) => header !== workbookConfig.targetColumn,
      )
      setWorkbookConfig((prev) => ({
        ...prev,
        featureColumns,
      }))
    }
  }, [headers, workbookConfig.targetColumn, setWorkbookConfig])

  if (workbookQuery.isLoading) {
    return <Skeleton className="h-[500px] w-full" />
  }

  if (workbookQuery.isError) {
    return (
      <div>
        Error loading workbook: {(workbookQuery.error as Error).message}
      </div>
    )
  }

  return (
    <>
      {error && <div className="mb-4 text-red-500">{error}</div>}

      {!hasUploadedFile ? (
        <FileInputArea fileUpload={handleFileUpload} />
      ) : (
        <>
          <DatasetPreview
            name={activeFile.name ?? "Untitled"}
            headers={headers}
            data={csvData}
            loading={workbookQuery.isLoading}
          />
          {workbookConfig.taskType !== "Clustering" ? (
            <div className="mt-4">
              <Select
                value={workbookConfig.targetColumn ?? undefined}
                onValueChange={setTargetColumn}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select target column" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="mt-4">
              <Select
                value={
                  workbookConfig.modelParams?.n_clusters?.toString() ??
                  undefined
                }
                onValueChange={setNumClusters}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select number of clusters" />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} clusters
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="mt-4">
            <Button
              onClick={triggerFileAnalysis}
              disabled={isAnalyzeButtonDisabled()}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze File"}
            </Button>
          </div>
          {analyzeFile.isSuccess && hasPreprocessingConfig && (
            <div className="mt-8">
              <GlobalPreprocessing
                options={globalPreprocessingOptions}
                selectedOptions={
                  workbookConfig.preProcessingConfig.global_preprocessing
                }
                onOptionChange={handleGlobalPreprocessingChange}
                globalParams={workbookConfig.preProcessingConfig.global_params}
                onParamChange={handleGlobalParamChange}
              />
              <ColumnPreprocessing
                columns={workbookConfig.preProcessingConfig.columns}
                onColumnChange={(columnName, changes) => {
                  setWorkbookConfig((prev) => ({
                    ...prev,
                    preProcessingConfig: {
                      ...prev.preProcessingConfig,
                      columns: prev.preProcessingConfig.columns.map((col) =>
                        col.name === columnName ? { ...col, ...changes } : col,
                      ),
                    },
                  }))
                }}
                onDeleteColumn={handleDeleteColumn}
              />

              <div className="mt-4">
                <Button
                  onClick={handlePreprocess}
                  disabled={
                    isPreprocessing || !workbookConfig.preProcessingConfig
                  }
                >
                  {isPreprocessing ? "Preprocessing..." : "Preprocess Data"}
                </Button>
              </div>
              {preprocessedData.length > 0 && (
                <div className="mt-4">
                  <h3>Preprocessed Data Preview</h3>
                  <DatasetPreview
                    name="Preprocessed Data"
                    headers={preprocessedHeaders}
                    data={preprocessedData}
                    loading={false}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}

export function DataProcessingSectionHeader() {
  return (
    <CardHeader>
      <CardTitle>Dataset</CardTitle>
      <CardDescription>Configure data pre-processing steps</CardDescription>
    </CardHeader>
  )
}
