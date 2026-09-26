import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacyDialog: React.FC<PrivacyDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-surface border-border text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-semibold tracking-tight text-ink">
              Privacy Principles & Synthetic Data Protocol
            </DialogTitle>
          </div>
          <DialogDescription className="text-ink-secondary text-sm">
            Evidence Ledger processes sensitive evidence under strict redaction, local containment, and neutral uncertainty standards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2 text-sm text-ink-secondary">
          <div className="flex items-start gap-3 p-3 bg-steel-50 rounded-md border border-steel-200">
            <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-ink">Deterministic Identity Masking</p>
              <p className="text-xs text-ink-secondary mt-0.5">
                Phone numbers, account numbers, and email addresses are masked with asterisks in all UI summaries and exports (e.g., <code className="bg-steel-100 px-1 py-0.5 rounded text-ink font-mono">+91 98*** **210</code>, <code className="bg-steel-100 px-1 py-0.5 rounded text-ink font-mono">4029-XXXX-XXXX-1184</code>).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-steel-50 rounded-md border border-steel-200">
            <EyeOff className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-ink">Inert URL Neutralization</p>
              <p className="text-xs text-ink-secondary mt-0.5">
                Evidence URLs are stripped of tracking tokens, session IDs, and active parameters. URLs are displayed as inert sanitized strings and are never visited, scored, or fetched.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-steel-50 rounded-md border border-steel-200">
            <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-ink">Immutable Source Preservation</p>
              <p className="text-xs text-ink-secondary mt-0.5">
                Original ingested files are preserved verbatim with cryptographic SHA-256 digests. Reviewer edits create attributed, reviewed candidate claims without altering underlying source data.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-review-soft/50 rounded-md border border-review-border">
            <CheckCircle2 className="h-4 w-4 text-review mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-ink">Zero Guilt Language Mandate</p>
              <p className="text-xs text-ink-secondary mt-0.5">
                The platform does not determine guilt, identify perpetrators, or assign fraud scores. All claims are cataloged with neutral terms: <span className="font-mono text-xs font-semibold text-ink">reported</span>, <span className="font-mono text-xs font-semibold text-ink">extracted</span>, <span className="font-mono text-xs font-semibold text-ink">inconsistent</span>, and <span className="font-mono text-xs font-semibold text-ink">requires_review</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-primary text-primary-foreground hover:bg-primary-hover font-semibold px-5"
          >
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
