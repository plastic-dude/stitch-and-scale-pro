import { useEffect, useState } from 'react';
import type { AuditSummary } from '@/lib/tech-edit-audit';
import type { HumanReviewStatus, PatternProject } from '@/lib/grading-engine';
import type { ReadinessResult } from '@/lib/pattern-readiness';
import { getHumanReviewCopy } from '@/lib/human-review-copy';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HumanReviewCardProps {
  project: PatternProject;
  updateProject: (project: PatternProject) => void;
  readiness: ReadinessResult;
  audit: AuditSummary;
}

const STATUS_STYLES: Record<HumanReviewStatus, string> = {
  'not-reviewed': 'bg-muted text-muted-foreground border-border',
  'in-review': 'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:text-blue-300',
  'changes-requested': 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300',
  approved: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300',
};

export function HumanReviewCard({ project, updateProject, readiness, audit }: HumanReviewCardProps) {
  const { language } = useSettings();
  const { toast } = useToast();
  const copy = getHumanReviewCopy(language);
  const [reviewerName, setReviewerName] = useState(project.humanReview?.reviewerName ?? project.author ?? '');
  const [note, setNote] = useState(project.humanReview?.note ?? '');
  const status = project.humanReview?.status ?? 'not-reviewed';
  const approvalBlocked = !readiness.ready || audit.verdict === 'fix';

  useEffect(() => {
    setReviewerName(project.humanReview?.reviewerName ?? project.author ?? '');
    setNote(project.humanReview?.note ?? '');
  }, [project.id, project.humanReview?.reviewerName, project.humanReview?.note, project.author]);

  const saveStatus = (nextStatus: HumanReviewStatus) => {
    if (nextStatus === 'approved' && approvalBlocked) {
      toast({ title: copy.approvedNeedsClean, variant: 'destructive' });
      return;
    }
    if (nextStatus === 'approved' && !reviewerName.trim()) {
      toast({ title: copy.reviewerLabel, description: copy.reviewerPlaceholder, variant: 'destructive' });
      return;
    }

    updateProject({
      ...project,
      humanReview: {
        status: nextStatus,
        reviewerName: reviewerName.trim(),
        note: note.trim(),
        reviewedAt: new Date().toISOString(),
      },
    });
    toast({ title: copy.saved });
  };

  const clearRecord = () => {
    const { humanReview: _removed, ...withoutReview } = project;
    updateProject(withoutReview);
    setReviewerName(project.author ?? '');
    setNote('');
    toast({ title: copy.saved });
  };

  return (
    <>
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm print:hidden" aria-labelledby="human-review-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="human-review-title" className="font-serif text-2xl font-bold text-foreground">{copy.title}</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <span className={cn('inline-flex w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-semibold', STATUS_STYLES[status])}>
          {copy.statusLabels[status]}
        </span>
      </div>

      <div className={cn('mt-5 rounded-xl border p-4 text-sm', approvalBlocked ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5')}>
        <div className="font-semibold text-foreground">{copy.automatedLabel}: {audit.score}/100</div>
        <p className="mt-1 text-muted-foreground">{approvalBlocked ? copy.automatedNeedsWork : copy.automatedClean}</p>
      </div>

      {project.humanReview?.invalidatedAt && (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200" role="status" aria-live="polite">
          <p className="font-semibold">{copy.sourceChangedNotice}</p>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-foreground">
          {copy.reviewerLabel}
          <input
            value={reviewerName}
            onChange={(event) => setReviewerName(event.target.value)}
            placeholder={copy.reviewerPlaceholder}
            className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            maxLength={120}
          />
        </label>
        <label className="text-sm font-medium text-foreground sm:col-span-2">
          {copy.noteLabel}
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={copy.notePlaceholder}
            className="mt-2 min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            maxLength={2000}
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => saveStatus('in-review')}>{copy.saveInReview}</Button>
        <Button size="sm" variant="outline" onClick={() => saveStatus('changes-requested')}>{copy.requestChanges}</Button>
        <Button size="sm" onClick={() => saveStatus('approved')} disabled={approvalBlocked}>{copy.approve}</Button>
        {status !== 'not-reviewed' && <Button size="sm" variant="ghost" onClick={clearRecord}>{copy.reset}</Button>}
      </div>

      {project.humanReview && (
        <p className="mt-4 text-xs text-muted-foreground">
          {copy.statusLabels[project.humanReview.status]} · {project.humanReview.reviewerName || copy.reviewerPlaceholder} · {new Date(project.humanReview.reviewedAt).toLocaleDateString(language)}
        </p>
      )}
    </section>

    {project.humanReview && (
      <div className="hidden print:block border border-gray-300 p-4 text-sm text-black">
        <strong>{copy.title}:</strong> {copy.statusLabels[project.humanReview.status]} · {project.humanReview.reviewerName || copy.reviewerPlaceholder} · {new Date(project.humanReview.reviewedAt).toLocaleDateString(language)}
        {project.humanReview.note.trim() ? <p className="mt-2">{project.humanReview.note}</p> : null}
      </div>
    )}
    </>
  );
}
