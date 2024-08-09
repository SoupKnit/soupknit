import React, { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"

import { ModelDeployMain } from "../deployModel/ModelDeployMain"
import { MultiLineTextInput } from "../editor/MultiLineText"
import { ModelSelector } from "../modelGenerator/ModelSelector"
import { WTFIsOther } from "../Other"
import { Separator } from "../ui/separator"
import { Hide } from "../util/ConditionalShow"
import {
  loadProject,
  updateProjectDescription,
  updateProjectTitle,
} from "@/actions/projectsActions"
import { runProjectAction } from "@/actions/workbookActions"
import { fetchPreprocessingConfig } from "@/api/preprocessing"
import { ColumnPreprocessing } from "@/components/editor/ColumnPreprocessing"
import { FileInputArea } from "@/components/editor/DatasetPreview"
import { GlobalPreprocessing } from "@/components/editor/GlobalPreprocessing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePreprocessing } from "@/hooks/usePreprocessing"
import { useWorkbook } from "@/hooks/useWorkbook"
import { useEnv } from "@/lib/clientEnvironment"
import { useSupa } from "@/lib/supabaseClient"
import {
  activeProject,
  projectDetailsStore,
  workbookStore,
} from "@/store/workbookStore"

import type { Workbook } from "@soupknit/model/src/workbookSchemas"

interface WorkbookProps {
  projectId: string
}

interface Project {
  id: string
  title: string
  description: string
}

const ProjectWorkbook: React.FC<WorkbookProps> = ({ projectId }) => {
  const supa = useSupa()
  const env = useEnv()
  const [workbook] = useAtom(workbookStore)

  const { isLoading, data: project = null } = useQuery({
    queryKey: ["project", projectId, supa],
    queryFn: async () => loadProject(supa, projectId),
  })

  const [title, setTitle] = useState<string>(project?.title)
  const [description, setDescription] = useState<string>(project?.description)

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
      updateProjectTitle(supa, title, projectId),
    onSuccess: () => {
      console.log("Title saved successfully")
    },
    onError: (error) => {
      console.error("Error saving title:", error)
    },
  })

  const descriptionMutation = useMutation({
    mutationFn: async (description: string) =>
      updateProjectDescription(supa, description, projectId),
    onSuccess: () => {
      console.log("Description saved successfully")
    },
    onError: (error) => {
      console.error("Error saving description:", error)
    },
  })

  const runAction = useMutation({
    mutationFn: async (workbook: Workbook | null) => {
      console.log("Running workbook:", workbook)
      if (!workbook) {
        throw new Error("No workbook to run")
      }
      return runProjectAction(env, {
        workbook,
        project: activeProject,
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
      <div className="bg-gray-100 pb-4 pt-10">
        <div className="container mx-auto">
          {/* <h2 className="mb-4 text-2xl font-bold">Project Details</h2> */}
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
                titleMutation.mutate(title)
              }
            }}
            onBlur={() => titleMutation.mutate(title)}
            placeholder="Untitled"
          />
          <div className="my-4">
            <MultiLineTextInput
              className="input-invisible min-h-12 rounded-md p-2 text-lg text-gray-700 hover:outline-gray-400 focus:outline-2 focus:outline-gray-500"
              value={description}
              onChange={(value) => {
                console.log("Setting description to:", value)
                descriptionMutation.mutate(value)
                setDescription(value)
              }}
            />
          </div>
        </div>
        <Separator className="mx-auto mt-10 w-2/3" />
      </div>

      <div className="container my-12">
        {/* TODO: Fix this, these 2 components do the same thing */}
        {/* <DatasetPreview /> */}
        <Workbook projectId={projectId} />
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => runAction.mutate(workbook)}
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
  const supa = useSupa()

  const {
    csvData,
    headers,
    loading,
    error,
    workbookId,
    workbookName,
    workbookFileType,
    handleFileSelect,
    fetchFirstRows,
  } = useWorkbook(projectId)

  // const { data: fetchedPreprocessingConfig, isLoading: isConfigLoading } =

  const {
    preprocessingConfig,
    handleGlobalPreprocessingChange,
    handleColumnTypeChange,
    handleColumnPreprocessingChange,
  } = usePreprocessing(headers)

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
                <FileInputArea fileUpload={handleFileSelect} />
              </Hide>
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
                  Dataset: {workbookName} ({workbookFileType})
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
                        <TableBody>{renderTableContent()}</TableBody>
                      </Table>
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
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
