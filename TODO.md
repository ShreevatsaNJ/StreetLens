# StreetLens — Feature TODO List
### Urban Road Safety and Condition Assessment Using Computer Vision
**Course:** Mini Project (24CDS57) | **Dept:** CSE (Data Science), NHCE  
**Team:** Shreevatsa N J & Pavan R M | **Guide:** Prof. Swathi Vinesh

---

## 1. Media Upload & Ingestion
- [ ] Drag-and-drop file upload for road images (`.jpg`, `.png`) and videos (`.mp4`, `.avi`)
- [ ] Instant client-side media preview
- [ ] Secure file ingestion API (`POST /api/upload`) with file validation
- [ ] Automatic EXIF GPS metadata extractor (captures latitude, longitude, and timestamp)
- [ ] Manual location input fallback if GPS is not available in media

## 2. Preprocessing & Visual Enhancement
- [ ] **Noise Reduction:** Fast Non-Local Means / Bilateral denoising for asphalt texture
- [ ] **Contrast Enhancement:** CLAHE (Contrast Limited Adaptive Histogram Equalization)
- [ ] **Low-Light Boost:** Gamma correction for night and shadow visibility
- [ ] **Bokeh Spotlight Focus:** Softly blurs background while keeping anomalies in sharp focus
- [ ] Interactive Before vs. After comparison slider

## 3. Road Region (ROI) & Video Processing
- [ ] Road surface extraction (masks out sky, horizon, sidewalks, and buildings)
- [ ] Video frame extraction at a fixed sampling rate (1 frame/sec)
- [ ] Video timestamp tagging for all extracted frames
- [ ] Spatial frame deduplication (prevents double-counting the same defect across adjacent frames)

## 4. AI Road Defect Detection (YOLO)
- [ ] Ultralytics YOLOv8 / YOLOv11 model integration with PyTorch
- [ ] Multi-class road damage detection:
  - [ ] Potholes
  - [ ] Longitudinal Cracks
  - [ ] Transverse Cracks
  - [ ] Alligator (Fatigue) Cracks
- [ ] Visual bounding box annotator with class tags and confidence scores

## 5. Flowchart Decision Gate (Damage Detected?)
- [ ] **If No Damage:** Assign Road Condition as **"Good"** and route directly to clean report & dashboard
- [ ] **If Damage Detected:** Route detections into severity assessment and risk analytics

## 6. Defect Severity Assessment
- [ ] Relative defect area calculation (defect size vs. total road surface)
- [ ] Hazard weighting per defect type (e.g., Potholes > Cracks)
- [ ] Severity tier classification:
  - [ ] **Low Severity** (Green)
  - [ ] **Medium Severity** (Yellow)
  - [ ] **High Severity** (Red)

## 7. Road Condition & User Risk Analytics
- [ ] Defect counts and category distribution breakdown
- [ ] **Damage Density %** (total defect area vs. drivable road area)
- [ ] **Overall Road Condition Index:** Good, Fair, Poor, or Critical
- [ ] **Road-User Specific Risk Scores (0–100):**
  - [ ] Two-Wheeler Risk (sensitive to potholes and longitudinal cracks)
  - [ ] Four-Wheeler Risk (sensitive to deep potholes and structural fatigue)
  - [ ] Pedestrian Risk (trip hazards near shoulders and crosswalks)
- [ ] **Repair Priority Index (RPI):** Priority rating from 1 (routine) to 5 (immediate emergency)

## 8. GPS Location Mapping
- [ ] Interactive OpenStreetMap view using Leaflet
- [ ] Color-coded location pins based on road condition (Green = Good, Yellow = Moderate, Red = Dangerous)
- [ ] Clickable marker popups showing defect count and severity summary

## 9. Report Generation & Export
- [ ] Structured **CSV export** containing granular defect coordinates and timestamps
- [ ] Downloadable **PDF Inspection Report** via ReportLab:
  - [ ] Minimalist layout with clean plain border (no header banners)
  - [ ] Media metadata, capture timestamp, and GPS coordinates
  - [ ] Embedded full-color picture of road anomalies (with bokeh spotlight & rank badges)
  - [ ] Ranked defect breakdown table (#1 to #N with dimensions & confidence)
  - [ ] Road-user safety risk ratings (Two-Wheeler, Four-Wheeler, Pedestrian)

## 10. Interactive Web Dashboard
- [ ] Summary KPI cards (Total Defects, Road Status Badge, Damage Density %, Repair Priority)
- [ ] Category distribution bar chart (Recharts)
- [ ] Severity breakdown pie chart
- [ ] Road-user risk comparison radar/bar chart
- [ ] Video timeline scrubber with clickable defect marker timestamps
- [ ] Past inspections history log (connected to PostgreSQL / database)
