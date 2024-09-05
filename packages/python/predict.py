import pandas as pd
import numpy as np
import pickle
import json
import sys
import io
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def load_model(model_path):
    with open(model_path, 'rb') as file:
        return pickle.load(file)

def preprocess_input(pipeline, input_data):
    # Create a DataFrame with the input data
    df = pd.DataFrame([input_data])
    
    # Extract the preprocessor from the pipeline
    preprocessor = pipeline.named_steps['preprocessor']
    
    # Get the feature names expected by the model
    expected_features = preprocessor.get_feature_names_out()
    
    # Initialize the preprocessed DataFrame with zeros
    preprocessed_df = pd.DataFrame(0, index=[0], columns=expected_features)
    
    # Process each transformer in the ColumnTransformer
    for name, trans, columns in preprocessor.transformers_:
        if name != 'remainder':
            if isinstance(trans, Pipeline):
                # If it's a pipeline, get the last step (usually the actual transformer)
                trans = trans.steps[-1][1]
            
            if isinstance(trans, OneHotEncoder):
                # Handle OneHotEncoder
                for col in columns:
                    if col in df.columns:
                        encoded_features = [f for f in expected_features if f.startswith(f'transformer_{name}__{col}')]
                        value = df[col].iloc[0]
                        for feature in encoded_features:
                            if feature.endswith(f'_{value}'):
                                preprocessed_df[feature] = 1
                                break
            else:
                # Handle other transformers (e.g., StandardScaler)
                for col in columns:
                    if col in df.columns:
                        feature_name = f'transformer_{name}__{col}'
                        if feature_name in expected_features:
                            preprocessed_df[feature_name] = df[col]
    
    logger.debug(f"Preprocessed data:\n{preprocessed_df}")
    return preprocessed_df

def predict(pipeline, input_data):
    logger.debug(f"Input data: {input_data}")
    
    # Preprocess the input data
    preprocessed_data = preprocess_input(pipeline, input_data)
    
    # Make prediction using the pipeline
    try:
        prediction = pipeline.named_steps['model'].predict(preprocessed_data)
        logger.debug(f"Prediction successful: {prediction}")
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise
    
    # Convert numpy types to native Python types for JSON serialization
    if isinstance(prediction, np.ndarray):
        prediction = prediction.tolist()
    elif np.isscalar(prediction):
        prediction = prediction.item()
    
    return prediction

def main():
    # Read input from stdin
    input_json = sys.stdin.read()
    input_data = json.loads(input_json)
    
    model_path = input_data['model_path']
    feature_data = input_data['feature_data']['inputData']
    
    logger.debug(f"Model path: {model_path}")
    logger.debug(f"Feature data: {feature_data}")
    
    # Load the model (pipeline)
    pipeline = load_model(model_path)
    
    if not isinstance(pipeline, Pipeline):
        raise ValueError("Loaded model is not a scikit-learn Pipeline")
    
    # Predict
    result = predict(pipeline, feature_data)
    
    # Return the result as JSON
    print(json.dumps({'prediction': result}))

if __name__ == "__main__":
    main()