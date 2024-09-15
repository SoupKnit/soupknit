import { useCallback, useMemo, useState } from "react"
import { useAtom, useAtomValue } from "jotai"
import Papa from "papaparse"
import { toast } from "sonner"

import { DatasetPreview, FileInputArea } from "../editor/DatasetPreview"
import { CardDescription, CardHeader, CardTitle } from "../ui/card"
import { useUpdateWorkbook } from "@/actions/workbookActions"
import { Button } from "@/components/ui/button"
import { useAnalyzeFile } from "@/hooks/useWorkbook"
import { useEnv } from "@/lib/clientEnvironment"
import { isNonEmptyArray } from "@/lib/utils"
import { userSettingsStore } from "@/store/userSettingsStore"
import { createFileStore } from "@/store/workbookStore"

import type { AppLabels } from "@/lib/labels"
import type { DataPreview } from "@/store/workbookStore"
import type { WorkbookData } from "@soupknit/model/src/workbookSchemas"

const labels = {
  selectTaskType: {
    label: "Select Task Type and Target Column",
    id: "DataProcessingSection.selectTaskTypeAndTargetColumn",
  },
  selectTargetColumn: {
    label: "Select Target Column",
    id: "DataProcessingSection.selectTargetColumn",
  },
  selectClustering: {
    label: "Select Clustering",
    id: "DataProcessingSection.selectClustering",
  },
  dataProcessingHeader: {
    label: "Dataset",
    id: "DataProcessingSection.dataProcessingHeader",
  },
  dataProcessingDescription: {
    label: "Configure data pre-processing steps",
    id: "DataProcessingSection.dataProcessingDescription",
  },
  analyzeFile: {
    label: "Analyze File",
    id: "DataProcessingSection.analyzeFile",
  },
  analyzeFileInProgress: {
    label: "Analyzing...",
    id: "DataProcessingSection.analyzeFileInProgress",
  },
  preprocessingOptions: {
    label: "Preprocessing Options",
    id: "DataProcessingSection.preprocessingOptions",
  },
} as const satisfies AppLabels

export function DataProcessingSection({
  projectId,
  workbookData,
}: Readonly<{ projectId: string; workbookData: WorkbookData }>) {
  const env = useEnv()
  const [error, setError] = useState<string | null>(null)
  const userSettings = useAtomValue(userSettingsStore)
  const { updateWorkbookDataMutation } = useUpdateWorkbook({
    projectId,
    updateDataOptions: {
      onSuccess: (data) => {
        console.log("Workbook data updated:", data)
      },
    },
  })

  const previewFileAtom = useMemo(() => {
    console.log("workbookData.preview_data", workbookData.preview_data)
    return createFileStore(workbookData.preview_data)
  }, [workbookData.preview_data])

  const preprocessedFileAtom = useMemo(() => {
    return createFileStore(workbookData.preview_data_preprocessed)
  }, [workbookData.preview_data_preprocessed])

  const [previewFile, setPreviewFile] = useAtom(previewFileAtom)
  const [preprocessedFile, setPreprocessedFile] = useAtom(preprocessedFileAtom)

  const {
    data: analysisResult,
    mutate: triggerFileAnalysis,
    isPending: isAnalyzing,
  } = useAnalyzeFile(workbookData.id)

  const isAnalyzeButtonDisabled = () => {
    // TODO: Implement this function
    return false
  }
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      console.log("File upload called with", event)
      const workbookConfig = workbookData.config
      const uploadedFile = event.target.files?.[0]
      if (!uploadedFile) return

      setError(null)

      try {
        const filePath = `${userSettings.userId}/project-${projectId}/${Date.now()}_${uploadedFile.name}`

        // TODO: move this to a new fileActions.ts
        const { data: uploadData, error: uploadError } = await env.supa.storage
          .from("workbook-files")
          .upload(filePath, uploadedFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = env.supa.storage
          .from("workbook-files")
          .getPublicUrl(uploadData.path)

        const text = await uploadedFile.text()
        const { data: parsedData, meta } = Papa.parse(text, { header: true })

        if (!isNonEmptyArray(parsedData)) {
          throw new Error("Failed to parse file data")
        }

        // setActiveFileWithPreview should be handled in a separate function or store
        console.log("File uploaded:", {
          name: uploadedFile.name,
          file_url: publicUrl,
          file_type: uploadedFile.type,
          preview: parsedData as Record<string, any>[],
        })

        console.log("File uploaded:", {
          csvDataLength: parsedData.length,
          headers: meta.fields,
        })

        // TODO: Update workbook with the uploaded file and preview
        if (isNonEmptyArray(parsedData)) {
          setPreviewFile({
            data: parsedData as Record<string, any>[],
            headers: meta.fields ?? [],
          })
          updateWorkbookDataMutation.mutate({
            workbookId: workbookData.id,
            updatedData: {
              preview_data: parsedData.slice(0, 30) as Record<string, any>[],
            },
          })
        }
        // Analyze file
        // auto analyze? disabled for now
        // if (workbookConfig?.taskType && workbookConfig?.targetColumn) {
        //   await analyzeFile.mutateAsync({
        //     taskType: workbookConfig.taskType,
        //     targetColumn: workbookConfig.targetColumn,
        //     fileUrl: publicUrl,
        //     projectId,
        //   })
        // } else {
        //   console.warn(
        //     "Workbook config is missing taskType or targetColumn. Skipping file analysis.",
        //   )
        // }
      } catch (error: any) {
        console.error("Error processing file:", error)
        setError(`Error processing file: ${error.message}`)
      }
    },
    [
      workbookData.config,
      workbookData.id,
      userSettings.userId,
      projectId,
      env.supa.storage,
      setPreviewFile,
      updateWorkbookDataMutation,
    ],
  )

  if (!previewFile && !preprocessedFile) {
    return <FileInputArea fileUpload={handleFileUpload} />
  }

  if (!workbookData.config.taskType || !workbookData.config.targetColumn) {
    return <div>{labels.selectTaskType.label}</div>
  }

  return (
    <>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      {preprocessedFileAtom && ( // prefer preprocessed file
        <DatasetPreview
          fileStore={preprocessedFileAtom}
          loading={isAnalyzing}
        />
      )}
      {previewFileAtom && ( // fallback to preview file
        <DatasetPreview fileStore={previewFileAtom} loading={isAnalyzing} />
      )}
      {workbookData.config.taskType !== "Clustering" ? (
        <div>{labels.selectTargetColumn.label}</div>
      ) : (
        <div>{labels.selectClustering.label}</div>
      )}
      <Button
        onClick={() =>
          triggerFileAnalysis({
            taskType: workbookData.config.taskType,
            targetColumn: workbookData.config.targetColumn,
            projectId,
            fileUrl: previewFile?.file?.file_url ?? "",
          })
        }
        disabled={isAnalyzeButtonDisabled()}
      >
        {isAnalyzing
          ? labels.analyzeFileInProgress.label
          : labels.analyzeFile.label}
      </Button>
      {analysisResult && <div>{labels.preprocessingOptions.label}</div>}
    </>
  )
}

export function DataProcessingSectionHeader() {
  return (
    <CardHeader>
      <CardTitle>{labels.dataProcessingHeader.label}</CardTitle>
      <CardDescription>
        {labels.dataProcessingDescription.label}
      </CardDescription>
    </CardHeader>
  )
}
