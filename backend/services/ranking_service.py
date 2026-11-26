import cv2
import numpy as np

def detect_waterlogging(image: np.ndarray, bbox: list) -> bool:
    """
    Inspects whether a pothole/defect bounding box contains standing water or water reflections.
    Checks low saturation and specular reflection contrast.
    """
    try:
        x1, y1, x2, y2 = map(int, bbox)
        h, w = image.shape[:2]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        
        if (x2 - x1) <= 5 or (y2 - y1) <= 5:
            return False

        roi = image[y1:y2, x1:x2]
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        v_channel = hsv[:, :, 2]
        s_channel = hsv[:, :, 1]
        
        # Waterlogged asphalt shows high specular highlights alongside low saturation
        bright_pixels = np.sum(v_channel > 215)
        low_sat_pixels = np.sum(s_channel < 50)
        total_pixels = roi.shape[0] * roi.shape[1]
        
        ratio_bright = bright_pixels / float(total_pixels)
        ratio_low_sat = low_sat_pixels / float(total_pixels)
        
        return bool(ratio_bright > 0.12 and ratio_low_sat > 0.40)
    except Exception:
        return False

# Civil engineering hazard weighting factors
CLASS_WEIGHTS = {
    "pothole": 1.00,
    "alligator crack": 0.90,
    "longitudinal crack": 0.65,
    "transverse crack": 0.60,
    "damaged surface": 0.45
}

def rank_and_analyze_defects(raw_detections: list, image: np.ndarray):
    """
    Ranks detected road anomalies, computes severity tiers, damage density %,
    and multi-road-user hazard scores.
    """
    h, w = image.shape[:2]
    total_road_area = float(w * h * 0.75)  # estimated 75% drivable asphalt area
    
    ranked_defects = []
    total_defect_pixel_area = 0.0
    high_count, med_count, low_count = 0, 0, 0

    # 1. Score each anomaly individually
    for i, d in enumerate(raw_detections):
        cls_name = d["class"]
        conf = float(d["confidence"])
        bbox = d["bbox"]
        x1, y1, x2, y2 = bbox
        
        defect_w = max(1.0, float(x2 - x1))
        defect_h = max(1.0, float(y2 - y1))
        defect_area = defect_w * defect_h
        total_defect_pixel_area += defect_area

        # Relative dimension ratio
        rel_area = defect_area / total_road_area
        
        # Hazard weight
        w_c = CLASS_WEIGHTS.get(cls_name.lower(), 0.50)
        
        # Waterlogged check (if pothole contains standing water)
        is_waterlogged = False
        if "pothole" in cls_name.lower():
            is_waterlogged = detect_waterlogging(image, bbox)
            if is_waterlogged:
                w_c = min(1.20, w_c * 1.25)  # waterlogged potholes are significantly more hazardous

        # Composite severity score: 0.0 to 1.0
        # Formula: w_c * (0.6 * scaled_area + 0.4 * confidence)
        scaled_area = min(1.0, rel_area * 15.0)  # scale typical road anomaly sizes
        severity_score = w_c * (0.60 * scaled_area + 0.40 * conf)
        severity_score = min(1.0, max(0.05, severity_score))

        # Classify Severity Tier
        if severity_score >= 0.60 or (is_waterlogged and severity_score >= 0.45):
            severity_level = "HIGH"
            high_count += 1
        elif severity_score >= 0.32:
            severity_level = "MEDIUM"
            med_count += 1
        else:
            severity_level = "LOW"
            low_count += 1

        ranked_defects.append({
            "id": i + 1,
            "class": cls_name,
            "confidence": round(conf, 4),
            "bbox": [round(c, 1) for c in bbox],
            "dimensions_px": [int(defect_w), int(defect_h)],
            "relative_area": round(float(rel_area), 5),
            "severity": severity_level,
            "severity_score": round(float(severity_score), 4),
            "is_waterlogged": is_waterlogged
        })

    # 2. Sort by severity score descending (Rank #1 = Most Critical Anomaly)
    ranked_defects = sorted(ranked_defects, key=lambda x: x["severity_score"], reverse=True)
    for rank_idx, item in enumerate(ranked_defects):
        item["rank"] = rank_idx + 1

    # 3. Compute Damage Density Percentage
    damage_density_pct = min(100.0, (total_defect_pixel_area / total_road_area) * 100.0)

    # 4. Determine Overall Road Condition Index
    total_defects = len(ranked_defects)
    if total_defects == 0:
        road_condition = "GOOD"
        repair_priority = 1
    elif high_count >= 2 or damage_density_pct >= 5.0:
        road_condition = "CRITICAL"
        repair_priority = 5
    elif high_count >= 1 or damage_density_pct >= 2.0 or med_count >= 3:
        road_condition = "POOR"
        repair_priority = 4
    elif med_count >= 1 or low_count >= 2:
        road_condition = "FAIR"
        repair_priority = 2
    else:
        road_condition = "FAIR"
        repair_priority = 2

    # 5. Calculate Road-User Specific Risks (0.0 to 100.0)
    risk_2w = 0.0
    risk_4w = 0.0
    risk_ped = 0.0

    for d in ranked_defects:
        score = d["severity_score"]
        c_name = d["class"].lower()
        
        # Two-Wheelers: High vulnerability to potholes and longitudinal cracks
        if "pothole" in c_name:
            risk_2w += 40.0 * score * (1.3 if d["is_waterlogged"] else 1.0)
            risk_4w += 35.0 * score
            risk_ped += 30.0 * score
        elif "longitudinal" in c_name:
            risk_2w += 32.0 * score  # tire tracking trap
            risk_4w += 15.0 * score
            risk_ped += 10.0 * score
        elif "alligator" in c_name:
            risk_2w += 22.0 * score
            risk_4w += 30.0 * score  # structural road base collapse
            risk_ped += 15.0 * score
        else:
            risk_2w += 15.0 * score
            risk_4w += 15.0 * score
            risk_ped += 15.0 * score

    user_risks = {
        "two_wheeler": round(min(100.0, risk_2w), 1),
        "four_wheeler": round(min(100.0, risk_4w), 1),
        "pedestrian": round(min(100.0, risk_ped), 1)
    }

    summary = {
        "total_defects": total_defects,
        "damage_density_pct": round(float(damage_density_pct), 2),
        "road_condition": road_condition,
        "repair_priority": repair_priority,
        "severity_breakdown": {
            "high": high_count,
            "medium": med_count,
            "low": low_count
        },
        "user_risks": user_risks
    }

    return ranked_defects, summary
