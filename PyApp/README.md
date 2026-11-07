# 🌾 AgriStack Farmer Registration Form Extractor & ID Card Generator

A **production-ready, completely free, 100% local and offline** application to extract demographic, contact, land details, and photographs from Government Farmer Registration / AgriStack PDF forms, and generate official print-ready **Farmer Identity Cards** (PNG & CR80 PDF).

> **100% Free & Local Privacy Guarantee**:
> - ❌ **No AI APIs** (No OpenAI, Claude, Gemini, Groq, or HuggingFace)
> - ❌ **No Cloud OCR SaaS** (No AWS Textract, Azure AI, Google Cloud Vision)
> - ❌ **No Subscriptions or Credit Cards**
> - ✅ **100% Open-Source Local Python Stack** (`PyMuPDF`, `pytesseract`, `Pillow`, `qrcode`, `Flask`)
> - ✅ **Runs completely offline and inside air-gapped / on-premise environments**

---

## 📋 Extracted Fields (All 10 Extracted Automatically)

| # | Field Name | Extracted Sample Value | Extraction Method |
|---|------------|------------------------|-------------------|
| 1 | **Farmer ID** | `77900535348` | Deterministic regex matching registration ID & enrollment number |
| 2 | **Farmer Name** | `Ganesh Pandurang Shinde` | Pure English name parser & declaration block matcher |
| 3 | **Identifier Name** | `Pandurang Shinde` | Father/Spouse English relation block |
| 4 | **DOB & Age** | `04/08/1987` *(Age: 39)* | Standard Indian date regex `DD/MM/YYYY` |
| 5 | **Gender** | `Male` | Keyword & normalization classifier |
| 6 | **Caste Category** | `General` | Category parser (General / OBC / SC / ST) |
| 7 | **Mobile Number** | `9552533470` | 10-digit mobile number pattern matcher |
| 8 | **Land Details** | `0.72 Hectare (Gat No: 102, Shindewadi, Junnar, PUNE, MAHARASHTRA)` | Multi-column table analyzer across ownership tables |
| 9 | **Address** | `Gat No- 1193/8, Flat No- 1001, Parshwa Platinum, Radha Swami Ashram Road, Opposite Imperial Hospital` | Residential details multi-line block cleaner |
| 10 | **Farmer Photo** | *High-resolution portrait photograph* | Bounded label finder + automatic margin edge detector |

---

## 🏗️ Architecture

```
FarmerIdCard/
├── app.py                 # Production Flask Web Server & REST API endpoints
├── extractor.py           # Core 10-field extraction engine & photo cropper
├── card_generator.py      # Official Farmer ID Card generator (PNG & CR80 PDF) + QR code
├── requirements.txt       # Free open-source dependencies
├── templates/
│   └── index.html         # Modern, responsive single-page application
├── static/
│   ├── css/
│   │   └── style.css      # Self-contained styles (zero external CDN needed)
│   └── js/
│       └── app.js         # Client-side file upload, live editor & download actions
├── data/
│   ├── 27_490_4187_555391_006318_261104222058.pdf  # Sample registration form
│   └── image.png                                   # Target card layout reference
└── uploads/               # Temporary processing directory with auto-cleanup
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure Python 3.9+ and Tesseract OCR are installed:

#### macOS:
```bash
brew install tesseract tesseract-lang
```

#### Ubuntu / Debian:
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-mar tesseract-ocr-hin python3-venv
```

---

### 2. Setup Virtual Environment & Install Dependencies

```bash
cd FarmerIdCard
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

### 3. Run the Web Application

```bash
python3 app.py
```
Open your browser and navigate to: **`http://localhost:5001`**

#### Key Features in the Web App:
- **Drag & Drop Upload**: Upload any PDF form.
- **1-Click Sample Test**: Click **"⚡ Load Sample Form"** to instantly test the bundled PDF (`data/27_490_4187_555391_006318_261104222058.pdf`).
- **Live Editable Fields**: Modify or verify any field; click **"🔄 Update & Regenerate Card"** to instantly refresh the card.
- **One-Click Copy**: Copy any field to clipboard with a single click.
- **Multi-Format Export**:
  - 📥 **Download ID Card (PNG)** — High-resolution 300 DPI image
  - 📄 **Download ID Card (PDF)** — Standard CR80 credit card size for PVC ID card printers
  - 💾 **Export Data (JSON)** — Structured JSON payload
  - 📊 **Export Data (CSV)** — Spreadsheet format
  - 🖼️ **Download Photo** — Cropped portrait photograph

---

## 💻 Command Line Interface (CLI)

You can also run extraction and card generation directly from your terminal or shell scripts:

### Extract Details to JSON:
```bash
python3 extractor.py data/27_490_4187_555391_006318_261104222058.pdf --output farmer.json --photo-dir ./extracted_photos
```

### Generate ID Card from JSON:
```bash
python3 card_generator.py farmer.json --output-png card.png --output-pdf card.pdf
```

---

## 🌐 REST API Documentation

### 1. Health Check
```http
GET /health
```
**Response:**
```json
{
  "engine": "local_offline_pymupdf_tesseract",
  "ocr_languages": "eng+mar+hin",
  "status": "healthy",
  "version": "1.0.0"
}
```

---

### 2. Extract Data from PDF
```http
POST /api/extract
Content-Type: multipart/form-data
```
**Form Data:**
- `file`: PDF file stream

**Sample Response:**
```json
{
  "success": true,
  "data": {
    "farmer_id": "77900535348",
    "enrollment_no": "27_490_4187_555391_006318",
    "farmer_name": "Ganesh Pandurang Shinde",
    "identifier_name": "Pandurang Shinde",
    "dob": "04/08/1987",
    "age": "39",
    "gender": "Male",
    "caste_category": "General",
    "mobile_number": "9552533470",
    "land_detail": {
      "total_area_hectare": "0.72",
      "number_of_lands": "1",
      "survey_gat_no": "102",
      "village": "Shindewadi",
      "sub_district": "Junnar",
      "district": "PUNE",
      "state": "MAHARASHTRA",
      "summary": "0.72 Hectare (Gat No: 102, Shindewadi, Junnar, PUNE, MAHARASHTRA)"
    },
    "address": "Gat No- 1193/8, Flat No- 1001, Parshwa Platinum, Radha Swami Ashram Road, Opposite Imperial Hospital",
    "photo_base64": "...base64 JPEG data..."
  },
  "card_preview_url": "data:image/png;base64,...",
  "downloads": {
    "card_png": "/api/download/file/req123_farmer_card.png",
    "card_pdf": "/api/download/file/req123_farmer_card.pdf",
    "data_json": "/api/download/file/req123_farmer_data.json"
  }
}
```

---

### 3. Generate / Update ID Card
```http
POST /api/generate-card
Content-Type: application/json
```
**Body:** JSON object matching the `data` schema above.

**Response:**
```json
{
  "success": true,
  "card_preview_url": "data:image/png;base64,...",
  "downloads": {
    "card_png": "/api/download/file/req123_updated_card.png",
    "card_pdf": "/api/download/file/req123_updated_card.pdf"
  }
}
```

---

### 4. 1-Click Sample Form Test
```http
GET /api/sample
```
Runs extraction immediately against the bundled sample PDF and returns complete data + card preview.

---

### 5. Export CSV
```http
POST /api/export/csv
Content-Type: application/json
```
Returns a downloadable `farmer_record.csv` file.

---

## 🏭 Production Deployment

For high-concurrency production deployments, run using Gunicorn:

```bash
gunicorn -w 4 -b 0.0.0.0:5001 --timeout 120 app:app
```

### Systemd Service Configuration (`/etc/systemd/system/farmer-card.service`):
```ini
[Unit]
Description=Farmer ID Card Application
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/FarmerIdCard
Environment="PATH=/var/www/FarmerIdCard/.venv/bin"
ExecStart=/var/www/FarmerIdCard/.venv/bin/gunicorn -w 4 -b 127.0.0.1:5001 --timeout 120 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 🔒 Security & Privacy

1. **Air-gapped operation**: Requires 0 internet connectivity once dependencies are installed.
2. **Zero data retention**: Uploads older than 1 hour are automatically pruned.
3. **No tracking / No telemetry**: No analytics or tracking scripts are embedded.
