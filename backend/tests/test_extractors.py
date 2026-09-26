"""
Unit tests for extractors and ingestion modules.
"""

from __future__ import annotations

from unittest.mock import MagicMock

import fitz  # PyMuPDF

from evidence_ledger.contracts.models import MediaType
from evidence_ledger.extractors.mock import MockEvidenceExtractor, MockSpeechTranscriber
from evidence_ledger.extractors.nova import NovaExtractor
from evidence_ledger.ingestion.pdf import PdfProcessor


def test_mock_evidence_extractor_scenarios() -> None:
    extractor = MockEvidenceExtractor()

    # Normal payment
    res1 = extractor.extract(
        case_id="c1",
        source_id="s1",
        media_type=MediaType.image,
        content_bytes=b"dummy",
        filename="payment_screenshot.png",
    )
    assert len(res1.observations) == 1
    obs1 = res1.observations[0]
    assert obs1.event_type == "payment_notification"
    assert obs1.fields["amount"].candidate == "5000.00"

    # Discrepancy scenario
    res2 = extractor.extract(
        case_id="c1",
        source_id="s2",
        media_type=MediaType.image,
        content_bytes=b"dummy",
        filename="statement_discrepancy.png",
    )
    assert res2.observations[0].fields["amount"].candidate == "4500.00"


def test_mock_speech_transcriber() -> None:
    transcriber = MockSpeechTranscriber()
    res = transcriber.transcribe(b"dummy_audio", "call_recording.mp3")
    assert "five thousand rupees" in res["transcript"]
    assert len(res["segments"]) == 1
    assert res["segments"][0]["start_ms"] == 500


def test_nova_extractor_mock_bedrock() -> None:
    mock_bedrock = MagicMock()
    mock_bedrock.converse.return_value = {
        "output": {
            "message": {
                "content": [
                    {
                        "text": """
                        {
                          "schema_version": "1.0",
                          "source_id": "src_99",
                          "observations": [
                            {
                              "event_type": "bank_sms",
                              "locator": {"region": "sms text", "anchor": "Rs 2000 debited"},
                              "fields": {
                                "amount": {"raw": "Rs 2000", "candidate": "2000.00", "confidence": 0.95}
                              },
                              "assumptions": []
                            }
                          ],
                          "warnings": []
                        }
                        """
                    }
                ]
            }
        }
    }

    nova = NovaExtractor(client=mock_bedrock)
    res = nova.extract_text("Rs 2000 debited from account", source_id="src_99")
    assert res.source_id == "src_99"
    assert len(res.observations) == 1
    assert res.observations[0].event_type == "bank_sms"


def test_pdf_processor_with_mock_nova() -> None:
    # Create an in-memory 1-page PDF using PyMuPDF
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text(
        (50, 72),
        "Payment Receipt: Transferred INR 5000.00 to merchant ID M12345.",
        fontsize=12,
    )
    pdf_bytes = doc.tobytes()
    doc.close()

    mock_nova = MagicMock()
    mock_res = MockEvidenceExtractor().extract("c1", "s1", MediaType.pdf, b"", "receipt.pdf")
    mock_nova.extract_text.return_value = mock_res

    processor = PdfProcessor(nova_extractor=mock_nova)
    result, page_count = processor.process_pdf("c1", "s1", pdf_bytes, "receipt.pdf")

    assert page_count == 1
    assert len(result.observations) == 1
    assert result.observations[0].locator["page"] == 1


def test_sarvam_stt_transcriber() -> None:
    from evidence_ledger.extractors.sarvam import SarvamSTTTranscriber

    transcriber = SarvamSTTTranscriber(api_key="test_key")
    mock_resp = MagicMock()
    mock_resp.transcript = "Please send five thousand rupees to account"
    mock_resp.language_code = "en-IN"
    mock_word1 = MagicMock()
    mock_word1.start_time = 0.5
    mock_word2 = MagicMock()
    mock_word2.end_time = 3.2
    mock_resp.timestamps = MagicMock()
    mock_resp.timestamps.words = [mock_word1, mock_word2]

    transcriber._client = MagicMock()
    transcriber._client.speech_to_text.transcribe.return_value = mock_resp

    res = transcriber.transcribe(b"dummy_audio_bytes", "call.mp3")
    assert res["transcript"] == "Please send five thousand rupees to account"
    assert res["language_code"] == "en-IN"
    assert len(res["segments"]) == 1
    assert res["segments"][0]["start_ms"] == 500
    assert res["segments"][0]["end_ms"] == 3200

