"""
Model Training Service — app/services/model_training_service.py
==============================================================

Single responsibility: train a LightGBM Regressor using 5-fold cross-validation,
hyperparameter search (RandomizedSearchCV), save model/metadata/metrics, and
verify correctness. Provides accessors for model status, info, and feature importances.
"""

from __future__ import annotations

import json
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Any

import joblib
import lightgbm as lgb
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, RandomizedSearchCV, cross_val_score, train_test_split

logger = logging.getLogger(__name__)
from app.core.user_paths import UserPaths

# ---------------------------------------------------------------------------
# Path constants
# ---------------------------------------------------------------------------
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
FEATURES_FILE: Path = BACKEND_DIR / "processed" / "features.csv"
MODELS_DIR: Path = BACKEND_DIR / "models"
MODEL_FILE: Path = MODELS_DIR / "revenue_model.pkl"
METRICS_FILE: Path = MODELS_DIR / "metrics.json"
FEATURE_IMPORTANCE_FILE: Path = MODELS_DIR / "feature_importance.csv"
FEATURE_COLUMNS_JSON: Path = MODELS_DIR / "feature_columns.json"    # Production json order
FEATURE_COLUMNS_FILE: Path = MODELS_DIR / "feature_columns.pkl"     # Backwards compatibility
MODEL_FEATURES_FILE: Path = MODELS_DIR / "model_features.json"      # Backwards compatibility
MODEL_INFO_FILE: Path = MODELS_DIR / "model_info.json"              # Metadata file (v3 format)
MODEL_METADATA_FILE: Path = MODELS_DIR / "model_metadata.json"      # Backwards compatibility (v2 format)
TRAINING_LOG_FILE: Path = MODELS_DIR / "training_log.json"          # Backwards compatibility
PREDICTIONS_FILE: Path = MODELS_DIR / "predictions.csv"             # Predictions (complete test dataset)
OLD_PREDICTIONS_FILE: Path = BACKEND_DIR / "processed" / "predictions.csv" # Backwards compatibility


def train_model(paths: UserPaths) -> dict[str, Any]:
    """
    Train a LightGBM regressor using 5-fold cross-validation and hyperparameter search,
    evaluate performance on the test set, save the model and metadata, and verify reload.
    """
    FEATURES_FILE = paths.features_file
    MODEL_FILE = paths.revenue_model_file
    METRICS_FILE = paths.metrics_file
    FEATURE_IMPORTANCE_FILE = paths.feature_importance_file
    FEATURE_COLUMNS_JSON = paths.feature_columns_json
    FEATURE_COLUMNS_FILE = paths.feature_columns_file
    MODEL_FEATURES_FILE = paths.model_features_file
    MODEL_INFO_FILE = paths.model_info_file
    MODEL_METADATA_FILE = paths.model_metadata_file
    TRAINING_LOG_FILE = paths.training_log_file
    PREDICTIONS_FILE = paths.predictions_file
    OLD_PREDICTIONS_FILE = paths.old_predictions_file
    MODELS_DIR = paths.models_dir

    start_time = time.perf_counter()

    # 1. Load the features dataset
    if not FEATURES_FILE.exists():
        error_msg = f"Features dataset not found at '{FEATURES_FILE}'. Please run feature engineering first."
        logger.error(error_msg)
        raise FileNotFoundError(error_msg)

    df = pd.read_csv(FEATURES_FILE)
    logger.info("Dataset Loaded")

    total_rows = len(df)
    if total_rows == 0:
        raise ValueError("Dataset is empty. Cannot train a model on an empty dataset.")

    # 2. Target and feature separation (Prevent Target Leakage)
    target_col = "Revenue"
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in the features dataset.")

    y = df[target_col]

    # Exclude all target leakage columns containing Revenue directly or indirectly
    leakage_cols = [
        "Revenue",
        "ROAS",
        "Revenue_Per_Click",
        "Revenue_Lag_1",
        "Revenue_Lag_7",
        "Rolling_Revenue_7",
        "Rolling_Revenue_30"
    ]
    X = df.drop(columns=leakage_cols, errors="ignore")

    # Drop non-numeric and unencoded categorical columns
    cols_to_drop = ["Date", "Campaign_Type", "Region"]
    X = X.drop(columns=cols_to_drop, errors="ignore")

    # Keep only numerical columns
    X = X.select_dtypes(include=[np.number])
    feature_names = X.columns.tolist()
    num_features = len(feature_names)

    if num_features == 0:
        raise ValueError("No numerical features available for training after dropping specified columns.")

    # 3. Dynamic setup based on dataset size
    num_samples = len(X)
    if num_samples < 10:
        logger.info("Small dataset detected (%d samples). Bypassing extensive cross-validation and hyperparameter search.", num_samples)
        
        # Determine CV strategy safely (at least 2 splits required, max cv splits <= num_samples)
        if num_samples >= 2:
            cv_splits = min(3, num_samples)
            cv_strategy = KFold(n_splits=cv_splits, shuffle=True, random_state=42)
            cv_estimator = lgb.LGBMRegressor(random_state=42, min_child_samples=1, verbose=-1)
            cv_scores = cross_val_score(cv_estimator, X, y, cv=cv_strategy, scoring="r2")
            cv_metrics = {
                "fold_scores": [round(float(s), 4) for s in cv_scores],
                "mean_r2": round(float(np.mean(cv_scores)), 4),
                "std": round(float(np.std(cv_scores)), 4)
            }
        else:
            cv_metrics = {
                "fold_scores": [0.0],
                "mean_r2": 0.0,
                "std": 0.0
            }

        # Train/Test Split (ensure at least 1 test sample if possible)
        test_size = 0.2 if num_samples >= 5 else 1.0 / num_samples
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        # Baseline parameters configured for tiny sample sizes
        best_params = {
            "num_leaves": 15,
            "learning_rate": 0.05,
            "max_depth": 3,
            "min_child_samples": max(1, min(2, len(X_train) // 2)),
            "verbose": -1
        }
        logger.info("Using baseline parameters for small dataset training.")
    else:
        # Standard workflow
        logger.info("Cross Validation Started")
        cv_strategy = KFold(n_splits=5, shuffle=True, random_state=42)
        cv_estimator = lgb.LGBMRegressor(random_state=42, verbose=-1)
        cv_scores = cross_val_score(cv_estimator, X, y, cv=cv_strategy, scoring="r2")
        
        cv_metrics = {
            "fold_scores": [round(float(s), 4) for s in cv_scores],
            "mean_r2": round(float(np.mean(cv_scores)), 4),
            "std": round(float(np.std(cv_scores)), 4)
        }

        # Train/Test Split (80% Train, 20% Test)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Hyperparameter Search (RandomizedSearchCV)
        logger.info("Hyperparameter Search Started")
        param_dist = {
            "num_leaves": [31, 50, 80, 120],
            "learning_rate": [0.01, 0.03, 0.05, 0.1],
            "max_depth": [5, 7, 10, 15],
            "min_child_samples": [10, 20, 30, 50],
            "subsample": [0.7, 0.8, 0.9, 1.0],
            "colsample_bytree": [0.7, 0.8, 0.9, 1.0]
        }
        
        # Ensure min_child_samples doesn't exceed half of the training set size
        max_child = max(2, len(X_train) // 2)
        param_dist["min_child_samples"] = [s for s in param_dist["min_child_samples"] if s <= max_child]
        if not param_dist["min_child_samples"]:
            param_dist["min_child_samples"] = [max(1, min(5, len(X_train) // 2))]

        search = RandomizedSearchCV(
            estimator=lgb.LGBMRegressor(random_state=42, verbose=-1),
            param_distributions=param_dist,
            n_iter=20,
            cv=5,
            scoring="r2",
            n_jobs=-1,
            random_state=42,
            verbose=0
        )
        search.fit(X_train, y_train)
        best_params = search.best_params_
        best_params["verbose"] = -1
        logger.info("Best Parameters Found")

    # 6. Train the final model with best parameters
    logger.info("Final Training Started")
    final_model = lgb.LGBMRegressor(**best_params, random_state=42)
    final_model.fit(X_train, y_train)

    # 7. Predict and Evaluate Metrics on Test Set
    y_pred = final_model.predict(X_test)

    r2 = round(float(r2_score(y_test, y_pred)), 4)
    mae = round(float(mean_absolute_error(y_test, y_pred)), 4)
    rmse = round(float(np.sqrt(mean_squared_error(y_test, y_pred))), 4)
    mape = round(float(mean_absolute_percentage_error(y_test, y_pred)) * 100, 4)

    metrics_data = {
        "r2": r2,
        "mae": mae,
        "rmse": rmse,
        "mape": mape
    }

    # 8. Save Model
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(final_model, MODEL_FILE)
    logger.info("Model Saved")

    # 9. Reload and Verify Model
    model_verified = False
    try:
        reloaded_model = joblib.load(MODEL_FILE)
        y_pred_reloaded = reloaded_model.predict(X_test)
        
        # Verify predictions of reloaded model are identical to active model
        if np.allclose(y_pred, y_pred_reloaded):
            model_verified = True
    except Exception as exc:
        logger.error("Failed to verify reloaded model: %s", exc)

    # 10. Save Metrics
    with open(METRICS_FILE, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=4)

    # 11. Save Feature Importance
    importance = final_model.feature_importances_
    fi_df = pd.DataFrame({
        "Feature": feature_names,
        "Importance": importance
    })
    fi_df = fi_df.sort_values(by="Importance", ascending=False)
    fi_df.to_csv(FEATURE_IMPORTANCE_FILE, index=False)
    logger.info("Feature Importance Saved")

    # 12. Task 4: Save Feature Column Order (models/feature_columns.json)
    with open(FEATURE_COLUMNS_JSON, "w", encoding="utf-8") as f:
        json.dump(feature_names, f, indent=4)
    # Save backwards compatibility files
    with open(MODEL_FEATURES_FILE, "w", encoding="utf-8") as f:
        json.dump(feature_names, f, indent=4)
    joblib.dump(feature_names, FEATURE_COLUMNS_FILE)

    # 13. Task 5: Save Prediction Sample (models/predictions.csv)
    predictions_df = pd.DataFrame({
        "Actual_Revenue": y_test.values,
        "Predicted_Revenue": y_pred
    })
    predictions_df["Absolute_Error"] = (predictions_df["Actual_Revenue"] - predictions_df["Predicted_Revenue"]).abs()
    predictions_df["Percentage_Error"] = (
        predictions_df["Absolute_Error"] / np.where(predictions_df["Actual_Revenue"] == 0, 1e-8, predictions_df["Actual_Revenue"])
    ) * 100
    predictions_df = predictions_df.round(4)
    predictions_df.to_csv(PREDICTIONS_FILE, index=False)
    # Save backwards compatibility predictions.csv under processed/
    predictions_df.to_csv(OLD_PREDICTIONS_FILE, index=False)
    logger.info("Prediction Sample Saved")

    # 14. Task 3: Save Model Metadata (models/model_info.json)
    current_date = datetime.now().strftime("%Y-%m-%d")
    model_info = {
        "algorithm": "LightGBM",
        "version": "v3",
        "trained_at": current_date,
        "training_rows": len(X_train),
        "test_rows": len(X_test),
        "features": num_features,
        "target": target_col,
        "best_parameters": best_params,
        "cross_validation": cv_metrics,
        "metrics": metrics_data
    }
    with open(MODEL_INFO_FILE, "w", encoding="utf-8") as f:
        json.dump(model_info, f, indent=4)
    logger.info("Metadata Saved")

    # Save V2 metadata compatibility file
    model_metadata = {
        "algorithm": "LightGBM",
        "training_rows": len(X_train),
        "testing_rows": len(X_test),
        "feature_count": num_features,
        "training_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "target": target_col,
        "model_version": "v3"
    }
    with open(MODEL_METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=4)

    # Save log file (backwards compatibility)
    training_time_seconds = round(time.perf_counter() - start_time, 4)
    training_log = {
        "training_time": training_time_seconds,
        "model_verified": model_verified,
        "status": "Success",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(TRAINING_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(training_log, f, indent=4)

    # Final verification and logs
    if model_verified:
        logger.info("Model Reload Verified")
    
    logger.info("Training Completed")

    return {
        "success": True,
        "rows": total_rows,
        "features_used": num_features,
        "target": target_col,
        "training_time": training_time_seconds,
        "model_verified": model_verified,
        "model_version": "v3",
        "cross_validation": cv_metrics,
        "metrics": metrics_data
    }


def get_feature_importances(paths: UserPaths) -> list[dict[str, Any]]:
    """
    Read feature importances directly from models/feature_importance.csv.
    """
    FEATURE_IMPORTANCE_FILE = paths.feature_importance_file
    if not FEATURE_IMPORTANCE_FILE.exists():
        raise FileNotFoundError(
            f"Feature importance file not found at '{FEATURE_IMPORTANCE_FILE}'. "
            "Please train the model first."
        )
    
    df = pd.read_csv(FEATURE_IMPORTANCE_FILE)
    top_features = []
    for _, row in df.iterrows():
        top_features.append({
            "feature": str(row["Feature"]),
            "importance": float(row["Importance"])
        })
    return top_features


def get_model_info(paths: UserPaths) -> dict[str, Any]:
    """
    Read model metadata from models/model_info.json.
    """
    MODEL_INFO_FILE = paths.model_info_file
    if not MODEL_INFO_FILE.exists():
        raise FileNotFoundError(
            f"Model info file not found at '{MODEL_INFO_FILE}'. "
            "Please train the model first."
        )
    
    with open(MODEL_INFO_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def get_model_status(paths: UserPaths) -> dict[str, Any]:
    """
    Query the status of the trained model.
    """
    MODEL_FILE = paths.revenue_model_file
    MODEL_INFO_FILE = paths.model_info_file

    def get_model_info_local():
        if not MODEL_INFO_FILE.exists():
            raise FileNotFoundError()
        with open(MODEL_INFO_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    if not MODEL_FILE.exists() or not MODEL_INFO_FILE.exists():
        return {
            "model_exists": False,
            "model_version": None,
            "trained_at": None,
            "feature_count": None,
            "metrics": None
        }

    try:
        info = get_model_info_local()
        return {
            "model_exists": True,
            "model_version": info.get("version", "v3"),
            "trained_at": info.get("trained_at"),
            "feature_count": info.get("features"),
            "metrics": info.get("metrics")
        }
    except Exception as exc:
        logger.error("Error reading model info for status: %s", exc)
        return {
            "model_exists": False,
            "model_version": None,
            "trained_at": None,
            "feature_count": None,
            "metrics": None
        }
