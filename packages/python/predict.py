import pandas as pd
import numpy as np
import pickle
import json
import sys
import io

def load_model(model_path):
    with open(model_path, 'rb') as file:
        return pickle.load(file)

def predict(model, input_data):
    # Convert input data to DataFrame
    df = pd.DataFrame([input_data])
    
    # Make prediction
    prediction = model.predict(df)
    
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
    feature_data = input_data['feature_data']
    
    # Load the model
    model = load_model(model_path)
    
    # Make prediction
    result = predict(model, feature_data)
    
    # Return the result as JSON
    print(json.dumps({'prediction': result}))

if __name__ == "__main__":
    main()