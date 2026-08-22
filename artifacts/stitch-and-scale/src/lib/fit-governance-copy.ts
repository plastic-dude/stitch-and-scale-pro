import type { LanguageCode } from './i18n';

export interface FitGovernanceCopy {
  title: string;
  standardTitle: string;
  easeTitle: string;
  sourceLabel: string;
  versionLabel: string;
  verifiedLabel: string;
  inclusiveLabel: string;
  inclusiveYes: string;
  inclusiveNo: string;
  easeCategoryLabel: string;
  customOffsetsLabel: string;
  diagnosticTitle: string;
  diagnosticDescription: string;
  applyEase: string;
  resetEase: string;
  veryClose: string;
  close: string;
  standard: string;
  relaxed: string;
  oversized: string;
}

export const COPY: Record<LanguageCode, FitGovernanceCopy> = {
  en: {
    title: 'Fit Governance',
    standardTitle: 'Sizing Standard',
    easeTitle: 'Ease Profile',
    sourceLabel: 'Source',
    versionLabel: 'Version',
    verifiedLabel: 'Last Verified',
    inclusiveLabel: 'Inclusive',
    inclusiveYes: 'Yes',
    inclusiveNo: 'No',
    easeCategoryLabel: 'Category',
    customOffsetsLabel: 'Custom Offsets',
    diagnosticTitle: 'Grading Diagnostics',
    diagnosticDescription: 'Analyzing jumps between sizes for plausibility...',
    applyEase: 'Apply Ease',
    resetEase: 'Reset Ease',
    veryClose: 'Very Close Fit',
    close: 'Close Fit',
    standard: 'Standard Fit',
    relaxed: 'Relaxed Fit',
    oversized: 'Oversized',
  },
  de: {
    title: 'Passform-Kontrolle',
    standardTitle: 'Größenstandard',
    easeTitle: 'Bequemlichkeitszugabe',
    sourceLabel: 'Quelle',
    versionLabel: 'Version',
    verifiedLabel: 'Zuletzt verifiziert',
    inclusiveLabel: 'Inklusiv',
    inclusiveYes: 'Ja',
    inclusiveNo: 'Nein',
    easeCategoryLabel: 'Kategorie',
    customOffsetsLabel: 'Eigene Zugaben',
    diagnosticTitle: 'Gradierung-Diagnose',
    diagnosticDescription: 'Analysiere Sprünge zwischen den Größen auf Plausibilität...',
    applyEase: 'Zugabe anwenden',
    resetEase: 'Zugabe zurücksetzen',
    veryClose: 'Sehr eng',
    close: 'Eng',
    standard: 'Standard',
    relaxed: 'Locker',
    oversized: 'Oversize',
  },
  fr: {
    title: 'Gouvernance de l\'ajustement',
    standardTitle: 'Standard de taille',
    easeTitle: 'Profil d\'aisance',
    sourceLabel: 'Source',
    versionLabel: 'Version',
    verifiedLabel: 'Dernière vérification',
    inclusiveLabel: 'Inclusif',
    inclusiveYes: 'Oui',
    inclusiveNo: 'Non',
    easeCategoryLabel: 'Catégorie',
    customOffsetsLabel: 'Décalages personnalisés',
    diagnosticTitle: 'Diagnostics de gradation',
    diagnosticDescription: 'Analyse de la plausibilité des écarts entre les tailles...',
    applyEase: 'Appliquer l\'aisance',
    resetEase: 'Réinitialiser l\'aisance',
    veryClose: 'Très ajusté',
    close: 'Ajusté',
    standard: 'Standard',
    relaxed: 'Décontracté',
    oversized: 'Surdimensionné',
  },
  es: {
    title: 'Gobernanza del ajuste',
    standardTitle: 'Estándar de tallaje',
    easeTitle: 'Perfil de holgura',
    sourceLabel: 'Fuente',
    versionLabel: 'Versión',
    verifiedLabel: 'Última verificación',
    inclusiveLabel: 'Inclusivo',
    inclusiveYes: 'Sí',
    inclusiveNo: 'No',
    easeCategoryLabel: 'Categoría',
    customOffsetsLabel: 'Holguras personalizadas',
    diagnosticTitle: 'Diagnósticos de escalado',
    diagnosticDescription: 'Analizando la plausibilidad de los saltos entre tallas...',
    applyEase: 'Aplicar holgura',
    resetEase: 'Restablecer holgura',
    veryClose: 'Muy ajustado',
    close: 'Ajustado',
    standard: 'Estándar',
    relaxed: 'Relajado',
    oversized: 'Extragrande',
  },
  pt: {
    title: 'Governança de ajuste',
    standardTitle: 'Padrão de tamanho',
    easeTitle: 'Perfil de folga',
    sourceLabel: 'Fonte',
    versionLabel: 'Versão',
    verifiedLabel: 'Última verificação',
    inclusiveLabel: 'Inclusivo',
    inclusiveYes: 'Sim',
    inclusiveNo: 'Não',
    easeCategoryLabel: 'Categoria',
    customOffsetsLabel: 'Folgas personalizadas',
    diagnosticTitle: 'Diagnósticos de graduação',
    diagnosticDescription: 'Analisando a plausibilidade dos saltos entre tamanhos...',
    applyEase: 'Aplicar folga',
    resetEase: 'Redefinir folga',
    veryClose: 'Muito justo',
    close: 'Justo',
    standard: 'Padrão',
    relaxed: 'Descontraído',
    oversized: 'Oversized',
  },
};

export const FIT_GOVERNANCE_COPY = COPY;
