import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getReceiptCopy } from './receipt-copy';

const receiptSource = readFileSync(new URL('../components/receipt-lab-card.tsx', import.meta.url), 'utf8');
const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

describe('Receipt Lab export and screenshot guidance contract', () => {
  it('labels the image action as guidance and keeps it separate from print/PDF', () => {
    expect(receiptSource).toContain('function showScreenshotGuidance()');
    expect(receiptSource).toContain('onClick={showScreenshotGuidance}');
    expect(receiptSource).toContain('<Camera className="h-4 w-4 mr-1.5" /> {copy.screenshotGuide}');
    expect(receiptSource).toContain('onClick={() => window.print()}');
    expect(receiptSource).toContain('{copy.printPdf}');
    expect(receiptSource.match(/className="min-h-11"/g) ?? []).toHaveLength(5);
    expect(receiptSource).not.toContain('saveReceiptImage');
    expect(receiptSource).not.toContain('copy.saveImage');
    expect(receiptSource).not.toContain('Download,');
  });

  it('keeps the screenshot action honest about what the browser can do', () => {
    expect(receiptSource).toContain('This control opens guidance only; it does not generate or save an image.');
    expect(receiptSource).toContain('copy.screenshotTitle');
    expect(receiptSource).toContain('copy.screenshotDescription');
    expect(receiptSource).not.toMatch(/offer a print-based PNG|canvas capture of the styled card/i);
  });

  it('provides non-saving action labels and screenshot guidance in every locale', () => {
    for (const locale of locales) {
      const copy = getReceiptCopy(locale);
      expect(copy.screenshotGuide, `${locale} screenshot label`).toBeTruthy();
      expect(copy.screenshotTitle, `${locale} screenshot title`).toBeTruthy();
      expect(copy.screenshotDescription, `${locale} screenshot description`).toBeTruthy();
      expect(copy.screenshotGuide, `${locale} must not claim image saving`).not.toMatch(/save|speichern|enregistr|enregistrer|guardar|imagem|image/i);
      expect(copy.screenshotTitle, `${locale} must mention screenshot guidance`).toMatch(/screenshot|capture|captura/i);
      expect(copy.screenshotDescription, `${locale} must mention screenshot guidance`).toMatch(/screenshot|capture|captura/i);
    }
  });
});
