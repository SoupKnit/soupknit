import React, { useCallback, useEffect, useMemo, useState } from "react"
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
  const { predictMutation } = useWorkbook(projectWorkbook?.projectId || "")
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [predictionResult, setPredictionResult] = useState<any>(null)

  const currentFeatureColumns = useMemo(
    () =>
      workbookConfig.preProcessingConfig?.columns
        .map((col) => col.name)
        .filter((col) => col !== workbookConfig.targetColumn) || [],
    [workbookConfig],
  )

  useEffect(() => {
    const initialFormData = currentFeatureColumns.reduce(
      (acc, column) => {
        acc[column] = ""
        return acc
      },
      {} as Record<string, string>,
    )
    setFormData(initialFormData)
  }, [currentFeatureColumns])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    },
    [],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!projectWorkbook?.projectId) {
        console.error("No project ID found")
        return
      }

      const filteredFormData = Object.fromEntries(
        Object.entries(formData).filter(([key]) =>
          currentFeatureColumns.includes(key),
        ),
      )

      try {
        const result = await predictMutation.mutateAsync({
          projectId: projectWorkbook.projectId,
          inputData: filteredFormData,
        })
        console.log("Prediction result:", result)
        setPredictionResult(result.prediction)
      } catch (error) {
        console.error("Error running prediction:", error)
        toast.error("Error running prediction")
      }
    },
    [formData, projectWorkbook, predictMutation, currentFeatureColumns],
  )

  if (currentFeatureColumns.length === 0) {
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
      <CardHeader>
        <CardTitle>Model Prediction</CardTitle>
        <CardDescription>
          Enter feature values to get a prediction from your trained model
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {currentFeatureColumns.map((column) => (
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
          <Button type="submit" disabled={predictMutation.isLoading}>
            {predictMutation.isLoading
              ? "Running Prediction..."
              : "Run Prediction"}
          </Button>
        </form>

        {predictionResult !== null && (
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
