import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAtom, useSetAtom } from "jotai"
import { toast } from "sonner"

import { loadExistingWorkbook } from "@/actions/workbookActions"
import { useEnv } from "@/lib/clientEnvironment"
import { isNonEmptyArray } from "@/lib/utils"
import {
  activeProjectAndWorkbook,
  setDataPreviewAtom,
  workbookConfigStore,
} from "@/store/workbookStore"

export function useFetchWorkbook(projectId: string) {
  const env = useEnv()
  const setDataPreview = useSetAtom(setDataPreviewAtom)
  const [projectWorkbook, setProjectAndWorkbook] = useAtom(
    activeProjectAndWorkbook,
  )
  const [_config, setWorkbookConfig] = useAtom(workbookConfigStore)
  const workbookQuery = useQuery({
    queryKey: ["workbook", projectId, env.supa],
    queryFn: async () => {
      return await loadExistingWorkbook(env.supa, projectId)
    },
    enabled: !!projectId,
  })
  // Effect to update local state when workbook is fetched
  useEffect(() => {
    if (workbookQuery.isSuccess) {
      const data = workbookQuery.data
      console.log("Workbook query data:", data)
      if (data?.id && data.project_id) {
        console.log("Setting workbook data")
        toast.success("Workbook loaded successfully")
        setProjectAndWorkbook({
          ...projectWorkbook,
          projectId: data.project_id,
          workbookId: data.id,
          files: data.files?.map((f) => ({
            name: f.name,
            file_url: f.file_url,
            file_type: f.file_type,
          })),
        })

        if (data.config) {
          setWorkbookConfig((prevConfig) => ({
            ...prevConfig,
            ...data.config,
            preProcessingConfig:
              prevConfig.preProcessingConfig ||
              data.config?.preProcessingConfig,
          }))

          // Prioritize preprocessed data if available
          if (isNonEmptyArray(data.preview_data_preprocessed)) {
            setDataPreview(data.preview_data_preprocessed)
          } else if (isNonEmptyArray(data.preview_data)) {
            setDataPreview(data.preview_data)
          }
        }
      } else {
        console.error("No existing workbook found")
        toast.info("No existing workbook found")
      }
    }
  }, [
    setProjectAndWorkbook,
    projectWorkbook,
    workbookQuery.isSuccess,
    workbookQuery.data,
    setWorkbookConfig,
    setDataPreview,
  ])

  return {
    workbookQuery,
  }
}
