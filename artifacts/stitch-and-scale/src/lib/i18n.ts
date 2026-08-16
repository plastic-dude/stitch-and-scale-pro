export type LanguageCode = 'en' | 'de' | 'fr' | 'es' | 'pt';

export const LANGUAGE_STORAGE_KEY = 'stitch-and-scale-language-v1';

export const LANGUAGE_OPTIONS: Array<{ code: LanguageCode; label: string; nativeLabel: string }> = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
];

const SUPPORTED_CODES = new Set<LanguageCode>(LANGUAGE_OPTIONS.map(({ code }) => code));

export function detectBrowserLanguage(languages: readonly string[] = []): LanguageCode {
  for (const candidate of languages) {
    const code = candidate.toLowerCase().split('-')[0] as LanguageCode;
    if (SUPPORTED_CODES.has(code)) return code;
  }
  return 'en';
}

export function getInitialLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_CODES.has(saved as LanguageCode)) return saved as LanguageCode;
  } catch {
    // Private browsing or blocked storage: browser language remains the fallback.
  }
  return detectBrowserLanguage(window.navigator.languages?.length ? window.navigator.languages : [window.navigator.language]);
}

type TranslationKey =
  | 'settings.title'
  | 'settings.description'
  | 'settings.language.title'
  | 'settings.language.description'
  | 'settings.language.detected'
  | 'settings.language.browser'
  | 'settings.language.manual'
  | 'settings.appearance.title'
  | 'settings.appearance.description'
  | 'nav.projects'
  | 'nav.settings';

const TRANSLATIONS: Record<LanguageCode, Partial<Record<TranslationKey, string>>> = {
  en: {
    'settings.title': 'Preferences',
    'settings.description': 'Manage your workspace environment and data.',
    'settings.language.title': 'Language',
    'settings.language.description': 'Choose the language Stitch & Scale uses for the interface.',
    'settings.language.detected': 'Detected from this browser on first opening. Your choice is remembered on this device.',
    'settings.language.browser': 'Browser language',
    'settings.language.manual': 'Manual selection',
    'settings.appearance.title': 'Appearance',
    'settings.appearance.description': 'How Stitch & Scale looks on this device.',
    'nav.projects': 'Projects',
    'nav.settings': 'Settings',
  },
  de: {
    'settings.title': 'Einstellungen',
    'settings.description': 'Arbeitsumgebung und Daten verwalten.',
    'settings.language.title': 'Sprache',
    'settings.language.description': 'Wähle die Sprache für die Stitch-&-Scale-Oberfläche.',
    'settings.language.detected': 'Beim ersten Öffnen aus diesem Browser erkannt. Deine Auswahl wird auf diesem Gerät gespeichert.',
    'settings.language.browser': 'Browsersprache',
    'settings.language.manual': 'Manuelle Auswahl',
    'settings.appearance.title': 'Darstellung',
    'settings.appearance.description': 'So sieht Stitch & Scale auf diesem Gerät aus.',
    'nav.projects': 'Projekte',
    'nav.settings': 'Einstellungen',
  },
  fr: {
    'settings.title': 'Préférences',
    'settings.description': 'Gérez votre environnement de travail et vos données.',
    'settings.language.title': 'Langue',
    'settings.language.description': 'Choisissez la langue de l’interface Stitch & Scale.',
    'settings.language.detected': 'Détectée dans ce navigateur à la première ouverture. Votre choix est mémorisé sur cet appareil.',
    'settings.language.browser': 'Langue du navigateur',
    'settings.language.manual': 'Sélection manuelle',
    'settings.appearance.title': 'Apparence',
    'settings.appearance.description': 'Apparence de Stitch & Scale sur cet appareil.',
    'nav.projects': 'Projets',
    'nav.settings': 'Préférences',
  },
  es: {
    'settings.title': 'Preferencias',
    'settings.description': 'Administra tu entorno de trabajo y tus datos.',
    'settings.language.title': 'Idioma',
    'settings.language.description': 'Elige el idioma de la interfaz de Stitch & Scale.',
    'settings.language.detected': 'Detectado desde este navegador al abrir por primera vez. Tu elección se guarda en este dispositivo.',
    'settings.language.browser': 'Idioma del navegador',
    'settings.language.manual': 'Selección manual',
    'settings.appearance.title': 'Apariencia',
    'settings.appearance.description': 'Cómo se ve Stitch & Scale en este dispositivo.',
    'nav.projects': 'Proyectos',
    'nav.settings': 'Preferencias',
  },
  pt: {
    'settings.title': 'Preferências',
    'settings.description': 'Gerencie o ambiente de trabalho e os seus dados.',
    'settings.language.title': 'Idioma',
    'settings.language.description': 'Escolha o idioma da interface do Stitch & Scale.',
    'settings.language.detected': 'Detetado neste navegador na primeira abertura. A sua escolha fica guardada neste dispositivo.',
    'settings.language.browser': 'Idioma do navegador',
    'settings.language.manual': 'Seleção manual',
    'settings.appearance.title': 'Aparência',
    'settings.appearance.description': 'Como o Stitch & Scale aparece neste dispositivo.',
    'nav.projects': 'Projetos',
    'nav.settings': 'Preferências',
  },
};

export function translate(language: LanguageCode, key: TranslationKey): string {
  return TRANSLATIONS[language][key] ?? TRANSLATIONS.en[key] ?? key;
}

export type { TranslationKey };

export function languageLabel(code: LanguageCode): string {
  return LANGUAGE_OPTIONS.find((option) => option.code === code)?.nativeLabel ?? code;
}
