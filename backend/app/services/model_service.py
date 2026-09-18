"""
CropIQ Model Service
Thread-safe Singleton managing model pipeline and metadata lifecycle.
Guarantees the model is loaded once on startup and reused across requests.
"""

import json
import threading
from pathlib import Path
from typing import Any, Dict, Optional
import joblib

from ..core.config import get_settings
from ..core.exceptions import ModelNotLoadedException
from ..core.logging import get_logger

logger = get_logger("cropiq.model_service")


class ModelService:
    """Singleton service for model artifact lifecycle and metadata management."""

    _instance: Optional["ModelService"] = None
    _lock = threading.Lock()

    def __init__(self):
        self._pipeline = None
        self._metadata: Dict[str, Any] = {}
        self._scenario_metadata: Dict[str, Any] = {}
        self._loaded = False
        self._load_error: Optional[str] = None

    @classmethod
    def get_instance(cls) -> "ModelService":
        """Return singleton instance of ModelService."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def load(self, model_path: Optional[Path] = None, metadata_path: Optional[Path] = None) -> None:
        """Load the ML pipeline and metadata into memory once."""
        settings = get_settings()
        m_path = model_path or settings.MODEL_PATH
        meta_path = metadata_path or settings.MODEL_METADATA_PATH
        scen_path = settings.SCENARIO_METADATA_PATH

        logger.info(f"Loading CropIQ model from {m_path} ...")

        if not m_path.exists():
            err_msg = f"Model artifact not found at {m_path}"
            logger.error(err_msg)
            self._load_error = err_msg
            self._loaded = False
            raise ModelNotLoadedException(err_msg)

        try:
            self._pipeline = joblib.load(m_path)
            self._loaded = True
            self._load_error = None
            logger.info("Successfully loaded ML pipeline artifact.")
        except Exception as e:
            err_msg = f"Failed to deserialize model pipeline: {str(e)}"
            logger.exception(err_msg)
            self._load_error = err_msg
            self._loaded = False
            raise ModelNotLoadedException(err_msg)

        if meta_path.exists():
            try:
                with open(meta_path, "r", encoding="utf-8") as f:
                    self._metadata = json.load(f)
                logger.info(f"Successfully loaded model metadata (target: {self._metadata.get('target', 'yield')}).")
            except Exception as e:
                logger.warning(f"Could not load metadata from {meta_path}: {e}")
                self._metadata = {}
        else:
            logger.warning(f"Metadata file not found at {meta_path}.")
            self._metadata = {}

        if scen_path.exists():
            try:
                with open(scen_path, "r", encoding="utf-8") as f:
                    self._scenario_metadata = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load scenario metadata from {scen_path}: {e}")
                self._scenario_metadata = {}

    @property
    def is_loaded(self) -> bool:
        """Check if model pipeline is ready."""
        return self._loaded and self._pipeline is not None

    @property
    def load_error(self) -> Optional[str]:
        return self._load_error

    def get_pipeline(self):
        """Retrieve preloaded scikit-learn pipeline."""
        if not self.is_loaded:
            raise ModelNotLoadedException(self._load_error or "Model has not been initialized.")
        return self._pipeline

    def get_metadata(self) -> Dict[str, Any]:
        """Return loaded model metadata dictionary."""
        return self._metadata

    def get_scenario_metadata(self) -> Dict[str, Any]:
        """Return scenario features metadata dictionary."""
        return self._scenario_metadata

    def get_model_info(self) -> Dict[str, Any]:
        """Return safe public model information payload."""
        meta = self._metadata
        metrics = meta.get("metrics", {})
        return {
            "project": meta.get("project", "CropIQ"),
            "model_name": meta.get("model", "Random Forest"),
            "model_type": meta.get("model_class", "RandomForestRegressor"),
            "model_version": meta.get("model_version", "1.0.0"),
            "target": meta.get("target", "yield"),
            "target_unit": meta.get("target_unit", "unconfirmed"),
            "features": meta.get("features", []),
            "categorical_features": meta.get("categorical_features", ["crop_type"]),
            "numerical_features": meta.get("numerical_features", []),
            "metrics": metrics,
            "dataset_summary": meta.get("dataset_summary"),
            "candidate_comparison": meta.get("candidate_comparison"),
        }


def get_model_service() -> ModelService:
    """Helper to obtain ModelService singleton."""
    return ModelService.get_instance()
