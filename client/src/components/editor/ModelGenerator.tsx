// src/components/ModelGenerator.tsx
import React, { useState } from "react"

import { generateCode } from "@/actions/codeGenerationActions"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEnv } from "@/lib/clientEnvironment"

import type { CodeActionComponent } from "@/lib/commonTypes"
import type {
  Framework,
  ModelConfig,
  ModelType,
  TaskType,
} from "@soupknit/model/src/codeGeneratorSchemas"

const ModelGenerator: CodeActionComponent = ({ editorRef }) => {
  const env = useEnv(import.meta.env.DEV ? "dev" : "prod")
  const [config, setConfig] = useState<ModelConfig>({
    task: "classification",
    model_type: "",
    framework: "sklearn",
    data_path: "",
    X_columns: [],
    y_column: "",
    scale_features: false,
    test_size: 0.2,
    tune_hyperparameters: false,
    param_grid: {},
    model_params: {},
  })

  const models: Record<TaskType, ModelType[]> = {
    classification: ["KNN", "RandomForestClassifier", "SVM"],
    regression: [
      "KNN_Regressor",
      "LogisticRegression",
      "LinearRegression",
      "RandomForest_Regressor",
      "SVR",
    ],
    clustering: ["KMeans"],
  }

  const frameworks: Framework[] = ["sklearn", "tensorflow", "pytorch"]

  const handleModelSelect = (model: ModelType) => {
    setConfig((prevConfig: ModelConfig) => ({
      ...prevConfig,
      model_type: model,
    }))
  }

  const handleTaskSelect = (task: TaskType) => {
    setConfig((prevConfig: ModelConfig) => ({
      ...prevConfig,
      task,
      model_type: "",
    }))
  }

  const handleFrameworkSelect = (framework: Framework) => {
    setConfig((prevConfig: ModelConfig) => ({ ...prevConfig, framework }))
  }

  const sendToIframe = (content: string) => {
    const iframe = document.getElementById(
      "jupyter-embedded",
    ) as HTMLIFrameElement | null
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: "add_cell", content }, "*")
    } else {
      console.error("Iframe or contentWindow not found")
    }
  }

  const runBlock = async () => {
    if (config.model_type) {
      try {
        const response = await generateCode(config, env)
        if (!response) {
          throw new Error("Failed to generate code")
        }
        console.log(response)
        // codeSections.forEach((section: string, index: number) => {
        //   setTimeout(() => sendToIframe(section), index * 150)
        // })
      } catch (error) {
        console.error(error)
      }
    }
  }

  return (
    <div className="p-4">
      <Tabs defaultValue="classification" className="mb-4 w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="classification">Classification</TabsTrigger>
          <TabsTrigger value="regression">Regression</TabsTrigger>
          <TabsTrigger value="clustering">Clustering</TabsTrigger>
        </TabsList>
        {(Object.entries(models) as [TaskType, ModelType[]][]).map(
          ([category, modelList]) => (
            <TabsContent value={category} key={category}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Select {category} model</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {modelList.map((model) => (
                    <DropdownMenuItem
                      key={model}
                      onSelect={() => handleModelSelect(model)}
                    >
                      {model}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsContent>
          ),
        )}
      </Tabs>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Select Framework</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {frameworks.map((framework) => (
            <DropdownMenuItem
              key={framework}
              onSelect={() => handleFrameworkSelect(framework)}
            >
              {framework}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <Input
          placeholder="Data path"
          value={config.data_path}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setConfig((prev: ModelConfig) => ({
              ...prev,
              data_path: e.target.value,
            }))
          }
        />
        <Input
          placeholder="Y column"
          value={config.y_column}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setConfig((prev: ModelConfig) => ({
              ...prev,
              y_column: e.target.value,
            }))
          }
        />
        <Input
          placeholder="X columns (comma-separated)"
          value={config.X_columns.join(",")}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setConfig((prev: ModelConfig) => ({
              ...prev,
              X_columns: e.target.value.split(","),
            }))
          }
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="scale_features"
            checked={config.scale_features}
            onCheckedChange={(checked: boolean) =>
              setConfig((prev: ModelConfig) => ({
                ...prev,
                scale_features: checked,
              }))
            }
          />
          <label htmlFor="scale_features">Scale features</label>
        </div>
      </div>
      <Button disabled={!config.model_type} onClick={runBlock} className="mt-4">
        Generate and Send Code
      </Button>
    </div>
  )
}

export default ModelGenerator
