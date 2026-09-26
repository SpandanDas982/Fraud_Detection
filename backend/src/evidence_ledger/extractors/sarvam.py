"""
Sarvam AI Speech-to-Text adapter for Evidence Ledger.

Conforms to docs/AI_LLM.md:
- Uses official sarvamai SDK (SpeechToText with model='saaras:v4').
- Supports audio input in any format (wav, mp3, aac, m4a, ogg, etc.).
- Converts/transcribes speech to English per user specification.
- Captures segments with start/end millisecond timestamps.
- Treats transcripts as sensitive evidence (never logs raw text).
"""

from __future__ import annotations

import io
import logging
from typing import Any

from sarvamai import SarvamAI

from evidence_ledger.config import get_settings
from evidence_ledger.extractors.base import SpeechTranscriber

logger = logging.getLogger(__name__)


class SarvamSTTTranscriber(SpeechTranscriber):
    def __init__(self, api_key: str | None = None, endpoint: str | None = None) -> None:
        settings = get_settings()
        self._api_key = api_key or settings.sarvam_api_key
        self._client: SarvamAI | None = (
            SarvamAI(api_subscription_key=self._api_key) if self._api_key else None
        )

    def transcribe(self, audio_bytes: bytes, filename: str) -> dict[str, Any]:
        """
        Transcribes audio bytes using Sarvam STT SDK (model saaras:v4).
        Converts speech to English ('en-IN' or translated to English).
        """
        if not self._client or not self._api_key:
            logger.warning("SARVAM_API_KEY not configured. Returning empty transcript.")
            return {
                "transcript": "",
                "language_code": "unknown",
                "segments": [],
                "error": "SARVAM_API_KEY not configured",
            }

        try:
            file_obj = io.BytesIO(audio_bytes)
            file_obj.name = filename or "audio.wav"

            # Use saaras:v4 with mode="transcribe" or mode="translate" to English
            response = self._client.speech_to_text.transcribe(
                file=file_obj,
                model="saaras:v4",
                language_code="en-IN",
                mode="transcribe",
                with_timestamps=True,
            )

            transcript = response.transcript or ""
            language_code = response.language_code or "en-IN"
            segments: list[dict[str, Any]] = []

            # If word timestamps are provided, construct segment boundaries
            timestamps = getattr(response, "timestamps", None)
            words = getattr(timestamps, "words", None) if timestamps else None
            if words:
                start_ms = int(getattr(words[0], "start_time", 0.0) * 1000)
                end_ms = int(getattr(words[-1], "end_time", 0.0) * 1000)
                segments.append(
                    {
                        "text": transcript,
                        "start_ms": start_ms,
                        "end_ms": end_ms,
                    }
                )
            else:
                segments.append(
                    {
                        "text": transcript,
                        "start_ms": 0,
                        "end_ms": 0,
                    }
                )

            return {
                "transcript": transcript,
                "language_code": language_code,
                "segments": segments,
            }

        except Exception as e:
            logger.error("Sarvam transcription error: %s", e)
            return {
                "transcript": "",
                "language_code": "unknown",
                "segments": [],
                "error": str(e),
            }
