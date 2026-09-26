import React from 'react';
import { Layers3, HelpCircle, MoreVertical, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  caseId: string;
  onOpenPrivacy: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ caseId, onOpenPrivacy }) => {
  return (
    <header className="h-16 bg-surface border-b border-border sticky top-0 z-40 px-6 flex items-center justify-between select-none">
      {/* Brand & Wordmark */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-md bg-steel-100 border border-steel-200 flex items-center justify-center text-primary shadow-xs">
          <Layers3 className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base tracking-tight text-ink">Evidence Ledger</span>
          </div>
          <p className="text-xs text-ink-secondary leading-none">
            Organize evidence. Preserve uncertainty.
          </p>
        </div>
      </div>

      {/* Case Identifier Badge */}
      <div className="hidden md:flex items-center gap-2 bg-steel-50 border border-steel-200 px-3.5 py-1.5 rounded-full text-xs font-medium text-ink shadow-xs">
        <span className="text-ink-secondary font-mono">CASE #{caseId}</span>
        <span className="h-3 w-[1px] bg-steel-200" />
        <span className="text-primary font-medium flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-review animate-pulse" />
          Synthetic demo
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="bg-steel-50 text-ink-secondary border-steel-200 font-mono text-[11px] uppercase tracking-wider py-1 px-2.5 hidden sm:inline-flex"
        >
          Synthetic demo only
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenPrivacy}
          className="h-9 w-9 text-ink-secondary hover:text-ink hover:bg-steel-100 rounded-md"
          title="Review Privacy Principles & Standards"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-ink-secondary hover:text-ink hover:bg-steel-100 rounded-md"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>

        <div className="h-8 w-8 rounded-full bg-steel-800 text-surface flex items-center justify-center text-xs font-semibold shadow-xs">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  );
};
