from typing import Dict, Any
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline
from typing import Dict, Any, List
import logging
import pandas as pd
import numpy as np

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def get_global_preprocessing(preprocessing_params: Dict[str, Any]) -> str:
    steps: List[str] = []
    global_preprocessing = preprocessing_params.get('global_preprocessing', [])
    if 'drop_missing' in global_preprocessing:
        steps.append("# Drop rows with missing values\ndata = data.dropna()")
    if 'drop_constant' in global_preprocessing:
        steps.append("# Drop constant columns\ndata = data.loc[:, (data != data.iloc[0]).any()]")
    if 'drop_duplicate' in global_preprocessing:
        steps.append("# Drop duplicate rows\ndata = data.drop_duplicates()")
    if 'pca' in global_preprocessing:
        n_components = preprocessing_params.get('global_params', {}).get('n_components', 0.95)
        steps.append(f"""
# Apply PCA
numeric_columns = data.select_dtypes(include=['int64', 'float64']).columns
pca = PCA(n_components={n_components})
data[numeric_columns] = pca.fit_transform(data[numeric_columns])
        """)
    return "\n\n".join(steps)

def get_column_preprocessing(preprocessing_params: Dict[str, Any]) -> str:
    numeric_columns = []
    categorical_columns = []
    
    for column in preprocessing_params.get('columns', []):
        if column['type'] == 'numeric':
            numeric_columns.append(column['name'])
        elif column['type'] == 'categorical':
            categorical_columns.append(column['name'])

    transformers = []

    if numeric_columns:
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])
        transformers.append(f"('num', {numeric_transformer}, {numeric_columns})")

    if categorical_columns:
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])
        transformers.append(f"('cat', {categorical_transformer}, {categorical_columns})")

    if not transformers:
        print("Warning: No transformers created. Check your column definitions.")
        return "[]"
    
    transformers_str = ", ".join(transformers)
    print(f"Debug: Transformers created: {transformers_str}")
    return f"[{transformers_str}]"

def generate_preprocessing_code(params: Dict[str, Any]) -> str:
    try:
        imports = """
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, OneHotEncoder, LabelEncoder
from sklearn.feature_selection import VarianceThreshold
from sklearn.decomposition import PCA
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
"""

        preprocessing_steps = []

        if 'drop_missing' in params.get('global_preprocessing', []):
            preprocessing_steps.append("""
# Drop rows with missing values
data = data.dropna()
print("Data shape after dropping missing values:", data.shape)
""")

        if 'drop_constant' in params.get('global_preprocessing', []):
            preprocessing_steps.append("""
# Drop constant columns
constant_filter = VarianceThreshold(threshold=0)
data = pd.DataFrame(constant_filter.fit_transform(data), columns=data.columns[constant_filter.get_support()])
print("Data shape after dropping constant columns:", data.shape)
""")

        if 'drop_duplicate' in params.get('global_preprocessing', []):
            preprocessing_steps.append("""
# Drop duplicate rows
data = data.drop_duplicates()
print("Data shape after dropping duplicates:", data.shape)
""")

        column_preprocessing = []
        for column in params['columns']:
            column_steps = []
            for step in column['preprocessing']:
                if step.startswith('impute_'):
                    if step == 'impute_mean':
                        column_steps.append(f"('{column['name']}', SimpleImputer(strategy='mean'))")
                    elif step == 'impute_median':
                        column_steps.append(f"('{column['name']}', SimpleImputer(strategy='median'))")
                    elif step == 'impute_constant':
                        fill_value = column['params'].get('fill_value', 0)
                        column_steps.append(f"('{column['name']}', SimpleImputer(strategy='constant', fill_value={fill_value}))")
                    elif step == 'impute_knn':
                        n_neighbors = column['params'].get('n_neighbors', 5)
                        column_steps.append(f"('{column['name']}', KNNImputer(n_neighbors={n_neighbors}))")
                elif step.startswith('scale_'):
                    if step == 'scale_standard':
                        column_steps.append(f"('{column['name']}', StandardScaler())")
                    elif step == 'scale_minmax':
                        column_steps.append(f"('{column['name']}', MinMaxScaler())")
                    elif step == 'scale_robust':
                        column_steps.append(f"('{column['name']}', RobustScaler())")
                elif step.startswith('encode_'):
                    if step == 'encode_onehot':
                        column_steps.append(f"('{column['name']}', OneHotEncoder(drop='first', sparse=False))")
                    elif step == 'encode_label':
                        column_steps.append(f"('{column['name']}', LabelEncoder())")

            if column_steps:
                column_preprocessing.append(f"('{column['name']}', Pipeline([{', '.join(column_steps)}]))")

        if column_preprocessing:
            preprocessing_steps.append("""
# Apply column-specific preprocessing
preprocessor = ColumnTransformer([
    {}
], remainder='passthrough')

data = pd.DataFrame(preprocessor.fit_transform(data), columns=preprocessor.get_feature_names_out())
print("Data shape after column-specific preprocessing:", data.shape)
""".format(',\n    '.join(column_preprocessing)))

        if 'pca' in params.get('global_preprocessing', []):
            n_components = params['global_params'].get('n_components', 0.95)
            preprocessing_steps.append(f"""
# Apply PCA
pca = PCA(n_components={n_components})
data = pd.DataFrame(pca.fit_transform(data), columns=[f'PC_{{i+1}}' for i in range(pca.n_components_)])
print("Data shape after PCA:", data.shape)
""")

        preprocessing_code = '\n'.join(preprocessing_steps)

        return imports + preprocessing_code

    except KeyError as e:
        logger.error(f"Missing required parameter: {str(e)}")
        raise ValueError(f"Missing required parameter: {str(e)}")
    except Exception as e:
        logger.error(f"Error in generate_preprocessing_code: {str(e)}")
        raise

def generate_preprocessing_pipeline_code(csv_file_path: str, params: Dict[str, Any]) -> str:
    preprocessing_params = params['preprocessing']
    y_column = params['y_column']

    imports = """
import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.decomposition import PCA
import logging

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
    """

    data_loading = f"""
# Load data
data = pd.read_csv('{csv_file_path}')
logger.info(f"Loaded data shape: {{data.shape}}")
logger.info(f"Loaded data columns: {{data.columns.tolist()}}")
logger.info(f"Data info:\\n{{data.info()}}")
logger.info(f"Data head:\\n{{data.head()}}")
    """

    global_preprocessing = get_global_preprocessing(preprocessing_params)

    column_preprocessing = get_column_preprocessing(preprocessing_params)

    pipeline_creation = f"""
# Create the preprocessing pipeline
preprocessor = ColumnTransformer(
    transformers={column_preprocessing},
    remainder='passthrough'
)

# Prepare data
X_columns = {params['X_columns']}
y_column = '{y_column}'

logger.info(f"X columns: {{X_columns}}")
logger.info(f"y column: {{y_column}}")

missing_X_columns = set(X_columns) - set(data.columns)
if missing_X_columns:
    raise ValueError(f"The following X columns are missing from the data: {{missing_X_columns}}")

if y_column not in data.columns:
    raise ValueError(f"The y column '{{y_column}}' is missing from the data")

X = data[X_columns]
y = data[y_column]

logger.info(f"X shape: {{X.shape}}")
logger.info(f"y shape: {{y.shape}}")

# Apply preprocessing
logger.info("Applying preprocessing...")
X_preprocessed = preprocessor.fit_transform(X)
logger.info(f"Preprocessed X shape: {{X_preprocessed.shape}}")

# Get feature names
logger.info("Getting feature names...")
feature_names = []
for name, trans, cols in preprocessor.transformers_:
    if name != 'remainder':
        if hasattr(trans, 'get_feature_names_out'):
            feature_names.extend(trans.get_feature_names_out(cols))
        else:
            feature_names.extend(cols)

logger.info(f"Number of feature names: {{len(feature_names)}}")
logger.info(f"Feature names: {{feature_names}}")

# Convert to DataFrame with error handling
logger.info("Converting preprocessed data to DataFrame...")
try:
    if isinstance(X_preprocessed, np.ndarray):
        X_preprocessed = X_preprocessed.reshape(X_preprocessed.shape[0], -1)
    
    if X_preprocessed.shape[1] != len(feature_names):
        logger.warning(f"Mismatch between number of features ({{X_preprocessed.shape[1]}}) and feature names ({{len(feature_names)}})")
        # Use original column names, and if more features, append numbered features
        feature_names = X_columns + [f'additional_feature_{{i}}' for i in range(X_preprocessed.shape[1] - len(X_columns))]
        feature_names = feature_names[:X_preprocessed.shape[1]]  # Trim if we have fewer features than original columns
    
    preprocessed_data = pd.DataFrame(X_preprocessed, columns=feature_names)
    preprocessed_data[y_column] = y.reset_index(drop=True)
except Exception as e:
    logger.error(f"Error converting preprocessed data to DataFrame: {{str(e)}}")
    logger.error(f"X_preprocessed shape: {{X_preprocessed.shape}}")
    logger.error(f"X_preprocessed type: {{type(X_preprocessed)}}")
    logger.error(f"y shape: {{y.shape}}")
    raise

logger.info(f"Final preprocessed data shape: {{preprocessed_data.shape}}")
logger.info(f"Final preprocessed data columns: {{preprocessed_data.columns.tolist()}}")

# Save preprocessed data
output_csv = '{csv_file_path.rsplit(".", 1)[0]}_preprocessed.csv'
preprocessed_data.to_csv(output_csv, index=False)
logger.info(f"Preprocessed data saved to {{output_csv}}")

logger.info('Preprocessing pipeline execution completed.')
    """

    return imports + "\n\n" + data_loading + "\n\n" + global_preprocessing + "\n\n" + pipeline_creation

def execute_preprocessing_pipeline_code(pipeline_code: str, csv_file_path: str, params: Dict[str, Any]) -> str:
    try:
        # Create a new namespace to execute the code
        namespace = {
            'pd': pd,
            'np': np,
            'SimpleImputer': SimpleImputer,
            'StandardScaler': StandardScaler,
            'OneHotEncoder': OneHotEncoder,
            'ColumnTransformer': ColumnTransformer,
            'Pipeline': Pipeline,
            'PCA': PCA,
            'logging': logging,
            'logger': logger,
            'csv_file_path': csv_file_path,
            'params': params
        }

        try:
            exec(pipeline_code, namespace)
            print("Pipeline code executed successfully")
        except Exception as e:
            print(f"Error executing pipeline code: {str(e)}")
            raise

        # Retrieve the output CSV path from the namespace
        output_csv = namespace.get('output_csv')

        if not output_csv:
            raise ValueError("Preprocessing pipeline did not produce an output CSV file path")

        logger.info(f"Preprocessing completed. Output file: {output_csv}")
        return output_csv

    except Exception as e:
        logger.error(f"Error executing preprocessing pipeline: {str(e)}")
        raise

def preprocess_data(csv_file_path: str, params: Dict[str, Any]) -> str:
    # Generate the preprocessing pipeline code
    pipeline_code = generate_preprocessing_pipeline_code(csv_file_path, params)
    
    # Execute the preprocessing pipeline
    output_csv = execute_preprocessing_pipeline_code(pipeline_code, csv_file_path, params)
    
    return output_csv

# Example usage
if __name__ == "__main__":
    import json
    import sys

    if len(sys.argv) != 3:
        print("Usage: python script_name.py <input_csv> <params_json>")
        sys.exit(1)

    input_csv = sys.argv[1]
    params_json = sys.argv[2]

    # Load parameters from JSON file
    with open(params_json, 'r') as f:
        params = json.load(f)

    # Preprocess the data
    preprocessed_csv = preprocess_data(input_csv, params)
    print(f"Preprocessed data saved to: {preprocessed_csv}")