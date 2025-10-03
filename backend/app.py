from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import random
import os
from werkzeug.utils import secure_filename

try:
    from .inference import parse_csv, parse_fits, run_inference
except Exception:  # When running as a script: py backend/app.py
    from inference import parse_csv, parse_fits, run_inference


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    @app.route("/api/health", methods=["GET"])
    def health() -> tuple:
        return jsonify({"status": "ok"}), 200

    @app.route("/api/predict", methods=["POST"])
    def predict() -> tuple:
        uploaded_file = request.files.get("file")
        dataset_name = request.form.get("dataset")

        if not uploaded_file and not dataset_name:
            return jsonify({"error": "Provide a file or dataset"}), 400

        try:
            if uploaded_file:
                filename = secure_filename(uploaded_file.filename)
                file_bytes = uploaded_file.read()
                if filename.lower().endswith(".csv"):
                    time, flux = parse_csv(file_bytes)
                elif filename.lower().endswith(".fits") or filename.lower().endswith(
                    ".fit"
                ):
                    time, flux = parse_fits(file_bytes)
                else:
                    return (
                        jsonify({"error": "Unsupported file type. Use CSV or FITS."}),
                        400,
                    )
                result = run_inference(time, flux)
                result["fileName"] = filename
            else:
                # For sample datasets, synthesize a basic signal for now
                import numpy as np

                n = 100
                time_list = list(range(n))
                base = 1.0
                noise = np.random.normal(0, 0.02, size=n)
                flux_list = [base + float(noise[i]) for i in range(n)]
                # Run inference on synthetic flux
                import pandas as pd

                result = run_inference(pd.Series(time_list), pd.Series(flux_list))
                result["fileName"] = dataset_name

            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    # Serve frontend files from ../frontend for a single-origin setup
    FRONTEND_DIR = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "frontend")
    )
    # Path to the provided tab image in data/raw
    RAW_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    FAVICON_PATH = os.path.join(RAW_DIR, "ChatGPT Image Oct 3, 2025, 04_28_40 PM.png")

    @app.route("/")
    def serve_index():
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/<path:path>")
    def serve_frontend(path: str):
        full_path = os.path.join(FRONTEND_DIR, path)
        if os.path.isfile(full_path):
            return send_from_directory(FRONTEND_DIR, path)
        # Fallback to index for unknown paths
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.route("/favicon.ico")
    @app.route("/favicon.png")
    @app.route("/favicon.svg")
    def serve_favicon():
        # Prefer the SVG in frontend if present
        svg_path = os.path.join(FRONTEND_DIR, "favicon.svg")
        if os.path.isfile(svg_path):
            return send_from_directory(FRONTEND_DIR, "favicon.svg")
        directory = os.path.dirname(FAVICON_PATH)
        filename = os.path.basename(FAVICON_PATH)
        if os.path.isfile(FAVICON_PATH):
            return send_from_directory(directory, filename)
        # If image missing, fall back to a simple 1x1 transparent PNG
        from flask import Response
        transparent_png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\x0bIDATx\x9cc````\x00\x00\x00\x05\x00\x01\x0d\n\x2d\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        return Response(transparent_png, mimetype="image/png")

    app.run(host="0.0.0.0", port=5000, debug=True)
