import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  MeasurementUnit, SizeKey, GradingKey, SIZE_STANDARDS, ALL_SIZES,
  SizingStandard, StandardsTable,
} from '@/lib/grading-engine';
// S001 fix (review agent, verified Aug 14 2026): importData used to write
// 'stitch-and-scale-v1' directly, racing the seam's writeProjects. One writer:
// both the reducer (ProjectsContext) and import land through the seam helper,
// which persists to IndexedDB AND localStorage atomically.
import { downloadOriginMigrationPackage, restoreOriginMigrationPackage, type MigrationRestoreResult, type OriginMigrationPackage } from '@/lib/origin-migration';
import { getInitialLanguage, translate, type LanguageCode, type TranslationKey, type TranslationVariables } from '@/lib/i18n';
import { getSettingsCopy, type SettingsCopy } from '@/lib/settings-copy';
import { DEFAULT_STUDIO_PROFILE, type StudioProfile } from '@/lib/studio-profile-copy';

// ─── Types ────────────────────────────────────────────────────────────────────

// SizingStandard now lives in grading-engine.ts (the engine shouldn't depend
// on this file, but pages already import SizingStandard from here - re-exported
// so nothing else needs to change).
export type { SizingStandard };

/** A designer's own body-measurement chart, same shape as SIZE_STANDARDS (CYC),
 *  so the grading engine treats it identically - just a different data source. */
export type CustomStandardValues = StandardsTable;

/** PDF export defaults — persisted to localStorage alongside app settings */
export interface PdfDefaults {
  themeId: 'minimal' | 'luxury' | 'craft' | 'technical';
  accentColor: string;
  lastNamingTemplate: string | null;
  brandSuffix: 'never' | 'first-only' | 'always';
  firstExportTipSeen: boolean;
  includeCover: boolean;
  includeGaugeSummary: boolean;
  includeNotes: boolean;
  /** A designer's own logo for the PDF cover, as a data: URI. Compressed
   *  and resized client-side before it's ever stored here - see
   *  compressImageToDataUrl in src/lib/image-utils.ts. Optional; when
   *  absent, exports use the Stitch & Scale mark as they always have. */
  customLogo?: string;
}

interface SettingsState {
  unit: MeasurementUnit;
  theme: 'light' | 'dark' | 'system';
  /** Additive PDF-defaults slice — Replit B (PDF system) owns this */
  pdfDefaults: PdfDefaults;
  /** Replit C (Onboarding) — additive fields */
  sizingStandard: SizingStandard;
  /** A designer's own measurement chart for the Custom standard - starts as an
   *  editable copy of CYC, since 117 blank required cells would be unusable
   *  and dangerous (zero-value grading) if a designer picks Custom without
   *  editing anything yet. */
  customStandard: CustomStandardValues;
  /** Local studio identity used as a default for new projects and future exports. */
  studioProfile: StudioProfile;
  onboardingCompleted: boolean;
  /** Interface language. Auto-detected once, then persisted after explicit choice. */
  language: LanguageCode;
  /** Controls only private recognition presentation; stored evidence is retained when false. */
  recognitionEnabled: boolean;
}

interface SettingsContextType extends SettingsState {
  setUnit:                (unit: MeasurementUnit) => void;
  setTheme:               (theme: 'light' | 'dark' | 'system') => void;
  setPdfDefaults:         (pdfDefaults: PdfDefaults) => void;
  setSizingStandard:      (standard: SizingStandard) => void;
  setCustomStandardValue: (size: SizeKey, key: GradingKey, value: number) => void;
  resetCustomStandard:    () => void;
  setStudioProfile:       (profile: StudioProfile) => void;
  updateStudioProfile:    (patch: Partial<StudioProfile>) => void;
  exportData:             () => Promise<OriginMigrationPackage>;
  importData:             (jsonData: string) => Promise<MigrationRestoreResult | null>;
  wipeAllData:            () => Promise<void>;
  setOnboardingCompleted: (completed: boolean) => void;
  setLanguage:           (language: LanguageCode) => void;
  setRecognitionEnabled: (enabled: boolean) => void;
  t:                     (key: TranslationKey, variables?: TranslationVariables) => string;
  getCopy:               () => SettingsCopy;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_PDF_DEFAULTS: PdfDefaults = {
  themeId: 'minimal',
  accentColor: '',
  lastNamingTemplate: null,
  brandSuffix: 'never',
  firstExportTipSeen: false,
  includeCover: true,
  includeGaugeSummary: true,
  includeNotes: true,
};

// CHK-131: dark is now the first mode for every new user. The theme
// picker still offers light / dark / system, and existing users keep their
// stored preference (deep-merge below wins over this default).
const defaultSettings: SettingsState = {
  unit: 'in',
  theme: 'dark',
  pdfDefaults: DEFAULT_PDF_DEFAULTS,
  sizingStandard: 'CYC',
  customStandard: JSON.parse(JSON.stringify(SIZE_STANDARDS)),
  studioProfile: { ...DEFAULT_STUDIO_PROFILE },
  onboardingCompleted: false,
  language: getInitialLanguage(),
  recognitionEnabled: true,
};

// ─── Context ──────────────────────────────────────────────────────────────────

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const stored = localStorage.getItem('stitch-and-scale-settings-v1');
      if (!stored) return defaultSettings;
      const parsed = JSON.parse(stored);
      const mergedCustomStandard = {} as CustomStandardValues;
      for (const size of ALL_SIZES) {
        mergedCustomStandard[size] = {
          ...SIZE_STANDARDS[size],
          ...(parsed.customStandard?.[size] ?? {}),
        };
      }
      // Deep-merge so new fields always get defaults
      return {
        ...defaultSettings,
        ...parsed,
        recognitionEnabled: typeof parsed.recognitionEnabled === 'boolean' ? parsed.recognitionEnabled : defaultSettings.recognitionEnabled,
        pdfDefaults: { ...DEFAULT_PDF_DEFAULTS, ...(parsed.pdfDefaults ?? {}) },
        customStandard: mergedCustomStandard,
        studioProfile: { ...DEFAULT_STUDIO_PROFILE, ...(parsed.studioProfile ?? {}) },
      };
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem('stitch-and-scale-settings-v1', JSON.stringify(settings));
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (settings.theme === 'system') {
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(sys);
    } else {
      root.classList.add(settings.theme);
    }
  }, [settings]);

  const setUnit                = (unit: MeasurementUnit)        => setSettings(s => ({ ...s, unit }));
  const setTheme               = (theme: 'light' | 'dark' | 'system') => setSettings(s => ({ ...s, theme }));
  const setPdfDefaults         = (pdfDefaults: PdfDefaults)     => setSettings(s => ({ ...s, pdfDefaults }));
  const setSizingStandard      = (sizingStandard: SizingStandard) => setSettings(s => ({ ...s, sizingStandard }));
  const setCustomStandardValue = (size: SizeKey, key: GradingKey, value: number) =>
    setSettings(s => ({
      ...s,
      customStandard: {
        ...s.customStandard,
        [size]: { ...s.customStandard[size], [key]: value },
      },
    }));
  const resetCustomStandard = () =>
    setSettings(s => ({ ...s, customStandard: JSON.parse(JSON.stringify(SIZE_STANDARDS)) }));
  const setStudioProfile = (studioProfile: StudioProfile) =>
    setSettings(s => ({ ...s, studioProfile: { ...DEFAULT_STUDIO_PROFILE, ...studioProfile } }));
  const updateStudioProfile = (patch: Partial<StudioProfile>) =>
    setSettings(s => ({ ...s, studioProfile: { ...s.studioProfile, ...patch } }));
  const setOnboardingCompleted = (onboardingCompleted: boolean)  => setSettings(s => ({ ...s, onboardingCompleted }));
  const setLanguage = (language: LanguageCode) => setSettings(s => ({ ...s, language }));
  const setRecognitionEnabled = (recognitionEnabled: boolean) => setSettings(s => ({ ...s, recognitionEnabled }));
  const t = (key: TranslationKey, variables?: TranslationVariables) => translate(settings.language, key, variables);
  const getCopy = () => getSettingsCopy(settings.language);

  const exportData = () => downloadOriginMigrationPackage(
    `stitch-and-scale-origin-migration-${new Date().toISOString().split('T')[0]}.json`,
  );

  const importData = async (jsonData: string): Promise<MigrationRestoreResult | null> => {
    try {
      const parsed = JSON.parse(jsonData);
      const result = await restoreOriginMigrationPackage(parsed);
      setSettings(current => {
        const mergedCustomStandard = { ...current.customStandard };
        if (result.settings.customStandard && typeof result.settings.customStandard === 'object') {
          for (const size of ALL_SIZES) {
            const restoredSize = (result.settings.customStandard as Record<string, unknown>)[size];
            mergedCustomStandard[size] = {
              ...current.customStandard[size],
              ...(restoredSize && typeof restoredSize === 'object' ? restoredSize : {}),
            };
          }
        }
        return {
          ...current,
          ...result.settings,
          recognitionEnabled: typeof result.settings.recognitionEnabled === 'boolean' ? result.settings.recognitionEnabled : current.recognitionEnabled,
          pdfDefaults: { ...DEFAULT_PDF_DEFAULTS, ...(result.settings.pdfDefaults && typeof result.settings.pdfDefaults === 'object' ? result.settings.pdfDefaults : {}) },
          customStandard: mergedCustomStandard,
          studioProfile: { ...DEFAULT_STUDIO_PROFILE, ...(result.settings.studioProfile && typeof result.settings.studioProfile === 'object' ? result.settings.studioProfile : {}) },
        };
      });
      return result;
    } catch {
      return null;
    }
  };

  const wipeAllData = async () => {
    const { wipeAllData: wipe } = await import('@/lib/storage-lib');
    await wipe();
    setSettings(defaultSettings);
    // Hard reload to clear any in-memory state and force fresh context init
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <SettingsContext.Provider value={{
      ...settings,
      setUnit,
      setTheme,
      setPdfDefaults,
      setSizingStandard,
      setCustomStandardValue,
      resetCustomStandard,
      setStudioProfile,
      updateStudioProfile,
      setOnboardingCompleted,
      setLanguage,
      setRecognitionEnabled,
      t,
      getCopy,
      exportData,
      importData,
      wipeAllData,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
