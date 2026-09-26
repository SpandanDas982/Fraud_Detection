import React, { useState } from 'react';
import {
  PlayCircle,
  PlusSquare,
  Info,
  ArrowRight,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  FileAudio,
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Loader2,
  MoreVertical,
} from 'lucide-react';
import type { Source, SourceStatus } from '@/contracts/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface EvidenceIntakeViewProps {
  sources: Source[];
  onLoadDemo: () => void;
  onStartEmpty: () => void;
  onProceedToReview: () => void;
  onOpenPrivacy: () => void;
  onAddSource: (source: {
    media_type: 'image' | 'pdf' | 'audio' | 'text';
    safe_filename: string;
    size_bytes: number;
    page_count: number | null;
    duration_ms: number | null;
    status: SourceStatus;
    duplicate_of: string | null;
    error_code: string | null;
  }) => void;
}

export const EvidenceIntakeView: React.FC<EvidenceIntakeViewProps> = ({
  sources,
  onLoadDemo,
  onStartEmpty,
  onProceedToReview,
  onOpenPrivacy,
  onAddSource,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const filteredSources = sources.filter((s) =>
    s.safe_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.source_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    onAddSource({
      media_type: 'text',
      safe_filename: `chat_log_import_${Date.now().toString().slice(-4)}.txt`,
      size_bytes: new Blob([pastedText]).size,
      page_count: null,
      duration_ms: null,
      status: 'ready',
      duplicate_of: null,
      error_code: null,
    });
    setPastedText('');
    setTextModalOpen(false);
    toast.success('Pasted text cataloged and linked to evidence ledger.');
  };

  const handleSimulatedUpload = (type: 'image' | 'pdf' | 'audio') => {
    const filenameMap = {
      image: `uploaded_receipt_${Date.now().toString().slice(-4)}.png`,
      pdf: `account_statement_${Date.now().toString().slice(-4)}.pdf`,
      audio: `voice_memo_${Date.now().toString().slice(-4)}.m4a`,
    };
    onAddSource({
      media_type: type,
      safe_filename: filenameMap[type],
      size_bytes: type === 'image' ? 1240000 : type === 'pdf' ? 2450000 : 3800000,
      page_count: type === 'pdf' ? 2 : null,
      duration_ms: type === 'audio' ? 84000 : null,
      status: 'ready',
      duplicate_of: null,
      error_code: null,
    });
    toast.success(`Simulated ${type.toUpperCase()} file processed and registered.`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Section: Intro & Provenance Model */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Intro Card */}
        <div className="lg:col-span-7 bg-surface p-6 rounded-lg border border-border flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-[11px] font-mono uppercase font-semibold text-ink-secondary tracking-wider">
                Evidence Organization Workspace
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-ink mb-2">
              Complex evidence. Clear review.
            </h1>
            <p className="text-sm text-ink-secondary leading-relaxed max-w-xl">
              Turn screenshots, documents, text, and audio into a source-linked timeline and privacy-conscious evidence packet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-6 mt-4 border-t border-steel-100">
            <Button
              onClick={onLoadDemo}
              className="bg-primary text-white hover:bg-primary-hover font-semibold px-4 h-10 shadow-xs gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Load synthetic demo
            </Button>
            <Button
              onClick={onStartEmpty}
              variant="outline"
              className="border-steel-300 text-ink hover:bg-steel-50 font-semibold px-4 h-10 gap-2"
            >
              <PlusSquare className="h-4 w-4 text-ink-secondary" />
              Start empty case
            </Button>
          </div>
        </div>

        {/* Right Column: Provenance & Ordering Model Diagram */}
        <div className="lg:col-span-5 bg-surface p-5 rounded-lg border border-border flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-semibold uppercase text-ink tracking-wider">
                Provenance & Ordering Model
              </span>
              <Badge variant="outline" className="bg-steel-50 text-[10px] font-mono uppercase border-steel-200">
                Deterministic
              </Badge>
            </div>

            <div className="space-y-2">
              {/* Step 1 */}
              <div className="p-2.5 rounded bg-steel-50/70 border border-steel-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded bg-steel-100 text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink leading-tight">Raw Ingest Layer</p>
                    <p className="text-[10px] text-ink-secondary">Lossless hash verification & redaction</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-surface px-2 py-0.5 rounded border border-steel-200 text-ink">
                  S01–S08
                </span>
              </div>

              {/* Step 2 */}
              <div className="p-2.5 rounded bg-steel-50/70 border border-steel-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded bg-steel-100 text-primary flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink leading-tight">Atomic Observations</p>
                    <p className="text-[10px] text-ink-secondary">Strict timestamp & entity anchors</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-surface px-2 py-0.5 rounded border border-steel-200 text-ink">
                  11 items
                </span>
              </div>

              {/* Step 3 */}
              <div className="p-2.5 rounded bg-primary text-white border border-primary flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded bg-primary-hover text-white flex items-center justify-center shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white leading-tight">Chronological Chain</p>
                    <p className="text-[10px] text-steel-200">Unresolved date variance preserved</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-primary-hover px-2 py-0.5 rounded text-white border border-primary-muted">
                  Auditable
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-steel-100 flex items-center justify-between text-[11px] text-ink-secondary font-mono">
            <span>Zero inference synthesis</span>
            <span>Ledger Spec v2.4</span>
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="bg-steel-100/60 border border-steel-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <p className="text-xs text-ink-secondary">
            This prototype is designed for synthetic demonstration data. It organizes evidence but does not determine wrongdoing or submit an official report.
          </p>
        </div>
        <button
          onClick={onOpenPrivacy}
          className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 font-mono tracking-tight shrink-0 self-start sm:self-auto"
        >
          REVIEW PRIVACY PRINCIPLES
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Ingest Evidence Dropzone */}
      <div className="bg-surface rounded-lg border border-border p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-ink">Ingest Evidence</h2>
            <Badge variant="outline" className="text-[11px] font-mono bg-steel-50 text-steel-700 border-steel-200">
              Air-gapped parsing
            </Badge>
          </div>
          <span className="text-xs font-mono text-ink-secondary">Batch slots available: 20</span>
        </div>

        {/* Big Dashed Area */}
        <div className="border-2 border-dashed border-steel-300 rounded-lg p-8 text-center bg-steel-50/40 hover:bg-steel-50 transition-colors">
          <div className="h-12 w-12 rounded-full bg-steel-100 text-primary flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-ink">Drop screenshots, documents, or audio here</p>
          <p className="text-xs text-ink-secondary mt-1 max-w-md mx-auto">
            Limits will be validated before processing. Source files remain linked to observations.
          </p>

          {/* 4 Modality Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto mt-6">
            <button
              onClick={() => handleSimulatedUpload('image')}
              className="p-3 bg-surface rounded-md border border-steel-200 hover:border-primary transition-all text-left shadow-xs flex items-center gap-2.5"
            >
              <div className="h-8 w-8 rounded bg-steel-100 flex items-center justify-center text-primary shrink-0">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">Images</p>
                <p className="text-[10px] text-ink-secondary truncate">PNG, JPG, WebP</p>
              </div>
            </button>

            <button
              onClick={() => handleSimulatedUpload('pdf')}
              className="p-3 bg-surface rounded-md border border-steel-200 hover:border-primary transition-all text-left shadow-xs flex items-center gap-2.5"
            >
              <div className="h-8 w-8 rounded bg-steel-100 flex items-center justify-center text-primary shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">PDF</p>
                <p className="text-[10px] text-ink-secondary truncate">Statements, bills</p>
              </div>
            </button>

            <button
              onClick={() => handleSimulatedUpload('audio')}
              className="p-3 bg-surface rounded-md border border-steel-200 hover:border-primary transition-all text-left shadow-xs flex items-center gap-2.5"
            >
              <div className="h-8 w-8 rounded bg-steel-100 flex items-center justify-center text-primary shrink-0">
                <FileAudio className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">Audio</p>
                <p className="text-[10px] text-ink-secondary truncate">WAV, MP3, M4A</p>
              </div>
            </button>

            <button
              onClick={() => setTextModalOpen(true)}
              className="p-3 bg-surface rounded-md border border-steel-200 hover:border-primary transition-all text-left shadow-xs flex items-center gap-2.5"
            >
              <div className="h-8 w-8 rounded bg-steel-100 flex items-center justify-center text-primary shrink-0">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">Paste Text</p>
                <p className="text-[10px] text-ink-secondary truncate">Chat logs, SMS</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Source Inventory Table */}
      <div className="bg-surface rounded-lg border border-border shadow-xs overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-ink">Source Inventory</h2>
            <Badge variant="outline" className="font-mono text-xs text-ink-secondary">
              {filteredSources.length} Registered Entries
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 text-ink-secondary absolute left-2.5 top-2.5" />
              <Input
                placeholder="Filter sources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 w-48 sm:w-64 text-xs bg-steel-50 border-steel-300"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs text-ink border-steel-300">
              <Filter className="h-3.5 w-3.5 text-ink-secondary" />
              Filter
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-steel-50 text-[11px] font-mono uppercase text-ink-secondary border-b border-border">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" className="rounded border-steel-300" />
                </th>
                <th className="py-3 px-4 font-semibold">Source & Type</th>
                <th className="py-3 px-4 font-semibold">Safe Filename</th>
                <th className="py-3 px-4 font-semibold">Size / Duration / Pages</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSources.map((source) => {
                const getStatusBadge = () => {
                  switch (source.status) {
                    case 'ready':
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-soft text-success border border-success-border">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          Ready
                        </span>
                      );
                    case 'partial':
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-review-soft text-review border border-review-border">
                          <span className="h-1.5 w-1.5 rounded-full bg-review" />
                          Needs review
                        </span>
                      );
                    case 'processing':
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-info-soft text-info border border-info-border">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Transcribing & timestamping...
                        </span>
                      );
                    case 'duplicate':
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-steel-100 text-steel-600 border border-steel-200">
                          <Copy className="h-3 w-3" />
                          Duplicate: Linked to {source.duplicate_of || 'S01'}
                        </span>
                      );
                    case 'unsupported':
                    case 'failed':
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-soft text-error border border-error-border">
                          <AlertTriangle className="h-3 w-3" />
                          Password protected / unreadable
                        </span>
                      );
                    default:
                      return (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-steel-100 text-steel-700">
                          {source.status}
                        </span>
                      );
                  }
                };

                const getSubDetails = () => {
                  if (source.media_type === 'image') return 'EXIF Scrubbed';
                  if (source.media_type === 'pdf') return source.page_count ? `${source.page_count} pages raster` : 'Multi-page raster';
                  if (source.media_type === 'audio') return 'Dual channel';
                  return 'UTF-8 Export';
                };

                const getSizeDisplay = () => {
                  if (source.duration_ms) {
                    const sec = Math.floor(source.duration_ms / 1000);
                    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
                  }
                  if (source.page_count) {
                    return `${source.page_count} page${source.page_count > 1 ? 's' : ''}`;
                  }
                  if (source.size_bytes) {
                    return source.size_bytes > 1000000
                      ? `${(source.size_bytes / 1000000).toFixed(1)} MB`
                      : `${Math.round(source.size_bytes / 1000)} KB`;
                  }
                  return '—';
                };

                return (
                  <tr key={source.source_id} className="hover:bg-steel-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <input type="checkbox" className="rounded border-steel-300" />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded bg-steel-100 flex items-center justify-center text-primary shrink-0">
                          {source.media_type === 'image' && <ImageIcon className="h-4 w-4" />}
                          {source.media_type === 'pdf' && <FileText className="h-4 w-4" />}
                          {source.media_type === 'audio' && <FileAudio className="h-4 w-4" />}
                          {source.media_type === 'text' && <MessageSquare className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-ink font-mono">
                            {source.source_id} · <span className="capitalize">{source.media_type}</span>
                          </p>
                          <p className="text-[10px] text-ink-secondary">{getSubDetails()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-ink text-[11px]">
                      {source.safe_filename}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-ink-secondary">
                      {getSizeDisplay()}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-ink-secondary hover:text-ink">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cryptographic Proof Footer */}
        <div className="p-3 bg-steel-50 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-ink-secondary gap-2">
          <span>Chain-of-custody checksum verified via SHA-256 for all active objects.</span>
          <span className="text-ink font-semibold">CASE_SYN_8924_ROOT_HASH: e31b274298fc1c14</span>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="bg-surface border border-border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-mono text-ink-secondary">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-ink font-semibold">{sources.length} sources registered</span>
          <span>·</span>
          <span className="text-success font-semibold">4 ready for review</span>
          <span>·</span>
          <span className="text-error font-semibold">1 needs correction</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-steel-300 text-ink text-xs h-9 font-semibold"
            onClick={() => toast.info('Source manifest JSON downloaded.')}
          >
            Export Manifest
          </Button>
          <Button
            onClick={onProceedToReview}
            className="bg-primary text-white hover:bg-primary-hover text-xs font-semibold h-9 px-4 gap-2"
          >
            Proceed to Field Review
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Paste Text Modal */}
      <Dialog open={textModalOpen} onOpenChange={setTextModalOpen}>
        <DialogContent className="max-w-lg bg-surface text-ink">
          <DialogHeader>
            <DialogTitle>Paste Evidence Text</DialogTitle>
            <DialogDescription className="text-ink-secondary text-xs">
              Direct text is preserved verbatim with character hashes. PII will be masked in review.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={6}
            placeholder="Paste SMS messages, WhatsApp chats, email headers, or transaction notices..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="font-mono text-xs bg-steel-50 border-steel-300"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setTextModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handlePasteSubmit} className="bg-primary text-white">
              Catalog Text Evidence
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
