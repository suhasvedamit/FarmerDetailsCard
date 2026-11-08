#!/usr/bin/env python3
"""
Farmer ID Card Web Application & REST API
==========================================
Production-ready Flask backend.
Completely free, offline, local extraction and card generation engine.
Zero external AI APIs, zero subscriptions.
"""

import os
import io
import time
import json
import uuid
import base64
import csv
from typing import Dict, Any

from flask import Flask, request, jsonify, render_template, send_file
from werkzeug.utils import secure_filename
from PIL import Image

from PyApp.extractor import FarmerFormExtractor
from PyApp.card_generator import generate_farmer_id_card_image, generate_farmer_id_card_pdf

# Setup directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
DATA_FOLDER = os.path.join(BASE_DIR, "data") if os.path.exists(os.path.join(BASE_DIR, "data")) else os.path.join(BASE_DIR, "..", "data")
SAMPLE_PDF_PATH = os.path.join(DATA_FOLDER, "27_490_4187_555391_006318_261104222058.pdf")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__, static_folder="static", template_folder="templates")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 32 * 1024 * 1024  # 32 MB max upload

# Initialize extractor singleton
extractor = FarmerFormExtractor()


def cleanup_old_uploads(max_age_seconds: int = 3600):
    """Periodically remove files older than 1 hour from uploads folder."""
    try:
        now = time.time()
        for filename in os.listdir(UPLOAD_FOLDER):
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.isfile(file_path):
                if now - os.path.getmtime(file_path) > max_age_seconds:
                    try:
                        os.remove(file_path)
                    except Exception:
                        pass
    except Exception:
        pass


@app.route("/")
def index():
    """Render the main user interface."""
    return render_template("index.html")


@app.route("/health")
@app.route("/api/health")
def health():
    """Health check endpoint for production monitoring."""
    return jsonify({
        "status": "healthy",
        "ocr_languages": extractor.ocr_languages,
        "engine": "local_offline_pymupdf_tesseract",
        "version": "1.0.0"
    })


@app.route("/api/extract", methods=["POST"])
def api_extract():
    """
    Extract details and photo from an uploaded Farmer Registration PDF.
    Accepts: multipart/form-data with 'file' (.pdf)
    Returns: JSON containing all 10 extracted fields + photo + card preview base64
    """
    cleanup_old_uploads()

    if "file" not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"success": False, "error": "No file selected"}), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"success": False, "error": "Only PDF files are supported"}), 400

    try:
        req_id = str(uuid.uuid4())[:8]
        safe_name = f"{req_id}_{secure_filename(file.filename)}"
        pdf_path = os.path.join(app.config["UPLOAD_FOLDER"], safe_name)
        file.save(pdf_path)

        # Extract all fields & photo
        record = extractor.extract_from_pdf(pdf_path, save_photo_dir=app.config["UPLOAD_FOLDER"])
        data = record.to_dict()

        # Generate live ID card preview
        card_img = generate_farmer_id_card_image(data)
        card_buffer = io.BytesIO()
        card_img.save(card_buffer, format="PNG", quality=95)
        card_base64 = base64.b64encode(card_buffer.getvalue()).decode("utf-8")

        # Save generated card images for direct download
        card_png_name = f"{req_id}_farmer_card.png"
        card_pdf_name = f"{req_id}_farmer_card.pdf"
        card_png_path = os.path.join(app.config["UPLOAD_FOLDER"], card_png_name)
        card_pdf_path = os.path.join(app.config["UPLOAD_FOLDER"], card_pdf_name)

        card_img.save(card_png_path, "PNG")
        generate_farmer_id_card_pdf(data, card_pdf_path)

        # Save data JSON for export
        json_data_name = f"{req_id}_farmer_data.json"
        with open(os.path.join(app.config["UPLOAD_FOLDER"], json_data_name), "w", encoding="utf-8") as jf:
            json.dump(data, jf, indent=2, ensure_ascii=False)

        return jsonify({
            "success": True,
            "data": data,
            "card_preview_url": f"data:image/png;base64,{card_base64}",
            "card_png_url": f"data:image/png;base64,{card_base64}",
            "downloads": {
                "card_png": f"/api/download/file/{card_png_name}",
                "card_pdf": f"/api/download/file/{card_pdf_name}",
                "data_json": f"/api/download/file/{json_data_name}",
            }
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/sample", methods=["GET"])
def api_sample():
    """1-Click test route that extracts data from the bundled sample PDF."""
    if not os.path.exists(SAMPLE_PDF_PATH):
        return jsonify({"success": False, "error": "Sample PDF not found"}), 404

    try:
        req_id = "sample_" + str(uuid.uuid4())[:6]
        record = extractor.extract_from_pdf(SAMPLE_PDF_PATH, save_photo_dir=app.config["UPLOAD_FOLDER"])
        data = record.to_dict()

        # Generate ID card preview
        card_img = generate_farmer_id_card_image(data)
        card_buffer = io.BytesIO()
        card_img.save(card_buffer, format="PNG", quality=95)
        card_base64 = base64.b64encode(card_buffer.getvalue()).decode("utf-8")

        card_png_name = f"{req_id}_farmer_card.png"
        card_pdf_name = f"{req_id}_farmer_card.pdf"
        card_png_path = os.path.join(app.config["UPLOAD_FOLDER"], card_png_name)
        card_pdf_path = os.path.join(app.config["UPLOAD_FOLDER"], card_pdf_name)

        card_img.save(card_png_path, "PNG")
        generate_farmer_id_card_pdf(data, card_pdf_path)

        json_data_name = f"{req_id}_farmer_data.json"
        with open(os.path.join(app.config["UPLOAD_FOLDER"], json_data_name), "w", encoding="utf-8") as jf:
            json.dump(data, jf, indent=2, ensure_ascii=False)

        return jsonify({
            "success": True,
            "data": data,
            "card_preview_url": f"data:image/png;base64,{card_base64}",
            "card_png_url": f"data:image/png;base64,{card_base64}",
            "downloads": {
                "card_png": f"/api/download/file/{card_png_name}",
                "card_pdf": f"/api/download/file/{card_pdf_name}",
                "data_json": f"/api/download/file/{json_data_name}",
            }
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/generate-card", methods=["POST"])
def api_generate_card():
    """
    Regenerates the Farmer ID Card when the user modifies any fields in the UI.
    Accepts: JSON payload with updated fields
    Returns: Updated card base64 image and download links
    """
    try:
        payload = request.get_json(force=True)
        if not payload:
            return jsonify({"success": False, "error": "No data provided"}), 400

        req_id = str(uuid.uuid4())[:8]

        # Generate card image
        card_img = generate_farmer_id_card_image(payload)
        card_buffer = io.BytesIO()
        card_img.save(card_buffer, format="PNG", quality=95)
        card_base64 = base64.b64encode(card_buffer.getvalue()).decode("utf-8")

        # Save files
        card_png_name = f"{req_id}_updated_card.png"
        card_pdf_name = f"{req_id}_updated_card.pdf"
        card_png_path = os.path.join(app.config["UPLOAD_FOLDER"], card_png_name)
        card_pdf_path = os.path.join(app.config["UPLOAD_FOLDER"], card_pdf_name)

        card_img.save(card_png_path, "PNG")
        generate_farmer_id_card_pdf(payload, card_pdf_path)

        return jsonify({
            "success": True,
            "card_preview_url": f"data:image/png;base64,{card_base64}",
            "card_png_url": f"data:image/png;base64,{card_base64}",
            "downloads": {
                "card_png": f"/api/download/file/{card_png_name}",
                "card_pdf": f"/api/download/file/{card_pdf_name}",
            }
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/download/file/<filename>")
def download_file(filename):
    """Secure file download from the uploads folder."""
    safe_filename = secure_filename(filename)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], safe_filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found or expired"}), 404

    return send_file(file_path, as_attachment=True, download_name=safe_filename)


@app.route("/api/export/csv", methods=["POST"])
def export_csv():
    """Exports farmer data as a downloadable CSV file."""
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No data provided"}), 400

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Farmer ID",
            "Enrollment No",
            "Farmer Name",
            "Identifier Name",
            "Date of Birth",
            "Age",
            "Gender",
            "Caste Category",
            "Mobile Number",
            "Total Land Area (Ha)",
            "Survey/Gat No",
            "Village",
            "Sub-District",
            "District",
            "State",
            "Address"
        ])

        land = data.get("land_detail", {})
        if not isinstance(land, dict):
            land = {}

        writer.writerow([
            data.get("farmer_id", ""),
            data.get("enrollment_no", ""),
            data.get("farmer_name", ""),
            data.get("identifier_name", ""),
            data.get("dob", ""),
            data.get("age", ""),
            data.get("gender", ""),
            data.get("caste_category", ""),
            data.get("mobile_number", ""),
            land.get("total_area_hectare", ""),
            land.get("survey_gat_no", ""),
            land.get("village", ""),
            land.get("sub_district", ""),
            land.get("district", ""),
            land.get("state", ""),
            data.get("address", "")
        ])

        mem = io.BytesIO()
        mem.write(output.getvalue().encode("utf-8-sig"))
        mem.seek(0)

        filename = f"farmer_{data.get('farmer_id', 'record')}.csv"
        return send_file(mem, mimetype="text/csv", as_attachment=True, download_name=filename)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"Starting Farmer ID Card Application on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
