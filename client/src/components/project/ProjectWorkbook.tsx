import React, { useEffect, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useAtom, useSetAtom } from "jotai"
import { toast } from "sonner"

import { Skeleton } from "../ui/skeleton"
import {
  DataProcessingSection,
  DataProcessingSectionHeader,
} from "./DataProcessingSection"
import { ModelDeploySection, ModelDeploySectionHeader } from "./ModelDeployMain"
import { ModelPrediction, ModelPredictionHeader } from "./ModelPrediction"
import { ModelSelector, ModelSelectorHeader } from "./ModelSelector"
import { ProjectHeaderLarge, ProjectHeaderSmall } from "./ProjectHeader"
import {
  SelectTaskTypeSection,
  SelectTaskTypeSectionHeader,
} from "./SelectTaskTypeSection"
import * as workbookActions from "@/actions/workbookActions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useEnv } from "@/lib/clientEnvironment"
import { cn, isNonEmptyArray } from "@/lib/utils"
import {
  activeProjectAndWorkbook,
  setDataPreviewAtom,
  workbookConfigStore,
} from "@/store/workbookStore"

import type { WorkbookConfig } from "@soupknit/model/src/workbookSchemas"

const sections = {
  overview: "Task Type",
  preprocessing: "Preprocessing",
  modelCreation: "Model Creation",
  modelPrediction: "Model Prediction",
  deploy: "Deploy",
} as const

type Section = keyof typeof sections

const sectionComponents = {
  [sections.overview]: {
    Header: SelectTaskTypeSectionHeader,
    Content: SelectTaskTypeSection,
  },
  [sections.preprocessing]: {
    Header: DataProcessingSectionHeader,
    Content: DataProcessingSection,
  },
  [sections.modelCreation]: {
    Header: ModelSelectorHeader,
    Content: ModelSelector,
  },
  [sections.modelPrediction]: {
    Header: ModelPredictionHeader,
    Content: ModelPrediction,
  },
  [sections.deploy]: {
    Header: ModelDeploySectionHeader,
    Content: ModelDeploySection,
  },
}

const ProjectWorkbook: React.FC<{ projectId: string }> = ({ projectId }) => {
  const env = useEnv()
  const [collapsed, setCollapsed] = useState(true)
  const [activeSection, setActiveSection] = useState<Section>("overview")
  const [activeProject, setActiveProject] = useAtom(activeProjectAndWorkbook)
  const [workbookConfig, setWorkbookConfig] = useAtom(workbookConfigStore)

  const setDataPreview = useSetAtom(setDataPreviewAtom)
  const workbookQuery = useQuery({
    queryKey: ["workbook", projectId, env.supa],
    queryFn: async () => {
      return await workbookActions.loadExistingWorkbook(env.supa, projectId)
    },
  })

  // Ideally this is not required, since the project details are already loaded in the project header
  // Effect to update local state when workbook is fetched
  // update atoms when project is loaded
  // useEffect(() => {
  //   console.log("Project Query isSuccess, setting state", projectQuery.data)
  //   if (projectQuery.isSuccess && projectQuery.data) {
  //     setProjectAndWorkbook({
  //       projectId: projectQuery.data.id,
  //       projectTitle: projectQuery.data.title,
  //       description: projectQuery.data.description,
  //     })
  //   }
  // }, [projectQuery.isSuccess, projectQuery.data, setProjectAndWorkbook])

  useEffect(() => {
    console.log("Workbook Query isSuccess, setting state", workbookQuery.data)
    if (workbookQuery.data) {
      const data = workbookQuery.data
      console.log("Refetched Workbook data:", data)
      if (data?.id && data.project_id) {
        toast.success("Workbook loaded successfully")
        setActiveProject((p) => ({
          ...p,
          projectId: data.project_id,
          workbookId: data.id,
          files: data.files?.map((f) => ({
            name: f.name,
            file_url: f.file_url,
            file_type: f.file_type,
          })),
        }))

        if (data.config) {
          setWorkbookConfig(data.config)
          if (data.config.taskType) {
            // TODO: Figure out how to go to other sections
            setActiveSection("preprocessing")
          }
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
  }, [setActiveProject, workbookQuery.data, setWorkbookConfig, setDataPreview])

  const workbookConfigMutation = useMutation({
    mutationFn: async (config: WorkbookConfig) => {
      if (!activeProject?.workbookId) {
        throw new Error("No workbook ID found")
      }
      return await workbookActions.updateWorkbookConfig(env.supa, {
        workbookId: activeProject?.workbookId,
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

  // const runAction = useMutation({
  //   mutationFn: async (project: ActiveProject) => {
  //     console.log("Running project, workbook:", project)
  //     return workbookActions.runProject(env, {
  //       project: project,
  //     })
  //   },
  //   onError: (error) => {
  //     console.error("Error running workbook:", error)
  //   },
  // })

  const proceedToNextSection = async () => {
    switch (activeSection) {
      case "overview":
        if (workbookConfig.taskType) {
          console.log(
            "Moving to data processing section with task type:",
            workbookConfig.taskType,
          )
          setActiveSection("preprocessing")
        } else {
          console.warn(
            "Task type not selected. Please select a task type before proceeding.",
          )
          toast.error("Please select a task type before proceeding.")
        }
        break
      case "preprocessing":
        if (
          workbookConfig.targetColumn ||
          workbookConfig.taskType === "Clustering"
        ) {
          console.log("Moving to model creation section")
          workbookConfigMutation.mutate(workbookConfig, {
            onSuccess: () => {
              console.log("Workbook config updated successfully")
              setActiveSection("modelCreation")
            },
            onError: (error) => {
              console.error("Error updating workbook config:", error)
              toast.error(
                "Failed to update workbook configuration. Please try again.",
              )
            },
          })
        } else {
          console.warn(
            "Target column not selected. Please select a target column before proceeding.",
          )
          toast.error("Please select a target column before proceeding.")
        }
        break
      default:
        console.log("Moving to next section")
        setActiveSection("modelCreation")
    }
  }

  const disabled = () => {
    switch (activeSection) {
      case "overview":
        return !workbookConfig.taskType
      case "preprocessing":
        return !!workbookConfig.targetColumn || !!workbookConfig.taskType
      case "modelCreation":
        return true
    }
  }
  const getNextButtonText = () => {
    switch (activeSection) {
      case "overview":
        return disabled() ? "Select Task Type" : "Start Preprocessing"
      case "preprocessing":
        return workbookConfig.targetColumn ||
          workbookConfig.taskType === "Clustering"
          ? "Proceed to Model Creation"
          : "Select Target Column"
      case "modelCreation":
        return "Predict Values"
      case "modelPrediction":
        return "Deploy Model"
      default:
        return "Next"
    }
  }

  if (workbookQuery.isLoading) {
    return (
      <div className="app-container mt-10 flex flex-col items-center gap-4 px-12">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-96" />
        <div className="mt-20 flex gap-6">
          <Skeleton className="h-56 w-64" />
          <Skeleton className="h-56 w-64" />
          <Skeleton className="h-56 w-64" />
          <Skeleton className="h-56 w-64" />
        </div>
      </div>
    )
  }

  const SectionsSwitcher = () => {
    return (
      <div className="mx-auto mb-6 flex items-center justify-center">
        {Object.entries(sections).map(([key, label], index) => (
          <React.Fragment key={key}>
            <button
              onClick={() => setActiveSection(key as Section)}
              className={cn(
                "mx-2 text-xl",
                key == activeSection ? "font-semibold" : "font-thin",
              )}
            >
              {label}
            </button>
            {index < Object.keys(sections).length - 1 && (
              <span className="mx-2">→</span>
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="relative py-4">
        <div className="app-container mx-auto">
          {collapsed ? (
            <ProjectHeaderSmall
              activeProject={activeProject}
              setCollapsed={setCollapsed}
            />
          ) : (
            <ProjectHeaderLarge
              activeProject={activeProject}
              setActiveProject={setActiveProject}
              setCollapsed={setCollapsed}
              projectId={projectId}
            />
          )}
        </div>
      </div>
      <div className="app-container mb-12 mt-4">
        <SectionsSwitcher />
        <Card className="min-h-[50vh] border-0 bg-transparent shadow-none">
          {Object.entries(sections).map(([key, label]) => {
            const { Header, Content } = sectionComponents[label]
            return (
              activeSection === key && (
                <React.Fragment key={key}>
                  <Header />
                  <CardContent>
                    <Content projectId={projectId} />
                  </CardContent>
                </React.Fragment>
              )
            )
          })}
          <CardFooter className="justify-end">
            {activeSection !== "deploy" && (
              <Button onClick={proceedToNextSection} disabled={disabled()}>
                {getNextButtonText()}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* <div className="mt-4 flex justify-end">
          <Button
            onClick={() => {
              console.log("Running project...")
              toast.success("Running project...")
              activeProject && runAction.mutate(activeProject)
            }}
            variant={"brutal"}
            className="bg-purple-300 font-mono hover:bg-purple-400"
          >
            RUN WORKBOOK
          </Button>
        </div> */}
      </div>
    </>
  )
}

export default ProjectWorkbook
