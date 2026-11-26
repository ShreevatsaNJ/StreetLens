from flask import Blueprint, send_file, jsonify, Response
from config import Config
from models import AnalysisSession, DetectedDefect
import pandas as pd
import io

report_bp = Blueprint("report_bp", __name__)

@report_bp.route("/api/report/pdf/<session_id>", methods=["GET"])
def download_pdf(session_id):
    """Streams the generated ReportLab PDF with plain border & anomaly pictures."""
    report_file = Config.REPORT_FOLDER / f"{session_id}_report.pdf"
    if not report_file.exists():
        return jsonify({"error": "Report PDF not found for this session"}), 404

    return send_file(
        str(report_file),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"StreetLens_Report_{session_id[:8]}.pdf"
    )

@report_bp.route("/api/report/csv/<session_id>", methods=["GET"])
def download_csv(session_id):
    """Generates and streams a tabular CSV of all detected anomalies."""
    session = AnalysisSession.query.filter_by(session_id=session_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    defects = DetectedDefect.query.filter_by(session_id=session_id).all()
    
    rows = []
    for d in defects:
        rows.append({
            "Defect_ID": d.id,
            "Session_ID": session_id,
            "Road_Condition": session.road_condition_index,
            "Defect_Class": d.defect_class,
            "Severity_Level": d.severity_level,
            "Severity_Score": d.severity_score,
            "Confidence_Pct": round(d.confidence * 100, 1),
            "BBox_Xmin": d.bbox_xmin,
            "BBox_Ymin": d.bbox_ymin,
            "BBox_Xmax": d.bbox_xmax,
            "BBox_Ymax": d.bbox_ymax,
            "Video_Timestamp_Sec": d.video_timestamp,
            "Latitude": session.latitude,
            "Longitude": session.longitude
        })

    df = pd.DataFrame(rows)
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)

    return Response(
        csv_buffer.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=StreetLens_Defects_{session_id[:8]}.csv"}
    )
