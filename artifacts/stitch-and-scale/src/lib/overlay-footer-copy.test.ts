import { describe, expect, it } from 'vitest';
import { getMissingTranslationKeys, translate } from './i18n';

describe('QA 51-B — onboarding overlay footer localization', () => {
  const overlayKeys = [
    'workflow.overlay.back',
    'workflow.overlay.begin',
    'workflow.overlay.continue',
  ] as const;
  const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;

  it('has no missing translation keys for the overlay footer group', () => {
    for (const locale of locales) {
      expect(getMissingTranslationKeys(locale), `missing keys in ${locale}`)
        .not.toContainEqual(expect.stringMatching(/^workflow\.overlay\./));
    }
  });

  it('renders the localized footer labels per language', () => {
    // Back
    expect(translate('de', 'workflow.overlay.back')).toBe('Zurück');
    expect(translate('fr', 'workflow.overlay.back')).toBe('Retour');
    expect(translate('es', 'workflow.overlay.back')).toBe('Atrás');
    expect(translate('pt', 'workflow.overlay.back')).toBe('Voltar');
    // Begin
    expect(translate('de', 'workflow.overlay.begin')).toBe('Los geht’s');
    expect(translate('fr', 'workflow.overlay.begin')).toBe('Commencer');
    expect(translate('es', 'workflow.overlay.begin')).toBe('Empezar');
    expect(translate('pt', 'workflow.overlay.begin')).toBe('Começar');
    // Continue
    expect(translate('de', 'workflow.overlay.continue')).toBe('Weiter');
    expect(translate('fr', 'workflow.overlay.continue')).toBe('Continuer');
    expect(translate('es', 'workflow.overlay.continue')).toBe('Continuar');
    expect(translate('pt', 'workflow.overlay.continue')).toBe('Continuar');
  });

  it('keeps English labels as the base strings', () => {
    expect(translate('en', 'workflow.overlay.back')).toBe('Back');
    expect(translate('en', 'workflow.overlay.begin')).toBe('Begin');
    expect(translate('en', 'workflow.overlay.continue')).toBe('Continue');
  });

  it('never falls back to the raw English literal on any locale', () => {
    // A fallback path in translate() returns the key itself or a raw English string.
    // Confirm each overlay key resolves to a value in every locale, and that the
    // resolved value is never the bare English word on a non-English locale.
    const english = {
      'workflow.overlay.back': 'Back',
      'workflow.overlay.begin': 'Begin',
      'workflow.overlay.continue': 'Continue',
    };
    for (const locale of locales) {
      for (const [key, enLabel] of Object.entries(english)) {
        const rendered = translate(locale as never, key as never);
        expect(rendered).toBeTruthy();
        expect(rendered).not.toBe(key);
        if (locale !== 'en') {
          expect(rendered).not.toBe(enLabel);
        }
      }
    }
  });
});
