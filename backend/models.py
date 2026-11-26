from datetime import datetime
from database import db

class AnalysisSession(db.Model):
    """Stores metadata and processing lifecycle for each uploaded image/video."""
    __tablename__ = "analysis_sessions"

    session_id = db.Column(db.String(64), primary_key=True)
    original_filename = db.Column(db.String(255), nullable=False)
    media_type = db.Column(db.String(20), nullable=False)  # 'image' or 'video'
    
    # File paths
    raw_file_path = db.Column(db.String(500), nullable=False)
    enhanced_file_path = db.Column(db.String(500), nullable=True)
    annotated_file_path = db.Column(db.String(500), nullable=True)

    # GPS coordinates
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    # Quality Gate Scorecard
    blur_score = db.Column(db.Float, nullable=True)
    lighting_status = db.Column(db.String(50), nullable=True)  # 'NORMAL', 'LOW_LIGHT', 'GLARE'
    quality_status = db.Column(db.String(50), nullable=True)   # 'PASSED', 'WARNING_BLUR', 'WARNING_LIGHTING'

    # Condition & Pipeline Status
    road_condition_index = db.Column(db.String(30), nullable=True)  # 'GOOD', 'FAIR', 'POOR', 'CRITICAL'
    processing_status = db.Column(db.String(30), default="UPLOADED") # 'UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    defects = db.relationship("DetectedDefect", backref="session", cascade="all, delete-orphan", lazy=True)
    risk_metric = db.relationship("RiskMetric", backref="session", uselist=False, cascade="all, delete-orphan", lazy=True)
    reports = db.relationship("GeneratedReport", backref="session", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        return {
            "session_id": self.session_id,
            "original_filename": self.original_filename,
            "media_type": self.media_type,
            "gps": {
                "latitude": self.latitude,
                "longitude": self.longitude
            } if self.latitude is not None else None,
            "quality": {
                "blur_score": self.blur_score,
                "lighting_status": self.lighting_status,
                "quality_status": self.quality_status
            },
            "road_condition": self.road_condition_index,
            "processing_status": self.processing_status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "defect_count": len(self.defects)
        }


class DetectedDefect(db.Model):
    """Stores individual defect bounding boxes, classes, and severities."""
    __tablename__ = "detected_defects"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.String(64), db.ForeignKey("analysis_sessions.session_id"), nullable=False)

    defect_class = db.Column(db.String(80), nullable=False)  # 'Pothole', 'Longitudinal Crack', etc.
    confidence = db.Column(db.Float, nullable=False)
    
    # Bounding box coordinates (pixel or normalized)
    bbox_xmin = db.Column(db.Float, nullable=False)
    bbox_ymin = db.Column(db.Float, nullable=False)
    bbox_xmax = db.Column(db.Float, nullable=False)
    bbox_ymax = db.Column(db.Float, nullable=False)

    # Severity analysis
    relative_area = db.Column(db.Float, nullable=True)
    severity_level = db.Column(db.String(20), nullable=False)  # 'LOW', 'MEDIUM', 'HIGH'
    severity_score = db.Column(db.Float, nullable=False)       # 0.0 to 1.0

    # Video timestamp offset (in seconds)
    video_timestamp = db.Column(db.Float, nullable=True, default=0.0)

    def to_dict(self):
        return {
            "id": self.id,
            "class": self.defect_class,
            "confidence": round(self.confidence, 4),
            "bbox": [self.bbox_xmin, self.bbox_ymin, self.bbox_xmax, self.bbox_ymax],
            "severity": self.severity_level,
            "severity_score": round(self.severity_score, 4),
            "video_timestamp": self.video_timestamp
        }


class RiskMetric(db.Model):
    """Stores aggregate risk, damage density, and priority metrics."""
    __tablename__ = "risk_metrics"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.String(64), db.ForeignKey("analysis_sessions.session_id"), nullable=False, unique=True)

    damage_density_pct = db.Column(db.Float, default=0.0)
    total_defects_count = db.Column(db.Integer, default=0)
    high_severity_count = db.Column(db.Integer, default=0)
    medium_severity_count = db.Column(db.Integer, default=0)
    low_severity_count = db.Column(db.Integer, default=0)

    # Road-User Specific Risks (0.0 to 100.0)
    two_wheeler_risk = db.Column(db.Float, default=0.0)
    four_wheeler_risk = db.Column(db.Float, default=0.0)
    pedestrian_risk = db.Column(db.Float, default=0.0)

    # Repair Priority Index (1 = Routine to 5 = Emergency)
    repair_priority_index = db.Column(db.Integer, default=1)

    def to_dict(self):
        return {
            "damage_density_pct": round(self.damage_density_pct, 2),
            "total_defects": self.total_defects_count,
            "severity_breakdown": {
                "high": self.high_severity_count,
                "medium": self.medium_severity_count,
                "low": self.low_severity_count
            },
            "user_risks": {
                "two_wheeler": round(self.two_wheeler_risk, 1),
                "four_wheeler": round(self.four_wheeler_risk, 1),
                "pedestrian": round(self.pedestrian_risk, 1)
            },
            "repair_priority_index": self.repair_priority_index
        }


class GeneratedReport(db.Model):
    """Tracks exported PDF and CSV reports."""
    __tablename__ = "generated_reports"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    session_id = db.Column(db.String(64), db.ForeignKey("analysis_sessions.session_id"), nullable=False)
    report_type = db.Column(db.String(10), nullable=False)  # 'PDF' or 'CSV'
    file_path = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "report_type": self.report_type,
            "file_path": self.file_path,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
