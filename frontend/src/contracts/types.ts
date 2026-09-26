/**
 * Frontend contracts — TypeScript types that EXACTLY mirror docs/DATA_CONTRACTS.md.
 *
 * Rules:
 * - All enum values are the canonical snake_case strings from DATA_CONTRACTS.md.
 * - Switching from mock to live API must not require rewriting page components.
 * - API_BASE_URL is read from VITE_API_BASE_URL env var; mock service ignores it.
 * - AWS: local backend uses profile_name='aws'; Lambda uses IAM role automatically.
 *
 * Last synced with DATA_CONTRACTS.md: 2026-09-26
 */

// ---------------------------------------------------------------------------
// SOURCE LIFECYCLE
// ---------------------------------------------------------------------------

/**
 * Processing lifecycle of a single evidence source.
 * Exact values from DATA_CONTRACTS.md §SourceStatus.
 * UI display labels are derived in the display layer — they are NOT stored.
 */
export type SourceStatus =
  | 'awaiting_upload'    // upload-intent issued; file not yet received by S3
  | 'queued'             // received, waiting for processing slot
  | 'processing'         // actively being extracted
  | 'ready'              // extraction complete; observations available
  | 'partial'            // extraction completed with some fields unresolvable
  | 'failed'             // extraction failed; source retained in inventory
  | 'duplicate'          // same SHA-256 as existing source; retained, not reprocessed
  | 'unsupported'        // file type/format/encryption outside supported set
  | 'deletion_requested'; // user requested deletion; removal may be async

/** Human-readable label for UI display only — not stored. */
export const SOURCE_STATUS_LABELS: Record<SourceStatus, string> = {
  awaiting_upload: 'Awaiting upload',
  queued: 'Queued',
  processing: 'Processing',
  ready: 'Ready',
  partial: 'Partial',
  failed: 'Failed',
  duplicate: 'Duplicate',
  unsupported: 'Unsupported',
  deletion_requested: 'Deletion requested',
};

// ---------------------------------------------------------------------------
// REVIEW
// ---------------------------------------------------------------------------

/**
 * Aggregate review state of an entire observation entity.
 * Exact values from DATA_CONTRACTS.md §ReviewStatus.
 * NOTE: 'rejected' is NOT a valid observation-level status — only individual fields are rejected.
 */
export type ReviewStatus =
  | 'unreviewed'          // no fields reviewed
  | 'partially_reviewed'  // some fields reviewed
  | 'reviewed';           // all fields have a reviewer decision

/**
 * Write-time action verb sent in PATCH /observations/{id} field_reviews[].action.
 * These are NOT stored — they produce a FieldState transition.
 * Exact values from DATA_CONTRACTS.md §FieldAction.
 */
export type FieldAction =
  | 'accept'       // reviewer accepts extracted candidate as-is
  | 'correct'      // reviewer provides a different reviewed_value
  | 'reject'       // reviewer marks the extracted value as incorrect
  | 'unreadable'   // source field cannot be read at all
  | 'unavailable'; // information is absent from this source

/**
 * Stored state of a single field within an observation.
 * Exact values from DATA_CONTRACTS.md §FieldState.
 *
 * FieldAction → FieldState transitions:
 *   accept      → accepted
 *   correct     → corrected
 *   reject      → rejected
 *   unreadable  → unreadable
 *   unavailable → unavailable
 */
export type FieldState =
  | 'missing'      // field was not present in source
  | 'extracted'    // candidate extracted, awaiting reviewer decision
  | 'accepted'     // reviewer accepted the extracted candidate
  | 'corrected'    // reviewer provided a different value
  | 'rejected'     // reviewer marked the extracted value as wrong
  | 'unreadable'   // source content cannot be read for this field
  | 'unavailable'  // reviewer confirmed information is absent
  | 'invalid'      // extracted value cannot be normalized safely
  | 'ambiguous';   // multiple valid interpretations; requires reviewer choice

// ---------------------------------------------------------------------------
// TIME
// ---------------------------------------------------------------------------

/**
 * Precision of a time claim.
 * Exact values from DATA_CONTRACTS.md §TimelinePrecision.
 */
export type TimelinePrecision =
  | 'exact'       // full timestamp with timezone
  | 'date_only'   // date known, time unknown (one-day interval)
  | 'ambiguous'   // multiple interpretations (e.g. 03/04/2026)
  | 'unknown';    // no time information

/** Which section of the timeline an item belongs to. */
export type TimelineSection = 'dated' | 'uncertain' | 'undated';

// ---------------------------------------------------------------------------
// FLAGS
// ---------------------------------------------------------------------------

/**
 * Flag codes — stored on Flag entities and in observation.flag_codes.
 * Exact values from DATA_CONTRACTS.md §FlagCode.
 */
export type FlagCode =
  | 'MISSING_INFO'
  | 'INVALID_VALUE'
  | 'AMBIGUOUS_TIME'
  | 'HUMAN_VERIFICATION_REQUIRED'
  | 'AMOUNT_DISCREPANCY'
  | 'TIME_DISCREPANCY'
  | 'DUPLICATE_SOURCE'
  | 'POTENTIAL_DUPLICATE'
  | 'UNSUPPORTED_INPUT'
  | 'PROCESSING_ERROR';

/**
 * UI filter categories — derived from FlagCodes, NOT stored on entities.
 * Exact values from DATA_CONTRACTS.md §FlagCategory.
 */
export type FlagCategory =
  | 'missing_info'
  | 'invalid_value'
  | 'ambiguous_time'
  | 'human_verification'
  | 'inconsistency'     // AMOUNT_DISCREPANCY + TIME_DISCREPANCY
  | 'duplicate'         // DUPLICATE_SOURCE + POTENTIAL_DUPLICATE
  | 'processing';       // UNSUPPORTED_INPUT + PROCESSING_ERROR

/** Maps each FlagCode to its FlagCategory. */
export const FLAG_CODE_TO_CATEGORY: Record<FlagCode, FlagCategory> = {
  MISSING_INFO: 'missing_info',
  INVALID_VALUE: 'invalid_value',
  AMBIGUOUS_TIME: 'ambiguous_time',
  HUMAN_VERIFICATION_REQUIRED: 'human_verification',
  AMOUNT_DISCREPANCY: 'inconsistency',
  TIME_DISCREPANCY: 'inconsistency',
  DUPLICATE_SOURCE: 'duplicate',
  POTENTIAL_DUPLICATE: 'duplicate',
  UNSUPPORTED_INPUT: 'processing',
  PROCESSING_ERROR: 'processing',
};

export type MediaType = 'image' | 'pdf' | 'audio' | 'text';

// ---------------------------------------------------------------------------
// ENTITY SHAPES (matching API response bodies)
// ---------------------------------------------------------------------------

/** Time claim structure — mirrors DATA_CONTRACTS.md §Time. */
export interface TimeClaim {
  raw: string | null;
  earliest: string | null;        // ISO 8601 UTC
  latest_exclusive: string | null; // ISO 8601 UTC
  precision: TimelinePrecision;
  timezone: string | null;
  candidate_interpretations: string[];
  status: 'exact' | 'date_only' | 'ambiguous' | 'unknown' | 'invalid';
}

/** A single field extracted from a source. Stored per-field on an Observation. */
export interface FieldClaim {
  raw_claimed_value: string | null;
  normalized_candidate_value: string | null;
  reviewed_value: string | null;
  state: FieldState;                 // stored field state
  confidence: number | null;         // 0–1; metadata only, never establishes truth
  anchor_text: string | null;
  source_locator: string | null;     // region / page / time-range description
  reviewed_by: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  // Safe display value for UI — masked phone, account, URL alias, etc.
  // Derived server-side from masking policy; never the raw value.
  masked_display: string | null;
}

/** Source inventory item. */
export interface Source {
  source_id: string;
  media_type: MediaType;
  safe_filename: string;
  // Size presentation fields — API returns raw values; UI formats for display.
  size_bytes: number | null;
  page_count: number | null;
  duration_ms: number | null;
  status: SourceStatus;
  duplicate_of: string | null;
  error_code: string | null;       // canonical name matching DATABASE.md
  sha256_prefix: string;           // first 8 hex chars — display only
  created_at: string;
  updated_at: string;
  version: number;                 // optimistic concurrency
}

/** Candidate observation extracted from one source. */
export interface Observation {
  observation_id: string;
  case_id: string;
  source_id: string;
  event_type: string;
  review_status: ReviewStatus;
  extraction_method: string;
  provider_model: string | null;
  prompt_schema_version: string | null;
  fields: Record<string, FieldClaim>;
  time_claim: TimeClaim | null;
  assumptions: string[];
  flag_codes: FlagCode[];
  created_at: string;
  reviewed_at: string | null;
  version: number;
}

/** Case-level summary (safe counts — no raw evidence). */
export interface CaseSummary {
  case_id: string;
  safe_title: string;
  source_count: number;
  observation_count: number;
  reviewed_count: number;        // observations in 'reviewed' state
  attention_count: number;       // open flags + partially_reviewed
  unresolved_flag_count: number;
  status: 'draft' | 'ready';
  mode: 'mock' | 'live';
  version: number;
}

/** One item in the timeline response. */
export interface TimelineItem {
  observation_id: string;
  source_id: string;
  event_type: string;
  summary_redacted: string;      // pre-masked by server
  section: TimelineSection;
  time_display: string;          // human-readable, server-formatted
  time_claim: TimeClaim | null;
  actor_alias: string | null;    // e.g. "Contact C01"
  transaction_alias: string | null; // e.g. "Transaction T01"
  flag_codes: FlagCode[];
  assumptions: string[];
  ambiguous_interpretations: string[]; // populated when precision === 'ambiguous'
}

export interface TimelineData {
  dated: TimelineItem[];
  uncertain: TimelineItem[];
  undated: TimelineItem[];
  generated_from_version: number;
}

/** Side of an amount/time discrepancy — shown symmetrically, neither preferred. */
export interface DiscrepancySide {
  source_id: string;
  observation_id: string;
  value: string;          // e.g. "₹5,000"
  label: string;          // e.g. "SOURCE S01 · Payment Screenshot"
  timestamp: string;      // ISO or human display
  transaction_alias: string; // e.g. "Transaction T01"
}

/** A single flag entity. */
export interface Flag {
  flag_id: string;
  rule_id: string;
  code: FlagCode;
  category: FlagCategory;         // derived — for UI grouping
  title: string;
  explanation: string;
  involved_source_ids: string[];
  involved_observation_ids: string[];
  field_name: string | null;
  state: 'open' | 'acknowledged' | 'resolved';
  rule_version: string;
  created_at: string;
  // Only present for AMOUNT_DISCREPANCY / TIME_DISCREPANCY
  discrepancy_sides: DiscrepancySide[];
}

/** Privacy mapping entry — shown in export preview. */
export interface PrivacyMapping {
  field_type: 'contact' | 'account' | 'transaction' | 'url';
  original_restricted_preview: string; // e.g. "+91 98*** **210" — never raw
  masked_display: string;              // e.g. "+91 98*** **210"
  alias_token: string;                 // e.g. "Contact C01"
  rationale: string;
}

/** Export readiness summary. */
export interface ExportReadiness {
  sources_packaged: number;
  sources_total: number;
  observations_verified: number;
  observations_total: number;
  unresolved_flags: number;
  uncertain_count: number;
  undated_count: number;
  draft: boolean;
  masking_policy_version: string;
  privacy_mappings: PrivacyMapping[];
}

/** Export job. */
export interface ExportJob {
  export_id: string;
  format: 'pdf' | 'csv';
  status: 'queued' | 'processing' | 'ready' | 'failed';
  draft: boolean;
  download_url: string | null;  // short-lived presigned URL; null until ready
  checksum: string | null;
  schema_version: string | null;
  masking_policy_version: string | null;
  created_at: string;
  completed_at: string | null;
  error_code: string | null;
}

// ---------------------------------------------------------------------------
// API REQUEST SHAPES
// ---------------------------------------------------------------------------

/** Body for PATCH /cases/{case_id}/observations/{observation_id} */
export interface ObservationPatchRequest {
  expected_version: number;
  field_reviews: {
    field: string;
    action: FieldAction;
    reviewed_value: string | null;
    note: string | null;
  }[];
}

/** Body for POST /cases/{case_id}/exports */
export interface ExportRequest {
  format: 'pdf' | 'csv';
  draft: boolean;
  expected_case_version: number;
}

/** Body for POST /cases/{case_id}/links */
export interface LinkRequest {
  link_type: 'same_transaction' | 'same_event';
  observation_ids: string[];
  rationale: string;
}

/** Standard API error envelope */
export interface ApiError {
  error: {
    code: string;
    message: string;
    request_id: string;
    details: Record<string, unknown>;
  };
}
