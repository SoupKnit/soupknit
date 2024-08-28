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
from scipy import sparse
from sklearn.base import BaseEstimator, TransformerMixin
import sklearn


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
        if sparse.issparse(X):
            X = X.toarray()
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X)
        value_counts = X.iloc[:, 0].value_counts(normalize=True)
        self.frequent_categories = value_counts[value_counts >= self.rare_threshold].index
        return self

    def transform(self, X):
        if sparse.issparse(X):
            X = X.toarray()
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X)
        return X.iloc[:, 0].map(lambda x: x if x in self.frequent_categories else 'Other').values.reshape(-1, 1)

    def get_feature_names_out(self, input_features=None):
        return ['grouped_' + (input_features[0] if input_features else 'feature')]

def get_column_preprocessing(preprocessing_config, available_columns, task_type):
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

        try:
            # Imputation
            if 'imputation' in preprocessing:
                strategy = preprocessing['imputation']
                if strategy in ['mean', 'median', 'most_frequent']:
                    pipeline_steps.append(('imputer', SimpleImputer(strategy=strategy)))
                elif strategy == 'constant':
                    fill_value = params.get('fill_value', 'Unknown')
                    pipeline_steps.append(('imputer', SimpleImputer(strategy='constant', fill_value=fill_value)))

            # Encoding (adjusted for clustering tasks)
            if column_type == 'categorical':
                if task_type.lower() == 'clustering':
                    if preprocessing.get('encoding') == 'ordinal' or preprocessing.get('high_cardinality') == 'group_rare':
                        pipeline_steps.append(('encoder', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)))
                    else:
                        # Default to frequency encoding for clustering
                        pipeline_steps.append(('encoder', FrequencyEncoder()))
                else:
                    if preprocessing.get('encoding') == 'onehot':
                        pipeline_steps.append(('encoder', OneHotEncoder(handle_unknown='ignore')))
                    elif preprocessing.get('encoding') == 'ordinal':
                        pipeline_steps.append(('encoder', OrdinalEncoder(handle_unknown='use_encoded_value', unknown_value=-1)))

            # Scaling
            if 'scaling' in preprocessing:
                if preprocessing['scaling'] == 'standard':
                    pipeline_steps.append(('scaler', StandardScaler()))
                elif preprocessing['scaling'] == 'minmax':
                    pipeline_steps.append(('scaler', MinMaxScaler()))

            if pipeline_steps:
                transformer = Pipeline(steps=pipeline_steps)
                transformers.append((f'transformer_{column_name}', transformer, [column_name]))

        except Exception as e:
            logger.error(f"Error creating pipeline for column {column_name}: {str(e)}")
            logger.error(f"Pipeline steps: {pipeline_steps}")
            raise

    logger.debug(f"Transformers created: {transformers}")
    return transformers

class FrequencyEncoder(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.encoding_dict = None

    def fit(self, X, y=None):
        # Convert to pandas Series if it's a numpy array
        if isinstance(X, np.ndarray):
            X = pd.Series(X.ravel())
        elif isinstance(X, pd.DataFrame):
            X = X.iloc[:, 0]
        
        self.encoding_dict = X.value_counts(normalize=True).to_dict()
        return self

    def transform(self, X):
        # Convert to pandas Series if it's a numpy array
        if isinstance(X, np.ndarray):
            X = pd.Series(X.ravel())
        elif isinstance(X, pd.DataFrame):
            X = X.iloc[:, 0]
        
        return X.map(self.encoding_dict).fillna(0).values.reshape(-1, 1)

    def fit_transform(self, X, y=None):
        return self.fit(X).transform(X)

    def get_feature_names_out(self, input_features=None):
        return [f'{input_features[0]}_freq'] if input_features else ['frequency']

def apply_global_preprocessing(data, preprocessing_config):
    """Apply global preprocessing steps to the entire dataset."""
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

    if 'pca' in global_preprocessing:
        n_components = global_params.get('n_components', 0.95)
        pca = PCA(n_components=n_components)
        pca_result = pca.fit_transform(data)
        data = pd.DataFrame(pca_result, columns=[f'PC_{i+1}' for i in range(pca_result.shape[1])])
        logger.info(f"Applied PCA, new shape: {data.shape}")

    if 'feature_selection' in global_preprocessing:
        n_features = global_params.get('n_features_to_select', min(50, data.shape[1]))
        selector = SelectKBest(f_classif, k=n_features)
        selected_features = selector.fit_transform(data, data.iloc[:, -1])  # Assuming last column is target
        selected_columns = data.columns[selector.get_support()]
        data = pd.DataFrame(selected_features, columns=selected_columns)
        logger.info(f"Applied feature selection, new shape: {data.shape}")

    return data

def normalize_column_name(col):
    if col is None or str(col).strip() == "":
        return None
    return str(col).strip().lower()

def get_feature_names(column_transformer):
    """Get feature names from all transformers."""
    feature_names = []
    for name, trans, column in column_transformer.transformers_:
        if name != 'remainder':
            if isinstance(trans, Pipeline):
                # Get feature names from last step of the pipeline
                if hasattr(trans.steps[-1][1], 'get_feature_names_out'):
                    feature_names.extend(trans.steps[-1][1].get_feature_names_out(column))
                else:
                    feature_names.extend(column)
            elif hasattr(trans, 'get_feature_names_out'):
                feature_names.extend(trans.get_feature_names_out(column))
            else:
                feature_names.extend(column)
    if column_transformer.remainder != 'drop':
        feature_names.extend(column_transformer.feature_names_in_[column_transformer.remainder])
    return feature_names

def preprocess_data(file_path, task_type, target_column, preprocessing_config):
    logger.info(f"Starting preprocessing for file: {file_path}")

    # Load data
    try:
        data = pd.read_csv(file_path, parse_dates=preprocessing_config.get('date_columns', []))
        logger.info(f"Loaded data shape: {data.shape}")
        logger.debug(f"Original columns in dataframe: {data.columns.tolist()}")
    except Exception as e:
        logger.error(f"Error loading data from {file_path}: {str(e)}")
        raise

    # Normalize column names
    data.columns = [normalize_column_name(col) for col in data.columns]
    normalized_target_column = normalize_column_name(target_column)

    logger.debug(f"Normalized columns in dataframe: {data.columns.tolist()}")
    logger.debug(f"Normalized target column: {normalized_target_column}")

    # Handle target column based on task type
    if task_type.lower() in ['regression', 'classification']:
        # Supervised learning task
        if normalized_target_column not in data.columns:
            error_message = f"Target column '{normalized_target_column}' not found in the dataframe."
            logger.error(error_message)
            raise ValueError(error_message)

        # Handle missing values in target column
        target_imputation = preprocessing_config.get('target_imputation', 'drop')
        if target_imputation == 'drop':
            data = data.dropna(subset=[normalized_target_column])
            logger.info(f"Dropped rows with missing target values. New shape: {data.shape}")
        elif target_imputation in ['mean', 'median', 'most_frequent']:
            imputer = SimpleImputer(strategy=target_imputation)
            data[normalized_target_column] = imputer.fit_transform(data[[normalized_target_column]])
            logger.info(f"Imputed missing target values using {target_imputation} strategy")
        else:
            error_message = f"Unsupported target imputation strategy: {target_imputation}"
            logger.error(error_message)
            raise ValueError(error_message)

        y = data[normalized_target_column]
        X = data.drop(columns=[normalized_target_column])
    elif task_type.lower() == 'clustering':
        # Unsupervised learning task (clustering)
        logger.info("Clustering task detected. No target column will be used.")
        y = None
        X = data
    else:
        error_message = f"Unsupported task type: {task_type}. Supported types are 'regression', 'classification', and 'clustering'."
        logger.error(error_message)
        raise ValueError(error_message)

    # Get column transformers
    try:
        transformers = get_column_preprocessing(preprocessing_config, X.columns, task_type)
    except Exception as e:
        logger.error(f"Error in get_column_preprocessing: {str(e)}")
        raise

    # Create preprocessor
    try:
        preprocessor = ColumnTransformer(
            transformers=transformers,
            remainder='passthrough'
        )
    except Exception as e:
        logger.error(f"Error creating ColumnTransformer: {str(e)}")
        logger.error(f"Transformers: {transformers}")
        raise

    # Fit and transform the data
    try:
        X_preprocessed = preprocessor.fit_transform(X)
        logger.info("Preprocessing completed successfully")
        logger.debug(f"Preprocessed X shape: {X_preprocessed.shape}")
        logger.debug(f"Preprocessed X type: {type(X_preprocessed)}")

        # Convert to dense array if it's sparse
        if sparse.issparse(X_preprocessed):
            logger.info("Converting sparse matrix to dense array")
            X_preprocessed = X_preprocessed.toarray()
        elif not isinstance(X_preprocessed, np.ndarray):
            logger.info("Converting to numpy array")
            X_preprocessed = np.array(X_preprocessed)

    except Exception as e:
        logger.error(f"Error during preprocessing: {str(e)}")
        logger.error(f"Dataframe columns: {X.columns.tolist()}")
        logger.error(f"Transformer columns: {[col for name, transformer, col in transformers]}")
        raise

    # Get feature names
    try:
        feature_names = get_feature_names(preprocessor)
        logger.debug(f"Extracted feature names: {feature_names}")
    except Exception as e:
        logger.warning(f"Error getting feature names: {str(e)}. Using generic column names.")
        feature_names = [f'feature_{i}' for i in range(X_preprocessed.shape[1])]

    # Convert to DataFrame
    preprocessed_data = pd.DataFrame(X_preprocessed, columns=feature_names)

    # Add target column back if it exists
    if y is not None:
        preprocessed_data[normalized_target_column] = y.reset_index(drop=True)

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
        target_column = params.get('targetColumn')  # Make target_column optional
        preprocessing_config = params['preProcessingConfig']
    except json.JSONDecodeError:
        # If not JSON, assume it's the old format
        params = input_data.strip().split('\n')
        file_path = params[0]
        task_type = params[1]
        target_column = params[2] if len(params) > 2 else None
        preprocessing_config = json.loads(params[3] if len(params) > 3 else '{}')

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
        sys.stdout.write(json.dumps(result))
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        logger.error(f"Error during preprocessing: {str(e)}")
        error_result = {"error": str(e)}
        sys.stderr.write(json.dumps(error_result))
        sys.stderr.flush()
        sys.exit(1)