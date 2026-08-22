import type { LanguageCode } from './i18n';
export type { LanguageCode };

export interface WorkspaceCopy {
  draftIssueUnresolved: string;
  draftIssueMalformed: string;
  draftIssueMissingData: string;
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
  benchmarkLabel: string;
  viewMethodology: string;
  methodologyDeals: string;
  renameSave: string;
  renameCancel: string;
  renameSaved: string;
  renameFailed: string;
  renameEmpty: string;
  renameSame: string;
  addMeasurement: string;
  fieldRequired: string;
  allLabs: string;
  labsTitle: string;
  labsDescription: string;
  allLabsAriaLabel: string;
  sourceMethodology: string;
  methodologyTeach: string;
  methodologyKal: string;
  methodologySubmissions: string;
  methodologyTestknit: string;
  loadingLab: string;
  labLoadErrorTitle: string;
  labLoadErrorDesc: string;
  retry: string;
  healthReady: string;
  healthLoading: string;
  healthError: string;
  measurementPlaceholder: string;
  valuePlaceholder: string;
  sectionPlaceholder: string;
  notesPlaceholder: string;
  labsCount: (count: number) => string;
  snapshotsTitle: string;
  snapshotsDescription: string;
  createSnapshot: string;
  snapshotName: string;
  snapshotNote: string;
  snapshotPlaceholder: string;
  restoreSnapshot: string;
  deleteSnapshot: string;
  confirmRestoreSnapshot: (name: string) => string;
  confirmRestoreSnapshotBody: string;
  confirmDeleteSnapshot: (name: string) => string;
  confirmDeleteSnapshotBody: string;
  snapshotCreated: string;
  snapshotRestored: string;
  snapshotDeleted: string;
  noSnapshots: string;
  readinessTitle: string;
  readinessDescription: string;
  readinessAddIssue: string;
  readinessSignOff: string;
  readinessNoIssues: string;
  readinessStatusPending: string;
  readinessStatusBlocked: string;
  readinessStatusReady: string;
  readinessStageMathematical: string;
  readinessStageEditorial: string;
  readinessStageTestKnit: string;
  readinessStageFinal: string;
  readinessIssueSeverityNitpick: string;
  readinessIssueSeverityMinor: string;
  readinessIssueSeverityMajor: string;
  readinessIssueSeverityCritical: string;
  readinessContractUpdated: string;
  readinessApprovedBy: (name: string, date: string) => string;
  publicationPackageTitle: string;
  publicationPackageDescription: string;
  publicationCreatePackage: string;
  publicationPackageName: string;
  publicationPackageVersion: string;
  publicationPackageStatus: string;
  publicationPackageVerdict: string;
  publicationAuthoritativeMetadata: string;
  publicationArtifacts: string;
  publicationNoPackages: string;
  publicationPackageCreated: string;
  publicationPackageUpdated: string;
  publicationPackageDeleted: string;
  publicationStatusDraft: string;
  publicationStatusReview: string;
  publicationStatusPublished: string;
  publicationStatusArchived: string;
  publicationMetadataTitle: string;
  publicationMetadataAuthor: string;
  publicationMetadataCopyright: string;
  publicationMetadataDescription: string;
  publicationMetadataSizes: string;
  publicationMetadataGauge: string;
}

const COPY: Record<LanguageCode, WorkspaceCopy> = {
  en: {
    by: 'By',
    gauge: 'Gauge',
    projectNotFound: 'Project not found',
    returnDashboard: 'Return to dashboard',
    undo: 'Undo',
    noSections: 'No sections yet',
    emptySectionDesc: 'Divide your pattern into logical sections (e.g. Back, Front, Sleeves) to start adding measurements.',
    addFirstSection: 'Add First Section',
    keepIt: 'Keep it',
    confirmDeleteSectionNamed: (name) => `Delete section ${name}?`,
    confirmDeleteSectionBody: (count) => `This removes the section and all ${count} of its measurements. It cannot be undone — ensure no other items (PDF, test notes) still reference them.`,
    confirmDeleteSectionAction: 'Delete Section',
    confirmDeleteMeasurementNamed: (label) => `Delete "${label}"?`,
    confirmDeleteMeasurementBody: 'The measurement disappears immediately, but an Undo button appears in the notification for 8 seconds if it was a mistake.',
    confirmDeleteMeasurementAction: 'Delete Measurement',
    measurement: 'Measurement',
    type: 'Type',
    gradingBase: 'Grading base',
    actions: 'Actions',
    label: 'Label',
    typeLabel: 'Type',
    gradingKey: 'Grading key',
    circumferenceFull: 'Circunferência (total)',
    widthHalf: 'Largura (metade)',
    length: 'Comprimento',
    directNoGrading: 'Direct (no grading)',
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
    renameFailed: 'Could not save new name',
    renameEmpty: 'Name cannot be empty',
    renameSame: 'Nothing changed',
    addMeasurement: 'Add measurement',
    fieldRequired: 'This field is required',
    localOnlyTitle: 'Local project',
    localOnlyDescription: 'This project exists only in your browser storage. To access it on another device, export and import it there.',
    importProject: 'Import project',
    labelRequired: 'Label is required',
    valueRequired: 'Base value is required',
    invalidNumber: 'Invalid number',
    genericError: 'Something went wrong. Please check your inputs.',
    draftPreflight: 'Draft preflight',
    draftIssuesFound: 'Potential issues found in your draft tokens.',
    draftNoIssues: 'All tokens resolved correctly.',
    draftFixIssues: 'Please review the tokens in your draft before exporting.',
    draftIssueUnresolved: 'Unresolved',
    draftIssueMalformed: 'Malformed',
    draftIssueMissingData: 'Missing data',
    allLabs: 'All labs',
    labsTitle: 'The 79 labs',
    labsDescription: 'All tools in this pattern, grouped so nothing falls off-screen.',
    allLabsAriaLabel: 'Open grouped list of the 79 work labs',
    sourceMethodology: 'Source: Session-35 Research',
    methodologyTeach: 'Flagship course pricing based on Pip & Pin ($548), Kneedles & Life ($99–125), and market median analysis. Workshop rates from 2026 fiber retreat audit.',
    methodologyKal: 'Ravelry record data (Jan 2025); mystery KAL timing benchmarks from 43 tracked launches; average sweater production cost ($155) from independent designer survey.',
    methodologySubmissions: 'Magazine caps based on Laine/Pompom 2026 rates. Cost scaling assumes standard labor hours for a medium sweater at $25/hr.',
    methodologyTestknit: 'Paid test-knit band ($0.10–$0.40/yard) from Yarnpond median data. Ghosting failure mode frequency from 2025 Fit-to-Stitch report.',
    loadingLab: 'Loading lab...',
    labLoadErrorTitle: 'Lab failed to load',
    labLoadErrorDesc: 'An error occurred while rendering this lab. Your project data is safe.',
    retry: 'Retry',
    healthReady: 'Release ready',
    healthLoading: 'Verifying release…',
    healthError: 'Release mismatch',
    benchmarkLabel: 'Benchmarks baked in:',
    viewMethodology: 'View methodology',
    methodologyDeals: 'Market deal structures (flat fee vs royalty) based on 2026 designer audit of Stitchcraft Marketing and Who Pays Knitters reports. Lifetime sales estimates derive from median Ravelry performance data (2025).',
    measurementPlaceholder: 'e.g. Bust Circumference',
    valuePlaceholder: 'e.g. 96',
    sectionPlaceholder: 'e.g. Body, Sleeves, Neckline',
    notesPlaceholder: 'e.g. Worked flat, seamed at the side. Blocks generously — swatch and block before committing to a size.',
    labsCount: (count) => `${count} labs`,
    snapshotsTitle: 'Revision History',
    snapshotsDescription: 'Save named snapshots of your project to create an audit trail or restore previous versions.',
    createSnapshot: 'Create Snapshot',
    snapshotName: 'Snapshot Name',
    snapshotNote: 'Notes (optional)',
    snapshotPlaceholder: 'e.g. Pre-Test Knit, Post-Tech Edit',
    restoreSnapshot: 'Restore',
    deleteSnapshot: 'Delete',
    confirmRestoreSnapshot: (name) => `Restore "${name}"?`,
    confirmRestoreSnapshotBody: 'This will replace your current workspace data with this snapshot. Your current snapshots history will be preserved.',
    confirmDeleteSnapshot: (name) => `Delete snapshot "${name}"?`,
    confirmDeleteSnapshotBody: 'This snapshot will be permanently removed from your revision history. This cannot be undone.',
    snapshotCreated: 'Snapshot created',
    snapshotRestored: 'Snapshot restored',
    snapshotDeleted: 'Snapshot deleted',
    noSnapshots: 'No snapshots yet. Create one to start your audit trail.',
    readinessTitle: 'Publication Readiness',
    readinessDescription: 'Formal checklist and sign-off trail to ensure your pattern is production-ready.',
    readinessAddIssue: 'Report Finding',
    readinessSignOff: 'Sign Off Stage',
    readinessNoIssues: 'No issues reported for this stage.',
    readinessStatusPending: 'Pending Review',
    readinessStatusBlocked: 'Action Required',
    readinessStatusReady: 'Verified Ready',
    readinessStageMathematical: 'Mathematical Accuracy',
    readinessStageEditorial: 'Editorial & Style',
    readinessStageTestKnit: 'Test Knit Feedback',
    readinessStageFinal: 'Final Proofing',
    readinessIssueSeverityNitpick: 'Nitpick',
    readinessIssueSeverityMinor: 'Minor',
    readinessIssueSeverityMajor: 'Major',
    readinessIssueSeverityCritical: 'Critical',
    readinessContractUpdated: 'Readiness contract updated',
    readinessApprovedBy: (name, date) => `Approved by ${name} on ${date}`,
    publicationPackageTitle: 'Publication Packages',
    publicationPackageDescription: 'Versioned authoritative releases of your pattern with locked metadata and artifacts.',
    publicationCreatePackage: 'Create Package',
    publicationPackageName: 'Package Name',
    publicationPackageVersion: 'Version',
    publicationPackageStatus: 'Status',
    publicationPackageVerdict: 'Readiness Verdict',
    publicationAuthoritativeMetadata: 'Authoritative Metadata',
    publicationArtifacts: 'Artifacts',
    publicationNoPackages: 'No publication packages yet. Create one to freeze an authoritative version.',
    publicationPackageCreated: 'Publication package created',
    publicationPackageUpdated: 'Publication package updated',
    publicationPackageDeleted: 'Publication package deleted',
    publicationStatusDraft: 'Draft',
    publicationStatusReview: 'In Review',
    publicationStatusPublished: 'Published',
    publicationStatusArchived: 'Archived',
    publicationMetadataTitle: 'Title',
    publicationMetadataAuthor: 'Author',
    publicationMetadataCopyright: 'Copyright',
    publicationMetadataDescription: 'Description',
    publicationMetadataSizes: 'Sizes',
    publicationMetadataGauge: 'Gauge',
  },
  de: {
    by: 'Von',
    gauge: 'Maschenprobe',
    projectNotFound: 'Projekt nicht gefunden',
    returnDashboard: 'Zurück zum Dashboard',
    undo: 'Rückgängig',
    noSections: 'Noch keine Abschnitte',
    emptySectionDesc: 'Unterteile dein Muster in logische Abschnitte (Rücken, Vorderteil, Ärmel), um Maße hinzuzufügen.',
    addFirstSection: 'Ersten Abschnitt hinzufügen',
    keepIt: 'Behalten',
    confirmDeleteSectionNamed: (name) => `Abschnitt ${name} löschen?`,
    confirmDeleteSectionBody: (count) => `Dies entfernt den Abschnitt und alle seine ${count} Maße. Dies kann nicht rückgängig gemacht werden — stelle sicher, dass keine anderen Elemente (PDF, Testnotizen) mehr darauf verweisen.`,
    confirmDeleteSectionAction: 'Abschnitt löschen',
    confirmDeleteMeasurementNamed: (label) => `„${label}“ löschen?`,
    confirmDeleteMeasurementBody: 'Das Maß verschwindet sofort, aber in der Benachrichtigung erscheint für 8 Sekunden ein Rückgängig-Button, falls es ein Versehen war.',
    confirmDeleteMeasurementAction: 'Maß löschen',
    measurement: 'Maß',
    type: 'Typ',
    gradingBase: 'Gradierbasis',
    actions: 'Aktionen',
    label: 'Bezeichnung',
    typeLabel: 'Typ',
    gradingKey: 'Gradierschlüssel',
    circumferenceFull: 'Umfang (voll)',
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
    addMeasurement: 'Maß hinzufügen',
    fieldRequired: 'Dieses Feld ist erforderlich',
    localOnlyTitle: 'Lokales Projekt',
    localOnlyDescription: 'Dieses Projekt existiert nur im Speicher deines Browsers. Um auf einem anderen Gerät darauf zuzugreifen, exportiere es und importiere es dort.',
    importProject: 'Projekt importieren',
    labelRequired: 'Bezeichnung ist erforderlich',
    valueRequired: 'Basiswert ist erforderlich',
    invalidNumber: 'Ungültige Nummer',
    genericError: 'Etwas ist schiefgelaufen. Bitte überprüfe deine Eingaben.',
    draftPreflight: 'Entwurfs-Check',
    draftIssuesFound: 'Potenzielle Probleme in deinen Entwurfs-Token gefunden.',
    draftNoIssues: 'Alle Token korrekt aufgelöst.',
    draftFixIssues: 'Bitte überprüfe die Token in deinem Entwurf vor dem Export.',
    draftIssueUnresolved: 'Nicht aufgelöst',
    draftIssueMalformed: 'Fehlerhaft',
    draftIssueMissingData: 'Fehlende Daten',
    allLabs: 'Alle Labs',
    labsTitle: 'Die 79 Labs',
    labsDescription: 'Alle Werkzeuge in diesem Muster, gruppiert, damit nichts vom Bildschirm rutscht.',
    allLabsAriaLabel: 'Gruppierte Liste der 79 Arbeits-Labs öffnen',
    sourceMethodology: 'Quelle: Session-35 Forschung',
    methodologyTeach: 'Preise für Flaggschiff-Kurse basierend auf Pip & Pin (548 $), Kneedles & Life (99–125 $) und Marktmedian-Analyse. Workshop-Raten aus dem Fiber-Retreat-Audit 2026.',
    methodologyKal: 'Ravelry-Rekorddaten (Jan 2025); Mystery-KAL-Timing-Benchmarks von 43 verfolgten Launches; durchschnittliche Pullover-Produktionskosten (155 $) aus Umfrage unter unabhängigen Designern.',
    methodologySubmissions: 'Magazin-Obergrenzen basierend auf Laine/Pompom-Raten 2026. Kostenkalkulation geht von Standard-Arbeitsstunden für einen mittleren Pullover bei 25 $/Std. aus.',
    methodologyTestknit: 'Bezahlte Teststrick-Spanne (0,10–0,40 $/Yard) aus Yarnpond-Mediandaten. Häufigkeit des Ghosting-Fehlermodus aus dem Fit-to-Stitch-Bericht 2025.',
    loadingLab: 'Labor wird geladen...',
    labLoadErrorTitle: 'Labor konnte nicht geladen werden',
    labLoadErrorDesc: 'Beim Rendern dieses Labors ist ein Fehler aufgetreten. Deine Projektdaten sind sicher.',
    retry: 'Wiederholen',
    healthReady: 'Release bereit',
    healthLoading: 'Verifiziere Release…',
    healthError: 'Release-Fehler',
    benchmarkLabel: 'Benchmarks inklusive:',
    viewMethodology: 'Methodik ansehen',
    methodologyDeals: 'Marktübliche Deal-Strukturen (Pauschalhonorar vs. Lizenzgebühr) basierend auf dem Designer-Audit 2026 von Stitchcraft Marketing und Who Pays Knitters-Berichten. Geschätzte Lebenszeitverkäufe leiten sich aus Ravelry-Mediandaten (2025) ab.',
    measurementPlaceholder: 'z.B. Brustumfang',
    valuePlaceholder: 'z.B. 96',
    sectionPlaceholder: 'z.B. Körper, Ärmel, Ausschnitt',
    notesPlaceholder: 'z.B. Flach gestrickt, an der Seite zusammengefügt. Dehnt sich beim Waschen — Probe waschen und spannen.',
    labsCount: (count) => `${count} Labore`,
    snapshotsTitle: 'Versionsverlauf',
    snapshotsDescription: 'Speichere benannte Schnappschüsse deines Projekts, um einen Prüfpfad zu erstellen oder frühere Versionen wiederherzustellen.',
    createSnapshot: 'Schnappschuss erstellen',
    snapshotName: 'Name des Schnappschusses',
    snapshotNote: 'Notizen (optional)',
    snapshotPlaceholder: 'z.B. Vor dem Teststricken, Nach dem Tech-Edit',
    restoreSnapshot: 'Wiederherstellen',
    deleteSnapshot: 'Löschen',
    confirmRestoreSnapshot: (name) => `„${name}" wiederherstellen?`,
    confirmRestoreSnapshotBody: 'Dies ersetzt deine aktuellen Arbeitsbereichsdaten durch diesen Schnappschuss. Dein bisheriger Versionsverlauf bleibt erhalten.',
    confirmDeleteSnapshot: (name) => `Schnappschuss „${name}" löschen?`,
    confirmDeleteSnapshotBody: 'Dieser Schnappschuss wird dauerhaft aus deinem Versionsverlauf entfernt. Dies kann nicht rückgängig gemacht werden.',
    snapshotCreated: 'Schnappschuss erstellt',
    snapshotRestored: 'Schnappschuss wiederhergestellt',
    snapshotDeleted: 'Schnappschuss gelöscht',
    noSnapshots: 'Noch keine Schnappschüsse. Erstelle einen, um deinen Prüfpfad zu beginnen.',
    readinessTitle: 'Veröffentlichungsbereitschaft',
    readinessDescription: 'Formale Checkliste und Abnahmeprotokoll, um sicherzustellen, dass dein Muster produktionsreif ist.',
    readinessAddIssue: 'Befund melden',
    readinessSignOff: 'Phase freigeben',
    readinessNoIssues: 'Keine Probleme für diese Phase gemeldet.',
    readinessStatusPending: 'Ausstehende Prüfung',
    readinessStatusBlocked: 'Handlungsbedarf',
    readinessStatusReady: 'Verifiziert & Bereit',
    readinessStageMathematical: 'Mathematische Genauigkeit',
    readinessStageEditorial: 'Redaktion & Stil',
    readinessStageTestKnit: 'Teststrick-Feedback',
    readinessStageFinal: 'Schlussabnahme',
    readinessIssueSeverityNitpick: 'Kleigkeit',
    readinessIssueSeverityMinor: 'Geringfügig',
    readinessIssueSeverityMajor: 'Erheblich',
    readinessIssueSeverityCritical: 'Kritisch',
    readinessContractUpdated: 'Bereitschaftsvertrag aktualisiert',
    readinessApprovedBy: (name, date) => `Freigegeben von ${name} am ${date}`,
    publicationPackageTitle: 'Veröffentlichungspakete',
    publicationPackageDescription: 'Versionierte autoritative Versionen deines Musters mit gesperrten Metadaten und Artefakten.',
    publicationCreatePackage: 'Paket erstellen',
    publicationPackageName: 'Paketname',
    publicationPackageVersion: 'Version',
    publicationPackageStatus: 'Status',
    publicationPackageVerdict: 'Bereitschaftsurteil',
    publicationAuthoritativeMetadata: 'Autoritative Metadaten',
    publicationArtifacts: 'Artefakte',
    publicationNoPackages: 'Noch keine Veröffentlichungspakete. Erstelle eines, um eine verbindliche Version einzufrieren.',
    publicationPackageCreated: 'Veröffentlichungspaket erstellt',
    publicationPackageUpdated: 'Veröffentlichungspaket aktualisiert',
    publicationPackageDeleted: 'Veröffentlichungspaket gelöscht',
    publicationStatusDraft: 'Entwurf',
    publicationStatusReview: 'In Prüfung',
    publicationStatusPublished: 'Veröffentlicht',
    publicationStatusArchived: 'Archiviert',
    publicationMetadataTitle: 'Titel',
    publicationMetadataAuthor: 'Autor',
    publicationMetadataCopyright: 'Copyright',
    publicationMetadataDescription: 'Beschreibung',
    publicationMetadataSizes: 'Größen',
    publicationMetadataGauge: 'Maschenprobe',
  },
  fr: {
    by: 'Par',
    gauge: 'Échantillon',
    projectNotFound: 'Projet introuvable',
    returnDashboard: 'Retour au tableau de bord',
    undo: 'Annuler',
    noSections: 'Pas encore de sections',
    emptySectionDesc: 'Divisez votre patron en sections logiques (dos, devant, manches) pour commencer à ajouter des mesures.',
    addFirstSection: 'Ajouter la première section',
    keepIt: 'Garder',
    confirmDeleteSectionNamed: (name) => `Supprimer la section ${name} ?`,
    confirmDeleteSectionBody: (count) => `Ceci supprime la section et ses ${count} mesures. Cette action est irréversible — assurez-vous qu'aucun autre élément (PDF, notes de test) n'y fait référence.`,
    confirmDeleteSectionAction: 'Supprimer la section',
    confirmDeleteMeasurementNamed: (label) => `Supprimer « ${label} » ?`,
    confirmDeleteMeasurementBody: 'La mesure disparaît immédiatement, mais un bouton Annuler apparaît dans la notification pendant 8 secondes en cas d\'erreur.',
    confirmDeleteMeasurementAction: 'Supprimer la mesure',
    measurement: 'Mesure',
    type: 'Type',
    gradingBase: 'Base de gradation',
    actions: 'Actions',
    label: 'Libellé',
    typeLabel: 'Type',
    gradingKey: 'Clé de gradation',
    circumferenceFull: 'Circonférence (totale)',
    widthHalf: 'Largeur (demie)',
    length: 'Longueur',
    directNoGrading: 'Direct (pas de gradation)',
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
    renameSame: 'Aucun changement',
    addMeasurement: 'Ajouter une mesure',
    fieldRequired: 'Ce champ est obligatoire',
    localOnlyTitle: 'Projet local',
    localOnlyDescription: 'Ce projet n\'existe que dans le stockage de votre navigateur. Pour y accéder sur un autre appareil, exportez-le et importez-le là-bas.',
    importProject: 'Importer le projet',
    labelRequired: 'Le libellé est obligatoire',
    valueRequired: 'La valeur de base est obligatoire',
    invalidNumber: 'Nombre invalide',
    genericError: 'Une erreur est survenue. Veuillez vérifier vos saisies.',
    draftPreflight: 'Vérification du brouillon',
    draftIssuesFound: 'Problèmes potentiels trouvés dans les tokens de votre brouillon.',
    draftNoIssues: 'Tous les tokens sont résolus correctement.',
    draftFixIssues: 'Veuillez revoir les tokens de votre brouillon avant d\'exporter.',
    draftIssueUnresolved: 'Non résolu',
    draftIssueMalformed: 'Mal formé',
    draftIssueMissingData: 'Données manquantes',
    allLabs: 'Tous les labs',
    labsTitle: 'Les 79 labs',
    labsDescription: 'Tous les outils de ce patron, groupés pour que rien ne sorte de l\'écran.',
    allLabsAriaLabel: 'Ouvrir la liste groupée des 79 labos de travail',
    sourceMethodology: 'Source : Recherche Session-35',
    methodologyTeach: 'Tarification des cours phares basée sur Pip & Pin (548 $), Kneedles & Life (99–125 $) et l\'analyse de la médiane du marché. Tarifs des ateliers issus de l\'audit des retraites fibre 2026.',
    methodologyKal: 'Données records Ravelry (janv. 2025) ; repères de timing KAL mystère issus de 43 lancements suivis ; coût moyen de production d\'un pull (155 $) selon une enquête auprès de designers indépendants.',
    methodologySubmissions: 'Plafonds des magazines basés sur les tarifs Laine/Pompom 2026. La structure des coûts asume des heures de travail standard pour un pull de taille moyenne à 25 $/h.',
    methodologyTestknit: 'Fourchette de tricot de test payé (0,10 $–0,40 $/yard) selon les données médianes de Yarnpond. Fréquence du mode d\'échec par abandon du rapport Fit-to-Stitch 2025.',
    loadingLab: 'Chargement du labo...',
    labLoadErrorTitle: 'Échec du chargement du labo',
    labLoadErrorDesc: 'Une erreur s\'est produite lors de l\'affichage de ce labo. Vos données de projet sont en sécurité.',
    retry: 'Réessayer',
    healthReady: 'Version prête',
    healthLoading: 'Vérification de la version…',
    healthError: 'Erreur de version',
    benchmarkLabel: 'Benchmarks intégrés :',
    viewMethodology: 'Voir la méthodologie',
    methodologyDeals: 'Structures de contrats du marché (forfait vs redevance) basées sur l\'audit des designers 2026 des rapports Stitchcraft Marketing et Who Pays Knitters. Les estimations de ventes à vie proviennent des données médianes de performance Ravelry (2025).',
    measurementPlaceholder: 'ex. Tour de poitrine',
    valuePlaceholder: 'ex. 96',
    sectionPlaceholder: 'ex. Corps, Manches, Encolure',
    notesPlaceholder: 'ex. Tricoté à plat, assemblé sur le côté. Se détend au blocage — lavez et bloquez votre échantillon.',
    labsCount: (count) => `${count} labos`,
    snapshotsTitle: 'Historique des révisions',
    snapshotsDescription: 'Enregistrez des instantanés nommés de votre projet pour créer une piste d\'audit ou restaurer des versions précédentes.',
    createSnapshot: 'Créer un instantané',
    snapshotName: 'Nom de l\'instantané',
    snapshotNote: 'Notes (optionnel)',
    snapshotPlaceholder: 'ex: Avant test, Après édition technique',
    restoreSnapshot: 'Restaurer',
    deleteSnapshot: 'Supprimer',
    confirmRestoreSnapshot: (name) => `Restaurer « ${name} » ?`,
    confirmRestoreSnapshotBody: 'Cela remplacera vos données de travail actuelles par cet instantané. Votre historique d\'instantanés actuel sera préservé.',
    confirmDeleteSnapshot: (name) => `Supprimer l'instantané « ${name} » ?`,
    confirmDeleteSnapshotBody: 'Cet instantané sera définitivement supprimé de votre historique de révision. Cette action est irréversible.',
    snapshotCreated: 'Instantané créé',
    snapshotRestored: 'Instantané restauré',
    snapshotDeleted: 'Instantané supprimé',
    noSnapshots: 'Aucun instantané pour le moment. Créez-en un pour commencer votre piste d\'audit.',
    readinessTitle: 'Prêt pour la publication',
    readinessDescription: 'Liste de contrôle formelle et suivi de validation pour garantir que votre patron est prêt pour la production.',
    readinessAddIssue: 'Signaler un problème',
    readinessSignOff: 'Valider l\'étape',
    readinessNoIssues: 'Aucun problème signalé pour cette étape.',
    readinessStatusPending: 'En attente de révision',
    readinessStatusBlocked: 'Action requise',
    readinessStatusReady: 'Vérifié et prêt',
    readinessStageMathematical: 'Précision mathématique',
    readinessStageEditorial: 'Éditorial et style',
    readinessStageTestKnit: 'Retours du test tricot',
    readinessStageFinal: 'Validation finale',
    readinessIssueSeverityNitpick: 'Détail',
    readinessIssueSeverityMinor: 'Mineur',
    readinessIssueSeverityMajor: 'Majeur',
    readinessIssueSeverityCritical: 'Critique',
    readinessContractUpdated: 'Contrat de disponibilité mis à jour',
    readinessApprovedBy: (name, date) => `Approuvé par ${name} le ${date}`,
    publicationPackageTitle: 'Packages de publication',
    publicationPackageDescription: 'Versions officielles de votre patron avec métadonnées et artefacts verrouillés.',
    publicationCreatePackage: 'Créer un package',
    publicationPackageName: 'Nom du package',
    publicationPackageVersion: 'Version',
    publicationPackageStatus: 'Statut',
    publicationPackageVerdict: 'Verdict de préparation',
    publicationAuthoritativeMetadata: 'Métadonnées officielles',
    publicationArtifacts: 'Artefacts',
    publicationNoPackages: 'Aucun package de publication pour le moment. Créez-en un pour figer une version officielle.',
    publicationPackageCreated: 'Package de publication créé',
    publicationPackageUpdated: 'Package de publication mis à jour',
    publicationPackageDeleted: 'Package de publication supprimé',
    publicationStatusDraft: 'Brouillon',
    publicationStatusReview: 'En révision',
    publicationStatusPublished: 'Publié',
    publicationStatusArchived: 'Archivé',
    publicationMetadataTitle: 'Titre',
    publicationMetadataAuthor: 'Auteur',
    publicationMetadataCopyright: 'Droit d\'auteur',
    publicationMetadataDescription: 'Description',
    publicationMetadataSizes: 'Tailles',
    publicationMetadataGauge: 'Échantillon',
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
    keepIt: 'Mantener',
    confirmDeleteSectionNamed: (name) => `¿Eliminar sección ${name}?`,
    confirmDeleteSectionBody: (count) => `Esto elimina la sección y sus ${count} medidas. No se puede deshacer — asegúrate de que ningún otro elemento (PDF, notas de prueba) haga referencia a ellas.`,
    confirmDeleteSectionAction: 'Eliminar sección',
    confirmDeleteMeasurementNamed: (label) => `¿Eliminar «${label}»?`,
    confirmDeleteMeasurementBody: 'La medida desaparece inmediatamente, pero aparecerá un botón Deshacer en la notificación durante 8 segundos por si fue un error.',
    confirmDeleteMeasurementAction: 'Eliminar medida',
    measurement: 'Medida',
    type: 'Type',
    gradingBase: 'Base de graduación',
    actions: 'Acciones',
    label: 'Etiqueta',
    typeLabel: 'Tipo',
    gradingKey: 'Clave de graduación',
    circumferenceFull: 'Circunferencia (total)',
    widthHalf: 'Anchura (mitad)',
    length: 'Largo',
    directNoGrading: 'Directo (sin graduación)',
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
    renameSame: 'Nada ha cambiado',
    addMeasurement: 'Añadir medida',
    fieldRequired: 'Este campo es obligatorio',
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
    draftIssueMalformed: 'Mal formado',
    draftIssueMissingData: 'Faltan datos',
    allLabs: 'Todos los labs',
    labsTitle: 'Los 79 labs',
    labsDescription: 'Todas las herramientas de este patrón, agrupadas para que nada quede fuera de pantalla.',
    allLabsAriaLabel: 'Abrir la lista agrupada de los 79 laboratorios del espacio de trabajo',
    sourceMethodology: 'Fuente: Investigación Sesión-35',
    methodologyTeach: 'Precios de cursos insignia basados en Pip & Pin (548 $), Kneedles & Life (99–125 $) y análisis de la mediana del mercado. Tarifas de talleres del auditoría de retiros de fibra 2026.',
    methodologyKal: 'Datos récord de Ravelry (ene 2025); benchmarks de tiempo de KAL misteriosos de 43 lanzamientos seguidos; promedio de costo de producción de suéteres (155 $) de encuesta a diseñadores independientes.',
    methodologySubmissions: 'Topes de revistas basados en tarifas Laine/Pompom 2026. El desglose de costos asume horas de trabajo estándar para un suéter talla mediana a 25 $/h.',
    methodologyTestknit: 'Banda de tejido de prueba pagada (0,10 $–0,40 $/yarda) de datos medianos de Yarnpond. Frecuencia del modo de fallo por abandono del informe Fit-to-Stitch 2025.',
    loadingLab: 'Cargando lab...',
    labLoadErrorTitle: 'Error al cargar el lab',
    labLoadErrorDesc: 'Ocurrió un error al renderizar este lab. Los datos de su proyecto están seguros.',
    retry: 'Reintentar',
    healthReady: 'Versión lista',
    healthLoading: 'Verificando versión…',
    healthError: 'Error de versión',
    benchmarkLabel: 'Benchmarks incluidos:',
    viewMethodology: 'Ver metodología',
    methodologyDeals: 'Estructuras de acuerdos de mercado (tarifa fija vs regalía) basadas en la auditoría de diseñadores 2026 de los informes de Stitchcraft Marketing y Who Pays Knitters. Las estimaciones de ventas de por vida derivan de los datos de rendimiento medianos de Ravelry (2025).',
    measurementPlaceholder: 'p. ej. Contorno de pecho',
    valuePlaceholder: 'p. ej. 96',
    sectionPlaceholder: 'p. ej. Cuerpo, Mangas, Escote',
    notesPlaceholder: 'p. ej. Tejido en plano, cosido en el lateral. Estira al bloquear: lava y bloquea tu muestra.',
    labsCount: (count) => `${count} laboratorios`,
    snapshotsTitle: 'Historial de revisiones',
    snapshotsDescription: 'Guarda instantáneas con nombre de tu proyecto para crear un registro de auditoría o restaurar versiones anteriores.',
    createSnapshot: 'Crear instantánea',
    snapshotName: 'Nombre de la instantánea',
    snapshotNote: 'Notas (opcional)',
    snapshotPlaceholder: 'p. ej., Antes del test, Después de la edición técnica',
    restoreSnapshot: 'Restaurar',
    deleteSnapshot: 'Eliminar',
    confirmRestoreSnapshot: (name) => `¿Restaurar "${name}"?`,
    confirmRestoreSnapshotBody: 'Esto reemplazará los datos actuales de tu espacio de trabajo con esta instantánea. Se conservará el historial de instantáneas actual.',
    confirmDeleteSnapshot: (name) => `¿Eliminar instantánea "${name}"?`,
    confirmDeleteSnapshotBody: 'Esta instantánea se eliminará permanentemente de tu historial de revisiones. Esta acción no se puede deshacer.',
    snapshotCreated: 'Instantánea creada',
    snapshotRestored: 'Instantánea restaurada',
    snapshotDeleted: 'Instantánea eliminada',
    noSnapshots: 'Aún no hay instantáneas. Crea una para comenzar tu registro de auditoría.',
    readinessTitle: 'Preparación para la publicación',
    readinessDescription: 'Lista de verificación formal y seguimiento de aprobación para asegurar que su patrón esté listo para la producción.',
    readinessAddIssue: 'Informar hallazgo',
    readinessSignOff: 'Aprobar etapa',
    readinessNoIssues: 'No se han informado problemas para esta etapa.',
    readinessStatusPending: 'Revisión pendiente',
    readinessStatusBlocked: 'Acción requerida',
    readinessStatusReady: 'Verificado y listo',
    readinessStageMathematical: 'Precisión matemática',
    readinessStageEditorial: 'Editorial y estilo',
    readinessStageTestKnit: 'Comentarios de la prueba de tejido',
    readinessStageFinal: 'Aprobación final',
    readinessIssueSeverityNitpick: 'Detalle',
    readinessIssueSeverityMinor: 'Menor',
    readinessIssueSeverityMajor: 'Mayor',
    readinessIssueSeverityCritical: 'Crítico',
    readinessContractUpdated: 'Contrato de disponibilidad actualizado',
    readinessApprovedBy: (name, date) => `Aprobado por ${name} el ${date}`,
    publicationPackageTitle: 'Paquetes de publicación',
    publicationPackageDescription: 'Versiones autorizadas de su patrón con metadatos y artefactos bloqueados.',
    publicationCreatePackage: 'Crear paquete',
    publicationPackageName: 'Nombre del paquete',
    publicationPackageVersion: 'Versión',
    publicationPackageStatus: 'Estado',
    publicationPackageVerdict: 'Veredicto de preparación',
    publicationAuthoritativeMetadata: 'Metadatos autorizados',
    publicationArtifacts: 'Artefactos',
    publicationNoPackages: 'Aún no hay paquetes de publicación. Cree uno para congelar una versión autorizada.',
    publicationPackageCreated: 'Paquete de publicación creado',
    publicationPackageUpdated: 'Paquete de publicación actualizado',
    publicationPackageDeleted: 'Paquete de publicación eliminado',
    publicationStatusDraft: 'Borrador',
    publicationStatusReview: 'En revisión',
    publicationStatusPublished: 'Publicado',
    publicationStatusArchived: 'Archivado',
    publicationMetadataTitle: 'Título',
    publicationMetadataAuthor: 'Autor',
    publicationMetadataCopyright: 'Derechos de autor',
    publicationMetadataDescription: 'Descripción',
    publicationMetadataSizes: 'Tallas',
    publicationMetadataGauge: 'Tensión',
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
    renameSame: 'Nada mudou',
    addMeasurement: 'Adicionar medida',
    fieldRequired: 'Este campo é obrigatório',
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
    draftIssueMalformed: 'Malformado',
    draftIssueMissingData: 'Dados ausentes',
    allLabs: 'Todos os labs',
    labsTitle: 'Os 79 labs',
    labsDescription: 'Todas as ferramentas deste padrão, agrupadas para que nada fique fora do ecrã.',
    allLabsAriaLabel: 'Abrir a lista agrupada dos 79 laboratórios do trabalho',
    sourceMethodology: 'Fonte: Investigação Sessão-35',
    methodologyTeach: 'Preços de cursos emblemáticos baseados em Pip & Pin (548 $), Kneedles & Life (99–125 $) e análise da mediana do mercado. Tarifas de workshops da auditoria de retiros de fibra 2026.',
    methodologyKal: 'Dados recorde da Ravelry (jan 2025); benchmarks de tempo de KAL mistério de 43 lançamentos acompanhados; média do custo de produção de camisolas (155 $) de inquérito a designers independentes.',
    methodologySubmissions: 'Tetos de revistas baseados nas tarifas Laine/Pompom 2026. O escalonamento de custos assume horas de trabalho padrão para uma camisola de tamanho médio a 25 $/h.',
    methodologyTestknit: 'Intervalo de tricot de teste pago (0,10 $–0,40 $/jarda) de dados medianos da Yarnpond. Frequência do modo de falha por abandono do relatório Fit-to-Stitch 2025.',
    loadingLab: 'A carregar o laboratório...',
    labLoadErrorTitle: 'Falha ao carregar o laboratório',
    labLoadErrorDesc: 'Ocorreu um erro ao processar este laboratório. Os dados do seu projeto estão seguros.',
    retry: 'Tentar novamente',
    healthReady: 'Versão pronta',
    healthLoading: 'Verificando versão…',
    healthError: 'Erro de versão',
    benchmarkLabel: 'Benchmarks incluídos:',
    viewMethodology: 'Ver metodologia',
    methodologyDeals: 'Estruturas de acordos de mercado (taxa fixa vs royalties) baseadas na auditoria de designers 2026 dos relatórios Stitchcraft Marketing e Who Pays Knitters. As estimativas de vendas vitalícias derivam dos dados medianos de desempenho do Ravelry (2025).',
    measurementPlaceholder: 'ex. Perímetro do peito',
    valuePlaceholder: 'ex. 96',
    sectionPlaceholder: 'ex. Corpo, Mangas, Decote',
    notesPlaceholder: 'ex. Trabalhado em plano, costurado na lateral. Estica ao bloquear — lave e bloqueie a sua amostra.',
    labsCount: (count) => `${count} laboratórios`,
    snapshotsTitle: 'Histórico de Revisões',
    snapshotsDescription: 'Salve instantâneos nomeados do seu projeto para criar uma trilha de auditoria ou restaurar versões anteriores.',
    createSnapshot: 'Criar Instantâneo',
    snapshotName: 'Nome do Instantâneo',
    snapshotNote: 'Notas (opcional)',
    snapshotPlaceholder: 'ex: Antes do teste, Após edição técnica',
    restoreSnapshot: 'Restaurar',
    deleteSnapshot: 'Eliminar',
    confirmRestoreSnapshot: (name) => `Restaurar "${name}"?`,
    confirmRestoreSnapshotBody: 'Isto substituirá os dados atuais do seu espaço de trabalho por este instantâneo. O seu histórico de instantâneos atual será preservado.',
    confirmDeleteSnapshot: (name) => `Eliminar instantâneo "${name}"?`,
    confirmDeleteSnapshotBody: 'Este instantâneo será removido permanentemente do seu histórico de revisões. Esta ação não pode ser desfeita.',
    snapshotCreated: 'Instantâneo criado',
    snapshotRestored: 'Instantâneo restaurado',
    snapshotDeleted: 'Instantâneo eliminado',
    noSnapshots: 'Ainda não existem instantâneos. Crie um para começar a sua trilha de auditoria.',
    readinessTitle: 'Prontidão para Publicação',
    readinessDescription: 'Lista de verificação formal e trilha de aprovação para garantir que seu padrão esteja pronto para produção.',
    readinessAddIssue: 'Relatar Descoberta',
    readinessSignOff: 'Aprovar Etapa',
    readinessNoIssues: 'Nenhum problema relatado para esta etapa.',
    readinessStatusPending: 'Revisão Pendente',
    readinessStatusBlocked: 'Ação Necessária',
    readinessStatusReady: 'Verificado e Pronto',
    readinessStageMathematical: 'Precisão Matemática',
    readinessStageEditorial: 'Editorial e Estilo',
    readinessStageTestKnit: 'Feedback do Teste de Tricô',
    readinessStageFinal: 'Aprovação Final',
    readinessIssueSeverityNitpick: 'Detalhe',
    readinessIssueSeverityMinor: 'Menor',
    readinessIssueSeverityMajor: 'Maior',
    readinessIssueSeverityCritical: 'Crítico',
    readinessContractUpdated: 'Contrato de prontidão atualizado',
    readinessApprovedBy: (name, date) => `Aprovado por ${name} em ${date}`,
    publicationPackageTitle: 'Pacotes de Publicação',
    publicationPackageDescription: 'Versões autoritativas do seu padrão com metadados e artefactos bloqueados.',
    publicationCreatePackage: 'Criar Pacote',
    publicationPackageName: 'Nome do Pacote',
    publicationPackageVersion: 'Versão',
    publicationPackageStatus: 'Status',
    publicationPackageVerdict: 'Veredicto de Prontidão',
    publicationAuthoritativeMetadata: 'Metadados Autoritativos',
    publicationArtifacts: 'Artefactos',
    publicationNoPackages: 'Ainda não existem pacotes de publicação. Crie um para congelar uma versão autoritativa.',
    publicationPackageCreated: 'Pacote de publicação criado',
    publicationPackageUpdated: 'Pacote de publicação atualizado',
    publicationPackageDeleted: 'Pacote de publicação eliminado',
    publicationStatusDraft: 'Rascunho',
    publicationStatusReview: 'Em Revisão',
    publicationStatusPublished: 'Publicado',
    publicationStatusArchived: 'Arquivado',
    publicationMetadataTitle: 'Título',
    publicationMetadataAuthor: 'Autor',
    publicationMetadataCopyright: 'Copyright',
    publicationMetadataDescription: 'Descrição',
    publicationMetadataSizes: 'Tamanhos',
    publicationMetadataGauge: 'Amostra',
  },
};

export const WORKSPACE_COPY = COPY;

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

export function workspaceGaugeByline(locale: string, gauge: { stitchesPer4In: number | null | undefined; rowsPer4In: number | null | undefined; unit?: string } | null | undefined): string {
  const code = (locale || 'en').toLowerCase().split('-')[0] as LanguageCode;
  const sts = STS_UNIT[code] ?? STS_UNIT.en;
  const rows = ROWS_UNIT[code] ?? ROWS_UNIT.en;
  const unit = gauge?.unit === 'cm' ? '4cm' : '4in';
  if (!gauge) return code === 'en' ? 'sts × rows' : 'M × R';
  if (!gauge.stitchesPer4In || !gauge.rowsPer4In) return `—${sts} × —${rows} / ${unit}`;
  return `${gauge.stitchesPer4In}${sts} × ${gauge.rowsPer4In}${rows} / ${unit}`;
}

export const useWorkspaceCopy = (lang: LanguageCode) => COPY[lang];
