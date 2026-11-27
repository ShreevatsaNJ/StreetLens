import cv2
import numpy as np

# Color Palette for Severities (BGR format for OpenCV)
SEVERITY_COLORS = {
    "HIGH": (30, 30, 220),       # Vibrant Red
    "MEDIUM": (20, 165, 245),    # Vibrant Orange/Amber
    "LOW": (50, 205, 50),        # Vibrant Green
}

def apply_bokeh_annotation(image: np.ndarray, ranked_defects: list, draw_boxes: bool = False) -> np.ndarray:
    """
    Applies an optical Bokeh / Depth-of-Field spotlight effect:
    1. Creates a softly blurred & slightly dimmed version of the entire background asphalt.
    2. Cuts out and preserves the detected anomaly regions in tack-sharp original focus.
    3. If draw_boxes=True (for static PDF exports), draws burned-in bounding boxes and tags.
       If draw_boxes=False (default for interactive Web UI), keeps the spotlight image clean
       so React can dynamically highlight, focus, or make unselected anomalies translucent on click.
    """
    h, w = image.shape[:2]
    
    if not ranked_defects:
        clean_img = image.copy()
        if draw_boxes:
            cv2.putText(
                clean_img, "ROAD STATUS: GOOD (NO ANOMALIES DETECTED)", 
                (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (50, 205, 50), 2, cv2.LINE_AA
            )
        return clean_img

    # 1. Create blurred bokeh background (Gaussian blur + subtle dimming)
    bokeh_background = cv2.GaussianBlur(image, (45, 45), 0)
    bokeh_background = cv2.convertScaleAbs(bokeh_background, alpha=0.85, beta=-10)

    # 2. Composite: Restore sharp anomaly regions into the bokeh background
    annotated = bokeh_background.copy()
    
    for defect in ranked_defects:
        x1, y1, x2, y2 = map(int, defect["bbox"])
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        
        # Overlay original sharp crop
        annotated[y1:y2, x1:x2] = image[y1:y2, x1:x2]

    if not draw_boxes:
        return annotated

    # 3. Draw sleek bounding boxes, rank badges, and waterlogged flags
    for defect in ranked_defects:
        rank = defect.get("rank", 1)
        cls_name = defect.get("class", "Defect")
        severity = defect.get("severity", "MEDIUM")
        confidence = int(defect.get("confidence", 0.8) * 100)
        is_waterlogged = defect.get("is_waterlogged", False)
        
        color = SEVERITY_COLORS.get(severity, (20, 165, 245))
        x1, y1, x2, y2 = map(int, defect["bbox"])
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)

        # Draw bounding rectangle with corner accents
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2, cv2.LINE_AA)
        
        # Corner accent thickness
        corner_len = min(20, int((x2 - x1) * 0.2), int((y2 - y1) * 0.2))
        cv2.line(annotated, (x1, y1), (x1 + corner_len, y1), color, 4)
        cv2.line(annotated, (x1, y1), (x1, y1 + corner_len), color, 4)
        cv2.line(annotated, (x2, y1), (x2 - corner_len, y1), color, 4)
        cv2.line(annotated, (x2, y1), (x2, y1 + corner_len), color, 4)
        cv2.line(annotated, (x1, y2), (x1 + corner_len, y2), color, 4)
        cv2.line(annotated, (x1, y2), (x1, y2 - corner_len), color, 4)
        cv2.line(annotated, (x2, y2), (x2 - corner_len, y2), color, 4)
        cv2.line(annotated, (x2, y2), (x2, y2 - corner_len), color, 4)

        # Label tag: e.g. "#1 Pothole (High) 89%"
        label = f"#{rank} {cls_name} ({severity}) {confidence}%"
        if is_waterlogged:
            label += " [WATER]"

        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.55
        thickness = 1
        (txt_w, txt_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)

        # Badge background
        badge_y1 = max(0, y1 - txt_h - 10)
        badge_y2 = y1
        cv2.rectangle(annotated, (x1, badge_y1), (x1 + txt_w + 12, badge_y2), color, -1)
        cv2.putText(
            annotated, label, (x1 + 6, y1 - 5),
            font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA
        )

    return annotated
