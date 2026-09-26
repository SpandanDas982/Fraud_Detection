"""
Unit tests for DynamoDB and S3 repositories.
"""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest
from botocore.exceptions import ClientError

from evidence_ledger.contracts.models import (
    CaseMode,
    CaseStatus,
    CaseSummary,
    FieldAction,
    FieldReview,
    FieldState,
    MediaType,
    ReviewStatus,
    Source,
    SourceStatus,
)
from evidence_ledger.repositories.dynamo_repo import (
    DynamoRepository,
    VersionConflictError,
)
from evidence_ledger.repositories.s3_repo import S3Repository


def test_create_case_and_get() -> None:
    mock_table = MagicMock()
    repo = DynamoRepository(table=mock_table)

    case = CaseSummary(
        case_id="case_01",
        safe_title="Test Case",
        status=CaseStatus.draft,
        mode=CaseMode.mock,
    )

    repo.create_case(case)
    mock_table.put_item.assert_called_once()
    call_args = mock_table.put_item.call_args[1]
    assert call_args["Item"]["PK"] == "CASE#case_01"
    assert call_args["Item"]["SK"] == "META"
    assert call_args["Item"]["entity_type"] == "case"

    # Simulate get_item
    mock_table.get_item.return_value = {
        "Item": {
            "PK": "CASE#case_01",
            "SK": "META",
            "case_id": "case_01",
            "safe_title": "Test Case",
            "status": "draft",
            "mode": "mock",
            "source_count": 0,
            "observation_count": 0,
            "reviewed_count": 0,
            "attention_count": 0,
            "unresolved_flag_count": 0,
            "retention_notice_version": "1.0",
            "schema_version": "1.0",
            "created_at": "2026-09-26T12:00:00Z",
            "updated_at": "2026-09-26T12:00:00Z",
            "version": 1,
        }
    }
    retrieved = repo.get_case("case_01")
    assert retrieved is not None
    assert retrieved.case_id == "case_01"
    assert retrieved.safe_title == "Test Case"


def test_create_case_conflict() -> None:
    mock_table = MagicMock()
    mock_table.put_item.side_effect = ClientError(
        {"Error": {"Code": "ConditionalCheckFailedException"}}, "put_item"
    )
    repo = DynamoRepository(table=mock_table)

    case = CaseSummary(case_id="case_01", safe_title="Duplicate")
    with pytest.raises(VersionConflictError):
        repo.create_case(case)


def test_put_source_and_list() -> None:
    mock_table = MagicMock()
    repo = DynamoRepository(table=mock_table)

    src = Source(
        source_id="src_01",
        case_id="case_01",
        media_type=MediaType.image,
        safe_filename="screenshot.png",
        sha256="abc1234567890abcdef",
        status=SourceStatus.ready,
    )

    repo.put_source(src)
    assert mock_table.put_item.called

    # Mock query response
    mock_table.query.return_value = {
        "Items": [
            {
                "PK": "CASE#case_01",
                "SK": "SOURCE#src_01",
                "source_id": "src_01",
                "case_id": "case_01",
                "media_type": "image",
                "safe_filename": "screenshot.png",
                "sha256": "abc1234567890abcdef",
                "status": "ready",
                "processing_attempts": 0,
                "schema_version": "1.0",
                "created_at": "2026-09-26T12:00:00Z",
                "updated_at": "2026-09-26T12:00:00Z",
                "version": 1,
            }
        ]
    }
    sources, cursor = repo.list_sources("case_01")
    assert len(sources) == 1
    assert sources[0].source_id == "src_01"
    assert sources[0].sha256_prefix == "abc12345"


def test_patch_observation_review() -> None:
    mock_table = MagicMock()
    repo = DynamoRepository(table=mock_table)

    # Mock existing observation
    mock_table.get_item.return_value = {
        "Item": {
            "PK": "CASE#case_01",
            "SK": "OBS#obs_01",
            "observation_id": "obs_01",
            "case_id": "case_01",
            "source_id": "src_01",
            "event_type": "payment",
            "review_status": "unreviewed",
            "extraction_method": "bedrock_nova_lite",
            "fields": {
                "amount": {
                    "raw_claimed_value": "₹5,000",
                    "normalized_candidate_value": "5000.00",
                    "state": "extracted",
                },
                "ref": {
                    "raw_claimed_value": "UPI12345",
                    "state": "extracted",
                },
            },
            "created_at": "2026-09-26T12:00:00Z",
            "version": 1,
        }
    }

    # Apply review
    field_reviews = [
        FieldReview(field="amount", action=FieldAction.accept),
        FieldReview(
            field="ref",
            action=FieldAction.correct,
            reviewed_value="UPI99999",
            note="Correction from receipt",
        ),
    ]

    updated = repo.patch_observation_review(
        case_id="case_01",
        observation_id="obs_01",
        expected_version=1,
        field_reviews=field_reviews,
        reviewed_by="analyst_1",
    )

    assert updated.review_status == ReviewStatus.reviewed
    assert updated.fields["amount"].state == FieldState.accepted
    assert updated.fields["ref"].state == FieldState.corrected
    assert updated.fields["ref"].reviewed_value == "UPI99999"
    assert updated.fields["ref"].reviewed_by == "analyst_1"


def test_s3_repo_keys_and_presigned() -> None:
    mock_client = MagicMock()
    mock_client.generate_presigned_url.return_value = "https://s3.example.com/upload"
    s3_repo = S3Repository(client=mock_client, bucket_name="test-bucket")

    upload_info = s3_repo.generate_presigned_upload(
        case_id="case_01",
        source_id="src_01",
        safe_filename="image.png",
        content_type="image/png",
    )

    assert upload_info["method"] == "PUT"
    assert upload_info["url"] == "https://s3.example.com/upload"
    assert upload_info["s3_key"] == "cases/case_01/raw/src_01/image.png"

    sha = s3_repo.compute_sha256(b"hello world")
    assert len(sha) == 64
