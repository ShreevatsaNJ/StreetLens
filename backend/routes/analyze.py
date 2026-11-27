import os
import cv2
import time
import base64
import numpy as np
from pathlib import Path
from flask import Blueprint, jsonify, request
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

            # 1. Image Enhancement (Denoising & Contrast Boost for visual storage)
            enhanced_img = enhance_image(raw_img)
            enhanced_filename = f"{session_id}_enhanced.jpg"
            enhanced_path = Config.ENHANCED_FOLDER / enhanced_filename
            cv2.imwrite(str(enhanced_path), enhanced_img)
            session.enhanced_file_path = str(enhanced_path)

            # 2. AI Road Anomaly Detection (Run directly on sharp uncorrupted camera capture)
            raw_detections = detect_road_anomalies(raw_img, conf_threshold=0.18)

            # 3. Defect Ranking & Risk Calculation
            ranked_defects, summary = rank_and_analyze_defects(raw_detections, raw_img)

            # 4. Bokeh Depth-of-Field Spotlight Annotation
            annotated_img = apply_bokeh_annotation(raw_img, ranked_defects)
            annotated_filename = f"{session_id}_annotated.jpg"
            annotated_path = Config.ANNOTATED_FOLDER / annotated_filename
            cv2.imwrite(str(annotated_path), annotated_img)
            session.annotated_file_path = str(annotated_path)

        else:
            # Video Processing — analyze sampled frames with 0.5s temporal resolution
            video_frames_dir = Config.STORAGE_DIR / "temp_frames" / session_id
            frames = process_video_frames(str(raw_path), video_frames_dir, sample_interval_sec=0.5)
            
            # Per-frame detection data for real-time video overlay
            frame_detections = []  # [{timestamp_sec, timestamp_str, defects: [...ranked...]}]
            
            # Track the best frame for the static annotated image / compare slider
            best_frame_detections = []
            best_frame_img = None
            best_frame_score = -1
            best_frame_timestamp = 0.0
            
            # Collect all detections for spatio-temporal tracking
            all_detected_instances = []
            raw_img = None
            frame_w = 960
            frame_h = 540
            
            for f in frames[:100]:  # Process up to 100 sampled frames (~50s of video)
                frame_img = cv2.imread(f["frame_path"])
                if frame_img is None:
                    continue
                
                if raw_img is None:
                    raw_img = frame_img
                    frame_h, frame_w = frame_img.shape[:2]
                
                # Execute YOLO anomaly detection with geometric & NMS filters
                detections = detect_road_anomalies(frame_img, conf_threshold=0.18)
                
                # Rank detections for this frame
                frame_ranked, frame_summary = rank_and_analyze_defects(detections, frame_img)
                for d in frame_ranked:
                    d["video_timestamp"] = f["timestamp_sec"]
                    d["timestamp_str"] = f["timestamp_str"]
                    d["frame_idx"] = len(frame_detections)
                    all_detected_instances.append(d)

                frame_detections.append({
                    "timestamp_sec": f["timestamp_sec"],
                    "timestamp_str": f["timestamp_str"],
                    "defects": frame_ranked,
                    "road_condition": frame_summary.get("road_condition", "GOOD"),
                    "total_defects": frame_summary.get("total_defects", 0)
                })
                
                if frame_ranked:
                    frame_score = sum(d["confidence"] for d in frame_ranked)
                    if frame_score > best_frame_score:
                        best_frame_score = frame_score
                        best_frame_detections = detections
                        best_frame_img = frame_img
                        best_frame_timestamp = f["timestamp_sec"]

            # Spatio-Temporal Tracking & Deduplication
            # Cluster detections across consecutive frames into unique physical hazard tracks
            tracks = []
            for inst in all_detected_instances:
                ix_center = (inst["bbox"][0] + inst["bbox"][2]) / 2.0
                iy_center = (inst["bbox"][1] + inst["bbox"][3]) / 2.0
                matched = False
                for tr in tracks:
                    last = tr[-1]
                    time_diff = abs(inst["video_timestamp"] - last["video_timestamp"])
                    if time_diff <= 1.8:
                        lx_center = (last["bbox"][0] + last["bbox"][2]) / 2.0
                        ly_center = (last["bbox"][1] + last["bbox"][3]) / 2.0
                        # Forward camera progression: x remains aligned within lane, y moves towards bottom
                        if abs(ix_center - lx_center) < (0.22 * frame_w) and (iy_center >= ly_center - 35):
                            tr.append(inst)
                            matched = True
                            break
                if not matched:
                    tracks.append([inst])

            # Deduplicate: Pick the best observation per track
            deduped_defects = []
            for track_id, tr in enumerate(tracks):
                best_obs = max(tr, key=lambda x: x["confidence"])
                t_min = min(x["video_timestamp"] for x in tr)
                t_max = max(x["video_timestamp"] for x in tr)
                dur = f"00:{int(t_min):02d}–00:{int(t_max):02d}" if int(t_min) != int(t_max) else f"00:{int(t_min):02d}"
                
                unique_hazard = dict(best_obs)
                unique_hazard["track_id"] = track_id
                unique_hazard["track_duration"] = dur
                unique_hazard["observations_count"] = len(tr)
                deduped_defects.append(unique_hazard)

                # Link all instances in this track to the track_id
                for x in tr:
                    x["track_id"] = track_id

            # Sort globally by severity score descending and assign permanent global ranks
            deduped_defects.sort(key=lambda x: x.get("severity_score", 0), reverse=True)
            for g_idx, g_d in enumerate(deduped_defects):
                global_rank = g_idx + 1
                g_d["rank"] = global_rank
                # Update all frame-level instances belonging to this track with the same global rank
                for inst in all_detected_instances:
                    if inst.get("track_id") == g_d.get("track_id"):
                        inst["rank"] = global_rank

            # Build timeline events from unique hazards
            for d in deduped_defects:
                timeline_events.append({
                    "timestamp_sec": d["video_timestamp"],
                    "timestamp_str": d["timestamp_str"],
                    "class": d["class"],
                    "severity": d["severity"],
                    "rank": d["rank"]
                })

            # Use the best frame for the static annotated / compare slider view
            if best_frame_img is not None:
                raw_img = best_frame_img
                best_ranked, summary = rank_and_analyze_defects(best_frame_detections, best_frame_img)
                
                raw_frame_filename = f"{session_id}_raw.jpg"
                raw_frame_path = Config.UPLOAD_FOLDER / raw_frame_filename
                cv2.imwrite(str(raw_frame_path), best_frame_img)
                
                annotated_img = apply_bokeh_annotation(best_frame_img, best_ranked)
                ann_filename = f"{session_id}_annotated.jpg"
                annotated_path = Config.ANNOTATED_FOLDER / ann_filename
                cv2.imwrite(str(annotated_path), annotated_img)
                session.annotated_file_path = str(annotated_path)
                
                if deduped_defects:
                    ranked_defects = deduped_defects
                    high_count = sum(1 for d in ranked_defects if d["severity"] == "HIGH")
                    med_count = sum(1 for d in ranked_defects if d["severity"] == "MEDIUM")
                    low_count = sum(1 for d in ranked_defects if d["severity"] == "LOW")
                    summary["total_defects"] = len(ranked_defects)
                    summary["severity_breakdown"] = {"high": high_count, "medium": med_count, "low": low_count}
                    if high_count >= 2:
                        summary["road_condition"] = "CRITICAL"
                        summary["repair_priority"] = 5
                    elif high_count >= 1 or med_count >= 3:
                        summary["road_condition"] = "POOR"
                        summary["repair_priority"] = 4
                    elif med_count >= 1:
                        summary["road_condition"] = "FAIR"
                        summary["repair_priority"] = 3
                    else:
                        summary["road_condition"] = "GOOD"
                        summary["repair_priority"] = 1
                else:
                    ranked_defects = best_ranked
            else:
                first_frame = cv2.imread(frames[0]["frame_path"]) if frames else np.zeros((540, 960, 3), dtype=np.uint8)
                raw_img = first_frame
                ranked_defects, summary = rank_and_analyze_defects([], first_frame)
                
                raw_frame_filename = f"{session_id}_raw.jpg"
                raw_frame_path = Config.UPLOAD_FOLDER / raw_frame_filename
                cv2.imwrite(str(raw_frame_path), first_frame)
                
                ann = apply_bokeh_annotation(first_frame, [])
                ann_filename = f"{session_id}_annotated.jpg"
                annotated_path = Config.ANNOTATED_FOLDER / ann_filename
                cv2.imwrite(str(annotated_path), ann)
                session.annotated_file_path = str(annotated_path)

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
        # For video, raw_img is the best representative frame; for image it's the original
        if raw_img is not None:
            img_dims = [int(raw_img.shape[1]), int(raw_img.shape[0])]
        else:
            img_dims = [612, 408]

        # For video, we saved a _raw.jpg frame; for image the original upload is _raw.<ext>
        if session.media_type == "video":
            raw_url = f"/storage/uploads/{session_id}_raw.jpg"
            video_url = f"/storage/uploads/{session_id}_raw.{raw_ext}"
        else:
            raw_url = f"/storage/uploads/{session_id}_raw.{raw_ext}"
            video_url = None

        response_data = {
            "status": "success",
            "session_id": session_id,
            "media_type": session.media_type,
            "summary": summary,
            "ranked_defects": ranked_defects,
            "chart_data": chart_data,
            "timeline_events": timeline_events,
            "image_dimensions": img_dims,
            "media_urls": {
                "raw": raw_url,
                "video": video_url,
                "enhanced": f"/storage/enhanced/{session_id}_enhanced.jpg" if session.enhanced_file_path else None,
                "annotated": f"/storage/annotated/{session_id}_annotated.jpg",
                "pdf_report": f"/api/report/pdf/{session_id}"
            }
        }

        # Include per-frame detection data for real-time video playback overlay
        if session.media_type == "video":
            response_data["frame_detections"] = frame_detections

        return jsonify(response_data), 200

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

@analyze_bp.route("/api/live_detect_frame", methods=["POST"])
def live_detect_frame():
    """
    Real-time frame inference for live webcam / dashcam feed.
    Receives JSON { "image": "data:image/jpeg;base64,...", "conf_threshold": 0.10 }
    Returns detections, waterlogged flags, and inference latency.
    """
    start_time = time.time()
    try:
        data = request.get_json(silent=True) or {}
        image_b64 = data.get("image", "")
        conf_threshold = float(data.get("conf_threshold", 0.10))

        if not image_b64:
            return jsonify({"error": "No image data provided"}), 400

        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]

        img_bytes = base64.b64decode(image_b64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Failed to decode frame"}), 400

        # Run YOLO anomaly detection with live mode enabled (relaxed horizon, sensitive to phone screens)
        raw_detections = detect_road_anomalies(frame, conf_threshold=conf_threshold, is_live=True)
        
        # Rank defects & check waterlogging
        ranked_defects, summary = rank_and_analyze_defects(raw_detections, frame)

        latency_ms = int((time.time() - start_time) * 1000)

        return jsonify({
            "status": "success",
            "latency_ms": latency_ms,
            "road_condition": summary.get("road_condition", "GOOD"),
            "total_defects": summary.get("total_defects", 0),
            "repair_priority": summary.get("repair_priority", 1),
            "defects": ranked_defects
        }), 200
    except Exception as e:
        return jsonify({"error": f"Live detection error: {str(e)}"}), 500
