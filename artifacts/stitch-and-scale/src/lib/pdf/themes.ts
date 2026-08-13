// PDF Theme Token System — Stitch & Scale
// All visual differences between templates flow from here.
// Adding a new template = adding one entry to THEMES. Zero new component code.

export type ThemeId = 'minimal' | 'luxury' | 'craft' | 'technical';
// Adding a new cover design for the upcoming publishing system? Two places
// need it, in order: 1) this union, 2) the matching case in renderCover()
// (src/lib/pdf/renderer.ts) - which itself must accept and forward
// customLogo so a designer's uploaded logo works on the new cover too,
// exactly like it does on all four covers below.
export type CoverLayout = 'minimal' | 'luxury' | 'craft' | 'technical';

export interface ThemeTokens {
  id: ThemeId;
  name: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  googleFontsUrl: string;
  // Page colors
  backgroundColor: string;
  textColor: string;
  mutedTextColor: string;
  dividerColor: string;
  defaultAccent: string;
  // Technical blueprint overlay
  gridLineColor?: string;
  // Identity
  personality: string;
  darkVariant: boolean;
  // Cover
  coverLayout: CoverLayout;
  // Watermark (3–8% opacity, per spec)
  watermarkOpacity: number;
  // Badges
  badgeRadius: string;
  // Tables
  tableHeaderBg: string;
  tableStripeBg: string;
  tableBorderColor: string;
  tableHeaderText: string;
  // Callouts
  calloutNote: { bg: string; border: string; text: string };
  calloutTip:  { bg: string; border: string; text: string };
  calloutWarning: { bg: string; border: string; text: string };
  // Color swatches for UI display
  swatches: string[];
}

export interface ResolvedTheme extends ThemeTokens {
  /** User-chosen accent, falls back to defaultAccent */
  accent: string;
}

export function resolveTheme(id: ThemeId, accentOverride?: string): ResolvedTheme {
  const base = THEMES.find(t => t.id === id) ?? THEMES[0];
  return { ...base, accent: accentOverride || base.defaultAccent };
}

export const THEMES: ThemeTokens[] = [
  {
    id: 'minimal',
    name: 'MINIMAL',
    description: 'Clean, Apple-adjacent restraint. Generous whitespace, quiet precision.',
    headingFont: "'Plus Jakarta Sans', sans-serif",
    bodyFont: "'Inter', sans-serif",
    monoFont: "'JetBrains Mono', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@300;400;500;600;700&display=swap',
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A1A',
    mutedTextColor: '#767676',
    dividerColor: '#E5E5E5',
    defaultAccent: '#2563EB',
    personality: 'Quiet, generous whitespace, precision',
    darkVariant: false,
    coverLayout: 'minimal',
    watermarkOpacity: 0.04,
    badgeRadius: '999px',
    tableHeaderBg: '#F5F5F5',
    tableStripeBg: '#FAFAFA',
    tableBorderColor: '#E5E5E5',
    tableHeaderText: '#1A1A1A',
    calloutNote:    { bg: '#EFF6FF', border: '#2563EB', text: '#1D4ED8' },
    calloutTip:     { bg: '#F0FDF4', border: '#16A34A', text: '#15803D' },
    calloutWarning: { bg: '#FFFBEB', border: '#D97706', text: '#B45309' },
    swatches: ['#FFFFFF', '#1A1A1A', '#2563EB'],
  },
  {
    id: 'luxury',
    name: 'LUXURY',
    description: 'Fashion-magazine editorial. Playfair Display serif, gold accents.',
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Inter', sans-serif",
    monoFont: "'Courier New', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700;1,900&family=Inter:wght@300;400;500;600;700&display=swap',
    backgroundColor: '#FAF7F2',
    textColor: '#1A1A1A',
    mutedTextColor: '#7C7060',
    dividerColor: '#E8E0D4',
    defaultAccent: '#B8975A',
    personality: 'Fashion-magazine, editorial serif elegance',
    darkVariant: false,
    coverLayout: 'luxury',
    watermarkOpacity: 0.035,
    badgeRadius: '2px',
    tableHeaderBg: '#F0EAE0',
    tableStripeBg: '#FDF9F4',
    tableBorderColor: '#E8E0D4',
    tableHeaderText: '#1A1A1A',
    calloutNote:    { bg: '#FDF9F4', border: '#B8975A', text: '#7C6030' },
    calloutTip:     { bg: '#F5FAF0', border: '#6B8E5A', text: '#4A6E3A' },
    calloutWarning: { bg: '#FDF6EC', border: '#C8813A', text: '#A0601A' },
    swatches: ['#FAF7F2', '#1A1A1A', '#B8975A'],
  },
  {
    id: 'craft',
    name: 'CRAFT / COZY',
    description: 'Warm, handmade. Lora serif, terracotta warmth, old-knitting-magazine feel.',
    headingFont: "'Lora', serif",
    bodyFont: "'Source Sans 3', sans-serif",
    monoFont: "'Courier New', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700&family=Source+Sans+3:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap',
    backgroundColor: '#F5EFE6',
    textColor: '#4A3728',
    mutedTextColor: '#8A6E5C',
    dividerColor: '#DDD0C0',
    defaultAccent: '#B5654A',
    personality: 'Warm, handmade, old knitting-magazine feel',
    darkVariant: false,
    coverLayout: 'craft',
    watermarkOpacity: 0.05,
    badgeRadius: '4px',
    tableHeaderBg: '#EAE0D0',
    tableStripeBg: '#F9F4EC',
    tableBorderColor: '#DDD0C0',
    tableHeaderText: '#4A3728',
    calloutNote:    { bg: '#F9F4EC', border: '#B5654A', text: '#8A4030' },
    calloutTip:     { bg: '#EFF5EA', border: '#7A9B6A', text: '#4A6B3A' },
    calloutWarning: { bg: '#FBF3E8', border: '#C88A4A', text: '#9A6030' },
    swatches: ['#F5EFE6', '#4A3728', '#B5654A'],
  },
  {
    id: 'technical',
    name: 'TECHNICAL / BLUEPRINT',
    description: 'Engineering precision. IBM Plex, blueprint grid — the grading math is serious.',
    headingFont: "'IBM Plex Sans', sans-serif",
    bodyFont: "'IBM Plex Sans', sans-serif",
    monoFont: "'IBM Plex Mono', monospace",
    googleFontsUrl: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
    backgroundColor: '#FFFFFF',
    textColor: '#0D1B2A',
    mutedTextColor: '#5C7A96',
    dividerColor: '#C8D8E8',
    defaultAccent: '#2E6FBA',
    gridLineColor: 'rgba(27, 58, 92, 0.08)',
    personality: 'Engineering precision — reinforces that grading is serious math',
    darkVariant: true,
    coverLayout: 'technical',
    watermarkOpacity: 0.06,
    badgeRadius: '0px',
    tableHeaderBg: '#EFF4FA',
    tableStripeBg: '#F8FAFD',
    tableBorderColor: '#C8D8E8',
    tableHeaderText: '#0D1B2A',
    calloutNote:    { bg: '#EFF4FA', border: '#2E6FBA', text: '#1A4A8A' },
    calloutTip:     { bg: '#EFF8F4', border: '#2E8A5A', text: '#1A5A3A' },
    calloutWarning: { bg: '#FFF8EE', border: '#C87A2A', text: '#8A5010' },
    swatches: ['#FFFFFF', '#0D1B2A', '#2E6FBA'],
  },
];
