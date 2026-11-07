# Production Dockerfile for AgriStack Farmer Form Extractor
FROM python:3.11-slim

# Install system dependencies including Tesseract and Indic language packs (Marathi, Hindi)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-mar \
    tesseract-ocr-hin \
    libmupdf-dev \
    fonts-deva \
    fonts-noto-cjk \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Create necessary runtime directories
RUN mkdir -p uploads generated_cards extracted_images

# Expose port
EXPOSE 5001

# Run with Gunicorn WSGI in production
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "--workers", "2", "--timeout", "120", "app:app"]
