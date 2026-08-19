import type { LanguageCode } from '@/lib/i18n';

export interface WorkspaceCopy {
  by: string; gauge: string; projectNotFound: string; returnDashboard: string; undo: string; noSections: string; keepIt: string;
  measurement: string; type: string; gradingBase: string; actions: string; label: string; typeLabel: string; gradingKey: string;
  circumferenceFull: string; widthHalf: string; length: string; directNoGrading: string; deleteSection: string;
  editMeasurement: (label: string) => string; deleteMeasurement: (label: string) => string; deleteSectionNamed: (name: string) => string;
  emptySectionDesc: string; addFirstSection: string;
  confirmDeleteSectionNamed: (name: string) => string; confirmDeleteSectionBody: (count: number) => string; confirmDeleteSectionAction: string;
  confirmDeleteMeasurementNamed: (label: string) => string; confirmDeleteMeasurementBody: string; confirmDeleteMeasurementAction: string;
  measurementsChip: (count: number) => string;
}

const COPY: Record<LanguageCode, WorkspaceCopy> = {
  en: { by: 'By', gauge: 'Gauge', projectNotFound: 'Project Not Found', returnDashboard: 'Return to Dashboard', undo: 'Undo', noSections: 'No Sections Yet', emptySectionDesc: 'Divide your pattern into logical sections (e.g. Back, Front, Sleeves) to start adding measurements.', addFirstSection: 'Add First Section', keepIt: 'Keep It', confirmDeleteSectionNamed: (name) => `Delete section ${name}?`, confirmDeleteSectionBody: (count) => `This removes the section and all ${count} of its measurements. This cannot be undone — make sure nothing downstream (PDF, test-knit notes) still refers to them.`, confirmDeleteSectionAction: 'Delete Section', confirmDeleteMeasurementNamed: (label) => `Delete "${label}"?`, confirmDeleteMeasurementBody: 'The measurement goes away instantly, but an Undo button sits in the toast for 8 seconds if it was a misclick.', confirmDeleteMeasurementAction: 'Delete Measurement', measurement: 'Measurement', type: 'Type', gradingBase: 'Grading Base', actions: 'Actions', label: 'Label', typeLabel: 'Type', gradingKey: 'Grading Key', circumferenceFull: 'Circumference (Full)', widthHalf: 'Width (Half)', length: 'Length', directNoGrading: 'Direct (No Grading)', deleteSection: 'Delete section', editMeasurement: (label) => `Edit measurement ${label}`, deleteMeasurement: (label) => `Delete measurement ${label}`, deleteSectionNamed: (name) => `Delete section ${name}`, measurementsChip: (count) => `${count} measurement${count === 1 ? '' : 's'}` },
  de: { by: 'Von', gauge: 'Maschenprobe', projectNotFound: 'Projekt nicht gefunden', returnDashboard: 'Zur Übersicht', undo: 'Rückgängig', noSections: 'Noch keine Abschnitte', emptySectionDesc: 'Teile dein Muster in logische Abschnitte (z. B. Rücken, Vorderteil, Ärmel), um mit Maßen zu beginnen.', addFirstSection: 'Ersten Abschnitt hinzufügen', keepIt: 'Behalten', confirmDeleteSectionNamed: (name) => `Abschnitt ${name} löschen?`, confirmDeleteSectionBody: (count) => `Damit werden der Abschnitt und alle ${count} seiner Maße entfernt. Dies kann nicht rückgängig gemacht werden — stelle sicher, dass nichts Weiteres (PDF, Teststricknotizen) noch darauf verweist.`, confirmDeleteSectionAction: 'Abschnitt löschen', confirmDeleteMeasurementNamed: (label) => `„${label}" löschen?`, confirmDeleteMeasurementBody: 'Das Maß wird sofort entfernt, aber ein Rückgängig-Button erscheint 8 Sekunden lang im Hinweis, falls es ein Versehen war.', confirmDeleteMeasurementAction: 'Maß löschen', measurement: 'Maß', type: 'Typ', gradingBase: 'Gradierungsbasis', actions: 'Aktionen', label: 'Bezeichnung', typeLabel: 'Typ', gradingKey: 'Gradierungsschlüssel', circumferenceFull: 'Umfang (vollständig)', widthHalf: 'Breite (halb)', length: 'Länge', directNoGrading: 'Direkt (keine Gradierung)', deleteSection: 'Abschnitt löschen', editMeasurement: (label) => `Maß ${label} bearbeiten`, deleteMeasurement: (label) => `Maß ${label} löschen`, deleteSectionNamed: (name) => `Abschnitt ${name} löschen`, measurementsChip: (count) => `${count} Maß${count === 1 ? '' : 'e'}` },
  fr: { by: 'Par', gauge: 'Échantillon', projectNotFound: 'Projet introuvable', returnDashboard: 'Retour au tableau de bord', undo: 'Annuler', noSections: 'Aucune section pour le moment', emptySectionDesc: 'Divisez votre modèle en sections logiques (dos, devant, manches) pour commencer à ajouter des mesures.', addFirstSection: 'Ajouter la première section', keepIt: 'Conserver', confirmDeleteSectionNamed: (name) => `Supprimer la section ${name} ?`, confirmDeleteSectionBody: (count) => `Cela supprime la section et toutes ses ${count} mesures. Cela ne peut pas être annulé — assurez-vous que rien d'autre (PDF, notes de test) n'y fait encore référence.`, confirmDeleteSectionAction: 'Supprimer la section', confirmDeleteMeasurementNamed: (label) => `Supprimer « ${label} » ?`, confirmDeleteMeasurementBody: 'La mesure disparaît immédiatement, mais un bouton Annuler apparaît dans la notification pendant 8 secondes en cas de fausse manipulation.', confirmDeleteMeasurementAction: 'Supprimer la mesure', measurement: 'Mesure', type: 'Type', gradingBase: 'Base de gradation', actions: 'Actions', label: 'Libellé', typeLabel: 'Type', gradingKey: 'Clé de gradation', circumferenceFull: 'Circonférence (entière)', widthHalf: 'Largeur (moitié)', length: 'Longueur', directNoGrading: 'Direct (sans gradation)', deleteSection: 'Supprimer la section', editMeasurement: (label) => `Modifier la mesure ${label}`, deleteMeasurement: (label) => `Supprimer la mesure ${label}`, deleteSectionNamed: (name) => `Supprimer la section ${name}`, measurementsChip: (count) => `${count} mesure${count === 1 ? '' : 's'}` },
  es: { by: 'Por', gauge: 'Muestra', projectNotFound: 'Proyecto no encontrado', returnDashboard: 'Volver al panel', undo: 'Deshacer', noSections: 'Aún no hay secciones', emptySectionDesc: 'Divide tu patrón en secciones lógicas (espalda, delantero, mangas) para empezar a añadir medidas.', addFirstSection: 'Añadir la primera sección', keepIt: 'Conservar', confirmDeleteSectionNamed: (name) => `¿Eliminar la sección ${name}?`, confirmDeleteSectionBody: (count) => `Esto elimina la sección y todas sus ${count} medidas. No se puede deshacer — asegúrate de que nada más (PDF, notas de prueba) siga haciendo referencia a ellas.`, confirmDeleteSectionAction: 'Eliminar sección', confirmDeleteMeasurementNamed: (label) => `¿Eliminar «${label}»?`, confirmDeleteMeasurementBody: 'La medida desaparece al instante, pero un botón Deshacer aparece en la notificación durante 8 segundos por si fue un error.', confirmDeleteMeasurementAction: 'Eliminar medida', measurement: 'Medida', type: 'Tipo', gradingBase: 'Base de gradación', actions: 'Acciones', label: 'Etiqueta', typeLabel: 'Tipo', gradingKey: 'Clave de gradación', circumferenceFull: 'Circunferencia (completa)', widthHalf: 'Ancho (mitad)', length: 'Largo', directNoGrading: 'Directo (sin gradación)', deleteSection: 'Eliminar sección', editMeasurement: (label) => `Editar medida ${label}`, deleteMeasurement: (label) => `Eliminar medida ${label}`, deleteSectionNamed: (name) => `Eliminar sección ${name}`, measurementsChip: (count) => `${count} medida${count === 1 ? '' : 's'}` },
  pt: { by: 'Por', gauge: 'Amostra', projectNotFound: 'Projeto não encontrado', returnDashboard: 'Voltar ao painel', undo: 'Desfazer', noSections: 'Ainda não há secções', emptySectionDesc: 'Divide o teu padrão em secções lógicas (costas, frente, mangas) para começar a adicionar medidas.', addFirstSection: 'Adicionar a primeira secção', keepIt: 'Manter', confirmDeleteSectionNamed: (name) => `Eliminar a secção ${name}?`, confirmDeleteSectionBody: (count) => `Isto remove a secção e todas as suas ${count} medidas. Não pode ser desfeito — certifica-te de que nada mais (PDF, notas de teste) ainda faz referência a elas.`, confirmDeleteSectionAction: 'Eliminar secção', confirmDeleteMeasurementNamed: (label) => `Eliminar «${label}»?`, confirmDeleteMeasurementBody: 'A medida desaparece imediatamente, mas um botão Desfazer aparece na notificação durante 8 segundos caso tenha sido um engano.', confirmDeleteMeasurementAction: 'Eliminar medida', measurement: 'Medida', type: 'Tipo', gradingBase: 'Base de graduação', actions: 'Ações', label: 'Etiqueta', typeLabel: 'Tipo', gradingKey: 'Chave de graduação', circumferenceFull: 'Circunferência (total)', widthHalf: 'Largura (metade)', length: 'Comprimento', directNoGrading: 'Direto (sem graduação)', deleteSection: 'Eliminar secção', editMeasurement: (label) => `Editar medida ${label}`, deleteMeasurement: (label) => `Eliminar medida ${label}`, deleteSectionNamed: (name) => `Eliminar secção ${name}`, measurementsChip: (count) => `${count} medida${count === 1 ? '' : 's'}` },
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
