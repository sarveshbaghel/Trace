#!/usr/bin/env python3
"""
TruFor AI Inference Wrapper for TRACE Civic Issue Verification
Loads the input image, runs TruFor / forensic manipulation detection,
generates a thermal forgery heatmap overlay, and prints structured JSON results.
"""

import os
import sys
import json
import time
import uuid
import argparse
import urllib.request
import numpy as np
import cv2
from PIL import Image

# Import local modules
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from forensics import run_forensic_pipeline, render_heatmap_overlay

try:
    import torch
    import torchvision.transforms as transforms
    from models.trufor import TruForModel
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


def load_image(image_source: str) -> np.ndarray:
    """Loads image from local path or remote URL into an RGB numpy array."""
    if image_source.startswith("http://") or image_source.startswith("https://"):
        req = urllib.request.Request(
            image_source,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            img_bytes = resp.read()
        nparr = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError(f"Failed to decode image from URL: {image_source}")
        return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    else:
        if not os.path.exists(image_source):
            raise FileNotFoundError(f"Image not found at path: {image_source}")
        img_bgr = cv2.imread(image_source)
        if img_bgr is None:
            raise ValueError(f"Failed to read image at path: {image_source}")
        return cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)


def run_trufor_torch(img_rgb: np.ndarray, weights_path: str):
    """Runs TruFor inference using PyTorch model if weights are available."""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = TruForModel().to(device)

    # Attempt to load checkpoint weights
    checkpoint = torch.load(weights_path, map_location=device)
    state_dict = checkpoint.get('state_dict', checkpoint)
    # Filter matching keys
    model_dict = model.state_dict()
    matched_dict = {k: v for k, v in state_dict.items() if k in model_dict and v.shape == model_dict[k].shape}
    model_dict.update(matched_dict)
    model.load_state_dict(model_dict)
    model.eval()

    h, w = img_rgb.shape[:2]
    # Resize to multiple of 32 for transformer blocks
    target_h = ((h + 31) // 32) * 32
    target_w = ((w + 31) // 32) * 32
    resized_rgb = cv2.resize(img_rgb, (target_w, target_h), interpolation=cv2.INTER_AREA)

    tensor = torch.from_numpy(resized_rgb).permute(2, 0, 1).float() / 255.0
    tensor = tensor.unsqueeze(0).to(device)

    with torch.no_grad():
        out = model(tensor)
        anomaly_map = out['map'].squeeze().cpu().numpy()
        conf_map = out.get('conf', torch.ones_like(out['map'])).squeeze().cpu().numpy()
        integrity_score = float(out['score'].squeeze().cpu().numpy()) if 'score' in out else float(1.0 - np.mean(anomaly_map))

    anomaly_map = cv2.resize(anomaly_map, (w, h), interpolation=cv2.INTER_LINEAR)
    manipulation_score = float(np.clip(1.0 - integrity_score, 0.0, 1.0))
    authenticity_score = float(np.round(1.0 - manipulation_score, 4))
    ai_prob = float(np.round(np.clip(manipulation_score * 0.9, 0.01, 0.98), 4))

    verdict = "AUTHENTIC"
    if manipulation_score >= 0.65:
        verdict = "FAKE"
    elif manipulation_score >= 0.35:
        verdict = "SUSPICIOUS"

    return {
        "anomaly_map": anomaly_map,
        "authenticity_score": authenticity_score,
        "manipulation_score": manipulation_score,
        "ai_generated_probability": ai_prob,
        "verdict": verdict,
        "tamper_ratio": float(np.round(np.sum(anomaly_map > 0.5) / (h * w), 4)),
        "mean_anomaly": float(np.round(np.mean(anomaly_map), 4)),
        "max_anomaly": float(np.round(np.max(anomaly_map), 4)),
        "engine": "TruFor-PyTorch"
    }


def analyze_image(image_path: str, output_dir: str, weights_path: str = None) -> dict:
    img_rgb = load_image(image_path)
    os.makedirs(output_dir, exist_ok=True)

    analysis_res = None
    engine_name = "TruFor-Forensics"

    # Try PyTorch model if weights file exists and torch is installed
    if TORCH_AVAILABLE and weights_path and os.path.isfile(weights_path):
        try:
            analysis_res = run_trufor_torch(img_rgb, weights_path)
            engine_name = "TruFor-PyTorch"
        except Exception as e:
            # Fall back safely to forensic engine
            sys.stderr.write(f"[WARN] TruFor PyTorch inference failed ({e}), falling back to forensic engine\n")

    if analysis_res is None:
        analysis_res = run_forensic_pipeline(img_rgb)
        analysis_res["engine"] = engine_name

    # Generate and save colorized heatmap overlay
    anomaly_map = analysis_res["anomaly_map"]
    overlay_rgb = render_heatmap_overlay(img_rgb, anomaly_map, alpha=0.52)

    timestamp = int(time.time() * 1000)
    unique_id = uuid.uuid4().hex[:8]
    heatmap_filename = f"heatmap_{timestamp}_{unique_id}.png"
    heatmap_filepath = os.path.join(output_dir, heatmap_filename)

    overlay_bgr = cv2.cvtColor(overlay_rgb, cv2.COLOR_RGB2BGR)
    cv2.imwrite(heatmap_filepath, overlay_bgr)

    return {
        "success": True,
        "authenticity_score": analysis_res["authenticity_score"],
        "manipulation_score": analysis_res["manipulation_score"],
        "ai_generated_probability": analysis_res["ai_generated_probability"],
        "verdict": analysis_res["verdict"],
        "model_version": f"TruFor-v1 ({analysis_res['engine']})",
        "heatmap_filename": heatmap_filename,
        "heatmap_filepath": os.path.abspath(heatmap_filepath),
        "details": {
            "engine": analysis_res["engine"],
            "tamper_pixel_ratio": analysis_res["tamper_ratio"],
            "mean_anomaly": analysis_res["mean_anomaly"],
            "max_anomaly": analysis_res["max_anomaly"],
        }
    }


def main():
    parser = argparse.ArgumentParser(description="TruFor AI Verification CLI")
    parser.add_argument("--image", required=True, help="Path or URL to input image")
    parser.add_argument("--output_dir", default="uploads/heatmaps", help="Output directory for generated heatmap PNGs")
    parser.add_argument("--weights", default="", help="Path to TruFor pretrained weights (optional)")

    args = parser.parse_args()

    # Default weights location if not specified
    weights_path = args.weights
    if not weights_path:
        default_weights = os.path.join(CURRENT_DIR, "weights", "trufor.pth.tar")
        if os.path.isfile(default_weights):
            weights_path = default_weights

    try:
        result = analyze_image(args.image, args.output_dir, weights_path)
        print(json.dumps(result, indent=2))
        sys.stdout.flush()
        sys.exit(0)
    except Exception as e:
        error_res = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_res), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
