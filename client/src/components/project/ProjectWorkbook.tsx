import React, { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import {
  ProjectHeader,
  ProjectHeaderLarge,
  ProjectHeaderSmall,
} from "./ProjectHeader"
import {
  SelectTaskTypeSection,
  SelectTaskTypeSectionHeader,
} from "./SelectTaskTypeSection"
import { useProjectActions } from "@/actions/projectsActions"
import { useWorkbookActions } from "@/actions/workbookActions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useEnv } from "@/lib/clientEnvironment"
import { cn, isNonEmptyArray } from "@/lib/utils"
import {
  activeProjectAndWorkbook,
  projectDetailsStore,
  setDataPreviewAtom,
  workbookConfigStore,
} from "@/store/workbookStore"

import type {
  ActiveProject,
  WorkbookConfig,
} from "@soupknit/model/src/workbookSchemas"

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

// projectId is present in the URL
const ProjectWorkbook: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [activeSection, setActiveSection] = useState<Section>("overview")
  const [workbookConfig] = useAtom(workbookConfigStore) // replace with useQuery
  const { loadProject } = useProjectActions()
  const { loadExistingWorkbook } = useWorkbookActions()
  const [projectDetails, setProjectDetails] = useAtom(projectDetailsStore)
  const setDataPreview = useSetAtom(setDataPreviewAtom)

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      return await loadProject(projectId)
    },
    placeholderData: () => {
      if (!projectDetails) {
        return undefined
      }
      if (projectDetails.id === projectId) {
        return projectDetails
      }
      return undefined
    },
  })

  useEffect(() => {
    if (projectQuery.data) {
      console.log("This changed: Setting project details", projectQuery.data)
      setProjectDetails(projectQuery.data)
    }
  }, [projectQuery.data, setProjectDetails])

  const workbookQuery = useQuery({
    queryKey: ["workbook", projectId],
    queryFn: async () => {
      return await loadExistingWorkbook(projectId)
    },
    enabled: !!projectDetails,
  })

  // useEffect(() => {
  //   console.log("Workbook Query isSuccess, setting state", workbookQuery.data)
  //   if (workbookQuery.data) {
  //     const data = workbookQuery.data
  //     console.log("Refetched Workbook data:", data)
  //     if (data?.id && data.project_id) {
  //       toast.success("Workbook loaded successfully")
  //       // setActiveProject((p) => ({
  //       //   ...p,
  //       //   projectId: data.project_id,
  //       //   workbookId: data.id,
  //       //   files: data.files?.map((f) => ({
  //       //     name: f.name,
  //       //     file_url: f.file_url,
  //       //     file_type: f.file_type,
  //       //   })),
  //       // }))

  //       // if (data.config) {
  //       //   setWorkbookConfig(data.config)
  //       //   if (data.config.taskType) {
  //       //     // TODO: Figure out how to go to other sections
  //       //     setActiveSection("preprocessing")
  //       //   }
  //       //   // Prioritize preprocessed data if available
  //       //   if (isNonEmptyArray(data.preview_data_preprocessed)) {
  //       //     setDataPreview(data.preview_data_preprocessed)
  //       //   } else if (isNonEmptyArray(data.preview_data)) {
  //       //     setDataPreview(data.preview_data)
  //       //   }
  //       // }
  //     } else {
  //       console.error("No existing workbook found")
  //       toast.info("No existing workbook found")
  //     }
  //   }
  // }, [setActiveProject, workbookQuery.data, setWorkbookConfig, setDataPreview])

  // const workbookConfigMutation = useMutation({
  //   mutationFn: async (config: WorkbookConfig) => {
  //     if (!activeProject?.workbookId) {
  //       throw new Error("No workbook ID found")
  //     }
  //     return await updateWorkbookConfig({
  //       workbookId: activeProject?.workbookId,
  //       config,
  //     })
  //   },
  //   onError: (error) => {
  //     console.error("Error updating workbook config:", error)
  //   },
  //   onSuccess: () => {
  //     toast.success("Workbook configuration saved successfully")
  //   },
  // })

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

  const canProceedToPreprocessing = () => {
    return !!workbookConfig.taskType
  }

  const proceedToPreprocessing = () => {
    console.log(
      "Moving to data processing section with task type:",
      workbookConfig.taskType,
    )
    setActiveSection("preprocessing")
  }

  const canProceedToModelCreation = () => {
    return (
      workbookConfig.targetColumn || workbookConfig.taskType === "Clustering"
    )
  }

  const proceedToModelCreation = () => {
    console.log("Moving to model creation section")
    setActiveSection("modelCreation")
    // Note: Uncomment and adapt the following code when workbookConfigMutation is implemented
    // workbookConfigMutation.mutate(workbookConfig, {
    //   onSuccess: () => {
    //     console.log("Workbook config updated successfully")
    //     setActiveSection("modelCreation")
    //   },
    //   onError: (error) => {
    //     console.error("Error updating workbook config:", error)
    //     toast.error(
    //       "Failed to update workbook configuration. Please try again.",
    //     )
    //   },
    // })
  }

  const canProceedToModelPrediction = () => {
    // Add logic to check if we can proceed to model prediction
    return false // Placeholder, adjust as needed
  }

  const proceedToModelPrediction = () => {
    console.log("Moving to model prediction section")
    setActiveSection("modelPrediction")
  }

  const canProceedToDeploy = () => {
    // Add logic to check if we can proceed to deploy
    return true // Placeholder, adjust as needed
  }

  const proceedToDeploy = () => {
    console.log("Moving to deploy section")
    setActiveSection("deploy")
  }

  const navigateToSection = (section: Section) => {
    switch (section) {
      case "overview":
        setActiveSection("overview")
        break
      case "preprocessing":
        if (canProceedToPreprocessing()) {
          proceedToPreprocessing()
        } else {
          toast.error("Please select a task type before proceeding.")
        }
        break
      case "modelCreation":
        if (canProceedToModelCreation()) {
          proceedToModelCreation()
        } else {
          toast.error("Cannot proceed to model creation at this time.")
        }
        break
      case "modelPrediction":
        if (canProceedToModelPrediction()) {
          proceedToModelPrediction()
        } else {
          toast.error("Cannot proceed to model prediction at this time.")
        }
        break
      case "deploy":
        if (canProceedToDeploy()) {
          proceedToDeploy()
        } else {
          toast.error("Cannot proceed to deploy at this time.")
        }
        break
    }
  }

  const proceedToNextSection = () => {
    switch (activeSection) {
      case "overview":
        navigateToSection("preprocessing")
        break
      case "preprocessing":
        navigateToSection("modelCreation")
        break
      case "modelCreation":
        navigateToSection("modelPrediction")
        break
      case "modelPrediction":
        navigateToSection("deploy")
        break
      case "deploy":
        navigateToSection("deploy")
        break
      default:
        console.log("No more sections to proceed to")
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

  return (
    <div className="app-container relative">
      {!projectDetails ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* <ProjectHeader projectDetails={projectDetails} /> */}
          <div className="mb-12 mt-4">
            <SectionsNav
              activeSection={activeSection}
              setActiveSection={navigateToSection}
            />
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
          </div>
        </>
      )}

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
  )
}

const LoadingSkeleton = () => {
  return (
    <div className="app-container mt-10 flex flex-col gap-4 px-12">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-6 w-96" />
      <Skeleton className="mx-auto mt-6 h-6 w-96" />
      <Skeleton className="mt-8 h-6 w-32" />
      <Skeleton className="h-6 w-96" />
      <div className="mt-2 flex items-center justify-center gap-6">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  )
}
const SectionsNav = ({
  activeSection,
  setActiveSection,
}: {
  activeSection: Section
  setActiveSection: (section: Section) => void
}) => {
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

export default ProjectWorkbook
