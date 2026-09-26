"""
PDF ingestion using PyMuPDF (fitz) for Evidence Ledger.

Conforms to docs/AI_LLM.md:
- Extracts page text when selectable text is present and routes to Nova Micro.
- Renders page to high-quality image when text is absent or layout-only and routes to Nova Lite.
- Links extracted observations to exact page number and text anchors.
"""

from __future__ import annotations

import logging

import fitz  # PyMuPDF

from evidence_ledger.contracts.models import (
    ExtractionObservationResult,
    ExtractionProviderResult,
)
from evidence_ledger.extractors.nova import NovaExtractor

logger = logging.getLogger(__name__)


class PdfProcessor:
    def __init__(self, nova_extractor: NovaExtractor | None = None) -> None:
        self._nova = nova_extractor or NovaExtractor()

    def process_pdf(
        self,
        case_id: str,
        source_id: str,
        pdf_bytes: bytes,
        filename: str,
    ) -> tuple[ExtractionProviderResult, int]:
        """
        Parses PDF bytes, routing each page appropriately.
        Returns combined ExtractionProviderResult and page count.
        """
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        except Exception as e:
            logger.error("Failed to open PDF %s: %e", filename, e)
            return (
                ExtractionProviderResult(
                    source_id=source_id,
                    observations=[],
                    warnings=[f"Failed to parse PDF document: {str(e)}"],
                ),
                0,
            )

        page_count = len(doc)
        all_observations: list[ExtractionObservationResult] = []
        warnings: list[str] = []

        for page_idx in range(page_count):
            page_num = page_idx + 1
            page = doc[page_idx]
            page_text = page.get_text().strip()

            if len(page_text) > 40:
                # Usable text present -> Nova Micro
                res = self._nova.extract_text(
                    text_content=page_text,
                    source_id=source_id,
                    locator_prefix=f"page_{page_num}",
                )
            else:
                # Scanned or image-only page -> render to PNG and route to Nova Lite
                pix = page.get_pixmap(dpi=150)
                img_bytes = pix.tobytes("png")
                res = self._nova.extract_image(
                    image_bytes=img_bytes,
                    filename=f"{filename}_page_{page_num}.png",
                    source_id=source_id,
                )

            # Tag observations with page number
            for obs in res.observations:
                obs.locator["page"] = page_num
                all_observations.append(obs)

            if res.warnings:
                warnings.extend(res.warnings)

        return (
            ExtractionProviderResult(
                source_id=source_id,
                observations=all_observations,
                warnings=warnings,
            ),
            page_count,
        )
