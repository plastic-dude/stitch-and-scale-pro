// PDF HTML Renderer — Stitch & Scale
// Generates a complete, print-ready HTML document from a themed PatternProject.
// All components are theme-agnostic; styling flows entirely from ResolvedTheme tokens.
//
// Usage:
//   const theme = resolveTheme('luxury');
//   const gradingResult = gradePattern(project);
//   const html = renderDocument({ theme, pattern: project, gradingResult });
//   openPrintWindow(html, `${project.name}.pdf`);

import type { ResolvedTheme } from './themes';
import type { PatternProject, GradingResult, GradedSection, SizeKey } from '@/lib/grading-engine';
import { ALL_SIZES } from '@/lib/grading-engine';

export interface RenderContext {
  theme: ResolvedTheme;
  pattern: PatternProject;
  gradingResult: GradingResult;
  includeCover?: boolean;
  includeGaugeSummary?: boolean;
  includeNotes?: boolean;
  /** Optional document locale tag shown in the provenance footer (e.g. "en"). */
  locale?: string;
  /** Optional publication template id shown in the provenance footer. */
  templateId?: string;
  /** A designer's own logo, as a data: URI - replaces the Stitch & Scale
   *  mark on the cover when present. Compressed/resized client-side before
   *  it ever reaches here (see compressImageToDataUrl in the upload UI). */
  customLogo?: string;
}

// ─── Document Entry Point ─────────────────────────────────────────────────────

export function renderDocument(ctx: RenderContext): string {
  const { theme, pattern, gradingResult, includeCover = true, includeGaugeSummary = true, includeNotes = true, customLogo } = ctx;

  const coverHtml  = includeCover ? renderCover(theme, pattern, customLogo) : '';
  const tocHtml    = gradingResult.length > 0 ? renderTOC(theme, gradingResult, includeGaugeSummary) : '';
  const materialsHtml = includeGaugeSummary ? renderMaterials(theme, pattern, includeNotes) : '';
  const sectionsHtml  = gradingResult.map((s, i) => renderSection(theme, s, pattern, i)).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(pattern.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${theme.googleFontsUrl}" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { margin: 0; padding: 0; background: ${theme.backgroundColor}; color: ${theme.textColor}; font-family: ${theme.bodyFont}; font-size: 11px; line-height: 1.55; }
  @page { size: letter; margin: 0; }
  
  .page { page-break-before: always; padding: 0.75in; }
  .avoid { page-break-inside: avoid; break-inside: avoid; }
  table { border-spacing: 0; border-collapse: collapse; }
  thead { display: table-header-group; }
  @media screen { body { max-width: 794px; margin: 0 auto; } }
  @media print { body { max-width: none; } }
</style>
</head>
<body>
${renderWatermark(theme)}
${theme.gridLineColor ? renderBlueprintGrid(theme) : ''}
${coverHtml}
${tocHtml ? `<div class="page">${tocHtml}</div>` : ''}
${materialsHtml ? `<div class="page">${materialsHtml}</div>` : ''}
${sectionsHtml}
${renderFixedFooter(theme, pattern)}
${renderProvenanceFooter(theme, pattern, gradingResult)}
</body>
</html>`;
}

// ─── Watermark ────────────────────────────────────────────────────────────────

function renderWatermark(theme: ResolvedTheme): string {
  // CHK-094 design upgrade: the old text-wall was a classic failure pattern
  // (wallpaper watermark fights the content — research rule D-7: zero
  // watermarks). Attribution already lives in the provenance footer, so the
  // page background now carries only a single faint selvedge rule band —
  // like the woven edge of fabric — that never competes with the pattern.
  return `<div aria-hidden="true" style="
    position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;
    overflow:hidden;pointer-events:none;user-select:none;
    background:linear-gradient(to right,transparent 0,transparent 6%,${theme.accent} 6%,${theme.accent} 6.15%,transparent 6.15%,transparent 100%);
    opacity:${Math.min(theme.watermarkOpacity, 0.14)};
  "></div>`;
}

// ─── Blueprint grid (Technical theme) ────────────────────────────────────────

function renderBlueprintGrid(theme: ResolvedTheme): string {
  return `<div aria-hidden="true" style="
    position:fixed;top:0;left:0;width:100%;height:100%;z-index:-2;
    pointer-events:none;
    background-image:
      linear-gradient(to right,${theme.gridLineColor} 1px,transparent 1px),
      linear-gradient(to bottom,${theme.gridLineColor} 1px,transparent 1px);
    background-size:8px 8px;
  "></div>`;
}

// ─── Cover Pages ──────────────────────────────────────────────────────────────

// EXTENSION POINT — a publishing system with additional cover designs is
// planned. Any new cover layout added here MUST:
//   1. Accept `customLogo?: string` as its third parameter, matching the
//      four existing cover functions below.
//   2. Pass it straight through to brandMark(size, customLogo) wherever
//      the layout draws its logo mark - never call brandMark(size) alone.
// This is the only thing that makes a designer's uploaded logo (see
// PdfDefaults.customLogo, and the upload UI in project-pdf.tsx) actually
// reach the page. Skipping it means a new theme silently ignores custom
// branding while every existing theme honors it - an inconsistency that's
// easy to miss in review since the theme will still render correctly with
// the DEFAULT Stitch & Scale mark, just never with anything else.
function renderCover(theme: ResolvedTheme, p: PatternProject, customLogo?: string): string {
  switch (theme.coverLayout) {
    case 'luxury':    return coverLuxury(theme, p, customLogo);
    case 'craft':     return coverCraft(theme, p, customLogo);
    case 'technical': return coverTechnical(theme, p, customLogo);
    default:          return coverMinimal(theme, p, customLogo);
  }
}

function coverMinimal(t: ResolvedTheme, p: PatternProject, customLogo?: string): string {
  const date = fmtDate(p.updatedAt);
  return `<div style="
    height:11in;overflow:hidden;position:relative;background:${t.backgroundColor};padding:0.75in;
    font-family:${t.bodyFont};color:${t.textColor};
  ">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:64px;">
      ${brandMark(26, customLogo)}
      <span style="font-family:${t.headingFont};font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${t.mutedTextColor};">Stitch &amp; Scale</span>
    </div>
    <div>
      <h1 style="font-family:${t.headingFont};font-size:58px;font-weight:700;line-height:1.08;letter-spacing:-0.02em;color:${t.textColor};margin:0 0 30px;max-width:620px;">${esc(p.name)}</h1>
      <div style="width:48px;height:3px;background:${t.accent};margin-bottom:22px;"></div>
      <p style="font-size:16px;color:${t.mutedTextColor};margin:0 0 6px;">by ${esc(p.author)}</p>
    </div>
    <div style="position:absolute;left:0.75in;right:0.75in;bottom:1.15in;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
      ${metaCell(t,'Gauge',`${p.gauge.stitchesPer4In} sts · ${p.gauge.rowsPer4In} rows / 4${p.gauge.unit}`)}
      ${metaCell(t,'Base Size',p.baseSize)}
      ${p.yarnWeight ? metaCell(t,'Yarn Weight',cap(p.yarnWeight)) : ''}
    </div>
    <div style="position:absolute;left:0.75in;right:0.75in;bottom:0.75in;display:flex;justify-content:space-between;font-size:9px;color:${t.mutedTextColor};padding-top:14px;border-top:1px solid ${t.dividerColor};">
      <span>Stitch &amp; Scale</span><span>${date}</span>
    </div>
  </div>`;
}

function coverLuxury(t: ResolvedTheme, p: PatternProject, customLogo?: string): string {
  const date = fmtDate(p.updatedAt);
  return `<div style="height:11in;overflow:hidden;background:${t.backgroundColor};font-family:${t.bodyFont};color:${t.textColor};">
    <div style="display:flex;justify-content:center;padding:24px 0 10px;">
      ${brandMark(24, customLogo)}
    </div>
    <div style="background:${t.accent};padding:16px 0.75in;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-family:${t.headingFont};font-size:11px;letter-spacing:0.28em;color:rgba(255,255,255,0.9);text-transform:uppercase;">Stitch &amp; Scale</span>
      <span style="font-size:11px;color:rgba(255,255,255,0.65);">${date}</span>
    </div>
    <div style="padding:0 0.75in 0.75in;">
      <div style="padding-top:44px;max-width:580px;">
        <h1 style="font-family:${t.headingFont};font-size:60px;font-weight:800;font-style:italic;line-height:1.06;color:${t.textColor};margin:0 0 28px;">${esc(p.name)}</h1>
        <div style="width:100%;height:1px;background:${t.accent};opacity:.35;margin-bottom:20px;"></div>
        <p style="font-family:${t.headingFont};font-size:16px;font-style:italic;color:${t.mutedTextColor};margin:0 0 6px;">by ${esc(p.author)}</p>
        ${p.yarnWeight ? `<p style="font-size:12.5px;color:${t.mutedTextColor};margin:0 0 40px;">${cap(p.yarnWeight)} weight</p>` : '<div style="margin-bottom:40px;"></div>'}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;border:1px solid ${t.dividerColor};max-width:480px;">
        ${luxuryMeta(t,'Gauge',`${p.gauge.stitchesPer4In} sts · ${p.gauge.rowsPer4In} rows / 4${p.gauge.unit}`,true,false)}
        ${luxuryMeta(t,'Base Size',p.baseSize,false,false)}
        ${p.yarnWeight ? luxuryMeta(t,'Yarn Weight',cap(p.yarnWeight),true,true) : ''}
      </div>
      <div style="margin-top:44px;font-family:${t.headingFont};font-size:10px;letter-spacing:0.2em;color:${t.mutedTextColor};text-align:center;text-transform:uppercase;">A Stitch &amp; Scale Publication</div>
    </div>
  </div>`;
}

function coverCraft(t: ResolvedTheme, p: PatternProject, customLogo?: string): string {
  return `<div style="height:11in;overflow:hidden;background:${t.backgroundColor};padding:0.75in;font-family:${t.bodyFont};color:${t.textColor};position:relative;">
    <div style="color:${t.accent};font-size:22px;letter-spacing:5px;margin-bottom:30px;opacity:.6;">· · ·</div>
    <div style="margin-left:20px;">
      <h1 style="font-family:${t.headingFont};font-size:54px;font-weight:700;line-height:1.12;color:${t.textColor};margin:0 0 22px;max-width:540px;">${esc(p.name)}</h1>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <div style="width:44px;border-top:2px dashed ${t.accent};opacity:.75;"></div>
        ${brandMark(22, customLogo)}
        <div style="flex:1;border-top:2px dashed ${t.accent};opacity:.75;"></div>
      </div>
      <p style="font-family:${t.headingFont};font-style:italic;font-size:16px;color:${t.textColor};margin:0 0 5px;">designed by ${esc(p.author)}</p>
      <p style="font-size:12px;color:${t.mutedTextColor};margin:0 0 36px;">${fmtDate(p.updatedAt)}</p>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px;margin-left:20px;">
      ${warmBadge(t,`${p.gauge.stitchesPer4In} sts / 4${p.gauge.unit}`)}
      ${warmBadge(t,`${p.gauge.rowsPer4In} rows / 4${p.gauge.unit}`)}
      ${p.yarnWeight ? warmBadge(t,cap(p.yarnWeight)+' weight') : ''}
      ${warmBadge(t,'Base: '+p.baseSize)}
    </div>
    ${p.description ? `<div style="background:rgba(0,0,0,.04);border-radius:4px;padding:14px 18px;margin-left:20px;max-width:430px;font-size:12px;line-height:1.65;color:${t.mutedTextColor};white-space:pre-wrap;">${esc(p.description.slice(0,220))}${p.description.length>220?'…':''}</div>` : ''}
    <div style="position:absolute;bottom:0.75in;left:0.75in;right:0.75in;display:flex;justify-content:space-between;font-size:9px;color:${t.mutedTextColor};">
      <span>Stitch &amp; Scale</span><span>${p.baseSize} base</span>
    </div>
  </div>`;
}

function coverTechnical(t: ResolvedTheme, p: PatternProject, customLogo?: string): string {
  const date   = new Date(p.updatedAt).toISOString().slice(0,10);
  const ref    = `S-S-${p.id.slice(0,8).toUpperCase()}`;
  const grid   = t.gridLineColor ?? 'rgba(27,58,92,0.08)';
  return `<div style="
    height:11in;overflow:hidden;background:${t.backgroundColor};padding:0.75in;
    font-family:${t.headingFont};color:${t.textColor};position:relative;
    background-image:linear-gradient(to right,${grid} 1px,transparent 1px),linear-gradient(to bottom,${grid} 1px,transparent 1px);
    background-size:8px 8px;
  ">
    <div style="position:absolute;top:24px;left:24px;width:14px;height:14px;border-top:2px solid ${t.accent};border-left:2px solid ${t.accent};"></div>
    <div style="position:absolute;top:24px;right:24px;width:14px;height:14px;border-top:2px solid ${t.accent};border-right:2px solid ${t.accent};"></div>
    <div style="position:absolute;bottom:24px;left:24px;width:14px;height:14px;border-bottom:2px solid ${t.accent};border-left:2px solid ${t.accent};"></div>
    <div style="position:absolute;bottom:24px;right:24px;width:14px;height:14px;border-bottom:2px solid ${t.accent};border-right:2px solid ${t.accent};"></div>
    <div style="font-family:${t.monoFont};font-size:10px;color:${t.mutedTextColor};margin-bottom:36px;letter-spacing:.07em;">
      REF: ${ref}&ensp;//&ensp;EXPORT: ${date}&ensp;//&ensp;BASE SIZE: ${p.baseSize}
    </div>
    <div style="border-left:3px solid ${t.accent};padding-left:16px;margin-bottom:26px;">
      <div style="font-family:${t.monoFont};font-size:11px;color:${t.accent};letter-spacing:.12em;margin-bottom:7px;">// GRADING SPECIFICATIONS</div>
      <h1 style="font-family:${t.headingFont};font-size:42px;font-weight:700;line-height:1.15;color:${t.textColor};margin:0;text-transform:uppercase;letter-spacing:-.01em;">${esc(p.name)}</h1>
    </div>
    <div style="font-family:${t.monoFont};font-size:12.5px;line-height:2.1;color:${t.textColor};margin-bottom:36px;">
      <div><span style="color:${t.accent};display:inline-block;width:165px;">DESIGNER</span>${esc(p.author)}</div>
      <div><span style="color:${t.accent};display:inline-block;width:165px;">GAUGE</span>${p.gauge.stitchesPer4In} STS · ${p.gauge.rowsPer4In} ROWS / 4${p.gauge.unit.toUpperCase()}</div>
      <div><span style="color:${t.accent};display:inline-block;width:165px;">BASE SIZE</span>${p.baseSize}</div>
      ${p.yarnWeight ? `<div><span style="color:${t.accent};display:inline-block;width:165px;">YARN WEIGHT</span>${p.yarnWeight.toUpperCase()}</div>` : ''}
    </div>
    <div style="position:absolute;left:0.75in;right:0.75in;bottom:0.75in;">
      <div style="height:2px;background:${t.accent};margin-bottom:12px;opacity:.7;"></div>
      <div style="display:flex;align-items:center;gap:8px;">
      ${brandMark(16, customLogo)}
      <div style="font-family:${t.monoFont};font-size:8px;color:${t.mutedTextColor};letter-spacing:.1em;">
        STITCH &amp; SCALE GRADING ENGINE
      </div>
    </div>
    </div>
  </div>`;
}

// ─── Table of Contents ────────────────────────────────────────────────────────

function renderTOC(t: ResolvedTheme, sections: GradedSection[], includeGauge: boolean): string {
  const entries = [
    ...(includeGauge ? ['Materials & Gauge'] : []),
    ...sections.map(s => s.sectionName),
  ];
  return `<div style="padding:8px 0;font-family:${t.bodyFont};color:${t.textColor};">
    <h2 style="font-family:${t.headingFont};font-size:20px;font-weight:700;margin:0 0 20px;color:${t.textColor};">Contents</h2>
    <div style="border-top:1px solid ${t.dividerColor};padding-top:12px;">
      ${entries.map(title => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid ${t.dividerColor};font-size:11px;color:${t.textColor};">
          <span>${esc(title)}</span><span style="color:${t.mutedTextColor};">—</span>
        </div>`).join('')}
    </div>
  </div>`;
}

// ─── Materials & Gauge Page ───────────────────────────────────────────────────

function renderMaterials(t: ResolvedTheme, p: PatternProject, includeNotes: boolean): string {
  return `<div style="padding:8px 0;font-family:${t.bodyFont};color:${t.textColor};">
    ${sectionHeader(t,'Materials & Gauge',0)}
    ${gaugeBlock(t, p)}
    ${yarnBlock(t, p)}
    ${p.description && includeNotes ? `
      <div style="margin-top:20px;">
        ${sectionHeader(t,'Pattern Notes',1)}
        <p style="font-size:11px;line-height:1.7;color:${t.textColor};margin:0 0 14px;white-space:pre-wrap;">${esc(p.description)}</p>
        ${callout(t,'note','All stitch counts are calculated from CYC standard body measurements using the gauge above. Match your gauge exactly before beginning.')}
      </div>` : ''}
  </div>`;
}

// ─── Section (Grading Table) ──────────────────────────────────────────────────

function renderSection(t: ResolvedTheme, section: GradedSection, p: PatternProject, idx: number): string {
  const originalSection = p.sections.find(s => s.id === section.sectionId);

  const thStyle = `background:${t.tableHeaderBg};color:${t.tableHeaderText};font-family:${t.headingFont};font-size:8px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;padding:6px 7px;border:1px solid ${t.tableBorderColor};`;
  const tdBase  = `padding:5px 7px;font-size:9.5px;border:1px solid ${t.tableBorderColor};font-family:${t.bodyFont};`;

  const rows = section.measurements.map((m, mi) => {
    const originalM = originalSection?.measurements.find(om => om.id === m.measurementId);
    const notes  = originalM?.notes;
    const hasRows = m.gradedValues.some(v => v.rowCount !== undefined);
    const rowBg  = mi % 2 === 0 ? 'transparent' : t.tableStripeBg;

    return `
      <tr style="background:${rowBg};">
        <td style="${tdBase}color:${t.textColor};font-weight:500;" rowspan="${hasRows ? 2 : 1}">
          ${esc(m.label)}
          ${notes ? `<div style="font-size:8px;color:${t.mutedTextColor};font-weight:400;margin-top:2px;font-style:italic;">${esc(notes)}</div>` : ''}
        </td>
        ${(ALL_SIZES as SizeKey[]).map(size => {
          const gv = m.gradedValues.find(v => v.size === size);
          const isBase = size === p.baseSize;
          return `<td style="${tdBase}text-align:center;${isBase ? `font-weight:700;color:${t.accent};` : `color:${t.textColor};`}">
            ${gv ? `${gv.stitchCount}<span style="font-size:7px;color:${t.mutedTextColor};"> sts</span>` : '—'}
          </td>`;
        }).join('')}
      </tr>
      ${hasRows ? `<tr style="background:${rowBg};">
        ${(ALL_SIZES as SizeKey[]).map(size => {
          const gv = m.gradedValues.find(v => v.size === size);
          const isBase = size === p.baseSize;
          return `<td style="${tdBase}text-align:center;color:${t.mutedTextColor};font-size:8.5px;${isBase ? 'font-weight:600;' : ''}">
            ${gv?.rowCount !== undefined ? `${gv.rowCount}<span style="font-size:7px;"> rows</span>` : '—'}
          </td>`;
        }).join('')}
      </tr>` : ''}`;
  }).join('');

  return `<div class="page" style="font-family:${t.bodyFont};color:${t.textColor};">
    <div style="padding:8px 0;">
      ${sectionHeader(t, section.sectionName, idx)}
      <div class="avoid">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="${thStyle}text-align:left;min-width:110px;">Measurement</th>
              ${(ALL_SIZES as SizeKey[]).map(s =>
                `<th style="${thStyle}${s === p.baseSize ? `background:${t.accent};color:#fff;` : ''}">${s}</th>`
              ).join('')}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}

// ─── Gauge Block ──────────────────────────────────────────────────────────────

function gaugeBlock(t: ResolvedTheme, p: PatternProject): string {
  return `<div class="avoid" style="
    background:${t.tableStripeBg};border:1px solid ${t.tableBorderColor};
    border-left:3px solid ${t.accent};padding:11px 14px;margin-bottom:14px;
    display:flex;gap:28px;font-family:${t.bodyFont};
  ">
    <div>
      <div style="font-size:8px;text-transform:uppercase;letter-spacing:.12em;color:${t.mutedTextColor};margin-bottom:2px;">Stitches</div>
      <div style="font-size:20px;font-weight:700;font-family:${t.headingFont};color:${t.textColor};">${p.gauge.stitchesPer4In}</div>
      <div style="font-size:9px;color:${t.mutedTextColor};">per 4 ${p.gauge.unit}</div>
    </div>
    <div style="width:1px;background:${t.dividerColor};"></div>
    <div>
      <div style="font-size:8px;text-transform:uppercase;letter-spacing:.12em;color:${t.mutedTextColor};margin-bottom:2px;">Rows</div>
      <div style="font-size:20px;font-weight:700;font-family:${t.headingFont};color:${t.textColor};">${p.gauge.rowsPer4In}</div>
      <div style="font-size:9px;color:${t.mutedTextColor};">per 4 ${p.gauge.unit}</div>
    </div>
    <div style="width:1px;background:${t.dividerColor};"></div>
    <div>
      <div style="font-size:8px;text-transform:uppercase;letter-spacing:.12em;color:${t.mutedTextColor};margin-bottom:2px;">Base Size</div>
      <div style="font-size:20px;font-weight:700;font-family:${t.headingFont};color:${t.accent};">${p.baseSize}</div>
      <div style="font-size:9px;color:${t.mutedTextColor};">design size</div>
    </div>
  </div>`;
}

// ─── Yarn Block ───────────────────────────────────────────────────────────────

function yarnBlock(t: ResolvedTheme, p: PatternProject): string {
  if (!p.yarnWeight) return '';
  return `<div class="avoid" style="border:1px solid ${t.tableBorderColor};border-left:3px solid ${t.accent};padding:11px 14px;margin-bottom:14px;font-family:${t.bodyFont};">
    <div style="font-size:8px;text-transform:uppercase;letter-spacing:.12em;color:${t.mutedTextColor};margin-bottom:4px;">Yarn Weight</div>
    <div style="font-size:13px;color:${t.textColor};font-weight:500;">${cap(p.yarnWeight)}</div>
  </div>`;
}

// ─── Callout ──────────────────────────────────────────────────────────────────

function callout(t: ResolvedTheme, variant: 'note' | 'tip' | 'warning', text: string): string {
  const style = t[`callout${cap(variant) as 'Note' | 'Tip' | 'Warning'}`];
  const labels = { note: 'Note', tip: 'Tip', warning: 'Important' } as const;
  return `<div class="avoid" style="background:${style.bg};border-left:3px solid ${style.border};padding:9px 13px;margin-bottom:14px;border-radius:${t.badgeRadius};font-family:${t.bodyFont};">
    <div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:${style.border};margin-bottom:3px;">${labels[variant]}</div>
    <div style="font-size:10px;color:${style.text};">${esc(text)}</div>
  </div>`;
}

// ─── Fixed Footer ──────────────────────────────────────────────────────────────
// No page numbers here: browsers' native print-to-PDF pipeline (window.print())
// does not support CSS Paged Media page counters (`@page` margin boxes,
// counter(page)/counter(pages)) in any mainstream engine — only specialized
// PDF-generation tools do. Real page numbers need either a client-side
// pagination library (e.g. Paged.js) or a server-side headless-Chrome/
// Puppeteer pipeline, both real architecture decisions, not a CSS one-liner.

function renderFixedFooter(t: ResolvedTheme, p: PatternProject): string {
  return `<div style="
    position:fixed;bottom:0;left:0;right:0;
    padding:7px 0.75in;border-top:1px solid ${t.dividerColor};
    display:flex;justify-content:space-between;align-items:center;
    font-family:${t.bodyFont};font-size:8px;color:${t.mutedTextColor};
    background:${t.backgroundColor};
  ">
    <span style="max-width:40%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.name)}</span>
    <span>Stitch &amp; Scale</span>
  </div>`;
}

// ─── Provenance Footer (P0 of the Publishing System proposal) ─────────────────
// The publishing-system-proposal.md P0 phase: a one-line provenance footer
// carrying identity, grading standard, template id, renderer version, render
// date, and locale. The renderer NEVER derives authoritative numbers — it
// only reports metadata supplied by the single authoritative source
// (the grading engine / PublicationSpec). Matches doc sections 22 and the
// mathematical-integrity-boundary rule (see docs/publishing-system-proposal.md).

/** Renderer identity string baked into every provenance footer. */
export const RENDERER_VERSION = 'v1.0.0';

export function renderProvenanceFooter(
  t: ResolvedTheme,
  p: PatternProject,
  gradingResult: GradingResult,
  locale = 'en',
  templateId = 'stitch-and-scale-default',
): string {
  const standard = (p as { sizingStandard?: string }).sizingStandard ?? '';
  const standardLabel = standard
    ? (standard === 'Custom' ? 'Custom' : standard)
    : '';
  const identity = [
    p.name,
    ...(standardLabel ? [standardLabel] : []),
    `template:${templateId}`,
    `renderer:${RENDERER_VERSION}`,
    new Date().toISOString().slice(0, 10),
    `locale:${locale}`,
  ].join(' · ');
  return `<div style="
    position:fixed;bottom:2.4em;left:0.75in;right:0.75in;
    padding:3px 0;border-top:1px dashed ${t.dividerColor};
    font-family:monospace;font-size:6.5px;letter-spacing:0.04em;
    color:${t.mutedTextColor};
    display:flex;justify-content:space-between;align-items:center;
  ">
    <span style="overflow:hidden;white-space:nowrap;text-overflow:ellipsis;max-width:82%;">${esc(identity)}</span>
    <span>Stitch &amp; Scale</span>
  </div>`;
}

// ─── Section Header ───────────────────────────────────────────────────────────

function sectionHeader(t: ResolvedTheme, title: string, idx: number): string {
  return `<div style="margin-bottom:14px;padding-bottom:7px;border-bottom:${idx === 0 ? `2px solid ${t.accent}` : `1px solid ${t.dividerColor}`};">
    <h2 style="font-family:${t.headingFont};font-size:17px;font-weight:700;color:${t.textColor};margin:0;letter-spacing:-.01em;">${esc(title)}</h2>
  </div>`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// The single source of truth for the "Stitch & Scale" logo mark used anywhere
// in a PDF template. Any current or future cover that needs a logo icon
// should call this rather than drawing its own placeholder — that's what let
// a plain colored square slip in as a stand-in for the real logo previously.
function brandMark(size: number, customLogo?: string): string {
  if (customLogo) {
    return `<img src="${esc(customLogo)}" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px;object-fit:contain;display:block;flex-shrink:0;" />`;
  }
  return `<img src="/favicon.png" alt="" width="${size}" height="${size}" style="width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.16)}px;object-fit:cover;display:block;flex-shrink:0;" />`;
}

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}); }
  catch { return iso; }
}

function metaCell(t: ResolvedTheme, label: string, value: string): string {
  return `<div style="border:1px solid ${t.dividerColor};padding:12px 14px;">
    <div style="font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:${t.mutedTextColor};margin-bottom:5px;">${esc(label)}</div>
    <div style="font-size:14px;color:${t.textColor};font-weight:600;">${esc(value)}</div>
  </div>`;
}

function luxuryMeta(t: ResolvedTheme, label: string, value: string, rightBorder: boolean, lastRow: boolean): string {
  return `<div style="padding:14px 17px;${rightBorder ? `border-right:1px solid ${t.dividerColor};` : ''}${!lastRow ? `border-bottom:1px solid ${t.dividerColor};` : ''}">
    <div style="font-size:9px;text-transform:uppercase;letter-spacing:.15em;color:${t.accent};margin-bottom:5px;">${esc(label)}</div>
    <div style="font-size:14px;color:${t.textColor};font-weight:600;">${esc(value)}</div>
  </div>`;
}

function warmBadge(t: ResolvedTheme, text: string): string {
  return `<span style="display:inline-block;padding:6px 13px;background:${t.accent}18;border:1px solid ${t.accent}40;border-radius:${t.badgeRadius};font-size:11.5px;color:${t.accent};font-family:${t.bodyFont};">${esc(text)}</span>`;
}
