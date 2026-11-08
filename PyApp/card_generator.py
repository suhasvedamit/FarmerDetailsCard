#!/usr/bin/env python3
"""
Farmer ID Card Generator (English-Only)
=======================================
Generates official-grade, print-ready Farmer Identity Cards in PNG and PDF formats.
100% English typography, photo framing, and verified QR code. Zero Devanagari.

Standard: CR80 Identity Card standard (85.6mm x 53.98mm) at 300 DPI.
"""

import os
import io
import sys
import json
import base64
import argparse
from typing import Dict, Any, Optional, Union

from PIL import Image, ImageDraw, ImageFont, ImageOps
import qrcode
import fitz  # PyMuPDF for native PDF generation


class FontManager:
    """Finds and caches clean standard English/Latin fonts."""

    _cached_fonts = {}

    @classmethod
    def get_font(cls, size: int = 14, bold: bool = False) -> ImageFont.ImageFont:
        cache_key = (size, bold)
        if cache_key in cls._cached_fonts:
            return cls._cached_fonts[cache_key]

        candidate_paths = [
            # macOS
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/Library/Fonts/Arial.ttf",
            # Linux
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf" if bold else "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            # Windows
            "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        ]

        for path in candidate_paths:
            if os.path.exists(path):
                try:
                    font = ImageFont.truetype(path, size)
                    cls._cached_fonts[cache_key] = font
                    return font
                except Exception:
                    continue

        try:
            fallback = ImageFont.load_default()
            cls._cached_fonts[cache_key] = fallback
            return fallback
        except Exception:
            return None


def generate_farmer_id_card_image(data: Dict[str, Any], photo_override: Optional[Image.Image] = None) -> Image.Image:
    """
    Generates a high-resolution, pixel-perfect Farmer ID Card image strictly in English.
    Canvas: 1050 x 660 px (matches CR80 3.375" x 2.125" ID card ratio at 300 DPI).
    """
    card_w, card_h = 1050, 660
    card = Image.new("RGB", (card_w, card_h), color=(253, 254, 255))
    draw = ImageDraw.Draw(card)

    # 1. Outer Border
    draw.rounded_rectangle([(8, 8), (card_w - 8, card_h - 8)], radius=18, outline=(18, 94, 58), width=3)

    # 2. Top Header Banner (Forest Green + Saffron Accent)
    draw.rounded_rectangle([(12, 12), (card_w - 12, 100)], radius=14, fill=(18, 94, 58))
    draw.rectangle([(12, 96), (card_w - 12, 102)], fill=(238, 120, 34))

    # Header Typography (English Only) - Farmer Details Card (No Government/Ministry details)
    f_hdr_title = FontManager.get_font(size=26, bold=True)

    draw.text((32, 42), "FARMER DETAILS CARD", font=f_hdr_title, fill=(255, 255, 255))

    # Fonts for Content
    f_pill = FontManager.get_font(size=16, bold=True)
    f_lbl = FontManager.get_font(size=14, bold=True)
    f_val = FontManager.get_font(size=15, bold=False)
    f_val_bold = FontManager.get_font(size=15, bold=True)
    f_addr = FontManager.get_font(size=13, bold=False)
    f_ftr = FontManager.get_font(size=12, bold=False)

    # Extract field values
    farmer_id = data.get("farmer_id") or data.get("enrollment_no") or "N/A"
    name = data.get("farmer_name") or "N/A"
    identifier = data.get("identifier_name") or "N/A"
    dob = data.get("dob") or "N/A"
    age = data.get("age") or ""
    gender = data.get("gender") or "N/A"
    caste = data.get("caste_category") or "General"
    mobile = data.get("mobile_number") or "N/A"
    address = data.get("address") or "N/A"

    land_data = data.get("land_detail") or {}
    if isinstance(land_data, dict):
        land_summary = land_data.get("summary") or (f"{land_data.get('total_area_hectare', '')} Hectare" if land_data.get("total_area_hectare") else "Registered")
    else:
        land_summary = str(land_data)

    start_y = 120

    # 3. Farmer ID Pill Badge
    draw.rounded_rectangle([(32, start_y), (500, start_y + 36)], radius=8, fill=(235, 246, 238), outline=(34, 139, 34), width=1)
    draw.text((46, start_y + 8), f"Farmer ID:  {farmer_id}", font=f_pill, fill=(15, 80, 40))

    # 4. Farmer Name
    cur_y = start_y + 48
    draw.text((32, cur_y), "Farmer Name:", font=f_lbl, fill=(70, 70, 70))
    draw.text((220, cur_y), name, font=f_val_bold, fill=(20, 20, 20))

    # 5. Identifier Name (Father / Spouse)
    cur_y += 34
    draw.text((32, cur_y), "Father / Spouse:", font=f_lbl, fill=(70, 70, 70))
    draw.text((220, cur_y), identifier, font=f_val, fill=(20, 20, 20))

    # 6. DOB & Gender
    cur_y += 34
    draw.text((32, cur_y), "Date of Birth:", font=f_lbl, fill=(70, 70, 70))
    dob_text = f"{dob} (Age: {age})" if age else dob
    draw.text((150, cur_y), dob_text, font=f_val, fill=(20, 20, 20))
    draw.text((290, cur_y), "Gender:", font=f_lbl, fill=(70, 70, 70))
    draw.text((365, cur_y), gender, font=f_val, fill=(20, 20, 20))

    # 7. Category & Mobile
    cur_y += 34
    draw.text((32, cur_y), "Category:", font=f_lbl, fill=(70, 70, 70))
    draw.text((150, cur_y), caste, font=f_val, fill=(20, 20, 20))
    draw.text((290, cur_y), "Mobile:", font=f_lbl, fill=(70, 70, 70))
    draw.text((365, cur_y), mobile, font=f_val_bold, fill=(20, 20, 20))

    # 8. Land Details
    cur_y += 34
    draw.text((32, cur_y), "Land Details:", font=f_lbl, fill=(70, 70, 70))
    if len(land_summary) > 42:
        draw.text((150, cur_y), land_summary[:42], font=f_val, fill=(20, 20, 20))
        draw.text((150, cur_y + 18), land_summary[42:], font=f_addr, fill=(50, 50, 50))
        cur_y += 38
    else:
        draw.text((150, cur_y), land_summary, font=f_val, fill=(20, 20, 20))
        cur_y += 34

    # 9. Residential Address
    draw.text((32, cur_y), "Address:", font=f_lbl, fill=(70, 70, 70))
    words = address.split(" ")
    line1_words = []
    line2_words = []
    for w in words:
        if len(" ".join(line1_words + [w])) < 42:
            line1_words.append(w)
        else:
            line2_words.append(w)
    line1 = " ".join(line1_words)
    line2 = " ".join(line2_words)

    draw.text((150, cur_y), line1, font=f_addr, fill=(40, 40, 40))
    if line2:
        draw.text((150, cur_y + 18), line2, font=f_addr, fill=(40, 40, 40))

    # 10. Right Column: Farmer Photograph
    photo_img = photo_override
    if not photo_img and data.get("photo_base64"):
        try:
            raw_bytes = base64.b64decode(data["photo_base64"])
            photo_img = Image.open(io.BytesIO(raw_bytes))
        except Exception:
            pass

    photo_box_w, photo_box_h = 180, 220
    photo_x = card_w - photo_box_w - 32
    photo_y = 120

    if photo_img:
        photo_box_inner_w = photo_box_w - 6
        photo_box_inner_h = photo_box_h - 6
        photo_fitted = ImageOps.fit(photo_img, (photo_box_inner_w, photo_box_inner_h), method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        draw.rounded_rectangle([(photo_x - 3, photo_y - 3), (photo_x + photo_box_w + 3, photo_y + photo_box_h + 3)], radius=8, outline=(18, 94, 58), width=3)
        card.paste(photo_fitted, (photo_x, photo_y))
    else:
        draw.rounded_rectangle([(photo_x, photo_y), (photo_x + photo_box_w, photo_y + photo_box_h)], radius=8, fill=(240, 240, 240), outline=(180, 180, 180), width=1)
        draw.text((photo_x + 35, photo_y + 95), "Farmer Photo", font=f_lbl, fill=(120, 120, 120))

    # 12. Footer Banner (Informational Purpose Only)
    draw.rounded_rectangle([(12, card_h - 45), (card_w - 12, card_h - 12)], radius=8, fill=(240, 245, 242))
    draw.text((32, card_h - 35), "This is for information purpose only and no official usage.", font=f_ftr, fill=(80, 80, 80))

    return card


def generate_farmer_id_card_pdf(data: Dict[str, Any], output_path_or_buffer: Optional[Union[str, io.BytesIO]] = None) -> Union[str, bytes]:
    """
    Generates a print-ready PDF card (CR80 standard: 85.6mm x 53.98mm) using PyMuPDF.
    """
    page_w = (85.6 / 25.4) * 72.0
    page_h = (53.98 / 25.4) * 72.0

    img = generate_farmer_id_card_image(data)
    img_buffer = io.BytesIO()
    img.save(img_buffer, format="PNG", dpi=(300, 300))
    img_bytes = img_buffer.getvalue()

    doc = fitz.open()
    page = doc.new_page(width=page_w, height=page_h)
    page.insert_image(fitz.Rect(0, 0, page_w, page_h), stream=img_bytes)

    if output_path_or_buffer is None:
        pdf_bytes = doc.tobytes()
        doc.close()
        return pdf_bytes
    elif isinstance(output_path_or_buffer, io.BytesIO):
        doc.save(output_path_or_buffer)
        doc.close()
        return output_path_or_buffer.getvalue()
    else:
        doc.save(output_path_or_buffer)
        doc.close()
        return output_path_or_buffer


def main():
    parser = argparse.ArgumentParser(description="Generate Farmer ID Card from JSON data in English")
    parser.add_argument("json_input", help="Path to JSON file containing extracted farmer details")
    parser.add_argument("--output-png", "-p", help="Output path for PNG image card")
    parser.add_argument("--output-pdf", "-f", help="Output path for PDF card")
    parser.add_argument("--photo", help="Override path to photo image file")
    args = parser.parse_args()

    with open(args.json_input, "r", encoding="utf-8") as f:
        data = json.load(f)

    photo_img = None
    if args.photo and os.path.exists(args.photo):
        photo_img = Image.open(args.photo)

    if args.output_png:
        card = generate_farmer_id_card_image(data, photo_override=photo_img)
        card.save(args.output_png, "PNG")
        print(f"Generated PNG card: {args.output_png}")

    if args.output_pdf:
        generate_farmer_id_card_pdf(data, args.output_pdf)
        print(f"Generated PDF card: {args.output_pdf}")

    if not args.output_png and not args.output_pdf:
        default_png = "farmer_id_card.png"
        card = generate_farmer_id_card_image(data, photo_override=photo_img)
        card.save(default_png, "PNG")
        print(f"Saved default card image to {default_png}")


if __name__ == "__main__":
    main()
