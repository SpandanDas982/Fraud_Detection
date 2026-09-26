import { useState } from 'react';
import {
  FileQuestion,
  Copy,
  ShieldCheck,
  ArrowRight,
  GitCompare,
} from 'lucide-react';
import type { Flag } from '@/contracts/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface FlagsViewProps {
  flags: Flag[];
  onResolveFlag: (flagId: string) => void;
  onProceedToExport: () => void;
}

export const FlagsView: React.FC<FlagsViewProps> = ({ flags, onResolveFlag, onProceedToExport }) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filterTabs = [
    { id: 'all', label: `All (${flags.length})` },
    { id: 'inconsistency', label: 'Inconsistencies (1)' },
    { id: 'missing_info', label: 'Missing (1)' },
    { id: 'ambiguous_time', label: 'Ambiguous (1)' },
    { id: 'human_verification', label: 'Verification (1)' },
    { id: 'duplicate', label: 'Duplicates (2)' },
  ];

  const discrepancyFlag = flags.find((f) => f.code === 'AMOUNT_DISCREPANCY');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-surface p-5 rounded-lg border border-border shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-ink-secondary border-b border-steel-100 pb-2 gap-2">
          <span className="font-semibold text-primary">
            LEDGER MODE: Forensic Parity Inspection Active · HASH: SHA256-SYN-770-DELTA
          </span>
          <span>Auto-inference: Suppressed · Strict Dual-retention</span>
        </div>

        <div>
          <span className="text-[11px] font-mono uppercase text-ink-secondary font-semibold tracking-wider">
            Ledger Phase 04 / Conflicting Evidentiary Nodes
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-ink mt-0.5">
            Flags & Inconsistencies
          </h1>
          <p className="text-xs text-ink-secondary mt-1 max-w-3xl leading-relaxed">
            Observable data problems, missing records, and conflicting claims. Presented neutrally for human review without automated verdicts or fraud scores.
          </p>
        </div>
      </div>

      {/* 4 Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface p-4 rounded-lg border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-ink-secondary font-semibold">
              Missing Information
            </span>
            <FileQuestion className="h-4 w-4 text-ink-secondary" />
          </div>
          <p className="text-2xl font-bold text-ink mt-2 font-mono">1 item</p>
          <p className="text-[11px] text-ink-secondary mt-1">Awaiting manual entry or waiver</p>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-ink-secondary font-semibold">
              Human Verification
            </span>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-ink mt-2 font-mono">2 items</p>
          <p className="text-[11px] text-ink-secondary mt-1">Cross-document date ambiguities</p>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-ink-secondary font-semibold">
              Inconsistencies
            </span>
            <GitCompare className="h-4 w-4 text-review" />
          </div>
          <p className="text-2xl font-bold text-review mt-2 font-mono">1 item</p>
          <p className="text-[11px] text-ink-secondary mt-1">Conflicting raw extraction values</p>
        </div>

        <div className="bg-surface p-4 rounded-lg border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-ink-secondary font-semibold">
              Duplicates / Processing
            </span>
            <Copy className="h-4 w-4 text-ink-secondary" />
          </div>
          <p className="text-2xl font-bold text-ink mt-2 font-mono">2 items</p>
          <p className="text-[11px] text-ink-secondary mt-1">Content hash parities cataloged</p>
        </div>
      </div>

      {/* Filter Tabs & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-colors ${
                activeFilter === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-steel-100 text-steel-700 hover:bg-steel-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-ink-secondary">
          <span>SORTING:</span>
          <select aria-label="Sort flags by sequence" className="bg-surface border border-steel-300 rounded px-2 py-1 text-ink outline-none">
            <option>Evidence Sequence (Chronological)</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SYMMETRIC AMOUNT DISCREPANCY COMPARISON CARD */}
      {/* ========================================================================= */}
      {discrepancyFlag && (activeFilter === 'all' || activeFilter === 'inconsistency') && (
        <div className="bg-surface rounded-lg border-2 border-review-border p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-review-border/60 pb-3">
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-review" />
              <div>
                <h2 className="text-base font-bold text-ink font-mono">
                  Amount Discrepancy · Transaction T01
                </h2>
                <span className="text-[11px] font-mono text-ink-secondary">
                  REF #DSC-2024-0091
                </span>
              </div>
            </div>
            <Badge className="bg-review-soft text-review border-review-border text-xs px-2.5 py-1">
              REQUIRES REVIEW
            </Badge>
          </div>

          <p className="text-xs text-ink-secondary leading-relaxed">
            These linked sources report different amounts for the same transaction reference. Both values are retained in the record without automated preference.
          </p>

          {/* Symmetrical Sides Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Side A: Source S01 */}
            <div className="bg-steel-50 p-4 rounded-lg border border-steel-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-steel-200">
                <span className="font-bold text-primary">SOURCE S01 · PAYMENT SCREENSHOT</span>
                <span className="text-[10px] text-ink-secondary">SCAN-IMG-2024-09</span>
              </div>

              <div className="p-2.5 bg-surface rounded border border-steel-200 text-xs">
                <span className="text-[10px] text-ink-secondary uppercase block font-mono">
                  Original Ingestion Artifact
                </span>
                <p className="text-[11px] text-ink mt-0.5">Direct client attachment upload (PNG)</p>
                <p className="text-[10px] font-mono text-ink-secondary">Pixel OCR Confidence: 99.4%</p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-ink-secondary block">
                  Extracted Numerical Value
                </span>
                <p className="text-2xl font-bold text-ink font-mono mt-0.5">₹5,000</p>
                <p className="text-[10px] text-ink-secondary">
                  Currency: INR (Indian Rupee) · Confirmed explicit glyph
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-steel-200 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Transaction Alias:</span>
                  <span className="font-semibold text-ink">Transaction T01</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Reported Timestamp:</span>
                  <span className="text-ink">26 Sep 2024, 10:45 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Extraction Anchor:</span>
                  <span className="text-ink">Receipt summary field</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Field Verification Status:</span>
                  <span className="text-primary font-semibold">Extracted via Parser Engine v2</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <Button variant="outline" size="sm" onClick={() => toast.info('Previewing Source S01')} className="h-8 text-xs">
                  Open Source S01
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toast.info('Metadata inspector')} className="h-8 text-xs text-ink-secondary">
                  View Full Metadata
                </Button>
              </div>
            </div>

            {/* Side B: Source S02 */}
            <div className="bg-steel-50 p-4 rounded-lg border border-steel-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-steel-200">
                <span className="font-bold text-primary">SOURCE S02 · BANK STATEMENT EXCERPT</span>
                <span className="text-[10px] text-ink-secondary">PDF-STMT-PAGE-03</span>
              </div>

              <div className="p-2.5 bg-surface rounded border border-steel-200 text-xs">
                <span className="text-[10px] text-ink-secondary uppercase block font-mono">
                  Original Ingestion Artifact
                </span>
                <p className="text-[11px] text-ink mt-0.5">Official electronic bank PDF stream</p>
                <p className="text-[10px] font-mono text-ink-secondary">Parser Match Parity: 100% (Native Text)</p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-ink-secondary block">
                  Extracted Numerical Value
                </span>
                <p className="text-2xl font-bold text-error font-mono mt-0.5">₹7,000</p>
                <p className="text-[10px] text-ink-secondary">
                  Currency: INR (Indian Rupee) · Confirmed ledger statement
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-steel-200 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Transaction Alias:</span>
                  <span className="font-semibold text-ink">Transaction T01</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Reported Timestamp:</span>
                  <span className="text-ink">26 Sep 2024, 10:47 AM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Extraction Anchor:</span>
                  <span className="text-ink">Debit entry row #4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-secondary">Field Verification Status:</span>
                  <span className="text-primary font-semibold">Extracted via Native PDF Ingestion</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs">
                <Button variant="outline" size="sm" onClick={() => toast.info('Previewing Source S02')} className="h-8 text-xs">
                  Open Source S02
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toast.info('Metadata inspector')} className="h-8 text-xs text-ink-secondary">
                  View Full Metadata
                </Button>
              </div>
            </div>
          </div>

          {/* Forensic Reconciliation Directive Bar */}
          <div className="p-3.5 bg-steel-100/70 rounded-lg border border-steel-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-ink font-mono uppercase text-[11px]">
                Forensic Reconciliation Directive
              </p>
              <p className="text-ink-secondary text-[11px] mt-0.5">
                Preserve both values in public dossier ledger or annotate working premise.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="bg-primary text-white hover:bg-primary-hover font-semibold text-xs h-8"
                onClick={() => {
                  onResolveFlag(discrepancyFlag.flag_id);
                  toast.success('Retained both S01 (₹5k) & S02 (₹7k) in ledger packet.');
                }}
              >
                Mark as Known Conflict (Retain Both in Packet)
              </Button>
              <Button variant="outline" size="sm" onClick={() => toast.info('Note editor')} className="text-xs h-8 text-ink">
                Record Reviewer Note
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECONDARY FLAGS GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Missing UTR */}
        <div className="bg-surface rounded-lg border border-border p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-ink">FLAG ID: M-01</span>
              <Badge className="bg-review-soft text-review border-review-border text-[10px] font-mono">
                ACTION REQUIRED
              </Badge>
            </div>
            <h3 className="text-sm font-bold text-ink">
              Transaction reference (UTR) was not found
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Required by the Payment Notification verification checklist. Source S01 does not contain a numeric reference.
            </p>
            <div className="flex flex-wrap gap-1 text-[10px] font-mono pt-1">
              <span className="bg-steel-100 text-steel-700 px-1.5 py-0.5 rounded">Missing data</span>
              <span className="bg-steel-100 text-steel-700 px-1.5 py-0.5 rounded">Source S01</span>
              <span className="bg-steel-100 text-steel-700 px-1.5 py-0.5 rounded">Field: UTR_REF</span>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-steel-100">
            <div className="flex items-center gap-1.5">
              <Button size="sm" className="w-full bg-primary text-white text-xs h-8" onClick={() => toast.info('Enter reviewed UTR value')}>
                Add Reviewed Value
              </Button>
              <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => toast.info('Confirmed unavailable in source')}>
                Confirm Unavailable
              </Button>
            </div>
            <button onClick={() => toast.info('Opening Source S01')} className="w-full text-center text-xs text-primary hover:underline font-mono">
              Open Source S01
            </button>
          </div>
        </div>

        {/* Card 2: Date Interpretation Conflict */}
        <div className="bg-surface rounded-lg border border-border p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-ink">FLAG ID: D-04</span>
              <Badge className="bg-steel-100 text-primary border-steel-200 text-[10px] font-mono">
                FORMAT AMBIGUITY
              </Badge>
            </div>
            <h3 className="text-sm font-bold text-ink">
              Date interpretation conflict: 03/04/2026
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              DD/MM vs MM/DD ambiguity. Affects 2 linked line items in transaction sequencing log.
            </p>
            <div className="bg-steel-50 p-2 rounded text-[11px] font-mono space-y-1">
              <p className="text-ink">
                Branch A (DD/MM/YYYY): <span className="font-bold">03 April 2026</span>
              </p>
              <p className="text-ink">
                Branch B (MM/DD/YYYY): <span className="font-bold">04 March 2026</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-steel-100">
            <Button size="sm" className="w-full bg-primary text-white text-xs h-8" onClick={() => toast.info('Ambiguity resolution tool')}>
              Resolve Ambiguity
            </Button>
            <button onClick={() => toast.info('Opening Source S02')} className="w-full text-center text-xs text-primary hover:underline font-mono">
              Inspect Source S02
            </button>
          </div>
        </div>

        {/* Card 3: Duplicate Document Scan */}
        <div className="bg-surface rounded-lg border border-border p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-ink">FLAG ID: DUP-02</span>
              <Badge className="bg-steel-100 text-steel-700 border-steel-200 text-[10px] font-mono">
                CATALOGED PARITY
              </Badge>
            </div>
            <h3 className="text-sm font-bold text-ink">
              Duplicate document scan: receipt_duplicate_scan.jpg
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Visual and text hash match Source S01 (99.2% parity). Retained in inventory with duplicate tag without automatic deletion.
            </p>
            <div className="p-2 bg-steel-50 rounded text-xs font-mono flex items-center justify-between">
              <span className="text-ink font-bold">99%</span>
              <span className="text-ink-secondary">Perceptual Hash Distance: Δ2</span>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-steel-100">
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={() => toast.info('Side-by-side duplicate comparison')}>
                View Side-by-Side
              </Button>
              <Button size="sm" className="w-full bg-primary text-white text-xs h-8" onClick={() => toast.success('Retained duplicate in inventory')}>
                Keep Both
              </Button>
            </div>
            <p className="text-[10px] text-center text-ink-secondary font-mono">
              Archived in Root Dossier manifest as secondary exhibit
            </p>
          </div>
        </div>
      </div>

      {/* Protocol Notice & Proceed Button */}
      <div className="bg-surface border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs text-xs font-mono">
        <div>
          <p className="font-bold text-ink">CHAIN-OF-CUSTODY REVIEW PROTOCOL</p>
          <p className="text-ink-secondary text-[11px] mt-0.5">
            Under evidentiary protocol Rule 1003 & 1006, all conflicting data points are stamped into the final compilation dossier. No automated cleansing algorithm modifies raw source extractions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={() => toast.info('Discrepancy log generated.')} className="text-xs h-9">
            Export Discrepancy Log
          </Button>
          <Button onClick={onProceedToExport} className="bg-primary text-white hover:bg-primary-hover text-xs font-semibold h-9 px-4 gap-2">
            Proceed to Export (Phase 05)
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
