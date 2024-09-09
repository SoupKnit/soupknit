import pandas as pd
import numpy as np
import sys
import json
import io
from scipy import stats
from dateutil.parser import parse
import re

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

def is_date(string):
    try:
        parse(string)
        return True
    except (ValueError, OverflowError, TypeError):
        return False

def detect_date_columns(df, threshold=0.8):
    date_columns = []
    for col in df.columns:
        if df[col].dtype == 'object':
            # Check if the column contains only string values
            if df[col].apply(lambda x: isinstance(x, str)).all():
                # Sample the column to improve performance
                sample = df[col].sample(min(1000, len(df[col]))).dropna()
                
                # Check if the sampled values match common date formats
                date_pattern = re.compile(r'\d{1,4}[-/]\d{1,2}[-/]\d{1,4}')
                matches = sample.apply(lambda x: bool(date_pattern.match(x)))
                
                if matches.mean() > threshold:
                    date_columns.append(col)
                else:
                    # If not matching the pattern, try parsing as dates
                    is_date_series = sample.apply(is_date)
                    if is_date_series.mean() > threshold:
                        date_columns.append(col)
    
    return date_columns

def generate_preprocessing_config(df, target_column=None, task=None):
    preprocessing_config = {
        "global_preprocessing": [],
        "global_params": {},
        "columns": [],
        "target_preprocessing": {}
    }

    # Function to check if a column should be dropped
    def should_drop_column(col):
        return df[col].nunique() == 1 or df[col].isnull().sum() == len(df)

    # Check for constant columns
    constant_columns = [col for col in df.columns if df[col].nunique() <= 1]
    if constant_columns:
        preprocessing_config["global_preprocessing"].append("drop_constant")

    # Check for duplicate rows
    if df.duplicated().any():
        preprocessing_config["global_preprocessing"].append("drop_duplicate")

    # Check for empty columns
    empty_columns = df.columns[df.isnull().all()].tolist()
    if empty_columns:
        preprocessing_config["global_preprocessing"].append("drop_empty")

    # Detect date columns
    date_columns = detect_date_columns(df)

    # Handle missing values in target column
    if target_column and df[target_column].isnull().sum() > 0:
        missing_pct = df[target_column].isnull().sum() / len(df)
        if missing_pct < 0.05:
            target_imputation = "drop"
        elif task == "regression":
            target_imputation = "mean"
        elif task == "classification":
            target_imputation = "new_category"
        else:
            target_imputation = "drop"
        preprocessing_config["target_preprocessing"]["imputation"] = target_imputation

    # Analyze each column, including the target column
    for column in df.columns:
        column_config = {"name": column, "preprocessing": {}, "params": {}}

        if column in date_columns:
            column_config["type"] = "date"
            column_config["preprocessing"]["date_features"] = ["year", "month", "day", "dayofweek"]
            
            # Handle missing values in date columns
            if df[column].isnull().sum() > 0:
                column_config["preprocessing"]["imputation"] = "drop"
        
        elif pd.api.types.is_numeric_dtype(df[column]):
            column_config["type"] = "numeric"
            
            # Handle missing values
            missing_pct = df[column].isnull().sum() / len(df)
            if missing_pct > 0:
                if column == target_column:
                    column_config["preprocessing"]["imputation"] = preprocessing_config.get("target_imputation", "drop")
                else:
                    if missing_pct < 0.05:
                        column_config["preprocessing"]["imputation"] = "mean"
                    elif missing_pct < 0.15:
                        column_config["preprocessing"]["imputation"] = "median"
                    elif missing_pct < 0.3:
                        column_config["preprocessing"]["imputation"] = "knn"
                        column_config["params"]["n_neighbors"] = 5
                    else:
                        column_config["preprocessing"]["imputation"] = "constant"
                        column_config["params"]["fill_value"] = df[column].median()
            
            # Scaling (not applied to target column)
            if column != target_column:
                if stats.skew(df[column].dropna()) > 1 or stats.skew(df[column].dropna()) < -1:
                    column_config["preprocessing"]["scaling"] = "robust"
                else:
                    column_config["preprocessing"]["scaling"] = "standard"
            
            # Check for outliers (not applied to target column)
            if column != target_column:
                z_scores = np.abs(stats.zscore(df[column].dropna()))
                if np.any(z_scores > 3):
                    column_config["preprocessing"]["outlier_treatment"] = "winsorize"
                    column_config["params"]["winsorize_limits"] = (0.05, 0.95)
        
        elif pd.api.types.is_object_dtype(df[column]) or pd.api.types.is_categorical_dtype(df[column]):
            column_config["type"] = "categorical"
            
            # Handle missing values
            if df[column].isnull().sum() > 0:
                if column == target_column:
                    column_config["preprocessing"]["imputation"] = preprocessing_config.get("target_imputation", "drop")
                else:
                    column_config["preprocessing"]["imputation"] = "constant"
                    column_config["params"]["fill_value"] = "Unknown"
            
            # Encoding (including target column)
            encoding_method = determine_encoding(df[column])
            column_config["preprocessing"]["encoding"] = encoding_method
            
            # Handle high cardinality (not applied to target column)
            if column != target_column and df[column].nunique() > 10:
                column_config["preprocessing"]["high_cardinality"] = "group_rare"
                column_config["params"]["rare_threshold"] = 0.01

        preprocessing_config["columns"].append(column_config)

    # Global preprocessing
    if task == 'clustering' and len(df.columns) > 10:
        preprocessing_config["global_preprocessing"].append("pca")
        preprocessing_config["global_params"]["n_components"] = 0.95

    # Feature selection for high-dimensional data
    if len(df.columns) > 100:
        preprocessing_config["global_preprocessing"].append("feature_selection")
        preprocessing_config["global_params"]["n_features_to_select"] = min(50, len(df.columns) // 2)

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

    # Normalize column names in the dataframe
    df.columns = df.columns.str.strip()
    if target_column:
        target_column = target_column.strip()

    # Generate the preprocessing config
    preprocessing_config = generate_preprocessing_config(df, target_column, task_type)

    # Prepare the result
    result = {
        "preProcessingConfig": preprocessing_config,
    }

    # Print the result as JSON
    print(json.dumps(result))