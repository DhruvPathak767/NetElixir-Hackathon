import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

class UserPaths:
    def __init__(self, user_id: int):
        self.user_id = str(user_id)
        
        # User directories
        self.uploads_dir = BACKEND_DIR / "uploads" / self.user_id
        self.processed_dir = BACKEND_DIR / "processed" / self.user_id
        self.models_dir = BACKEND_DIR / "models" / self.user_id
        
        # Create directories immediately
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        # File paths
        self.cleaned_data_file = self.processed_dir / "cleaned_data.csv"
        self.features_file = self.processed_dir / "features.csv"
        self.predictions_file = self.models_dir / "predictions.csv"
        self.old_predictions_file = self.processed_dir / "predictions.csv"
        self.channel_mapping_file = self.processed_dir / "channel_mapping.json"
        
        self.revenue_model_file = self.models_dir / "revenue_model.pkl"
        self.metrics_file = self.models_dir / "metrics.json"
        self.feature_importance_file = self.models_dir / "feature_importance.csv"
        self.feature_columns_json = self.models_dir / "feature_columns.json"
        self.feature_columns_file = self.models_dir / "feature_columns.pkl"
        self.model_features_file = self.models_dir / "model_features.json"
        self.model_info_file = self.models_dir / "model_info.json"
        self.model_metadata_file = self.models_dir / "model_metadata.json"
        self.training_log_file = self.models_dir / "training_log.json"
        self.recommendation_history_file = self.models_dir / "recommendation_history.json"
        
    def has_uploaded_dataset(self) -> bool:
        """
        Check if the user has uploaded any CSV/Excel dataset.
        """
        if not self.uploads_dir.exists():
            return False
        csv_files = list(self.uploads_dir.glob("*.csv"))
        return len(csv_files) > 0

    def get_latest_csv_path(self) -> Path:
        """
        Returns the path to the newest CSV file uploaded by the user,
        or the cleaned CSV file if it exists and is newer.
        """
        csv_files = sorted(
            self.uploads_dir.glob("*.csv"),
            key=lambda p: p.stat().st_mtime,
            reverse=True,
        )
        if not csv_files:
            raise FileNotFoundError("No dataset uploaded yet. Please upload a dataset to begin.")
            
        latest_upload = csv_files[0]
        if self.cleaned_data_file.exists():
            if self.cleaned_data_file.stat().st_mtime > latest_upload.stat().st_mtime:
                return self.cleaned_data_file
                
        return latest_upload
