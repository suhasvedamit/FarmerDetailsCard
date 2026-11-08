# Farmer ID Details Summary Card 🌾🇮🇳

> **Client-Side Web Application & Tools for extracting and summarizing AgriStack Farmer Registration Records into official Kisan Pehchan Patra format.**

🌐 **Live GitHub Pages URL**: [https://suhasvedamit.github.io/FarmerDetailsCard/](https://suhasvedamit.github.io/FarmerDetailsCard/)

---

## 🚀 Live Demo & Web App

The React + TypeScript + WebAssembly web application is hosted on **GitHub Pages**:
- **URL**: `https://suhasvedamit.github.io/FarmerDetailsCard/`
- **100% Client-Side & Private**: Runs entirely in the user's browser using WebAssembly OCR (`tesseract.js`) and `pdfjs-dist`. Documents never leave the user's machine.
- **Zero Backend Required**: Automated deployment via GitHub Actions on push to `main`.

---

## 📂 Project Structure

```
.
├── Webapp/                 # React 18 + TypeScript + Vite + Tailwind CSS (GitHub Pages source)
│   ├── src/                # UI components, PDF extraction engine, canvas card generator
│   ├── public/             # Sample PDF documents and assets
│   ├── package.json        # Dependencies (pdfjs-dist, tesseract.js, jspdf, qrcode)
│   └── vite.config.ts      # Configured with relative base path './' for GitHub Pages
├── PyApp/                  # Alternative Python / Flask backend application
│   ├── app.py              # Flask server
│   ├── extractor.py        # PDF extraction & OCR engine
│   └── card_generator.py   # Card generation
├── data/                   # Sample AgriStack Registration records
└── .github/workflows/
    └── deploy.yml          # GitHub Actions workflow for automated GitHub Pages deployment
```

---

## 🛠️ Local Development

### Running the Web App

```bash
cd Webapp
npm install
npm run dev
```

To test the production build locally:

```bash
npm run build
npm run preview
```

---

## ⚙️ GitHub Pages Deployment

The repository includes an automated GitHub Actions workflow (`.github/workflows/deploy.yml`).

### Enabling GitHub Pages:
1. Go to **Settings** > **Pages** in this repository.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Any push to `main` will automatically build the web application and deploy it live.

