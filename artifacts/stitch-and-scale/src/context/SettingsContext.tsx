import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  MeasurementUnit, SizeKey, GradingKey, SIZE_STANDARDS, ALL_SIZES,
  SizingStandard, StandardsTable,
} from '@/lib/grading-engine';
// S001 fix (review agent, verified Aug 14 2026): importData used to write
// 'stitch-and-scale-v1' directly, racing the seam's writeProjects. One writer:
// both the reducer (ProjectsContext) and import land through the seam helper,
// which persists to IndexedDB AND localStorage atomically.
import { writeProjects } from '@/lib/storage-lib';
import type { PatternProject } from '@/lib/grading-engine';
import { getInitialLanguage, translate, type LanguageCode, type TranslationKey, type TranslationVariables } from '@/lib/i18n';
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
  exportData:             () => void;
  importData:             (jsonData: string) => boolean;
  setOnboardingCompleted: (completed: boolean) => void;
  setLanguage:           (language: LanguageCode) => void;
  t:                     (key: TranslationKey, variables?: TranslationVariables) => string;
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
  const t = (key: TranslationKey, variables?: TranslationVariables) => translate(settings.language, key, variables);

  const exportData = () => {
    try {
      const projects = localStorage.getItem('stitch-and-scale-v1') || '[]';
      const exportObj = { projects: JSON.parse(projects), settings };
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `stitch-and-scale-export-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Failed to export data', e);
    }
  };

  const importData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.projects && Array.isArray(parsed.projects)) {
        writeProjects(parsed.projects as PatternProject[]).catch(err =>
          console.error('[SettingsContext] import persistence failed', err)
        );
      }
      if (parsed.settings) {
        setSettings(s => {
          const mergedCustomStandard = { ...s.customStandard };
          if (parsed.settings.customStandard) {
            for (const size of ALL_SIZES) {
              mergedCustomStandard[size] = {
                ...s.customStandard[size],
                ...(parsed.settings.customStandard[size] ?? {}),
              };
            }
          }
          return {
            ...s,
            ...parsed.settings,
            pdfDefaults: { ...DEFAULT_PDF_DEFAULTS, ...(parsed.settings.pdfDefaults ?? {}) },
            customStandard: mergedCustomStandard,
            studioProfile: { ...DEFAULT_STUDIO_PROFILE, ...(parsed.settings.studioProfile ?? {}) },
          };
        });
      }
      return true;
    } catch {
      return false;
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
      t,
      exportData,
      importData,
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
