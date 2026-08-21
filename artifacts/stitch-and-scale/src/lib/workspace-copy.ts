export type LanguageCode = 'en' | 'de' | 'fr' | 'es' | 'pt';

export interface WorkspaceCopy {
  draftIssueUnresolved: string;
  draftFixIssues: string;
  draftNoIssues: string;
  draftIssuesFound: string;
  draftPreflight: string;
  genericError: string;
  invalidNumber: string;
  valueRequired: string;
  labelRequired: string;
  importProject: string;
  localOnlyDescription: string;
  localOnlyTitle: string;
  by: string;
  gauge: string;
  projectNotFound: string;
  returnDashboard: string;
  undo: string;
  noSections: string;
  keepIt: string;
  measurement: string;
  type: string;
  gradingBase: string;
  actions: string;
  label: string;
  typeLabel: string;
  gradingKey: string;
  circumferenceFull: string;
  widthHalf: string;
  length: string;
  directNoGrading: string;
  deleteSection: string;
  editMeasurement: (label: string) => string;
  deleteMeasurement: (label: string) => string;
  deleteSectionNamed: (name: string) => string;
  emptySectionDesc: string;
  addFirstSection: string;
  confirmDeleteSectionNamed: (name: string) => string;
  confirmDeleteSectionBody: (count: number) => string;
  confirmDeleteSectionAction: string;
  confirmDeleteMeasurementNamed: (label: string) => string;
  confirmDeleteMeasurementBody: string;
  confirmDeleteMeasurementAction: string;
  measurementsChip: (count: number) => string;
  renameProject: string;
  renameDialogTitle: string;
  renameSave: string;
  renameCancel: string;
  renameSaved: string;
  renameFailed: string;
  renameEmpty: string;
  renameSame: string;
}

const COPY: Record<LanguageCode, WorkspaceCopy> = {
  en: {
    by: 'By',
    gauge: 'Gauge',
    projectNotFound: 'Project Not Found',
    returnDashboard: 'Return to Dashboard',
    undo: 'Undo',
    noSections: 'No Sections Yet',
    emptySectionDesc: 'Divide your pattern into logical sections (e.g. Back, Front, Sleeves) to start adding measurements.',
    addFirstSection: 'Add First Section',
    keepIt: 'Keep It',
    confirmDeleteSectionNamed: (name) => `Delete section ${name}?`,
    confirmDeleteSectionBody: (count) => `This removes the section and all ${count} of its measurements. This cannot be undone — make sure nothing downstream (PDF, test-knit notes) still refers to them.`,
    confirmDeleteSectionAction: 'Delete Section',
    confirmDeleteMeasurementNamed: (label) => `Delete "${label}"?`,
    confirmDeleteMeasurementBody: 'The measurement goes away instantly, but an Undo button sits in the toast for 8 seconds if it was a misclick.',
    confirmDeleteMeasurementAction: 'Delete Measurement',
    measurement: 'Measurement',
    type: 'Type',
    gradingBase: 'Grading Base',
    actions: 'Actions',
    label: 'Label',
    typeLabel: 'Type',
    gradingKey: 'Grading Key',
    circumferenceFull: 'Circumference (Full)',
    widthHalf: 'Width (Half)',
    length: 'Length',
    directNoGrading: 'Direct (No Grading)',
    deleteSection: 'Delete section',
    editMeasurement: (label) => `Edit measurement ${label}`,
    deleteMeasurement: (label) => `Delete measurement ${label}`,
    deleteSectionNamed: (name) => `Delete section ${name}`,
    measurementsChip: (count) => `${count} measurement${count === 1 ? '' : 's'}`,
    renameProject: 'Rename project',
    renameDialogTitle: 'Rename your pattern project',
    renameSave: 'Save',
    renameCancel: 'Cancel',
    renameSaved: 'Project renamed',
    renameFailed: 'Could not save the new name',
    renameEmpty: 'The name cannot be empty',
    renameSame: 'Nothing changed',
    localOnlyTitle: 'Local Project',
    localOnlyDescription: 'This project exists only in your browser storage. To access it on another device, export it and then import it there.',
    importProject: 'Import Project',
    labelRequired: 'Label is required',
    valueRequired: 'Base value is required',
    invalidNumber: 'Invalid number',
    genericError: 'Something went wrong. Please check your inputs.',
    draftPreflight: 'Draft Preflight',
    draftIssuesFound: 'Potential issues found in your draft tokens.',
    draftNoIssues: 'All tokens resolved correctly.',
    draftFixIssues: 'Please review the tokens in your draft before exporting.',
    draftIssueUnresolved: 'Unresolved',
  },
  de: {
    by: 'Von',
    gauge: 'Maschenprobe',
    projectNotFound: 'Projekt nicht gefunden',
    returnDashboard: 'Zur Übersicht',
    undo: 'Rückgängig',
    noSections: 'Noch keine Abschnitte',
    emptySectionDesc: 'Teile dein Muster in logische Abschnitte (z. B. Rücken, Vorderteil, Ärmel), um mit Maßen zu beginnen.',
    addFirstSection: 'Ersten Abschnitt hinzufügen',
    keepIt: 'Behalten',
    confirmDeleteSectionNamed: (name) => `Abschnitt ${name} löschen?`,
    confirmDeleteSectionBody: (count) => `Damit werden der Abschnitt und alle ${count} seiner Maße entfernt. Dies kann nicht rückgängig gemacht werden — stelle sicher, dass nichts Weiteres (PDF, Teststricknotizen) noch darauf verweist.`,
    confirmDeleteSectionAction: 'Abschnitt löschen',
    confirmDeleteMeasurementNamed: (label) => `„${label}" löschen?`,
    confirmDeleteMeasurementBody: 'Das Maß wird sofort entfernt, aber ein Rückgängig-Button erscheint 8 Sekunden lang im Hinweis, falls es ein Versehen war.',
    confirmDeleteMeasurementAction: 'Maß löschen',
    measurement: 'Maß',
    type: 'Typ',
    gradingBase: 'Gradierungsbasis',
    actions: 'Aktionen',
    label: 'Bezeichnung',
    typeLabel: 'Typ',
    gradingKey: 'Gradierungsschlüssel',
    circumferenceFull: 'Umfang (vollständig)',
    widthHalf: 'Breite (halb)',
    length: 'Länge',
    directNoGrading: 'Direkt (keine Gradierung)',
    deleteSection: 'Abschnitt löschen',
    editMeasurement: (label) => `Maß ${label} bearbeiten`,
    deleteMeasurement: (label) => `Maß ${label} löschen`,
    deleteSectionNamed: (name) => `Abschnitt ${name} löschen`,
    measurementsChip: (count) => `${count} Maß${count === 1 ? '' : 'e'}`,
    renameProject: 'Projekt umbenennen',
    renameDialogTitle: 'Dein Musterprojekt umbenennen',
    renameSave: 'Speichern',
    renameCancel: 'Abbrechen',
    renameSaved: 'Projekt umbenannt',
    renameFailed: 'Der neue Name konnte nicht gespeichert werden',
    renameEmpty: 'Der Name darf nicht leer sein',
    renameSame: 'Nichts geändert',
    localOnlyTitle: 'Lokales Projekt',
    localOnlyDescription: 'Dieses Projekt existiert nur in Ihrem Browser-Speicher. Um es auf einem anderen Gerät aufzurufen, exportieren Sie es und importieren Sie es dort.',
    importProject: 'Projekt importieren',
    labelRequired: 'Label ist erforderlich',
    valueRequired: 'Basiswert ist erforderlich',
    invalidNumber: 'Ungültige Nummer',
    genericError: 'Etwas ist schief gelaufen. Bitte überprüfen Sie Ihre Eingaben.',
    draftPreflight: 'Entwurf-Vorprüfung',
    draftIssuesFound: 'Potenzielle Probleme in Ihren Entwurf-Tokens gefunden.',
    draftNoIssues: 'Alle Tokens korrekt aufgelöst.',
    draftFixIssues: 'Bitte überprüfen Sie die Tokens in Ihrem Entwurf vor dem Export.',
    draftIssueUnresolved: 'Nicht aufgelöst',
  },
  fr: {
    by: 'Par',
    gauge: 'Échantillon',
    projectNotFound: 'Projet introuvable',
    returnDashboard: 'Retour au tableau de bord',
    undo: 'Annuler',
    noSections: 'Aucune section pour le moment',
    emptySectionDesc: 'Divisez votre modèle en sections logiques (dos, devant, manches) pour commencer à ajouter des mesures.',
    addFirstSection: 'Ajouter la première section',
    keepIt: 'Conserver',
    confirmDeleteSectionNamed: (name) => `Supprimer la section ${name} ?`,
    confirmDeleteSectionBody: (count) => `Cela supprime la section et toutes ses ${count} mesures. Cela ne peut pas être annulé — assurez-vous que rien d'autre (PDF, notes de test) n'y fait encore référence.`,
    confirmDeleteSectionAction: 'Supprimer la section',
    confirmDeleteMeasurementNamed: (label) => `Supprimer « ${label} » ?`,
    confirmDeleteMeasurementBody: 'La mesure disparaît immédiatement, mais un bouton Annuler apparaît dans la notification pendant 8 secondes en cas de fausse manipulation.',
    confirmDeleteMeasurementAction: 'Supprimer la mesure',
    measurement: 'Mesure',
    type: 'Type',
    gradingBase: 'Base de gradation',
    actions: 'Actions',
    label: 'Libellé',
    typeLabel: 'Type',
    gradingKey: 'Clé de gradation',
    circumferenceFull: 'Circonférence (entière)',
    widthHalf: 'Largeur (moitié)',
    length: 'Longueur',
    directNoGrading: 'Direct (sans gradation)',
    deleteSection: 'Supprimer la section',
    editMeasurement: (label) => `Modifier la mesure ${label}`,
    deleteMeasurement: (label) => `Supprimer la mesure ${label}`,
    deleteSectionNamed: (name) => `Supprimer la section ${name}`,
    measurementsChip: (count) => `${count} mesure${count === 1 ? '' : 's'}`,
    renameProject: 'Renommer le projet',
    renameDialogTitle: 'Renommer votre projet de patron',
    renameSave: 'Enregistrer',
    renameCancel: 'Annuler',
    renameSaved: 'Projet renommé',
    renameFailed: 'Impossible d\'enregistrer le nouveau nom',
    renameEmpty: 'Le nom ne peut pas être vide',
    renameSame: 'Aucune modification',
    localOnlyTitle: 'Projet local',
    localOnlyDescription: 'Ce projet n\'existe que dans le stockage de votre navigateur. Pour y accéder sur un autre appareil, exportez-le puis importez-le là-bas.',
    importProject: 'Importer le projet',
    labelRequired: 'L\'étiquette est requise',
    valueRequired: 'La valeur de base est requise',
    invalidNumber: 'Nombre invalide',
    genericError: 'Un problème est survenu. Veuillez vérifier vos saisies.',
    draftPreflight: 'Vérification du brouillon',
    draftIssuesFound: 'Problèmes potentiels trouvés dans vos jetons de brouillon.',
    draftNoIssues: 'Tous les jetons sont résolus correctement.',
    draftFixIssues: 'Veuillez vérifier les jetons de votre brouillon avant l\'exportation.',
    draftIssueUnresolved: 'Non résolu',
  },
  es: {
    by: 'Por',
    gauge: 'Muestra',
    projectNotFound: 'Proyecto no encontrado',
    returnDashboard: 'Volver al panel',
    undo: 'Deshacer',
    noSections: 'Aún no hay secciones',
    emptySectionDesc: 'Divide tu patrón en secciones lógicas (espalda, delantero, mangas) para empezar a añadir medidas.',
    addFirstSection: 'Añadir la primera sección',
    keepIt: 'Conservar',
    confirmDeleteSectionNamed: (name) => `¿Eliminar la sección ${name}?`,
    confirmDeleteSectionBody: (count) => `Esto elimina la sección y todas sus ${count} medidas. No se puede deshacer — asegúrate de que nada más (PDF, notas de prueba) siga haciendo referencia a ellas.`,
    confirmDeleteSectionAction: 'Eliminar sección',
    confirmDeleteMeasurementNamed: (label) => `¿Eliminar «${label}»?`,
    confirmDeleteMeasurementBody: 'La medida desaparece al instante, pero un botón Deshacer aparece en la notificación durante 8 segundos por si fue un error.',
    confirmDeleteMeasurementAction: 'Eliminar medida',
    measurement: 'Medida',
    type: 'Tipo',
    gradingBase: 'Base de gradación',
    actions: 'Acciones',
    label: 'Etiqueta',
    typeLabel: 'Tipo',
    gradingKey: 'Clave de gradación',
    circumferenceFull: 'Circunferencia (completa)',
    widthHalf: 'Ancho (mitad)',
    length: 'Largo',
    directNoGrading: 'Directo (sin gradación)',
    deleteSection: 'Eliminar sección',
    editMeasurement: (label) => `Editar medida ${label}`,
    deleteMeasurement: (label) => `Eliminar medida ${label}`,
    deleteSectionNamed: (name) => `Eliminar sección ${name}`,
    measurementsChip: (count) => `${count} medida${count === 1 ? '' : 's'}`,
    renameProject: 'Renombrar proyecto',
    renameDialogTitle: 'Renombrar tu proyecto de patrón',
    renameSave: 'Guardar',
    renameCancel: 'Cancelar',
    renameSaved: 'Proyecto renombrado',
    renameFailed: 'No se pudo guardar el nuevo nombre',
    renameEmpty: 'El nombre no puede estar vacío',
    renameSame: 'Sin cambios',
    localOnlyTitle: 'Proyecto local',
    localOnlyDescription: 'Este proyecto solo existe en el almacenamiento de tu navegador. Para acceder a él en otro dispositivo, expórtalo e impórtalo allí.',
    importProject: 'Importar proyecto',
    labelRequired: 'La etiqueta es obligatoria',
    valueRequired: 'El valor base es obligatorio',
    invalidNumber: 'Número inválido',
    genericError: 'Algo salió mal. Por favor, compruebe sus entradas.',
    draftPreflight: 'Verificación previa del borrador',
    draftIssuesFound: 'Se han encontrado posibles problemas en los tokens de su borrador.',
    draftNoIssues: 'Todos los tokens se han resuelto correctamente.',
    draftFixIssues: 'Revise los tokens de su borrador antes de exportar.',
    draftIssueUnresolved: 'No resuelto',
  },
  pt: {
    by: 'Por',
    gauge: 'Amostra',
    projectNotFound: 'Projeto não encontrado',
    returnDashboard: 'Voltar ao painel',
    undo: 'Desfazer',
    noSections: 'Ainda não há secções',
    emptySectionDesc: 'Divide o teu padrão em secções lógicas (costas, frente, mangas) para começar a adicionar medidas.',
    addFirstSection: 'Adicionar a primeira secção',
    keepIt: 'Manter',
    confirmDeleteSectionNamed: (name) => `Eliminar a secção ${name}?`,
    confirmDeleteSectionBody: (count) => `Isto remove a secção e todas as suas ${count} medidas. Não pode ser desfeito — certifica-te de que nada mais (PDF, notas de teste) ainda faz referência a elas.`,
    confirmDeleteSectionAction: 'Eliminar secção',
    confirmDeleteMeasurementNamed: (label) => `Eliminar «${label}»?`,
    confirmDeleteMeasurementBody: 'A medida desaparece imediatamente, mas um botão Desfazer aparece na notificação durante 8 segundos caso tenha sido um engano.',
    confirmDeleteMeasurementAction: 'Eliminar medida',
    measurement: 'Medida',
    type: 'Tipo',
    gradingBase: 'Base de graduação',
    actions: 'Ações',
    label: 'Etiqueta',
    typeLabel: 'Tipo',
    gradingKey: 'Chave de graduação',
    circumferenceFull: 'Circunferência (total)',
    widthHalf: 'Largura (metade)',
    length: 'Comprimento',
    directNoGrading: 'Direto (sem graduação)',
    deleteSection: 'Eliminar secção',
    editMeasurement: (label) => `Editar medida ${label}`,
    deleteMeasurement: (label) => `Eliminar medida ${label}`,
    deleteSectionNamed: (name) => `Eliminar secção ${name}`,
    measurementsChip: (count) => `${count} medida${count === 1 ? '' : 's'}`,
    renameProject: 'Renomear projeto',
    renameDialogTitle: 'Renomear o teu projeto de padrão',
    renameSave: 'Guardar',
    renameCancel: 'Cancelar',
    renameSaved: 'Projeto renomeado',
    renameFailed: 'Não foi possível guardar o novo nome',
    renameEmpty: 'O nome não pode estar vazio',
    renameSame: 'Sem alterações',
    localOnlyTitle: 'Projeto local',
    localOnlyDescription: 'Este projeto existe apenas no armazenamento do seu navegador. Para aceder a ele noutro dispositivo, exporte-o e importe-o lá.',
    importProject: 'Importar projeto',
    labelRequired: 'A etiqueta é obrigatória',
    valueRequired: 'O valor base é obrigatório',
    invalidNumber: 'Número inválido',
    genericError: 'Ocorreu um erro. Por favor, verifique as suas entradas.',
    draftPreflight: 'Verificação prévia do rascunho',
    draftIssuesFound: 'Foram encontrados potenciais problemas nos tokens do seu rascunho.',
    draftNoIssues: 'Todos os tokens foram resolvidos corretamente.',
    draftFixIssues: 'Por favor, reveja os tokens no seu rascunho antes de exportar.',
    draftIssueUnresolved: 'Não resolvido',
  },
};

export function getWorkspaceCopy(locale: string): WorkspaceCopy {
  const code = locale.toLowerCase().split('-')[0] as LanguageCode;
  return COPY[code] ?? COPY.en;
}

export const STS_UNIT: Record<LanguageCode, string> = {
  en: 'sts',
  de: 'M',
  fr: 'M',
  es: 'p',
  pt: 'p',
};

export const ROWS_UNIT: Record<LanguageCode, string> = {
  en: 'rows',
  de: 'R',
  fr: 'rg',
  es: 'h',
  pt: 'c',
};

export function workspaceGaugeByline(locale: LanguageCode, gauge: { stitchesPer4In: number | null | undefined; rowsPer4In: number | null | undefined; unit?: string } | null | undefined): string {
  const code = locale ?? 'en';
  if (!gauge) return `${STS_UNIT.en} × ${ROWS_UNIT.en}`;
  const stitches = gauge.stitchesPer4In ?? '—';
  const rows = gauge.rowsPer4In ?? '—';
  const unitSuffix = gauge.unit === 'cm' ? 'cm' : 'in';
  return `${stitches}${STS_UNIT[code] ?? STS_UNIT.en} × ${rows}${ROWS_UNIT[code] ?? ROWS_UNIT.en} / 4${unitSuffix}`;
}

export function getWorkspaceTabLabel(lang: LanguageCode, value: string, defaultLabel: string): string {
  const labels: Record<string, Record<LanguageCode, string>> = {
    sections: { en: 'Sections', de: 'Abschnitte', fr: 'Sections', es: 'Secciones', pt: 'Secções' },
    grading: { en: 'Grading', de: 'Gradierung', fr: 'Gradation', es: 'Gradación', pt: 'Graduação' },
    yarn: { en: 'Yarn', de: 'Garn', fr: 'Fil', es: 'Hilo', pt: 'Fio' },
    fabric: { en: 'Fabric', de: 'Stoff', fr: 'Tissu', es: 'Tecido', pt: 'Tecido' },
    notes: { en: 'Notes', de: 'Notizen', fr: 'Notes', es: 'Notas', pt: 'Notas' },
    preview: { en: 'Preview', de: 'Vorschau', fr: 'Aperçu', es: 'Vista previa', pt: 'Pré-visualização' },
  };
  return labels[value]?.[lang] || defaultLabel;
}
