/**
 * Pattern Draft Renderer — the "write your pattern" layer.
 *
 * Designers told us the gap in the market over and over in session-3
 * research: charting suites (Stitchmastery, EnvisioKnit) draw charts but
 * don't help you WRITE a sized, technical-edited pattern, and doing it in
 * a plain text editor means re-typing every gauge and size number by
 * hand. That's exactly where frogging starts in pattern writing.
 *
 * So the draft is plain text with typed placeholders. Every placeholder
 * resolves against the LIVE graded data in this project — change the
 * gauge or add a measurement, and the pattern text updates with it.
 * Numbers are always computed, never stored, so the rendered pattern
 * can never drift out of sync with the grading tables.
 *
 * PLACEHOLDERS:
 * - {Gauge.stitches} / {Gauge.rows}        gauge per 4" (unit from project)
 * - {Size.bust.stitch} / {Size.bust}        stitch count for key in ALL sizes
 * - {Size.bust.row}                         row count for key (undefined
 *                                           measurements show —)
 * - {Yardage}                               base-size estimate (see
 *                                           yarn-estimator) in yards
 * - {Name} / {Author}                       project metadata
 *
 * Output is a Markdown string safe to paste into Ravelry/Etsy listings,
 * tech-editing workflows, or the PDF cover page.
 */
import { PatternProject, SizeKey, ALL_SIZES, gradePattern, resolveProjectStandards, GradingResult } from '@/lib/grading-engine';
import { estimateYarn } from '@/lib/yarn-estimator';

function renderSingleSize(
  measurements: { size: SizeKey; stitchCount: number; rowCount?: number }[],
  mode: 'stitch' | 'row' | 'both',
): string {
  if (!measurements || measurements.length === 0) return '—';
  const m = measurements[0];
  if (mode === 'row') return m.rowCount !== undefined ? `${m.rowCount}` : '—';
  if (mode === 'stitch') return `${m.stitchCount}`;
  if (m.rowCount !== undefined) return `${m.stitchCount} sts · ${m.rowCount} rows`;
  return `${m.stitchCount} sts`;
}

/**
 * Renders a draft string with all placeholders resolved against live data.
 * Unknown placeholder names pass through unchanged so partially-written
 * drafts never get mangled.
 */
export function renderDraft(
  draft: string,
  project: PatternProject,
  customStandard: any | undefined,
): string {
  if (!draft) return '';

  const standards = resolveProjectStandards(project, customStandard);
  const graded = gradePattern(project, standards) as GradingResult;
  const yarn = estimateYarn(project, (project.yarnWeight as any) || 'worsted');

  return draft.replace(/\{([A-Za-z][A-Za-z0-9._-]*)\}/g, (full, key: string) => {
    // {Name}, {Author}
    if (key === 'Name') return project.name;
    if (key === 'Author') return project.author;

    // {Gauge.stitches} / {Gauge.rows}
    const gaugeMatch = key.match(/^Gauge\.(stitches|rows)$/);
    if (gaugeMatch) {
      const v = gaugeMatch[1] === 'stitches'
        ? project.gauge?.stitchesPer4In
        : project.gauge?.rowsPer4In;
      return v !== undefined ? `${v}` : '—';
    }

    // {Yardage}
    if (key === 'Yardage') return yarn.totalYards.toLocaleString();

    // Placeholder grammar:
    // {Size.<gradingKey>}             all sizes — "XS: 47 sts · 52 rows • S: …"
    // {Size.<size>.<gradingKey>}      single size, stitches + rows (e.g. {Size.XS.bust})
    // {Size.<size>.<gradingKey>.stitch}  single size, stitches only
    // {Size.<size>.<gradingKey>.row}     single size, rows only
    const sizeMatch = key.match(/^Size\.([a-zA-Z0-9-]+)(?:\.([a-zA-Z0-9-]+))?(?:\.(stitch|row))?$/);
    if (sizeMatch) {
      const first = sizeMatch[1];
      const second = sizeMatch[2];
      const mode = sizeMatch[3]; // 'stitch' | 'row' | undefined

      const isSizeKey = (s: string): s is SizeKey =>
        (ALL_SIZES as string[]).includes(s);

      let size: SizeKey | null = null;
      let gradingKey: string | null = null;

      if (second && isSizeKey(first)) {
        // {Size.XS.bust} / {Size.XS.bust.stitch}
        size = first;
        gradingKey = second;
      } else {
        // {Size.bust} — all sizes; first token is the grading key
        gradingKey = first;
      }

      // Collect graded values for the grading key across all sections.
      const hits: { size: SizeKey; stitchCount: number; rowCount?: number }[] = [];
      for (const gs of graded) {
        for (const gm of gs.measurements) {
          if (gm.gradingKey !== gradingKey) continue;
          const hit = size
            ? gm.gradedValues.find(v => v.size === size)
            : undefined;
          if (hit) {
            hits.push(hit);
          } else if (!size) {
            hits.push(...gm.gradedValues);
          }
        }
      }
      if (hits.length === 0) return '—';

      if (mode) return renderSingleSize(hits, mode as 'stitch' | 'row');
      if (size) return renderSingleSize(hits, 'both');
      if (hits.length > 1) {
        const parts = hits.map(m =>
          m.rowCount !== undefined
            ? `${m.size}: ${m.stitchCount} sts · ${m.rowCount} rows`
            : `${m.size}: ${m.stitchCount} sts`,
        );
        return parts.join('  •  ');
      }
      return renderSingleSize(hits, 'both');
    }

    return full; // unknown placeholder — leave as typed
  });
}

/** Convenience wrapper for callers that need the draft rendered to text. */
export type DraftResolver = (draft: string) => string;
