import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getRecognitionCopy } from './lib/recognition-copy';

const cardSource = readFileSync(new URL('./components/grading-lab-card.tsx', import.meta.url), 'utf8');
const settingsSource = readFileSync(new URL('./context/SettingsContext.tsx', import.meta.url), 'utf8');
const settingsPageSource = readFileSync(new URL('./pages/settings.tsx', import.meta.url), 'utf8');

const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

describe('Q066 first-clean-grade recognition contract', () => {
  it('uses an explicit grading action rather than a mount or render effect', () => {
    expect(cardSource).toContain('const handleCheckGrading = () =>');
    expect(cardSource).toContain('const observedResult = analyzeGrading(project);');
    expect(cardSource).toContain('observeFirstCleanGrade(project, observedResult, recognitionState)');
    expect(cardSource).toContain('onClick={handleCheckGrading}');
    expect(cardSource).not.toContain('window.location.reload()');
    expect(cardSource).not.toContain('useEffect(');
  });

  it('keeps the recognition setting default-on, persisted, and presentation-only', () => {
    expect(settingsSource).toContain('recognitionEnabled: true');
    expect(settingsSource).toContain("typeof parsed.recognitionEnabled === 'boolean'");
    expect(settingsSource).toContain("typeof result.settings.recognitionEnabled === 'boolean'");
    expect(settingsSource).toContain('...parsed');
    expect(settingsSource).toContain('...result.settings');
    expect(settingsSource).toContain('const setRecognitionEnabled = (recognitionEnabled: boolean)');
    expect(settingsSource).toContain('setRecognitionEnabled,');
    expect(settingsPageSource).toContain('checked={recognitionEnabled}');
    expect(settingsPageSource).toContain('onCheckedChange={setRecognitionEnabled}');
    expect(settingsPageSource).toContain('aria-describedby="recognition-enabled-description"');
  });

  it('has the approved calm copy and interpolates the observed size count in every locale', () => {
    for (const locale of locales) {
      const copy = getRecognitionCopy(locale);
      expect(copy.cleanGradeTitle.length).toBeGreaterThan(0);
      expect(copy.cleanGradeDismiss.length).toBeGreaterThan(0);
      expect(copy.checkGrading.length).toBeGreaterThan(0);
      expect(settingsPageSource).toContain('copy.recognitionToggle');
      expect(copy.cleanGradeBody(7)).toContain('7');
      expect(copy.cleanGradeBody(7)).not.toMatch(/badge|streak|share|publish|finished|complete/i);
    }

    expect(getRecognitionCopy('en').cleanGradeTitle).toBe('First clean grade');
    expect(getRecognitionCopy('en').cleanGradeBody(3)).toBe(
      'This set is Ready across 3 sizes. A quiet checkpoint: the numbers line up. Nothing else is required.',
    );
  });
});
