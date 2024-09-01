import React, { useEffect, useState } from "react"
import { useAtom } from "jotai"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWorkbook } from "@/hooks/useWorkbook"
import {
  activeProjectAndWorkbook,
  workbookConfigStore,
} from "@/store/workbookStore"

export function ModelPrediction() {
  const [workbookConfig] = useAtom(workbookConfigStore)
  const [projectWorkbook] = useAtom(activeProjectAndWorkbook)
  const { runPrediction } = useWorkbook(projectWorkbook?.projectId || "")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [predictionResult, setPredictionResult] = useState<any>(null)

  useEffect(() => {
    console.log("Feature columns:", workbookConfig.featureColumns)
    // Initialize formData with empty strings for each feature column
    if (workbookConfig.featureColumns) {
      const initialFormData = workbookConfig.featureColumns.reduce(
        (acc, column) => {
          acc[column] = ""
          return acc
        },
        {} as Record<string, string>,
      )
      setFormData(initialFormData)
    }
  }, [workbookConfig.featureColumns])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectWorkbook?.projectId) {
      console.error("No project ID found")
      return
    }

    try {
      const result = await runPrediction.mutateAsync({
        projectId: projectWorkbook.projectId,
        inputData: formData,
      })
      console.log("Prediction result:", result)
      setPredictionResult(result)
      toast.success("Prediction completed successfully")
    } catch (error) {
      console.error("Error running prediction:", error)
      toast.error("Error running prediction")
    }
  }

  if (
    !workbookConfig.featureColumns ||
    workbookConfig.featureColumns.length === 0
  ) {
    return (
      <Card>
        <CardContent>
          <p>
            No feature columns found. Please ensure your model is properly
            configured.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {workbookConfig.featureColumns.map((column) => (
            <div key={column} className="mb-4">
              <Label htmlFor={column}>{column}</Label>
              <Input
                type="text"
                id={column}
                name={column}
                value={formData[column] || ""}
                onChange={handleInputChange}
                required
              />
            </div>
          ))}
          <Button type="submit">Run Prediction</Button>
        </form>

        {predictionResult && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Prediction Result:</h3>
            <pre className="mt-2 whitespace-pre-wrap rounded bg-gray-100 p-2">
              {JSON.stringify(predictionResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ModelPredictionHeader() {
  return (
    <CardHeader>
      <CardTitle>Model Prediction</CardTitle>
      <CardDescription>
        Enter feature values to get a prediction from your trained model
      </CardDescription>
    </CardHeader>
  )
}
