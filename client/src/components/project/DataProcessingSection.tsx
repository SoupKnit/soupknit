import { useMemo } from "react"
import { useMutation } from "@tanstack/react-query"
import { atom, useAtomValue } from "jotai"
import { toast } from "sonner"

import { DatasetPreview, FileInputArea } from "../editor/DatasetPreview"
import { CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "@/components/ui/button"
import { useAnalyzeFile, useWorkbook } from "@/hooks/useWorkbook"
import { isNonEmptyArray } from "@/lib/utils"
import { createFileStore } from "@/store/workbookStore"

import type { WorkbookData } from "@soupknit/model/src/workbookSchemas"

export function DataProcessingSection({
  projectId,
  workbookData,
}: Readonly<{ projectId: string; workbookData: WorkbookData }>) {
  const { handleFileUpload } = useWorkbook(projectId, workbookData.id)
  const fileAtom = useMemo(() => {
    if (isNonEmptyArray(workbookData.preview_data_preprocessed)) {
      return createFileStore(workbookData.preview_data_preprocessed)
    } else if (isNonEmptyArray(workbookData.preview_data)) {
      return createFileStore(workbookData.preview_data)
    }
    return null
  }, [workbookData.preview_data, workbookData.preview_data_preprocessed])

  const file = useAtomValue(fileAtom ?? atom(null))

  const {
    data: analysisResult,
    mutate: triggerFileAnalysis,
    isPending: isAnalyzing,
  } = useAnalyzeFile(workbookData.id)

  const isAnalyzeButtonDisabled = () => {
    // TODO: Implement this function
    return false
  }

  if (!fileAtom || !file) {
    return <FileInputArea fileUpload={handleFileUpload} />
  }

  if (!workbookData.config.taskType || !workbookData.config.targetColumn) {
    return <div>Select Task Type and Target Column</div>
  }

  return (
    <>
      {/* {error && <div className="mb-4 text-red-500">{error}</div>} */}
      <DatasetPreview fileStore={fileAtom} loading={isAnalyzing} />
      {workbookData.config.taskType !== "Clustering" ? (
        <div>Target Column Select</div>
      ) : (
        <div>Clustering Select</div>
      )}
      <Button
        onClick={() =>
          triggerFileAnalysis({
            taskType: workbookData.config.taskType,
            targetColumn: workbookData.config.targetColumn,
            projectId,
            fileUrl: file.file?.file_url ?? "",
          })
        }
        disabled={isAnalyzeButtonDisabled()}
      >
        {isAnalyzing ? "Analyzing..." : "Analyze File"}
      </Button>
      {analysisResult && <div>Preprocessing Options</div>}
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
