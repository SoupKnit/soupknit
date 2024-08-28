import pandas as pd
import numpy as np
from typing import Dict, Any
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, accuracy_score, classification_report, confusion_matrix, silhouette_score
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.svm import SVR, SVC
from sklearn.cluster import KMeans, DBSCAN
import json
import io
import sys
from typing import Dict, Any
import logging
import traceback
import pickle
import base64

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CaptureStdout:
    def __enter__(self):
        self._original_stdout = sys.stdout
        sys.stdout = self._stringio = io.StringIO()
        return self

    def __exit__(self, *args):
        sys.stdout = self._original_stdout

    def get_output(self):
        return self._stringio.getvalue()

try:
    from xgboost import XGBRegressor, XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    logger.warning("XGBoost is not installed. XGBoost models will not be available.")
    XGBOOST_AVAILABLE = False

def process_json_input(json_input: str) -> str:
    try:
        logger.debug(f"Received JSON input: {json_input}")
        data = json.loads(json_input)
        
        logger.debug(f"Parsed data: {json.dumps(data, indent=2)}")
        
        # Extract the file path and parameters
        file_path = data['filePath']
        params = data['params']
        
        # Standardize task type to lowercase
        params['task'] = params['task'].lower()
        
        # Read the CSV file
        df = pd.read_csv(file_path)
        
        logger.debug(f"DataFrame shape: {df.shape}")
        logger.debug(f"DataFrame columns: {df.columns.tolist()}")
        logger.debug(f"DataFrame info:\n{df.info(buf=io.StringIO())}")
        
        # Get the target column (y_column) if not clustering
        if params['task'] != 'clustering':
            y_column = params.get('target_column')
            if not y_column:
                logger.error("No target column (y_column) specified in the parameters for non-clustering task")
                raise ValueError("No target column (y_column) specified in the parameters for non-clustering task")
            
            # Update params with y_column
            params['y_column'] = y_column
            
            # Derive X_columns by dropping the y_column
            X_columns = df.columns.drop(y_column).tolist()
        else:
            # For clustering, use all columns
            X_columns = df.columns.tolist()
            y_column = None
        
        logger.debug(f"Task: {params['task']}")
        logger.debug(f"Derived X columns: {X_columns}")
        logger.debug(f"Y column: {y_column}")
        
        # Filter the DataFrame to include only the necessary columns
        df = df[X_columns + ([y_column] if y_column else [])]
        
        # Update params with the derived X_columns
        params['X_columns'] = X_columns
        
        # Generate and execute the pipeline code
        pipeline_code = generate_pipeline_code(file_path, params)
        logger.debug(f"Generated pipeline code:\n{pipeline_code}")
        
        # Execute the generated code
        local_vars = {}
        exec(pipeline_code, globals(), local_vars)
        
        # Extract the results
        results = local_vars.get('results', {})
        
        # Pickle the model
        model = local_vars.get('model')
        if model:
            pickle_buffer = io.BytesIO()
            pickle.dump(model, pickle_buffer)
            pickle_buffer.seek(0)
            results['model_pickle'] = base64.b64encode(pickle_buffer.getvalue()).decode('utf-8')
        
        logger.debug(f"Extracted results: {results}")
        
        return json.dumps({
            "success": True,
            "results": results
        })
        
    except Exception as e:
        logger.error(f"Error in process_json_input: {str(e)}", exc_info=True)
        return json.dumps({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        })
    
def create_model_file(csv_file_path: str, params: Dict[str, Any]) -> None:
    try:
        code = generate_model_code(csv_file_path, params)

        with open('model.py', 'w') as f:
            f.write(code)

        logger.info("model.py file has been created successfully.")
    except Exception as e:
        logger.error(f"Error in create_model_file: {str(e)}")
        raise

def execute_pipeline_and_collect_results(pipeline_code: str, df: pd.DataFrame, params: dict) -> dict:
    try:
        # Log DataFrame info
        logger.debug(f"DataFrame columns: {df.columns.tolist()}")
        logger.debug(f"DataFrame shape: {df.shape}")
        logger.debug(f"DataFrame info:\n{df.info()}")

        # Prepare data
        X_columns = params['X_columns']
        y_column = params['y_column']

        logger.debug(f"Specified X columns: {X_columns}")
        logger.debug(f"Specified y column: {y_column}")

        # Check for missing columns
        missing_X_columns = set(X_columns) - set(df.columns)
        if missing_X_columns:
            raise ValueError(f"The following X columns are missing from the DataFrame: {missing_X_columns}")

        if y_column not in df.columns:
            raise ValueError(f"The y column '{y_column}' is missing from the DataFrame")

        X = df[X_columns]
        y = df[y_column]

        logger.debug(f"X shape: {X.shape}")
        logger.debug(f"y shape: {y.shape}")

        # Execute the pipeline code
        local_vars = {'X': X, 'y': y, 'results': {}}
        exec(pipeline_code, globals(), local_vars)
        
        # The results should now be available in local_vars
        results = local_vars.get('results')

        if results is None:
            raise ValueError("Pipeline execution failed to produce expected outputs")

        return results
    except Exception as e:
        logger.error(f"Error in execute_pipeline_and_collect_results: {str(e)}")
        raise

def collect_results(task: str, y_true, y_pred, X_test) -> dict:
    results = {
        "task": task,
        "metrics": {},
        "plots": {}
    }

    if task == "regression":
        results["metrics"] = {
            "mse": mean_squared_error(y_true, y_pred),
            "rmse": np.sqrt(mean_squared_error(y_true, y_pred)),
            "r2": r2_score(y_true, y_pred),
            "mae": mean_absolute_error(y_true, y_pred)
        }
        results["plots"]["actual_vs_predicted"] = create_actual_vs_predicted_data(y_true, y_pred)

    elif task == "classification":
        results["metrics"] = {
            "accuracy": accuracy_score(y_true, y_pred),
            "classification_report": classification_report(y_true, y_pred, output_dict=True)
        }
        results["plots"]["confusion_matrix"] = create_confusion_matrix_data(y_true, y_pred)

    elif task == "clustering":
        results["metrics"] = {
            "silhouette_score": silhouette_score(X_test, y_pred)
        }
        results["plots"]["cluster_distribution"] = create_cluster_distribution_data(y_pred)

    return results

def generate_model_code(csv_file_path: str, params: Dict[str, Any]) -> str:
    task = params['task']
    automated = params.get('automated', False)

    imports = """
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, accuracy_score, classification_report, confusion_matrix, silhouette_score
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.svm import SVR, SVC
from sklearn.cluster import KMeans, DBSCAN
import matplotlib.pyplot as plt
import seaborn as sns

try:
    from xgboost import XGBRegressor, XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    print("XGBoost is not installed. XGBoost models will not be available.")
    XGBOOST_AVAILABLE = False
"""

    data_preparation = f"""
# Load data
data = pd.read_csv('{csv_file_path}')

# Prepare data
X = data[{params['X_columns']}]
y = data['{params['y_column']}'] if '{params['y_column']}' in data.columns else None

# Split the data
if y is not None:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size={params['test_size']}, random_state=42, {'stratify=y' if task == 'classification' else 'stratify=None'})
else:
    X_train, X_test = train_test_split(X, test_size={params['test_size']}, random_state=42)
"""

    feature_scaling = """
# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
""" if params.get('scale_features', True) else ""

    if automated:
        if task == 'regression':
            models = {
                'LinearRegression': LinearRegression(),
                'Ridge': Ridge(),
                'Lasso': Lasso(),
                'ElasticNet': ElasticNet(),
                'RandomForestRegressor': RandomForestRegressor(),
                'SVR': SVR(),
                'GradientBoostingRegressor': GradientBoostingRegressor(),
            }
            if XGBOOST_AVAILABLE:
                models['XGBRegressor'] = XGBRegressor()
            
            model_creation = f"""
models = {models}

results = {{}}
for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    results[name] = {{'MSE': mse, 'RMSE': rmse, 'R2': r2, 'MAE': mae}}

# Print results
for name, metrics in results.items():
    print(f"Model: {{name}}")
    for metric, value in metrics.items():
        print(f"{{metric}}: {{value:.4f}}")
    print()

# Plot results
plt.figure(figsize=(12, 6))
metrics = ['MSE', 'RMSE', 'R2', 'MAE']
for i, metric in enumerate(metrics):
    plt.subplot(2, 2, i+1)
    plt.bar([name for name in results.keys()], [result[metric] for result in results.values()])
    plt.title(metric)
    plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.savefig('plots/model_comparison.png')
plt.close()

# Select best model based on R2 score
best_model_name = max(results, key=lambda x: results[x]['R2'])
best_model = models[best_model_name]
print(f"Best model: {{best_model_name}}")
"""
        elif task == 'classification':
            models = {
                'LogisticRegression': LogisticRegression(),
                'RandomForestClassifier': RandomForestClassifier(),
                'SVC': SVC(probability=True),
                'GradientBoostingClassifier': GradientBoostingClassifier(),
            }
            if XGBOOST_AVAILABLE:
                models['XGBClassifier'] = XGBClassifier()
            
            model_creation = f"""
models = {models}

results = {{}}
for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    results[name] = {{'Accuracy': accuracy}}

# Print results
for name, metrics in results.items():
    print(f"Model: {{name}}")
    print(f"Accuracy: {{metrics['Accuracy']:.4f}}")
    print(f"Classification Report:")
    print(classification_report(y_test, y_pred))
    print()

# Plot results
plt.figure(figsize=(10, 6))
plt.bar([name for name in results.keys()], [result['Accuracy'] for result in results.values()])
plt.title('Model Accuracy Comparison')
plt.xlabel('Model')
plt.ylabel('Accuracy')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.savefig('plots/model_comparison.png')
plt.close()

# Select best model based on accuracy
best_model_name = max(results, key=lambda x: results[x]['Accuracy'])
best_model = models[best_model_name]
print(f"Best model: {{best_model_name}}")
"""
        elif task == 'clustering':
            models = {
                'KMeans': KMeans(n_clusters=3),
                'DBSCAN': DBSCAN()
            }
            model_creation = f"""
models = {models}

results = {{}}
for name, model in models.items():
    if name == 'KMeans':
        labels = model.fit_predict(X_scaled)
    else:
        labels = model.fit(X_scaled).labels_
    
    silhouette_avg = silhouette_score(X_scaled, labels)
    results[name] = {{'Silhouette Score': silhouette_avg}}

# Print results
for name, metrics in results.items():
    print(f"Model: {{name}}")
    print(f"Silhouette Score: {{metrics['Silhouette Score']:.4f}}")
    print()

# Plot results
plt.figure(figsize=(10, 6))
plt.bar([name for name in results.keys()], [result['Silhouette Score'] for result in results.values()])
plt.title('Model Silhouette Score Comparison')
plt.xlabel('Model')
plt.ylabel('Silhouette Score')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.savefig('plots/model_comparison.png')
plt.close()

# Select best model based on silhouette score
best_model_name = max(results, key=lambda x: results[x]['Silhouette Score'])
best_model = models[best_model_name]
print(f"Best model: {{best_model_name}}")
"""
    else:
        model_creation = get_model_creation(params)

    model_evaluation = get_model_evaluation(task)

    return imports + data_preparation + feature_scaling + model_creation + model_evaluation

def get_model_evaluation(task: str) -> str:
    if task == 'regression':
        return """
# Make predictions
y_pred = best_model.predict(X_test_scaled)

# Calculate metrics
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)
r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)

print(f"Best Model: {best_model_name}")
print(f"Mean Squared Error: {mse:.4f}")
print(f"Root Mean Squared Error: {rmse:.4f}")
print(f"R-squared Score: {r2:.4f}")
print(f"Mean Absolute Error: {mae:.4f}")

# Plot actual vs predicted values
plt.figure(figsize=(10, 6))
plt.scatter(y_test, y_pred, alpha=0.5)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
plt.xlabel('Actual')
plt.ylabel('Predicted')
plt.title('Actual vs Predicted Values')
plt.tight_layout()
plt.savefig('plots/actual_vs_predicted.png')
plt.close()

# Plot residuals
residuals = y_test - y_pred
plt.figure(figsize=(10, 6))
sns.scatterplot(x=y_pred, y=residuals)
plt.axhline(y=0, color='r', linestyle='--')
plt.xlabel('Predicted')
plt.ylabel('Residuals')
plt.title('Residual Plot')
plt.tight_layout()
plt.savefig('plots/residuals.png')
plt.close()

print("Plots saved in 'plots' directory.")
"""
    elif task == 'classification':
        return """
# Make predictions
y_pred = best_model.predict(X_test_scaled)

# Calculate metrics
accuracy = accuracy_score(y_test, y_pred)
print(f"Best Model: {best_model_name}")
print(f"Accuracy: {accuracy:.4f}")
print("\\nClassification Report:")
print(classification_report(y_test, y_pred))

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(10, 8))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.title('Confusion Matrix')
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.savefig('plots/confusion_matrix.png')
plt.close()

# ROC Curve (for binary classification)
if len(np.unique(y)) == 2:
    y_pred_proba = best_model.predict_proba(X_test_scaled)[:, 1]
    fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
    auc = roc_auc_score(y_test, y_pred_proba)
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, label='ROC Curve (AUC = {:.2f})'.format(auc))
    plt.plot([0, 1], [0, 1], linestyle='--', label='Random Classifier')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('Receiver Operating Characteristic (ROC) Curve')
    plt.legend()
    plt.savefig('plots/roc_curve.png')
    plt.close()

print("Plots saved in 'plots' directory.")
"""
    elif task == 'clustering':
        return """
# Evaluate the best model
labels = best_model.fit_predict(X_scaled)

# Calculate silhouette score
silhouette_avg = silhouette_score(X_scaled, labels)
print(f"Best Model: {best_model_name}")
print(f'Silhouette Score: {silhouette_avg:.4f}')

# Count samples in each cluster
unique_labels, counts = np.unique(labels, return_counts=True)
for label, count in zip(unique_labels, counts):
    print(f'Cluster {label}: {count} samples')

# Plot cluster distribution
plt.figure(figsize=(10, 6))
sns.countplot(x=labels)
plt.title('Distribution of Samples Across Clusters')
plt.xlabel('Cluster')
plt.ylabel('Number of Samples')
plt.savefig('plots/cluster_distribution.png')
plt.close()

# Plot 2D projection of clusters
from sklearn.decomposition import PCA
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

plt.figure(figsize=(10, 8))
scatter = plt.scatter(X_pca[:, 0], X_pca[:, 1], c=labels, cmap='viridis')
plt.colorbar(scatter)
plt.title('2D PCA Projection of Clusters')
plt.xlabel('First Principal Component')
plt.ylabel('Second Principal Component')
plt.savefig('plots/cluster_projection.png')
plt.close()

print("Plots saved in 'plots' directory.")
"""

def get_model_import(model_type: str) -> str:
    model_imports = {
        'LinearRegression': 'from sklearn.linear_model import LinearRegression',
        'Ridge': 'from sklearn.linear_model import Ridge',
        'Lasso': 'from sklearn.linear_model import Lasso',
        'ElasticNet': 'from sklearn.linear_model import ElasticNet',
        'RandomForestRegressor': 'from sklearn.ensemble import RandomForestRegressor',
        'SVR': 'from sklearn.svm import SVR',
        'GradientBoostingRegressor': 'from sklearn.ensemble import GradientBoostingRegressor',
        'XGBRegressor': 'from xgboost import XGBRegressor',
        'LogisticRegression': 'from sklearn.linear_model import LogisticRegression',
        'RandomForestClassifier': 'from sklearn.ensemble import RandomForestClassifier',
        'SVC': 'from sklearn.svm import SVC',
        'GradientBoostingClassifier': 'from sklearn.ensemble import GradientBoostingClassifier',
        'XGBClassifier': 'from xgboost import XGBClassifier',
        'KMeans': 'from sklearn.cluster import KMeans',
        'DBSCAN': 'from sklearn.cluster import DBSCAN'
    }
    return model_imports.get(model_type, '')

def get_model_creation(params: Dict[str, Any]) -> str:
    base_model = f"{params['model_type']}(**{json.dumps(params.get('model_params', {}))})"
    
    if params.get('tune_hyperparameters') and params.get('param_grid'):
        scoring = "{'regression': 'neg_mean_squared_error', 'classification': 'accuracy'}['" + params['task'] + "']"
        return f"""
model = GridSearchCV(
    {base_model},
    param_grid={json.dumps(params['param_grid'])},
    cv=5,
    n_jobs=-1,
    scoring={scoring}
)
model.fit(X_train_scaled if 'X_train_scaled' in locals() else X_train, y_train)
print("Best parameters: {{}}".format(model.best_params_))
"""
    else:
        return f"""
model = {base_model}
model.fit(X_train_scaled if 'X_train_scaled' in locals() else X_train, y_train)
"""

def get_model(task: str, model_type: str, model_params: Dict[str, Any]) -> str:
    model_map = {
        'Regression': {
            'linear_regression': 'LinearRegression',
            'ridge': 'Ridge',
            'lasso': 'Lasso',
            'elastic_net': 'ElasticNet',
            'decision_tree': 'DecisionTreeRegressor',
            'random_forest': 'RandomForestRegressor',
            'gradient_boosting': 'GradientBoostingRegressor',
            'svr': 'SVR',
            'knn': 'KNeighborsRegressor'
        },
        'Classification': {
            'logistic_regression': 'LogisticRegression',
            'decision_tree': 'DecisionTreeClassifier',
            'random_forest': 'RandomForestClassifier',
            'gradient_boosting': 'GradientBoostingClassifier',
            'svc': 'SVC',
            'knn': 'KNeighborsClassifier'
        },
        'Clustering': {
            'kmeans': 'KMeans',
            'dbscan': 'DBSCAN'
        }
    }
    
    if task not in model_map or model_type not in model_map[task]:
        raise ValueError(f"Unsupported model type '{model_type}' for task '{task}'")
    
    return f"{model_map[task][model_type]}(**{model_params})"

def get_evaluation_code(task: str) -> str:
    if task == 'Regression':
        return """
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
results['metrics'] = {
    'mse': mse,
    'r2': r2,
    'mae': mae
}
print(f'Mean Squared Error: {mse}')
print(f'R2 Score: {r2}')
print(f'Mean Absolute Error: {mae}')

actual_vs_predicted_data = create_actual_vs_predicted_data(y_test, y_pred)
results['plots']['actual_vs_predicted'] = actual_vs_predicted_data
        """
    elif task == 'Classification':
        return """
print(f'Shape of y_test: {y_test.shape}')
print(f'Shape of y_pred: {y_pred.shape}')
print(f'First few values of y_test: {y_test[:5]}')
print(f'First few values of y_pred: {y_pred[:5]}')

accuracy = accuracy_score(y_test, y_pred)
classification_rep = classification_report(y_test, y_pred, output_dict=True)
results['metrics'] = {
    'accuracy': accuracy,
    'classification_report': classification_rep
}
print(f'Accuracy: {accuracy}')
print('Classification Report:')
print(classification_report(y_test, y_pred))

confusion_matrix_data = create_confusion_matrix_data(y_test, y_pred)
results['plots']['confusion_matrix'] = confusion_matrix_data
        """
    elif task == 'Clustering':
        return """
if hasattr(model, 'labels_'):
    labels = model.labels_
else:
    labels = model.predict(X)

silhouette_avg = silhouette_score(X, labels)
results['metrics'] = {
    'silhouette_score': silhouette_avg
}
print(f'Silhouette Score: {silhouette_avg}')

cluster_distribution_data = create_cluster_distribution_data(labels)
results['plots']['cluster_distribution'] = cluster_distribution_data
        """
    else:
        raise ValueError(f"Unsupported task: {task}")

def generate_pipeline_code(csv_file_path: str, params: Dict[str, Any]) -> str:
    task = params['task'].lower()  # Ensure task is lowercase
    model_type = params['model_type']
    X_columns = params['X_columns']
    y_column = params.get('y_column')
    n_clusters = params.get('n_clusters', 3)  # Default to 3 clusters if not specified

    code = f"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, accuracy_score, classification_report, silhouette_score
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.cluster import KMeans, DBSCAN

# Read the CSV file
df = pd.read_csv('{csv_file_path}')

# Prepare data
X = df[{X_columns}]
"""

    if task != 'clustering':
        code += f"y = df['{y_column}']\n"
        code += """
# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
"""
    else:
        code += """
# For clustering, we don't need to split the data
X_train = X
"""

    code += """
# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
"""

    if task != 'clustering':
        code += "X_test_scaled = scaler.transform(X_test)\n"

    code += f"""
# Create and train the model
if '{task}' == 'regression':
    if '{model_type}' == 'linear_regression':
        model = LinearRegression()
    elif '{model_type}' == 'random_forest':
        model = RandomForestRegressor()
    else:
        model = LinearRegression()  # Default to linear regression
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
elif '{task}' == 'classification':
    if '{model_type}' == 'logistic_regression':
        model = LogisticRegression()
    elif '{model_type}' == 'random_forest':
        model = RandomForestClassifier()
    else:
        model = LogisticRegression()  # Default to logistic regression
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
elif '{task}' == 'clustering':
    if '{model_type}' == 'kmeans':
        model = KMeans(n_clusters={n_clusters}, random_state=42)
    elif '{model_type}' == 'dbscan':
        model = DBSCAN(eps=0.5, min_samples=5)
    else:
        model = KMeans(n_clusters={n_clusters}, random_state=42)  # Default to KMeans
    labels = model.fit_predict(X_train_scaled)
else:
    raise ValueError(f"Unsupported task: {task}")

# Evaluate the model
results = {{}}
if '{task}' == 'regression':
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    results = {{
        'mse': mse,
        'r2': r2,
        'mae': mae
    }}
elif '{task}' == 'classification':
    accuracy = accuracy_score(y_test, y_pred)
    classification_rep = classification_report(y_test, y_pred, output_dict=True)
    results = {{
        'accuracy': accuracy,
        'classification_report': classification_rep
    }}
elif '{task}' == 'clustering':
    if hasattr(model, 'inertia_'):
        results['inertia'] = float(model.inertia_)
    silhouette_avg = silhouette_score(X_train_scaled, labels)
    results['silhouette_score'] = float(silhouette_avg)
    results['num_clusters'] = int(len(np.unique(labels)))

results['task'] = '{task}'
results['model_type'] = '{model_type}'
"""

    return code

def create_actual_vs_predicted_data(y_true, y_pred):
    return {
        'actual': y_true.tolist(),
        'predicted': y_pred.tolist()
    }

def create_confusion_matrix_data(y_true, y_pred):
    cm = confusion_matrix(y_true, y_pred)
    return cm.tolist()

def create_cluster_distribution_data(y_pred):
    unique, counts = np.unique(y_pred, return_counts=True)
    return {
        'clusters': unique.tolist(),
        'counts': counts.tolist()
    }
    
if __name__ == "__main__":
    logger.info("Script started")
    json_input = sys.stdin.read()
    logger.debug(f"Received input: {json_input}")
    result = process_json_input(json_input)
    logger.debug(f"Sending result: {result}")
    print(result, flush=True)
    sys.stdout.flush()
    logger.info("Script finished")