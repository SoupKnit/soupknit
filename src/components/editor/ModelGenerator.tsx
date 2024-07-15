import React, { useEffect, useState } from "react"

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
import { sendCodeActionEvent } from "@/lib/eventBus"

import type { CodeActionComponent } from "@/lib/model"

type ModelType =
  | "KNN"
  | "KNN_Regressor"
  | "LogisticRegression"
  | "LinearRegression"
  | "RandomForestClassifier"
  | "RandomForest_Regressor"
  | "SVM"
  | "SVR"
  | "KMeans"

type TaskType = "classification" | "regression" | "clustering"

interface ModelConfig {
  task: TaskType
  model_type: ModelType | ""
  data_path: string
  X_columns: string[]
  y_column: string
  scale_features: boolean
  test_size: number
  tune_hyperparameters: boolean
  param_grid: Record<string, (string | number)[]>
  model_params: Record<string, any>
}

const ModelGenerator: CodeActionComponent = ({ editorRef }) => {
  const [config, setConfig] = useState<ModelConfig>({
    task: "classification",
    model_type: "",
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

  const modelImports: Record<ModelType, string> = {
    KNN: "from sklearn.neighbors import KNeighborsClassifier",
    KNN_Regressor: "from sklearn.neighbors import KNeighborsRegressor",
    LogisticRegression: "from sklearn.linear_model import LogisticRegression",
    LinearRegression: "from sklearn.linear_model import LinearRegression",
    RandomForestClassifier:
      "from sklearn.ensemble import RandomForestClassifier",
    RandomForest_Regressor:
      "from sklearn.ensemble import RandomForestRegressor",
    SVM: "from sklearn.svm import SVC",
    SVR: "from sklearn.svm import SVR",
    KMeans: "from sklearn.cluster import KMeans",
  }

  const generateImports = (config: ModelConfig): string => {
    const imports = [
      "import pandas as pd",
      "import numpy as np",
      "import matplotlib.pyplot as plt",
      "from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV",
      "from sklearn.preprocessing import StandardScaler",
      "from sklearn.metrics import accuracy_score, mean_squared_error, silhouette_score",
    ]

    if (config.model_type && config.model_type in modelImports) {
      imports.push(modelImports[config.model_type])
    }
    return imports.join("\n")
  }

  const generateCode = (config: ModelConfig): string => {
    const codePartsObject = {
      imports: generateImports(config),
      task: `\ntask = '${config.task}'`,
      dataLoading: `
# Load and preprocess data
data = pd.read_csv("${config.data_path}")
X = data[${JSON.stringify(config.X_columns)}]
y = data["${config.y_column}"] if "${config.y_column}" in data.columns else None

# Scale features if specified
if ${config.scale_features}:
    scaler = StandardScaler()
    X = pd.DataFrame(scaler.fit_transform(X), columns=X.columns)
`,
      modelCreation: `
# Create model
model = ${config.model_type}(${Object.entries(config.model_params)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")})
`,
      hyperparameterTuning: config.tune_hyperparameters
        ? `
# Hyperparameter tuning
param_grid = ${JSON.stringify(config.param_grid, null, 4)}
grid_search = GridSearchCV(model, param_grid, cv=5, scoring='accuracy' if task == 'classification' else 'neg_mean_squared_error')
grid_search.fit(X, y)
model = grid_search.best_estimator_
print(f"Best parameters: {grid_search.best_params_}")
`
        : "",
      modelTraining:
        config.task !== "clustering"
          ? `
# Split data and train model
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=${config.test_size}, random_state=42)
model.fit(X_train, y_train)
predictions = model.predict(X_test)

# Evaluate model
if task == 'classification':
    score = accuracy_score(y_test, predictions)
    print(f"Accuracy: {score:.2f}")
else:
    score = mean_squared_error(y_test, predictions)
    print(f"Mean Squared Error: {score:.2f}")

# Cross-validation
cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy' if task == 'classification' else 'neg_mean_squared_error')
print(f"Cross-validation score: {np.mean(cv_scores):.2f}")
`
          : `
# Perform clustering
predictions = model.fit_predict(X)
score = silhouette_score(X, predictions)
print(f"Silhouette Score: {score:.2f}")
`,
      visualization:
        config.task !== "clustering"
          ? `
# Visualize results
plt.figure(figsize=(10, 6))
plt.scatter(y_test, predictions, alpha=0.5)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
plt.xlabel('Actual Values')
plt.ylabel('Predicted Values')
plt.title('Actual vs Predicted Values')
plt.tight_layout()
plt.show()
`
          : `
# Visualize results
plt.figure(figsize=(10, 6))
plt.scatter(X.iloc[:, 0], X.iloc[:, 1], c=predictions, cmap='viridis')
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.title('Clustering Results')
plt.tight_layout()
plt.show()
`,
    }

    return Object.values(codePartsObject).join("\n")
  }

  const handleModelSelect = (model: ModelType) => {
    setConfig((prevConfig) => ({ ...prevConfig, model_type: model }))
  }

  const handleTaskSelect = (task: TaskType) => {
    setConfig((prevConfig) => ({ ...prevConfig, task, model_type: "" }))
  }

  const runBlock = () => {
    if (config.model_type) {
      const generatedCode = generateCode(config)
      try {
        sendCodeActionEvent(editorRef, {
          type: "add_cell",
          content: generatedCode,
        })
        // const iframe = document.getElementById(
        //   "jupyter-embedded",
        // ) as HTMLIFrameElement
        // if (iframe && iframe.contentWindow) {
        //   iframe.contentWindow.postMessage(
        //     { type: "add_cell", content: generatedCode },
        //     "*",
        //   )
        // }
      } catch {
        alert("Please select a model before generating code.")
      }
    }
  }

  useEffect(() => {
    if (config.model_type) {
      const generatedCode = generateCode(config)
      // Send the generated code to the iframe
      const iframe = document.getElementById("code-iframe") as HTMLIFrameElement
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: "code", content: generatedCode },
          "*",
        )
      }
    }
  }, [config])

  return (
    <div className="p-4">
      <Tabs defaultValue="classification" className="mb-4 w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="classification">Classification</TabsTrigger>
          <TabsTrigger value="regression">Regression</TabsTrigger>
          <TabsTrigger value="clustering">Clustering</TabsTrigger>
        </TabsList>
        {Object.entries(models).map(([category, modelList]) => (
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
        ))}
      </Tabs>

      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Data path"
          value={config.data_path}
          onChange={(e) =>
            setConfig((prev) => ({ ...prev, data_path: e.target.value }))
          }
        />
        <Input
          placeholder="Y column"
          value={config.y_column}
          onChange={(e) =>
            setConfig((prev) => ({ ...prev, y_column: e.target.value }))
          }
        />
        <Input
          placeholder="X columns (comma-separated)"
          value={config.X_columns.join(",")}
          onChange={(e) =>
            setConfig((prev) => ({
              ...prev,
              X_columns: e.target.value.split(","),
            }))
          }
        />
        <div className="flex items-center space-x-2">
          <Checkbox
            id="scale_features"
            checked={config.scale_features}
            onCheckedChange={(checked) =>
              setConfig((prev) => ({
                ...prev,
                scale_features: checked as boolean,
              }))
            }
          />
          <label htmlFor="scale_features">Scale features</label>
        </div>
      </div>
      <Button disabled={!config.model_type} onClick={runBlock} className="mb-4">
        Generate and Send Code
      </Button>
    </div>
  )
}

export default ModelGenerator
