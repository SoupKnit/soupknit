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
  const {
    csvData,
    headers,
    loading,
    error,
    handleFileUpload,
    analyzeFile,
    workbookQuery,
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
      toast.error(`Error analyzing file: ${(error as Error).message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const setTargetColumn = (value: string) => {
    setWorkbookConfig((prev) => ({ ...prev, targetColumn: value }))
  }

  // Add this effect to set a default task type if it's not set
  useEffect(() => {
    if (!workbookConfig.taskType) {
      setWorkbookConfig((prev) => ({ ...prev, taskType: "Regression" }))
    }
  }, [workbookConfig.taskType, setWorkbookConfig])

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
          {workbookConfig.taskType !== "Clustering" && (
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
          )}
          <div className="mt-4">
            <Button
              onClick={triggerFileAnalysis}
              disabled={isAnalyzeButtonDisabled()}
            >
              {isAnalyzing ? "Analyzing..." : "Analyze File"}
            </Button>
          </div>
          {hasPreprocessingConfig && (
            <div className="mt-8">
              <GlobalPreprocessing />
              <ColumnPreprocessing />
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
