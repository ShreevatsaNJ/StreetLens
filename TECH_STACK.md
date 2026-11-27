# StreetLens • Complete Technology Stack & One-Line Definitions

A quick, comprehensive viva and presentation cheat sheet explaining every technology, framework, library, and algorithm powering **StreetLens: Autonomous AI Road Surface Inspection & Hazard Assessment System**.

---

## 1. Frontend Technologies (User Interface & Experience)

| Technology | One-Line Definition / Role |
| :--- | :--- |
| **React 18** | A component-based JavaScript library used to build the responsive, single-page interactive user interface and dashboards. |
| **Vite** | A modern, lightning-fast frontend build tool and local development server with instant Hot Module Replacement (HMR). |
| **Tailwind CSS** | A utility-first CSS framework used for crafting high-density dark mode styling, custom gradients, and responsive layouts without bloated CSS files. |
| **Lucide React** | A clean, modern SVG icon library providing intuitive visual indicators for telemetry, safety metrics, and navigation controls. |
| **Recharts** | A declarative, React-native charting library used to render interactive bar charts and risk distribution curves on the analytics dashboard. |
| **HTML5 Canvas API** | A native browser graphics API used to render the interactive neural network particle background and real-time dashcam reticle overlays. |

---

## 2. Backend & API Services

| Technology | One-Line Definition / Role |
| :--- | :--- |
| **Python 3.10+** | The core programming language powering the backend machine learning pipeline, image processing algorithms, and REST microservices. |
| **Flask** | A lightweight Python WSGI web microframework used to build the REST API endpoints for media ingestion, AI inference, and report delivery. |
| **Flask-CORS** | A Flask middleware extension that enables secure Cross-Origin Resource Sharing between the Vite frontend and Flask backend. |
| **Gunicorn / Waitress** | A production-grade WSGI HTTP server used to handle concurrent client requests with low overhead and reliable process management. |

---

## 3. Artificial Intelligence & Deep Learning

| Technology | One-Line Definition / Role |
| :--- | :--- |
| **YOLOv8s (Ultralytics)** | A state-of-the-art single-stage convolutional neural network model fine-tuned for high-speed, sub-100ms road defect detection. |
| **PyTorch** | An open-source deep learning tensor framework that executes neural network matrix multiplications and GPU/CPU inference routines. |
| **RDD2020 Dataset** | A global road damage detection benchmark dataset used to train the model to recognize longitudinal cracks, transverse cracks, alligator cracks, and potholes. |

---

## 4. Computer Vision, Optics & Hazard Detection

| Technology | One-Line Definition / Role |
| :--- | :--- |
| **OpenCV (cv2)** | The industry-standard open-source computer vision library used for video frame extraction, color space manipulation, and pixel operations. |
| **Gaussian Bokeh Spotlight** | A custom optical algorithm that applies a Gaussian blur kernel to healthy asphalt while isolating defects in tack-sharp focus to eliminate inspector visual fatigue. |
| **HSV Color Segmentation** | An adaptive computer vision algorithm that isolates dark reflective specular areas inside potholes to detect waterlogging and alert for hydroplaning. |
| **Pillow (PIL)** | A Python imaging library used for image file format conversions, EXIF GPS coordinate extraction, and high-quality image resizing. |

---

## 5. Civil Engineering Analytics & Risk Modeling

| Technology | One-Line Definition / Role |
| :--- | :--- |
| **Road Health Score Algorithm** | A transparent 0–100% road surface quality index calculated from defect density percentage and weighted severity counts. |
| **Tri-Modal Commuter Vulnerability Engine** | A risk assessment model that computes differentiated safety impact scores separately for Two-Wheelers, Four-Wheelers, and Pedestrians. |
| **Automated Maintenance Recommender** | An expert-rules engine that maps detected defect patterns into actionable civic interventions (e.g., Pothole Cold-Patching, Crack Bitumen Sealing, Shoulder Drainage Clearance). |

---

## 6. Database & Persistent Storage

| Technology | One-Line Definition / Role |
| :--- | :--- |
| **SQLite** | A serverless, zero-configuration SQL database engine used to persistently log all inspection sessions, defect dimensions, GPS coordinates, and road ratings. |
| **SQLAlchemy / Python DB-API** | A robust database abstraction layer used to execute structured queries and retrieve historical inspection records for the municipal audit ledger. |

---

## 7. Reporting & Documentation Export

| Technology | One-Line Definition / Role |
| :--- | :--- |
| **ReportLab** | An enterprise-grade Python PDF generation engine used to programmatically assemble multi-page municipal engineering audit dossiers complete with spotlight defect photos and tables. |
| **CSV Data Serialization** | A built-in data export pipeline that formats raw defect coordinates, bounding dimensions, and confidence scores for direct import into municipal GIS software. |

---

## 8. Version Control & Development Environment

| Technology | One-Line Definition / Role |
| :--- | :--- |
| **Git** | A distributed version control system used to track code revisions, manage branches, and ensure reproducible project builds. |
| **GitHub** | A cloud-based repository hosting platform used for source code backup, remote deployment, and project showcase. |
