"""
Unit & Integration Tests for Farmer Form Extractor and App
==========================================================
Verifies that all 10 fields are accurately extracted and that
ID card generation and web endpoints function reliably.
"""

import os
import unittest
import json
import base64
from PIL import Image

from extractor import FarmerFormExtractor
from card_generator import generate_farmer_id_card_image, generate_farmer_id_card_pdf
from app import app


class TestFarmerExtraction(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sample_pdf = os.path.join(os.path.dirname(__file__), "data", "27_490_4187_555391_006318_261104222058.pdf")
        cls.extractor = FarmerFormExtractor()
        cls.client = app.test_client()

    def test_sample_pdf_exists(self):
        self.assertTrue(os.path.exists(self.sample_pdf), f"Sample PDF not found at {self.sample_pdf}")

    def test_10_fields_extraction(self):
        """Verify extraction of all 10 requested fields."""
        record = self.extractor.extract_from_pdf(self.sample_pdf, save_photo_dir="extracted_images")
        data = record.to_dict()

        # 1. Farmer ID
        self.assertEqual(data.get("farmer_id"), "77900535348", "Farmer ID must match 77900535348")

        # 2. Farmer Name (English)
        self.assertEqual(data.get("farmer_name"), "Ganesh Pandurang Shinde")

        # 3. Identifier Name (English)
        self.assertEqual(data.get("identifier_name"), "Pandurang Shinde")

        # 4. DOB
        self.assertEqual(data.get("dob"), "04/08/1987", "DOB must match 04/08/1987")
        self.assertEqual(data.get("age"), "39", "Age must match 39")

        # 5. Gender
        self.assertEqual(data.get("gender"), "Male", "Gender must be Male")

        # 6. Caste Category
        self.assertEqual(data.get("caste_category"), "General", "Category must be General")

        # 7. Mobile Number
        self.assertEqual(data.get("mobile_number"), "9552533470", "Mobile must match 9552533470")

        # 8. Land Details
        land = data.get("land_detail", {})
        self.assertEqual(land.get("total_area_hectare"), "0.72", "Total land area must match 0.72")
        self.assertEqual(land.get("district"), "PUNE", "District must match PUNE")
        self.assertEqual(land.get("state"), "MAHARASHTRA", "State must match MAHARASHTRA")

        # 9. Address
        addr = data.get("address", "")
        self.assertTrue(len(addr) > 20, "Address should be fully extracted")
        self.assertIn("Parshwa", addr, "Address should contain Parshwa Platinum")

        # 10. Photo
        self.assertTrue(bool(data.get("photo_base64")), "Farmer photo base64 must be populated")
        self.assertTrue(len(data.get("photo_base64")) > 1000, "Photo bytes should be non-trivial")

    def test_card_generation(self):
        """Verify generation of PNG and PDF ID cards."""
        record = self.extractor.extract_from_pdf(self.sample_pdf)
        data = record.to_dict()

        # PNG card
        img = generate_farmer_id_card_image(data)
        self.assertIsInstance(img, Image.Image)
        self.assertEqual(img.size, (1050, 660), "Card image size must be standard 1050x660")

        # PDF card
        os.makedirs("generated_cards", exist_ok=True)
        pdf_path = "generated_cards/test_card.pdf"
        res_path = generate_farmer_id_card_pdf(data, pdf_path)
        self.assertTrue(os.path.exists(res_path), "PDF card file must exist")
        self.assertTrue(os.path.getsize(res_path) > 10000, "PDF card must have valid size")

    def test_api_health(self):
        """Verify API health endpoint."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        body = json.loads(res.data)
        self.assertEqual(body.get("status"), "healthy")

    def test_api_sample(self):
        """Verify API sample endpoint."""
        res = self.client.get("/api/sample")
        self.assertEqual(res.status_code, 200)
        body = json.loads(res.data)
        self.assertTrue(body.get("success"))
        self.assertEqual(body["data"]["farmer_id"], "77900535348")

    def test_api_generate_card(self):
        """Verify API card generation endpoint."""
        payload = {
            "farmer_id": "77900535348",
            "farmer_name": "Ganesh Pandurang Shinde",
            "identifier_name": "Pandurang Shinde",
            "dob": "04/08/1987",
            "gender": "Male",
            "caste_category": "General",
            "mobile_number": "9552533470",
            "address": "Gat No- 1193/8, Flat No- 1001, Parshwa Platinum",
            "land_detail": {
                "total_area_hectare": "0.72",
                "summary": "0.72 Hectare, Village: Shindewadi, Junnar, PUNE, MAHARASHTRA"
            }
        }
        res = self.client.post("/api/generate-card", json=payload)
        self.assertEqual(res.status_code, 200)
        body = json.loads(res.data)
        self.assertTrue(body.get("success"))
        url = body.get("card_preview_url") or body.get("card_png_url", "")
        self.assertIn("data:image/png;base64,", url)


if __name__ == "__main__":
    unittest.main()
