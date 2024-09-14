import React, { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

import { Skeleton } from "../ui/skeleton"
import {
  DataProcessingSection,
  DataProcessingSectionHeader,
} from "./DataProcessingSection"
import { ModelDeploySection, ModelDeploySectionHeader } from "./ModelDeployMain"
import { ModelPrediction, ModelPredictionHeader } from "./ModelPrediction"
import { ModelSelector, ModelSelectorHeader } from "./ModelSelector"
import { ProjectHeader } from "./ProjectHeader"
import {
  SelectTaskTypeSection,
  SelectTaskTypeSectionHeader,
} from "./SelectTaskTypeSection"
import { useWorkbookActions } from "@/actions/workbookActions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

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
  // const [workbookConfig] = useAtom(workbookConfigStore) // replace with useQuery
  const { loadExistingWorkbook } = useWorkbookActions()

  const workbookQuery = useQuery({
    queryKey: ["workbook", projectId],
    queryFn: async () => {
      return await loadExistingWorkbook(projectId)
    },
  })

  useEffect(() => {
    if (workbookQuery.data?.config.taskType) {
      setActiveSection("preprocessing")
    }
    // TODO: Figure out how to go to other sections
  }, [workbookQuery.data])

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
    return !!workbookQuery.data?.config.taskType
  }

  const proceedToPreprocessing = () => {
    console.log(
      "Moving to data processing section with task type:",
      workbookQuery.data?.config.taskType,
    )
    setActiveSection("preprocessing")
  }

  const canProceedToModelCreation = () => {
    return (
      workbookQuery.data?.config.targetColumn ||
      workbookQuery.data?.config.taskType === "Clustering"
    )
  }

  const proceedToModelCreation = () => {
    console.log("Moving to model creation section")
    setActiveSection("modelCreation")
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
        return !canProceedToPreprocessing()
      case "preprocessing":
        return !canProceedToModelCreation()
      case "modelCreation":
        return !canProceedToModelPrediction()
      case "modelPrediction":
        return !canProceedToDeploy()
      default:
        return false
    }
  }
  const getNextButtonText = () => {
    switch (activeSection) {
      case "overview":
        return disabled() ? "Select Task Type" : "Start Preprocessing"
      case "preprocessing":
        return disabled() ? "Select Target Column" : "Proceed to Model Creation"
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
      <ProjectHeader projectId={projectId} />
      {workbookQuery.isLoading || !workbookQuery.data ? (
        <LoadingSkeleton />
      ) : (
        <div className="mb-12 mt-4">
          <SectionsNav
            activeSection={activeSection}
            setActiveSection={navigateToSection}
          />
          <Card className="min-h-[50vh] border-0 bg-transparent shadow-none">
            {workbookQuery.data !== null &&
              Object.entries(sections).map(([key, label]) => {
                const { Header, Content } = sectionComponents[label]
                return (
                  activeSection === key && (
                    <React.Fragment key={key}>
                      <Header />
                      <CardContent>
                        <Content
                          projectId={projectId}
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore
                          workbookData={workbookQuery.data}
                        />
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
    <div className="flex flex-col gap-4 px-12">
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
