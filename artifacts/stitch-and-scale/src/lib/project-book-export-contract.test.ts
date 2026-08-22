import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COPY } from './portfolio-copy';

const portfolioSource = readFileSync(new URL('../pages/portfolio.tsx', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('../components/shell.tsx', import.meta.url), 'utf8');
const toastSource = readFileSync(new URL('../components/ui/toast.tsx', import.meta.url), 'utf8');
const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

describe('Project Book browser handoff contract', () => {
  it('reports preparation without claiming that the print dialog opened', () => {
    expect(portfolioSource).toContain('setBookStatus(copy.bookPrepared);');
    expect(portfolioSource).toContain('if (!popup.closed) popup.print();');
    expect(portfolioSource).not.toContain('setBookStatus(copy.bookReady);');
    expect(portfolioSource).not.toContain('bookReady');
  });

  it('keeps Project Book action controls at the mobile touch-target minimum', () => {
    expect(portfolioSource).toContain('className="min-h-11" onClick={() => setSelectedProjectIds(projects.map(project => project.id))}');
    expect(portfolioSource).toContain('className="min-h-11" onClick={() => setSelectedProjectIds([])}');
    expect(portfolioSource).toContain('<Button type="button" className="min-h-11" onClick={prepareProjectBook}');
  });

  it('does not attempt to print a popup that the user has already closed', () => {
    expect(portfolioSource).toContain('window.setTimeout(() => { if (!popup.closed) popup.print(); }, 160);');
  });

  it('keeps the shared mobile shell and toast surfaces inside the viewport', () => {
    expect(shellSource).toContain('grid grid-cols-4 h-16 w-full max-w-md mx-auto');
    expect(toastSource).toContain('box-border flex max-h-screen w-full max-w-full');
  });

  it('keeps Project Book preparation copy complete and localized', () => {
    for (const locale of locales) {
      const copy = COPY[locale];
      expect(copy.bookPrepared.length).toBeGreaterThan(0);
      expect(copy.bookPrepared).not.toMatch(/print dialog opened|druckdialog geöffnet|boîte d’impression ouverte|diálogo de impresión abierto|caixa de impressão aberta/i);
    }

    expect(COPY.en.bookPrepared).toBe('Project Book opened in a new window. Use the browser print dialog to choose Save to PDF.');
    expect(COPY.de.bookPrepared).toContain('neuen Fenster geöffnet');
    expect(COPY.fr.bookPrepared).toContain('nouvelle fenêtre');
    expect(COPY.es.bookPrepared).toContain('nueva ventana');
    expect(COPY.pt.bookPrepared).toContain('nova janela');
  });
});

export {};
