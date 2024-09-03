import pandas as pd
import numpy as np
from typing import Dict, Any
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, accuracy_score, classification_report, confusion_matrix, silhouette_score
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.svm import SVR, SVC
from sklearn.cluster import KMeans, DBSCAN
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
from sklearn.neighbors import KNeighborsRegressor, KNeighborsClassifier
from sklearn.model_selection import train_test_split
import json
import io
import sys
import logging
import traceback
import pickle
import base64

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_model(task: str, model_type: str, model_params: Dict[str, Any]):
    model_map = {
        'regression': {
            'linear_regression': LinearRegression,
            'ridge': Ridge,
            'lasso': Lasso,
            'elastic_net': ElasticNet,
            'decision_tree': DecisionTreeRegressor,
            'random_forest': RandomForestRegressor,
            'gradient_boosting': GradientBoostingRegressor,
            'svr': SVR,
            'knn': KNeighborsRegressor
        },
        'classification': {
            'logistic_regression': LogisticRegression,
            'decision_tree': DecisionTreeClassifier,
            'random_forest': RandomForestClassifier,
            'gradient_boosting': GradientBoostingClassifier,
            'svc': SVC,
            'knn': KNeighborsClassifier
        },
        'clustering': {
            'kmeans': KMeans,
            'dbscan': DBSCAN
        }
    }
    
    if task not in model_map or model_type not in model_map[task]:
        raise ValueError(f"Unsupported model type '{model_type}' for task '{task}'")
    
    return model_map[task][model_type](**model_params)

def get_evaluation_code(task: str) -> str:
    if task == 'regression':
        return """
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
mae = mean_absolute_error(y_test, y_pred)
results['metrics'] = {
    'mse': float(mse),
    'r2': float(r2),
    'mae': float(mae)
}
results['evaluation_output'] = f'Mean Squared Error: {mse}\\nR2 Score: {r2}\\nMean Absolute Error: {mae}'
        """
    elif task == 'classification':
        return """
accuracy = accuracy_score(y_test, y_pred)
classification_rep = classification_report(y_test, y_pred, output_dict=True)
results['metrics'] = {
    'accuracy': float(accuracy),
    'classification_report': classification_rep
}
results['evaluation_output'] = f'Accuracy: {accuracy}\\nClassification Report:\\n{classification_report(y_test, y_pred)}'
        """
    elif task == 'clustering':
        return """
if hasattr(model, 'labels_'):
    labels = model.labels_
else:
    labels = model.predict(X)

silhouette_avg = silhouette_score(X, labels)
results['metrics'] = {
    'silhouette_score': float(silhouette_avg)
}
results['evaluation_output'] = f'Silhouette Score: {silhouette_avg}'
        """
    else:
        raise ValueError(f"Unsupported task: {task}")

def generate_pipeline_code(file_path: str, params: Dict[str, Any]) -> str:
    task = params['task'].lower()
    model_type = params['model_type']
    model_params = params.get('model_params', {})
    target_column = params.get('y_column')
    
    imports = """
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, accuracy_score, classification_report, silhouette_score
from sklearn.preprocessing import LabelEncoder
    """

    data_loading = f"""
# Read the CSV file
df = pd.read_csv('{file_path}')
logger.debug(f"Loaded data shape: {{df.shape}}")

# Prepare data
if '{task}' != 'clustering':
    y_column = '{target_column}'
    X = df.drop(columns=[y_column])
    y = df[y_column]
    
    # Encode target variable if it's categorical
    if y.dtype == 'object':
        le = LabelEncoder()
        y = le.fit_transform(y)
else:
    X = df
    y = None

# Split the data if not clustering
if '{task}' != 'clustering':
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
else:
    X_train = X
    X_test = X  # For silhouette score calculation

logger.debug(f"X_train shape: {{X_train.shape}}")
logger.debug(f"y_train shape: {{y_train.shape if y_train is not None else None}}")
    """

    model_creation = f"""
# Create and train the model
model = get_model('{task}', '{model_type}', {model_params})
if '{task}' != 'clustering':
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
else:
    labels = model.fit_predict(X_train)
    """

    evaluation = f"""
# Evaluate the model
results = {{}}
{get_evaluation_code(task)}

results['task'] = '{task}'
results['model_type'] = '{model_type}'
    """

    return imports + data_loading + model_creation + evaluation

def process_json_input(json_input: str) -> str:
    try:
        logger.debug(f"Received JSON input: {json_input}")
        data = json.loads(json_input)
        
        logger.debug(f"Parsed data: {json.dumps(data, indent=2)}")
        
        # Extract the file path and parameters
        file_path = data['filePath']
        params = data['params']
        
        # Generate the pipeline code
        pipeline_code = generate_pipeline_code(file_path, params)
        logger.debug(f"Generated pipeline code:\n{pipeline_code}")
        
        # Execute the generated code
        local_vars = {'get_model': get_model, 'logger': logger}
        exec(pipeline_code, globals(), local_vars)
        
        # Extract the results
        results = local_vars.get('results', {})
        model = local_vars.get('model')
        
        # Serialize the model if it exists
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

if __name__ == "__main__":
    logger.info("Script started")
    json_input = sys.stdin.read()
    logger.debug(f"Received input: {json_input}")
    result = process_json_input(json_input)
    logger.debug(f"Sending result: {result}")
    print(result, flush=True)
    sys.stdout.flush()
    logger.info("Script finished")