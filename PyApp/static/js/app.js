/**
 * AgriStack Farmer ID Card App
 * Resilient, fast vanilla JavaScript engine for upload, extraction, and card live updates.
 */

// Global state
let currentFarmerData = null;

// DOM Elements
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const sampleBtn = document.getElementById("sampleBtn");
const progressBox = document.getElementById("progressBox");
const progressBar = document.getElementById("progressBar");
const progressTitle = document.getElementById("progressTitle");
const progressSubtitle = document.getElementById("progressSubtitle");
const uploadCard = document.getElementById("uploadCard");
const resultsSection = document.getElementById("resultsSection");
const updateCardBtn = document.getElementById("updateCardBtn");
const resetBtn = document.getElementById("resetBtn");
const copyAllBtn = document.getElementById("copyAllBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const downloadPhotoBtn = document.getElementById("downloadPhotoBtn");

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  setupDragAndDrop();
  setupFileInput();
  setupSampleButton();
  setupActionButtons();
});

// Toast notification helper
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === "success" ? "✓" : "⚠️"}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 1-Click Copy helper
function copyField(fieldId) {
  const input = document.getElementById(fieldId);
  if (!input || !input.value) {
    showToast("Field is empty", "error");
    return;
  }
  navigator.clipboard.writeText(input.value).then(() => {
    showToast(`Copied: ${input.value}`);
  });
}

// Drag & Drop Setup
function setupDragAndDrop() {
  ["dragenter", "dragover"].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("dragover");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "application/pdf") {
      uploadFile(files[0]);
    } else {
      showToast("Please drop a valid PDF file", "error");
    }
  });
}

function setupFileInput() {
  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  });
}

function setupSampleButton() {
  sampleBtn.addEventListener("click", () => {
    loadSampleForm();
  });
}

function showProgress(title, subtitle, percent) {
  dropZone.style.display = "none";
  progressBox.style.display = "block";
  progressTitle.textContent = title;
  progressSubtitle.textContent = subtitle;
  progressBar.style.width = `${percent}%`;
}

function hideProgress() {
  progressBox.style.display = "none";
  dropZone.style.display = "block";
}

// Upload and Extract PDF
function uploadFile(file) {
  showProgress("Uploading PDF...", `Processing ${file.name}`, 20);

  const formData = new FormData();
  formData.append("file", file);

  // Animate progress
  let p = 25;
  const interval = setInterval(() => {
    if (p < 85) {
      p += 15;
      showProgress("Running Local OCR & Extraction...", "Scanning text blocks, cropping photograph...", p);
    }
  }, 400);

  fetch("/api/extract", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((result) => {
      clearInterval(interval);
      if (result.success) {
        showProgress("Done!", "Form extracted successfully", 100);
        setTimeout(() => {
          hideProgress();
          renderResults(result);
          showToast("Form details and photo extracted successfully!");
        }, 300);
      } else {
        hideProgress();
        showToast(result.error || "Extraction failed", "error");
      }
    })
    .catch((err) => {
      clearInterval(interval);
      hideProgress();
      showToast("Network or server error during extraction", "error");
    });
}

// Load Sample Form
function loadSampleForm() {
  showProgress("Loading Sample PDF...", "27_490_4187_555391_006318_261104222058.pdf", 35);

  fetch("/api/sample")
    .then((res) => res.json())
    .then((result) => {
      if (result.success) {
        showProgress("Finalizing...", "Rendering ID card preview", 100);
        setTimeout(() => {
          hideProgress();
          renderResults(result);
          showToast("Sample Farmer Registration Form loaded!");
        }, 300);
      } else {
        hideProgress();
        showToast(result.error || "Failed to load sample", "error");
      }
    })
    .catch(() => {
      hideProgress();
      showToast("Error loading sample file", "error");
    });
}

// Populate UI with extracted results
function renderResults(result) {
  const data = result.data;
  currentFarmerData = data;

  // Form Inputs
  document.getElementById("farmerId").value = data.farmer_id || "";
  document.getElementById("enrollmentNo").value = data.enrollment_no || "";
  document.getElementById("farmerName").value = data.farmer_name || "";
  document.getElementById("identifierName").value = data.identifier_name || "";
  document.getElementById("dob").value = data.dob || "";
  document.getElementById("age").value = data.age || "";
  document.getElementById("gender").value = data.gender || "Male";
  document.getElementById("casteCategory").value = data.caste_category || "General";
  document.getElementById("mobileNumber").value = data.mobile_number || "";

  // Land Details
  const land = data.land_detail || {};
  document.getElementById("landArea").value = land.total_area_hectare || "";
  document.getElementById("surveyNo").value = land.survey_gat_no || "";
  document.getElementById("village").value = land.village || "";
  document.getElementById("district").value = land.district || "";
  document.getElementById("state").value = land.state || "";

  // Address
  document.getElementById("address").value = data.address || "";
  document.getElementById("photoBase64").value = data.photo_base64 || "";

  // Photo & Meta Preview
  const photoThumb = document.getElementById("photoThumb");
  if (data.photo_url) {
    photoThumb.src = data.photo_url;
  } else {
    photoThumb.src = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22%3E%3Ctext y=%2226%22 font-size=%2224%22>👤</text></svg>";
  }

  document.getElementById("previewFarmerName").textContent = data.farmer_name || "Farmer";
  document.getElementById("previewFarmerId").textContent = `ID: ${data.farmer_id || "N/A"}`;
  document.getElementById("tagArea").textContent = land.total_area_hectare ? `${land.total_area_hectare} Hectare` : "Land Recorded";

  // ID Card Preview
  const idCardPreview = document.getElementById("idCardPreview");
  if (result.card_preview_url) {
    idCardPreview.src = result.card_preview_url;
  }

  // Set download links
  if (result.downloads) {
    const pngLink = document.getElementById("downloadCardPngBtn");
    const pdfLink = document.getElementById("downloadCardPdfBtn");
    pngLink.href = result.downloads.card_png;
    pngLink.download = `Farmer_ID_${data.farmer_id || "Card"}.png`;
    pdfLink.href = result.downloads.card_pdf;
    pdfLink.download = `Farmer_ID_${data.farmer_id || "Card"}.pdf`;
  }

  // Reveal results container with scroll
  resultsSection.style.display = "block";
  resultsSection.scrollIntoView({ behavior: "smooth" });
}

// Setup form and download actions
function setupActionButtons() {
  // Update & Re-render Card
  updateCardBtn.addEventListener("click", () => {
    syncFormToCard();
  });

  // Reset / Upload another
  resetBtn.addEventListener("click", () => {
    resultsSection.style.display = "none";
    dropZone.style.display = "block";
    fileInput.value = "";
    uploadCard.scrollIntoView({ behavior: "smooth" });
  });

  // Copy All Details
  copyAllBtn.addEventListener("click", () => {
    if (!currentFarmerData) return;
    const txt = `
AgriStack Farmer Details:
-------------------------
Farmer ID: ${document.getElementById("farmerId").value}
Farmer Name: ${document.getElementById("farmerName").value}
Identifier Name: ${document.getElementById("identifierName").value}
DOB / Age: ${document.getElementById("dob").value} (Age: ${document.getElementById("age").value})
Gender: ${document.getElementById("gender").value}
Category: ${document.getElementById("casteCategory").value}
Mobile: ${document.getElementById("mobileNumber").value}
Land: ${document.getElementById("landArea").value} Hectare (Gat No: ${document.getElementById("surveyNo").value}, ${document.getElementById("village").value}, ${document.getElementById("district").value}, ${document.getElementById("state").value})
Address: ${document.getElementById("address").value}
    `.trim();

    navigator.clipboard.writeText(txt).then(() => {
      showToast("All details copied to clipboard!");
    });
  });

  // Download Extracted Photo
  downloadPhotoBtn.addEventListener("click", () => {
    const base64 = document.getElementById("photoBase64").value;
    if (!base64) {
      showToast("No photo available", "error");
      return;
    }
    const a = document.createElement("a");
    a.href = `data:image/jpeg;base64,${base64}`;
    a.download = `farmer_photo_${document.getElementById("farmerId").value || "extracted"}.jpg`;
    a.click();
    showToast("Farmer photo downloaded!");
  });

  // Export JSON
  exportJsonBtn.addEventListener("click", () => {
    const payload = collectFormData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `farmer_${payload.farmer_id || "data"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("JSON exported!");
  });

  // Export CSV
  exportCsvBtn.addEventListener("click", () => {
    const payload = collectFormData();
    fetch("/api/export/csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `farmer_${payload.farmer_id || "record"}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("CSV exported!");
      })
      .catch(() => {
        showToast("Error generating CSV", "error");
      });
  });
}

// Collect all form inputs into a clean data object
function collectFormData() {
  const landArea = document.getElementById("landArea").value;
  const surveyNo = document.getElementById("surveyNo").value;
  const village = document.getElementById("village").value;
  const district = document.getElementById("district").value;
  const state = document.getElementById("state").value;

  const parts = [];
  if (surveyNo) parts.push(`Gat No: ${surveyNo}`);
  if (village) parts.push(village);
  if (district) parts.push(district);
  if (state) parts.push(state);

  const landSummary = landArea
    ? `${landArea} Hectare${parts.length ? ` (${parts.join(", ")})` : ""}`
    : parts.join(", ");

  return {
    farmer_id: document.getElementById("farmerId").value,
    enrollment_no: document.getElementById("enrollmentNo").value,
    farmer_name: document.getElementById("farmerName").value,
    identifier_name: document.getElementById("identifierName").value,
    dob: document.getElementById("dob").value,
    age: document.getElementById("age").value,
    gender: document.getElementById("gender").value,
    caste_category: document.getElementById("casteCategory").value,
    mobile_number: document.getElementById("mobileNumber").value,
    land_detail: {
      total_area_hectare: landArea,
      survey_gat_no: surveyNo,
      village: village,
      district: district,
      state: state,
      summary: landSummary,
    },
    address: document.getElementById("address").value,
    photo_base64: document.getElementById("photoBase64").value,
  };
}

// Sync modified form values back to server to re-render ID card
function syncFormToCard() {
  const payload = collectFormData();
  showToast("Updating ID Card...", "success");

  fetch("/api/generate-card", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.success) {
        document.getElementById("idCardPreview").src = res.card_preview_url;
        document.getElementById("previewFarmerName").textContent = payload.farmer_name;
        document.getElementById("previewFarmerId").textContent = `ID: ${payload.farmer_id}`;
        document.getElementById("tagArea").textContent = payload.land_detail.total_area_hectare
          ? `${payload.land_detail.total_area_hectare} Hectare`
          : "Land Recorded";

        if (res.downloads) {
          document.getElementById("downloadCardPngBtn").href = res.downloads.card_png;
          document.getElementById("downloadCardPdfBtn").href = res.downloads.card_pdf;
        }

        showToast("Farmer ID Card updated successfully!");
      } else {
        showToast(res.error || "Failed to update card", "error");
      }
    })
    .catch(() => {
      showToast("Error communicating with server", "error");
    });
}

