import { describe, expect, it } from 'vitest';
import { STS_UNIT, ROWS_UNIT, workspaceGaugeByline, getWorkspaceCopy } from './workspace-copy';

describe('workspace gauge byline and grading suffixes (CHK-137)', () => {
  const gauge = { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' };

  it('renders the EN gauge byline unchanged (20sts × 28rows / 4in)', () => {
    expect(workspaceGaugeByline('en', gauge)).toBe('20sts × 28rows / 4in');
  });

  it('localizes the DE gauge byline (Maschenprobe row units)', () => {
    expect(workspaceGaugeByline('de', gauge)).toBe('20M × 28R / 4in');
  });

  it('localizes FR / ES / PT gauge bylines', () => {
    expect(workspaceGaugeByline('fr', gauge)).toBe('20M × 28rg / 4in');
    expect(workspaceGaugeByline('es', gauge)).toBe('20p × 28h / 4in');
    expect(workspaceGaugeByline('pt', gauge)).toBe('20p × 28c / 4in');
  });

  it('switches the unit suffix to cm without changing numbers', () => {
    const cmGauge = { stitchesPer4In: 20, rowsPer4In: 28, unit: 'cm' };
    expect(workspaceGaugeByline('de', cmGauge)).toBe('20M × 28R / 4cm');
  });

  it('renders safe dash placeholders when gauge values are missing', () => {
    expect(workspaceGaugeByline('de', { stitchesPer4In: null, rowsPer4In: null })).toBe('—M × —R / 4in');
  });

  it('falls back to EN suffixes for a null gauge and unknown codes', () => {
    expect(workspaceGaugeByline('en', null)).toBe('sts × rows');
    expect(workspaceGaugeByline('xx' as never, gauge)).toBe('20sts × 28rows / 4in');
  });

  it('has grading suffix entries for every supported language', () => {
    for (const code of ['en', 'de', 'fr', 'es', 'pt'] as const) {
      expect(STS_UNIT[code]).toBeTruthy();
      expect(ROWS_UNIT[code]).toBeTruthy();
    }
  });

  it('keeps getWorkspaceCopy localized (byline prefix "Von" for DE)', () => {
    expect(getWorkspaceCopy('de').by).toBe('Von');
    expect(getWorkspaceCopy('de').gauge).toBe('Maschenprobe');
  });
});
