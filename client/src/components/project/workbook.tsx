import React, { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { toast } from "sonner"

import { Settings, Trash2 } from "lucide-react"

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
import * as workbookActions from "@/actions/workbookActions"
import { ColumnPreprocessing } from "@/components/editor/ColumnPreprocessing"
import {
  DatasetPreview,
  FileInputArea,
} from "@/components/editor/DatasetPreview"
import { GlobalPreprocessing } from "@/components/editor/GlobalPreprocessing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useFetchPreprocessing,
  usePreProcessing,
} from "@/hooks/usePreprocessing"
import { useWorkbook } from "@/hooks/useWorkbook"
import { useEnv } from "@/lib/clientEnvironment"
import {
  activeFileStore,
  activeProjectAndWorkbook,
  workbookConfigStore,
  workbookStore,
} from "@/store/workbookStore"

import type { WorkbookConfig } from "@/store/workbookStore"
import type {
  ActiveProject,
  Workbook,
} from "@soupknit/model/src/workbookSchemas"

const sections = ["Overview", "Preprocessing", "Model Creation", "Deploy"]
const taskTypes = [
  "Regression",
  "Clustering",
  "Classification",
  "Time Series Prediction",
]

const ProjectWorkbook: React.FC<{ projectId: string }> = ({ projectId }) => {
  const env = useEnv()
  const [title, setTitle] = useState<string>()
  const [description, setDescription] = useState<string>()
  const [projectAndWorkbook] = useAtom(activeProjectAndWorkbook)
  const [workbook] = useAtom(workbookStore)
  const [activeSection, setActiveSection] = useState(0)
  // const [taskType, setTaskType] = useState("Regression")
  // const [targetColumn, setTargetColumn] = useState("")
  const [workbookConfig, setWorkbookConfig] = useAtom(workbookConfigStore)

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

  const deleteMutation = useMutation({
    mutationFn: async () => workbookActions.deleteProject(env.supa, projectId),
    onSuccess: () => {
      toast.success("Project deleted successfully")
      // Redirect to projects list or handle post-deletion navigation
    },
    onError: (error) => {
      console.error("Error deleting project:", error)
      toast.error("Failed to delete project")
    },
  })

  const workbookConfigMutation = useMutation({
    mutationFn: async (config: WorkbookConfig) => {
      if (!projectAndWorkbook?.workbookId) {
        throw new Error("No workbook ID found")
      }
      return await workbookActions.updateWorkbookConfig(env.supa, {
        workbookId: projectAndWorkbook?.workbookId,
        config,
      })
    },
    onError: (error) => {
      console.error("Error updating workbook config:", error)
    },
    onSuccess: () => {
      toast.success("Workbook configuration saved successfully")
    },
  })

  const runAction = useMutation({
    mutationFn: async (project: ActiveProject) => {
      console.log("Running project, workbook:", project)
      return workbookActions.runProject(env, {
        project: project,
      })
    },
    onError: (error) => {
      console.error("Error running workbook:", error)
    },
  })

  const proceedToNextSection = async () => {
    switch (activeSection) {
      case 0:
        if (workbookConfig.taskType) {
          setActiveSection(activeSection + 1)
        }
        break
      case 1:
        if (workbookConfig.targetColumn) {
          workbookConfigMutation.mutate(workbookConfig, {
            onSuccess: () => setActiveSection(activeSection + 1),
          })
        }
        break
      default:
        setActiveSection(activeSection + 1)
    }
  }

  const getNextButtonText = () => {
    switch (activeSection) {
      case 0:
        return "Start Preprocessing"
      case 1:
        return "Proceed to Model Creation"
      case 2:
        return "Deploy Model"
      default:
        return "Next"
    }
  }

  if (isLoading || !project) {
    return <div>Loading...</div>
  }

  return (
    <>
      <div className="relative bg-gray-100 pb-4 pt-10 dark:bg-slate-800/40">
        <div className="container mx-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="absolute right-4 top-4">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => deleteMutation.mutate()}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
          <a href="https://supabase.com/dashboard/project/kstcbdcmgvzsitnywtue">
            <Badge className="my-4 bg-slate-200 p-1 px-2 text-gray-600 hover:bg-slate-300">
              ProjectID: {projectId}
            </Badge>
            <Badge className="my-4 bg-slate-200 p-1 px-2 text-gray-600 hover:bg-slate-300">
              WorkbookId: {projectAndWorkbook?.workbookId}
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
        <div className="mb-6 flex items-center">
          {sections.map((section, index) => (
            <React.Fragment key={section}>
              <Button
                variant={index === activeSection ? "default" : "ghost"}
                onClick={() => setActiveSection(index)}
                className={index === activeSection ? "font-bold" : ""}
              >
                {section}
              </Button>
              {index < sections.length - 1 && <span className="mx-2">→</span>}
            </React.Fragment>
          ))}
        </div>

        <Card>
          <CardContent>
            {activeSection === 0 && (
              <>
                <h2 className="mb-4 text-2xl font-bold">Project Overview</h2>
                <Select
                  value={workbookConfig.taskType}
                  onValueChange={(e) => {
                    setWorkbookConfig((prev: any) => ({ ...prev, taskType: e }))
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a task type" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {activeSection === 1 && <Workbook projectId={projectId} />}

            {activeSection === 2 && (
              <>
                <h2 className="mb-4 text-2xl font-bold">Model Creation</h2>
                <ModelSelector />
              </>
            )}

            {activeSection === 3 && <ModelDeployMain />}
          </CardContent>
          <CardFooter className="justify-end">
            {activeSection < sections.length - 1 && (
              <Button onClick={proceedToNextSection}>
                {getNextButtonText()}
              </Button>
            )}
          </CardFooter>
        </Card>

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

function Workbook({
  projectId,
}: Readonly<{
  projectId: string
  targetColumn?: string
  setTargetColumn?: React.Dispatch<React.SetStateAction<string>>
}>) {
  // const [projectAndWorkbook] = useAtom(activeProjectAndWorkbook)
  const [workbookConfig, setWorkbookConfig] = useAtom(workbookConfigStore)
  const [activeFile] = useAtom(activeFileStore)

  const { csvData, headers, loading, error, handleFileUpload } =
    useWorkbook(projectId)

  useEffect(() => {
    console.log(workbookConfig)
  }, [workbookConfig])

  useFetchPreprocessing(headers)

  const setTargetColumn = (value: string) => {
    setWorkbookConfig((prev: any) => ({ ...prev, targetColumn: value }))
  }

  return (
    <>
      <h2 className="mb-4 text-2xl font-bold">Data Preprocessing</h2>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <Hide when={headers.length > 0}>
        <FileInputArea fileUpload={handleFileUpload} />
      </Hide>

      {csvData.length > 0 ? (
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
      ) : (
        <div>No data available</div>
      )}
      <div>
        <GlobalPreprocessing />
        <ColumnPreprocessing />
      </div>
    </>
  )
}

export default ProjectWorkbook
