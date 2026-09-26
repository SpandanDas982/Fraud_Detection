"""
Base extractor interfaces for Evidence Ledger.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from evidence_ledger.contracts.models import ExtractionProviderResult, MediaType


class EvidenceExtractor(ABC):
    """Boundary interface for multimodal candidate fact extraction."""

    @abstractmethod
    def extract(
        self,
        case_id: str,
        source_id: str,
        media_type: MediaType,
        content_bytes: bytes,
        filename: str,
    ) -> ExtractionProviderResult:
        """Extracts candidate observations from source bytes."""
        raise NotImplementedError


class SpeechTranscriber(ABC):
    """Boundary interface for speech-to-text transcription."""

    @abstractmethod
    def transcribe(self, audio_bytes: bytes, filename: str) -> dict[str, Any]:
        """
        Transcribes audio into text and segments.
        Returns:
            {"transcript": str, "language_code": str, "segments": list[dict[str, Any]]}
        """
        raise NotImplementedError
