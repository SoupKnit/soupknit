import json
import sys
import logging
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, OneHotEncoder, RobustScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.decomposition import PCA

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_column_preprocessing(preprocessing_config):
    logger.info("Generating column-specific preprocessing steps")
    transformers = []
    
    for column in preprocessing_config['columns']:
        column_name = column['name']
        column_type = column['type']
        preprocessing_steps = column['preprocessing']
        
        pipeline_steps = []
        
        for step in preprocessing_steps:
            if step == 'scale_robust':
                pipeline_steps.append(('scaler', RobustScaler()))
            elif step == 'scale_standard':
                pipeline_steps.append(('scaler', StandardScaler()))
            elif step.startswith('impute_'):
                strategy = step.split('_')[1]
                pipeline_steps.append(('imputer', SimpleImputer(strategy=strategy)))
        
        if column_type == 'categorical':
            pipeline_steps.append(('encoder', OneHotEncoder(handle_unknown='ignore')))
        
        if pipeline_steps:
            transformer = Pipeline(steps=pipeline_steps)
            transformers.append((f'transformer_{column_name}', transformer, [column_name]))
    
    logger.debug(f"Transformers created: {transformers}")
    return transformers

def preprocess_data(file_path, task_type, target_column, preprocessing_config):
    logger.info(f"Starting preprocessing for file: {file_path}")
    
    # Load data
    data = pd.read_csv(file_path)
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
                feature_names.extend(trans.get_feature_names_out(cols))
            else:
                feature_names.extend(cols)
    
    # Convert to DataFrame
    preprocessed_data = pd.DataFrame(X_preprocessed, columns=feature_names)
    preprocessed_data[target_column] = y.reset_index(drop=True)
    
    # Apply global preprocessing steps
    global_preprocessing = preprocessing_config['global_preprocessing']
    if 'drop_missing' in global_preprocessing:
        preprocessed_data = preprocessed_data.dropna()
        logger.info(f"Data shape after dropping missing values: {preprocessed_data.shape}")
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