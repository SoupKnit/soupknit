import { useMemo, useState } from "react"
import { useAtom } from "jotai"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useWorkbook } from "@/hooks/useWorkbook"
import {
  activeProjectAndWorkbook,
  workbookConfigStore,
} from "@/store/workbookStore"

const MODEL_MAP = {
  Regression: {
    linear_regression: "LinearRegression",
    ridge: "Ridge",
    lasso: "Lasso",
    elastic_net: "ElasticNet",
    decision_tree: "DecisionTreeRegressor",
    random_forest: "RandomForestRegressor",
    gradient_boosting: "GradientBoostingRegressor",
    svr: "SVR",
    knn: "KNeighborsRegressor",
  },
  Classification: {
    logistic_regression: "LogisticRegression",
    decision_tree: "DecisionTreeClassifier",
    random_forest: "RandomForestClassifier",
    gradient_boosting: "GradientBoostingClassifier",
    svc: "SVC",
    knn: "KNeighborsClassifier",
  },
  Clustering: {
    kmeans: "KMeans",
    dbscan: "DBSCAN",
  },
}

export function ModelSelector() {
  const [isAutomated, setIsAutomated] = useState(false)
  const [selectedModel, setSelectedModel] = useState("")
  const [projectWorkbook] = useAtom(activeProjectAndWorkbook)
  const [workbookConfig] = useAtom(workbookConfigStore)
  const { createModel } = useWorkbook(projectWorkbook?.projectId || "")
  const [modelResults, setModelResults] = useState(null)

  const availableModels = useMemo(() => {
    const taskType = workbookConfig.taskType
    return MODEL_MAP[taskType] || {}
  }, [workbookConfig.taskType])

  const handleCreateModel = async () => {
    if (!projectWorkbook?.projectId) {
      console.error("No project ID found")
      return
    }

    const modelConfig = {
      task: workbookConfig.taskType,
      model_type: isAutomated ? "automated" : selectedModel,
      target_column: workbookConfig.targetColumn,
      feature_columns: workbookConfig.featureColumns,
      // Add any other necessary configuration
    }

    try {
      const result = await createModel.mutateAsync({
        projectId: projectWorkbook.projectId,
        modelConfig,
      })
      console.log("Model creation result:", result)
      setModelResults(result)
    } catch (error) {
      console.error("Error creating model:", error)
    }
  }

  const handleDownloadPickle = () => {
    if (modelResults && modelResults.model_url) {
      // Create a temporary anchor element
      const link = document.createElement("a")
      link.href = modelResults.model_url
      link.download = `model_${projectWorkbook?.projectId}.pkl`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      console.error("No model URL available for download")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Selection for {workbookConfig.taskType}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="automated"
              checked={isAutomated}
              onCheckedChange={setIsAutomated}
            />
            <Label htmlFor="automated">Automated</Label>
          </div>
          {!isAutomated && (
            <div className="space-y-1">
              <Label htmlFor="model">Select Model</Label>
              <Select onValueChange={setSelectedModel} value={selectedModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(availableModels).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleCreateModel}>Create Model</Button>
        </div>
        {modelResults && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Model Results:</h3>
            <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-100 p-2">
              {JSON.stringify(modelResults, null, 2)}
            </pre>
            {modelResults.model_url && (
              <Button onClick={handleDownloadPickle} className="mt-2">
                Download Model Pickle
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ModelResults() {
  const [workbookConfig] = useAtom(workbookConfigStore)
  const modelResults = workbookConfig.modelResults

  if (!modelResults) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Results</CardTitle>
      </CardHeader>
      <CardContent>
        <pre>{JSON.stringify(modelResults, null, 2)}</pre>
      </CardContent>
    </Card>
  )
}

export function ModelSelectorHeader() {
  return (
    <CardHeader>
      <CardTitle>ML Project Setup</CardTitle>
      <CardDescription>
        Configure your machine learning project settings here. Click save when
        you are done.
      </CardDescription>
    </CardHeader>
  )
}
