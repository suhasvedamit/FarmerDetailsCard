# AgriStack Farmer ID Extractor & Card Generator 🌾🇮🇳

> **Production-ready, 100% Client-Side Web Application built for GitHub Pages with React, TypeScript, Tailwind CSS, PDF.js, and WebAssembly Tesseract OCR.**

Zero server costs, zero API subscriptions, 100% private (documents never leave the browser).

---

## ⚡ Live on GitHub Pages

This app is configured to deploy directly to **GitHub Pages** using the automated GitHub Actions workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### How to Enable on GitHub (in 30 seconds):
1. Push this repository to your GitHub account.
2. In your GitHub repository, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. That's it! GitHub will automatically trigger the deployment workflow and give you a public URL (e.g. `https://<your-username>.github.io/<repo-name>/`).

---

## ✨ Features

- **10/10 Form Fields Extracted**:
  1. Farmer ID
  2. Farmer Name (English & Devanagari/Marathi)
  3. Identifier Name (Father/Husband in English & Devanagari)
  4. Date of Birth (DOB) & Age
  5. Gender
  6. Caste Category
  7. Mobile Number
  8. Land Details (Total Area, Gat/Survey No, Village, Sub-district, District, State)
  9. Address
  10. **Auto-Cropped Farmer Photo**
- **100% In-Browser WebAssembly**:
  - `pdfjs-dist`: High-resolution canvas rendering of PDF pages in browser memory.
  - `tesseract.js`: WebAssembly OCR running inside client-side web workers with English + Marathi language packs.
  - **Dynamic Photo Cropping**: Uses HTML5 Canvas pixel scanning to locate the photo bounding box below the "Farmer Photograph" header, trimming whitespace margins.
- **Official Farmer ID Card Generator**:
  - Matches the Government of India / AgriStack Kisan Pehchan Patra specification.
  - Generates verified QR codes.
  - Exports both **High-Resolution PNG** and **Print-Ready CR80 Vector PDF**.
- **Instant Demo**: Click **"Try Sample Form"** on the site to test extraction and card generation in 1 click.

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ & npm

### Setup & Run
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production (outputs to /dist)
npm run build
```

---

## 📂 Repository Structure

```
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions deployment to GitHub Pages
├── src/
│   ├── components/         # React UI Components (Header, DropZone, Form, Modal)
│   ├── lib/
│   │   ├── pdfExtractor.ts # PDF.js + Tesseract.js WASM + Photo Cropper
│   │   ├── cardGenerator.ts# Canvas ID Card Renderer (PNG + PDF)
│   │   └── sampleData.ts   # Pre-embedded sample AgriStack record
│   ├── App.tsx             # Main Application Logic
│   └── types.ts            # TypeScript Definitions
├── dist/                   # Compiled, production-ready static bundle
├── data/                   # Sample AgriStack Registration PDF & Card Reference
│   ├── 27_490_4187_555391_006318_261104222058.pdf
│   └── image.png
├── PyApp/                  # The Python / Flask / Docker backend version
├── package.json
└── vite.config.ts          # Configured with relative base './' for GitHub Pages
```
