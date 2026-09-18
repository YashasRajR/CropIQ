"""
CropIQ Core Configuration
Centralizes application paths, environment parameters, and security settings.
"""

import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Base directory of the repository (CropIQ-main)
PROJECT_ROOT = Path(__file__).resolve().parents[3]

# Load .env if present
load_dotenv(PROJECT_ROOT / ".env")


class Settings:
    """Application configuration settings."""

    APP_NAME: str = os.getenv("APP_NAME", "CropIQ API")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DESCRIPTION: str = (
        "AI-Powered Crop Yield Intelligence API — Predict, Understand, Optimize"
    )
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Project Root
    BASE_DIR: Path = PROJECT_ROOT

    # Core Asset Paths
    MODEL_PATH: Path = (
        PROJECT_ROOT / os.getenv("MODEL_PATH", "models/cropiq_yield_model.joblib")
        if not os.path.isabs(os.getenv("MODEL_PATH", "models/cropiq_yield_model.joblib"))
        else Path(os.getenv("MODEL_PATH"))
    )

    MODEL_METADATA_PATH: Path = (
        PROJECT_ROOT / os.getenv("MODEL_METADATA_PATH", "models/model_metadata.json")
        if not os.path.isabs(os.getenv("MODEL_METADATA_PATH", "models/model_metadata.json"))
        else Path(os.getenv("MODEL_METADATA_PATH"))
    )

    SCENARIO_METADATA_PATH: Path = (
        PROJECT_ROOT / os.getenv("SCENARIO_METADATA_PATH", "knowledge/scenario_features.json")
        if not os.path.isabs(os.getenv("SCENARIO_METADATA_PATH", "knowledge/scenario_features.json"))
        else Path(os.getenv("SCENARIO_METADATA_PATH"))
    )

    AGRICULTURAL_RULES_PATH: Path = (
        PROJECT_ROOT / os.getenv("AGRICULTURAL_RULES_PATH", "knowledge/agricultural_rules.json")
        if not os.path.isabs(os.getenv("AGRICULTURAL_RULES_PATH", "knowledge/agricultural_rules.json"))
        else Path(os.getenv("AGRICULTURAL_RULES_PATH"))
    )

    PROCESSED_DATA_PATH: Path = PROJECT_ROOT / "data" / "processed" / "crop_yield_model_data.csv"

    # CORS Allowed Origins
    @property
    def CORS_ORIGINS(self) -> List[str]:
        origins_str = os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000",
        )
        return [orig.strip() for orig in origins_str.split(",") if orig.strip()]


_settings = Settings()


def get_settings() -> Settings:
    """Return singleton settings instance."""
    return _settings
