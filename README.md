## Exoplanet Detector – NASA Space Apps

AI-powered web app and notebook pipeline for classifying exoplanet candidates from Kepler, K2, and TESS mission data.

### Highlights
- Numeric-only ML models: SGD, RandomForest, HistGradientBoosting, MLP
- Per-mission training, evaluation, and model persistence
- Flask backend for light-curve parsing and inference
- Modern frontend for upload, analysis, visualization, and export

### Quick Start
1) Backend
```bash
pip install -r data/raw/backend/requirements.txt
python data/raw/backend/app.py
```
2) Frontend
- Open `data/raw/frontend/index.html` in a browser (or serve statically).

### Notebooks and Data
- Notebook: `data/raw/exoplanet_models_numeric_only.ipynb`
- Raw CSVs: `data/raw/koi.csv`, `data/raw/k2.csv`, `data/raw/toi.csv`
- Cleaned/derived: `data/raw/koi_numeric_only.csv`, `data/raw/kepler_features.csv`
- Reports and models: `data/raw/models*` directories

### Best Models
- Kepler: `data/raw/models/best_model.joblib`
- K2: `data/raw/models_k2/best_model.joblib`
- TESS: `data/raw/models_tess/best_model.joblib`

### Space Images
Below are included project images used for branding and the tab icon.

![App Icon](data/raw/frontend/favicon.svg)

![Banner](data/raw/ChatGPT%20Image%20Oct%203,%202025,%2004_28_40%20PM.png)

### Space Videos (External)
- NASA YouTube Channel: https://www.youtube.com/@NASA
- Exoplanet Exploration (JPL): https://exoplanets.nasa.gov/
- TESS Mission Overview: https://www.youtube.com/results?search_query=TESS+mission

### API
- Health: `GET /api/health`
- Predict: `POST /api/predict` with `file` (CSV/FITS) or `dataset` form field

### License
Public domain images and videos remain property of their respective owners (e.g., NASA/JPL). Code in this repo under permissive terms by the project authors.

# A World Away: Hunting for Exoplanets with AI

End-to-end ML pipeline to discover exoplanet candidates from side-data (KOI, TOI, K2) and optional NEOSSat/JWST sources. Includes data ingestion, preprocessing, feature engineering, EDA, model training (RF/XGBoost/LightGBM), prediction, evaluation, explainability (SHAP), and report generation.

## Quickstart

```bash
# (optional) create venv
python -m venv .venv && .venv\\Scripts\\activate

# install deps
pip install -r requirements.txt

# run full pipeline
python pipeline.py all
```

Artifacts are saved under `outputs/` and `models/`. Raw and processed data live in `data/raw` and `data/processed`.

## Commands

- `python pipeline.py download` — fetch KOI/TOI/K2 tables from NASA Exoplanet Archive; NEOSSat/JWST are optional stubs
- `python pipeline.py preprocess` — clean, engineer features, merge datasets
- `python pipeline.py eda` — generate EDA plots
- `python pipeline.py train` — train models with CV and hyperparameter search
- `python pipeline.py predict` — score unknown/candidate rows and rank by probability
- `python pipeline.py report` — generate markdown report and export predictions CSV
- `python pipeline.py all` — run everything in sequence

## Configuration

Edit `configs/config.yaml` to tweak data sources, feature list, and model parameters.

## Notes

- NEOSSat and JWST ingestion are provided as extensible stubs; place CSVs under `data/external/` or set custom URLs in `configs/config.yaml`.
- This pipeline prioritizes explainability; feature importances and SHAP plots are exported under `outputs/explainability/`.
