import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { toast } from "sonner"

import { ColumnPreprocessing } from "../editor/ColumnPreprocessing"
import { DatasetPreview, FileInputArea } from "../editor/DatasetPreview"
import { GlobalPreprocessing } from "../editor/GlobalPreprocessing"
import { CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Hide } from "../util/ConditionalShow"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useWorkbook } from "@/hooks/useWorkbook"
import { useEnv } from "@/lib/clientEnvironment"
import {
  activeFileStore,
  activeProjectAndWorkbook,
  workbookConfigStore,
} from "@/store/workbookStore"

export function DataProcessingSection({
  projectId,
}: Readonly<{
  projectId: string
}>) {
  const [workbookConfig, setWorkbookConfig] = useAtom(workbookConfigStore)
  const [activeFile] = useAtom(activeFileStore)
  const [activeProject] = useAtom(activeProjectAndWorkbook)
  const { workbookConfigQuery } = useWorkbook(projectId)
  const queryClient = useQueryClient()
  const env = useEnv()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const {
    csvData,
    headers,
    loading,
    error,
    handleFileUpload,
    analyzeFile,
    projectWorkbook,
  } = useWorkbook(projectId)

  useEffect(() => {
    if (workbookConfigQuery.data) {
      setWorkbookConfig((prev) => ({
        ...prev,
        preProcessingConfig: workbookConfigQuery.data.preProcessingConfig || {},
      }))
    }
  }, [workbookConfigQuery.data, setWorkbookConfig])

  const triggerFileAnalysis = async (targetColumn: string) => {
    if (!activeProject?.projectId) {
      console.warn("No active project")
      toast.error("No active project selected")
      return
    }

    console.log(
      "Triggering file analysis for project:",
      activeProject.projectId,
    )
    if (!activeFile?.file_url) {
      console.warn("Missing file URL for analysis")
      return
    }
    if (!workbookConfig.taskType) {
      console.warn("Missing task type for analysis")
      return
    }
    try {
      setIsAnalyzing(true)
      const result = await analyzeFile.mutateAsync({
        taskType: workbookConfig.taskType,
        targetColumn,
        fileUrl: activeFile.file_url,
        projectId: activeProject.projectId,
      })
      console.log("File analysis result:", result)
      toast.success("File analysis completed successfully")
      if (projectWorkbook?.workbookId) {
        await queryClient.refetchQueries({
          queryKey: ["workbookConfig", projectWorkbook.workbookId],
        })
      }
    } catch (error: any) {
      console.error("Error in file analysis:", error)
      toast.error(`Error analyzing file: ${error.message}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const setTargetColumn = async (value: string) => {
    setWorkbookConfig((prev: any) => ({ ...prev, targetColumn: value }))

    // Trigger file analysis after setting the target column, except for clustering tasks
    if (workbookConfig.taskType && workbookConfig.taskType !== "Clustering") {
      await triggerFileAnalysis(value)
    }
  }

  const handleFileUploadWrapper = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    await handleFileUpload(event)

    // For clustering tasks, trigger analysis immediately after file upload
    if (workbookConfig.taskType === "Clustering") {
      await triggerFileAnalysis("") // No target column for clustering
    }
  }

  const isPreprocessingConfigReady =
    workbookConfigQuery.isSuccess &&
    workbookConfigQuery.data?.preProcessingConfig &&
    !isAnalyzing

  return (
    <>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <Hide when={headers.length > 0}>
        <FileInputArea fileUpload={handleFileUploadWrapper} />
      </Hide>

      {csvData.length > 0 && (
        <>
          <DatasetPreview
            name={activeFile?.name ?? "Untitled"}
            headers={headers}
            data={csvData}
            loading={loading}
          />
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
        </>
      )}
      <div className="mt-8">
        {isAnalyzing ? (
          <PreprocessingSkeleton />
        ) : (
          isPreprocessingConfigReady && (
            <div>
              <GlobalPreprocessing />
              <ColumnPreprocessing />
            </div>
          )
        )}
      </div>
    </>
  )
}

export function PreprocessingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Global Preprocessing Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-6 w-32" />
          ))}
        </div>
      </div>

      {/* Column Preprocessing Skeleton */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-8">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="grid grid-cols-3 gap-8">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
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
