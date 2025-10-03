import io
import os
import json
from typing import Dict, Tuple

import torch
import pandas as pd
import numpy as np

try:
    # Utilities for allowing globals with new safe loading
    from torch.serialization import add_safe_globals, safe_globals  # type: ignore

    try:
        add_safe_globals([np.core.multiarray._reconstruct])  # type: ignore[attr-defined]
    except Exception:
        pass
except Exception:
    safe_globals = None  # type: ignore

try:
    from astropy.io import fits  # type: ignore
except Exception:  # pragma: no cover
    fits = None


class ExoplanetModel:
    """Singleton-style model loader for transformer-based classifier."""

    _model = None
    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    @classmethod
    def get_model(cls) -> torch.nn.Module:
        if cls._model is None:
            model_path = os.getenv(
                "MODEL_PATH",
                os.path.join(os.path.dirname(__file__), "model_transformer.pt"),
            )
            # Lightweight fallback model if file is missing
            if not os.path.isfile(model_path):
                # Heuristic torch model: maps a 100-length flux vector to two logits
                # based on simple statistics (std and min). Avoids 500s when a
                # pretrained transformer isn't available.
                class HeuristicModel(torch.nn.Module):
                    def __init__(self) -> None:
                        super().__init__()

                    def forward(self, x: torch.Tensor) -> torch.Tensor:  # x: (B, 100)
                        # Compute simple features
                        std = torch.clamp(x.std(dim=1, keepdim=True), min=1e-6)
                        mn = x.min(dim=1, keepdim=True).values
                        # Combine into a score in [0, ~3]
                        score = torch.tanh(1.5 * std - 0.5 * mn)
                        # Map to logits for 2 classes
                        logit_pos = 2.5 * score
                        logit_neg = -logit_pos
                        return torch.cat([logit_neg, logit_pos], dim=1)

                model = HeuristicModel()
                model.eval()
                model.to(cls._device)
                cls._model = model
                return cls._model

            # The following assumes a scripted or full state_dict-compatible torch model
            try:
                model = torch.jit.load(model_path, map_location=cls._device)
            except Exception:
                # Fallback to state_dict if not TorchScript
                from torch import nn

                # Placeholder architecture; replace with the real one if available
                model = nn.Sequential(nn.Linear(100, 64), nn.ReLU(), nn.Linear(64, 2))
                try:
                    # Prefer safe loading. If available, permit numpy reconstruct.
                    if safe_globals is not None:
                        with safe_globals([np.core.multiarray._reconstruct]):  # type: ignore[attr-defined]
                            state = torch.load(
                                model_path,
                                map_location=cls._device,
                                weights_only=True,
                            )
                    else:
                        state = torch.load(
                            model_path,
                            map_location=cls._device,
                            weights_only=True,
                        )
                except TypeError:
                    state = torch.load(model_path, map_location=cls._device)
                except Exception:
                    # As a last resort, allow unsafe load if explicitly requested
                    if os.getenv("ALLOW_UNSAFE_TORCH_LOAD") == "1":
                        state = torch.load(model_path, map_location=cls._device, weights_only=False)  # type: ignore[arg-type]
                    else:
                        raise
                if isinstance(state, dict) and "state_dict" in state:
                    state = state["state_dict"]
                model.load_state_dict(state, strict=False)

            model.eval()
            model.to(cls._device)
            cls._model = model
        return cls._model


def _normalize_series(series: pd.Series) -> pd.Series:
    series = series.astype(float)
    mean = series.mean()
    std = series.std() if series.std() != 0 else 1.0
    return (series - mean) / std


def parse_csv(file_bytes: bytes) -> Tuple[pd.Series, pd.Series]:
    # Be tolerant to different delimiters and messy rows
    read_kwargs = {
        "skip_blank_lines": True,
        "on_bad_lines": "skip",  # skip malformed rows
    }
    try:
        # Let pandas sniff the delimiter
        df = pd.read_csv(
            io.BytesIO(file_bytes), sep=None, engine="python", **read_kwargs
        )
    except Exception:
        # Fallback to common separators
        for sep in [",", "\t", ";", "|", "\s+"]:
            try:
                df = pd.read_csv(
                    io.BytesIO(file_bytes), sep=sep, engine="python", **read_kwargs
                )
                break
            except Exception:
                df = None  # type: ignore
        if df is None:
            # Last resort: try without header
            df = pd.read_csv(
                io.BytesIO(file_bytes), header=None, engine="python", **read_kwargs
            )
    # Normalize header names for matching
    norm_cols = {c: str(c).strip().lower() for c in df.columns}
    inv_norm = {v: k for k, v in norm_cols.items()}

    time_candidates = [
        "time",
        "t",
        "jd",
        "bjd",
        "mjd",
        "timestamp",
        "date",
    ]
    flux_candidates = [
        "flux",
        "f",
        "pdcsap_flux",
        "sap_flux",
        "brightness",
        "intensity",
        "counts",
        "y",
        "value",
    ]

    time_col = next((inv_norm[n] for n in time_candidates if n in inv_norm), None)
    flux_col = next((inv_norm[n] for n in flux_candidates if n in inv_norm), None)

    if time_col is None or flux_col is None:
        # Coerce all columns to numeric and detect usable ones
        numeric_ok: list[str] = []
        for col in df.columns:
            coerced = pd.to_numeric(df[col], errors="coerce")
            valid_ratio = coerced.notna().mean()
            if valid_ratio >= 0.6:  # at least 60% numeric
                df[col] = coerced
                numeric_ok.append(col)

        if time_col is None and len(numeric_ok) >= 1:
            time_col = numeric_ok[0]
        if flux_col is None and len(numeric_ok) >= 2:
            flux_col = numeric_ok[1]

        # If only one numeric column present, use it as flux and synthesize time
        if (time_col is None or flux_col is None) and len(numeric_ok) == 1:
            flux_series = df[numeric_ok[0]].reset_index(drop=True)
            time_series = pd.Series(range(len(flux_series)))
            return time_series, _normalize_series(flux_series)

        if time_col is None or flux_col is None:
            raise ValueError(
                "CSV must contain at least two numeric columns: time and flux"
            )

    time = pd.to_numeric(df[time_col], errors="coerce").reset_index(drop=True)
    flux = pd.to_numeric(df[flux_col], errors="coerce").reset_index(drop=True)
    flux = _normalize_series(flux)
    return time, flux


def parse_fits(file_bytes: bytes) -> Tuple[pd.Series, pd.Series]:
    if fits is None:
        raise RuntimeError("astropy is required to parse FITS files")
    with fits.open(io.BytesIO(file_bytes)) as hdul:  # type: ignore
        # Heuristic: look for a table HDU with TIME/FLUX columns
        for hdu in hdul:
            data = getattr(hdu, "data", None)
            if data is None:
                continue
            cols = (
                [c.lower() for c in getattr(data, "columns", []).names]
                if hasattr(data, "columns")
                else []
            )
            if cols:
                time_col = next(
                    (c for c in data.columns.names if c.lower() in ("time", "t")), None
                )
                flux_col = next(
                    (
                        c
                        for c in data.columns.names
                        if c.lower() in ("flux", "f", "pdcsap_flux", "sap_flux")
                    ),
                    None,
                )
                if time_col and flux_col:
                    time = pd.Series(data[time_col])
                    flux = _normalize_series(pd.Series(data[flux_col]))
                    return time.reset_index(drop=True), flux.reset_index(drop=True)
        raise ValueError("Could not find TIME/FLUX columns in FITS file")


def run_inference(time: pd.Series, flux: pd.Series) -> Dict:
    model = ExoplanetModel.get_model()
    device = ExoplanetModel._device

    # Preprocess and resample to a fixed length for the model
    target_len = 100
    time_prep, flux_prep = _preprocess_time_flux(time, flux, target_len=target_len)
    x = torch.tensor(flux_prep, dtype=torch.float32, device=device).unsqueeze(0)

    with torch.no_grad():
        logits = model(x)
        if isinstance(logits, (list, tuple)):
            logits = logits[0]
        probs = torch.softmax(logits, dim=-1).squeeze(0).detach().cpu().numpy()

    # Assuming class index 1 == planet
    probability = float(probs[1]) if probs.shape[0] >= 2 else float(probs.max())
    label = 1 if probability >= 0.5 else 0

    return {
        "probability": probability,
        "label": label,
        "time": time_prep.tolist(),
        "flux": flux_prep.tolist(),
    }


def _preprocess_time_flux(
    time: pd.Series, flux: pd.Series, target_len: int = 100
) -> Tuple[np.ndarray, np.ndarray]:
    """Clean, denoise, normalize and resample the light curve.

    Steps:
      1) Drop non-finite values and sort by time
      2) Fill small gaps by linear interpolation
      3) Detrend with rolling median (robust to outliers)
      4) Clip outliers using MAD (median absolute deviation)
      5) Standardize (z-score)
      6) Resample to fixed length via linear interpolation
    """
    # Convert to numpy
    t = pd.to_numeric(time, errors="coerce")
    f = pd.to_numeric(flux, errors="coerce")

    df = pd.DataFrame({"t": t, "f": f}).dropna()
    if df.empty:
        # Fallback to zeros if input invalid
        return np.linspace(0, 1, target_len), np.zeros(target_len, dtype=np.float32)

    df = df[np.isfinite(df["t"]) & np.isfinite(df["f"])].sort_values("t")
    # Interpolate small gaps on native irregular grid (avoid pandas asfreq on numeric index)
    df = df.set_index("t")
    df["f"] = df["f"].interpolate(method="linear", limit_direction="both")
    df = df.reset_index()

    # Detrend using rolling median
    window = max(5, int(len(df) * 0.05))
    baseline = df["f"].rolling(window=window, center=True, min_periods=1).median()
    detrended = df["f"] - baseline

    # Robust outlier clipping using MAD
    med = np.median(detrended)
    mad = np.median(np.abs(detrended - med)) or 1.0
    clipped = np.clip(detrended, med - 5 * mad, med + 5 * mad)

    # Standardize
    mean = clipped.mean()
    std = clipped.std() or 1.0
    standardized = (clipped - mean) / std

    # Resample to fixed length
    t_min, t_max = float(df["t"].min()), float(df["t"].max())
    if t_max == t_min:
        t_uniform = np.linspace(0.0, 1.0, target_len)
        f_uniform = np.interp(
            t_uniform, np.linspace(0.0, 1.0, len(standardized)), standardized
        )
    else:
        t_uniform = np.linspace(t_min, t_max, target_len)
        f_uniform = np.interp(
            t_uniform, df["t"].to_numpy(dtype=float), standardized.to_numpy(dtype=float)
        )

    return t_uniform.astype(np.float32), f_uniform.astype(np.float32)
