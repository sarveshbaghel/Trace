"""
Forensic Image Analysis Module for TruFor Service
Provides high-frequency sensor noise footprint analysis, Error Level Analysis (ELA),
and localized manipulation detection to detect AI-generated and tampered civic reports.
"""

import os
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance


def compute_noise_residual(img_rgb: np.ndarray) -> np.ndarray:
    """
    Extracts high-frequency sensor noise residual (simulating PRNU / Noiseprint).
    In real camera captures, sensor noise is spatially homogeneous.
    In AI-generated or spliced images, high-frequency residuals vary unnaturally.
    """
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    # Estimate denoised base using fast bilateral or median filter
    denoised = cv2.bilateralFilter(gray, d=7, sigmaColor=35, sigmaSpace=35)
    # Residual noise = original - denoised
    residual = np.abs(gray - denoised)
    # Local variance of the residual over 15x15 sliding window
    mean = cv2.blur(residual, (15, 15))
    mean_sq = cv2.blur(residual ** 2, (15, 15))
    local_var = np.maximum(0, mean_sq - (mean ** 2))
    norm_var = cv2.normalize(local_var, None, alpha=0.0, beta=1.0, norm_type=cv2.NORM_MINMAX)
    return norm_var


def compute_ela(img_rgb: np.ndarray, quality: int = 90) -> np.ndarray:
    """
    Error Level Analysis (ELA):
    Recompresses image as JPEG at specified quality and checks difference.
    Tampered/spliced and synthetic regions have different error rates.
    """
    pil_img = Image.fromarray(img_rgb)
    import io
    buffer = io.BytesIO()
    pil_img.save(buffer, format='JPEG', quality=quality)
    buffer.seek(0)
    recompressed = Image.open(buffer)

    diff = ImageChops.difference(pil_img, recompressed)
    diff_arr = np.array(diff).astype(np.float32)
    diff_gray = cv2.cvtColor(diff_arr, cv2.COLOR_RGB2GRAY) if len(diff_arr.shape) == 3 else diff_arr

    # Scale difference for visibility and normalize to [0, 1]
    enhanced = diff_gray * 8.0
    norm_ela = np.clip(enhanced / 255.0, 0.0, 1.0)
    return norm_ela


def compute_ai_diffusion_artifacts(img_rgb: np.ndarray) -> float:
    """
    Checks for telltale artifacts of diffusion / GAN synthesis:
    - Over-smooth local texture with abrupt frequency boundaries
    - Frequency domain power spectrum anomalies
    """
    gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
    
    # 1. Laplacian gradient variance
    lap = cv2.Laplacian(gray, cv2.CV_64F)
    lap_var = lap.var()

    # 2. 2D FFT spectral decay
    f = np.fft.fft2(gray.astype(np.float32))
    fshift = np.fft.fftshift(f)
    magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-6)
    
    h, w = gray.shape
    center_y, center_x = h // 2, w // 2
    r_inner = min(h, w) // 8
    r_outer = min(h, w) // 3

    y, x = np.ogrid[:h, :w]
    dist_from_center = np.sqrt((x - center_x) ** 2 + (y - center_y) ** 2)

    mid_freq_mask = (dist_from_center >= r_inner) & (dist_from_center <= r_outer)
    mid_freq_energy = np.mean(magnitude_spectrum[mid_freq_mask]) if np.any(mid_freq_mask) else 0.0

    # Synthetic images often have either anomalously flat high frequencies or checkerboard peaks
    ai_prob = 0.05
    if lap_var < 70.0:
        ai_prob += 0.25
    elif lap_var > 1500.0:
        ai_prob += 0.20

    if mid_freq_energy < 50.0:
        ai_prob += 0.20
    
    return float(np.clip(ai_prob, 0.02, 0.95))


def run_forensic_pipeline(img_rgb: np.ndarray):
    """
    Runs combined forensic analysis and computes pixel anomaly heatmap and scores.
    """
    h, w = img_rgb.shape[:2]

    # Resize internally if very large to prevent memory overhead, then scale back
    max_dim = 1024
    if max(h, w) > max_dim:
        scale = max_dim / float(max(h, w))
        target_w = int(w * scale)
        target_h = int(h * scale)
        proc_img = cv2.resize(img_rgb, (target_w, target_h), interpolation=cv2.INTER_AREA)
    else:
        proc_img = img_rgb

    noise_res = compute_noise_residual(proc_img)
    ela_map = compute_ela(proc_img)
    ai_prob_metric = compute_ai_diffusion_artifacts(proc_img)

    # Fusion of noise residual anomaly + ELA anomaly
    # Areas with sudden divergence in noise floor or ELA levels flag manipulation
    noise_anomaly = np.abs(noise_res - np.median(noise_res))
    noise_anomaly = cv2.normalize(noise_anomaly, None, 0.0, 1.0, cv2.NORM_MINMAX)

    ela_anomaly = np.abs(ela_map - np.median(ela_map))
    ela_anomaly = cv2.normalize(ela_anomaly, None, 0.0, 1.0, cv2.NORM_MINMAX)

    combined_map = 0.6 * noise_anomaly + 0.4 * ela_anomaly
    # Smooth slightly to form cohesive localized regions
    combined_map = cv2.GaussianBlur(combined_map, (11, 11), 3)
    combined_map = np.clip(combined_map, 0.0, 1.0)

    # Upscale back to original dimensions if resized
    if combined_map.shape[:2] != (h, w):
        combined_map = cv2.resize(combined_map, (w, h), interpolation=cv2.INTER_LINEAR)

    # Calculate statistics
    # Threshold for anomaly pixels
    tampered_pixels = np.sum(combined_map > 0.45)
    total_pixels = h * w
    tamper_ratio = float(tampered_pixels / total_pixels)
    mean_val = float(np.mean(combined_map))
    max_val = float(np.max(combined_map))
    p95_val = float(np.percentile(combined_map, 95))

    # Calculate manipulation score (0.0 to 1.0)
    # Natural photos typically have mean_val around 0.15 - 0.25 and tamper_ratio < 0.05
    manipulation_score = float(np.clip((p95_val * 0.5) + (tamper_ratio * 1.5) + (ai_prob_metric * 0.3), 0.02, 0.98))
    authenticity_score = float(np.round(1.0 - manipulation_score, 4))
    ai_generated_probability = float(np.round(np.clip(ai_prob_metric + (tamper_ratio * 0.5), 0.01, 0.96), 4))

    if manipulation_score >= 0.65 or ai_generated_probability >= 0.70:
        verdict = "FAKE"
    elif manipulation_score >= 0.35:
        verdict = "SUSPICIOUS"
    else:
        verdict = "AUTHENTIC"

    return {
        "anomaly_map": combined_map,
        "authenticity_score": authenticity_score,
        "manipulation_score": float(np.round(manipulation_score, 4)),
        "ai_generated_probability": ai_generated_probability,
        "verdict": verdict,
        "tamper_ratio": float(np.round(tamper_ratio, 4)),
        "mean_anomaly": float(np.round(mean_val, 4)),
        "max_anomaly": float(np.round(max_val, 4)),
    }


def render_heatmap_overlay(img_rgb: np.ndarray, anomaly_map: np.ndarray, alpha: float = 0.5) -> np.ndarray:
    """
    Renders a thermal Jet heatmap over the original RGB image.
    Blue / Green: pristine / low manipulation probability
    Yellow / Red: high anomaly / suspected manipulation or AI hallucination
    """
    h, w = img_rgb.shape[:2]
    if anomaly_map.shape[:2] != (h, w):
        anomaly_map = cv2.resize(anomaly_map, (w, h), interpolation=cv2.INTER_LINEAR)

    # Convert normalized [0, 1] map to uint8 [0, 255]
    heatmap_gray = (np.clip(anomaly_map, 0.0, 1.0) * 255.0).astype(np.uint8)
    # Apply JET colormap (OpenCV generates BGR)
    heatmap_bgr = cv2.applyColorMap(heatmap_gray, cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)

    # Alpha blend original image with heatmap
    overlay_rgb = cv2.addWeighted(img_rgb, 1.0 - alpha, heatmap_rgb, alpha, 0)
    return overlay_rgb
