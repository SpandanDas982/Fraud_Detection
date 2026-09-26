import React from 'react';
import {
  FolderArchive,
  SearchCheck,
  GitCommitHorizontal,
  FlagTriangleRight,
  FileCheck2,
  Lock,
} from 'lucide-react';
import type { CaseSummary } from '@/contracts/types';
import { cn } from '@/lib/utils';

export type StageId = 'evidence' | 'review' | 'timeline' | 'flags' | 'export';

interface AppSidebarProps {
  summary: CaseSummary;
  activeStage: StageId;
  onSelectStage: (stage: StageId) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  summary,
  activeStage,
  onSelectStage,
}) => {
  const stages = [
    {
      id: 'evidence' as StageId,
      number: '1',
      title: 'Evidence',
      subtitle: `${summary.source_count} sources cataloged`,
      badge: 'Ready',
      badgeClass: 'bg-success-soft text-success border-success-border',
      icon: FolderArchive,
    },
    {
      id: 'review' as StageId,
      number: '2',
      title: 'Review',
      subtitle: `${summary.observation_count - summary.reviewed_count} pending verification`,
      badge: 'In progress',
      badgeClass: 'bg-info-soft text-info border-info-border',
      icon: SearchCheck,
    },
    {
      id: 'timeline' as StageId,
      number: '3',
      title: 'Timeline',
      subtitle: 'Chronology & Ambiguities',
      badge: 'Order',
      badgeClass: 'bg-steel-100 text-steel-700 border-steel-200',
      icon: GitCommitHorizontal,
    },
    {
      id: 'flags' as StageId,
      number: '4',
      title: 'Flags',
      subtitle: 'Discrepancies & Gaps',
      badge: `${summary.unresolved_flag_count} items`,
      badgeClass: 'bg-review-soft text-review border-review-border',
      icon: FlagTriangleRight,
    },
    {
      id: 'export' as StageId,
      number: '5',
      title: 'Export',
      subtitle: 'Dossier & Chain export',
      badge: 'Draft',
      badgeClass: 'bg-steel-100 text-steel-600 border-steel-200',
      icon: FileCheck2,
    },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border shrink-0 flex flex-col justify-between select-none">
      <div className="p-4 space-y-5">
        {/* Case Ledger Summary Card */}
        <div className="bg-steel-50 border border-steel-200 rounded-lg p-3.5 shadow-xs">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-ink-secondary mb-2.5 font-semibold">
            Case Ledger Summary
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-surface p-2 rounded border border-steel-200">
              <span className="text-xl font-bold text-ink leading-none">{summary.source_count}</span>
              <p className="text-[11px] text-ink-secondary mt-1">Sources</p>
            </div>
            <div className="bg-surface p-2 rounded border border-steel-200">
              <span className="text-xl font-bold text-ink leading-none">{summary.observation_count}</span>
              <p className="text-[11px] text-ink-secondary mt-1">Observations</p>
            </div>
            <div className="bg-surface p-2 rounded border border-steel-200">
              <span className="text-xl font-bold text-success leading-none">{summary.reviewed_count}</span>
              <p className="text-[11px] text-ink-secondary mt-1">Reviewed</p>
            </div>
            <div className="bg-surface p-2 rounded border border-steel-200">
              <span className="text-xl font-bold text-review leading-none">{summary.attention_count}</span>
              <p className="text-[11px] text-ink-secondary mt-1">Attention</p>
            </div>
          </div>
        </div>

        {/* Stage Navigation List */}
        <nav className="space-y-1.5" aria-label="Stages">
          {stages.map((stage) => {
            const isActive = activeStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => onSelectStage(stage.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between',
                  isActive
                    ? 'bg-steel-100/70 border-primary shadow-xs ring-1 ring-primary/20'
                    : 'bg-surface border-border hover:bg-steel-50 hover:border-steel-300'
                )}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={cn(
                      'text-xs font-mono font-semibold px-1.5 py-0.5 rounded border',
                      isActive
                        ? 'bg-primary text-white border-primary'
                        : 'bg-steel-100 text-steel-700 border-steel-200'
                    )}
                  >
                    {stage.number}
                  </span>
                  <div className="min-w-0">
                    <p className={cn('text-sm font-semibold leading-tight truncate', isActive ? 'text-primary' : 'text-ink')}>
                      {stage.title}
                    </p>
                    <p className="text-[11px] text-ink-secondary truncate mt-0.5">{stage.subtitle}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0',
                    stage.badgeClass
                  )}
                >
                  {stage.badge}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Privacy Status Box */}
      <div className="p-4 border-t border-border bg-steel-50/60">
        <div className="flex items-center justify-between text-xs font-mono text-ink-secondary">
          <span className="font-semibold text-ink uppercase tracking-wider flex items-center gap-1.5">
            DRAFT PACKET
          </span>
          <Lock className="h-3.5 w-3.5 text-ink-tertiary" />
        </div>
        <p className="text-[11px] text-ink-secondary mt-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
          Strict Masking Applied
        </p>
      </div>
    </aside>
  );
};
