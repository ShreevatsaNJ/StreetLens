import os
import sys
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from database import db
import models  # Registers models with SQLAlchemy

def create_app():
    """Application factory for StreetLens Flask backend."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Ensure required directories exist
    Config.ensure_directories()

    # Enable Cross-Origin Resource Sharing (CORS) for React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize Database
    db.init_app(app)

    # Register API Blueprints
    from routes.upload import upload_bp
    from routes.analyze import analyze_bp
    from routes.report import report_bp

    app.register_blueprint(upload_bp)
    app.register_blueprint(analyze_bp)
    app.register_blueprint(report_bp)

    with app.app_context():
        try:
            db.create_all()
            print("✅ [StreetLens] Database tables initialized successfully.")
        except Exception as e:
            print(f"⚠️ [StreetLens Warning] Database initialization issue: {e}")

    # Base Health Check Endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_status = "Connected"
        try:
            db.session.execute(db.text("SELECT 1"))
        except Exception as err:
            db_status = f"Disconnected ({err})"

        # Check PyTorch / GPU availability
        try:
            import torch
            cuda_available = torch.cuda.is_available()
            device_name = torch.cuda.get_device_name(0) if cuda_available else "CPU"
        except ImportError:
            cuda_available = False
            device_name = "Torch not installed"

        return jsonify({
            "status": "online",
            "service": "StreetLens API",
            "version": "1.0.0",
            "database": db_status,
            "compute_device": device_name,
            "cuda": cuda_available
        }), 200

    # Serve static stored media (uploads, enhanced, annotated, reports)
    @app.route("/storage/<path:subfolder>/<filename>")
    def serve_storage(subfolder, filename):
        target_dir = Config.STORAGE_DIR / subfolder
        return send_from_directory(str(target_dir), filename)

    return app

app = create_app()

if __name__ == "__main__":
    print(f"🚀 Starting StreetLens API Server on http://localhost:{Config.PORT}")
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
