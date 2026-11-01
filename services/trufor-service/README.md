# TruFor AI Image Forgery & Integrity Detection Service

This service wraps **TruFor** ([grip-unina/TruFor](https://github.com/grip-unina/TruFor)), an IEEE CVPR/T-PAMI forensic model for visual manipulation localization and authenticity detection.

## How it works
1. **Learned Sensor Noise (Noiseprint++)**: Analyzes camera-specific high-frequency sensor PRNU patterns to identify inconsistent or missing hardware noise floor.
2. **Error Level Analysis (ELA)**: Recompression discrepancy analysis across image blocks to detect spliced or composited regions.
3. **Diffusion Frequency Analysis**: Detects signature spectral flatness and unnatural gradient transitions typical of Midjourney, Stable Diffusion, and DALL-E.
4. **Thermal Heatmap Overlay**: Generates an RGB visual overlay where:
   - **Blue / Cyan**: Pristine camera sensor consistency
   - **Yellow / Red**: Suspected manipulated or AI-generated artifact

## Pretrained Weights
To use the official deep learning weights:
1. Download `trufor.pth.tar` from the [official TruFor repository release](https://github.com/grip-unina/TruFor).
2. Place the file inside `services/trufor-service/weights/trufor.pth.tar`.
3. If weights are not present, the service automatically runs the integrated forensic noise-residual & ELA pipeline, guaranteeing 100% uptime with no hard dependency on large external files.

## CLI Usage
```bash
python infer.py --image "path/to/evidence.jpg" --output_dir "uploads/heatmaps"
```
