import os
from pathlib import Path
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class PlainBorderCanvas(canvas.Canvas):
    """Draws a clean, plain border around every page (no header/footer banners)."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self.pages)
        for page in self.pages:
            self.__dict__.update(page)
            self.draw_plain_border(num_pages)
            super().showPage()
        super().save()

    def draw_plain_border(self, total_pages):
        self.saveState()
        self.setStrokeColor(colors.HexColor("#334155"))  # Slate border
        self.setLineWidth(1.5)
        # Plain document border (24 points margin)
        self.rect(24, 24, letter[0] - 48, letter[1] - 48)

        # Subtle page number at bottom right inside the border
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawRightString(letter[0] - 36, 32, f"Page {self._pageNumber} of {total_pages}")
        self.drawString(36, 32, "StreetLens — Automated Road Condition Assessment")
        self.restoreState()


def generate_pdf_report(
    output_pdf_path: str,
    session_id: str,
    annotated_image_path: str,
    ranked_defects: list,
    summary: dict,
    metadata: dict
):
    """
    Generates a clean, professional PDF review report with a plain border,
    embedded anomaly picture, and ranked defects breakdown.
    """
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#0f172a"),
        alignment=0,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )

    story = []

    # 1. Clean Title (No college header, plain title)
    story.append(Paragraph("STREETLENS: ROAD CONDITION & DEFECT ASSESSMENT REPORT", title_style))
    
    gps_str = f"Lat: {metadata.get('latitude', 'N/A')}, Lon: {metadata.get('longitude', 'N/A')}" if metadata.get("latitude") else "GPS: Not Available"
    created_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    meta_sub = f"Session ID: {session_id} | Date: {created_at} | Coordinates: {gps_str}"
    story.append(Paragraph(meta_sub, subtitle_style))
    story.append(Spacer(1, 4))

    # 2. Executive Condition Summary Cards (Table)
    cond_color = "#16a34a"  # Green
    if summary["road_condition"] == "CRITICAL":
        cond_color = "#dc2626"
    elif summary["road_condition"] == "POOR":
        cond_color = "#ea580c"
    elif summary["road_condition"] == "FAIR":
        cond_color = "#ca8a04"

    summary_data = [
        [
            Paragraph("<b>Overall Road Condition</b>", body_style),
            Paragraph(f"<font color='{cond_color}'><b>{summary['road_condition']}</b></font>", body_style),
            Paragraph("<b>Total Anomalies</b>", body_style),
            Paragraph(str(summary["total_defects"]), body_style),
        ],
        [
            Paragraph("<b>Damage Density</b>", body_style),
            Paragraph(f"{summary['damage_density_pct']}%", body_style),
            Paragraph("<b>Repair Priority Index</b>", body_style),
            Paragraph(f"Priority {summary['repair_priority']} / 5", body_style),
        ],
        [
            Paragraph("<b>2-Wheeler Risk</b>", body_style),
            Paragraph(f"{summary['user_risks']['two_wheeler']}%", body_style),
            Paragraph("<b>4-Wheeler Risk</b>", body_style),
            Paragraph(f"{summary['user_risks']['four_wheeler']}%", body_style),
        ]
    ]

    summary_table = Table(summary_data, colWidths=[120, 140, 130, 150])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # 3. Embedded Picture of the Road Anomaly (With Bokeh Spotlight)
    if os.path.exists(annotated_image_path):
        story.append(Paragraph("VISUAL INSPECTION EVIDENCE (DETECTED ANOMALIES HIGHLIGHTED)", section_heading))
        # Letter width is 612, margins 36*2=72, available width = 540
        img_w = 540
        img_h = 240
        story.append(RLImage(annotated_image_path, width=img_w, height=img_h))
        story.append(Spacer(1, 8))

    # 4. Ranked Anomaly Ledger Table
    story.append(Paragraph("RANKED ROAD ANOMALIES BREAKDOWN", section_heading))
    
    if not ranked_defects:
        story.append(Paragraph("<i>No road defects or structural anomalies were detected. Surface condition is sound.</i>", body_style))
    else:
        table_headers = [
            Paragraph("<b>Rank</b>", body_style),
            Paragraph("<b>Anomaly Class</b>", body_style),
            Paragraph("<b>Severity</b>", body_style),
            Paragraph("<b>Confidence</b>", body_style),
            Paragraph("<b>Dimensions (px)</b>", body_style),
            Paragraph("<b>Waterlogged</b>", body_style)
        ]
        
        defect_rows = [table_headers]
        for d in ranked_defects[:10]:  # Up to top 10 ranked defects
            sev = d["severity"]
            s_color = "#dc2626" if sev == "HIGH" else ("#ea580c" if sev == "MEDIUM" else "#16a34a")
            water_tag = "YES (High Hazard)" if d["is_waterlogged"] else "Dry"

            defect_rows.append([
                Paragraph(f"<b>#{d['rank']}</b>", body_style),
                Paragraph(d["class"], body_style),
                Paragraph(f"<font color='{s_color}'><b>{sev}</b></font>", body_style),
                Paragraph(f"{int(d['confidence'] * 100)}%", body_style),
                Paragraph(f"{d['dimensions_px'][0]} x {d['dimensions_px'][1]}", body_style),
                Paragraph(water_tag, body_style)
            ])

        defect_table = Table(defect_rows, colWidths=[40, 130, 80, 80, 100, 110])
        defect_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(defect_table)

    # Build PDF with plain border canvas
    doc.build(story, canvasmaker=PlainBorderCanvas)
    return output_pdf_path
