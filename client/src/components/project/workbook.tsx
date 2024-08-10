import React, { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { toast } from "sonner"

import { ModelDeployMain } from "../deployModel/ModelDeployMain"
import { MultiLineTextInput } from "../editor/MultiLineText"
import { ModelSelector } from "../modelGenerator/ModelSelector"
import { WTFIsOther } from "../Other"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { Hide } from "../util/ConditionalShow"
import {
  loadProject,
  updateProjectDescription,
  updateProjectTitle,
} from "@/actions/projectsActions"
import { runProject } from "@/actions/workbookActions"
import { ColumnPreprocessing } from "@/components/editor/ColumnPreprocessing"
import {
  DatasetPreview,
  FileInputArea,
} from "@/components/editor/DatasetPreview"
import { GlobalPreprocessing } from "@/components/editor/GlobalPreprocessing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { usePreprocessing } from "@/hooks/usePreprocessing"
import { useWorkbook } from "@/hooks/useWorkbook"
import { useEnv } from "@/lib/clientEnvironment"
import {
  activeFileStore,
  activeProjectAndWorkbook,
  workbookStore,
} from "@/store/workbookStore"

import type {
  ActiveProject,
  Workbook,
} from "@soupknit/model/src/workbookSchemas"

interface WorkbookProps {
  projectId: string
}

interface Project {
  id: string
  title: string
  description: string
}

const ProjectWorkbook: React.FC<WorkbookProps> = ({ projectId }) => {
  const env = useEnv()
  const [title, setTitle] = useState<string>()
  const [description, setDescription] = useState<string>()
  const [projectAndWorkbook] = useAtom(activeProjectAndWorkbook)
  const [workbook] = useAtom(workbookStore)

  // Tries to load the project from the database
  const { isLoading, data: project = null } = useQuery({
    queryKey: ["project", projectId, env.supa],
    queryFn: async () => loadProject(env.supa, projectId),
  })

  useEffect(() => {
    if (isLoading === false && project) {
      setTitle(project.title)
      setDescription(project.description)
    }
  }, [project, isLoading])

  const descriptionInputRef = useRef<HTMLDivElement>(null)
  const [focusDescription, setFocusDescription] = useState<boolean>(false)

  useEffect(() => {
    if (focusDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus()
      setFocusDescription(false)
    }
  }, [focusDescription])

  const titleMutation = useMutation({
    mutationFn: async (title: string) =>
      updateProjectTitle(env.supa, title, projectId),
    onSuccess: () => {
      console.log("Title saved successfully")
    },
    onError: (error) => {
      console.error("Error saving title:", error)
    },
  })

  const descriptionMutation = useMutation({
    mutationFn: async (description: string) =>
      updateProjectDescription(env.supa, description, projectId),
    onSuccess: () => {
      console.log("Description saved successfully")
    },
    onError: (error) => {
      console.error("Error saving description:", error)
    },
  })

  const runAction = useMutation({
    mutationFn: async (project: ActiveProject) => {
      console.log("Running project, workbook:", project)
      return runProject(env, {
        project: project,
      })
    },
    onError: (error) => {
      console.error("Error running workbook:", error)
    },
  })

  if (isLoading || !project) {
    return <div>Loading...</div>
  }

  return (
    <>
      <div className="bg-gray-100 pb-4 pt-10 dark:bg-slate-800/40">
        <div className="container mx-auto">
          <input
            type="text"
            className="input-invisible text-5xl font-semibold"
            value={title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTitle(e.target.value)
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter" ||
                e.key === "Escape" ||
                e.key === "Tab" ||
                e.key === "ArrowDown"
              ) {
                e.preventDefault()
                setFocusDescription(true)
                title && titleMutation.mutate(title)
              }
            }}
            onBlur={() => {
              title && titleMutation.mutate(title)
            }}
            placeholder="Untitled"
          />
          <div>
            <MultiLineTextInput
              className="input-invisible min-h-12 rounded-md p-2 text-lg text-gray-700 hover:outline-gray-400 focus:outline-2 focus:outline-gray-500 dark:text-gray-300"
              value={description ?? ""}
              onChange={(value) => {
                console.log("Setting description to:", value)
                descriptionMutation.mutate(value)
                setDescription(value)
              }}
            />
          </div>
          {/* // Remove later */}
          <a href="https://supabase.com/dashboard/project/kstcbdcmgvzsitnywtue">
            <Badge className="my-4 bg-slate-200 p-1 px-2 text-gray-600 hover:bg-slate-300">
              ProjectID: {projectId}
            </Badge>
          </a>
          <a href="https://supabase.com/dashboard/project/kstcbdcmgvzsitnywtue">
            <Badge className="my-4 ml-4 bg-slate-200 p-1 px-2 text-gray-600 hover:bg-slate-300">
              Status: Draft
            </Badge>
          </a>
        </div>
        <Separator className="mx-auto mt-10 w-2/3" />
      </div>

      <div className="container my-12">
        {/* TODO: Fix this, these 2 components do the same thing */}
        {/* <DatasetPreview /> */}
        {projectId && <Workbook projectId={projectId} />}
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => {
              console.log("Running project...")
              toast.success("Running project...")
              projectAndWorkbook && runAction.mutate(projectAndWorkbook)
            }}
            variant={"brutal"}
            className="bg-purple-300 font-mono hover:bg-purple-400"
          >
            RUN WORKBOOK
          </Button>
        </div>
      </div>
    </>
  )
}

interface WorkbookProps {
  projectId: string
}

export function Workbook({ projectId }: Readonly<WorkbookProps>) {
  const [projectAndWorkbook] = useAtom(activeProjectAndWorkbook)
  const [activeFile] = useAtom(activeFileStore)

  const {
    csvData,
    headers,
    loading,
    error,
    // workbookId,
    // workbookName,
    // workbookFileType,
    handleFileUpload,
    // fetchFirstRows,
  } = useWorkbook(projectId)

  // const { data: fetchedPreprocessingConfig, isLoading: isConfigLoading } =

  const {
    preprocessingConfig,
    handleGlobalPreprocessingChange,
    handleColumnTypeChange,
    handleColumnPreprocessingChange,
  } = usePreprocessing(headers)

  return (
    <div className="flex">
      <ul className="flex w-1/6 list-none flex-col gap-4">
        <li value="Preprocessing">Preprocessing</li>
        <li value="Model Results">Model Results</li>
        <li value="Deploy">Deploy</li>
        <li value="Other">Other</li>
      </ul>
      <div className="flex w-5/6 flex-col gap-12">
        <>
          {/* Move to it's own component  */}
          <Card>
            <CardContent className="mt-4 space-y-2">
              {error && <div className="mb-4 text-red-500">{error}</div>}
              <Hide when={headers.length > 0}>
                <FileInputArea fileUpload={handleFileUpload} />
              </Hide>
              {/* {workbookId && (
                <Button
                  onClick={() => fetchFirstRows(workbookId)}
                  disabled={loading}
                  className="mb-4 ml-4"
                >
                  Refresh Data
                </Button>
              )} */}

              {csvData.length > 0 ? (
                <DatasetPreview
                  name={activeFile?.name ?? "Untitled"}
                  headers={headers}
                  data={csvData}
                  loading={loading}
                />
              ) : (
                <div>No data available</div>
              )}
            </CardContent>
            <CardFooter>
              <div>
                <GlobalPreprocessing
                  preprocessingConfig={preprocessingConfig}
                  handleGlobalPreprocessingChange={
                    handleGlobalPreprocessingChange
                  }
                />
                <ColumnPreprocessing
                  preprocessingConfig={preprocessingConfig}
                  handleColumnTypeChange={handleColumnTypeChange}
                  handleColumnPreprocessingChange={
                    handleColumnPreprocessingChange
                  }
                />
              </div>
            </CardFooter>
          </Card>
        </>
        <ModelSelector />
        <ModelDeployMain />
        <WTFIsOther projectId={projectId} />
      </div>
    </div>
  )
}

export default ProjectWorkbook
