"""
Unit tests for API Router, S3 Processing Handler, and Export Handler.
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock

from evidence_ledger.contracts.models import (
    CaseMode,
    CaseStatus,
    CaseSummary,
    Export,
    ExportFormat,
    ExportStatus,
    MediaType,
    Observation,
    ReviewStatus,
    Source,
    SourceStatus,
)
from evidence_ledger.handlers.api import ApiRouter
from evidence_ledger.handlers.export import ExportHandler
from evidence_ledger.handlers.processing import ProcessingHandler


def test_api_create_and_get_case() -> None:
    mock_dynamo = MagicMock()
    mock_s3 = MagicMock()
    router = ApiRouter(dynamo_repo=mock_dynamo, s3_repo=mock_s3)

    # 1. POST /cases
    event = {
        "rawPath": "/v1/cases",
        "requestContext": {"http": {"method": "POST", "path": "/v1/cases"}},
        "body": json.dumps({"safe_title": "Test Impersonation Case", "mode": "mock"}),
    }
    mock_dynamo.create_case.side_effect = lambda case: case
    resp = router.handle(event)
    assert resp["statusCode"] == 201
    body = json.loads(resp["body"])
    assert body["safe_title"] == "Test Impersonation Case"
    assert body["case_id"].startswith("case_")

    # 2. GET /cases/{id}
    case_id = body["case_id"]
    mock_dynamo.get_case.return_value = CaseSummary(
        case_id=case_id,
        safe_title="Test Impersonation Case",
        status=CaseStatus.draft,
        mode=CaseMode.mock,
    )
    get_event = {
        "rawPath": f"/v1/cases/{case_id}",
        "requestContext": {"http": {"method": "GET", "path": f"/v1/cases/{case_id}"}},
    }
    get_resp = router.handle(get_event)
    assert get_resp["statusCode"] == 200
    get_body = json.loads(get_resp["body"])
    assert get_body["case_id"] == case_id


def test_api_upload_intent_and_text_source() -> None:
    mock_dynamo = MagicMock()
    mock_s3 = MagicMock()
    mock_s3.generate_presigned_upload.return_value = {
        "method": "PUT",
        "url": "https://s3.example.com/presigned",
        "headers": {"Content-Type": "image/png"},
        "expires_at": "2026-09-26T15:00:00Z",
        "s3_key": "cases/c1/raw/s1/receipt.png",
    }
    mock_s3.raw_key.return_value = "cases/c1/raw/s2/note.txt"
    mock_s3.compute_sha256.return_value = "abc123"
    router = ApiRouter(dynamo_repo=mock_dynamo, s3_repo=mock_s3)

    # Upload Intent
    intent_event = {
        "rawPath": "/v1/cases/c1/sources/upload-intent",
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps(
            {
                "filename": "receipt.png",
                "media_type": "image/png",
                "size_bytes": 1024,
            }
        ),
    }
    mock_dynamo.find_source_by_sha256.return_value = None
    resp = router.handle(intent_event)
    assert resp["statusCode"] == 201
    body = json.loads(resp["body"])
    assert "upload" in body
    assert body["upload"]["url"] == "https://s3.example.com/presigned"

    # Text Source
    text_event = {
        "rawPath": "/v1/cases/c1/sources/text",
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps(
            {
                "safe_label": "Chat snippet",
                "text": "Sent Rs 5000 to user",
            }
        ),
    }
    t_resp = router.handle(text_event)
    assert t_resp["statusCode"] == 201


def test_api_patch_observation_review() -> None:
    mock_dynamo = MagicMock()
    mock_s3 = MagicMock()
    router = ApiRouter(dynamo_repo=mock_dynamo, s3_repo=mock_s3)

    updated_obs = Observation(
        observation_id="obs_01",
        case_id="case_01",
        source_id="src_01",
        event_type="payment",
        extraction_method="mock",
        review_status=ReviewStatus.reviewed,
        version=2,
    )
    mock_dynamo.patch_observation_review.return_value = updated_obs

    event = {
        "rawPath": "/v1/cases/case_01/observations/obs_01",
        "requestContext": {"http": {"method": "PATCH"}},
        "body": json.dumps(
            {
                "expected_version": 1,
                "field_reviews": [
                    {"field": "amount", "action": "accept"},
                ],
            }
        ),
    }
    resp = router.handle(event)
    assert resp["statusCode"] == 200
    body = json.loads(resp["body"])
    assert body["review_status"] == "reviewed"
    assert body["version"] == 2


def test_processing_handler_s3_event() -> None:
    mock_dynamo = MagicMock()
    mock_s3 = MagicMock()
    handler = ProcessingHandler(dynamo_repo=mock_dynamo, s3_repo=mock_s3, use_mock=True)

    src = Source(
        source_id="src_01",
        case_id="case_01",
        media_type=MediaType.image,
        safe_filename="payment.png",
        status=SourceStatus.queued,
    )
    mock_dynamo.get_source.return_value = src
    mock_dynamo.get_case.return_value = CaseSummary(
        case_id="case_01", safe_title="Demo", mode=CaseMode.mock
    )
    mock_dynamo.list_sources.return_value = ([src], None)
    mock_dynamo.list_observations.return_value = ([], None)
    mock_dynamo.list_flags.return_value = []
    mock_s3.get_object_bytes.return_value = b"fake image bytes"
    mock_s3.compute_sha256.return_value = "fake_sha_256_hash_value"

    s3_event = {
        "Records": [
            {
                "s3": {
                    "bucket": {"name": "test-bucket"},
                    "object": {"key": "cases/case_01/raw/src_01/payment.png"},
                }
            }
        ]
    }

    result = handler.process_s3_event(s3_event)
    assert result["processed_count"] == 1
    # Check that observations and sources were saved
    assert mock_dynamo.put_observation.called
    assert mock_dynamo.put_source.called


def test_export_handler_execution() -> None:
    mock_dynamo = MagicMock()
    mock_s3 = MagicMock()
    handler = ExportHandler(dynamo_repo=mock_dynamo, s3_repo=mock_s3)

    mock_exp = Export(
        export_id="exp_01",
        case_id="case_01",
        format=ExportFormat.csv,
        status=ExportStatus.processing,
    )
    mock_dynamo.get_export.return_value = mock_exp
    mock_dynamo.get_case.return_value = CaseSummary(case_id="case_01", safe_title="Demo")
    mock_dynamo.list_sources.return_value = ([], None)
    mock_dynamo.list_observations.return_value = ([], None)
    mock_dynamo.list_flags.return_value = []
    mock_dynamo.list_links.return_value = []
    mock_s3.export_key.return_value = "cases/case_01/exports/exp_01/timeline.csv"
    mock_s3.compute_sha256.return_value = "csv_sha"

    res = handler.process_export("case_01", "exp_01")
    assert res["status"] == "ready"
    assert mock_s3.put_object_bytes.called
    assert mock_dynamo.put_export.called


def test_api_cors_preflight_and_headers() -> None:
    mock_dynamo = MagicMock()
    mock_s3 = MagicMock()
    router = ApiRouter(dynamo_repo=mock_dynamo, s3_repo=mock_s3)

    # 1. OPTIONS preflight
    options_event = {
        "rawPath": "/v1/cases",
        "requestContext": {"http": {"method": "OPTIONS", "path": "/v1/cases"}},
        "headers": {"origin": "https://fraud-detection-demo.vercel.app"},
    }
    resp = router.handle(options_event)
    assert resp["statusCode"] == 200
    headers = resp["headers"]
    assert headers["Access-Control-Allow-Origin"] == "https://fraud-detection-demo.vercel.app"
    assert "OPTIONS" in headers["Access-Control-Allow-Methods"]
    assert "PUT" in headers["Access-Control-Allow-Methods"]
    assert "PATCH" in headers["Access-Control-Allow-Methods"]
    assert "Idempotency-Key" in headers["Access-Control-Allow-Headers"]
    assert headers["Access-Control-Allow-Credentials"] == "true"
    assert headers["Vary"] == "Origin"

    # 2. 404 Route Not Found still returns CORS headers
    not_found_event = {
        "rawPath": "/v1/unknown_route",
        "requestContext": {"http": {"method": "GET"}},
        "headers": {"Origin": "http://localhost:5173"},
    }
    err_resp = router.handle(not_found_event)
    assert err_resp["statusCode"] == 404
    assert err_resp["headers"]["Access-Control-Allow-Origin"] == "http://localhost:5173"


def test_api_path_normalization() -> None:
    mock_dynamo = MagicMock()
    mock_s3 = MagicMock()
    router = ApiRouter(dynamo_repo=mock_dynamo, s3_repo=mock_s3)

    # Route with trailing slash /v1/cases/ should normalize and create case
    event = {
        "rawPath": "/v1/cases/",
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({"safe_title": "Trailing Slash Case"}),
    }
    mock_dynamo.create_case.side_effect = lambda case: case
    resp = router.handle(event)
    assert resp["statusCode"] == 201

    # Route without /v1 prefix (/cases) should also work
    event_no_v1 = {
        "rawPath": "/cases",
        "requestContext": {"http": {"method": "POST"}},
        "body": json.dumps({"safe_title": "No v1 Prefix Case"}),
    }
    resp_no_v1 = router.handle(event_no_v1)
    assert resp_no_v1["statusCode"] == 201

