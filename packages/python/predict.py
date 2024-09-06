import pandas as pd
import numpy as np
import pickle
import json
import sys
import logging
from sklearn.compose import ColumnTransformer
from create_model import ColumnPreservingTransformer

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def load_model(model_path):
    with open(model_path, 'rb') as file:
        return pickle.load(file)

def extract_feature_data(input_data):
    logger.debug(f"Extracting feature data from: {input_data}")
    if isinstance(input_data, dict):
        if 'inputData' in input_data:
            return extract_feature_data(input_data['inputData'])
        else:
            # Keep the original data types
            return input_data
    return input_data

def map_column_names(input_columns, expected_features):
    # Create a mapping from input column names to expected feature names
    mapping = {}
    for expected in expected_features:
        for input_col in input_columns:
            if input_col in expected:
                mapping[input_col] = expected
                break
    return mapping

def predict(pipeline, input_data):
    logger.debug(f"Raw input data: {input_data}")
    
    # Extract the actual feature data
    feature_data = extract_feature_data(input_data)
    logger.debug(f"Extracted feature data: {feature_data}")
    
    # Create a DataFrame with the feature data
    df = pd.DataFrame([feature_data])
    logger.debug(f"Input DataFrame:\n{df}")
    
    # Get the expected input features from the pipeline
    preprocessor = pipeline.named_steps['preprocessor']
    expected_features = preprocessor.input_features_
    logger.debug(f"Expected features: {expected_features}")
    logger.debug(f"Input data columns: {df.columns}")
    
    # Map input column names to expected feature names
    column_mapping = map_column_names(df.columns, expected_features)
    logger.debug(f"Column mapping: {column_mapping}")
    
    # Rename columns based on the mapping
    df = df.rename(columns=column_mapping)
    logger.debug(f"DataFrame after renaming:\n{df}")
    
    # Check for missing columns and add them with None values
    missing_cols = set(expected_features) - set(df.columns)
    if missing_cols:
        logger.warning(f"Missing columns in input data: {missing_cols}")
        for col in missing_cols:
            df[col] = None
    
    # Reorder columns to match the expected order
    df = df[expected_features]
    logger.debug(f"Reordered DataFrame:\n{df}")
    
    # Log the pipeline steps
    logger.debug("Pipeline steps:")
    for name, step in pipeline.named_steps.items():
        logger.debug(f"  {name}: {type(step).__name__}")
    
    # Make prediction using the pipeline
    try:
        # Transform the data through each step of the pipeline
        for name, step in pipeline.named_steps.items():
            if name != 'model':  # Skip the final model step
                df = step.transform(df)
                logger.debug(f"After {name} step:\n{df}")
        
        # Make the final prediction
        prediction = pipeline.named_steps['model'].predict(df)
        logger.debug(f"Raw prediction: {prediction}")
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        logger.error(f"Input data shape: {df.shape}")
        logger.error(f"Input data columns: {df.columns}")
        raise
    
    # Convert numpy types to native Python types for JSON serialization
    if isinstance(prediction, np.ndarray):
        prediction = prediction.tolist()
    elif np.isscalar(prediction):
        prediction = prediction.item()
    
    logger.debug(f"Final prediction: {prediction}")
    return prediction

def main():
    # Read input from stdin
    input_json = sys.stdin.read()
    input_data = json.loads(input_json)
    
    model_path = input_data['model_path']
    feature_data = input_data['feature_data']
    
    logger.debug(f"Model path: {model_path}")
    logger.debug(f"Feature data: {feature_data}")
    
    # Load the model (pipeline)
    pipeline = load_model(model_path)
    
    # Predict
    result = predict(pipeline, feature_data)
    
    # Return the result as JSON
    print(json.dumps({'prediction': result}))

if __name__ == "__main__":
    main()