## Exoplanet Detector — NASA Space Apps Challenge 2025

An end-to-end web app to analyze stellar light curves and detect potential exoplanets using AI. The project includes a Flask backend for inference and a static frontend for uploading data and visualizing results.

### Demo

- Image preview:

  ![App Icon](frontend/favicon.svg)

- Video walkthrough:

  Add your demo video to `demo/` (e.g., `demo/demo.mp4`) and link it here:

  `[View Demo Video](demo/demo.mp4)`

### Features

- Upload CSV or FITS files and run AI-based exoplanet detection
- Built-in sample dataset option for quick testing
- Plotly-based light curve visualization and rich UI
- Simple, CUDA-aware PyTorch inference with a safe heuristic fallback model

### Project Structure

```
project/
  backend/
    app.py              # Flask app with /api/predict endpoint and static serving
    inference.py        # Parsing (CSV/FITS) and model inference utilities
    requirements.txt    # Backend Python dependencies
  frontend/
    index.html          # Landing page
    upload.html         # Upload and analyze page
    results.html        # Results and visualizations
    script.js, upload.js, results.js, styles.css
    favicon.svg
  exoplanet_models_numeric_only.ipynb
  *.csv (Kepler/K2/TESS dataset files)
  README.md
```

### Getting Started

#### 1) Backend (Flask)

Requirements: Python 3.10+, pip

```bash
cd backend
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
```

The server starts at `http://localhost:5000` and also serves the frontend from `../frontend`.

Notes:
- If no Torch model file is found, a lightweight heuristic model runs to avoid errors.
- FITS support requires `astropy`; ensure it is installed via requirements.

#### 2) Frontend (static)

Open `frontend/index.html` in a browser, or rely on the Flask server which serves it at `/`.

### Usage

1. Open the app (served by Flask) at `http://localhost:5000/`.
2. Navigate to Upload & Predict.
3. Either upload a `.csv` or `.fits` file, or choose a sample dataset.
4. Click “Analyze with AI” to get predictions and see the light curve in Results.

### API

Base URL: `http://localhost:5000`

- `GET /api/health`
  - 200 → `{ "status": "ok" }`

- `POST /api/predict`
  - Form-data fields:
    - `file`: CSV or FITS file (optional if `dataset` is provided)
    - `dataset`: sample dataset name string (optional if `file` is provided)
  - Responses:
    - 200 →
      ```json
      {
        "probability": 0.87,
        "label": 1,
        "time": [ ... 100 values ... ],
        "flux": [ ... 100 values ... ],
        "fileName": "your_file.csv"
      }
      ```
    - 400 → `{ "error": "Provide a file or dataset" }` or unsupported file type
    - 500 → `{ "error": "..." }`

### Datasets

The repository includes several CSV files (e.g., `k2.csv`, `koi.csv`, `toi.csv`) for experimentation. You can also bring your own data with time and flux columns.

### Demo Assets

- Place screenshots in `demo/images/` and videos in `demo/`.
- Example image embeds:

  `![Upload Page](demo/images/upload.png)`

  `![Results Page](demo/images/results.png)`

- Example video link:

  `[Watch the walkthrough](demo/demo.mp4)`

### Acknowledgements

- Built for NASA Space Apps Challenge 2025
- Uses NASA Kepler, K2, and TESS datasets
- PyTorch, Flask, Plotly, and Astropy


