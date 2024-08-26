import { useState } from "react"
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

export function ModelSelector() {
  const [isAutomated, setIsAutomated] = useState(false)
  const [selectedModel, setSelectedModel] = useState("")
  const [projectWorkbook] = useAtom(activeProjectAndWorkbook)
  const [workbookConfig] = useAtom(workbookConfigStore)
  const { createModel } = useWorkbook(projectWorkbook?.projectId || "")

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
    } catch (error) {
      console.error("Error creating model:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Selection</CardTitle>
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
                  <SelectItem value="linear_regression">
                    Linear Regression
                  </SelectItem>
                  <SelectItem value="random_forest">Random Forest</SelectItem>
                  <SelectItem value="gradient_boosting">
                    Gradient Boosting
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleCreateModel}>Create Model</Button>
        </div>
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
