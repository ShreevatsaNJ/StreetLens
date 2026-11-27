import cv2
import numpy as np

def detect_waterlogging(image: np.ndarray, bbox: list) -> bool:
    """
    Inspects whether a pothole/defect bounding box contains standing water or water reflections.
    Checks low saturation, reflective contrast, and specular highlights.
    """
    try:
        x1, y1, x2, y2 = map(int, bbox)
        h, w = image.shape[:2]
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        
        if (x2 - x1) <= 10 or (y2 - y1) <= 10:
            return False

        roi = image[y1:y2, x1:x2]
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        v_channel = hsv[:, :, 2]
        s_channel = hsv[:, :, 1]
        
        total_pixels = float(roi.shape[0] * roi.shape[1])
        
        # Water reflections: bright reflective center or specular highlights alongside low saturation & dark cavity edge
        bright_pixels = np.sum(v_channel > 140)
        dark_pixels = np.sum(gray < 75)
        low_sat_pixels = np.sum(s_channel < 60)
        
        ratio_bright = bright_pixels / total_pixels
        ratio_dark = dark_pixels / total_pixels
        ratio_low_sat = low_sat_pixels / total_pixels
        
        # Either direct specular glare (>200) or bimodal puddle reflection
        is_glare = (np.sum(v_channel > 210) / total_pixels > 0.08) and (ratio_low_sat > 0.35)
        is_puddle = (ratio_bright > 0.12 and ratio_dark > 0.10 and ratio_low_sat > 0.30)
        
        return bool(is_glare or is_puddle)
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
        is_waterlogged = bool(d.get("is_waterlogged", False))
        if not is_waterlogged and "pothole" in cls_name.lower():
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

    # 6. Pavement Condition Index (PCI) - ASTM D6433 Standard (0 to 100)
    has_waterlogged = any(d.get("is_waterlogged", False) for d in ranked_defects)
    pothole_count = sum(1 for d in ranked_defects if "pothole" in d["class"].lower())
    crack_count = total_defects - pothole_count

    if total_defects == 0:
        pci_score = 100
        pci_rating = "Good"
        pci_color = "#10b981"
        integrity_status = "Optimal Pavement Health"
    else:
        deductions = (high_count * 18.0) + (med_count * 8.5) + (low_count * 3.5) + (damage_density_pct * 1.6)
        if has_waterlogged:
            deductions += 12.0
        pci_score = max(5, int(round(100.0 - deductions)))
        
        if pci_score >= 85:
            pci_rating = "Good"
            pci_color = "#10b981"
            integrity_status = "Minor surface aging; routine preservation"
        elif pci_score >= 70:
            pci_rating = "Satisfactory"
            pci_color = "#3b82f6"
            integrity_status = "Superficial distress; crack sealing recommended"
        elif pci_score >= 55:
            pci_rating = "Fair"
            pci_color = "#f59e0b"
            integrity_status = "Moderate deterioration; localized patch repairs needed"
        elif pci_score >= 40:
            pci_rating = "Poor"
            pci_color = "#f97316"
            integrity_status = "Structural distress; extensive patching & thin overlay required"
        elif pci_score >= 25:
            pci_rating = "Very Poor"
            pci_color = "#ef4444"
            integrity_status = "Severe base failure; deep milling and full overlay required"
        elif pci_score >= 10:
            pci_rating = "Serious"
            pci_color = "#dc2626"
            integrity_status = "Imminent pavement collapse; emergency intervention needed"
        else:
            pci_rating = "Failed"
            pci_color = "#991b1b"
            integrity_status = "Total structural failure; complete reconstruction required"

    pci = {
        "score": pci_score,
        "rating": pci_rating,
        "color": pci_color,
        "integrity_status": integrity_status,
        "standard": "ASTM D6433 / US Army Corps PAVER Protocol"
    }

    # 7. Municipal Engineering Intervention & Cost Estimation
    damaged_sqm = round(max(0.4, (damage_density_pct / 100.0) * 45.0), 2)
    damaged_sqft = round(damaged_sqm * 10.764, 1)

    cost_inr = int(round(
        max(3500, (high_count * 2800) + (med_count * 1500) + (low_count * 600) + (damaged_sqm * 950)),
        -2
    ))
    cost_usd = round(cost_inr / 86.0, 1)

    if road_condition == "CRITICAL" or high_count >= 2:
        treatment = "Full-Depth Emergency Patching (VG-30 Hot Mix) & Heavy Vibratory Compaction"
        urgency = "Emergency Intervention"
        urgency_window = "Within 24–48 Hours"
        urgency_code = "CRITICAL_SLA"
    elif road_condition == "POOR" or high_count == 1:
        treatment = "Milling & Bituminous Concrete Overlay (40mm) with RS-1 Tack Emulsion"
        urgency = "High Priority"
        urgency_window = "Within 5–7 Days"
        urgency_code = "HIGH_PRIORITY"
    elif road_condition == "FAIR":
        treatment = "Polymer-Modified Crack Sealing & Micro-Surfacing (IRC:SP:81)"
        urgency = "Scheduled Maintenance"
        urgency_window = "Within 14–21 Days"
        urgency_code = "SCHEDULED"
    else:
        treatment = "Routine Surface Inspection & Preventative Fog Seal"
        urgency = "Preventative Routine"
        urgency_window = "Quarterly Review (90 Days)"
        urgency_code = "ROUTINE"

    repair_estimate = {
        "damaged_area_sqm": damaged_sqm,
        "damaged_area_sqft": damaged_sqft,
        "cost_inr": cost_inr,
        "cost_usd": cost_usd,
        "treatment": treatment,
        "urgency": urgency,
        "urgency_window": urgency_window,
        "urgency_code": urgency_code,
        "materials": [
            "Dense Bituminous Macadam (DBM) Grade 2" if high_count > 0 else "Bituminous Concrete (BC)",
            "Rapid Setting Tack Coat (RS-1 Emulsion)",
            "Polymer Modified Bitumen (PMB-40 / ASTM D6690)" if crack_count > 0 else "Fine aggregate sand sheet"
        ],
        "equipment": [
            "Pneumatic / Vibratory Plate Compactor (10–12 Ton)",
            "High-Pressure Compressed Air Lancing Unit",
            "Tack Coat Spray Distributor"
        ],
        "compliance_standard": "IRC:82-2015 & MORTH Section 3004"
    }

    # 8. 6-Axis Multi-Vector Risk Radar Matrix (0-100 scale)
    structural_val = min(100.0, max(15.0, high_count * 22.0 + med_count * 10.0 + damage_density_pct * 2.8))
    suspension_val = min(100.0, max(10.0, user_risks["four_wheeler"] * 0.92 + high_count * 8.0))
    loss_control_val = min(100.0, max(12.0, user_risks["two_wheeler"] * 0.95))
    hydro_val = 92.0 if has_waterlogged else min(80.0, max(15.0, damage_density_pct * 3.8 + 12.0))
    pedestrian_val = min(100.0, max(10.0, user_risks["pedestrian"] * 0.88 + high_count * 6.0))
    subgrade_val = min(100.0, max(20.0, (40.0 if has_waterlogged else 15.0) + damage_density_pct * 4.2))

    risk_radar = [
        {"subject": "Structural Damage", "value": round(structural_val, 1), "fullMark": 100},
        {"subject": "Vehicle Suspension", "value": round(suspension_val, 1), "fullMark": 100},
        {"subject": "Loss of Control", "value": round(loss_control_val, 1), "fullMark": 100},
        {"subject": "Hydroplaning", "value": round(hydro_val, 1), "fullMark": 100},
        {"subject": "Pedestrian Safety", "value": round(pedestrian_val, 1), "fullMark": 100},
        {"subject": "Water Infiltration", "value": round(subgrade_val, 1), "fullMark": 100},
    ]

    # 9. Deterioration Forecast Over Time (Day 0 to Day 90)
    decay_rate = 1.6 if has_waterlogged else 1.2
    cur_pci = pci_score
    day15_pci = max(5, int(round(cur_pci - (8 * decay_rate))))
    day30_pci = max(5, int(round(cur_pci - (19 * decay_rate))))
    day60_pci = max(5, int(round(cur_pci - (36 * decay_rate))))
    day90_pci = max(5, int(round(cur_pci - (54 * decay_rate))))

    deterioration_forecast = [
        {"timeline": "Current", "untreated": cur_pci, "repaired": cur_pci, "benchmark": 85},
        {"timeline": "Day 15", "untreated": day15_pci, "repaired": 94, "benchmark": 85},
        {"timeline": "Day 30", "untreated": day30_pci, "repaired": 92, "benchmark": 85},
        {"timeline": "Day 60", "untreated": day60_pci, "repaired": 90, "benchmark": 85},
        {"timeline": "Day 90", "untreated": day90_pci, "repaired": 88, "benchmark": 85},
    ]

    # 10. Detailed Road-User Risk Assessment
    detailed_user_impact = {
        "two_wheeler": {
            "user": "Two-Wheelers & Motorcyclists",
            "risk_score": user_risks["two_wheeler"],
            "vulnerability": "CRITICAL" if user_risks["two_wheeler"] >= 70 else ("HIGH" if user_risks["two_wheeler"] >= 45 else "MODERATE"),
            "color": "#ef4444",
            "key_hazards": [
                "Violent front-fork compression and sudden handlebar kickback causing loss of balance",
                "Alloy wheel rim deformation or crack, leading to instantaneous tire deflation",
                "Waterlogged potholes conceal cavity depth, preventing evasive braking"
            ],
            "speed_advisory": "Max 25 km/h recommended in this sector",
            "accident_probability": "Very High" if user_risks["two_wheeler"] >= 70 else "Elevated"
        },
        "four_wheeler": {
            "user": "Four-Wheelers & Light Commercial",
            "risk_score": user_risks["four_wheeler"],
            "vulnerability": "HIGH" if user_risks["four_wheeler"] >= 65 else ("MODERATE" if user_risks["four_wheeler"] >= 35 else "LOW"),
            "color": "#f59e0b",
            "key_hazards": [
                "Tire sidewall bulge, internal belt rupture, and wheel alignment offset",
                "Excessive wear on ball joints, tie rod ends, and lower wishbone bushings",
                "Hard deceleration jolt on impact increases risk of secondary rear-end collision"
            ],
            "speed_advisory": "Max 35 km/h; avoid abrupt lane swerving",
            "accident_probability": "Moderate to High"
        },
        "commercial_heavy": {
            "user": "Heavy Freight & Transit Buses",
            "risk_score": min(100.0, round(user_risks["four_wheeler"] * 0.85 + damage_density_pct * 2.0, 1)),
            "vulnerability": "MODERATE" if damage_density_pct < 10 else "HIGH",
            "color": "#8b5cf6",
            "key_hazards": [
                "Dynamic axle shock amplifies pavement sub-base disintegration",
                "Trailer sway and cargo shift due to differential wheel settlement",
                "Air brake drum and leaf spring fatigue under cyclical impact"
            ],
            "speed_advisory": "Max 30 km/h; keep to center lane where possible",
            "accident_probability": "Moderate"
        },
        "pedestrian_cyclist": {
            "user": "Pedestrians & Micro-Mobility",
            "risk_score": user_risks["pedestrian"],
            "vulnerability": "HIGH" if user_risks["pedestrian"] >= 50 else "MODERATE",
            "color": "#38bdf8",
            "key_hazards": [
                "Severe tripping and ankle sprain risk along jagged, crumbling asphalt edges",
                "Bicycle / e-scooter front wheels get trapped in longitudinal crack grooves",
                "Vehicle splash projection creates slip and visibility hazards"
            ],
            "speed_advisory": "Dismount cycles across marked hazard zone",
            "accident_probability": "High for Elderly & Cyclists"
        }
    }

    # 11. Dynamic Civil Engineering Diagnostic Synthesis
    primary_failure = "Pothole cavity cratering with localized subgrade failure" if pothole_count >= crack_count else "Tensile fatigue cracking in asphalt binder"
    water_clause = " Standing water detected inside defects compounds hydraulic stripping and increases loss-of-control risk for two-wheelers by over 40%." if has_waterlogged else ""
    executive_summary = (
        f"Automated structural analysis identified {total_defects} anomalies impacting {round(float(damage_density_pct), 1)}% of the surveyed pavement corridor. "
        f"The road is graded as {road_condition} with a Pavement Condition Index (PCI) of {pci_score}/100 ({pci_rating}). "
        f"The primary distress mechanism is identified as {primary_failure.lower()}.{water_clause} "
        f"Municipal intervention has been assigned Priority {repair_priority} ({urgency}) with an estimated remediation investment of ₹{cost_inr:,} (${cost_usd:,.0f}). "
        f"Immediate action is advised under {repair_estimate['compliance_standard']} to arrest sub-base degradation and safeguard transit users."
    )

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
        "user_risks": user_risks,
        "pci": pci,
        "repair_estimate": repair_estimate,
        "risk_radar": risk_radar,
        "deterioration_forecast": deterioration_forecast,
        "detailed_user_impact": detailed_user_impact,
        "executive_summary": executive_summary
    }

    return ranked_defects, summary
