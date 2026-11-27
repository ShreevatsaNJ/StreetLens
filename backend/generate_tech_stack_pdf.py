import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_tech_stack_pdf():
    output_path = os.path.join(os.path.dirname(__file__), "..", "StreetLens_Tech_Stack.pdf")
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0c0c0e')
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#6b7280')
    )

    category_style = ParagraphStyle(
        'CategoryTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#1f2937'),
        spaceBefore=8,
        spaceAfter=4
    )

    tech_name_style = ParagraphStyle(
        'TechName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#111827')
    )

    tech_def_style = ParagraphStyle(
        'TechDef',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#374151')
    )

    story = []

    # Title & Subtitle Header
    story.append(Paragraph("StreetLens • Complete Technology Stack", title_style))
    story.append(Spacer(1, 2))
    story.append(Paragraph("Autonomous AI Road Surface Inspection & Hazard Assessment • Quick Reference & Viva Guide", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#d97706'), spaceBefore=2, spaceAfter=8))

    sections = [
        (
            "1. Frontend Technologies (User Interface & Experience)",
            [
                ("React 18", "Component-based JavaScript library used to build the responsive, single-page interactive UI and audit dashboards."),
                ("Vite", "Modern, lightning-fast frontend build tool and local development server with instant Hot Module Replacement (HMR)."),
                ("Tailwind CSS", "Utility-first CSS framework for crafting high-density dark mode styling, custom gradients, and responsive layouts."),
                ("Lucide React", "Clean, modern SVG icon library providing intuitive visual indicators for telemetry, safety metrics, and navigation."),
                ("Recharts", "Declarative, React-native charting library used to render interactive bar charts and risk distribution curves on the analytics dashboard."),
                ("HTML5 Canvas API", "Native browser graphics API used to render the interactive neural network particle background and real-time dashcam reticle overlays.")
            ]
        ),
        (
            "2. Backend & API Services",
            [
                ("Python 3.10+", "Core programming language powering the machine learning pipeline, image processing algorithms, and REST microservices."),
                ("Flask", "Lightweight Python WSGI web microframework used to build REST API endpoints for media ingestion, AI inference, and report delivery."),
                ("Flask-CORS", "Flask middleware extension that enables secure Cross-Origin Resource Sharing between the Vite frontend and Flask backend."),
                ("Gunicorn / Waitress", "Production-grade WSGI HTTP server used to handle concurrent client requests with low overhead and reliable process management.")
            ]
        ),
        (
            "3. Artificial Intelligence & Deep Learning",
            [
                ("YOLOv8s (Ultralytics)", "State-of-the-art single-stage convolutional neural network model fine-tuned for high-speed, sub-100ms road defect detection."),
                ("PyTorch", "Open-source deep learning tensor framework that executes neural network matrix multiplications and GPU/CPU inference routines."),
                ("RDD2020 Dataset", "Global road damage detection benchmark dataset used to train the model to recognize longitudinal cracks, transverse cracks, alligator cracks, and potholes.")
            ]
        ),
        (
            "4. Computer Vision, Optics & Hazard Detection",
            [
                ("OpenCV (cv2)", "Industry-standard open-source computer vision library used for video frame extraction, color space manipulation, and pixel operations."),
                ("Gaussian Bokeh Spotlight", "Custom optical algorithm that applies a Gaussian blur kernel to healthy asphalt while isolating defects in tack-sharp focus to eliminate inspector visual fatigue."),
                ("HSV Color Segmentation", "Adaptive computer vision algorithm that isolates dark reflective specular areas inside potholes to detect waterlogging and alert for hydroplaning."),
                ("Pillow (PIL)", "Python imaging library used for image format conversions, EXIF GPS coordinate extraction, and high-quality image resizing.")
            ]
        ),
        (
            "5. Civil Engineering Analytics & Risk Modeling",
            [
                ("Road Health Score Algorithm", "Transparent 0–100% road surface quality index calculated from defect density percentage and weighted severity counts."),
                ("Tri-Modal Commuter Vulnerability", "Risk assessment model computing differentiated safety impact scores separately for Two-Wheelers, Four-Wheelers, and Pedestrians."),
                ("Automated Maintenance Recommender", "Expert-rules engine mapping detected defect patterns into actionable civic interventions (e.g., Pothole Patching, Crack Sealing, Shoulder Drainage).")
            ]
        ),
        (
            "6. Database & Persistent Storage",
            [
                ("SQLite", "Serverless, zero-configuration SQL database engine used to persistently log all inspection sessions, defect dimensions, GPS coordinates, and road ratings."),
                ("SQLAlchemy / Python DB-API", "Database abstraction layer used to execute structured queries and retrieve historical inspection records for the municipal audit ledger.")
            ]
        ),
        (
            "7. Reporting, Documentation & DevOps",
            [
                ("ReportLab", "Enterprise-grade Python PDF generation engine used to programmatically assemble multi-page municipal engineering audit dossiers with embedded photos and tables."),
                ("CSV Data Serialization", "Built-in data export pipeline that formats raw defect coordinates, bounding dimensions, and confidence scores for direct municipal GIS software import."),
                ("Git & GitHub", "Distributed version control system and cloud repository hosting platform used for source code tracking, collaboration, and backup.")
            ]
        )
    ]

    for title, rows in sections:
        story.append(Paragraph(title, category_style))
        table_data = []
        for tech, desc in rows:
            table_data.append([
                Paragraph(tech, tech_name_style),
                Paragraph(desc, tech_def_style)
            ])

        t = Table(table_data, colWidths=[150, 390])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fcfcfd')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        story.append(t)
        story.append(Spacer(1, 5))

    doc.build(story)
    print("Generated:", os.path.abspath(output_path))

if __name__ == "__main__":
    generate_tech_stack_pdf()
