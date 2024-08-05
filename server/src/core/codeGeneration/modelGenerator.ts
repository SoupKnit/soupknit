import { BaseGenerator } from "./baseGenerator";

export class SklearnGenerator extends BaseGenerator {
  generateImports(): string {
    const imports = [
      "import pandas as pd",
      "import numpy as np",
      "from sklearn.model_selection import train_test_split",
      "from sklearn.preprocessing import StandardScaler",
    ];

    const { model_type, task } = this.config;

    if (task === "classification") {
      imports.push(
        "from sklearn.metrics import accuracy_score, classification_report",
      );
    } else if (task === "regression") {
      imports.push("from sklearn.metrics import mean_squared_error, r2_score");
    }

    const modelImports: Record<string, string | Record<string, string>> = {
      RandomForest: {
        classification: "from sklearn.ensemble import RandomForestClassifier",
        regression: "from sklearn.ensemble import RandomForestRegressor",
      },
      LogisticRegression: "from sklearn.linear_model import LogisticRegression",
      LinearRegression: "from sklearn.linear_model import LinearRegression",
      SVM: {
        classification: "from sklearn.svm import SVC",
        regression: "from sklearn.svm import SVR",
      },
      KNeighbors: {
        classification: "from sklearn.neighbors import KNeighborsClassifier",
        regression: "from sklearn.neighbors import KNeighborsRegressor",
      },
      DecisionTree: {
        classification: "from sklearn.tree import DecisionTreeClassifier",
        regression: "from sklearn.tree import DecisionTreeRegressor",
      },
      GradientBoosting: {
        classification:
          "from sklearn.ensemble import GradientBoostingClassifier",
        regression: "from sklearn.ensemble import GradientBoostingRegressor",
      },
    };

    if (model_type in modelImports) {
      const importStatement = modelImports[model_type];
      if (typeof importStatement === "object") {
        imports.push(importStatement[task] || "");
      } else {
        imports.push(importStatement || "");
      }
    } else {
      throw new Error(`Unsupported model type: ${model_type}`);
    }

    return imports.join("\n");
  }

  generateDataLoading(): string {
    return `
# Load and preprocess data
data = pd.read_csv("${this.config.data_path}")
X = data.drop('${this.config.target_column}', axis=1)
y = data['${this.config.target_column}']

# Scale features
scaler = StandardScaler()
X = scaler.fit_transform(X)

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
`;
  }

  generateModelCreation(): string {
    const { model_type, task, model_params = {} } = this.config;
    const modelClass = this.getModelClass(model_type, task);
    const paramsStr = Object.entries(model_params)
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");

    return `
# Create model
model = ${modelClass}(${paramsStr})
`;
  }

  generateModelTraining(): string {
    return `
# Train the model
model.fit(X_train, y_train)
`;
  }

  generateEvaluation(): string {
    if (this.config.task === "classification") {
      return `
# Evaluate the model
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy: {accuracy:.2f}")
print("\\nClassification Report:")
print(classification_report(y_test, y_pred))
`;
    } else if (this.config.task === "regression") {
      return `
# Evaluate the model
y_pred = model.predict(X_test)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(f"Mean Squared Error: {mse:.2f}")
print(f"R-squared Score: {r2:.2f}")
`;
    }
    return "# Evaluation not implemented for this task";
  }

  private getModelClass(modelType: string, task: string): string {
    const modelClasses: Record<string, string | Record<string, string>> = {
      RandomForest: {
        classification: "RandomForestClassifier",
        regression: "RandomForestRegressor",
      },
      LogisticRegression: "LogisticRegression",
      LinearRegression: "LinearRegression",
      SVM: { classification: "SVC", regression: "SVR" },
      KNeighbors: {
        classification: "KNeighborsClassifier",
        regression: "KNeighborsRegressor",
      },
      DecisionTree: {
        classification: "DecisionTreeClassifier",
        regression: "DecisionTreeRegressor",
      },
      GradientBoosting: {
        classification: "GradientBoostingClassifier",
        regression: "GradientBoostingRegressor",
      },
    };

    if (modelType in modelClasses) {
      const modelClass = modelClasses[modelType];
      if (typeof modelClass === "object") {
        return modelClass[task] || "";
      }
      return modelClass || "";
    }
    throw new Error(`Unsupported model type: ${modelType}`);
  }
}

export class PyTorchGenerator extends BaseGenerator {
  generateImports(): string {
    return `
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
`;
  }

  generateDataLoading(): string {
    return `
# Load and preprocess data
data = pd.read_csv("${this.config.data_path}")
X = data.drop('${this.config.target_column}', axis=1)
y = data['${this.config.target_column}']

# Scale features
scaler = StandardScaler()
X = scaler.fit_transform(X)

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Convert to PyTorch tensors
X_train_tensor = torch.FloatTensor(X_train)
y_train_tensor = torch.FloatTensor(y_train.values)
X_test_tensor = torch.FloatTensor(X_test)
y_test_tensor = torch.FloatTensor(y_test.values)

# Create DataLoader
train_dataset = TensorDataset(X_train_tensor, y_train_tensor)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
`;
  }

  generateModelCreation(): string {
    const { task } = this.config;
    const outputSize = task === "classification" ? "len(np.unique(y))" : "1";

    return `
# Define the neural network
class Net(nn.Module):
    def __init__(self, input_size):
        super(Net, self).__init__()
        self.fc1 = nn.Linear(input_size, 64)
        self.fc2 = nn.Linear(64, 32)
        self.fc3 = nn.Linear(32, ${outputSize})
    
    def forward(self, x):
        x = torch.relu(self.fc1(x))
        x = torch.relu(self.fc2(x))
        x = self.fc3(x)
        return x

model = Net(input_size=X_train.shape[1])
criterion = nn.${task === "classification" ? "CrossEntropyLoss" : "MSELoss"}()
optimizer = optim.Adam(model.parameters(), lr=0.001)
`;
  }

  generateModelTraining(): string {
    return `
# Train the model
num_epochs = 100
for epoch in range(num_epochs):
    for inputs, targets in train_loader:
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, targets${this.config.task === "classification" ? ".long()" : ""})
        loss.backward()
        optimizer.step()
    
    if (epoch + 1) % 10 == 0:
        print(f'Epoch [{epoch+1}/{num_epochs}], Loss: {loss.item():.4f}')
`;
  }

  generateEvaluation(): string {
    if (this.config.task === "classification") {
      return `
# Evaluate the model
model.eval()
with torch.no_grad():
    outputs = model(X_test_tensor)
    _, predicted = torch.max(outputs.data, 1)
    accuracy = (predicted == y_test_tensor).sum().item() / y_test_tensor.size(0)
    print(f'Accuracy: {accuracy:.2f}')
`;
    } else if (this.config.task === "regression") {
      return `
# Evaluate the model
model.eval()
with torch.no_grad():
    predictions = model(X_test_tensor)
    mse = nn.MSELoss()(predictions, y_test_tensor)
    print(f'Mean Squared Error: {mse.item():.4f}')
`;
    }
    return "# Evaluation not implemented for this task";
  }
}

export class TensorFlowGenerator extends BaseGenerator {
  generateImports(): string {
    return `
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
`;
  }

  generateDataLoading(): string {
    return `
# Load and preprocess data
data = pd.read_csv("${this.config.data_path}")
X = data.drop('${this.config.target_column}', axis=1)
y = data['${this.config.target_column}']

# Scale features
scaler = StandardScaler()
X = scaler.fit_transform(X)

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
`;
  }

  generateModelCreation(): string {
    const { task } = this.config;
    const outputUnits = task === "classification" ? "len(np.unique(y))" : "1";
    const outputActivation = task === "classification" ? "softmax" : "linear";

    return `
# Define the model
model = Sequential([
    Dense(64, activation='relu', input_shape=(X_train.shape[1],)),
    Dense(32, activation='relu'),
    Dense(${outputUnits}, activation='${outputActivation}')
])

model.compile(optimizer='adam', 
              loss='${task === "classification" ? "sparse_categorical_crossentropy" : "mse"}',
              metrics=['${task === "classification" ? "accuracy" : "mse"}'])
`;
  }

  generateModelTraining(): string {
    return `
# Train the model
history = model.fit(X_train, y_train, 
                    epochs=100, 
                    batch_size=32, 
                    validation_split=0.2, 
                    verbose=1)
`;
  }

  generateEvaluation(): string {
    if (this.config.task === "classification") {
      return `
# Evaluate the model
test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
print(f'Test accuracy: {test_accuracy:.2f}')
`;
    } else if (this.config.task === "regression") {
      return `
# Evaluate the model
test_loss, test_mse = model.evaluate(X_test, y_test, verbose=0)
print(f'Test Mean Squared Error: {test_mse:.4f}')
`;
    }
    return "# Evaluation not implemented for this task";
  }
}
