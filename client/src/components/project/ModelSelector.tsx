import { useState } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export function ModelSelector() {
  const [isAutomated, setIsAutomated] = useState(false)
  const [selectedTask, setSelectedTask] = useState("")

  return (
    <>
      <div className="space-y-1">
        <Label htmlFor="task">Select Task</Label>
        <Select onValueChange={(value) => setSelectedTask(value)}>
          <SelectTrigger id="task">
            <SelectValue placeholder="Select task" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classification">Classification</SelectItem>
            <SelectItem value="regression">Regression</SelectItem>
            <SelectItem value="clustering">Clustering</SelectItem>
            <SelectItem value="time-series">Time Series Prediction</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {selectedTask !== "clustering" && (
        <div className="space-y-1">
          <Label htmlFor="target-column">Target Column</Label>
          <Select>
            <SelectTrigger id="target-column">
              <SelectValue placeholder="Select target column" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="column1">Column 1</SelectItem>
              <SelectItem value="column2">Column 2</SelectItem>
              <SelectItem value="column3">Column 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
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
          <Select>
            <SelectTrigger id="model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="model1">Model 1</SelectItem>
              <SelectItem value="model2">Model 2</SelectItem>
              <SelectItem value="model3">Model 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  )
}

export function ModelSelectorHeader() {
  return (
    <CardHeader>
      <CardTitle>ML Project Setup</CardTitle>
      <CardDescription>
        Configure your machine learning project settings here. Click save when
        you&apm;re done.
      </CardDescription>
    </CardHeader>
  )
}
