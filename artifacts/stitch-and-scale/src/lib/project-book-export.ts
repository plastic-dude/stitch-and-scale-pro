import type { PortfolioSummary } from '@/lib/release-portfolio';
import type { PatternProject } from '@/lib/grading-engine';
import type { StudioProfile } from '@/lib/studio-profile-copy';
import { checkReadiness } from '@/lib/pattern-readiness';
import { runTechEditAudit } from '@/lib/tech-edit-audit';
import { buildHandoffEvidence } from '@/lib/handoff-evidence';

export interface ProjectBookRenderContext {
  title: string;
  projects: PatternProject[];
  portfolio: PortfolioSummary;
  studio?: StudioProfile;
  locale?: string;
  exportedAt?: Date;
}

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function money(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `$${safe.toFixed(2)}`;
}

function dateLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale || 'en', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

function statusLabel(score: number): string {
  if (score >= 75) return 'Ready to launch';
  if (score >= 40) return 'Almost there';
  return 'Needs work';
}

function brandName(studio: StudioProfile | undefined): string {
  return studio?.studioName?.trim() || studio?.designerName?.trim() || 'Stitch & Scale';
}

function humanReviewLabel(status: NonNullable<PatternProject['humanReview']>['status']): string {
  return {
    'not-reviewed': 'Not reviewed',
    'in-review': 'In review',
    'changes-requested': 'Changes requested',
    approved: 'Human approved',
  }[status];
}

function renderCover(ctx: ProjectBookRenderContext, exported: string): string {
  const brand = brandName(ctx.studio);
  const count = ctx.projects.length;
  const ready = ctx.portfolio.readyToLaunch.length;
  return `<section class="page cover">
    <div class="eyebrow">${esc(brand)}</div>
    <div class="cover-rule"></div>
    <h1>${esc(ctx.title)}</h1>
    <p class="lede">A complete catalogue report for independent knitwear design.</p>
    <div class="cover-stats">
      <div><strong>${count}</strong><span>projects</span></div>
      <div><strong>${ready}</strong><span>ready to launch</span></div>
      <div><strong>${money(ctx.portfolio.totalCatalogueValue)}</strong><span>recommended catalogue value</span></div>
    </div>
    <div class="cover-footer"><span>${esc(brand)}</span><span>${esc(exported)}</span></div>
  </section>`;
}

function renderOverview(ctx: ProjectBookRenderContext): string {
  const rows = ctx.portfolio.lines.map((line, index) => `<tr>
    <td class="rank">${index + 1}</td>
    <td><strong>${esc(line.name)}</strong><small>${esc(line.yarnWeightClass)} · ${line.listingReady ? 'listing material ready' : 'listing incomplete'}</small></td>
    <td><span class="status status-${line.readinessScore >= 75 ? 'ready' : line.readinessScore >= 40 ? 'almost' : 'needs'}">${statusLabel(line.readinessScore)}</span><small>${line.readinessScore}/100 readiness</small></td>
    <td class="numeric">${money(line.pricing.recommendedPrice)}</td>
    <td class="numeric">${money(line.netPerUnitBest)} / ${money(line.netPerUnitWorst)}</td>
    <td class="numeric">${Math.round(line.launchScore)}/100</td>
  </tr>`).join('');

  return `<section class="page">
    <header class="section-header"><div class="eyebrow">Catalogue overview</div><h2>Launch ranking</h2><p>Ordered by readiness and revenue potential. Prices and net estimates come from the Portfolio Planner models at export time.</p></header>
    ${rows ? `<table><thead><tr><th>#</th><th>Pattern</th><th>Status</th><th>Recommended</th><th>Net / unit<br><small>best / worst</small></th><th>Priority</th></tr></thead><tbody>${rows}</tbody></table>` : '<div class="empty">No projects were available when this book was prepared.</div>'}
  </section>`;
}

function renderProject(project: PatternProject, line: ReturnType<PortfolioSummary['lines']['find']>, index: number, total: number, brand: string): string {
  const safeLine = line;
  const measurements = project.sections.flatMap(section => section.measurements.map(measurement => `<tr>
    <td>${esc(section.name)}</td><td>${esc(measurement.label)}</td><td>${esc(measurement.measurementType)}</td><td class="numeric">${Number.isFinite(measurement.baseValue) ? measurement.baseValue : '—'} ${esc(project.gauge.unit)}</td>
  </tr>`)).join('');
  const checks = safeLine?.readiness.checks.filter(check => check.severity !== 'pass').map(check => `<li><strong>${esc(check.severity)}:</strong> ${esc(check.label)}${check.detail ? ` — ${esc(check.detail)}` : ''}</li>`).join('') || '';
  const issueBlock = checks ? `<div class="issues"><h3>Open publication checks</h3><ul>${checks}</ul></div>` : `<div class="pass-note">No blocking publication checks were recorded at export time.</div>`;
  const evidence = buildHandoffEvidence(project, checkReadiness(project), runTechEditAudit(project), project.updatedAt);
  const evidenceBlock = `<div class="evidence"><h3>Calculation provenance</h3><p><strong>${esc(evidence.calculation.engineVersion)}</strong> · ${esc(evidence.calculation.sizingStandard)} standard · ${evidence.calculation.measurements} measurements · ${evidence.calculation.constrainedMeasurements} repeat/parity constraints.</p><p>Automated readiness: <strong>${evidence.automatedReview.readiness.ready ? 'clear' : 'blocked'}</strong> (${evidence.automatedReview.readiness.errors} errors, ${evidence.automatedReview.readiness.warnings} warnings). Technical-edit audit: <strong>${evidence.automatedReview.technicalEdit.score}/100</strong> (${esc(evidence.automatedReview.technicalEdit.verdict)}).</p><p class="evidence-note">This is a snapshot of the inputs and automated evidence at export time; it does not replace human prose, chart, or sample review.</p></div>`;
  const reviewBlock = project.humanReview
    ? `<div class="review-record"><h3>Human review record</h3><p><strong>${esc(humanReviewLabel(project.humanReview.status))}</strong> · ${esc(project.humanReview.reviewerName || 'Reviewer not named')} · ${esc(new Date(project.humanReview.reviewedAt).toLocaleDateString())}</p>${project.humanReview.note.trim() ? `<p>${esc(project.humanReview.note)}</p>` : ''}</div>`
    : `<div class="review-record review-pending"><h3>Human review record</h3><p>No human review decision has been recorded. Automated checks are not a substitute for a prose, clarity, or presentation review.</p></div>`;
  return `<section class="page project-page">
    <div class="eyebrow">Project ${index + 1} of ${total}</div>
    <div class="project-heading"><div><h2>${esc(project.name || 'Untitled pattern')}</h2><p class="muted">${esc(project.author || 'Designer not set')} · updated ${esc(new Date(project.updatedAt).toLocaleDateString())}</p></div><span class="score">${safeLine ? Math.round(safeLine.launchScore) : 0}<small>priority</small></span></div>
    <div class="meta-grid">
      <div><span>Base size</span><strong>${esc(project.baseSize)}</strong></div>
      <div><span>Gauge</span><strong>${esc(project.gauge.stitchesPer4In)} sts · ${esc(project.gauge.rowsPer4In)} rows / 4${esc(project.gauge.unit)}</strong></div>
      <div><span>Yarn weight</span><strong>${esc(project.yarnWeight || 'Not set')}</strong></div>
      <div><span>Readiness</span><strong>${safeLine ? `${safeLine.readinessScore}/100 · ${statusLabel(safeLine.readinessScore)}` : 'Not calculated'}</strong></div>
    </div>
    ${project.description?.trim() ? `<div class="description"><h3>Description</h3><p>${esc(project.description)}</p></div>` : ''}
    <div class="commercial"><div><span>Recommended price</span><strong>${money(safeLine?.pricing.recommendedPrice ?? 0)}</strong></div><div><span>Best-platform net</span><strong>${money(safeLine?.netPerUnitBest ?? 0)}</strong></div><div><span>Listing material</span><strong>${safeLine?.listingReady ? 'Ready' : 'Incomplete'}</strong></div></div>
    ${issueBlock}
    ${reviewBlock}
    ${evidenceBlock}
    <h3>Base measurements</h3>
    ${measurements ? `<table class="measurements"><thead><tr><th>Section</th><th>Measurement</th><th>Type</th><th>Base value</th></tr></thead><tbody>${measurements}</tbody></table>` : '<div class="empty">No base measurements recorded.</div>'}
    <footer class="page-number">${esc(brand)} · ${esc(project.id.slice(0, 8).toUpperCase())}</footer>
  </section>`;
}

/** Render the complete multi-project catalogue book as print-ready HTML.
 * The browser print dialog is the final PDF step; this renderer never claims to
 * have written a PDF file itself. */
export function renderProjectBookDocument(ctx: ProjectBookRenderContext): string {
  const locale = ctx.locale || 'en';
  const exported = dateLabel(ctx.exportedAt || new Date(), locale);
  const brand = brandName(ctx.studio);
  const details = ctx.projects.map((project, index) => {
    const line = ctx.portfolio.lines.find(candidate => candidate.projectId === project.id);
    return renderProject(project, line, index, ctx.projects.length, brand);
  }).join('');
  const social = ctx.studio?.socialHandle?.trim();
  const website = ctx.studio?.website?.trim();
  const copyright = ctx.studio?.copyrightNotice?.trim();
  return `<!DOCTYPE html>
<html lang="${esc(locale)}"><head><meta charset="utf-8"><title>${esc(ctx.title)}</title><style>
*,*::before,*::after{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
html,body{margin:0;padding:0;background:#f7f4ef;color:#25231f;font-family:Georgia,'Times New Roman',serif;font-size:11px;line-height:1.5}
@page{size:letter;margin:0}.page{min-height:11in;page-break-before:always;padding:.72in .76in;position:relative}.cover{page-break-before:auto;background:#f7f4ef;display:flex;flex-direction:column;justify-content:center}.eyebrow{text-transform:uppercase;letter-spacing:.18em;font:600 10px Arial,sans-serif;color:#756f68}.cover-rule{width:58px;border-top:3px solid #b65b50;margin:18px 0 26px}.cover h1{font-size:52px;line-height:1.04;max-width:620px;margin:0 0 18px;color:#25231f}.lede{font-size:17px;color:#756f68;max-width:500px;margin:0}.cover-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:72px;max-width:620px}.cover-stats div,.commercial div{border-top:1px solid #cfc7bd;padding-top:10px}.cover-stats strong{display:block;font:700 23px Arial,sans-serif}.cover-stats span,.meta-grid span,.commercial span{display:block;color:#756f68;font:10px Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em;margin-top:4px}.cover-footer{position:absolute;bottom:.72in;left:.76in;right:.76in;border-top:1px solid #cfc7bd;padding-top:10px;display:flex;justify-content:space-between;color:#756f68;font:10px Arial,sans-serif}.section-header{border-bottom:1px solid #cfc7bd;padding-bottom:18px;margin-bottom:24px}.section-header h2,.project-heading h2{font-size:31px;line-height:1.1;margin:8px 0;color:#25231f}.section-header p{color:#756f68;max-width:650px;margin:0}.project-heading{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:1px solid #cfc7bd;padding-bottom:18px;margin-bottom:18px}.project-heading h2{max-width:560px;margin:5px 0 6px}.muted{color:#756f68;margin:0;font:11px Arial,sans-serif}.score{background:#25231f;color:#fff;border-radius:50%;width:64px;height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;font:700 20px Arial,sans-serif;flex:0 0 auto}.score small{font-size:8px;font-weight:400;text-transform:uppercase;letter-spacing:.08em;color:#d7d0c8}.meta-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0 22px}.meta-grid div{background:#eee8e0;padding:10px}.meta-grid strong,.commercial strong{display:block;font:600 13px Arial,sans-serif;margin-top:4px}.description{border-left:3px solid #b65b50;padding:2px 0 2px 14px;margin:18px 0;color:#46413b}.description h3,.issues h3,h3{font:700 11px Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em;margin:20px 0 8px;color:#756f68}.description h3{margin-top:0}.commercial{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:20px 0}.issues{background:#f3e5e0;border-left:3px solid #b65b50;padding:2px 14px 10px;margin:18px 0}.issues ul{margin:6px 0 0 16px;padding:0}.issues li{margin:4px 0}.pass-note{background:#e6f0e8;border-left:3px solid #5b8d6b;padding:10px 14px;margin:18px 0;color:#31553c}.review-record{background:#e8eef5;border-left:3px solid #557a9f;padding:2px 14px 10px;margin:18px 0;color:#263e57}.review-record p{margin:5px 0}.review-pending{background:#f1eee8;border-left-color:#8e8479;color:#5b554f}.evidence{background:#eef1e8;border-left:3px solid #71875b;padding:2px 14px 10px;margin:18px 0;color:#3d4b34}.evidence p{margin:5px 0}.evidence-note{font-style:italic;color:#68725f}.empty{padding:18px;background:#eee8e0;color:#756f68}table{width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:10px}th{text-align:left;text-transform:uppercase;letter-spacing:.06em;color:#756f68;font-size:8px;border-bottom:2px solid #8e8479;padding:8px 6px}td{border-bottom:1px solid #d9d2ca;padding:8px 6px;vertical-align:top}td small{display:block;color:#756f68;font-size:8px;margin-top:3px}.rank{width:26px;color:#756f68}.numeric{text-align:right;font-variant-numeric:tabular-nums}.status{display:inline-block;padding:3px 6px;border-radius:10px;font-size:8px}.status-ready{background:#dcecdf;color:#31553c}.status-almost{background:#f4ead3;color:#785b20}.status-needs{background:#f3e5e0;color:#8d3e36}.measurements{margin-top:4px}.page-number{position:absolute;bottom:.45in;left:.76in;right:.76in;border-top:1px solid #cfc7bd;padding-top:7px;color:#756f68;font:9px Arial,sans-serif;text-align:right}
@media screen{body{max-width:794px;margin:0 auto;box-shadow:0 0 30px rgba(0,0,0,.08)}.page{margin-bottom:18px}}
</style></head><body>${renderCover(ctx, exported)}${renderOverview(ctx)}${details}<div class="page-number" style="position:fixed;bottom:12px;left:12px;right:12px;text-align:center">${esc([brand, social, website, copyright].filter(Boolean).join(' · '))}</div></body></html>`;
}
