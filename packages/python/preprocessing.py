import pandas as pd
import numpy as np
import sys
import json
import logging
from sklearn.experimental import enable_iterative_imputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, RobustScaler, OrdinalEncoder, MinMaxScaler
from sklearn.impute import SimpleImputer, KNNImputer, IterativeImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

def get_column_preprocessing(preprocessing_config, available_columns):
    logger.info("Generating column-specific preprocessing steps")
    transformers = []
    
    for column in preprocessing_config['columns']:
        column_name = column['name']
        if column_name not in available_columns:
            logger.warning(f"Column {column_name} specified in config is not in the dataframe. Skipping.")
            continue
        
        column_type = column['type']
        preprocessing = column['preprocessing']
        params = column.get('params', {})
        
        pipeline_steps = []
        
        # Imputation
        if 'imputation' in preprocessing:
            strategy = preprocessing['imputation']
            if strategy in ['mean', 'median', 'most_frequent']:
                pipeline_steps.append(('imputer', SimpleImputer(strategy=strategy)))
            elif strategy == 'constant':
                fill_value = params.get('fill_value', 'Unknown')
                pipeline_steps.append(('imputer', SimpleImputer(strategy='constant', fill_value=fill_value)))
            elif strategy == 'knn':
                n_neighbors = params.get('n_neighbors', 5)
                pipeline_steps.append(('imputer', KNNImputer(n_neighbors=n_neighbors)))
            elif strategy == 'iterative':
                pipeline_steps.append(('imputer', IterativeImputer()))
        
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
                rare_threshold = params.get('rare_threshold', 0.01)
                pipeline_steps.append(('high_cardinality', RareGrouper(rare_threshold=rare_threshold)))
        
        if pipeline_steps:
            transformer = Pipeline(steps=pipeline_steps)
            transformers.append((f'transformer_{column_name}', transformer, [column_name]))
    
    logger.debug(f"Transformers created: {transformers}")
    return transformers

def preprocess_data(file_path, task_type, target_column, preprocessing_config):
    logger.info(f"Starting preprocessing for file: {file_path}")
    
    # Load data
    data = pd.read_csv(file_path, parse_dates=preprocessing_config.get('date_columns', []))
    logger.info(f"Loaded data shape: {data.shape}")
    logger.debug(f"Original columns in dataframe: {data.columns.tolist()}")
    
    # Normalize column names in the dataframe
    data.columns = [col.strip().lower() for col in data.columns]
    target_column = target_column.strip().lower()
    
    logger.debug(f"Normalized columns in dataframe: {data.columns.tolist()}")
    logger.debug(f"Target column: {target_column}")
    
    # Normalize column names in preprocessing_config
    for col_config in preprocessing_config['columns']:
        col_config['name'] = col_config['name'].strip().lower()
    
    # Validate column names
    config_columns = set(col['name'] for col in preprocessing_config['columns'])
    data_columns = set(data.columns)
    
    logger.debug(f"Columns in config: {config_columns}")
    logger.debug(f"Columns in data: {data_columns}")
    
    missing_columns = config_columns - data_columns
    if missing_columns:
        logger.warning(f"Columns in config but not in data: {missing_columns}")
    
    extra_columns = data_columns - config_columns
    if extra_columns:
        logger.warning(f"Columns in data but not in config: {extra_columns}")
    
    # Check if target column exists in the data
    if target_column not in data.columns:
        logger.error(f"Target column '{target_column}' not found in the dataframe.")
        raise ValueError(f"Target column '{target_column}' not found in the dataframe.")
    
    # Handle target imputation if specified
    target_imputation = preprocessing_config.get('target_imputation')
    if target_imputation:
        logger.info(f"Applying target imputation: {target_imputation}")
        if target_imputation == 'drop':
            data = data.dropna(subset=[target_column])
            logger.info(f"Rows with missing target values dropped. New shape: {data.shape}")
        elif target_imputation in ['mean', 'median', 'most_frequent']:
            imputer = SimpleImputer(strategy=target_imputation)
            data[target_column] = imputer.fit_transform(data[[target_column]])
            logger.info(f"Target imputation applied with strategy: {target_imputation}")
        else:
            logger.warning(f"Unknown target imputation strategy: {target_imputation}. Skipping target imputation.")
    
    # Apply global preprocessing steps
    global_preprocessing = preprocessing_config.get('global_preprocessing', [])
    global_params = preprocessing_config.get('global_params', {})
    
    logger.info(f"Applying global preprocessing steps: {global_preprocessing}")
    
    if 'drop_constant' in global_preprocessing:
        constant_columns = [col for col in data.columns if data[col].nunique() <= 1]
        data = data.drop(columns=constant_columns)
        logger.info(f"Dropped constant columns: {constant_columns}")
    
    if 'drop_duplicate' in global_preprocessing:
        initial_shape = data.shape
        data = data.drop_duplicates()
        logger.info(f"Dropped duplicate rows: {initial_shape[0] - data.shape[0]}")
    
    # Separate features and target
    X = data.drop(columns=[target_column])
    y = data[target_column]
    
    # Get column transformers
    transformers = get_column_preprocessing(preprocessing_config, X.columns)
    
    logger.debug(f"Transformers: {transformers}")
    
    # Create preprocessor
    preprocessor = ColumnTransformer(
        transformers=transformers,
        remainder='passthrough'
    )
    
    # Fit and transform the data
    try:
        X_preprocessed = preprocessor.fit_transform(X)
        logger.info("Preprocessing completed successfully")
        logger.debug(f"Preprocessed X shape: {X_preprocessed.shape}")
    except Exception as e:
        logger.error(f"Error during preprocessing: {str(e)}")
        logger.error(f"Dataframe columns: {X.columns.tolist()}")
        logger.error(f"Transformer columns: {[col for name, transformer, col in transformers]}")
        raise
    
    # Get feature names
    feature_names = preprocessor.get_feature_names_out()
    
    # Convert to DataFrame
    preprocessed_data = pd.DataFrame(X_preprocessed, columns=feature_names)
    
    # Apply additional global preprocessing steps
    if 'pca' in global_preprocessing:
        n_components = global_params.get('n_components', 0.95)
        pca = PCA(n_components=n_components)
        pca_result = pca.fit_transform(preprocessed_data)
        preprocessed_data = pd.DataFrame(pca_result, columns=[f'PC_{i+1}' for i in range(pca_result.shape[1])])
        logger.info(f"Applied PCA, new shape: {preprocessed_data.shape}")
    
    if 'feature_selection' in global_preprocessing:
        n_features = global_params.get('n_features_to_select', 50)
        selector = SelectKBest(f_classif, k=n_features)
        selected_features = selector.fit_transform(preprocessed_data, y)
        selected_columns = preprocessed_data.columns[selector.get_support()]
        preprocessed_data = pd.DataFrame(selected_features, columns=selected_columns)
        logger.info(f"Applied feature selection, new shape: {preprocessed_data.shape}")
    
    # Add target column back
    preprocessed_data[target_column] = y.reset_index(drop=True)
    
    logger.debug(f"Final preprocessed data shape: {preprocessed_data.shape}")
    logger.debug(f"Final preprocessed columns: {preprocessed_data.columns.tolist()}")
    
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