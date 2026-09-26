import { useState } from 'react';
import {
  FileText,
  Table as TableIcon,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  Calendar,
  Lock,
  Download,
  Info,
  Phone,
  Landmark,
  CreditCard,
  Globe,
  Loader2,
} from 'lucide-react';
import type { ExportReadiness } from '@/contracts/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ExportViewProps {
  exportReadiness: ExportReadiness;
  onGenerateExport: (format: 'pdf' | 'csv') => void;
}

export const ExportView = ({ exportReadiness, onGenerateExport }: ExportViewProps) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadKey, setDownloadKey] = useState(true);

  const handlePdfClick = () => {
    setDownloadingPdf(true);
    setTimeout(() => {
      setDownloadingPdf(false);
      onGenerateExport('pdf');
      // Trigger a simulated browser download
      const element = document.createElement('a');
      const file = new Blob([
        `%PDF-1.4\n% Evidence Ledger — Forensic Evidence Dossier (Draft)\n% Case: SYN-8924\n% SHA-256: 4f92bc3e7a11883a\n% Notice: For human review only. Does not determine guilt or fraud.`
      ], { type: 'application/pdf' });
      element.href = URL.createObjectURL(file);
      element.download = 'evidence_ledger_SYN-8924_draft.pdf';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('Generated PDF Evidence Dossier (Draft watermarked).');
    }, 1200);
  };

  const handleCsvClick = () => {
    setDownloadingCsv(true);
    setTimeout(() => {
      setDownloadingCsv(false);
      onGenerateExport('csv');
      // Trigger a simulated browser download
      const csvContent =
        'observation_id,source_id,event_type,time_display,precision,amount_claimed,actor_alias,flags\n' +
        'OBS-081,S01,Payment Notification,"26 Sep 2024, 10:45 AM",exact,₹5000.00,Contact C01,AMOUNT_DISCREPANCY\n' +
        'OBS-082,S02,Disputed Amount Log,"26 Sep 2024, 10:47 AM",exact,₹7000.00,Account A01,AMOUNT_DISCREPANCY\n' +
        'OBS-083,S04,Support Interaction,"27 Sep 2024, 02:15 PM",exact,N/A,Contact C01,\n' +
        'OBS-084,S02,Ambiguous Date,03/04/2026,ambiguous,N/A,N/A,AMBIGUOUS_TIME\n';
      const element = document.createElement('a');
      const file = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      element.href = URL.createObjectURL(file);
      element.download = 'evidence_ledger_SYN-8924_timeline.csv';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('Generated RFC-4180 Structured Chronology CSV.');
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="bg-surface p-5 rounded-lg border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase text-ink-secondary font-semibold tracking-wider">
            Docket #SYN-8924 / Phase 5 / Distribution Packaging
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-ink mt-0.5">
            Evidence Packet Export
          </h1>
          <p className="text-xs text-ink-secondary mt-1 max-w-2xl leading-relaxed">
            Prepare a source-linked, privacy-sanitized evidence packet. Review masking schemas and record completeness prior to archival rendering.
          </p>
        </div>

        {/* Archival Integrity Seal */}
        <div className="bg-steel-50 border border-steel-200 p-3 rounded-lg flex items-center gap-3 shrink-0 shadow-xs">
          <div className="text-right font-mono">
            <p className="text-[10px] text-ink-secondary uppercase">Archival Integrity</p>
            <p className="text-xs font-bold text-ink">SHA256: 4F92...883A</p>
          </div>
          <div className="h-9 w-9 rounded-md bg-steel-100 border border-steel-200 flex items-center justify-center text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GATE STATUS BANNER */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-steel-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider">
              Gate Status:
            </span>
            <Badge className="bg-review-soft text-review border-review-border font-mono text-xs px-2.5 py-0.5">
              ■ DRAFT PACKET (REVIEW INCOMPLETE)
            </Badge>
          </div>
          <span className="text-xs font-mono text-ink-secondary flex items-center gap-1">
            <Info className="h-3.5 w-3.5" />
            Unresolved items will be tagged with provisional appendix headers
          </span>
        </div>

        {/* 4 Readiness Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Metric 1 */}
          <div className="bg-steel-50/70 p-3 rounded-md border border-steel-200">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-ink uppercase">Sources Packaged</span>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </div>
            <p className="text-sm font-bold text-ink mt-1 font-mono">
              {exportReadiness.sources_packaged} of {exportReadiness.sources_total} sources packaged
            </p>
            <p className="text-[10px] text-ink-secondary mt-0.5">100% locators anchored to ledger</p>
          </div>

          {/* Metric 2 */}
          <div className="bg-review-soft/40 p-3 rounded-md border border-review-border">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-review uppercase">Observations</span>
              <AlertTriangle className="h-4 w-4 text-review" />
            </div>
            <p className="text-sm font-bold text-ink mt-1 font-mono">
              {exportReadiness.observations_verified} of {exportReadiness.observations_total} verified
            </p>
            <p className="text-[10px] text-review mt-0.5">
              {exportReadiness.unresolved_flags} pending reviewer confirmation
            </p>
          </div>

          {/* Metric 3 */}
          <div className="bg-steel-50/70 p-3 rounded-md border border-steel-200">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-ink uppercase">Contradictions</span>
              <GitCompare className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-bold text-ink mt-1 font-mono">1 active discrepancy</p>
            <p className="text-[10px] text-ink-secondary mt-0.5">₹5k vs ₹7k · Both retained in Appx C</p>
          </div>

          {/* Metric 4 */}
          <div className="bg-steel-50/70 p-3 rounded-md border border-steel-200">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-ink uppercase">Temporal Precision</span>
              <Calendar className="h-4 w-4 text-ink-secondary" />
            </div>
            <p className="text-sm font-bold text-ink mt-1 font-mono">
              {exportReadiness.uncertain_count} ambiguous · {exportReadiness.undated_count} undated
            </p>
            <p className="text-[10px] text-ink-secondary mt-0.5">Cataloged in Section B dossier</p>
          </div>
        </div>

        {/* Guidance Protocol Note */}
        <div className="p-3 bg-steel-100/60 rounded border border-steel-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-ink-secondary gap-2">
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary shrink-0" />
            Guidance Protocol: You may proceed with generating a Draft Packet. An immutable audit note documenting incomplete review status will be watermarked directly on the cover register.
          </span>
          <span className="text-ink font-semibold shrink-0">● POLICY STRICT 2.1 APPLIED</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* IDENTITY SANITIZATION PREVIEW */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-lg border border-border p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-steel-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <h2 className="text-base font-bold text-ink">Identity Sanitization Preview</h2>
              <Badge className="bg-steel-100 text-primary border-steel-200 text-[10px] font-mono">
                ZERO-DATA LEAK MODE
              </Badge>
            </div>
            <p className="text-xs text-ink-secondary mt-0.5">
              Masking applies deterministically to the generated export packet. Original uploaded files remain restricted and are not rewritten or permanently altered in storage.
            </p>
          </div>

          <div className="bg-steel-50 border border-steel-200 p-2.5 rounded-md flex items-center gap-2.5 shrink-0 text-xs">
            <input
              type="checkbox"
              id="downloadKey"
              checked={downloadKey}
              onChange={(e) => setDownloadKey(e.target.checked)}
              className="rounded border-steel-300"
            />
            <label htmlFor="downloadKey" className="cursor-pointer select-none font-mono">
              <span className="font-bold text-ink block leading-tight">Download Alias Key Separately</span>
              <span className="text-[10px] text-ink-secondary">AES-GCM-256 .keyfile for legal counsel</span>
            </label>
          </div>
        </div>

        {/* Table of Privacy Transforms */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-steel-50 text-[10px] uppercase text-ink-secondary border-b border-border">
              <tr>
                <th className="py-2.5 px-3 font-semibold">Source Identifier Field</th>
                <th className="py-2.5 px-3 font-semibold">Original Value (Restricted View)</th>
                <th className="py-2.5 px-2 text-center w-8">Transform</th>
                <th className="py-2.5 px-3 font-semibold">Masked Export Token (Dossier Format)</th>
                <th className="py-2.5 px-3 font-semibold">Sanitization Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Row 1 */}
              <tr className="hover:bg-steel-50/50">
                <td className="py-3 px-3">
                  <span className="flex items-center gap-2 font-sans font-semibold text-ink">
                    <Phone className="h-3.5 w-3.5 text-ink-secondary" />
                    Sender MSISDN
                  </span>
                </td>
                <td className="py-3 px-3 text-ink-secondary">+91 98*** **210</td>
                <td className="py-3 px-2 text-center text-ink-tertiary">→</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1.5 bg-steel-100 text-ink px-2 py-0.5 rounded border border-steel-200 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Contact C01
                  </span>
                </td>
                <td className="py-3 px-3 font-sans text-[11px] text-ink-secondary">
                  Phone number redacted · Preserves actor association across 4 exhibits
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-steel-50/50">
                <td className="py-3 px-3">
                  <span className="flex items-center gap-2 font-sans font-semibold text-ink">
                    <Landmark className="h-3.5 w-3.5 text-ink-secondary" />
                    Beneficiary Account
                  </span>
                </td>
                <td className="py-3 px-3 text-ink-secondary">4029-XXXX-XXXX-1184</td>
                <td className="py-3 px-2 text-center text-ink-tertiary">→</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1.5 bg-steel-100 text-ink px-2 py-0.5 rounded border border-steel-200 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Account A01
                  </span>
                </td>
                <td className="py-3 px-3 font-sans text-[11px] text-ink-secondary">
                  Bank account tokenized · Retains routing integrity in ledger tables
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-steel-50/50">
                <td className="py-3 px-3">
                  <span className="flex items-center gap-2 font-sans font-semibold text-ink">
                    <CreditCard className="h-3.5 w-3.5 text-ink-secondary" />
                    UPI Reference Code
                  </span>
                </td>
                <td className="py-3 px-3 text-ink-secondary">UPI/2024/981240182</td>
                <td className="py-3 px-2 text-center text-ink-tertiary">→</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1.5 bg-steel-100 text-ink px-2 py-0.5 rounded border border-steel-200 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Transaction T01
                  </span>
                </td>
                <td className="py-3 px-3 font-sans text-[11px] text-ink-secondary">
                  Transaction alias mapped to timestamp matrix entry
                </td>
              </tr>

              {/* Row 4 */}
              <tr className="hover:bg-steel-50/50">
                <td className="py-3 px-3">
                  <span className="flex items-center gap-2 font-sans font-semibold text-ink">
                    <Globe className="h-3.5 w-3.5 text-ink-secondary" />
                    External Access URI
                  </span>
                </td>
                <td className="py-3 px-3 text-ink-secondary">https://auth-portal-verify.in/ses...</td>
                <td className="py-3 px-2 text-center text-ink-tertiary">→</td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center gap-1.5 bg-steel-100 text-ink px-2 py-0.5 rounded border border-steel-200 font-semibold">
                    [Sanitized URL: auth-portal-verify.in]
                  </span>
                </td>
                <td className="py-3 px-3 font-sans text-[11px] text-ink-secondary">
                  Session queries stripped to prevent active session leakage
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-mono text-ink-secondary border-t border-steel-100 gap-2">
          <span>REDACTION RULESET: LEGAL-STANDARD-IN-DPDP-V4</span>
          <span>■ REVERSIBLE VIA AUTHORIZED KEY HOLDER ONLY</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DOWNLOAD PACKETS CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* PDF Dossier Card */}
        <div className="bg-surface rounded-lg border border-border p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-steel-800 text-white flex items-center justify-center shadow-xs">
                <FileText className="h-5 w-5" />
              </div>
              <Badge className="bg-steel-100 text-primary border-steel-200 font-mono text-[10px]">
                OFFICIAL PRESENTATION
              </Badge>
            </div>

            <div>
              <h2 className="text-lg font-bold text-ink">Evidence Organization Report — PDF</h2>
              <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                Formal printable evidence dossier with executive summary, provenance chain, symmetric conflict comparisons, and source exhibits appendix.
              </p>
            </div>

            <div className="bg-steel-50 p-3 rounded-md border border-steel-200 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-ink-secondary">Scope / Volume:</span>
                <span className="text-ink font-semibold">Estimated 14 pages</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Standardization:</span>
                <span className="text-ink font-semibold">PDF/A-2b compliant (Archival ISO 19005-2)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Tamper Seal:</span>
                <span className="text-ink font-semibold">SHA-256 integrity hash cover seal</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handlePdfClick}
              disabled={downloadingPdf}
              className="w-full bg-primary text-white hover:bg-primary-hover font-semibold h-10 gap-2 shadow-xs"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generate PDF Packet (Draft)
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-ink-secondary font-mono">
              Includes provisional review watermark on all 14 pages
            </p>
          </div>
        </div>

        {/* CSV Analytic Feed Card */}
        <div className="bg-surface rounded-lg border border-border p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-steel-100 text-primary border border-steel-200 flex items-center justify-center shadow-xs">
                <TableIcon className="h-5 w-5" />
              </div>
              <Badge className="bg-steel-100 text-steel-700 border-steel-200 font-mono text-[10px]">
                RAW ANALYTIC FEED
              </Badge>
            </div>

            <div>
              <h2 className="text-lg font-bold text-ink">Structured Chronology & Observations — CSV</h2>
              <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                Machine-readable tabular export containing one row per observation, with exact source locators, extraction timestamps, and flag statuses.
              </p>
            </div>

            <div className="bg-steel-50 p-3 rounded-md border border-steel-200 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-ink-secondary">Encoding / Spec:</span>
                <span className="text-ink font-semibold">UTF-8 with BOM · RFC 4180 format</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Record Count:</span>
                <span className="text-ink font-semibold">11 Observation rows + 8 Source citations</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-secondary">Header Mapping:</span>
                <span className="text-ink font-semibold">Canonical Ledger Schema v1.4</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleCsvClick}
              disabled={downloadingCsv}
              variant="outline"
              className="w-full border-steel-300 text-ink hover:bg-steel-50 font-semibold h-10 gap-2 shadow-xs"
            >
              {downloadingCsv ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating CSV...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 text-ink-secondary" />
                  Generate CSV Dataset
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-ink-secondary font-mono">
              Compatible with court management systems, Excel & i2 Analyst Notebook
            </p>
          </div>
        </div>
      </div>

      {/* Statutory & Methodological Notice */}
      <div className="p-4 bg-steel-50 rounded-lg border border-steel-200 space-y-1 text-xs">
        <p className="font-semibold text-ink flex items-center gap-1.5 font-mono uppercase text-[11px]">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Statutory & Methodological Notice
        </p>
        <p className="text-ink-secondary leading-relaxed">
          This packet organizes reported information for human review. It does not establish wrongdoing, source authenticity, or legal conclusions, and it is not an official submission.
        </p>
        <p className="text-[10px] font-mono text-ink-tertiary">
          Reference Standard: ISO/IEC 27037:2012 (Digital Evidence Handling Guidelines) · Synthetically compiled for regulatory auditing.
        </p>
      </div>
    </div>
  );
};
