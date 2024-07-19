// src/lib/mlUtils.ts

import type {
  Framework,
  ModelConfig,
  ModelType,
} from "@soupknit/model/src/codeGeneratorSchemas"

// remove from client
const modelImports: Record<Framework, Record<ModelType, string>> = {
  sklearn: {
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
  },
  tensorflow: {
    KNN: "from tensorflow.keras.models import Sequential\nfrom tensorflow.keras.layers import Dense",
    KNN_Regressor:
      "from tensorflow.keras.models import Sequential\nfrom tensorflow.keras.layers import Dense",
    LogisticRegression:
      "from tensorflow.keras.models import Sequential\nfrom tensorflow.keras.layers import Dense",
    LinearRegression:
      "from tensorflow.keras.models import Sequential\nfrom tensorflow.keras.layers import Dense",
    RandomForestClassifier:
      "from tensorflow.keras.models import Sequential\nfrom tensorflow.keras.layers import Dense",
    RandomForest_Regressor:
      "from tensorflow.keras.models import Sequential\nfrom tensorflow.keras.layers import Dense",
    SVM: "from tensorflow.keras.models import Sequential\nfrom tensorflow.keras.layers import Dense",
    SVR: "from tensorflow.keras.models import Sequential\nfrom tensorflow.keras.layers import Dense",
    KMeans:
      "from tensorflow.keras.models import Sequential\nfrom tensorflow.keras.layers import Dense",
  },
  pytorch: {
    KNN: "import torch\nimport torch.nn as nn",
    KNN_Regressor: "import torch\nimport torch.nn as nn",
    LogisticRegression: "import torch\nimport torch.nn as nn",
    LinearRegression: "import torch\nimport torch.nn as nn",
    RandomForestClassifier: "import torch\nimport torch.nn as nn",
    RandomForest_Regressor: "import torch\nimport torch.nn as nn",
    SVM: "import torch\nimport torch.nn as nn",
    SVR: "import torch\nimport torch.nn as nn",
    KMeans: "import torch\nimport torch.nn as nn",
  },
}

// remove from client
const generateImports = (config: ModelConfig): string => {
  const imports = [
    "import pandas as pd",
    "import numpy as np",
    "import matplotlib.pyplot as plt",
    "from sklearn.model_selection import train_test_split",
    "from sklearn.preprocessing import StandardScaler",
    "from sklearn.metrics import accuracy_score, mean_squared_error, silhouette_score",
  ]

  if (config.model_type) {
    imports.push(modelImports[config.framework][config.model_type])
  }
  return imports.join("\n")
}

// remove from client
const generateModelCode = (config: ModelConfig): string => {
  switch (config.framework) {
    case "sklearn":
      return `model = ${config.model_type}(${Object.entries(config.model_params)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")})`
    case "tensorflow":
      return `
model = Sequential([
    Dense(64, activation='relu', input_shape=(len(X_columns),)),
    Dense(32, activation='relu'),
    Dense(1, activation='sigmoid' if task == 'classification' else 'linear')
])
model.compile(optimizer='adam', loss='binary_crossentropy' if task == 'classification' else 'mse', metrics=['accuracy' if task == 'classification' else 'mse'])
      `
    case "pytorch":
      return `
class Net(nn.Module):
    def __init__(self):
        super(Net, self).__init__()
        self.fc1 = nn.Linear(len(X_columns), 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, 1)

    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)
        return x

model = Net()
criterion = nn.BCEWithLogitsLoss() if task == 'classification' else nn.MSELoss()
optimizer = torch.optim.Adam(model.parameters())
      `
    default:
      throw new Error(`Unsupported framework: ${config.framework}`)
  }
}

// remove from client
export const generateCodeClient = (config: ModelConfig): string[] => {
  const sections: { title: string; code: string }[] = [
    {
      title: "Imports",
      code: generateImports(config),
    },
    {
      title: "Task Definition",
      code: `# Define the task\ntask = '${config.task}'`,
    },
    {
      title: "Load and Preprocess Data",
      code: `
  # Load and preprocess data
  data = pd.read_csv("${config.data_path}")
  X = data[${JSON.stringify(config.X_columns)}]
  y = data["${config.y_column}"] if "${config.y_column}" in data.columns else None
  
  # Scale features if specified
  if ${config.scale_features}:
      scaler = StandardScaler()
      X = pd.DataFrame(scaler.fit_transform(X), columns=X.columns)
  
  # Split data
  X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=${config.test_size}, random_state=42)
  `,
    },
    {
      title: "Create Model",
      code: generateModelCode(config),
    },
  ]

  if (config.framework === "sklearn") {
    sections.push({
      title: "Train and Evaluate Model",
      code: `
  # Train model
  model.fit(X_train, y_train)
  predictions = model.predict(X_test)
  
  # Evaluate model
  if task == 'classification':
      score = accuracy_score(y_test, predictions)
      print(f"Accuracy: {score:.2f}")
  else:
      score = mean_squared_error(y_test, predictions)
      print(f"Mean Squared Error: {score:.2f}")
  `,
    })
  } else if (config.framework === "tensorflow") {
    sections.push({
      title: "Train and Evaluate Model",
      code: `
  # Train model
  history = model.fit(X_train, y_train, epochs=100, validation_split=0.2, verbose=0)
  
  # Evaluate model
  loss, metric = model.evaluate(X_test, y_test)
  print(f"{'Accuracy' if task == 'classification' else 'Mean Squared Error'}: {metric:.2f}")
  `,
    })
  } else if (config.framework === "pytorch") {
    sections.push({
      title: "Train and Evaluate Model",
      code: `
  # Train model
  X_train_tensor = torch.FloatTensor(X_train.values)
  y_train_tensor = torch.FloatTensor(y_train.values)
  
  for epoch in range(100):
      optimizer.zero_grad()
      outputs = model(X_train_tensor)
      loss = criterion(outputs, y_train_tensor.unsqueeze(1))
      loss.backward()
      optimizer.step()
  
  # Evaluate model
  model.eval()
  with torch.no_grad():
      X_test_tensor = torch.FloatTensor(X_test.values)
      y_test_tensor = torch.FloatTensor(y_test.values)
      predictions = model(X_test_tensor)
      if task == 'classification':
          predictions = (predictions > 0.5).float()
          score = accuracy_score(y_test, predictions.numpy())
          print(f"Accuracy: {score:.2f}")
      else:
          score = mean_squared_error(y_test, predictions.numpy())
          print(f"Mean Squared Error: {score:.2f}")
  `,
    })
  }

  // Return the array of code strings
  return sections.map((section) => `# ${section.title}\n${section.code.trim()}`)
}
