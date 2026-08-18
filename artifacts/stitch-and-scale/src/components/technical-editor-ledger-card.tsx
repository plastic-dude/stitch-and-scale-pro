import { useMemo, useState } from 'react';
import type { PatternProject } from '@/lib/grading-engine';
import type { PatternQualityResult } from '@/lib/pattern-quality';
import {
  createDefectLedger,
  importPatternQualityFlags,
  summarizeTechnicalDefects,
  updateTechnicalDefect,
  type DefectDisposition,
  type DefectStatus,
  type TechnicalDefectLedger,
} from '@/lib/technical-editor-ledger';
import { getDefectLedgerCopy } from '@/lib/defect-ledger-copy';
import { projectStorage } from '@/lib/storage-lib';
import { useSettings } from '@/context/SettingsContext';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';

const LEGACY_KEY = 'stitch-and-scale-technical-defects-v1';

export function TechnicalEditorLedgerCard({ project, quality }: { project: PatternProject; quality: PatternQualityResult }) {
  const { language } = useSettings();
  const copy = getDefectLedgerCopy(language);
  const handle = useMemo(
    () => projectStorage<TechnicalDefectLedger>('technical-defects', project.id, [LEGACY_KEY]),
    [project.id],
  );
  const [ledger, setLedger] = useState<TechnicalDefectLedger>(() => handle.read() ?? createDefectLedger(project.id, project.updatedAt));
  const summary = useMemo(() => summarizeTechnicalDefects(ledger), [ledger]);
  const persist = (next: TechnicalDefectLedger) => {
    setLedger(next);
    handle.write(next);
  };
  const recordFindings = () => {
    const next = importPatternQualityFlags(ledger, quality.flags, `${quality.checkedAt}-${quality.version}`);
    persist(next);
  };

  return (
    <section className="rounded-lg border bg-muted/10 p-3 space-y-3" data-testid="technical-defect-ledger">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-sm">{copy.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{copy.description}</p>
        </div>
        <button type="button" className="min-h-11 rounded-md border px-3 text-xs font-medium hover:bg-muted/40" onClick={recordFindings}>
          {copy.recordFindings}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        <Badge variant="outline">{copy.open}: {summary.open}</Badge>
        <Badge variant="outline">{copy.accepted}: {summary.accepted}</Badge>
        <Badge variant="outline">{copy.fixed}: {summary.fixed}</Badge>
        <span className="self-center text-muted-foreground">{copy.recorded(summary.total)}</span>
      </div>
      {ledger.defects.length === 0 ? (
        <p className="text-xs text-muted-foreground">{copy.empty}</p>
      ) : (
        <div className="space-y-2" aria-live="polite">
          {ledger.defects.slice(-8).reverse().map((defect) => (
            <div key={defect.id} className="rounded-md border p-2.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{defect.title} <span className="text-muted-foreground">({defect.code})</span></div>
                  <p className="text-xs text-muted-foreground mt-1">{defect.detail}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px] uppercase">{copy.severity[defect.severity]}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-muted-foreground">
                  <span className="sr-only">{copy.status.open}</span>
                  <NativeSelect
                    aria-label={`${defect.code} status`}
                    value={defect.status}
                    className="min-h-11 text-xs"
                    onChange={(event) => persist(updateTechnicalDefect(ledger, defect.id, { status: event.target.value as DefectStatus }))}
                  >
                    {(Object.keys(copy.status) as DefectStatus[]).map((status) => <option key={status} value={status}>{copy.status[status]}</option>)}
                  </NativeSelect>
                </label>
                <label className="text-[11px] text-muted-foreground">
                  <span className="sr-only">{copy.noDisposition}</span>
                  <NativeSelect
                    aria-label={`${defect.code} disposition`}
                    value={defect.disposition ?? ''}
                    className="min-h-11 text-xs"
                    onChange={(event) => persist(updateTechnicalDefect(ledger, defect.id, { disposition: (event.target.value || undefined) as DefectDisposition | undefined }))}
                  >
                    <option value="">{copy.noDisposition}</option>
                    {(Object.keys(copy.disposition) as DefectDisposition[]).map((disposition) => <option key={disposition} value={disposition}>{copy.disposition[disposition]}</option>)}
                  </NativeSelect>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
