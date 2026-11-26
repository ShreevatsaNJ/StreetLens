import os
from pathlib import Path
from dotenv import load_dotenv

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent

# Load .env file
load_dotenv(BASE_DIR / ".env")

def resolve_database_uri():
    """Resolves database URI. Uses PostgreSQL if reachable; falls back to SQLite for local offline dev."""
    raw_url = os.getenv("DATABASE_URL", "")
    if raw_url.startswith("postgresql://") or raw_url.startswith("postgresql+psycopg2://"):
        try:
            import psycopg2
            test_url = raw_url.replace("postgresql+psycopg2://", "postgresql://")
            conn = psycopg2.connect(test_url, connect_timeout=1)
            conn.close()
            return raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        except Exception:
            print("ℹ️ [StreetLens] PostgreSQL not reachable on localhost:5432. Defaulting to local SQLite (storage/streetlens.db).")
            return f"sqlite:///{BASE_DIR / 'storage' / 'streetlens.db'}"
    return raw_url or f"sqlite:///{BASE_DIR / 'storage' / 'streetlens.db'}"

class Config:
    """Application configuration settings."""
    
    # Flask settings
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("FLASK_DEBUG", "1") == "1"
    SECRET_KEY = os.getenv("SECRET_KEY", "streetlens-dev-secret-key-2026")
    PORT = int(os.getenv("PORT", 5000))
    
    # Database Settings
    SQLALCHEMY_DATABASE_URI = resolve_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # File Upload Limits (Max 200 MB for video files)
    MAX_CONTENT_LENGTH = 200 * 1024 * 1024
    
    ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
    ALLOWED_VIDEO_EXTENSIONS = {"mp4", "avi", "mov", "mkv"}
    ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS
    
    # Storage Directories
    STORAGE_DIR = BASE_DIR / "storage"
    UPLOAD_FOLDER = BASE_DIR / os.getenv("UPLOAD_FOLDER", "storage/uploads")
    ENHANCED_FOLDER = BASE_DIR / os.getenv("ENHANCED_FOLDER", "storage/enhanced")
    ANNOTATED_FOLDER = BASE_DIR / os.getenv("ANNOTATED_FOLDER", "storage/annotated")
    REPORT_FOLDER = BASE_DIR / os.getenv("REPORT_FOLDER", "storage/reports")
    MODEL_FOLDER = BASE_DIR / os.getenv("MODEL_FOLDER", "models")
    
    # Default YOLO Model Weights
    DEFAULT_MODEL_PATH = MODEL_FOLDER / "best_road_damage.pt"
    FALLBACK_MODEL_PATH = MODEL_FOLDER / "yolov8s.pt"

    @classmethod
    def ensure_directories(cls):
        """Create storage and model directories if they do not exist."""
        for folder in [
            cls.STORAGE_DIR,
            cls.UPLOAD_FOLDER,
            cls.ENHANCED_FOLDER,
            cls.ANNOTATED_FOLDER,
            cls.REPORT_FOLDER,
            cls.MODEL_FOLDER,
        ]:
            folder.mkdir(parents=True, exist_ok=True)
