import React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ModelResultsDisplay = ({ results }) => {
  if (!results) return null

  const renderMetrics = (metrics) => {
    return Object.entries(metrics).map(([key, value]) => (
      <div key={key} className="mb-2">
        <span className="font-semibold">{key}: </span>
        {typeof value === "number" ? value.toFixed(4) : JSON.stringify(value)}
      </div>
    ))
  }

  const handleDownloadPickle = () => {
    if (results.model_url) {
      const link = document.createElement("a")
      link.href = results.model_url
      link.download = `model_${results.task}_${results.model_type}.pkl`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      console.error("No model URL available for download")
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Model Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Task: {results.task}</h3>
            <p>Model Type: {results.model_type}</p>
          </div>
          {results.metrics && (
            <div>
              <h4 className="text-md font-semibold">Metrics:</h4>
              {renderMetrics(results.metrics)}
            </div>
          )}
          {results.evaluation_output && (
            <div>
              <h4 className="text-md font-semibold">Evaluation Output:</h4>
              <pre className="whitespace-pre-wrap rounded bg-gray-100 p-2">
                {results.evaluation_output}
              </pre>
            </div>
          )}
          {results.model_url && (
            <div>
              <Button onClick={handleDownloadPickle} className="mt-2">
                Download Model Pickle
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ModelResultsDisplay
