import pandas as pd
import numpy as np
from typing import Dict, Any
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.discriminant_analysis import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, accuracy_score, classification_report, confusion_matrix, silhouette_score
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder
from sklearn.svm import SVR, SVC
from sklearn.cluster import KMeans, DBSCAN
from sklearn.tree import DecisionTreeRegressor, DecisionTreeClassifier
from sklearn.neighbors import KNeighborsRegressor, KNeighborsClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
import json
import io
import sys
import logging
import traceback
import pickle
import base64

# Import the get_column_preprocessing function from preprocessing.py
from preprocessing import get_column_preprocessing

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

class ColumnPreservingTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, preprocessor):
        self.preprocessor = preprocessor
        self.input_features_ = None
        self.output_features_ = None

    def fit(self, X, y=None):
        self.input_features_ = X.columns.tolist()
        self.preprocessor.fit(X, y)
        self.output_features_ = self.get_feature_names_out()
        return self

    def transform(self, X):
        # Ensure input features match what the transformer expects
        missing_cols = set(self.input_features_) - set(X.columns)
        if missing_cols:
            raise ValueError(f"Missing columns in input data: {missing_cols}")

        # Reorder columns to match the order during fitting
        X = X[self.input_features_]

        X_transformed = self.preprocessor.transform(X)
        return pd.DataFrame(X_transformed, columns=self.output_features_, index=X.index)

    def get_feature_names_out(self, input_features=None):
        if input_features is not None and input_features != self.input_features_:
            raise ValueError("input_features is not equal to feature_names_in_")
        
        feature_names = []
        for name, transformer, columns in self.preprocessor.transformers_:
            if name != 'remainder':
                if hasattr(transformer, 'get_feature_names_out'):
                    feature_names.extend(transformer.get_feature_names_out(columns))
                else:
                    feature_names.extend(columns)
        
        if self.preprocessor.remainder != 'drop':
            feature_names.extend([col for col in self.input_features_ if col not in feature_names])
        
        return feature_names


def get_column_preprocessing(preprocessing_config, columns, task_type):
    transformers = []
    
    for column in preprocessing_config['columns']:
        column_name = column['name']
        if column_name not in columns:
            continue
        
        pipeline_steps = []
        
        # Imputation
        if 'imputation' in column['preprocessing']:
            strategy = column['preprocessing']['imputation']
            if strategy in ['mean', 'median', 'most_frequent']:
                pipeline_steps.append(('imputer', SimpleImputer(strategy=strategy)))
            elif strategy == 'constant':
                fill_value = column['params'].get('fill_value', 'Unknown')
                pipeline_steps.append(('imputer', SimpleImputer(strategy='constant', fill_value=fill_value)))

        # Encoding
        if column['type'] == 'categorical':
            if column['preprocessing'].get('encoding') == 'onehot':
                encoder = OneHotEncoder(sparse=False, handle_unknown='ignore')
                pipeline_steps.append(('encoder', encoder))
            elif column['preprocessing'].get('encoding') == 'ordinal':
                encoder = OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)
                pipeline_steps.append(('encoder', encoder))

        # Scaling
        if 'scaling' in column['preprocessing']:
            if column['preprocessing']['scaling'] == 'standard':
                pipeline_steps.append(('scaler', StandardScaler()))

        if pipeline_steps:
            transformer = Pipeline(steps=pipeline_steps)
            transformers.append((column_name, transformer, [column_name]))
    
    return ColumnTransformer(transformers, remainder='passthrough')

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
    preprocessing_config = params.get('preprocessing_config', {})
    
    imports = """
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, accuracy_score, classification_report, silhouette_score
from sklearn.preprocessing import LabelEncoder
from sklearn.pipeline import Pipeline
from preprocessing import get_column_preprocessing
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
# Create preprocessor
preprocessor = get_column_preprocessing({preprocessing_config}, X.columns, '{task}')

# Wrap the preprocessor in a ColumnPreservingTransformer
column_preserving_preprocessor = ColumnPreservingTransformer(preprocessor)

# Create and train the model
model = get_model('{task}', '{model_type}', {model_params})

# Create a pipeline with preprocessor and model
pipeline = Pipeline([
    ('preprocessor', column_preserving_preprocessor),
    ('model', model)
])

if '{task}' != 'clustering':
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
else:
    labels = pipeline.fit_predict(X_train)

# Log the input and output features
logger.debug(f"Input features: {{column_preserving_preprocessor.input_features_}}")
logger.debug(f"Output features: {{column_preserving_preprocessor.output_features_}}")
    """


    evaluation = f"""
# Evaluate the model
results = {{}}
{get_evaluation_code(task)}

results['task'] = '{task}'
results['model_type'] = '{model_type}'

# Save the entire pipeline
pickle_buffer = io.BytesIO()
pickle.dump(pipeline, pickle_buffer)
pickle_buffer.seek(0)
results['model_pickle'] = base64.b64encode(pickle_buffer.getvalue()).decode('utf-8')
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