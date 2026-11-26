import os
import cv2
from pathlib import Path
from flask import Blueprint, jsonify
from config import Config
from database import db
from models import AnalysisSession, DetectedDefect, RiskMetric, GeneratedReport
from services.enhancement_service import enhance_image
from services.detector_service import detect_road_anomalies
from services.ranking_service import rank_and_analyze_defects
from services.annotation_service import apply_bokeh_annotation
from services.video_service import process_video_frames
from services.pdf_report_service import generate_pdf_report

analyze_bp = Blueprint("analyze_bp", __name__)

@analyze_bp.route("/api/analyze/<session_id>", methods=["POST"])
def analyze_session(session_id):
    """
    Executes the complete processing pipeline:
    1. Preprocessing & Quality assessment
    2. AI Anomaly detection (YOLO)
    3. Defect ranking & multi-user risk calculation
    4. Bokeh spotlight visual annotation
    5. Automatic ReportLab PDF generation with embedded anomaly picture
    """
    session = AnalysisSession.query.filter_by(session_id=session_id).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    raw_path = Path(session.raw_file_path)
    if not raw_path.exists():
        return jsonify({"error": "Raw media file missing"}), 404

    session.processing_status = "PROCESSING"
    db.session.commit()

    try:
        timeline_events = []
        
        if session.media_type == "image":
            raw_img = cv2.imread(str(raw_path))
            if raw_img is None:
                raise ValueError("Could not read image file")

            # 1. Image Enhancement (Denoising & Contrast Boost)
            enhanced_img = enhance_image(raw_img)
            enhanced_filename = f"{session_id}_enhanced.jpg"
            enhanced_path = Config.ENHANCED_FOLDER / enhanced_filename
            cv2.imwrite(str(enhanced_path), enhanced_img)
            session.enhanced_file_path = str(enhanced_path)

            # 2. AI Road Anomaly Detection
            raw_detections = detect_road_anomalies(enhanced_img)

            # 3. Defect Ranking & Risk Calculation
            ranked_defects, summary = rank_and_analyze_defects(raw_detections, enhanced_img)

            # 4. Bokeh Depth-of-Field Spotlight Annotation
            annotated_img = apply_bokeh_annotation(enhanced_img, ranked_defects)
            annotated_filename = f"{session_id}_annotated.jpg"
            annotated_path = Config.ANNOTATED_FOLDER / annotated_filename
            cv2.imwrite(str(annotated_path), annotated_img)
            session.annotated_file_path = str(annotated_path)

        else:
            # Video Processing
            video_frames_dir = Config.STORAGE_DIR / "temp_frames" / session_id
            frames = process_video_frames(str(raw_path), video_frames_dir, sample_interval_sec=1.0)
            
            all_ranked_defects = []
            sample_frame_annotated_path = None
            
            for f in frames[:15]:  # Process up to 15 keyframes for fast evaluation
                frame_img = cv2.imread(f["frame_path"])
                if frame_img is None:
                    continue
                
                enhanced = enhance_image(frame_img)
                detections = detect_road_anomalies(enhanced)
                ranked, _ = rank_and_analyze_defects(detections, enhanced)

                if ranked:
                    for d in ranked:
                        d["video_timestamp"] = f["timestamp_sec"]
                        d["timestamp_str"] = f["timestamp_str"]
                        all_ranked_defects.append(d)
                        timeline_events.append({
                            "timestamp_sec": f["timestamp_sec"],
                            "timestamp_str": f["timestamp_str"],
                            "class": d["class"],
                            "severity": d["severity"],
                            "rank": d["rank"]
                        })

                if sample_frame_annotated_path is None and ranked:
                    ann = apply_bokeh_annotation(enhanced, ranked)
                    ann_filename = f"{session_id}_annotated.jpg"
                    sample_frame_annotated_path = Config.ANNOTATED_FOLDER / ann_filename
                    cv2.imwrite(str(sample_frame_annotated_path), ann)
                    session.annotated_file_path = str(sample_frame_annotated_path)

            # Fallback if video had zero defects
            if sample_frame_annotated_path is None and frames:
                first_frame = cv2.imread(frames[0]["frame_path"])
                ann = apply_bokeh_annotation(first_frame, [])
                ann_filename = f"{session_id}_annotated.jpg"
                sample_frame_annotated_path = Config.ANNOTATED_FOLDER / ann_filename
                cv2.imwrite(str(sample_frame_annotated_path), ann)
                session.annotated_file_path = str(sample_frame_annotated_path)

            ranked_defects, summary = rank_and_analyze_defects(all_ranked_defects, cv2.imread(frames[0]["frame_path"]))

        # Update Session road condition
        session.road_condition_index = summary["road_condition"]
        session.processing_status = "COMPLETED"

        # Save individual detected defects in DB
        DetectedDefect.query.filter_by(session_id=session_id).delete()
        for d in ranked_defects:
            defect_row = DetectedDefect(
                session_id=session_id,
                defect_class=d["class"],
                confidence=d["confidence"],
                bbox_xmin=d["bbox"][0],
                bbox_ymin=d["bbox"][1],
                bbox_xmax=d["bbox"][2],
                bbox_ymax=d["bbox"][3],
                relative_area=d["relative_area"],
                severity_level=d["severity"],
                severity_score=d["severity_score"],
                video_timestamp=d.get("video_timestamp", 0.0)
            )
            db.session.add(defect_row)

        # Save Risk Metrics
        RiskMetric.query.filter_by(session_id=session_id).delete()
        risk_row = RiskMetric(
            session_id=session_id,
            damage_density_pct=summary["damage_density_pct"],
            total_defects_count=summary["total_defects"],
            high_severity_count=summary["severity_breakdown"]["high"],
            medium_severity_count=summary["severity_breakdown"]["medium"],
            low_severity_count=summary["severity_breakdown"]["low"],
            two_wheeler_risk=summary["user_risks"]["two_wheeler"],
            four_wheeler_risk=summary["user_risks"]["four_wheeler"],
            pedestrian_risk=summary["user_risks"]["pedestrian"],
            repair_priority_index=summary["repair_priority"]
        )
        db.session.add(risk_row)

        # Generate Downloadable PDF with plain border & embedded anomaly picture
        report_pdf_name = f"{session_id}_report.pdf"
        report_pdf_path = Config.REPORT_FOLDER / report_pdf_name
        generate_pdf_report(
            output_pdf_path=str(report_pdf_path),
            session_id=session_id,
            annotated_image_path=str(session.annotated_file_path),
            ranked_defects=ranked_defects,
            summary=summary,
            metadata={"latitude": session.latitude, "longitude": session.longitude}
        )

        GeneratedReport.query.filter_by(session_id=session_id, report_type="PDF").delete()
        report_row = GeneratedReport(
            session_id=session_id,
            report_type="PDF",
            file_path=str(report_pdf_path)
        )
        db.session.add(report_row)
        db.session.commit()

        # Format Chart-Ready Data for Frontend
        chart_data = {
            "category_distribution": [
                {"name": "Potholes", "count": sum(1 for d in ranked_defects if "pothole" in d["class"].lower())},
                {"name": "Longitudinal Cracks", "count": sum(1 for d in ranked_defects if "longitudinal" in d["class"].lower())},
                {"name": "Transverse Cracks", "count": sum(1 for d in ranked_defects if "transverse" in d["class"].lower())},
                {"name": "Alligator Cracks", "count": sum(1 for d in ranked_defects if "alligator" in d["class"].lower())},
            ],
            "severity_pie": [
                {"name": "High Severity", "value": summary["severity_breakdown"]["high"], "color": "#ef4444"},
                {"name": "Medium Severity", "value": summary["severity_breakdown"]["medium"], "color": "#f59e0b"},
                {"name": "Low Severity", "value": summary["severity_breakdown"]["low"], "color": "#10b981"},
            ],
            "user_risk_bars": [
                {"user": "Two-Wheeler", "risk": summary["user_risks"]["two_wheeler"], "color": "#ef4444"},
                {"user": "Four-Wheeler", "risk": summary["user_risks"]["four_wheeler"], "color": "#f59e0b"},
                {"user": "Pedestrian", "risk": summary["user_risks"]["pedestrian"], "color": "#3b82f6"},
            ]
        }

        raw_ext = raw_path.suffix.lstrip(".")
        return jsonify({
            "status": "success",
            "session_id": session_id,
            "summary": summary,
            "ranked_defects": ranked_defects,
            "chart_data": chart_data,
            "timeline_events": timeline_events,
            "media_urls": {
                "raw": f"/storage/uploads/{session_id}_raw.{raw_ext}",
                "enhanced": f"/storage/enhanced/{session_id}_enhanced.jpg" if session.enhanced_file_path else None,
                "annotated": f"/storage/annotated/{session_id}_annotated.jpg",
                "pdf_report": f"/api/report/pdf/{session_id}"
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        session.processing_status = "FAILED"
        db.session.commit()
        return jsonify({"error": f"Pipeline failure: {str(e)}"}), 500

@analyze_bp.route("/api/sessions", methods=["GET"])
def get_all_sessions():
    """Returns a list of all past inspection sessions."""
    try:
        sessions = AnalysisSession.query.order_by(AnalysisSession.created_at.desc()).all()
        output = []
        for s in sessions:
            risk = RiskMetric.query.filter_by(session_id=s.session_id).first()
            defects = DetectedDefect.query.filter_by(session_id=s.session_id).all()
            output.append({
                "session_id": s.session_id,
                "filename": s.original_filename,
                "media_type": s.media_type,
                "created_at": s.created_at.strftime("%b %d, %Y • %H:%M") if s.created_at else None,
                "status": s.processing_status,
                "road_condition": s.road_condition_index or "GOOD",
                "total_defects": risk.total_defects_count if risk else len(defects),
                "repair_priority": risk.repair_priority_index if risk else 1,
                "damage_density_pct": round(risk.damage_density_pct, 2) if risk else 0.0,
                "latitude": s.latitude or 12.9352,
                "longitude": s.longitude or 77.6944,
                "pdf_url": f"/api/report/pdf/{s.session_id}",
                "annotated_url": f"/storage/annotated/{s.session_id}_annotated.jpg" if s.annotated_file_path else None
            })
        return jsonify({"sessions": output}), 200
    except Exception as e:
        return jsonify({"error": f"Could not retrieve sessions: {str(e)}"}), 500
