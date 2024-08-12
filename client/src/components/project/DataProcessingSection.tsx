import { useEffect } from "react"
import { useAtom } from "jotai"

import { ColumnPreprocessing } from "../editor/ColumnPreprocessing"
import { DatasetPreview, FileInputArea } from "../editor/DatasetPreview"
import { GlobalPreprocessing } from "../editor/GlobalPreprocessing"
import { CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Hide } from "../util/ConditionalShow"
import { fetchPreprocessingConfig } from "@/api/preprocessing"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFetchPreprocessing } from "@/hooks/usePreprocessing"
import { useWorkbook } from "@/hooks/useWorkbook"
import { useEnv } from "@/lib/clientEnvironment"
import { activeFileStore, workbookConfigStore } from "@/store/workbookStore"

export function DataProcessingSection({
  projectId,
}: Readonly<{
  projectId: string
  targetColumn?: string
  setTargetColumn?: React.Dispatch<React.SetStateAction<string>>
}>) {
  // const [projectAndWorkbook] = useAtom(activeProjectAndWorkbook)
  const [workbookConfig, setWorkbookConfig] = useAtom(workbookConfigStore)
  const [activeFile] = useAtom(activeFileStore)
  const { workbookConfigQuery } = useWorkbook(projectId)
  const env = useEnv()

  const { csvData, headers, loading, error, handleFileUpload } =
    useWorkbook(projectId)

  useEffect(() => {
    console.log(workbookConfig)
  }, [workbookConfig])

  useEffect(() => {
    if (workbookConfig && !workbookConfig.preProcessingConfig) {
      // If there's no saved preprocessing config, fetch the default one
      fetchPreprocessingConfig(env.supa).then((defaultConfig) => {
        setWorkbookConfig((prev) => ({
          ...prev,
          preProcessingConfig: defaultConfig,
        }))
      })
    }
  }, [workbookConfig, setWorkbookConfig])

  const setTargetColumn = (value: string) => {
    setWorkbookConfig((prev: any) => ({ ...prev, targetColumn: value }))
  }

  return (
    <>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <Hide when={headers.length > 0}>
        <FileInputArea fileUpload={handleFileUpload} />
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
      <div>
        <GlobalPreprocessing />
        <ColumnPreprocessing />
      </div>
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
