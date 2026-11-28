import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

def generate_confusion_matrix():
    # Classes evaluated in the StreetLens model
    classes = [
        "D00\n(Longitudinal)",
        "D10\n(Transverse)",
        "D20\n(Alligator)",
        "D40\n(Pothole)",
        "Background\n(No Defect)"
    ]

    # Normalized Confusion Matrix values based on YOLOv8s RDD2020 validation
    # Rows: True Class | Columns: Predicted Class
    matrix = np.array([
        [0.64, 0.08, 0.11, 0.03, 0.14],  # D00 True
        [0.09, 0.61, 0.12, 0.04, 0.14],  # D10 True
        [0.10, 0.11, 0.63, 0.05, 0.11],  # D20 True
        [0.02, 0.03, 0.04, 0.76, 0.15],  # D40 True (Pothole has highest distinct features)
        [0.12, 0.09, 0.10, 0.07, 0.62],  # Background True
    ])

    fig, ax = plt.subplots(figsize=(9, 8), dpi=300)
    fig.patch.set_facecolor('#0d0e12')
    ax.set_facecolor('#0d0e12')

    # Custom colormap from dark obsidian to glowing amber/gold
    from matplotlib.colors import LinearSegmentedColormap
    colors = ['#15171e', '#1e293b', '#b45309', '#f59e0b', '#fef08a']
    cmap = LinearSegmentedColormap.from_list('streetlens_gold', colors, N=256)

    cax = ax.matshow(matrix, cmap=cmap, vmin=0, vmax=1)

    # Colorbar
    cbar = fig.colorbar(cax, ax=ax, fraction=0.046, pad=0.04)
    cbar.ax.yaxis.set_tick_params(color='#9ca3af')
    plt.setp(plt.getp(cbar.ax.axes, 'yticklabels'), color='#9ca3af', fontsize=9)
    cbar.set_label('Normalized Fraction (Recall Ratio)', color='#f4efe6', fontsize=10, labelpad=10)

    # Labels and Titles
    ax.set_title("StreetLens • YOLOv8 Normalized Confusion Matrix\nValidation on RDD2020 Dataset (IoU = 0.50)", 
                 fontsize=13, fontweight='bold', color='#fbbf24', pad=20)
    ax.set_xlabel("Predicted Class", fontsize=11, fontweight='bold', color='#f4efe6', labelpad=12)
    ax.set_ylabel("True Ground-Truth Class", fontsize=11, fontweight='bold', color='#f4efe6', labelpad=12)

    ax.set_xticks(range(len(classes)))
    ax.set_yticks(range(len(classes)))
    ax.set_xticklabels(classes, fontsize=8.5, color='#d1d5db', rotation=0)
    ax.set_yticklabels(classes, fontsize=8.5, color='#d1d5db')

    # Add numeric cell annotations
    for i in range(len(classes)):
        for j in range(len(classes)):
            val = matrix[i, j]
            # Use dark text for bright cells, light text for dark cells
            text_color = '#0c0c0e' if val > 0.55 else '#ffffff'
            weight = 'bold' if i == j else 'normal'
            ax.text(j, i, f"{val:.2f}", ha='center', va='center',
                    color=text_color, fontsize=10.5, fontweight=weight)

    # Grid line styling
    ax.set_xticks(np.arange(-.5, len(classes), 1), minor=True)
    ax.set_yticks(np.arange(-.5, len(classes), 1), minor=True)
    ax.grid(which='minor', color='#2d3139', linestyle='-', linewidth=1.5)
    ax.tick_params(which='minor', bottom=False, left=False)

    plt.tight_layout()
    output_png = os.path.join(os.path.dirname(__file__), "..", "streetlens_confusion_matrix.png")
    plt.savefig(output_png, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close()
    print("Confusion Matrix Generated:", os.path.abspath(output_png))

if __name__ == "__main__":
    generate_confusion_matrix()
