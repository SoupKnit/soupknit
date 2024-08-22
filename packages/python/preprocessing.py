import json
import sys
import logging
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder, RobustScaler, OrdinalEncoder, MinMaxScaler
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import SimpleImputer, KNNImputer, IterativeImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif

from scipy import stats

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_column_preprocessing(preprocessing_config):
    logger.info("Generating column-specific preprocessing steps")
    transformers = []
    
    for column in preprocessing_config['columns']:
        column_name = column['name']
        column_type = column['type']
        preprocessing = column['preprocessing']
        params = column.get('params', {})
        
        pipeline_steps = []
        
        # Imputation
        if 'imputation' in preprocessing:
            strategy = preprocessing['imputation']
            if strategy in ['mean', 'median', 'most_frequent', 'constant']:
                pipeline_steps.append(('imputer', SimpleImputer(strategy=strategy, **params)))
            elif strategy == 'knn':
                pipeline_steps.append(('imputer', KNNImputer(**params)))
            elif strategy == 'iterative':
                pipeline_steps.append(('imputer', IterativeImputer(**params)))
        
        # Scaling
        if 'scaling' in preprocessing:
            if preprocessing['scaling'] == 'robust':
                pipeline_steps.append(('scaler', RobustScaler()))
            elif preprocessing['scaling'] == 'standard':
                pipeline_steps.append(('scaler', StandardScaler()))
            elif preprocessing['scaling'] == 'minmax':
                pipeline_steps.append(('scaler', MinMaxScaler()))
        
        # Encoding
        if column_type == 'categorical':
            if preprocessing.get('encoding') == 'onehot':
                pipeline_steps.append(('encoder', OneHotEncoder(handle_unknown='ignore')))
            elif preprocessing.get('encoding') == 'ordinal':
                pipeline_steps.append(('encoder', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)))
        
        # Date handling
        if column_type == 'date':
            pipeline_steps.append(('date_transformer', DateTransformer(preprocessing.get('date_features', ['year', 'month', 'day', 'dayofweek']))))
        
        # Outlier treatment
        if 'outlier_treatment' in preprocessing:
            if preprocessing['outlier_treatment'] == 'winsorize':
                winsorize_limits = params.get('winsorize_limits', (0.05, 0.95))
                pipeline_steps.append(('outlier_treatment', Winsorizer(limits=winsorize_limits)))
        
        # High cardinality handling
        if 'high_cardinality' in preprocessing:
            if preprocessing['high_cardinality'] == 'group_rare':
                pipeline_steps.append(('high_cardinality', RareGrouper(**params)))
        
        if pipeline_steps:
            transformer = Pipeline(steps=pipeline_steps)
            transformers.append((f'transformer_{column_name}', transformer, [column_name]))
    
    logger.debug(f"Transformers created: {transformers}")
    return transformers

class DateTransformer:
    def __init__(self, features=['year', 'month', 'day', 'dayofweek']):
        self.features = features

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = pd.to_datetime(X)
        result = pd.DataFrame()
        for feature in self.features:
            if feature == 'year':
                result['year'] = X.dt.year
            elif feature == 'month':
                result['month'] = X.dt.month
            elif feature == 'day':
                result['day'] = X.dt.day
            elif feature == 'dayofweek':
                result['dayofweek'] = X.dt.dayofweek
            elif feature == 'quarter':
                result['quarter'] = X.dt.quarter
        return result

class Winsorizer:
    def __init__(self, limits=(0.05, 0.95)):
        self.limits = limits

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return np.clip(X, *np.percentile(X, [self.limits[0]*100, self.limits[1]*100]))
    
    def get_feature_names_out(self, input_features=None):
        return input_features

class RareGrouper:
    def __init__(self, rare_threshold=0.01):
        self.rare_threshold = rare_threshold
        self.frequent_categories = None

    def fit(self, X, y=None):
        value_counts = X.value_counts(normalize=True)
        self.frequent_categories = value_counts[value_counts >= self.rare_threshold].index
        return self

    def transform(self, X):
        return X.map(lambda x: x if x in self.frequent_categories else 'Other')

def preprocess_data(file_path, task_type, target_column, preprocessing_config):
    logger.info(f"Starting preprocessing for file: {file_path}")
    
    # Load data
    data = pd.read_csv(file_path, parse_dates=preprocessing_config.get('date_columns', []))
    logger.info(f"Loaded data shape: {data.shape}")
    
    # Separate features and target
    X = data.drop(columns=[target_column])
    y = data[target_column]
    
    # Get column transformers
    transformers = get_column_preprocessing(preprocessing_config)
    
    # Create preprocessor
    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder='passthrough'
    )
    
    # Fit and transform the data
    X_preprocessed = preprocessor.fit_transform(X)
    
    # Get feature names
    feature_names = []
    for name, trans, cols in preprocessor.transformers_:
        if name != 'remainder':
            if hasattr(trans, 'get_feature_names_out'):
                if isinstance(trans, Pipeline):
                    # For pipeline transformers, use the last step that has get_feature_names_out
                    last_step_with_features = next((step for step in reversed(trans.steps) if hasattr(step[1], 'get_feature_names_out')), None)
                    if last_step_with_features:
                        feature_names.extend(last_step_with_features[1].get_feature_names_out(cols))
                    else:
                        feature_names.extend(cols)
                else:
                    feature_names.extend(trans.get_feature_names_out(cols))
            else:
                feature_names.extend(cols)
    
    # Convert to DataFrame
    preprocessed_data = pd.DataFrame(X_preprocessed, columns=feature_names)
    preprocessed_data[target_column] = y.reset_index(drop=True)
    
    # Apply global preprocessing steps
    global_preprocessing = preprocessing_config['global_preprocessing']
    if 'drop_constant' in global_preprocessing:
        preprocessed_data = preprocessed_data.loc[:, (preprocessed_data != preprocessed_data.iloc[0]).any()]
        logger.info(f"Data shape after dropping constant columns: {preprocessed_data.shape}")
    if 'drop_duplicate' in global_preprocessing:
        preprocessed_data = preprocessed_data.drop_duplicates()
        logger.info(f"Data shape after dropping duplicates: {preprocessed_data.shape}")
    if 'pca' in global_preprocessing:
        n_components = preprocessing_config['global_params'].get('n_components', 0.95)
        numeric_columns = preprocessed_data.select_dtypes(include=['int64', 'float64']).columns
        pca = PCA(n_components=n_components)
        preprocessed_data[numeric_columns] = pca.fit_transform(preprocessed_data[numeric_columns])
        logger.info(f"Data shape after PCA: {preprocessed_data.shape}")
    if 'feature_selection' in global_preprocessing:
        n_features = preprocessing_config['global_params'].get('n_features_to_select', 50)
        selector = SelectKBest(f_classif, k=n_features)
        selected_features = selector.fit_transform(preprocessed_data.drop(columns=[target_column]), preprocessed_data[target_column])
        selected_columns = preprocessed_data.drop(columns=[target_column]).columns[selector.get_support()]
        preprocessed_data = pd.DataFrame(selected_features, columns=selected_columns)
        preprocessed_data[target_column] = y.reset_index(drop=True)
        logger.info(f"Data shape after feature selection: {preprocessed_data.shape}")
    
    # Save preprocessed data
    output_csv = file_path.rsplit(".", 1)[0] + "_preprocessed.csv"
    preprocessed_data.to_csv(output_csv, index=False)
    logger.info(f"Preprocessed data saved to {output_csv}")
    
    return output_csv, preprocessed_data.to_csv(index=False)

if __name__ == "__main__":
    logger.info("Script started")
    
    # Read input from stdin
    input_data = sys.stdin.read()
    
    try:
        # Try to parse input as JSON
        params = json.loads(input_data)
        file_path = params['filePath']
        task_type = params['taskType']
        target_column = params['targetColumn']
        preprocessing_config = params['preProcessingConfig']
    except json.JSONDecodeError:
        # If not JSON, assume it's the old format
        params = input_data.strip().split('\n')
        file_path = params[0]
        task_type = params[1]
        target_column = params[2]
        preprocessing_config = json.loads(params[3])
    
    logger.info(f"Input file path: {file_path}")
    logger.info(f"Task type: {task_type}")
    logger.info(f"Target column: {target_column}")
    logger.debug(f"Preprocessing config: {json.dumps(preprocessing_config, indent=2)}")
    
    try:
        output_csv, preprocessed_json = preprocess_data(file_path, task_type, target_column, preprocessing_config)
        result = {
            "preprocessed_file": output_csv,
            "preprocessed_data": preprocessed_json
        }
        print(json.dumps(result))
    except Exception as e:
        logger.error(f"Error during preprocessing: {str(e)}")
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
    
    logger.info("Script completed successfully")