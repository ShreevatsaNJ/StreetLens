import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

def draw_flowchart():
    fig, ax = plt.subplots(figsize=(14, 18), dpi=300)
    ax.set_facecolor('#0d0e12')
    fig.patch.set_facecolor('#0d0e12')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 130)
    ax.axis('off')

    # Styling constants
    BOX_BG = '#15171e'
    BOX_BORDER = '#2d3139'
    TEXT_MAIN = '#f4efe6'
    TEXT_MUTED = '#9ca3af'
    ARROW_COLOR = '#6b7280'

    # Title
    ax.text(50, 126, "STREETLENS • SYSTEM ENGINEERING FLOWCHART", 
            ha='center', va='center', fontsize=18, fontweight='bold', color='#fbbf24', fontfamily='sans-serif')
    ax.text(50, 123.5, "Autonomous AI Road Surface Inspection & Hazard Assessment Pipeline", 
            ha='center', va='center', fontsize=11, color='#9ca3af', fontfamily='sans-serif')

    def draw_box(x, y, w, h, text, subtext="", bg=BOX_BG, border=BOX_BORDER, radius=1.5, text_color=TEXT_MAIN):
        rect = patches.FancyBboxPatch(
            (x - w/2, y - h/2), w, h,
            boxstyle=f"round,pad={radius},rounding_size=2",
            facecolor=bg, edgecolor=border, linewidth=1.5, zorder=2
        )
        ax.add_patch(rect)
        if subtext:
            ax.text(x, y + 1.2, text, ha='center', va='center', fontsize=9.5, fontweight='bold', color=text_color, zorder=3)
            ax.text(x, y - 1.4, subtext, ha='center', va='center', fontsize=8, color=TEXT_MUTED, zorder=3)
        else:
            ax.text(x, y, text, ha='center', va='center', fontsize=9.5, fontweight='bold', color=text_color, zorder=3)

    def draw_diamond(x, y, w, h, text, subtext="", bg='#1e1f28', border='#f59e0b'):
        pts = [[x, y + h/2], [x + w/2, y], [x, y - h/2], [x - w/2, y]]
        diamond = patches.Polygon(pts, closed=True, facecolor=bg, edgecolor=border, linewidth=1.8, zorder=2)
        ax.add_patch(diamond)
        if subtext:
            ax.text(x, y + 0.9, text, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#fbbf24', zorder=3)
            ax.text(x, y - 1.1, subtext, ha='center', va='center', fontsize=7.5, color='#d1d5db', zorder=3)
        else:
            ax.text(x, y, text, ha='center', va='center', fontsize=8.5, fontweight='bold', color='#fbbf24', zorder=3)

    def draw_arrow(x1, y1, x2, y2, label=""):
        ax.annotate(
            "", xy=(x2, y2), xytext=(x1, y1),
            arrowprops=dict(arrowstyle="->", color=ARROW_COLOR, lw=1.5, shrinkA=3, shrinkB=3),
            zorder=1
        )
        if label:
            mx, my = (x1 + x2)/2, (y1 + y2)/2
            ax.text(mx + 1.5, my, label, fontsize=8, fontweight='bold', color='#fbbf24', zorder=4)

    # 1. Start Node
    draw_box(50, 118, 18, 4, "● START", bg='#064e3b', border='#10b981', text_color='#6ee7b7')
    
    # 2. Input Media
    draw_arrow(50, 116, 50, 111)
    draw_box(50, 109, 44, 4.5, "Input Road Media Ingestion", "Upload MP4 Dashcam Video / JPG Photo / Live Camera Feed", border='#4b5563')

    # 3. Decision: Video or Image?
    draw_arrow(50, 106.7, 50, 102)
    draw_diamond(50, 99.5, 24, 6, "Media Type?", "Is Video or Live Camera?")

    # Left: Image path
    draw_arrow(38, 99.5, 24, 99.5, "No")
    draw_arrow(24, 99.5, 24, 92)
    draw_box(24, 90, 24, 4.5, "Single Frame Ingestion", "Pillow (PIL) Image Normalization", border='#3b82f6')

    # Right: Video path
    draw_arrow(62, 99.5, 76, 99.5, "Yes")
    draw_arrow(76, 99.5, 76, 92)
    draw_box(76, 90, 24, 4.5, "OpenCV Video Keyframing", "Extracts frames at 1-2 FPS rate", border='#3b82f6')

    # Merge to GPS extraction
    draw_arrow(24, 87.7, 42, 82)
    draw_arrow(76, 87.7, 58, 82)
    draw_diamond(50, 80.5, 22, 5.5, "EXIF GPS Found?", "Latitude / Longitude Check")

    draw_arrow(50, 77.7, 50, 72.5)
    draw_box(50, 70.5, 46, 4.5, "Telemetry Resolution & Metadata", "Extracts GPS coordinates or assigns fleet route metadata", border='#374151')

    # 4. YOLOv8 Deep Learning Inference
    draw_arrow(50, 68.2, 50, 63.5)
    draw_box(50, 61, 52, 5.5, "YOLOv8s Neural Model Inference", "Trained on RDD2020: D00, D10, D20 Cracks & D40 Potholes", bg='#1e1b4b', border='#818cf8', text_color='#c7d2fe')

    # 5. Defect Decision
    draw_arrow(50, 58.2, 50, 54)
    draw_diamond(50, 51, 24, 6, "Defects Detected?", "Confidence >= Threshold")

    # No Defects: Healthy Road Branch
    draw_arrow(62, 51, 84, 51, "No")
    draw_arrow(84, 51, 84, 25)
    draw_box(84, 23, 26, 4.5, "Road Condition: 100% Good", "Zero damage detected (Grade A)", bg='#064e3b', border='#10b981', text_color='#a7f3d0')

    # Yes Defects: Processing Pipeline
    draw_arrow(50, 48, 50, 43.5, "Yes")
    draw_box(50, 41, 46, 5, "Non-Maximum Suppression (NMS) & Filter", "Eliminates duplicate overlapping bounding boxes", border='#374151')

    # 6. Computer Vision & Optics
    draw_arrow(50, 38.5, 50, 34)
    draw_box(50, 31.5, 48, 5.5, "Optical Gaussian Bokeh Spotlight", "Gaussian blur (k=21) on healthy asphalt • Sharp anomaly focus", bg='#1c1917', border='#f59e0b', text_color='#fef08a')

    # 7. Waterlogged Cavity Detection
    draw_arrow(50, 28.7, 50, 24.5)
    draw_diamond(50, 21.5, 24, 6, "Waterlogged Cavity?", "HSV Reflective Mask Check")

    # Hydroplaning Alert
    draw_arrow(38, 21.5, 20, 21.5, "Yes")
    draw_box(20, 21.5, 22, 4.5, "Flag Hydroplaning Alert", "Elevates 2-Wheeler Risk Index", bg='#082f49', border='#38bdf8', text_color='#bae6fd')

    # Civil Metrics Calculation
    draw_arrow(50, 18.5, 50, 14, "No / Done")
    draw_arrow(20, 19.2, 35, 14)
    draw_box(50, 11.5, 56, 5.5, "Civil Analytics & Road Health Rating", "Road Health Score (0-100%) • Tri-Modal Commuter Risk • Maintenance Plan", bg='#1e293b', border='#64748b', text_color='#f1f5f9')

    # Database & UI
    draw_arrow(50, 8.7, 50, 4.5)
    draw_arrow(84, 20.7, 72, 4.5)
    draw_box(50, 2, 50, 4.5, "Render UI Dashboard & Log SQLite Database", "Before/After Slider • Live HUD • ReportLab PDF Export", bg='#022c22', border='#10b981', text_color='#6ee7b7')

    plt.tight_layout()
    output_png = os.path.join(os.path.dirname(__file__), "..", "streetlens_flowchart.png")
    plt.savefig(output_png, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close()
    print("Flowchart Image Generated:", os.path.abspath(output_png))

if __name__ == "__main__":
    draw_flowchart()
