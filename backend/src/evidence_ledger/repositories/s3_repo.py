"""
S3 object storage repository for Evidence Ledger.

Manages raw evidence, derived pages/transcripts, and export artifacts.
Follows docs/DATABASE.md:
- cases/{case_id}/raw/{source_id}/{safe_filename}
- cases/{case_id}/derived/{source_id}/...
- cases/{case_id}/exports/{export_id}/...
"""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta
from typing import Any

from botocore.exceptions import ClientError

from evidence_ledger.config import get_s3_client, get_settings


class S3RepositoryError(Exception):
    """Base S3 repository exception."""


class S3Repository:
    def __init__(self, client: Any = None, bucket_name: str | None = None) -> None:
        self._client = client or get_s3_client()
        self._bucket = bucket_name or get_settings().s3_bucket_name
        self._expiry = get_settings().presigned_url_expiry_seconds

    @property
    def bucket_name(self) -> str:
        return self._bucket

    @staticmethod
    def compute_sha256(data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()

    @staticmethod
    def raw_key(case_id: str, source_id: str, safe_filename: str) -> str:
        return f"cases/{case_id}/raw/{source_id}/{safe_filename}"

    @staticmethod
    def derived_key(case_id: str, source_id: str, filename: str) -> str:
        return f"cases/{case_id}/derived/{source_id}/{filename}"

    @staticmethod
    def export_key(case_id: str, export_id: str, filename: str) -> str:
        return f"cases/{case_id}/exports/{export_id}/{filename}"

    def generate_presigned_upload(
        self,
        case_id: str,
        source_id: str,
        safe_filename: str,
        content_type: str,
        expires_in: int | None = None,
    ) -> dict[str, Any]:
        """
        Generates a short-lived presigned PUT URL for browser direct-to-S3 upload.
        Restricted to exact key and Content-Type.
        """
        expiry = expires_in or self._expiry
        s3_key = self.raw_key(case_id, source_id, safe_filename)

        try:
            url = self._client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": self._bucket,
                    "Key": s3_key,
                    "ContentType": content_type,
                },
                ExpiresIn=expiry,
            )
            expires_at = (datetime.now(UTC) + timedelta(seconds=expiry)).isoformat()
            return {
                "method": "PUT",
                "url": url,
                "headers": {"Content-Type": content_type},
                "expires_at": expires_at,
                "s3_key": s3_key,
            }
        except ClientError as e:
            raise S3RepositoryError(f"Failed to generate presigned upload: {e}") from e

    def generate_presigned_download(self, s3_key: str, expires_in: int | None = None) -> str:
        """Generates a short-lived presigned GET URL for safe preview or export download."""
        expiry = expires_in or self._expiry
        try:
            url = self._client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": self._bucket, "Key": s3_key},
                ExpiresIn=expiry,
            )
            return url
        except ClientError as e:
            raise S3RepositoryError(f"Failed to generate presigned download: {e}") from e

    def put_object_bytes(
        self, s3_key: str, data: bytes, content_type: str = "application/octet-stream"
    ) -> str:
        """Stores object bytes directly (e.g. pasted text, derived image, export file)."""
        try:
            self._client.put_object(
                Bucket=self._bucket,
                Key=s3_key,
                Body=data,
                ContentType=content_type,
            )
            return s3_key
        except ClientError as e:
            raise S3RepositoryError(f"Failed to put S3 object {s3_key}: {e}") from e

    def get_object_bytes(self, s3_key: str) -> bytes:
        """Reads object bytes from S3."""
        try:
            response = self._client.get_object(Bucket=self._bucket, Key=s3_key)
            return response["Body"].read()
        except ClientError as e:
            raise S3RepositoryError(f"Failed to get S3 object {s3_key}: {e}") from e

    def delete_case_prefix(self, case_id: str) -> None:
        """Deletes all objects under cases/{case_id}/."""
        prefix = f"cases/{case_id}/"
        try:
            paginator = self._client.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=self._bucket, Prefix=prefix):
                objects = [{"Key": obj["Key"]} for obj in page.get("Contents", [])]
                if objects:
                    self._client.delete_objects(Bucket=self._bucket, Delete={"Objects": objects})
        except ClientError as e:
            raise S3RepositoryError(f"Failed to delete prefix {prefix}: {e}") from e
