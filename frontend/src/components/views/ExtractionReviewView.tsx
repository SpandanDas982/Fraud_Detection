import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  Edit2,
  CheckCircle2,
  Eye,
  Undo2,
  Plus,
  HelpCircle,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import type { Observation, Source, FieldAction } from '@/contracts/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ExtractionReviewViewProps {
  sources: Source[];
  observations: Observation[];
  onUpdateFieldReview: (
    obsId: string,
    fieldName: string,
    action: FieldAction,
    reviewedValue?: string | null,
    note?: string | null
  ) => void;
  onContinueToTimeline: () => void;
}

export const ExtractionReviewView: React.FC<ExtractionReviewViewProps> = ({
  sources,
  observations,
  onUpdateFieldReview,
  onContinueToTimeline,
}) => {
  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeEditingField, setActiveEditingField] = useState<{
    obsId: string;
    fieldName: string;
    label: string;
    currentValue: string;
  } | null>(null);
  const [editInputValue, setEditInputValue] = useState('');
  const [editNoteValue, setEditNoteValue] = useState('');

  const currentSource = sources[selectedSourceIndex] || sources[0];
  const activeObs = observations.find((o) => o.source_id === currentSource.source_id) || observations[0];

  const handlePrevSource = () => {
    setSelectedSourceIndex((prev) => (prev > 0 ? prev - 1 : sources.length - 1));
  };

  const handleNextSource = () => {
    setSelectedSourceIndex((prev) => (prev < sources.length - 1 ? prev + 1 : 0));
  };

  const openEditModal = (obsId: string, fieldName: string, label: string, currentValue: string) => {
    setActiveEditingField({ obsId, fieldName, label, currentValue });
    setEditInputValue(currentValue);
    setEditNoteValue('');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!activeEditingField) return;
    onUpdateFieldReview(
      activeEditingField.obsId,
      activeEditingField.fieldName,
      'correct',
      editInputValue,
      editNoteValue || 'Manual correction applied by reviewer'
    );
    setEditDialogOpen(false);
    toast.success(`Updated ${activeEditingField.label} reviewed value.`);
  };

  const handleAccept = (obsId: string, fieldName: string, label: string) => {
    onUpdateFieldReview(obsId, fieldName, 'accept');
    toast.success(`Accepted ${label} candidate.`);
  };

  const handleMarkUnreadable = (obsId: string, fieldName: string, label: string) => {
    onUpdateFieldReview(obsId, fieldName, 'unreadable');
    toast.info(`Marked ${label} as unreadable.`);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-4 rounded-lg border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase text-ink-secondary font-semibold tracking-wider">
              Module 02 // Extraction Audit
            </span>
            <span className="text-border">·</span>
            <span className="text-[11px] font-mono text-primary font-semibold uppercase">
              Forensic Ledger Grade
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Observation & Field Review</h1>
          <p className="text-xs text-ink-secondary mt-0.5">
            Confirm candidate fields without hiding source context. Reviewer corrections never erase original extraction.
          </p>
        </div>

        {/* Source Selector Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-steel-50 border border-steel-200 rounded-md px-3 py-1.5 flex items-center gap-3">
            <span className="text-xs font-mono text-ink-secondary font-semibold">
              INDEX [ 0{selectedSourceIndex + 1} / 0{sources.length} ]
            </span>
            <select
              value={selectedSourceIndex}
              onChange={(e) => setSelectedSourceIndex(Number(e.target.value))}
              aria-label="Select source file for extraction review"
              className="bg-surface border border-steel-300 rounded text-xs font-mono py-1 px-2 text-ink outline-none"
            >
              {sources.map((s, idx) => (
                <option key={s.source_id} value={idx}>
                  {s.source_id}: {s.safe_filename}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevSource}
              className="h-8 w-8 text-ink border-steel-300"
              title="Previous Source"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextSource}
              className="h-8 w-8 text-ink border-steel-300"
              title="Next Source"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Pane: Source Preview */}
        <div className="lg:col-span-5 bg-surface rounded-lg border border-border shadow-xs overflow-hidden sticky top-20">
          {/* Preview Toolbar */}
          <div className="p-3 bg-steel-50 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-white font-mono text-xs">{currentSource.source_id}</Badge>
              <span className="text-xs font-mono text-ink-secondary">
                {currentSource.media_type.toUpperCase()} · 1.4 MB · 1080×2400
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="h-7 w-7 text-ink-secondary hover:text-ink"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] font-mono text-ink px-1">{zoomLevel}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="h-7 w-7 text-ink-secondary hover:text-ink"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="h-7 w-7 text-ink-secondary hover:text-ink"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Interactive Document / Screenshot Viewer */}
          <div className="p-6 bg-steel-100/50 min-h-[520px] flex items-center justify-center overflow-auto">
            <div
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease-out',
              }}
              className="w-full max-w-sm bg-white rounded-xl shadow-md border border-steel-300 p-5 space-y-4 font-sans text-xs select-none"
            >
              {/* Fake Phone Status Header */}
              <div className="flex items-center justify-between pb-2 border-b border-steel-200">
                <span className="font-bold tracking-tight text-ink font-mono">BHIM UPI VOUCHER</span>
                <span className="text-[10px] font-mono text-ink-secondary">26-SEP-2024</span>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-ink-secondary">
                <span>TXN STATE: SUCCESSFUL</span>
                <span>SRC: APP_INTENT</span>
              </div>

              {/* Highlighted Anchor Box */}
              <div className="relative border-2 border-dashed border-primary bg-primary-soft/30 p-3.5 rounded-lg text-center">
                <div className="absolute -top-2.5 left-2 bg-primary text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                  Anchor: Region [x:42, y:120] - Payment Amount
                </div>
                <p className="text-[10px] font-mono text-ink-secondary uppercase tracking-wider">
                  Transferred Amount
                </p>
                <p className="text-2xl font-bold text-ink mt-1">₹5,000.00</p>
                <p className="text-[10px] text-ink-secondary italic">INR Five Thousand Only</p>
              </div>

              <div className="space-y-2 pt-1 text-[11px]">
                <div className="flex justify-between py-1 border-b border-steel-100">
                  <span className="text-ink-secondary">To UPI ID:</span>
                  <span className="font-mono font-medium text-ink">user.masked****@okaxis</span>
                </div>
                <div className="flex justify-between py-1 border-b border-steel-100">
                  <span className="text-ink-secondary">Recipient Contact:</span>
                  <span className="font-mono font-medium text-ink">+91 98*** **210</span>
                </div>
                <div className="flex justify-between py-1 border-b border-steel-100">
                  <span className="text-ink-secondary">Debited From:</span>
                  <span className="font-mono text-ink">State Bank of India (***789)</span>
                </div>
                <div className="p-2 rounded bg-review-soft/60 border border-review-border/80">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-review font-semibold">BANK REFERENCE / UTR</span>
                    <span className="text-ink-secondary">OCR: NULL</span>
                  </div>
                  <p className="text-[10px] text-error font-medium mt-0.5">
                    ⚠ Value not visible in viewport*
                  </p>
                </div>
                <div className="flex justify-between py-1 border-b border-steel-100">
                  <span className="text-ink-secondary">Timestamp:</span>
                  <span className="font-mono text-ink">26 Sep 2024, 10:45 AM</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-ink-tertiary italic border-t border-steel-100 text-center">
                &ldquo;Vendor initial retainer tranche synthetic payout&rdquo;
              </div>

              <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-ink-secondary">
                <span>HASH: 9B2D-EB4A-FCD1</span>
                <span>SECURE PROVENANCE</span>
              </div>
            </div>
          </div>

          {/* Viewer Bottom Info */}
          <div className="p-2.5 bg-steel-50 border-t border-border flex items-center justify-between text-[11px] font-mono text-ink-secondary">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Active OCR Match Plane: Tesseract v5.3 / Model-L04
            </span>
          </div>
        </div>

        {/* Right Pane: Observation & Field Review Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-5">
            {/* Observation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-ink font-mono">{activeObs.observation_id}</h2>
                  <span className="text-sm font-semibold text-ink">{activeObs.event_type}</span>
                </div>
                <p className="text-xs text-ink-secondary font-mono mt-0.5">
                  ■ Source: {activeObs.source_id}
                </p>
              </div>
              <Badge className="bg-review-soft text-review border-review-border font-medium text-xs px-2.5 py-1 self-start sm:self-auto">
                Needs Review
              </Badge>
            </div>

            {/* Candidate Confidence Mandate Box */}
            <div className="p-3.5 bg-steel-50 rounded-lg border border-steel-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Candidate Confidence: High (94.2%)
                </span>
                <span className="text-[11px] font-mono text-ink-secondary">
                  Model: {activeObs.extraction_method}
                </span>
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Archival mandate: Confidence never determines legal truth. Human reviewer verification supersedes algorithmic probability.
              </p>
            </div>

            {/* Field Rows */}
            <div className="space-y-4 divide-y divide-border">
              {/* Field 1: Amount */}
              <div className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-ink">1. Amount</span>
                    <Badge variant="outline" className="text-[10px] font-mono bg-steel-50 border-steel-200">
                      CANONICAL_CURRENCY
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant={activeObs.fields.amount?.state === 'accepted' ? 'default' : 'outline'}
                      onClick={() => handleAccept(activeObs.observation_id, 'amount', 'Amount')}
                      className="h-7 text-xs gap-1 font-semibold"
                    >
                      <Check className="h-3 w-3" />
                      Accepted
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        openEditModal(
                          activeObs.observation_id,
                          'amount',
                          'Amount',
                          activeObs.fields.amount?.reviewed_value || 'INR 5,000.00'
                        )
                      }
                      className="h-7 text-xs text-ink-secondary hover:text-ink"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkUnreadable(activeObs.observation_id, 'amount', 'Amount')}
                      className="h-7 text-xs text-ink-secondary hover:text-error"
                    >
                      Mark Unreadable
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-steel-50/60 p-3 rounded-md border border-steel-200 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-ink-secondary">Extracted Candidate (Raw)</span>
                    <p className="font-mono font-bold text-ink mt-0.5 text-sm">
                      {activeObs.fields.amount?.raw_claimed_value || '₹5,000'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-ink-secondary">Normalized Standard</span>
                    <p className="font-mono font-bold text-primary mt-0.5 text-sm">
                      {activeObs.fields.amount?.normalized_candidate_value || 'INR 5,000.00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Field 2: Reported Date & Time */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-ink">2. Reported Date & Time</span>
                    <Badge variant="outline" className="text-[10px] font-mono bg-steel-50 border-steel-200">
                      UTC_CONVERTIBLE
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant={activeObs.fields.timestamp?.state === 'accepted' ? 'default' : 'outline'}
                      onClick={() => handleAccept(activeObs.observation_id, 'timestamp', 'Timestamp')}
                      className="h-7 text-xs gap-1 font-semibold"
                    >
                      <Check className="h-3 w-3" />
                      Accepted
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        openEditModal(
                          activeObs.observation_id,
                          'timestamp',
                          'Reported Date & Time',
                          activeObs.fields.timestamp?.raw_claimed_value || '26 Sep 2024, 10:45 AM'
                        )
                      }
                      className="h-7 text-xs text-ink-secondary hover:text-ink"
                    >
                      Modify
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-steel-50/60 p-3 rounded-md border border-steel-200 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-ink-secondary">Extracted Candidate</span>
                    <p className="font-mono font-semibold text-ink mt-0.5">
                      {activeObs.fields.timestamp?.raw_claimed_value || '26 Sep 2024, 10:45 AM'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-ink-secondary">ISO 8601 Stamp</span>
                    <p className="font-mono font-semibold text-primary mt-0.5">
                      {activeObs.fields.timestamp?.normalized_candidate_value || '2024-09-26T10:45:00+05:30'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Field 3: Transaction Reference (UTR) */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-ink">3. Transaction Reference (UTR)</span>
                    <Badge className="bg-review-soft text-review border-review-border text-[10px] font-mono">
                      GAP DETECTED
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() =>
                        openEditModal(
                          activeObs.observation_id,
                          'transaction_reference',
                          'Transaction Reference',
                          'REF-90310-P01'
                        )
                      }
                      className="h-7 text-xs bg-primary text-white hover:bg-primary-hover font-semibold"
                    >
                      Add Reviewed Value
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onUpdateFieldReview(activeObs.observation_id, 'transaction_reference', 'unavailable');
                        toast.info('Confirmed UTR reference unavailable in source S01.');
                      }}
                      className="h-7 text-xs border-steel-300 text-ink"
                    >
                      Confirm Unavailable
                    </Button>
                  </div>
                </div>

                <div className="bg-review-soft/40 p-3 rounded-md border border-review-border text-xs space-y-1">
                  <div className="flex items-center gap-2 text-review font-semibold text-[11px]">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>Candidate/Raw: Missing in source · Human verification required</span>
                  </div>
                  <p className="text-ink-secondary text-[11px] leading-relaxed">
                    The voucher does not display a 12-digit UTR reference. Verify if external bank ledger S02 correlates with this timestamp and amount.
                  </p>
                </div>
              </div>

              {/* Field 4: Recipient Contact */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-ink">4. Recipient Contact</span>
                    <Badge className="bg-steel-100 text-primary border-steel-200 text-[10px] font-mono">
                      CORRECTED BY REVIEWER
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        onUpdateFieldReview(
                          activeObs.observation_id,
                          'recipient_contact',
                          'accept'
                        );
                        toast.info('Reverted to original raw candidate.');
                      }}
                      className="h-7 text-xs text-ink-secondary gap-1 hover:text-ink"
                    >
                      <Undo2 className="h-3 w-3" />
                      Undo Correction
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.info('Restricted view: +91 98*** **210 (Raw preserved strictly in S3)')}
                      className="h-7 text-xs text-ink-secondary gap-1 hover:text-ink"
                    >
                      <Eye className="h-3 w-3" />
                      Original Raw
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-steel-50/60 p-3 rounded-md border border-steel-200 text-xs">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-ink-secondary">Original Extraction (Preserved)</span>
                    <p className="font-mono text-ink-tertiary mt-0.5 line-through">
                      +91 98*** **210
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-ink-secondary">Reviewed Value (Active Dossier)</span>
                      <span className="text-[10px] text-ink-secondary">Auditor: J. Doe · 11:04</span>
                    </div>
                    <p className="font-mono font-bold text-ink mt-0.5">
                      Contact C01 (Masked for privacy)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Categorical Tags */}
            <div className="pt-3 border-t border-border">
              <span className="text-[11px] font-mono uppercase text-ink-secondary block mb-2 font-semibold">
                Candidate Categorical Tags
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-steel-100 text-steel-700 text-xs px-2.5 py-1 rounded font-mono border border-steel-200">
                  Tag: Retainer <Check className="h-3 w-3" />
                </span>
                <span className="inline-flex items-center gap-1 bg-steel-100 text-steel-700 text-xs px-2.5 py-1 rounded font-mono border border-steel-200">
                  Tag: Vendor Disbursement <Check className="h-3 w-3" />
                </span>
                <button
                  onClick={() => toast.info('Tag input dialog opened')}
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary-hover border border-dashed border-steel-300 px-2 py-1 rounded"
                >
                  <Plus className="h-3 w-3" />
                  Add Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Review Completion Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-surface border-t border-border p-4 z-30 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FileCheck className="h-5 w-5 text-primary" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-ink font-mono">7 of 11 observations reviewed</span>
              <span className="text-xs font-mono text-ink-secondary">(63%)</span>
            </div>
            <div className="w-48 h-1.5 bg-steel-200 rounded-full overflow-hidden mt-1">
              <div className="w-[63%] h-full bg-primary rounded-full" />
            </div>
          </div>
          <span className="text-xs text-ink-secondary hidden sm:inline">
            4 observations pending human acceptance
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevSource}
            className="text-xs border-steel-300 text-ink"
          >
            Previous Unreviewed
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextSource}
            className="text-xs border-steel-300 text-ink"
          >
            Next Unreviewed
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success('Draft review state saved to browser storage.')}
            className="text-xs border-steel-300 text-ink"
          >
            Save Draft
          </Button>
          <Button
            onClick={onContinueToTimeline}
            className="bg-primary text-white hover:bg-primary-hover text-xs font-semibold h-9 px-4 gap-2"
          >
            Continue to Timeline
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Field Modal */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md bg-surface text-ink">
          <DialogHeader>
            <DialogTitle>Edit Reviewed Value — {activeEditingField?.label}</DialogTitle>
            <DialogDescription className="text-xs text-ink-secondary">
              Reviewer changes are tracked with auditor attribution. Original raw value remains immutable in source archive.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold text-ink mb-1 block">Reviewed Value</label>
              <Input
                value={editInputValue}
                onChange={(e) => setEditInputValue(e.target.value)}
                className="font-mono text-xs bg-steel-50 border-steel-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink mb-1 block">Reviewer Note (Optional)</label>
              <Input
                placeholder="Reason for modification..."
                value={editNoteValue}
                onChange={(e) => setEditNoteValue(e.target.value)}
                className="text-xs bg-steel-50 border-steel-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveEdit} className="bg-primary text-white">
              Save Correction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
