"""
Configuration and AWS session management for Evidence Ledger.

Follows AGENTS.md rules:
- Local dev uses named profile 'aws' by default.
- Lambda execution uses default IAM role credential chain.
- Region comes from AWS_REGION environment variable (no hardcoded credentials or regions).
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Any

import boto3


def _load_env_file() -> None:
    # Try looking in backend directory or current directory
    candidates = [
        Path(__file__).resolve().parent.parent.parent.parent / ".env",
        Path.cwd() / ".env",
    ]
    for env_path in candidates:
        if env_path.is_file():
            try:
                for line in env_path.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k not in os.environ:
                            os.environ[k] = v
                break
            except Exception:
                pass


_load_env_file()


@dataclass(frozen=True)
class Settings:
    aws_region: str = field(default_factory=lambda: os.environ.get("AWS_REGION", "us-east-1"))
    dynamodb_table_name: str = field(
        default_factory=lambda: os.environ.get("DYNAMODB_TABLE_NAME", "EvidenceLedger")
    )
    s3_bucket_name: str = field(
        default_factory=lambda: os.environ.get("S3_BUCKET_NAME", "evidence-ledger-storage")
    )
    bedrock_nova_lite_model_id: str = field(
        default_factory=lambda: os.environ.get(
            "BEDROCK_NOVA_LITE_MODEL_ID", "amazon.nova-lite-v1:0"
        )
    )
    bedrock_nova_micro_model_id: str = field(
        default_factory=lambda: os.environ.get(
            "BEDROCK_NOVA_MICRO_MODEL_ID", "amazon.nova-micro-v1:0"
        )
    )
    sarvam_api_key: str | None = field(
        default_factory=lambda: os.environ.get("SARVAM_API_KEY") or os.environ.get("SARVAM_AI_KEY")
    )
    sarvam_endpoint: str = field(
        default_factory=lambda: os.environ.get(
            "SARVAM_ENDPOINT", "https://api.sarvam.ai/speech-to-text"
        )
    )
    presigned_url_expiry_seconds: int = field(
        default_factory=lambda: int(os.environ.get("PRESIGNED_URL_EXPIRES_IN", "900"))
    )
    allowed_origins: list[str] = field(
        default_factory=lambda: [
            o.strip()
            for o in os.environ.get(
                "ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,https://*.vercel.app,*"
            ).split(",")
            if o.strip()
        ]
    )



@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


def get_boto3_session() -> boto3.Session:
    """
    Returns a configured boto3.Session.
    Uses 'aws' profile locally when running outside AWS Lambda, or standard IAM role in Lambda.
    """
    settings = get_settings()
    if os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        return boto3.Session(region_name=settings.aws_region)

    profile = os.environ.get("AWS_PROFILE", "aws")
    try:
        return boto3.Session(profile_name=profile, region_name=settings.aws_region)
    except Exception:
        # Fallback to default credential chain if the named profile is absent
        return boto3.Session(region_name=settings.aws_region)


def get_dynamodb_resource() -> Any:
    return get_boto3_session().resource("dynamodb")


def get_s3_client() -> Any:
    return get_boto3_session().client("s3")


def get_bedrock_runtime_client() -> Any:
    return get_boto3_session().client("bedrock-runtime")
