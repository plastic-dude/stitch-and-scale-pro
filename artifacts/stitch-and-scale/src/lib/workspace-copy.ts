import type { LanguageCode } from '@/lib/i18n';

export interface WorkspaceCopy {
  by: string; gauge: string; projectNotFound: string; returnDashboard: string; undo: string; noSections: string; keepIt: string;
  measurement: string; type: string; gradingBase: string; actions: string; label: string; typeLabel: string; gradingKey: string;
  circumferenceFull: string; widthHalf: string; length: string; directNoGrading: string; deleteSection: string;
  editMeasurement: (label: string) => string; deleteMeasurement: (label: string) => string; deleteSectionNamed: (name: string) => string;
}

const COPY: Record<LanguageCode, WorkspaceCopy> = {
  en: { by: 'By', gauge: 'Gauge', projectNotFound: 'Project Not Found', returnDashboard: 'Return to Dashboard', undo: 'Undo', noSections: 'No Sections Yet', keepIt: 'Keep It', measurement: 'Measurement', type: 'Type', gradingBase: 'Grading Base', actions: 'Actions', label: 'Label', typeLabel: 'Type', gradingKey: 'Grading Key', circumferenceFull: 'Circumference (Full)', widthHalf: 'Width (Half)', length: 'Length', directNoGrading: 'Direct (No Grading)', deleteSection: 'Delete section', editMeasurement: (label) => `Edit measurement ${label}`, deleteMeasurement: (label) => `Delete measurement ${label}`, deleteSectionNamed: (name) => `Delete section ${name}` },
  de: { by: 'Von', gauge: 'Maschenprobe', projectNotFound: 'Projekt nicht gefunden', returnDashboard: 'Zur Übersicht', undo: 'Rückgängig', noSections: 'Noch keine Abschnitte', keepIt: 'Behalten', measurement: 'Maß', type: 'Typ', gradingBase: 'Gradierungsbasis', actions: 'Aktionen', label: 'Bezeichnung', typeLabel: 'Typ', gradingKey: 'Gradierungsschlüssel', circumferenceFull: 'Umfang (vollständig)', widthHalf: 'Breite (halb)', length: 'Länge', directNoGrading: 'Direkt (keine Gradierung)', deleteSection: 'Abschnitt löschen', editMeasurement: (label) => `Maß ${label} bearbeiten`, deleteMeasurement: (label) => `Maß ${label} löschen`, deleteSectionNamed: (name) => `Abschnitt ${name} löschen` },
  fr: { by: 'Par', gauge: 'Échantillon', projectNotFound: 'Projet introuvable', returnDashboard: 'Retour au tableau de bord', undo: 'Annuler', noSections: 'Aucune section pour le moment', keepIt: 'Conserver', measurement: 'Mesure', type: 'Type', gradingBase: 'Base de gradation', actions: 'Actions', label: 'Libellé', typeLabel: 'Type', gradingKey: 'Clé de gradation', circumferenceFull: 'Circonférence (entière)', widthHalf: 'Largeur (moitié)', length: 'Longueur', directNoGrading: 'Direct (sans gradation)', deleteSection: 'Supprimer la section', editMeasurement: (label) => `Modifier la mesure ${label}`, deleteMeasurement: (label) => `Supprimer la mesure ${label}`, deleteSectionNamed: (name) => `Supprimer la section ${name}` },
  es: { by: 'Por', gauge: 'Muestra', projectNotFound: 'Proyecto no encontrado', returnDashboard: 'Volver al panel', undo: 'Deshacer', noSections: 'Aún no hay secciones', keepIt: 'Conservar', measurement: 'Medida', type: 'Tipo', gradingBase: 'Base de gradación', actions: 'Acciones', label: 'Etiqueta', typeLabel: 'Tipo', gradingKey: 'Clave de gradación', circumferenceFull: 'Circunferencia (completa)', widthHalf: 'Ancho (mitad)', length: 'Largo', directNoGrading: 'Directo (sin gradación)', deleteSection: 'Eliminar sección', editMeasurement: (label) => `Editar medida ${label}`, deleteMeasurement: (label) => `Eliminar medida ${label}`, deleteSectionNamed: (name) => `Eliminar sección ${name}` },
  pt: { by: 'Por', gauge: 'Amostra', projectNotFound: 'Projeto não encontrado', returnDashboard: 'Voltar ao painel', undo: 'Desfazer', noSections: 'Ainda não há secções', keepIt: 'Manter', measurement: 'Medida', type: 'Tipo', gradingBase: 'Base de graduação', actions: 'Ações', label: 'Etiqueta', typeLabel: 'Tipo', gradingKey: 'Chave de graduação', circumferenceFull: 'Circunferência (total)', widthHalf: 'Largura (metade)', length: 'Comprimento', directNoGrading: 'Direto (sem graduação)', deleteSection: 'Eliminar secção', editMeasurement: (label) => `Editar medida ${label}`, deleteMeasurement: (label) => `Eliminar medida ${label}`, deleteSectionNamed: (name) => `Eliminar secção ${name}` },
};

export function getWorkspaceCopy(locale: string): WorkspaceCopy {
  const code = locale.toLowerCase().split('-')[0] as LanguageCode;
  return COPY[code] ?? COPY.en;
}

/** Locale-aware suffix for stitch counts in a gauge string (e.g. "20 stitches"). */
export const STS_UNIT: Record<LanguageCode, string> = {
  en: 'sts',
  de: 'M',
  fr: 'M',
  es: 'p',
  pt: 'p',
};

/** Locale-aware suffix for row counts in a gauge string (e.g. "28 rows"). */
export const ROWS_UNIT: Record<LanguageCode, string> = {
  en: 'rows',
  de: 'R',
  fr: 'rg',
  es: 'h',
  pt: 'c',
};

/** Render the gauge byline fragment "20sts × 28rows / 4in" localized for the active language. */
export function workspaceGaugeByline(locale: LanguageCode, gauge: { stitchesPer4In: number | null | undefined; rowsPer4In: number | null | undefined; unit?: string } | null | undefined): string {
  const code = locale ?? 'en';
  if (!gauge) return `${STS_UNIT.en} × ${ROWS_UNIT.en}`;
  const stitches = gauge.stitchesPer4In ?? '—';
  const rows = gauge.rowsPer4In ?? '—';
  const unitSuffix = gauge.unit === 'cm' ? 'cm' : 'in';
  return `${stitches}${STS_UNIT[code] ?? STS_UNIT.en} × ${rows}${ROWS_UNIT[code] ?? ROWS_UNIT.en} / 4${unitSuffix}`;
}
