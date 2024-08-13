import React, { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useAtom } from "jotai"
import { toast } from "sonner"

import { Settings, Trash2 } from "lucide-react"

import { MultiLineTextInput } from "../editor/MultiLineText"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import {
  DataProcessingSection,
  DataProcessingSectionHeader,
} from "./DataProcessingSection"
import { ModelDeploySection, ModelDeploySectionHeader } from "./ModelDeployMain"
import { ModelSelector, ModelSelectorHeader } from "./ModelSelector"
import {
  SelectTaskTypeSection,
  SelectTaskTypeSectionHeader,
} from "./SelectTaskTypeSection"
import {
  loadProject,
  updateProjectDescription,
  updateProjectTitle,
} from "@/actions/projectsActions"
import * as workbookActions from "@/actions/workbookActions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEnv } from "@/lib/clientEnvironment"
import { cn } from "@/lib/utils"
import {
  activeProjectAndWorkbook,
  activeProjectAndWorkbookAtom,
  workbookConfigStore,
} from "@/store/workbookStore"

import type { WorkbookConfig } from "@/store/workbookStore"
import type { ActiveProject } from "@soupknit/model/src/workbookSchemas"

const sections = [
  "Overview",
  "Preprocessing",
  "Model Creation",
  "Deploy",
] as const

const ProjectWorkbook: React.FC<{ projectId: string }> = ({ projectId }) => {
  const env = useEnv()
  const [title, setTitle] = useState<string>()
  const [description, setDescription] = useState<string>()
  const [projectAndWorkbook] = useAtom(activeProjectAndWorkbook)
  const [activeSection, setActiveSection] = useState(0)
  const [workbookConfig] = useAtom(workbookConfigStore)
  const [activeProject, setActiveProject] = useAtom(
    activeProjectAndWorkbookAtom,
  )
  const navigate = useNavigate({ from: "/app" })

  const { isLoading, data: project = null } = useQuery({
    queryKey: ["project", projectId, env.supa],
    queryFn: async () => loadProject(env.supa, projectId),
    enabled: !!projectId,
  })

  useEffect(() => {
    if (isLoading === false && project) {
      setTitle(project.title)
      setDescription(project.description)
    }
  }, [project, isLoading])

  useEffect(() => {
    if (
      projectId &&
      (!activeProject || activeProject.projectId !== projectId)
    ) {
      setActiveProject({ projectId })
    }
  }, [projectId, activeProject, setActiveProject])

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

  if (isLoading) {
    return <div>Loading project...</div>
  }

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <>
      <div className="relative pb-4 pt-10">
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
          <div className="my-4 flex items-center">
            <DeleteDialog
              onConfirm={() => {
                deleteMutation.mutate()
                navigate({ to: "/app" })
              }}
            >
              <Button
                variant="ghost"
                className="mr-2 h-6 w-8 rounded-full p-0 hover:text-red-500"
              >
                <Trash2 className="h-4" />
              </Button>
            </DeleteDialog>
            <a href="https://supabase.com/dashboard/project/kstcbdcmgvzsitnywtue">
              <Badge className="bg-slate-200 p-1 px-2 text-gray-600 hover:bg-slate-300">
                ProjectID: {projectId}
              </Badge>
              <Badge className="bg-slate-200 p-1 px-2 text-gray-600 hover:bg-slate-300">
                WorkbookId: {projectAndWorkbook?.workbookId}
              </Badge>
            </a>
            <a href="https://supabase.com/dashboard/project/kstcbdcmgvzsitnywtue">
              <Badge className="ml-4 bg-slate-200 p-1 px-2 text-gray-600 hover:bg-slate-300">
                Status: Draft
              </Badge>
            </a>
          </div>
        </div>
        <Separator className="mx-auto w-2/3" />
      </div>

      <div className="container mb-12 mt-4">
        <div className="mx-auto mb-6 flex items-center justify-center">
          {sections.map((section, index) => (
            <React.Fragment key={section}>
              <div
                role="button"
                onClick={() => setActiveSection(index)}
                className={cn(
                  "mx-2 text-xl",
                  index === activeSection ? "font-semibold" : "font-thin",
                )}
              >
                {section}
              </div>
              {index < sections.length - 1 && <span className="mx-2">→</span>}
            </React.Fragment>
          ))}
        </div>

        <Card className="min-h-[50vh] border-0 bg-transparent shadow-none">
          {activeSection === 0 && (
            <>
              <SelectTaskTypeSectionHeader />
              <CardContent>
                <SelectTaskTypeSection />
              </CardContent>
            </>
          )}

          {activeSection === 1 && (
            <>
              <DataProcessingSectionHeader />
              <CardContent>
                <DataProcessingSection projectId={projectId} />
              </CardContent>
            </>
          )}

          {activeSection === 2 && (
            <>
              <ModelSelectorHeader />
              <CardContent>
                <ModelSelector />
              </CardContent>
            </>
          )}

          {activeSection === 3 && (
            <>
              <ModelDeploySectionHeader />
              <CardContent>
                <ModelDeploySection />
              </CardContent>
            </>
          )}
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

export function DeleteDialog({
  children,
  onConfirm,
}: {
  children: React.ReactNode
  onConfirm: () => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={onConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ProjectWorkbook
