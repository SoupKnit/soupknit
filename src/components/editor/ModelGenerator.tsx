import { createFileRoute, Link, Outlet } from "@tanstack/react-router"

import {
  Home,
  LineChart,
  Package,
  Package2,
  PanelLeft,
  ScanFace,
  Search,
  ShoppingCart,
  Users2,
} from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { TooltipProvider } from "@/components/ui/tooltip"

export const Route = createFileRoute("/app/_editor")({
  component: BaseLayout,
})

function BaseLayout() {
  return (
    <TooltipProvider>
      <div className="flex h-dvh w-full flex-col overflow-hidden">
        <EditorHeaderAndSidebar />

        <ScrollArea
          className="flex h-full w-full flex-col [&>[data-orientation=vertical]]:!top-14 [&>[data-orientation=vertical]]:!h-auto"
          type="scroll"
        >
          <main className="flex flex-1 overflow-x-hidden">
            <Outlet />
          </main>
        </ScrollArea>
        <EditorFooter />
      </div>
    </TooltipProvider>
  )
}

function EditorFooter() {
  return (
    <footer className="sticky bottom-0 z-30 ml-14 flex h-8 items-center gap-4 border-t border-gray-100 bg-white px-4 text-xs text-gray-400 shadow-md sm:py-2">
      <div className="mx-auto flex-grow text-center">
        Some info to display in the footer, stats like CPU usage, memory usage,
        etc.
      </div>
      <div className="inline-block h-3 w-3 rounded-full bg-green-300"></div>
      <div className="ml-auto">
        <span>Last run: {new Date().toLocaleTimeString()}</span>
      </div>
    </footer>
  )
}

function EditorHeaderAndSidebar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:ml-14 sm:h-auto sm:border-0 sm:bg-transparent sm:py-2">
      <Sidebar />
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="#">Folder</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="#">Subfolder</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Notebook Name</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <ScanFace className="h-6 w-6 border-none" />
            {/* <img
              src="/placeholder-user.jpg"
              width={36}
              height={36}
              alt="Avatar"
              className="overflow-hidden rounded-full"
            /> */}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

function Sidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="outline" className="sm:hidden">
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <Link
            to="/home"
            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
          >
            <Package2 className="h-5 w-5 transition-all group-hover:scale-110" />
            <span className="sr-only">SoupKnit Inc</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Home className="h-5 w-5" />
            All Projects
          </Link>
          <Link
            href="#"
            className="flex items-center gap-4 px-2.5 text-foreground"
          >
            <ShoppingCart className="h-5 w-5" />
            Orders
          </Link>
          <Link
            href="#"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Package className="h-5 w-5" />
            Blocks
          </Link>
          <Link
            href="#"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <Users2 className="h-5 w-5" />
            Sharing
          </Link>
          <Link
            href="#"
            className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
          >
            <LineChart className="h-5 w-5" />
            Settings
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

type ModelType = 'KNN' | 'KNN_Regressor' | 'LogisticRegression' | 'LinearRegression' | 
                 'RandomForestClassifier' | 'RandomForest_Regressor' | 'SVM' | 'SVR' | 'KMeans';

type TaskType = 'classification' | 'regression' | 'clustering';

interface ModelConfig {
  task: TaskType;
  model_type: ModelType | '';
  data_path: string;
  X_columns: string[];
  y_column: string;
  scale_features: boolean;
  test_size: number;
  tune_hyperparameters: boolean;
  param_grid: Record<string, (string | number)[]>;
  model_params: Record<string, any>;
}

const ModelGenerator: React.FC = () => {
  const [config, setConfig] = useState<ModelConfig>({
    task: 'classification',
    model_type: '',
    data_path: '',
    X_columns: [],
    y_column: '',
    scale_features: false,
    test_size: 0.2,
    tune_hyperparameters: false,
    param_grid: {},
    model_params: {}
  });

  const models: Record<TaskType, ModelType[]> = {
    classification: ['KNN', 'RandomForestClassifier', 'SVM'],
    regression: ['KNN_Regressor', 'LogisticRegression', 'LinearRegression', 'RandomForest_Regressor', 'SVR'],
    clustering: ['KMeans']
  };

  const modelImports: Record<ModelType, string> = {
    'KNN': "from sklearn.neighbors import KNeighborsClassifier",
    'KNN_Regressor': "from sklearn.neighbors import KNeighborsRegressor",
    'LogisticRegression': "from sklearn.linear_model import LogisticRegression",
    'LinearRegression': "from sklearn.linear_model import LinearRegression",
    'RandomForestClassifier': "from sklearn.ensemble import RandomForestClassifier",
    'RandomForest_Regressor': "from sklearn.ensemble import RandomForestRegressor",
    'SVM': "from sklearn.svm import SVC",
    'SVR': "from sklearn.svm import SVR",
    'KMeans': "from sklearn.cluster import KMeans"
  };

  const generateImports = (config: ModelConfig): string => {
    const imports = [
      "import pandas as pd",
      "import numpy as np",
      "import matplotlib.pyplot as plt",
      "from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV",
      "from sklearn.preprocessing import StandardScaler",
      "from sklearn.metrics import accuracy_score, mean_squared_error, silhouette_score"
    ];
    
    if (config.model_type && config.model_type in modelImports) {
      imports.push(modelImports[config.model_type]);
    }
    return imports.join("\n");
  };

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
model = ${config.model_type}(${Object.entries(config.model_params).map(([k, v]) => `${k}=${v}`).join(", ")})
`,
      hyperparameterTuning: config.tune_hyperparameters ? `
# Hyperparameter tuning
param_grid = ${JSON.stringify(config.param_grid, null, 4)}
grid_search = GridSearchCV(model, param_grid, cv=5, scoring='accuracy' if task == 'classification' else 'neg_mean_squared_error')
grid_search.fit(X, y)
model = grid_search.best_estimator_
print(f"Best parameters: {grid_search.best_params_}")
` : "",
      modelTraining: config.task !== 'clustering' ? `
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
` : `
# Perform clustering
predictions = model.fit_predict(X)
score = silhouette_score(X, predictions)
print(f"Silhouette Score: {score:.2f}")
`,
      visualization: config.task !== 'clustering' ? `
# Visualize results
plt.figure(figsize=(10, 6))
plt.scatter(y_test, predictions, alpha=0.5)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
plt.xlabel('Actual Values')
plt.ylabel('Predicted Values')
plt.title('Actual vs Predicted Values')
plt.tight_layout()
plt.show()
` : `
# Visualize results
plt.figure(figsize=(10, 6))
plt.scatter(X.iloc[:, 0], X.iloc[:, 1], c=predictions, cmap='viridis')
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.title('Clustering Results')
plt.tight_layout()
plt.show()
`
    };

    return Object.values(codePartsObject).join("\n");
  };

  const handleModelSelect = (model: ModelType) => {
    setConfig(prevConfig => ({ ...prevConfig, model_type: model }));
  };

  const handleTaskSelect = (task: TaskType) => {
    setConfig(prevConfig => ({ ...prevConfig, task, model_type: '' }));
  };

  const sendCodeToIframe = () => {
    if (config.model_type) {
      const generatedCode = generateCode(config);
      const iframe = document.getElementById('jupyter-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'add_cell', content: generatedCode }, '*');
      }
    } else {
      alert('Please select a model before generating code.');
    }
  };

  useEffect(() => {
    if (config.model_type) {
      const generatedCode = generateCode(config);
      // Send the generated code to the iframe
      const iframe = document.getElementById('code-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'code', content: generatedCode }, '*');
      }
    }
  }, [config]);



  return (
    <div className="p-4">
      <Tabs defaultValue="classification" className="w-full mb-4">
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
                  <DropdownMenuItem key={model} onSelect={() => handleModelSelect(model)}>
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
          onChange={(e) => setConfig(prev => ({ ...prev, data_path: e.target.value }))}
        />
        <Input 
          placeholder="Y column" 
          value={config.y_column} 
          onChange={(e) => setConfig(prev => ({ ...prev, y_column: e.target.value }))}
        />
        <Input 
          placeholder="X columns (comma-separated)" 
          value={config.X_columns.join(',')} 
          onChange={(e) => setConfig(prev => ({ ...prev, X_columns: e.target.value.split(',') }))}
        />
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="scale_features" 
            checked={config.scale_features} 
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, scale_features: checked as boolean }))}
          />
          <label htmlFor="scale_features">Scale features</label>
        </div>
      </div>
      <Button onClick={sendCodeToIframe} className="mb-4">Generate and Send Code</Button>
    </div>
  );
};

export default ModelGenerator;
