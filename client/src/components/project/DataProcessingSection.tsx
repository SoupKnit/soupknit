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
import { useWorkbook } from "@/hooks/useWorkbook"
import { activeFileStore, workbookConfigStore } from "@/store/workbookStore"

export function DataProcessingSection({
  projectId,
}: Readonly<{
  projectId: string
}>) {
  const [workbookConfig, setWorkbookConfig] = useAtom(workbookConfigStore)
  const [activeFile] = useAtom(activeFileStore)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isPreprocessing, setIsPreprocessing] = useState(false)
  const {
    csvData,
    headers,
    loading,
    error,
    handleFileUpload,
    analyzeFile,
    workbookQuery,
    preprocessFile,
    setCSVData,
    setHeaders,
  } = useWorkbook(projectId)

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
        // Update the csvData state with the new preprocessed data
        const newHeaders = Object.keys(result.previewDataPreprocessed[0])
        const newData = result.previewDataPreprocessed.map(Object.values)

        setCSVData(newData)
        setHeaders(newHeaders)
      }

      toast.success("Data preprocessed successfully")
    } catch (error) {
      console.error("Error preprocessing data:", error)
      toast.error(`Error preprocessing data`) //: ${(error as Error).message}`)
    } finally {
      setIsPreprocessing(false)
    }
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
            loading={loading}
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
              <GlobalPreprocessing />
              <ColumnPreprocessing />
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
              {preprocessFile.isSuccess && csvData.length > 0 && (
                <div className="mt-4">
                  <h3>Preprocessed Data Preview</h3>
                  <DatasetPreview
                    name="Preprocessed Data"
                    headers={headers}
                    data={csvData}
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
