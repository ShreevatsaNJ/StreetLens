import cv2
import numpy as np

def enhance_image(image: np.ndarray) -> np.ndarray:
    """
    Performs visual pre-processing on road media:
    1. Edge-preserving Denoising (Bilateral filtering)
    2. Adaptive Contrast Equalization (CLAHE on L-channel in LAB space)
    3. Low-Light Gamma Correction (if underexposed)
    """
    # 1. Bilateral filtering for edge-preserving asphalt smoothing
    denoised = cv2.bilateralFilter(image, d=7, sigmaColor=50, sigmaSpace=50)

    # 2. Contrast Limited Adaptive Histogram Equalization (CLAHE) on Luminance channel
    lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    
    clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(8, 8))
    enhanced_l = clahe.apply(l_channel)
    
    enhanced_lab = cv2.merge((enhanced_l, a_channel, b_channel))
    enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    # 3. Dynamic Gamma adjustment if scene is dark
    mean_val = np.mean(enhanced_l)
    if mean_val < 85:
        # Underexposed: apply gamma brightening (gamma = 0.75)
        inv_gamma = 1.0 / 0.75
        table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
        enhanced_bgr = cv2.LUT(enhanced_bgr, table)

    return enhanced_bgr
