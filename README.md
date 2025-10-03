## Exoplanet Detector — NASA Space Apps Challenge 2025

An end-to-end web app to analyze stellar light curves and detect potential exoplanets using AI. The project includes a Flask backend for inference and a static frontend for uploading data and visualizing results.

### Demo
- Video walkthrough:

  

https://github.com/user-attachments/assets/7020862e-ef4b-4502-8fa7-5d0053d83c19



- Image preview:
homepage



<img width="1913" height="925" alt="image" src="https://github.com/user-attachments/assets/33021fcd-c9a6-492f-9f7e-99ef1237e175" />

<img width="1905" height="924" alt="image" src="https://github.com/user-attachments/assets/2c213805-2278-45ee-824e-3110e3b72b03" />



upload page 

<img width="1909" height="921" alt="image" src="https://github.com/user-attachments/assets/f4d9a102-9c84-4675-adb6-5dc78aa1a8c5" />
<img width="1911" height="921" alt="image" src="https://github.com/user-attachments/assets/9f9fe03b-44fd-40fc-8a4e-db4555cbfde9" />

<img width="1908" height="921" alt="image" src="https://github.com/user-attachments/assets/9b8544a6-0428-451a-a202-d57b61df7e43" />

result Page

<img width="1907" height="928" alt="image" src="https://github.com/user-attachments/assets/87cd7850-16e7-4d3d-b8a2-9ee2bf30aa65" />

<img width="1907" height="927" alt="image" src="https://github.com/user-attachments/assets/3397b037-f603-41fa-84ef-564ddba3872c" />

<img width="1918" height="914" alt="image" src="https://github.com/user-attachments/assets/429a5143-68af-4197-bc3e-65c6f9f0c4fb" />









  

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


The repository includes several CSV files (e.g., `k2.csv`, `koi.csv`, `toi.csv`) for experimentation. we used this data from Nasa Resources.



### Acknowledgements

- Built for NASA Space Apps Challenge 2025
- Uses NASA Kepler, K2, and TESS datasets
- PyTorch, Flask, Plotly, and Astropy


