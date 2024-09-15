import React, { useEffect, useMemo, useState } from "react"
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

import type { AppLabels } from "@/lib/labels"

const sections = {
  overview: "Task Type",
  preprocessing: "Preprocessing",
  modelCreation: "Model Creation",
  modelPrediction: "Model Prediction",
  deploy: "Deploy",
} as const

type Section = keyof typeof sections

const NextButtonLabels = {
  overview: {
    label: "Select Task Type",
    id: "ProjectWorkbook.NextButton.overview",
  },
  preprocessing: {
    label: "Proceed to Model Creation",
    id: "ProjectWorkbook.NextButton.preprocessing",
  },
  "preprocessing.disabled": {
    label: "Select Target Column",
    id: "ProjectWorkbook.NextButton.preprocessing.disabled",
  },
  modelCreation: {
    label: "Predict Values",
    id: "ProjectWorkbook.NextButton.modelCreation",
  },
  modelPrediction: {
    label: "Deploy Model",
    id: "ProjectWorkbook.NextButton.modelPrediction",
  },
} as const satisfies AppLabels

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

  const canProceedToModelCreation = () => {
    return (
      workbookQuery.data?.config.targetColumn ||
      workbookQuery.data?.config.taskType === "Clustering"
    )
  }

  const canProceedToModelPrediction = () => {
    // Add logic to check if we can proceed to model prediction
    return false // Placeholder, adjust as needed
  }

  const canProceedToDeploy = () => {
    // Add logic to check if we can proceed to deploy
    return true // Placeholder, adjust as needed
  }

  const navigateToSection = (section: Section) => {
    switch (section) {
      case "overview":
        setActiveSection("overview")
        break
      case "preprocessing":
        if (canProceedToPreprocessing()) {
          setActiveSection("preprocessing")
        } else {
          toast.error("Please select a task type before proceeding.")
        }
        break
      case "modelCreation":
        if (canProceedToModelCreation()) {
          setActiveSection("modelCreation")
        } else {
          toast.error("Cannot proceed to model creation at this time.")
        }
        break
      case "modelPrediction":
        if (canProceedToModelPrediction()) {
          setActiveSection("modelPrediction")
        } else {
          toast.error("Cannot proceed to model prediction at this time.")
        }
        break
      case "deploy":
        if (canProceedToDeploy()) {
          setActiveSection("deploy")
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

  const disabled = (activeSection: Section) => {
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

  const NextButton = ({ activeSection }: { activeSection: Section }) => {
    const isDisabled = useMemo(() => disabled(activeSection), [activeSection])
    switch (activeSection) {
      case "overview":
        return null
      case "preprocessing":
        return (
          <Button onClick={proceedToNextSection} disabled={isDisabled}>
            {isDisabled
              ? NextButtonLabels["preprocessing.disabled"].label
              : NextButtonLabels.preprocessing.label}
          </Button>
        )
      case "modelCreation":
        return (
          <Button onClick={proceedToNextSection} disabled={isDisabled}>
            {NextButtonLabels.modelCreation.label}
          </Button>
        )
      case "modelPrediction":
        return (
          <Button onClick={proceedToNextSection} disabled={isDisabled}>
            {NextButtonLabels.modelPrediction.label}
          </Button>
        )
      case "deploy":
        return null
      default:
        console.error("This should never happen: ", activeSection)
        return null
    }
  }

  return (
    <div className="app-container relative">
      <ProjectHeader projectId={projectId} />
      {workbookQuery.isLoading ? (
        <LoadingSkeleton />
      ) : (
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
              <NextButton activeSection={activeSection} />
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
