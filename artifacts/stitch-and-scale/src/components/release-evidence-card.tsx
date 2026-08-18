import { useMemo, useState } from 'react';
import type { PatternProject } from '@/lib/grading-engine';
import { projectStorage } from '@/lib/storage-lib';
import { useSettings } from '@/context/SettingsContext';
import { Badge } from '@/components/ui/badge';
import { NativeSelect } from '@/components/ui/native-select';
import {
  createReleaseEvidenceChecklist,
  isReleaseEvidenceChecklist,
  summarizeReleaseEvidence,
  updateReleaseEvidenceItem,
  type ReleaseEvidenceChecklist,
  type ReleaseEvidenceKey,
  type ReleaseEvidenceStatus,
} from '@/lib/release-evidence';
import { getReleaseEvidenceCopy } from '@/lib/release-evidence-copy';

const LEGACY_KEY = 'stitch-and-scale-release-evidence-v1';
const KEYS: ReleaseEvidenceKey[] = ['physical-print', 'chart-readability', 'schematic-scale', 'test-knit'];

export function ReleaseEvidenceCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copy = getReleaseEvidenceCopy(language);
  const handle = useMemo(() => projectStorage<ReleaseEvidenceChecklist>('release-evidence', project.id, [LEGACY_KEY]), [project.id]);
  const [checklist, setChecklist] = useState<ReleaseEvidenceChecklist>(() => {
    const stored = handle.read();
    return stored && isReleaseEvidenceChecklist(stored, project.id) ? stored : createReleaseEvidenceChecklist(project.id, project.updatedAt);
  });
  const [saved, setSaved] = useState(false);
  const summary = useMemo(() => summarizeReleaseEvidence(checklist), [checklist]);

  const update = (key: ReleaseEvidenceKey, patch: Partial<{ status: ReleaseEvidenceStatus; note: string; evidence: string }>) => {
    setSaved(false);
    const next = updateReleaseEvidenceItem(checklist, key, patch);
    setChecklist(next);
    handle.write(next);
  };

  return (
    <section className="rounded-lg border bg-muted/10 p-3 space-y-3" data-testid="release-evidence-checklist">
      <div>
        <h3 className="font-semibold text-sm">{copy.title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{copy.description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-xs" aria-live="polite">
        <Badge variant={summary.certificationReady ? 'default' : 'outline'} className="max-w-full whitespace-normal text-left">{copy.readiness}: {summary.certificationReady ? copy.ready : copy.notReady}</Badge>
        <span className="text-muted-foreground">{summary.passed}/{summary.total} {copy.status.passed.toLowerCase()}</span>
      </div>
      <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-muted-foreground">{copy.boundary}</p>
      <div className="space-y-3">
        {KEYS.map((key) => {
          const item = checklist.items[key];
          return (
            <div key={key} className="rounded-md border p-2.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-medium min-w-0">{copy.categories[key]}</h4>
                <NativeSelect aria-label={`${copy.categories[key]} ${copy.status['not-started']}`} className="min-h-11 w-auto max-w-[9rem] text-xs" value={item.status} onChange={(event) => update(key, { status: event.target.value as ReleaseEvidenceStatus })}>
                  {(Object.keys(copy.status) as ReleaseEvidenceStatus[]).map((status) => <option key={status} value={status}>{copy.status[status]}</option>)}
                </NativeSelect>
              </div>
              <label className="block text-xs text-muted-foreground">
                <span className="sr-only">{copy.notePlaceholder}</span>
                <textarea className="mt-1 min-h-20 w-full resize-y rounded-md border bg-background px-2.5 py-2 text-sm text-foreground" placeholder={copy.notePlaceholder} value={item.note} onChange={(event) => update(key, { note: event.target.value })} />
              </label>
              <label className="block text-xs text-muted-foreground">
                <span className="sr-only">{copy.evidencePlaceholder}</span>
                <input className="mt-1 min-h-11 w-full rounded-md border bg-background px-2.5 py-2 text-sm text-foreground" placeholder={copy.evidencePlaceholder} value={item.evidence} onChange={(event) => update(key, { evidence: event.target.value })} />
              </label>
            </div>
          );
        })}
      </div>
      <button type="button" className="min-h-11 w-full rounded-md border px-3 text-xs font-medium hover:bg-muted/40" onClick={() => { handle.write(checklist); setSaved(true); }}>{copy.save}</button>
      {saved && <p role="status" aria-live="polite" className="text-xs text-emerald-600">{copy.saved}</p>}
    </section>
  );
}
