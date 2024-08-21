import pandas as pd
import numpy as np
import sys
import json
import io

def determine_encoding(series, max_categories_for_ordinal=10, ordinal_threshold=0.9):
    n_unique = series.nunique()
    n_total = len(series)
    
    # If too many unique values, use one-hot encoding
    if n_unique > max_categories_for_ordinal:
        return "onehot"
    
    # Check if the values can be converted to numeric
    try:
        numeric_values = pd.to_numeric(series.dropna().unique())
        if len(numeric_values) / n_unique > ordinal_threshold:
            return "ordinal"
    except:
        pass
    
    # Check for string patterns that suggest ordinal nature
    ordinal_patterns = ['low', 'medium', 'high', 'small', 'large', 'first', 'second', 'third']
    lower_values = series.dropna().str.lower()
    if any(lower_values.str.contains(pat).any() for pat in ordinal_patterns):
        return "ordinal"
    
    # Default to one-hot encoding
    return "onehot"

def generate_preprocessing_config(df, target_column=None, task=None):
    preprocessing_config = {
        "global_preprocessing": [],
        "global_params": {},
        "columns": []
    }
    
    # Function to check if a column should be dropped
    def should_drop_column(col):
        return df[col].nunique() == 1 or df[col].isnull().sum() == len(df)
    
    # Check for constant and all-null columns
    constant_or_null_cols = [col for col in df.columns if should_drop_column(col) and col != target_column]
    if constant_or_null_cols:
        preprocessing_config["global_preprocessing"].append("drop_constant")
    
    # Check for duplicate columns
    duplicate_cols = df.columns[df.T.duplicated()].tolist()
    if duplicate_cols:
        preprocessing_config["global_preprocessing"].append("drop_duplicate")
    
    # Analyze each column
    for column in df.columns:
        if column == target_column:
            continue
        
        column_config = {"name": column, "preprocessing": {}, "params": {}}
        
        if pd.api.types.is_numeric_dtype(df[column]):
            column_config["type"] = "numeric"
            
            # Handle missing values
            missing_pct = df[column].isnull().sum() / len(df)
            if missing_pct > 0:
                if missing_pct < 0.05:
                    column_config["preprocessing"]["imputation"] = "median"
                elif missing_pct < 0.15:
                    column_config["preprocessing"]["imputation"] = "knn"
                    column_config["params"]["n_neighbors"] = 5
                elif missing_pct < 0.3:
                    column_config["preprocessing"]["imputation"] = "iterative"
                else:
                    column_config["preprocessing"]["imputation"] = "constant"
                    column_config["params"]["fill_value"] = df[column].median()
            
            # Scaling
            if df[column].skew() > 1 or df[column].skew() < -1:
                column_config["preprocessing"]["scaling"] = "robust"
            else:
                column_config["preprocessing"]["scaling"] = "standard"
        
        elif pd.api.types.is_object_dtype(df[column]) or pd.api.types.is_categorical_dtype(df[column]):
            column_config["type"] = "categorical"
            
            # Handle missing values
            if df[column].isnull().sum() > 0:
                column_config["preprocessing"]["imputation"] = "mode"
            
            # Encoding
            encoding_method = determine_encoding(df[column])
            column_config["preprocessing"]["encoding"] = encoding_method
        
        preprocessing_config["columns"].append(column_config)
    
    # Global preprocessing
    if task == 'clustering' and len(df.columns) > 10:
        preprocessing_config["global_preprocessing"].append("pca")
        preprocessing_config["global_params"]["n_components"] = 0.95
    
    return preprocessing_config

# Main execution
if __name__ == "__main__":
    # Read input parameters from stdin
    input_json = sys.stdin.read()
    input_params = json.loads(input_json)

    file_content = input_params['fileContent']
    task_type = input_params['taskType']
    target_column = input_params['targetColumn']

    # Read the CSV content directly from the string
    df = pd.read_csv(io.StringIO(file_content))

    # Generate the preprocessing config
    preprocessing_config = generate_preprocessing_config(df, target_column, task_type)

    # Prepare the result
    result = {
        "preProcessingConfig": preprocessing_config,
    }

    """
    if task_type == 'classification':
        result["uniqueValues"] = int(df[target_column].nunique())
        result["valueCounts"] = df[target_column].value_counts().to_dict()
    elif task_type == 'regression':
        result["statistics"] = df[target_column].describe().to_dict()

    # Add target column information
    result["targetColumn"] = {
        "name": target_column,
        "type": "numeric" if pd.api.types.is_numeric_dtype(df[target_column]) else "categorical"
    }
    """

    # Print the result as JSON
    print(json.dumps(result))