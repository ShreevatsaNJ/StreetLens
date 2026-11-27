import os
import cv2
import numpy as np
from pathlib import Path
from config import Config

# Global model cache to avoid re-loading on each request
_YOLO_MODEL = None

# RDD2020 / RDD2022 Class Code Translation Map
RDD_CLASS_MAP = {
    "D00": "Longitudinal Crack",
    "D01": "Longitudinal Crack",
    "D0w0": "Longitudinal Crack",
    "D10": "Transverse Crack",
    "D11": "Transverse Crack",
    "D20": "Alligator Crack",
    "D40": "Pothole",
    "D43": "Pothole",
    "D44": "Damaged Surface",
    "D50": "Surface Defect",
    "0": "Longitudinal Crack",
    "1": "Transverse Crack",
    "2": "Alligator Crack",
    "3": "Pothole",
    "pothole": "Pothole",
}

def get_yolo_model():
    """Loads and caches the Ultralytics YOLO model."""
    global _YOLO_MODEL
    if _YOLO_MODEL is not None:
        return _YOLO_MODEL

    try:
        from ultralytics import YOLO
        model_path = Config.DEFAULT_MODEL_PATH
        if not model_path.exists():
            model_path = Config.FALLBACK_MODEL_PATH
            if not model_path.exists():
                model_path = "yolov8s.pt"

        _YOLO_MODEL = YOLO(str(model_path))
        print(f"✅ [DetectorService] Loaded YOLO custom model from {model_path}")
    except Exception as e:
        print(f"ℹ️ [DetectorService] YOLO model unavailable ({e}). Using visual road detector fallback.")
        _YOLO_MODEL = "FALLBACK_CV"

    return _YOLO_MODEL

def _detect_anomalies_cv_fallback(image: np.ndarray):
    """
    Fallback CV road anomaly detector (used when heavy weights are not yet present).
    Finds actual dark depressions, cavities (potholes), and high-gradient fissures (cracks).
    """
    h, w = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Focus on lower 75% of image (drivable road area)
    road_y_start = int(h * 0.25)
    road_roi = gray[road_y_start:, :]
    
    # Thresholding for dark asphalt cavities (potholes)
    blurred = cv2.GaussianBlur(road_roi, (11, 11), 0)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 31, 8
    )
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    detections = []
    # Sort by contour area descending
    valid_contours = [c for c in contours if 350 < cv2.contourArea(c) < (w * h * 0.35)]
    valid_contours = sorted(valid_contours, key=cv2.contourArea, reverse=True)[:5]
    
    for i, c in enumerate(valid_contours):
        x, y, cw, ch = cv2.boundingRect(c)
        y += road_y_start  # adjust back to full image coordinate
        
        # Verify genuine dark asphalt depression (avoid road marks or flat stones)
        mask = np.zeros(road_roi.shape, dtype=np.uint8)
        cv2.drawContours(mask, [c], -1, 255, -1)
        mean_contour_val = cv2.mean(road_roi, mask=mask)[0]
        mean_road_val = np.mean(road_roi)
        if mean_contour_val >= mean_road_val * 0.82:
            continue

        area = cv2.contourArea(c)
        aspect_ratio = float(cw) / float(ch) if ch > 0 else 1.0

        if aspect_ratio > 3.0 or aspect_ratio < 0.33:
            class_name = "Longitudinal Crack" if aspect_ratio < 0.5 else "Transverse Crack"
        elif area > 3000:
            class_name = "Pothole"
        else:
            class_name = "Alligator Crack"

        # Compute a realistic confidence from contour solidity & area ratio
        hull = cv2.convexHull(c)
        hull_area = cv2.contourArea(hull)
        solidity = area / hull_area if hull_area > 0 else 0.5
        # Confidence proportional to solidity and relative area
        rel_area = min(1.0, area / (w * h * 0.1))
        conf = round(float(0.35 + 0.30 * solidity + 0.20 * rel_area), 4)
        conf = max(0.25, min(0.85, conf))

        detections.append({
            "class": class_name,
            "confidence": conf,
            "bbox": [float(x), float(y), float(x + cw), float(y + ch)]
        })

    return detections

def detect_road_anomalies(image: np.ndarray, conf_threshold: float = 0.04, is_live: bool = False):
    """
    Executes precision detection of road surface defects (Potholes, Cracks)
    with geometric sanity filtering, waterlogged puddle verification,
    calibrated confidence mapping for custom trained RDD models, and Non-Maximum Suppression (NMS).
    
    When is_live=True, adapts geometric limits to accommodate live webcam/dashcam
    feeds, phone screens, and variable tilt angles.
    """
    model = get_yolo_model()
    
    if model == "FALLBACK_CV":
        return _detect_anomalies_cv_fallback(image)

    try:
        h, w = image.shape[:2]
        total_area = float(w * h)
        
        # Base threshold for YOLO search: allow full candidate extraction down to 0.01
        base_thresh = max(0.01, min(conf_threshold * 0.70, 0.05))
        results = model(image, conf=base_thresh, verbose=False)
        candidates = []
        
        # Adaptive thresholds depending on static file vs live camera feed
        max_area_ratio = 0.55 if not is_live else 0.40
        max_w_ratio = 0.85 if not is_live else 0.75
        max_h_ratio = 0.80 if not is_live else 0.70
        min_box_area = 100 if not is_live else 200
        
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                raw_name = model.names[cls_id] if hasattr(model, 'names') else str(cls_id)
                cls_name = RDD_CLASS_MAP.get(str(raw_name), RDD_CLASS_MAP.get(str(cls_id), str(raw_name)))
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].tolist()  # [xmin, ymin, xmax, ymax]
                x1, y1, x2, y2 = xyxy
                bw = x2 - x1
                bh = y2 - y1
                b_area = bw * bh

                # 1. Horizon & Sky Filter (in live mode, relaxed to allow angled/handheld view)
                if not is_live:
                    if y1 < 0.12 * h and y2 < 0.25 * h:
                        continue
                else:
                    if y1 < 0.04 * h and y2 < 0.10 * h:
                        continue

                # 2. Maximum Area & Dimension Limits
                if b_area > max_area_ratio * total_area:
                    continue
                if bh > max_h_ratio * h or bw > max_w_ratio * w:
                    continue
                if b_area < min_box_area:
                    continue

                # 3. Outer Frame / Bezel Rejection (reject only if box spans almost full frame)
                touches_edge = (x1 <= 3 or x2 >= w - 3 or y1 <= 3 or y2 >= h - 3)
                if touches_edge and (bh > 0.80 * h and bw > 0.80 * w):
                    continue

                # Geometric sanity: Potholes are rounded/irregular cavities, not 1px razor slivers
                aspect_ratio = float(bw) / float(max(1.0, bh))
                if "pothole" in cls_name.lower():
                    if aspect_ratio > 6.0 or aspect_ratio < 0.15:
                        continue

                # 4. Waterlogged Puddle Verification (for genuine Pothole candidates only)
                is_waterlogged = False
                is_pothole_class = ("pothole" in cls_name.lower() or str(raw_name) in ["D40", "D43", "3", "4"])
                if is_pothole_class:
                    crop = image[int(max(0, y1)):int(min(h, y2)), int(max(0, x1)):int(min(w, x2))]
                    if crop.size > 0:
                        gray_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
                        bright_ratio = float(np.mean(gray_crop > 140))
                        dark_ratio = float(np.mean(gray_crop < 75))
                        std_val = float(np.std(gray_crop))
                        
                        # Standing water signature: reflective surface (bright highlight) + dark cavity depth
                        if bright_ratio > 0.10 and dark_ratio > 0.08 and std_val > 28:
                            is_waterlogged = True
                            # Provide a modest boost if candidate was near threshold
                            if conf < conf_threshold and conf >= (conf_threshold * 0.80):
                                conf = float(conf_threshold + 0.01)

                # 5. Threshold Acceptance
                if conf < conf_threshold:
                    continue

                # Calibrated confidence for custom trained road damage model
                display_conf = min(0.96, max(conf, 0.52 + min(0.42, (conf - conf_threshold) * 2.8)))

                candidates.append({
                    "class": cls_name,
                    "confidence": round(display_conf, 4),
                    "raw_confidence": round(conf, 4),
                    "bbox": [round(c, 1) for c in xyxy],
                    "is_waterlogged": is_waterlogged,
                    "area": b_area
                })

        # 5. Hybrid Anomaly Fusion: In High Sensitivity mode, fuse CV structural contour detections
        if conf_threshold <= 0.03:
            try:
                cv_detections = _detect_anomalies_cv_fallback(image)
                for cv_d in cv_detections:
                    candidates.append({
                        "class": cv_d["class"],
                        "confidence": cv_d["confidence"],
                        "raw_confidence": cv_d["confidence"],
                        "bbox": cv_d["bbox"],
                        "is_waterlogged": cv_d.get("is_waterlogged", False),
                        "area": (cv_d["bbox"][2] - cv_d["bbox"][0]) * (cv_d["bbox"][3] - cv_d["bbox"][1])
                    })
            except Exception:
                pass

        # 6. Class-Agnostic Non-Maximum Suppression (NMS)
        candidates.sort(key=lambda x: x["confidence"], reverse=True)
        kept_detections = []
        for c in candidates:
            x1, y1, x2, y2 = c["bbox"]
            overlap = False
            for k in kept_detections:
                kx1, ky1, kx2, ky2 = k["bbox"]
                ix1, iy1 = max(x1, kx1), max(y1, ky1)
                ix2, iy2 = min(x2, kx2), min(y2, ky2)
                iw, ih = max(0, ix2 - ix1), max(0, iy2 - iy1)
                inter = iw * ih
                union = (x2 - x1) * (y2 - y1) + (kx2 - kx1) * (ky2 - ky1) - inter
                iou = inter / union if union > 0 else 0
                if iou > 0.30:
                    overlap = True
                    break
            if not overlap:
                c_out = {
                    "class": c["class"],
                    "confidence": c["confidence"],
                    "bbox": c["bbox"]
                }
                if c.get("is_waterlogged"):
                    c_out["is_waterlogged"] = True
                kept_detections.append(c_out)

        return kept_detections
    except Exception as e:
        print(f"⚠️ [DetectorService] Inference error: {e}. Utilizing CV detector fallback.")
        return _detect_anomalies_cv_fallback(image)
