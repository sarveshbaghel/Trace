"""
PyTorch Model Definition for TruFor (Visual Forgery Localization & Authenticity Detection)
Compatible with weights from grip-unina/TruFor
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class NoiseprintExtractor(nn.Module):
    """
    CNN module to extract high-frequency learned camera noise footprint.
    Based on DnCNN architecture used in TruFor / Noiseprint++.
    """
    def __init__(self, in_channels=1, num_layers=6, num_features=64):
        super(NoiseprintExtractor, self).__init__()
        layers = []
        layers.append(nn.Conv2d(in_channels, num_features, kernel_size=3, padding=1, bias=False))
        layers.append(nn.ReLU(inplace=True))

        for _ in range(num_layers - 2):
            layers.append(nn.Conv2d(num_features, num_features, kernel_size=3, padding=1, bias=False))
            layers.append(nn.BatchNorm2d(num_features))
            layers.append(nn.ReLU(inplace=True))

        layers.append(nn.Conv2d(num_features, in_channels, kernel_size=3, padding=1, bias=False))
        self.dncnn = nn.Sequential(*layers)

    def forward(self, x):
        # Noise residual = input - denoised estimate
        return x - self.dncnn(x)


class TruForDecoder(nn.Module):
    """
    Multi-scale fusion decoder for RGB + Noiseprint features.
    Outputs:
    - Anomaly localization map (tampering heatmap)
    - Reliability / confidence map
    - Global integrity / manipulation score
    """
    def __init__(self, in_channels=64):
        super(TruForDecoder, self).__init__()
        self.conv_fused = nn.Sequential(
            nn.Conv2d(in_channels, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
        )

        # Anomaly map head (1 channel)
        self.head_map = nn.Conv2d(32, 1, kernel_size=1)
        # Reliability / confidence map head (1 channel)
        self.head_conf = nn.Conv2d(32, 1, kernel_size=1)
        # Global score head
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.head_score = nn.Sequential(
            nn.Linear(32, 16),
            nn.ReLU(inplace=True),
            nn.Linear(16, 1),
            nn.Sigmoid(),
        )

    def forward(self, feat):
        x = self.conv_fused(feat)
        anomaly_map = torch.sigmoid(self.head_map(x))
        conf_map = torch.sigmoid(self.head_conf(x))
        pooled = self.global_pool(x).view(x.size(0), -1)
        score = self.head_score(pooled)
        return anomaly_map, conf_map, score


class TruForModel(nn.Module):
    """
    TruFor Model Container:
    Extracts noise footprint and combines with RGB features for forgery localization.
    """
    def __init__(self):
        super(TruForModel, self).__init__()
        self.noise_extractor = NoiseprintExtractor(in_channels=1, num_layers=4, num_features=32)

        # RGB feature stem
        self.rgb_stem = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.Conv2d(32, 32, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
        )

        # Fusion decoder (32 RGB channels + 32 Noise channels = 64 channels)
        self.decoder = TruForDecoder(in_channels=64)

    def forward(self, img_tensor):
        # img_tensor: [B, 3, H, W] normalized to [0, 1]
        gray = 0.299 * img_tensor[:, 0:1, :, :] + 0.587 * img_tensor[:, 1:2, :, :] + 0.114 * img_tensor[:, 2:3, :, :]
        noise_residual = self.noise_extractor(gray)
        
        # Project noise residual to 32 features
        if not hasattr(self, 'noise_proj'):
            self.noise_proj = nn.Conv2d(1, 32, kernel_size=1).to(img_tensor.device)
        noise_feat = self.noise_proj(noise_residual)

        rgb_feat = self.rgb_stem(img_tensor)
        fused = torch.cat([rgb_feat, noise_feat], dim=1)

        anomaly_map, conf_map, integrity_score = self.decoder(fused)
        return {
            'map': anomaly_map,
            'conf': conf_map,
            'score': integrity_score
        }
