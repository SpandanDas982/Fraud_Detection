import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar, type StageId } from '@/components/layout/AppSidebar';
import { PrivacyDialog } from '@/components/layout/PrivacyDialog';
import { EvidenceIntakeView } from '@/components/views/EvidenceIntakeView';
import { ExtractionReviewView } from '@/components/views/ExtractionReviewView';
import { TimelineView } from '@/components/views/TimelineView';
import { FlagsView } from '@/components/views/FlagsView';
import { ExportView } from '@/components/views/ExportView';
import { mockService } from '@/mocks/mockService';
import type {
  CaseSummary,
  Source,
  Observation,
  TimelineData,
  Flag,
  ExportReadiness,
  FieldAction,
} from '@/contracts/types';

export function App() {
  const [activeStage, setActiveStage] = useState<StageId>('evidence');
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Reactive state synced with mockService
  const [summary, setSummary] = useState<CaseSummary>(mockService.getCaseSummary());
  const [sources, setSources] = useState<Source[]>(mockService.getSources());
  const [observations, setObservations] = useState<Observation[]>(mockService.getObservations());
  const [timeline, setTimeline] = useState<TimelineData>(mockService.getTimeline());
  const [flags, setFlags] = useState<Flag[]>(mockService.getFlags());
  const [exportReadiness, setExportReadiness] = useState<ExportReadiness>(mockService.getExportReadiness());

  const refreshState = () => {
    setSummary(mockService.getCaseSummary());
    setSources(mockService.getSources());
    setObservations(mockService.getObservations());
    setTimeline(mockService.getTimeline());
    setFlags(mockService.getFlags());
    setExportReadiness(mockService.getExportReadiness());
  };

  // URL hash sync for browser testing & direct stage navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as StageId;
      if (['evidence', 'review', 'timeline', 'flags', 'export'].includes(hash)) {
        setActiveStage(hash);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectStage = (stage: StageId) => {
    setActiveStage(stage);
    window.location.hash = stage;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoadDemo = () => {
    mockService.resetDemo();
    refreshState();
    toast.success('Loaded synthetic demo case #SYN-8924 with 8 registered exhibits.');
  };

  const handleStartEmpty = () => {
    mockService.startEmptyCase();
    refreshState();
    toast.info('Started empty case workspace. Ingest screenshots, audio, or text to begin.');
  };

  const handleAddSource = (sourceData: Parameters<typeof mockService.addSource>[0]) => {
    mockService.addSource(sourceData);
    refreshState();
  };

  const handleUpdateFieldReview = (
    obsId: string,
    fieldName: string,
    action: FieldAction,
    reviewedValue?: string | null,
    note?: string | null
  ) => {
    mockService.updateFieldReview(obsId, fieldName, action, reviewedValue, note);
    refreshState();
  };

  const handleResolveFlag = (flagId: string) => {
    mockService.resolveFlag(flagId);
    refreshState();
  };

  const handleGenerateExport = (format: 'pdf' | 'csv') => {
    mockService.createExportJob(format);
    refreshState();
  };

  return (
    <div className="h-screen overflow-hidden bg-canvas text-ink flex flex-col font-sans antialiased selection:bg-selection">
      {/* Top Header */}
      <AppHeader caseId={summary.case_id} onOpenPrivacy={() => setPrivacyOpen(true)} />

      {/* Mock Mode Banner */}
      <div className="bg-steel-800 text-white text-xs py-1.5 px-4 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
          <span className="h-2 w-2 rounded-full bg-review animate-pulse" />
          <span className="font-semibold text-review-border">MOCK DATA MODE:</span>
          <span className="text-steel-200">
            Running offline deterministic demo. All PII masked with asterisks. No cloud requests.
          </span>
        </div>
      </div>

      {/* Main Workspace with Fixed Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Stage Navigation Sidebar */}
        <AppSidebar
          summary={summary}
          activeStage={activeStage}
          onSelectStage={handleSelectStage}
        />

        {/* Scrollable Stage Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeStage === 'evidence' && (
            <EvidenceIntakeView
              sources={sources}
              onLoadDemo={handleLoadDemo}
              onStartEmpty={handleStartEmpty}
              onProceedToReview={() => handleSelectStage('review')}
              onOpenPrivacy={() => setPrivacyOpen(true)}
              onAddSource={handleAddSource}
            />
          )}

          {activeStage === 'review' && (
            <ExtractionReviewView
              sources={sources}
              observations={observations}
              onUpdateFieldReview={handleUpdateFieldReview}
              onContinueToTimeline={() => handleSelectStage('timeline')}
            />
          )}

          {activeStage === 'timeline' && (
            <TimelineView
              timeline={timeline}
              onProceedToFlags={() => handleSelectStage('flags')}
            />
          )}

          {activeStage === 'flags' && (
            <FlagsView
              flags={flags}
              onResolveFlag={handleResolveFlag}
              onProceedToExport={() => handleSelectStage('export')}
            />
          )}

          {activeStage === 'export' && (
            <ExportView
              exportReadiness={exportReadiness}
              onGenerateExport={handleGenerateExport}
            />
          )}
        </main>
      </div>

      {/* Global Privacy Principles Modal */}
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />

      {/* Toast Notification Container */}
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

export default App;
