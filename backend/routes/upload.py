import os
import uuid
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from config import Config
from database import db
from models import AnalysisSession
from services.metadata_service import extract_exif_metadata

upload_bp = Blueprint("upload_bp", __name__)

def is_allowed_file(filename: str):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in Config.ALLOWED_EXTENSIONS

@upload_bp.route("/api/upload", methods=["POST"])
def upload_media():
    """
    Ingests road photos or videos, extracts EXIF GPS, and creates a database session.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if not is_allowed_file(file.filename):
        return jsonify({
            "error": f"Unsupported file type. Allowed: {', '.join(Config.ALLOWED_EXTENSIONS)}"
        }), 400

    # Sanitize and assign UUID
    original_name = secure_filename(file.filename)
    ext = original_name.rsplit(".", 1)[-1].lower()
    session_id = str(uuid.uuid4())
    stored_filename = f"{session_id}_raw.{ext}"
    
    file_path = Config.UPLOAD_FOLDER / stored_filename
    file.save(str(file_path))

    media_type = "video" if ext in Config.ALLOWED_VIDEO_EXTENSIONS else "image"

    # Extract GPS metadata if image
    gps_meta = {"latitude": None, "longitude": None, "has_gps": False}
    if media_type == "image":
        gps_meta = extract_exif_metadata(str(file_path))

    # Allow optional manual location override if passed from frontend form
    manual_lat = request.form.get("latitude")
    manual_lon = request.form.get("longitude")
    if manual_lat and manual_lon:
        try:
            gps_meta["latitude"] = float(manual_lat)
            gps_meta["longitude"] = float(manual_lon)
            gps_meta["has_gps"] = True
        except ValueError:
            pass

    # Save to database
    try:
        session_record = AnalysisSession(
            session_id=session_id,
            original_filename=original_name,
            media_type=media_type,
            raw_file_path=str(file_path),
            latitude=gps_meta.get("latitude"),
            longitude=gps_meta.get("longitude"),
            processing_status="UPLOADED"
        )
        db.session.add(session_record)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to record session: {str(e)}"}), 500

    return jsonify({
        "status": "success",
        "session_id": session_id,
        "filename": original_name,
        "media_type": media_type,
        "media_url": f"/storage/uploads/{stored_filename}",
        "gps": {
            "latitude": gps_meta.get("latitude"),
            "longitude": gps_meta.get("longitude"),
            "has_gps": gps_meta.get("has_gps", False)
        }
    }), 201
