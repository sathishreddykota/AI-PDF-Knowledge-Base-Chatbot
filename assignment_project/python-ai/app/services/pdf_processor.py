"""
PDF Processor Service
Extracts text from PDF files using pdfplumber (primary) with PyPDF fallback.
"""

import base64
import io
import logging

import pdfplumber
from pypdf import PdfReader

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_data_base64: str) -> list[dict]:
    """
    Extract text from a base64-encoded PDF file.

    Returns a list of dicts: [{ "page": 1, "text": "..." }, ...]
    Uses pdfplumber as primary extractor, falls back to PyPDF.
    """
    pdf_bytes = base64.b64decode(file_data_base64)
    pdf_file = io.BytesIO(pdf_bytes)

    pages = _extract_with_pdfplumber(pdf_file)

    # Fallback to PyPDF if pdfplumber returns empty results
    if not pages or all(not p["text"].strip() for p in pages):
        logger.info("pdfplumber returned empty results, falling back to PyPDF")
        pdf_file.seek(0)
        pages = _extract_with_pypdf(pdf_file)

    # Clean extracted text
    pages = [
        {"page": p["page"], "text": _clean_text(p["text"])}
        for p in pages
        if p["text"].strip()
    ]

    logger.info(f"Extracted text from {len(pages)} pages")
    return pages


def _extract_with_pdfplumber(pdf_file: io.BytesIO) -> list[dict]:
    """Extract text using pdfplumber."""
    pages = []
    try:
        with pdfplumber.open(pdf_file) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                pages.append({"page": i + 1, "text": text})
    except Exception as e:
        logger.error(f"pdfplumber extraction failed: {e}")
    return pages


def _extract_with_pypdf(pdf_file: io.BytesIO) -> list[dict]:
    """Extract text using PyPDF as fallback."""
    pages = []
    try:
        reader = PdfReader(pdf_file)
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            pages.append({"page": i + 1, "text": text})
    except Exception as e:
        logger.error(f"PyPDF extraction failed: {e}")
    return pages


def _clean_text(text: str) -> str:
    """Clean extracted text by normalizing whitespace."""
    # Replace multiple newlines with double newline
    import re
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Replace multiple spaces with single space
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()
