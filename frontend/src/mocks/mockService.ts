import type {
  CaseSummary,
  Source,
  Observation,
  TimelineData,
  Flag,
  ExportReadiness,
  ExportJob,
  FieldAction,
} from '@/contracts/types';
import { maskPhone, maskAccount, sanitizeUrl } from '@/contracts/privacy';

export const INITIAL_CASE_SUMMARY: CaseSummary = {
  case_id: 'SYN-8924',
  safe_title: 'Synthetic Demo Case #SYN-8924',
  source_count: 8,
  observation_count: 11,
  reviewed_count: 7,
  attention_count: 3,
  unresolved_flag_count: 4,
  status: 'draft',
  mode: 'mock',
  version: 4,
};

export const INITIAL_SOURCES: Source[] = [
  {
    source_id: 'S01',
    media_type: 'image',
    safe_filename: 'screenshot_payment_upi_01.png',
    size_bytes: 1468006, // 1.4 MB
    page_count: null,
    duration_ms: null,
    status: 'ready',
    duplicate_of: null,
    error_code: null,
    sha256_prefix: '9b2deb4a',
    created_at: '2024-09-26T10:45:12Z',
    updated_at: '2024-09-26T10:45:30Z',
    version: 2,
  },
  {
    source_id: 'S02',
    media_type: 'pdf',
    safe_filename: 'bank_statement_sept_excerpt.pdf',
    size_bytes: 3145728,
    page_count: 3,
    duration_ms: null,
    status: 'partial',
    duplicate_of: null,
    error_code: null,
    sha256_prefix: 'e31b2742',
    created_at: '2024-09-26T10:46:00Z',
    updated_at: '2024-09-26T10:47:15Z',
    version: 1,
  },
  {
    source_id: 'S03',
    media_type: 'audio',
    safe_filename: 'customer_call_dispute_rec.m4a',
    size_bytes: 2202009,
    page_count: null,
    duration_ms: 134000, // 2m 14s
    status: 'processing',
    duplicate_of: null,
    error_code: null,
    sha256_prefix: 'c441aa98',
    created_at: '2024-09-26T10:48:00Z',
    updated_at: '2024-09-26T10:49:00Z',
    version: 1,
  },
  {
    source_id: 'S04',
    media_type: 'text',
    safe_filename: 'chat_log_support_ticket.txt',
    size_bytes: 14336, // 14 KB
    page_count: null,
    duration_ms: null,
    status: 'ready',
    duplicate_of: null,
    error_code: null,
    sha256_prefix: '45feec69',
    created_at: '2024-09-26T10:50:00Z',
    updated_at: '2024-09-26T10:50:30Z',
    version: 2,
  },
  {
    source_id: 'S05',
    media_type: 'image',
    safe_filename: 'receipt_duplicate_scan.jpg',
    size_bytes: 911360, // 890 KB
    page_count: null,
    duration_ms: null,
    status: 'duplicate',
    duplicate_of: 'S01',
    error_code: null,
    sha256_prefix: '9b2deb4a',
    created_at: '2024-09-26T10:52:00Z',
    updated_at: '2024-09-26T10:52:10Z',
    version: 1,
  },
  {
    source_id: 'S06',
    media_type: 'pdf',
    safe_filename: 'encrypted_tax_invoice.pdf',
    size_bytes: 524288,
    page_count: 1,
    duration_ms: null,
    status: 'unsupported',
    duplicate_of: null,
    error_code: 'PASSWORD_PROTECTED',
    sha256_prefix: 'f109ba22',
    created_at: '2024-09-26T10:53:00Z',
    updated_at: '2024-09-26T10:53:05Z',
    version: 1,
  },
  {
    source_id: 'S07',
    media_type: 'image',
    safe_filename: 'phone_number_screenshot_crop.png',
    size_bytes: 430080,
    page_count: null,
    duration_ms: null,
    status: 'ready',
    duplicate_of: null,
    error_code: null,
    sha256_prefix: '78bb441c',
    created_at: '2024-09-26T10:54:00Z',
    updated_at: '2024-09-26T10:54:20Z',
    version: 1,
  },
  {
    source_id: 'S08',
    media_type: 'pdf',
    safe_filename: 'handwritten_account_memo.pdf',
    size_bytes: 1153433,
    page_count: 1,
    duration_ms: null,
    status: 'ready',
    duplicate_of: null,
    error_code: null,
    sha256_prefix: 'b94158ef',
    created_at: '2024-09-26T10:55:00Z',
    updated_at: '2024-09-26T10:55:15Z',
    version: 1,
  },
];

export const INITIAL_OBSERVATIONS: Observation[] = [
  {
    observation_id: 'OBS-081',
    case_id: 'SYN-8924',
    source_id: 'S01',
    event_type: 'Payment Notification Event',
    review_status: 'partially_reviewed',
    extraction_method: 'Model-L04 / FinParse-v2',
    provider_model: 'Amazon Nova Lite',
    prompt_schema_version: 'v2.4',
    fields: {
      amount: {
        raw_claimed_value: '₹5,000',
        normalized_candidate_value: 'INR 5,000.00',
        reviewed_value: 'INR 5,000.00',
        state: 'accepted',
        confidence: 0.942,
        anchor_text: 'TRANSFERRED AMOUNT ₹5,000.00',
        source_locator: 'Region [x:42, y:120, w:320, h:90] - Payment Voucher Box',
        reviewed_by: 'Reviewer-01',
        review_note: 'Verified against receipt banner font',
        reviewed_at: '2024-09-26T11:02:00Z',
        masked_display: '₹5,000.00',
      },
      timestamp: {
        raw_claimed_value: '26 Sep 2024, 10:45 AM',
        normalized_candidate_value: '2024-09-26T10:45:00+05:30',
        reviewed_value: '2024-09-26T10:45:00+05:30',
        state: 'accepted',
        confidence: 0.985,
        anchor_text: '26-SEP-2024 10:45 AM',
        source_locator: 'Header top right banner',
        reviewed_by: 'Reviewer-01',
        review_note: null,
        reviewed_at: '2024-09-26T11:03:00Z',
        masked_display: '26 Sep 2024, 10:45 AM IST',
      },
      transaction_reference: {
        raw_claimed_value: null,
        normalized_candidate_value: null,
        reviewed_value: null,
        state: 'missing',
        confidence: 0.0,
        anchor_text: null,
        source_locator: 'Voucher body - UTR field area',
        reviewed_by: null,
        review_note: null,
        reviewed_at: null,
        masked_display: 'Missing in source - Human verification required',
      },
      recipient_contact: {
        raw_claimed_value: '+91 98765 43210',
        normalized_candidate_value: '+91 98765 43210',
        reviewed_value: 'Contact C01 (Masked for privacy)',
        state: 'corrected',
        confidence: 0.89,
        anchor_text: 'Recipient Contact: +91 98*** **210',
        source_locator: 'Recipient Details row 2',
        reviewed_by: 'J. Doe · 11:04',
        review_note: 'Substituted alias Contact C01 per privacy protocol',
        reviewed_at: '2024-09-26T11:04:12Z',
        masked_display: maskPhone('+91 98765 43210'),
      },
    },
    time_claim: {
      raw: '26 Sep 2024, 10:45 AM',
      earliest: '2024-09-26T05:15:00Z',
      latest_exclusive: '2024-09-26T05:16:00Z',
      precision: 'exact',
      timezone: '+05:30',
      candidate_interpretations: ['2024-09-26T10:45:00+05:30'],
      status: 'exact',
    },
    assumptions: ['Time extracted from transaction banner; device battery time excluded.'],
    flag_codes: ['MISSING_INFO', 'AMOUNT_DISCREPANCY'],
    created_at: '2024-09-26T10:45:30Z',
    reviewed_at: null,
    version: 3,
  },
  {
    observation_id: 'OBS-082',
    case_id: 'SYN-8924',
    source_id: 'S02',
    event_type: 'Bank Statement Annotation',
    review_status: 'unreviewed',
    extraction_method: 'PyMuPDF Native Text Parser',
    provider_model: null,
    prompt_schema_version: null,
    fields: {
      amount: {
        raw_claimed_value: '₹7,000.00',
        normalized_candidate_value: 'INR 7,000.00',
        reviewed_value: null,
        state: 'extracted',
        confidence: 0.99,
        anchor_text: '26-09-2024 UPI/REF-90310 DEBIT 7,000.00',
        source_locator: 'Page 1, Row 4',
        reviewed_by: null,
        review_note: null,
        reviewed_at: null,
        masked_display: '₹7,000.00',
      },
      timestamp: {
        raw_claimed_value: '26-09-2024 10:47:00',
        normalized_candidate_value: '2024-09-26T10:47:00+05:30',
        reviewed_value: null,
        state: 'extracted',
        confidence: 0.98,
        anchor_text: '26-09-2024 10:47:00',
        source_locator: 'Page 1, Row 4',
        reviewed_by: null,
        review_note: null,
        reviewed_at: null,
        masked_display: '26 Sep 2024, 10:47 AM',
      },
      transaction_reference: {
        raw_claimed_value: 'REF-90310-P01',
        normalized_candidate_value: 'REF-90310-P01',
        reviewed_value: null,
        state: 'extracted',
        confidence: 0.99,
        anchor_text: 'REF-90310-P01',
        source_locator: 'Page 1, Column 3',
        reviewed_by: null,
        review_note: null,
        reviewed_at: null,
        masked_display: 'REF-90310-P01',
      },
    },
    time_claim: {
      raw: '26-09-2024 10:47:00',
      earliest: '2024-09-26T05:17:00Z',
      latest_exclusive: '2024-09-26T05:18:00Z',
      precision: 'exact',
      timezone: '+05:30',
      candidate_interpretations: ['2024-09-26T10:47:00+05:30'],
      status: 'exact',
    },
    assumptions: ['Source statement does not specify whether 10:47 AM represents batch ingestion time or customer dispute filing time.'],
    flag_codes: ['AMOUNT_DISCREPANCY'],
    created_at: '2024-09-26T10:47:15Z',
    reviewed_at: null,
    version: 1,
  },
  {
    observation_id: 'OBS-083',
    case_id: 'SYN-8924',
    source_id: 'S04',
    event_type: 'Support Transcript Record',
    review_status: 'reviewed',
    extraction_method: 'Regex & Entity Extractor',
    provider_model: 'Amazon Nova Micro',
    prompt_schema_version: 'v1.2',
    fields: {
      incident_id: {
        raw_claimed_value: '#INC-991',
        normalized_candidate_value: 'INC-991',
        reviewed_value: 'INC-991',
        state: 'accepted',
        confidence: 1.0,
        anchor_text: 'Referenced ticket #INC-991 established.',
        source_locator: 'Line 14',
        reviewed_by: 'Reviewer-01',
        review_note: null,
        reviewed_at: '2024-09-26T11:05:00Z',
        masked_display: '#INC-991',
      },
      timestamp: {
        raw_claimed_value: '27 Sep 2024, 02:15:40 PM IST',
        normalized_candidate_value: '2024-09-27T14:15:40+05:30',
        reviewed_value: '2024-09-27T14:15:40+05:30',
        state: 'accepted',
        confidence: 0.99,
        anchor_text: '[14:15:40] User session opened',
        source_locator: 'Line 1',
        reviewed_by: 'Reviewer-01',
        review_note: null,
        reviewed_at: '2024-09-26T11:05:00Z',
        masked_display: '27 Sep 2024, 02:15:40 PM IST',
      },
    },
    time_claim: {
      raw: '27 Sep 2024, 02:15:40 PM IST',
      earliest: '2024-09-27T08:45:40Z',
      latest_exclusive: '2024-09-27T08:45:41Z',
      precision: 'exact',
      timezone: '+05:30',
      candidate_interpretations: ['2024-09-27T14:15:40+05:30'],
      status: 'exact',
    },
    assumptions: ['Transcript synchronized with UTC clock ID #AWS-HYD-03.'],
    flag_codes: [],
    created_at: '2024-09-26T10:50:30Z',
    reviewed_at: '2024-09-26T11:05:00Z',
    version: 2,
  },
  {
    observation_id: 'OBS-084',
    case_id: 'SYN-8924',
    source_id: 'S02',
    event_type: 'Ledger Post Date Reference',
    review_status: 'unreviewed',
    extraction_method: 'OCR Date Tokenizer',
    provider_model: null,
    prompt_schema_version: null,
    fields: {
      raw_date: {
        raw_claimed_value: '03/04/2026',
        normalized_candidate_value: null,
        reviewed_value: null,
        state: 'ambiguous',
        confidence: 0.65,
        anchor_text: 'VALUE DT: 03/04/2026',
        source_locator: 'Page 2, Box 3',
        reviewed_by: null,
        review_note: null,
        reviewed_at: null,
        masked_display: '03/04/2026',
      },
    },
    time_claim: {
      raw: '03/04/2026',
      earliest: '2026-03-04T00:00:00Z',
      latest_exclusive: '2026-04-04T00:00:00Z',
      precision: 'ambiguous',
      timezone: null,
      candidate_interpretations: ['2026-04-03 (03 April 2026)', '2026-03-04 (04 March 2026)'],
      status: 'ambiguous',
    },
    assumptions: ['Date format could mean 3 April 2026 (DD/MM) or 4 March 2026 (MM/DD). Source context provides conflicting regional headers.'],
    flag_codes: ['AMBIGUOUS_TIME'],
    created_at: '2024-09-26T10:47:20Z',
    reviewed_at: null,
    version: 1,
  },
  {
    observation_id: 'OBS-085',
    case_id: 'SYN-8924',
    source_id: 'S07',
    event_type: 'Cropped Fragment - Phone Number',
    review_status: 'reviewed',
    extraction_method: 'Image Fragment OCR',
    provider_model: null,
    prompt_schema_version: null,
    fields: {
      contact: {
        raw_claimed_value: '+91 98765 43210',
        normalized_candidate_value: '+91 98765 43210',
        reviewed_value: '+91 98*** **210',
        state: 'accepted',
        confidence: 0.88,
        anchor_text: '+91 98*** **210',
        source_locator: 'Visual center',
        reviewed_by: 'Reviewer-01',
        review_note: null,
        reviewed_at: '2024-09-26T11:06:00Z',
        masked_display: maskPhone('+91 98765 43210'),
      },
    },
    time_claim: null,
    assumptions: ['File metadata stripped (EXIF timestamp zeroed). No reliable creation header recoverable.'],
    flag_codes: [],
    created_at: '2024-09-26T10:54:20Z',
    reviewed_at: '2024-09-26T11:06:00Z',
    version: 2,
  },
  {
    observation_id: 'OBS-086',
    case_id: 'SYN-8924',
    source_id: 'S08',
    event_type: 'Handwritten Account Memo',
    review_status: 'reviewed',
    extraction_method: 'Document Vision',
    provider_model: 'Amazon Nova Lite',
    prompt_schema_version: 'v2.1',
    fields: {
      account: {
        raw_claimed_value: 'Account A01',
        normalized_candidate_value: '4029-XXXX-XXXX-1184',
        reviewed_value: 'Account A01',
        state: 'accepted',
        confidence: 0.82,
        anchor_text: 'Transfer token sync for A01 pending verification',
        source_locator: 'Office memo line 2',
        reviewed_by: 'Reviewer-01',
        review_note: null,
        reviewed_at: '2024-09-26T11:07:00Z',
        masked_display: maskAccount('4029-1234-5678-1184'),
      },
    },
    time_claim: null,
    assumptions: ['Ballpoint pen note on office memo pad reading "Transfer token sync for A01 pending verification". Undated text, paper contains no watermark calendar code.'],
    flag_codes: [],
    created_at: '2024-09-26T10:55:15Z',
    reviewed_at: '2024-09-26T11:07:00Z',
    version: 2,
  },
];

export const INITIAL_TIMELINE_DATA: TimelineData = {
  dated: [
    {
      observation_id: 'OBS-081',
      source_id: 'S01',
      event_type: 'Payment Notification',
      summary_redacted: 'Payment of ₹5,000.00 reported from Account A01 to Recipient C01. Instant status returned HTTP 200 payload.',
      section: 'dated',
      time_display: '26 Sep 2024, 10:45:12 AM IST',
      time_claim: {
        raw: '26 Sep 2024, 10:45:12 AM',
        earliest: '2024-09-26T05:15:12Z',
        latest_exclusive: '2024-09-26T05:15:13Z',
        precision: 'exact',
        timezone: '+05:30',
        candidate_interpretations: [],
        status: 'exact',
      },
      actor_alias: 'Contact C01',
      transaction_alias: 'Transaction T01',
      flag_codes: ['AMOUNT_DISCREPANCY'],
      assumptions: ['Timestamp extracted directly from on-screen OS clock header; corroborated by in-app confirmation banner.'],
      ambiguous_interpretations: [],
    },
    {
      observation_id: 'OBS-082',
      source_id: 'S02',
      event_type: 'Disputed Amount Log',
      summary_redacted: 'Discrepant payment claim of ₹7,000.00 noted for Transaction T01 in counter-party claim log. Clashes directly with ₹5,000 confirmation in Exhibit #EX-8901.',
      section: 'dated',
      time_display: '26 Sep 2024, 10:47:00 AM IST (±1m)',
      time_claim: {
        raw: '26 Sep 2024, 10:47:00 AM',
        earliest: '2024-09-26T05:17:00Z',
        latest_exclusive: '2024-09-26T05:18:00Z',
        precision: 'exact',
        timezone: '+05:30',
        candidate_interpretations: [],
        status: 'exact',
      },
      actor_alias: 'Account A01',
      transaction_alias: 'Transaction T01',
      flag_codes: ['AMOUNT_DISCREPANCY'],
      assumptions: ['Source statement does not specify whether 10:47 AM represents batch ingestion time or customer dispute filing time. Sequence precedence between T01 debit and disputed log has not been mathematically locked.'],
      ambiguous_interpretations: [],
    },
    {
      observation_id: 'OBS-083',
      source_id: 'S04',
      event_type: 'Support Interaction',
      summary_redacted: 'Customer reported unauthorized transfer via chat transcript with Helpdesk Agent ID #449. Immediate account freeze requested preliminary incident intake ID #INC-991 issued.',
      section: 'dated',
      time_display: '27 Sep 2024, 02:15:40 PM IST',
      time_claim: {
        raw: '27 Sep 2024, 02:15:40 PM IST',
        earliest: '2024-09-27T08:45:40Z',
        latest_exclusive: '2024-09-27T08:45:41Z',
        precision: 'exact',
        timezone: '+05:30',
        candidate_interpretations: [],
        status: 'exact',
      },
      actor_alias: 'Contact C01',
      transaction_alias: null,
      flag_codes: [],
      assumptions: ['Transcript synchronized with UTC clock ID #AWS-HYD-03. Elapsed time between Exhibit EX-8901 payment and dispute reporting: 27 hours, 30 minutes, 28 seconds.'],
      ambiguous_interpretations: [],
    },
  ],
  uncertain: [
    {
      observation_id: 'OBS-084',
      source_id: 'S02',
      event_type: 'Ambiguous Date Interpretation',
      summary_redacted: 'Reported Raw String: "03/04/2026". System detected irreconcilable regional timestamp formatting. Linear injection paused to prevent contaminated causality graphs.',
      section: 'uncertain',
      time_display: 'Ambiguous: 03/04/2026',
      time_claim: {
        raw: '03/04/2026',
        earliest: '2026-03-04T00:00:00Z',
        latest_exclusive: '2026-04-04T00:00:00Z',
        precision: 'ambiguous',
        timezone: null,
        candidate_interpretations: [
          'Branch A (DD/MM/YYYY): 03 April 2026 — Matches default Indian banking standard (RBI guideline). Places transaction 18 months subsequent to initial complaint.',
          'Branch B (MM/DD/YYYY): 04 March 2026 — Matches cloud gateway localization header found in raw packet payload. Shifts reconciliation cycle by 30 days.',
        ],
        status: 'ambiguous',
      },
      actor_alias: null,
      transaction_alias: 'Transaction T01',
      flag_codes: ['AMBIGUOUS_TIME'],
      assumptions: ['Date format could mean 3 April 2026 (DD/MM) or 4 March 2026 (MM/DD). Source context provides conflicting regional headers between the host operating ledger and intermediary clearinghouse payload.'],
      ambiguous_interpretations: [
        '03 April 2026 (DD/MM/YYYY)',
        '04 March 2026 (MM/DD/YYYY)',
      ],
    },
  ],
  undated: [
    {
      observation_id: 'OBS-085',
      source_id: 'S07',
      event_type: 'Phone Number Screenshot Fragment',
      summary_redacted: 'Phone number screenshot fragment (+91 98*** **210). Cropped contact header showing partial subscriber MSISDN and messaging icon. File metadata stripped (EXIF timestamp zeroed). No reliable creation header recoverable.',
      section: 'undated',
      time_display: 'Time Unknown',
      time_claim: null,
      actor_alias: 'Contact C01',
      transaction_alias: null,
      flag_codes: [],
      assumptions: ['File metadata stripped (EXIF timestamp zeroed). No reliable creation header recoverable.'],
      ambiguous_interpretations: [],
    },
    {
      observation_id: 'OBS-086',
      source_id: 'S08',
      event_type: 'Handwritten Account Memo',
      summary_redacted: 'Handwritten account memo referencing Account A01. Ballpoint pen note on office memo pad reading "Transfer token sync for A01 pending verification". Undated text, paper contains no watermark calendar code.',
      section: 'undated',
      time_display: 'Time Unknown',
      time_claim: null,
      actor_alias: 'Account A01',
      transaction_alias: null,
      flag_codes: [],
      assumptions: ['Undated text, paper contains no watermark calendar code.'],
      ambiguous_interpretations: [],
    },
  ],
  generated_from_version: 4,
};

export const INITIAL_FLAGS: Flag[] = [
  {
    flag_id: 'FLAG-DISC-01',
    rule_id: 'RULE-DISC-AMOUNT',
    code: 'AMOUNT_DISCREPANCY',
    category: 'inconsistency',
    title: 'Amount Discrepancy · Transaction T01',
    explanation: 'These linked sources report different amounts for the same transaction reference. Both values are retained in the record without automated preference.',
    involved_source_ids: ['S01', 'S02'],
    involved_observation_ids: ['OBS-081', 'OBS-082'],
    field_name: 'amount',
    state: 'open',
    rule_version: 'v1.4',
    created_at: '2024-09-26T10:48:00Z',
    discrepancy_sides: [
      {
        source_id: 'S01',
        observation_id: 'OBS-081',
        value: '₹5,000.00',
        label: 'SOURCE S01 · PAYMENT SCREENSHOT',
        timestamp: '26 Sep 2024, 10:45 AM',
        transaction_alias: 'Transaction T01',
      },
      {
        source_id: 'S02',
        observation_id: 'OBS-082',
        value: '₹7,000.00',
        label: 'SOURCE S02 · BANK STATEMENT EXCERPT',
        timestamp: '26 Sep 2024, 10:47 AM',
        transaction_alias: 'Transaction T01',
      },
    ],
  },
  {
    flag_id: 'M-01',
    rule_id: 'RULE-REQ-UTR',
    code: 'MISSING_INFO',
    category: 'missing_info',
    title: 'Transaction reference (UTR) was not found',
    explanation: 'Required by the Payment Notification verification checklist. Source S01 does not contain a numeric reference.',
    involved_source_ids: ['S01'],
    involved_observation_ids: ['OBS-081'],
    field_name: 'transaction_reference',
    state: 'open',
    rule_version: 'v1.0',
    created_at: '2024-09-26T10:45:30Z',
    discrepancy_sides: [],
  },
  {
    flag_id: 'D-04',
    rule_id: 'RULE-DATE-AMBIGUITY',
    code: 'AMBIGUOUS_TIME',
    category: 'ambiguous_time',
    title: 'Date interpretation conflict: 03/04/2026',
    explanation: 'DD/MM vs MM/DD ambiguity. Affects 2 linked line items in transaction sequencing log.',
    involved_source_ids: ['S02'],
    involved_observation_ids: ['OBS-084'],
    field_name: 'timestamp',
    state: 'open',
    rule_version: 'v1.2',
    created_at: '2024-09-26T10:47:20Z',
    discrepancy_sides: [],
  },
  {
    flag_id: 'DUP-02',
    rule_id: 'RULE-DUP-IMG',
    code: 'DUPLICATE_SOURCE',
    category: 'duplicate',
    title: 'Duplicate document scan: receipt_duplicate_scan.jpg',
    explanation: 'Visual and text hash match Source S01 (99.2% parity). Retained in inventory with duplicate tag without automatic deletion.',
    involved_source_ids: ['S05', 'S01'],
    involved_observation_ids: [],
    field_name: null,
    state: 'acknowledged',
    rule_version: 'v1.1',
    created_at: '2024-09-26T10:52:10Z',
    discrepancy_sides: [],
  },
  {
    flag_id: 'HV-01',
    rule_id: 'RULE-CONF-THRESH',
    code: 'HUMAN_VERIFICATION_REQUIRED',
    category: 'human_verification',
    title: 'Cross-document date verification needed',
    explanation: 'Timestamp discrepancy between device screenshot and bank statement clearinghouse timestamp.',
    involved_source_ids: ['S01', 'S02'],
    involved_observation_ids: ['OBS-081', 'OBS-082'],
    field_name: 'timestamp',
    state: 'open',
    rule_version: 'v1.0',
    created_at: '2024-09-26T10:48:30Z',
    discrepancy_sides: [],
  },
  {
    flag_id: 'PROC-01',
    rule_id: 'RULE-INPUT-UNSUPPORTED',
    code: 'UNSUPPORTED_INPUT',
    category: 'processing',
    title: 'Password protected / unreadable PDF: encrypted_tax_invoice.pdf',
    explanation: 'Decryption failed. Source retained in catalog for auditable chain of custody.',
    involved_source_ids: ['S06'],
    involved_observation_ids: [],
    field_name: null,
    state: 'open',
    rule_version: 'v1.0',
    created_at: '2024-09-26T10:53:05Z',
    discrepancy_sides: [],
  },
];

export const INITIAL_EXPORT_READINESS: ExportReadiness = {
  sources_packaged: 8,
  sources_total: 8,
  observations_verified: 7,
  observations_total: 11,
  unresolved_flags: 4,
  uncertain_count: 1,
  undated_count: 2,
  draft: true,
  masking_policy_version: 'STRICT-2.1',
  privacy_mappings: [
    {
      field_type: 'contact',
      original_restricted_preview: '+91 98*** **210',
      masked_display: maskPhone('+91 98765 43210'),
      alias_token: 'Contact C01',
      rationale: 'Phone number redacted · Preserves actor association across 4 exhibits',
    },
    {
      field_type: 'account',
      original_restricted_preview: '4029-XXXX-XXXX-1184',
      masked_display: maskAccount('4029-1234-5678-1184'),
      alias_token: 'Account A01',
      rationale: 'Bank account tokenized · Retains routing integrity in ledger tables',
    },
    {
      field_type: 'transaction',
      original_restricted_preview: 'UPI/2024/981240182',
      masked_display: 'Transaction T01',
      alias_token: 'Transaction T01',
      rationale: 'Transaction alias mapped to timestamp matrix entry',
    },
    {
      field_type: 'url',
      original_restricted_preview: 'https://auth-portal-verify.in/session?token=sec_981a',
      masked_display: sanitizeUrl('https://auth-portal-verify.in/session?token=sec_981a'),
      alias_token: '[Sanitized URL: auth-portal-verify.in]',
      rationale: 'Session queries stripped to prevent active session leakage',
    },
  ],
};

// State manager for Mock Mode
class MockService {
  private summary: CaseSummary = { ...INITIAL_CASE_SUMMARY };
  private sources: Source[] = [...INITIAL_SOURCES];
  private observations: Observation[] = [...INITIAL_OBSERVATIONS];
  private timeline: TimelineData = { ...INITIAL_TIMELINE_DATA };
  private flags: Flag[] = [...INITIAL_FLAGS];
  private exportReadiness: ExportReadiness = { ...INITIAL_EXPORT_READINESS };

  getCaseSummary(): CaseSummary {
    return { ...this.summary };
  }

  getSources(): Source[] {
    return [...this.sources];
  }

  getObservations(): Observation[] {
    return [...this.observations];
  }

  getTimeline(): TimelineData {
    return { ...this.timeline };
  }

  getFlags(): Flag[] {
    return [...this.flags];
  }

  getExportReadiness(): ExportReadiness {
    return { ...this.exportReadiness };
  }

  resetDemo() {
    this.summary = { ...INITIAL_CASE_SUMMARY };
    this.sources = [...INITIAL_SOURCES];
    this.observations = [...INITIAL_OBSERVATIONS];
    this.timeline = { ...INITIAL_TIMELINE_DATA };
    this.flags = [...INITIAL_FLAGS];
    this.exportReadiness = { ...INITIAL_EXPORT_READINESS };
  }

  startEmptyCase() {
    this.summary = {
      case_id: 'CASE-NEW-01',
      safe_title: 'New Case Workspace',
      source_count: 0,
      observation_count: 0,
      reviewed_count: 0,
      attention_count: 0,
      unresolved_flag_count: 0,
      status: 'draft',
      mode: 'mock',
      version: 1,
    };
    this.sources = [];
    this.observations = [];
    this.timeline = { dated: [], uncertain: [], undated: [], generated_from_version: 1 };
    this.flags = [];
    this.exportReadiness = {
      sources_packaged: 0,
      sources_total: 0,
      observations_verified: 0,
      observations_total: 0,
      unresolved_flags: 0,
      uncertain_count: 0,
      undated_count: 0,
      draft: true,
      masking_policy_version: 'STRICT-2.1',
      privacy_mappings: [],
    };
  }

  addSource(source: Omit<Source, 'source_id' | 'sha256_prefix' | 'created_at' | 'updated_at' | 'version'>): Source {
    const id = `S0${this.sources.length + 1}`;
    const newSource: Source = {
      ...source,
      source_id: id,
      sha256_prefix: Math.random().toString(16).slice(2, 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    };
    this.sources.unshift(newSource);
    this.summary.source_count = this.sources.length;
    return newSource;
  }

  updateFieldReview(
    obsId: string,
    fieldName: string,
    action: FieldAction,
    reviewedValue: string | null = null,
    note: string | null = null
  ): Observation {
    const obs = this.observations.find((o) => o.observation_id === obsId);
    if (!obs || !obs.fields[fieldName]) {
      throw new Error(`Observation or field not found: ${obsId}.${fieldName}`);
    }

    const field = obs.fields[fieldName];
    switch (action) {
      case 'accept':
        field.state = 'accepted';
        field.reviewed_value = field.normalized_candidate_value || field.raw_claimed_value;
        break;
      case 'correct':
        field.state = 'corrected';
        field.reviewed_value = reviewedValue;
        break;
      case 'reject':
        field.state = 'rejected';
        field.reviewed_value = null;
        break;
      case 'unreadable':
        field.state = 'unreadable';
        field.reviewed_value = null;
        break;
      case 'unavailable':
        field.state = 'unavailable';
        field.reviewed_value = null;
        break;
    }

    field.reviewed_by = 'Reviewer (Local)';
    field.review_note = note;
    field.reviewed_at = new Date().toISOString();
    obs.version += 1;

    // Recalculate review counts
    this.summary.reviewed_count = Math.min(
      this.summary.observation_count,
      this.summary.reviewed_count + 1
    );

    return { ...obs };
  }

  resolveFlag(flagId: string): void {
    const flag = this.flags.find((f) => f.flag_id === flagId);
    if (flag) {
      flag.state = 'resolved';
      this.summary.unresolved_flag_count = Math.max(0, this.summary.unresolved_flag_count - 1);
    }
  }

  createExportJob(format: 'pdf' | 'csv'): ExportJob {
    return {
      export_id: `EXP-${Date.now()}`,
      format,
      status: 'ready',
      draft: true,
      download_url: '#mock-download',
      checksum: 'sha256-4f92bc3e7a11883a',
      schema_version: 'v2.4',
      masking_policy_version: 'STRICT-2.1',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      error_code: null,
    };
  }
}

export const mockService = new MockService();
