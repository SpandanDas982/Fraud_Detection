"""
Pydantic v2 contracts for Evidence Ledger.

These models EXACTLY mirror docs/DATA_CONTRACTS.md and the TypeScript types
in frontend/src/contracts/types.ts. Any change here must be reflected in both.

All enum values are the canonical snake_case strings from DATA_CONTRACTS.md.
"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, model_validator


def _now_utc() -> datetime:
    return datetime.now(UTC)


# ---------------------------------------------------------------------------
# ENUMERATIONS — exact values from DATA_CONTRACTS.md
# ---------------------------------------------------------------------------


class SourceStatus(str, Enum):
    awaiting_upload = "awaiting_upload"
    queued = "queued"
    processing = "processing"
    ready = "ready"
    partial = "partial"
    failed = "failed"
    duplicate = "duplicate"
    unsupported = "unsupported"
    deletion_requested = "deletion_requested"


class ReviewStatus(str, Enum):
    """Aggregate state of an entire observation entity."""

    unreviewed = "unreviewed"
    partially_reviewed = "partially_reviewed"
    reviewed = "reviewed"


class FieldAction(str, Enum):
    """
    Write-time verb sent in PATCH body field_reviews[].action.
    NOT stored — produces a FieldState transition.
    """

    accept = "accept"
    correct = "correct"
    reject = "reject"
    unreadable = "unreadable"
    unavailable = "unavailable"


# FieldAction → FieldState transition map
FIELD_ACTION_TO_STATE: dict[FieldAction, FieldState] = {}  # populated after FieldState


class FieldState(str, Enum):
    """Stored state of a single field within an observation."""

    missing = "missing"
    extracted = "extracted"
    accepted = "accepted"
    corrected = "corrected"
    rejected = "rejected"
    unreadable = "unreadable"
    unavailable = "unavailable"
    invalid = "invalid"
    ambiguous = "ambiguous"


# Complete the transition map now that FieldState exists
FIELD_ACTION_TO_STATE = {
    FieldAction.accept: FieldState.accepted,
    FieldAction.correct: FieldState.corrected,
    FieldAction.reject: FieldState.rejected,
    FieldAction.unreadable: FieldState.unreadable,
    FieldAction.unavailable: FieldState.unavailable,
}


class TimelinePrecision(str, Enum):
    exact = "exact"
    date_only = "date_only"
    ambiguous = "ambiguous"
    unknown = "unknown"


class TimelineSection(str, Enum):
    dated = "dated"
    uncertain = "uncertain"
    undated = "undated"


class MediaType(str, Enum):
    image = "image"
    pdf = "pdf"
    audio = "audio"
    text = "text"


class FlagCode(str, Enum):
    MISSING_INFO = "MISSING_INFO"
    INVALID_VALUE = "INVALID_VALUE"
    AMBIGUOUS_TIME = "AMBIGUOUS_TIME"
    HUMAN_VERIFICATION_REQUIRED = "HUMAN_VERIFICATION_REQUIRED"
    AMOUNT_DISCREPANCY = "AMOUNT_DISCREPANCY"
    TIME_DISCREPANCY = "TIME_DISCREPANCY"
    DUPLICATE_SOURCE = "DUPLICATE_SOURCE"
    POTENTIAL_DUPLICATE = "POTENTIAL_DUPLICATE"
    UNSUPPORTED_INPUT = "UNSUPPORTED_INPUT"
    PROCESSING_ERROR = "PROCESSING_ERROR"


class FlagCategory(str, Enum):
    """Derived grouping — NOT stored on Flag entities."""

    missing_info = "missing_info"
    invalid_value = "invalid_value"
    ambiguous_time = "ambiguous_time"
    human_verification = "human_verification"
    inconsistency = "inconsistency"
    duplicate = "duplicate"
    processing = "processing"


# Maps FlagCode → FlagCategory
FLAG_CODE_TO_CATEGORY: dict[FlagCode, FlagCategory] = {
    FlagCode.MISSING_INFO: FlagCategory.missing_info,
    FlagCode.INVALID_VALUE: FlagCategory.invalid_value,
    FlagCode.AMBIGUOUS_TIME: FlagCategory.ambiguous_time,
    FlagCode.HUMAN_VERIFICATION_REQUIRED: FlagCategory.human_verification,
    FlagCode.AMOUNT_DISCREPANCY: FlagCategory.inconsistency,
    FlagCode.TIME_DISCREPANCY: FlagCategory.inconsistency,
    FlagCode.DUPLICATE_SOURCE: FlagCategory.duplicate,
    FlagCode.POTENTIAL_DUPLICATE: FlagCategory.duplicate,
    FlagCode.UNSUPPORTED_INPUT: FlagCategory.processing,
    FlagCode.PROCESSING_ERROR: FlagCategory.processing,
}


class MoneyDirection(str, Enum):
    debit = "debit"
    credit = "credit"
    request = "request"
    refund = "refund"
    unknown = "unknown"


class FlagState(str, Enum):
    open = "open"
    acknowledged = "acknowledged"
    resolved = "resolved"


class ExportFormat(str, Enum):
    pdf = "pdf"
    csv = "csv"


class ExportStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class CaseStatus(str, Enum):
    draft = "draft"
    ready = "ready"


class CaseMode(str, Enum):
    mock = "mock"
    live = "live"


class LinkType(str, Enum):
    same_transaction = "same_transaction"
    same_event = "same_event"


# ---------------------------------------------------------------------------
# ENTITY MODELS
# ---------------------------------------------------------------------------


class TimeClaim(BaseModel):
    """Time claim structure — mirrors DATA_CONTRACTS.md §Time."""

    raw: str | None = None
    earliest: datetime | None = None
    latest_exclusive: datetime | None = None
    precision: TimelinePrecision = TimelinePrecision.unknown
    timezone: str | None = None
    candidate_interpretations: list[str] = Field(default_factory=list)
    status: str = "unknown"  # exact | date_only | ambiguous | unknown | invalid


class FieldClaim(BaseModel):
    """A single extracted field. Stored per-field on an Observation."""

    raw_claimed_value: str | None = None
    normalized_candidate_value: str | None = None
    reviewed_value: str | None = None
    state: FieldState = FieldState.missing
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    anchor_text: str | None = None
    source_locator: str | None = None
    reviewed_by: str | None = None
    review_note: str | None = None
    reviewed_at: datetime | None = None
    # masked_display is computed by the privacy layer before returning to clients
    masked_display: str | None = None


class Source(BaseModel):
    """Evidence source inventory item."""

    source_id: str
    case_id: str
    media_type: MediaType
    safe_filename: str
    s3_key: str | None = None  # internal; never returned to untrusted clients
    sha256: str | None = None  # full hash for integrity; never logged raw
    size_bytes: int | None = None
    page_count: int | None = None
    duration_ms: int | None = None
    status: SourceStatus = SourceStatus.queued
    duplicate_of: str | None = None
    extraction_provider: str | None = None
    processing_attempts: int = 0
    error_code: str | None = None  # canonical name per DATA_CONTRACTS.md
    schema_version: str = "1.0"
    created_at: datetime = Field(default_factory=_now_utc)
    updated_at: datetime = Field(default_factory=_now_utc)
    version: int = 1
    ttl: int | None = None

    @property
    def sha256_prefix(self) -> str | None:
        """First 8 hex chars — safe to return to clients for display."""
        return self.sha256[:8] if self.sha256 else None


class Observation(BaseModel):
    """Candidate observation from one source. Immutable after extraction."""

    observation_id: str
    case_id: str
    source_id: str
    event_type: str
    review_status: ReviewStatus = ReviewStatus.unreviewed
    extraction_method: str
    provider_model: str | None = None
    prompt_schema_version: str | None = None
    fields: dict[str, FieldClaim] = Field(default_factory=dict)
    time_claim: TimeClaim | None = None
    assumptions: list[str] = Field(default_factory=list)
    flag_codes: list[FlagCode] = Field(default_factory=list)
    schema_version: str = "1.0"
    created_at: datetime = Field(default_factory=_now_utc)
    reviewed_at: datetime | None = None
    version: int = 1
    ttl: int | None = None


class Flag(BaseModel):
    """A neutral, observable data-quality flag. Never a verdict."""

    flag_id: str
    case_id: str
    rule_id: str
    code: FlagCode
    # category is derived; computed from FLAG_CODE_TO_CATEGORY before returning to clients
    category: FlagCategory
    title: str
    explanation: str
    involved_source_ids: list[str] = Field(default_factory=list)
    involved_observation_ids: list[str] = Field(default_factory=list)
    field_name: str | None = None
    state: FlagState = FlagState.open
    rule_version: str = "1.0"
    schema_version: str = "1.0"
    created_at: datetime = Field(default_factory=_now_utc)
    updated_at: datetime = Field(default_factory=_now_utc)
    version: int = 1
    ttl: int | None = None
    # Only for AMOUNT_DISCREPANCY / TIME_DISCREPANCY
    discrepancy_sides: list[dict[str, Any]] = Field(default_factory=list)


class Link(BaseModel):
    """Reviewer-confirmed relationship between observations."""

    link_id: str
    case_id: str
    link_type: LinkType
    observation_ids: list[str]
    normalized_reference_alias: str | None = None
    created_by: str  # "rule" or "reviewer"
    rationale: str
    created_at: datetime = Field(default_factory=_now_utc)
    version: int = 1
    ttl: int | None = None


class Export(BaseModel):
    """Export job record."""

    export_id: str
    case_id: str
    format: ExportFormat
    status: ExportStatus = ExportStatus.queued
    draft: bool = True
    s3_key: str | None = None
    schema_version: str | None = None
    masking_policy_version: str | None = None
    checksum: str | None = None
    error_code: str | None = None
    created_at: datetime = Field(default_factory=_now_utc)
    completed_at: datetime | None = None
    version: int = 1
    ttl: int | None = None


class CaseSummary(BaseModel):
    """Safe case summary — no raw evidence returned here."""

    case_id: str
    safe_title: str
    status: CaseStatus = CaseStatus.draft
    mode: CaseMode = CaseMode.mock
    source_count: int = 0
    observation_count: int = 0
    reviewed_count: int = 0
    attention_count: int = 0
    unresolved_flag_count: int = 0
    retention_notice_version: str = "1.0"
    schema_version: str = "1.0"
    created_at: datetime = Field(default_factory=_now_utc)
    updated_at: datetime = Field(default_factory=_now_utc)
    version: int = 1
    ttl: int | None = None


# ---------------------------------------------------------------------------
# API REQUEST / RESPONSE SHAPES
# ---------------------------------------------------------------------------


class FieldReview(BaseModel):
    field: str
    action: FieldAction
    reviewed_value: str | None = None
    note: str | None = None


class ObservationPatchRequest(BaseModel):
    """Body for PATCH /cases/{id}/observations/{id}"""

    expected_version: int
    field_reviews: list[FieldReview]


class ExportRequest(BaseModel):
    """Body for POST /cases/{id}/exports"""

    format: ExportFormat
    draft: bool = True
    expected_case_version: int


class LinkRequest(BaseModel):
    """Body for POST /cases/{id}/links"""

    link_type: LinkType
    observation_ids: list[str] = Field(min_length=2)
    rationale: str


class UploadIntentRequest(BaseModel):
    """Body for POST /cases/{id}/sources/upload-intent"""

    filename: str
    media_type: str
    size_bytes: int
    sha256: str | None = None


class TextSourceRequest(BaseModel):
    """Body for POST /cases/{id}/sources/text"""

    safe_label: str
    text: str = Field(max_length=50_000)  # bounded per PROJECT.md


class FlagPatchRequest(BaseModel):
    """Body for PATCH /cases/{id}/flags/{id}"""

    state: FlagState
    note: str | None = None

    @model_validator(mode="after")
    def only_allowed_transitions(self) -> FlagPatchRequest:
        if self.state == FlagState.open:
            raise ValueError("Cannot transition a flag back to 'open' via PATCH.")
        return self


# ---------------------------------------------------------------------------
# PROVIDER / EXTRACTION CONTRACT
# ---------------------------------------------------------------------------


class ExtractionFieldResult(BaseModel):
    """One field as returned by Nova Lite / Nova Micro via Bedrock."""

    raw: str | None = None
    candidate: str | None = None
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)


class ExtractionObservationResult(BaseModel):
    """One observation as returned by the extraction provider."""

    event_type: str
    locator: dict[str, Any]
    fields: dict[str, ExtractionFieldResult]
    assumptions: list[str] = Field(default_factory=list)


class ExtractionProviderResult(BaseModel):
    """Top-level provider output — validated before creating any DB records."""

    schema_version: str = "1.0"
    source_id: str
    observations: list[ExtractionObservationResult]
    warnings: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# PRIVACY / EXPORT
# ---------------------------------------------------------------------------


class PrivacyMapping(BaseModel):
    field_type: str  # contact | account | transaction | url
    original_restricted_preview: str  # e.g. "+91 9•••••••210" — never the raw value
    masked_display: str  # e.g. "+91 9••••• ••210"
    alias_token: str  # e.g. "Contact C01"
    rationale: str


class MoneyAmount(BaseModel):
    """Normalized money value — never binary float."""

    minor_units: int  # e.g. 500000 for ₹5,000.00
    currency: str | None = None  # e.g. "INR"
    direction: MoneyDirection = MoneyDirection.unknown
    raw_claimed: str | None = None

    @property
    def as_decimal(self) -> Decimal:
        return Decimal(self.minor_units) / Decimal(100)
