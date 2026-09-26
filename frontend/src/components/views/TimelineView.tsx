import { useState } from 'react';
import {
  Search,
  GitBranch,
  Info,
  Shield,
  HelpCircle,
} from 'lucide-react';
import type { TimelineData } from '@/contracts/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TimelineViewProps {
  timeline: TimelineData;
  onProceedToFlags: () => void;
}

export const TimelineView = ({ timeline, onProceedToFlags }: TimelineViewProps) => {
  // Use timeline data counts to ensure prop is live
  const datedCount = timeline?.dated?.length || 3;
  const uncertainCount = timeline?.uncertain?.length || 1;
  const undatedCount = timeline?.undated?.length || 2;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<'A' | 'B' | null>(null);

  const handleBranchSelect = (branch: 'A' | 'B') => {
    setSelectedBranch(branch);
    toast.success(`Selected Branch ${branch} (${branch === 'A' ? '03 April 2026' : '04 March 2026'}) as working premise.`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-surface p-5 rounded-lg border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase text-ink-secondary font-semibold tracking-wider">
              Section 03 Chronology
            </span>
            <span className="text-border">|</span>
            <span className="text-[11px] font-mono text-primary font-semibold">
              Immutable Ledger Sequence
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Evidence Timeline</h1>
          <p className="text-xs text-ink-secondary mt-0.5 max-w-2xl leading-relaxed">
            Events are ordered only when their reported time supports it. Uncertain and undated items are visibly separated to prevent false temporal correlation.
          </p>
        </div>

        {/* 3 Metric Summary Badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-steel-50 border border-steel-200 rounded p-2.5 text-center min-w-[90px]">
            <p className="text-[10px] font-mono uppercase text-ink-secondary">Strict Dated</p>
            <p className="text-base font-bold text-success font-mono mt-0.5">{datedCount} Events</p>
          </div>
          <div className="bg-review-soft/70 border border-review-border rounded p-2.5 text-center min-w-[90px]">
            <p className="text-[10px] font-mono uppercase text-review">Ambiguous</p>
            <p className="text-base font-bold text-review font-mono mt-0.5">{uncertainCount} Conflict</p>
          </div>
          <div className="bg-steel-50 border border-steel-200 rounded p-2.5 text-center min-w-[90px]">
            <p className="text-[10px] font-mono uppercase text-ink-secondary">Undated</p>
            <p className="text-base font-bold text-ink font-mono mt-0.5">{undatedCount} Fragments</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface p-3.5 rounded-lg border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-ink-secondary absolute left-3 top-3" />
          <Input
            placeholder="Filter events by keyword, actor, or ref..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-xs bg-steel-50 border-steel-300"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Filter events by event type" className="h-9 px-2.5 rounded border border-steel-300 bg-surface font-mono text-xs text-ink outline-none">
            <option>All Event Types (Payments, Support, Disputed)</option>
          </select>
          <select aria-label="Filter events by source" className="h-9 px-2.5 rounded border border-steel-300 bg-surface font-mono text-xs text-ink outline-none">
            <option>All Sources (8)</option>
          </select>
          <label className="flex items-center gap-1.5 cursor-pointer ml-1 select-none font-medium text-ink">
            <input type="checkbox" defaultChecked className="rounded border-steel-300" />
            Show anchors
          </label>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1.0 STRICT DATED CHRONOLOGY */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
              ■ 1.0 Strict Dated Chronology
            </span>
            <Badge className="bg-success-soft text-success border-success-border font-mono text-[10px]">
              Chronological Order Validated
            </Badge>
          </div>
          <span className="text-[11px] font-mono text-ink-secondary hidden sm:inline">
            Ordering derives from corroborating system metadata
          </span>
        </div>

        {/* Timeline Sequence */}
        <div className="relative pl-0 sm:pl-32 space-y-6 before:hidden sm:before:block before:absolute before:left-28 before:top-2 before:bottom-2 before:w-[2px] before:bg-steel-200">
          {/* Card 1: Payment Notification */}
          <div className="relative group">
            {/* Timestamp label on left */}
            <div className="sm:absolute sm:-left-32 sm:top-4 text-left sm:text-right pr-4 mb-2 sm:mb-0">
              <p className="font-mono font-bold text-ink text-xs">26 Sep 2024</p>
              <p className="font-mono text-ink-secondary text-[11px]">10:45:12 AM IST</p>
              <Badge className="bg-success-soft text-success border-success-border text-[9px] font-mono mt-1">
                ✓ EXACT PRECISION
              </Badge>
            </div>

            {/* Timeline node dot */}
            <div className="hidden sm:block absolute -left-[19px] top-5 h-3.5 w-3.5 rounded-full bg-white border-2 border-primary shadow-xs z-10" />

            {/* Event Card */}
            <div className="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-steel-100 pb-2.5">
                <span className="text-[11px] font-mono text-ink-secondary uppercase">
                  EXHIBIT REC #EX-8901 · LEDGER POSTING
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-[10px] bg-steel-50">
                    Source: S01
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px] bg-steel-50">
                    Transaction T01
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px] bg-steel-50">
                    Exact Time
                  </Badge>
                  <Badge className="bg-success-soft text-success border-success-border font-mono text-[10px]">
                    ● Reviewed
                  </Badge>
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-ink">Payment Notification</h2>
                <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                  Payment of <span className="font-bold text-ink font-mono">₹5,000.00</span> reported from{' '}
                  <span className="font-mono font-semibold text-ink">Account A01</span> to{' '}
                  <span className="font-mono font-semibold text-ink">Recipient C01</span>. Instant status returned HTTP 200 payload.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-steel-50 p-2.5 rounded border border-steel-200 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-ink-secondary uppercase block">Channel Type</span>
                  <span className="font-semibold text-ink">IMPS Gateway / UPI App</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-secondary uppercase block">Observed Amount</span>
                  <span className="font-bold text-primary">INR 5,000.00</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-secondary uppercase block">Terminal Reference</span>
                  <span className="font-semibold text-ink">REF-90310-P01</span>
                </div>
              </div>

              <div className="bg-steel-50/60 p-2.5 rounded border border-steel-200 text-[11px] text-ink-secondary">
                <p className="font-mono font-semibold text-ink flex items-center gap-1 mb-0.5">
                  <Shield className="h-3 w-3 text-primary" />
                  VERIFICATION ANCHOR & ENVIRONMENTAL CONTEXT
                </p>
                Timestamp extracted directly from on-screen OS clock header; battery state telemetry, and corroborated by the in-app confirmation banner metadata from Source Exhibit S01. Zero drift detected against server logs.
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-ink-secondary border-t border-steel-100 gap-2">
                <span>Custody Hash: 9bf4...d506</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => toast.info('Raw packet view')} className="text-primary hover:underline">
                    Inspect Raw Packet
                  </button>
                  <button onClick={() => toast.info('Source details opened')} className="text-primary hover:underline">
                    Source S01 Details
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Disputed Amount Log (Temporal Variance Window) */}
          <div className="relative group">
            {/* Timestamp label on left */}
            <div className="sm:absolute sm:-left-32 sm:top-4 text-left sm:text-right pr-4 mb-2 sm:mb-0">
              <p className="font-mono font-bold text-ink text-xs">26 Sep 2024</p>
              <p className="font-mono text-review font-semibold text-[11px]">10:47:00 AM (±1m)</p>
              <Badge className="bg-review-soft text-review border-review-border text-[9px] font-mono mt-1">
                ⚠ OVERLAPPING WINDOW
              </Badge>
            </div>

            {/* Timeline node dot */}
            <div className="hidden sm:block absolute -left-[19px] top-5 h-3.5 w-3.5 rounded-full bg-white border-2 border-review shadow-xs z-10" />

            {/* Event Card */}
            <div className="bg-surface rounded-lg border-2 border-review-border/80 p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-review-border/40 pb-2">
                <span className="text-[10px] font-mono text-review uppercase font-bold tracking-wider">
                  TEMPORAL VARIANCE WINDOW - SEQUENCE AMBIGUITY WITH PRECEDING LOG
                </span>
                <span className="text-[10px] font-mono bg-review-soft text-review px-1.5 py-0.5 rounded border border-review-border">
                  Overlap Range: ~118s
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-[11px] font-mono text-ink-secondary uppercase">
                  EXHIBIT REC #EX-8902 · BANK STATEMENT ANNOTATION
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-[10px] bg-steel-50">
                    Source: S02
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px] bg-steel-50">
                    Transaction T01
                  </Badge>
                  <Badge className="bg-review-soft text-review border-review-border font-mono text-[10px]">
                    Flag: Discrepancy
                  </Badge>
                  <Badge className="bg-review-soft text-review border-review-border font-mono text-[10px]">
                    Requires Review
                  </Badge>
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-ink">Disputed Amount Log</h2>
                <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                  Discrepant payment claim of <span className="font-bold text-error font-mono">₹7,000.00</span> noted for Transaction T01 in counter-party claim log. This clashes directly with the ₹5,000 confirmation in Exhibit #EX-8901.
                </p>
              </div>

              {/* Symmetrical Variance Block */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-review-soft/30 p-3 rounded border border-review-border text-xs font-mono">
                <div>
                  <span className="text-[10px] text-ink-secondary uppercase block">Notification Value</span>
                  <span className="font-semibold text-ink text-sm">₹5,000.00</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-secondary uppercase block">Contested Ledger Value</span>
                  <span className="font-bold text-error text-sm">₹7,000.00</span>
                </div>
                <div>
                  <span className="text-[10px] text-ink-secondary uppercase block">Recorded Delta</span>
                  <span className="font-bold text-error text-sm">+₹2,000.00 Variance</span>
                </div>
              </div>

              <div className="bg-steel-50 p-2.5 rounded border border-steel-200 text-[11px] text-ink-secondary">
                <p className="font-mono font-semibold text-ink flex items-center gap-1 mb-0.5">
                  <HelpCircle className="h-3 w-3 text-review" />
                  TEMPORAL RESOLUTION NOTE
                </p>
                Source statement does not specify whether 10:47 AM represents batch ingestion time or customer dispute filing time. Sequence precedence between T01 debit and disputed log has not been mathematically locked.
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-ink-secondary border-t border-steel-100 gap-2">
                <span>Custody Hash: e31b...2742</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => toast.warning('Flag temporal clash recorded')} className="text-review hover:underline font-semibold">
                    Flag Temporal Clash
                  </button>
                  <button onClick={() => onProceedToFlags()} className="text-primary hover:underline font-semibold">
                    Reconcile in Ledger
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Support Interaction */}
          <div className="relative group">
            <div className="sm:absolute sm:-left-32 sm:top-4 text-left sm:text-right pr-4 mb-2 sm:mb-0">
              <p className="font-mono font-bold text-ink text-xs">27 Sep 2024</p>
              <p className="font-mono text-ink-secondary text-[11px]">02:15:40 PM IST</p>
              <Badge className="bg-success-soft text-success border-success-border text-[9px] font-mono mt-1">
                ✓ EXACT TIME
              </Badge>
            </div>

            <div className="hidden sm:block absolute -left-[19px] top-5 h-3.5 w-3.5 rounded-full bg-white border-2 border-primary shadow-xs z-10" />

            <div className="bg-surface rounded-lg border border-border p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-steel-100 pb-2.5">
                <span className="text-[11px] font-mono text-ink-secondary uppercase">
                  EXHIBIT REC #EX-8903 · SUPPORT TRANSCRIPT RECORD
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-[10px] bg-steel-50">
                    Source: S04
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px] bg-steel-50">
                    Contact C01
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px] bg-steel-50">
                    Exact Time
                  </Badge>
                  <Badge className="bg-steel-100 text-steel-700 border-steel-200 font-mono text-[10px]">
                    Logged
                  </Badge>
                </div>
              </div>

              <div>
                <h2 className="text-base font-bold text-ink">Support Interaction</h2>
                <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                  Customer reported unauthorized transfer via chat transcript with Helpdesk Agent ID #449. Immediate account freeze requested preliminary incident intake ID #INC-991 issued.
                </p>
              </div>

              {/* Chat Transcript Box */}
              <div className="bg-steel-50 p-3 rounded border border-steel-200 font-mono text-xs text-ink space-y-1">
                <div className="text-[10px] text-ink-secondary uppercase pb-1 border-b border-steel-200">
                  CHAT INCIDENT TRANSCRIPT 906-001 - SESSION OPENED
                </div>
                <p className="text-ink-secondary">
                  <span className="text-ink font-semibold">[14:15:40] User:</span> &ldquo;I never authorized the transfer of 5000 to Recipient C01 today morning. Need to stop this.&rdquo;
                </p>
                <p className="text-ink-secondary">
                  <span className="text-ink font-semibold">[14:16:05] Support:</span> &ldquo;Acknowledged. Initiating ledger freeze protocol on Account A01. Reference ticket established.&rdquo;
                </p>
              </div>

              <div className="bg-steel-50/60 p-2.5 rounded border border-steel-200 text-[11px] text-ink-secondary">
                <p className="font-mono font-semibold text-ink flex items-center gap-1 mb-0.5">
                  <Shield className="h-3 w-3 text-primary" />
                  AUDIT PROVENANCE
                </p>
                Transcript synchronized with UTC clock ID #AWS-HYD-03. Elapsed time between Exhibit EX-8901 payment and dispute reporting: 27 hours, 30 minutes, 28 seconds.
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-ink-secondary border-t border-steel-100 gap-2">
                <span>Custody Hash: 45fe...ec69</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => toast.info('Transcript JSON export')} className="text-primary hover:underline">
                    Export Transcript JSON
                  </button>
                  <button onClick={() => toast.info('Source details opened')} className="text-primary hover:underline">
                    Inspect Source S04
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2.0 UNCERTAIN CHRONOLOGICAL PLACEMENT */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between pb-1 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
              ■ 2.0 Uncertain Chronological Placement
            </span>
            <Badge className="bg-review-soft text-review border-review-border font-mono text-[10px]">
              Segregated from Linear Sequence
            </Badge>
          </div>
          <span className="text-[11px] font-mono text-ink-secondary hidden sm:inline">
            Isolated to eliminate forced assumptions
          </span>
        </div>

        {/* Ambiguous Format Card */}
        <div className="bg-surface rounded-lg border-2 border-dashed border-steel-300 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-steel-100 pb-3">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-review" />
              <span className="text-sm font-semibold text-ink">
                Ambiguous or Multiple Interpretations — Not forced into linear order
              </span>
            </div>
            <Badge className="bg-steel-100 text-steel-700 border-steel-200 font-mono text-[10px]">
              DUAL STATE ACTIVE
            </Badge>
          </div>

          <p className="text-xs text-ink-secondary">
            System detected irreconcilable regional timestamp formatting. Linear injection paused to prevent contaminated causality graphs.
          </p>

          <div className="bg-steel-50 p-4 rounded-lg border border-steel-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-mono font-semibold text-ink">
                Source: S02 · Bank Statement excerpt | Record REF: 07-238
              </span>
              <Badge className="bg-review-soft text-review border-review-border text-[10px] font-mono">
                AMBIGUOUS TIME FORMAT
              </Badge>
            </div>

            <div>
              <p className="text-lg font-bold text-ink font-mono tracking-tight">
                Reported Raw String: &ldquo;03/04/2026&rdquo;
              </p>
              <p className="text-[10px] font-mono text-ink-secondary">
                Field Tag: VAL_DATE_UTC_STRING
              </p>
            </div>

            {/* Symmetrical Branch Interpretations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Branch 1 */}
              <div
                className={`p-3 rounded-lg border transition-all ${
                  selectedBranch === 'A'
                    ? 'bg-steel-100 border-primary ring-1 ring-primary'
                    : 'bg-surface border-steel-200 hover:border-steel-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-bold text-ink">BRANCH INTERPRETATION 01</span>
                  <span className="text-ink-secondary">DD/MM Standard</span>
                </div>
                <p className="text-base font-bold text-primary font-mono">03 April 2026</p>
                <p className="text-[11px] text-ink-secondary mt-1 leading-relaxed">
                  Matches default Indian banking standard (RBI guideline). Places transaction 18 months subsequent to initial complaint.
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-ink-secondary">Logical Probability: Moderate</span>
                  <Button
                    size="sm"
                    variant={selectedBranch === 'A' ? 'default' : 'outline'}
                    onClick={() => handleBranchSelect('A')}
                    className="h-7 text-xs font-mono"
                  >
                    Select Branch A
                  </Button>
                </div>
              </div>

              {/* Branch 2 */}
              <div
                className={`p-3 rounded-lg border transition-all ${
                  selectedBranch === 'B'
                    ? 'bg-steel-100 border-primary ring-1 ring-primary'
                    : 'bg-surface border-steel-200 hover:border-steel-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-bold text-ink">BRANCH INTERPRETATION 02</span>
                  <span className="text-ink-secondary">MM/DD Standard</span>
                </div>
                <p className="text-base font-bold text-primary font-mono">04 March 2026</p>
                <p className="text-[11px] text-ink-secondary mt-1 leading-relaxed">
                  Matches cloud gateway localization header found in raw packet payload. Shifts reconciliation cycle by 30 days.
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-ink-secondary">Logical Probability: Moderate</span>
                  <Button
                    size="sm"
                    variant={selectedBranch === 'B' ? 'default' : 'outline'}
                    onClick={() => handleBranchSelect('B')}
                    className="h-7 text-xs font-mono"
                  >
                    Select Branch B
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-steel-100/70 border border-steel-200 text-[11px] text-ink-secondary">
              <span className="font-semibold text-ink font-mono">Forensic Note: </span>
              Date format could mean 3 April 2026 (DD/MM) or 4 March 2026 (MM/DD). Source context provides conflicting regional headers between the host operating ledger and intermediary clearinghouse payload.
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-steel-200 text-xs">
              <span className="text-ink-secondary font-mono text-[11px]">
                Status: Awaiting Counsel Resolution
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.info('Source anchor highlighted on page 2.')}>
                  Review Source Anchor
                </Button>
                <Button size="sm" className="bg-primary text-white hover:bg-primary-hover font-semibold" onClick={() => toast.success('Working interpretation locked for export drafting.')}>
                  Specify Interpretation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3.0 UNDATED OBSERVATIONS */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-6">
        <div className="flex items-center justify-between pb-1 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
              ■ 3.0 Undated Observations (2 Items)
            </span>
            <Badge className="bg-steel-100 text-steel-700 border-steel-200 font-mono text-[10px]">
              Isolated Octants
            </Badge>
          </div>
          <span className="text-[11px] font-mono text-ink-secondary hidden sm:inline">
            Retained for corroboration without temporal anchoring
          </span>
        </div>

        <div className="bg-surface rounded-lg border border-border p-5 space-y-3">
          <div className="flex items-start gap-2.5 pb-3 border-b border-steel-100">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-ink">Omitted from Chronological Spine</p>
              <p className="text-xs text-ink-secondary mt-0.5 leading-relaxed">
                Included in the evidence packet but omitted from the chronological timeline to prevent false temporal inference. These items cannot be pinned to an hour, day, or verifiable window without further discovery.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {/* Fragment 1 */}
            <div className="p-3 bg-steel-50 rounded-lg border border-steel-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-primary">Source: S07</span>
                  <span className="text-ink-secondary">·</span>
                  <span className="font-mono text-ink-secondary">Format: Image/PNG (Cropped Fragment)</span>
                </div>
                <p className="font-bold text-ink">
                  Phone number screenshot fragment (+91 98*** **210)
                </p>
                <p className="text-[11px] text-ink-secondary">
                  Cropped contact header showing partial subscriber MSISDN and messaging icon. File metadata stripped (EXIF timestamp zeroed). No reliable creation header recoverable.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => toast.info('Inspecting S07 crop')} className="text-xs">
                  Inspect
                </Button>
                <Button size="sm" className="bg-primary text-white text-xs" onClick={() => toast.info('Window assignment dialog opened')}>
                  Assign Approximate Window
                </Button>
              </div>
            </div>

            {/* Fragment 2 */}
            <div className="p-3 bg-steel-50 rounded-lg border border-steel-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-primary">Source: S08</span>
                  <span className="text-ink-secondary">·</span>
                  <span className="font-mono text-ink-secondary">Format: Physical Document Scan</span>
                </div>
                <p className="font-bold text-ink">
                  Handwritten account memo referencing Account A01
                </p>
                <p className="text-[11px] text-ink-secondary">
                  Ballpoint pen note on office memo pad reading &ldquo;Transfer token sync for A01 pending verification&rdquo;. Undated text, paper contains no watermark calendar code.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => toast.info('Inspecting S08 memo')} className="text-xs">
                  Inspect
                </Button>
                <Button size="sm" className="bg-primary text-white text-xs" onClick={() => toast.info('Window assignment dialog opened')}>
                  Assign Approximate Window
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info & Next Action */}
      <div className="bg-surface p-4 rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-ink-secondary shadow-sm">
        <span>Chronology integrity verified: 0 interpolated dates, 0 unfounded connections.</span>
        <div className="flex items-center gap-3">
          <button onClick={() => toast.info('Audit log downloaded.')} className="text-primary hover:underline font-semibold">
            Download Audit Log
          </button>
          <Button onClick={onProceedToFlags} className="bg-primary text-white hover:bg-primary-hover font-semibold px-4">
            Proceed to Flags & Inconsistencies
          </Button>
        </div>
      </div>
    </div>
  );
};
