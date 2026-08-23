import type { LanguageCode } from '@/lib/i18n';

/**
 * CHK-142: Locale-aware copy for toast/snackbar messages (title + description).
 *
 * Scope note: toasts already served by per-card local copy objects
 * (`copy` / `copyText` — e.g. `copy.copied`, `copyText.copyFailed`) are
 * localized through those objects and are NOT duplicated here. This module
 * covers the literal English toast strings in the pages and cards that had
 * no localized copy object (the QUEUE-002 part 2 defect class).
 */
export interface ToastCopy {
  copied: string;
  copiedDescription: string;
  copyFailed: string;
  copyFailedDescription: string;
  selectManually: string;
  selectManuallyFromBox: string;
  notesSaved: string;
  sectionDeletedTitle: string;
  sectionDeletedDescription: string;
  unknownError: string;
  fileCouldNotBeRead: string;
  importFailed: string;
  importFailedDescription: string;
  backupExportRequested: string;
  onboardingRestarted: string;
  onboardingRestartedDescription: string;
  resetToCycValues: string;
  resetToCycValuesDescription: string;
  credibilityStatementCopied: string;
  credibilityStatementPaste: string;
  listingCopied: string;
  listingCopiedPaste: string;
  publishNotesSaved: string;
  publishNotesSavedDescription: string;
  tableCopied: string;
  tableCopiedDescription: string;
  showTierNoted: string;
  preEditSummaryCopied: string;
  preEditSummaryPaste: string;
  testerCallCopied: string;
  testerCallPaste: string;
  rosterRebuilt: string;
  wholesaleCopied: string;
  wholesaleSelectManually: string;
  importSuccess: string;
  /** `Merged with your workspace; ${kept} existing project(s) preserved untouched. (${imported} imported).` */
  importMergedDescription: (imported: number, kept: number) => string;
  /** `${n} project(s) restored` title. */
  importSuccessTitle: (n: number) => string;
  backupExportRequestedDescription: (n: number) => string;
  /** `"${label}" restored` + description. */
  measurementRestored: (label: string) => { title: string; description: string };
  /** `"${label}" deleted` + Undo description. */
  measurementDeleted: (label: string) => { title: string; description: string };
  /** `"${label}" updated/added` + description. */
  measurementUpdatedAdded: (label: string, isUpdating: boolean) => { title: string; description: string };

  /** `${unit} required (max N).` — unit is the localized yarn noun. */
  yarnPoolRequired: (value: number, unit: string, max: number) => string;
  /** `${sizes} sizes × ${slots} slot(s).` description. */
  rosterRebuiltDescription: (sizes: number, slots: number) => string;
  /** `${yarnName} — verify the yardage against your ball band.` */
  yarnLoadedTitle: (name: string) => string;
  /** `${tierLabel} — defaults are starting points…` */
  showTierNotedDescription: (tierLabel: string) => string;
  /** `"${name} (Copy)" was added to your patterns.` */
  projectDuplicateDescription: (name: string) => string;
  /** `${name}.json` export requested; the browser controls whether it is saved. */
  projectExportRequestedDescription: (name: string) => string;
  /** `"${name}" was removed.` */
  projectDeletedDescription: (name: string) => string;
  /** `"${name}" was added to your patterns.` */
  projectImportedDescription: (name: string) => string;
  /** `"Copied" — course copy */
  courseCopied: string;
  /** `Paste it into your course page or pitch email.` */
  courseCopiedPaste: string;
  /** `Stores reconciled` */
  storesReconciled: string;
  /** `Reconcile complete — re-export recommended` */
  reconcileComplete: string;
  /** `Both storage locations now hold identical copies of every project.` */
  reconciledDescription: string;
  /** `Your projects were unified. A fresh backup guarantees both stores match your latest work.` */
  unifiedDescription: string;
  /** `Reconcile failed` */
  reconcileFailed: string;
  /** `Something went wrong while unifying storage.` */
  reconcileFailedDescription: string;
  /** small `updated` verb used as `${label} updated` */
  updated: string;
  /** `Copy failed — select the text manually.` */
  copyFailedSelectManually: string;
  /** CHK-159: Copy quarantine toast. */
  incompleteQuarantine: string;
  /** CHK-144 (audit 2026-08-21, F-01): toast title when a base value cannot be saved. `${label} could not be saved: ${raw} is not a valid positive number. A physical dimension cannot be zero or negative.` */
  invalidMeasurementValue: (label: string, raw: string) => string;
  artifactCreated: (label: string) => string;
  /** The browser print surface was prepared; this does not mean a file was saved. */
  artifactPrepared: (label: string) => string;
  exportFailed: string;
}

export const COPY: Record<LanguageCode, ToastCopy> = {
  en: {
    copied: 'Copied',
    copiedDescription: 'Paste it wherever the campaign runs.',
    copyFailed: 'Copy failed',
    copyFailedDescription: 'Select the text manually.',
    selectManually: 'Select the text manually.',
    selectManuallyFromBox: 'Select the text manually from the box below.',
    notesSaved: 'Notes saved',
    sectionDeletedTitle: 'Section deleted',
    sectionDeletedDescription: 'If that was a misclick, it is saved in your last export.',
    unknownError: 'Unknown error.',
    fileCouldNotBeRead: 'The file could not be read.',
    importFailed: 'Import failed',
    importFailedDescription: 'The file could not be parsed correctly.',
    backupExportRequested: 'Backup export requested',
    onboardingRestarted: 'Onboarding restarted',
    onboardingRestartedDescription: 'The setup guide will appear on your next visit to the dashboard.',
    resetToCycValues: 'Reset to CYC values',
    resetToCycValuesDescription: 'Your custom chart now matches CYC again.',
    credibilityStatementCopied: 'Credibility statement copied',
    credibilityStatementPaste: 'Paste it into any marketplace listing.',
    listingCopied: 'Listing copied',
    listingCopiedPaste: 'Paste it straight into your marketplace draft.',
    publishNotesSaved: 'Notes saved',
    publishNotesSavedDescription: 'The listing pulls from these, so they are already included.',
    tableCopied: 'Table Copied',
    tableCopiedDescription: 'Grading table copied to clipboard.',
    showTierNoted: 'Show tier noted',
    preEditSummaryCopied: 'Pre-edit summary copied',
    preEditSummaryPaste: 'Paste it into your tech editor brief or your own to-do list.',
    testerCallCopied: 'Tester call copied',
    testerCallPaste: 'Paste it into the Ravelry Testing Pool, Yarnpond, or your newsletter.',
    rosterRebuilt: 'Roster rebuilt',
    wholesaleCopied: 'Copied to clipboard',
    wholesaleSelectManually: 'Select and copy manually',
    importSuccess: 'Import successful',
    importSuccessTitle: (n: number) => `Import successful — ${n} project${n === 1 ? '' : 's'} restored`,
    importMergedDescription: (imported: number, kept: number) => `Merged with your workspace; ${kept} existing project${kept === 1 ? '' : 's'} preserved untouched. (${imported} imported)`,
    backupExportRequestedDescription: (n: number) => `Your browser was asked to save ${n} project${n === 1 ? '' : 's'}; check your downloads if needed.`,
    measurementRestored: (label: string) => ({ title: `"${label}" restored`, description: 'Back in the section, nothing else changed.' }),
    measurementDeleted: (label: string) => ({ title: `"${label}" deleted`, description: 'One click is never final: hit Undo within 8s to get it back.' }),
    measurementUpdatedAdded: (label: string, isUpdating: boolean) => ({
      title: isUpdating ? `"${label}" updated` : `"${label}" added`,
      description: isUpdating ? 'Saved with its original id intact - nothing downstream breaks.' : 'Add another, or hit Close when done.',
    }),
    rosterRebuiltDescription: (sizes, slots) => `${sizes} sizes × ${slots} slot${slots > 1 ? 's' : ''}.`,
    yarnLoadedTitle: (name) => `Loaded ${name} — verify the yardage against your ball band.`,
    yarnPoolRequired: (value: number, unit: string, max: number) => `${value} ${unit} required (max ${max}).`,
    showTierNotedDescription: (tierLabel: string) => `${tierLabel} — defaults are starting points, tune attendance and fees to the actual event.`,
    projectDuplicateDescription: (name: string) => `"${name} (Copy)" was added to your patterns.`,
    projectExportRequestedDescription: (name: string) => `${name}.json export requested; check your browser downloads if needed.`,
    projectDeletedDescription: (name: string) => `"${name}" was removed.`,
    projectImportedDescription: (name: string) => `"${name}" was added to your patterns.`,
    courseCopied: 'Copied',

    courseCopiedPaste: 'Paste it into your course page or pitch email.',

    storesReconciled: 'Stores reconciled',

    reconcileComplete: 'Reconcile complete — re-export recommended',

    reconciledDescription: 'Both storage locations now hold identical copies of every project.',

    unifiedDescription: 'Your projects were unified. A fresh backup guarantees both stores match your latest work.',

    reconcileFailed: 'Reconcile failed',

    reconcileFailedDescription: 'Something went wrong while unifying storage.',

    updated: 'updated',
    copyFailedSelectManually: 'Copy failed — select the text manually.',
    incompleteQuarantine: 'Complete the details to copy',
        invalidMeasurementValue: (label, raw) => `Measurement “${label}” could not be saved: ${raw} is not a valid positive number. A physical dimension cannot be zero or negative.`,
    artifactCreated: (label) => `Artifact "${label}" was recorded in the publication package.`,
    artifactPrepared: (label) => `Print handoff for "${label}" was prepared in your browser. The package record contains metadata only; your browser controls whether a file is saved.`,
    exportFailed: 'Export failed. Please check the preflight status.',
  },
  de: {
    copied: 'Kopiert',
    copiedDescription: 'Füge es dort ein, wo die Kampagne läuft.',
    copyFailed: 'Kopieren fehlgeschlagen',
    copyFailedDescription: 'Wähle den Text manuell aus.',
    selectManually: 'Wähle den Text manuell aus.',
    selectManuallyFromBox: 'Wähle den Text manuell im Feld unten aus.',
    notesSaved: 'Notizen gespeichert',
    sectionDeletedTitle: 'Abschnitt gelöscht',
    sectionDeletedDescription: 'Falls es ein Versehen war: Er ist noch in deinem letzten Export gesichert.',
    unknownError: 'Unbekannter Fehler.',
    fileCouldNotBeRead: 'Die Datei konnte nicht gelesen werden.',
    importFailed: 'Import fehlgeschlagen',
    importFailedDescription: 'Die Datei konnte nicht korrekt eingelesen werden.',
    backupExportRequested: 'Backup-Export angefordert',
    onboardingRestarted: 'Onboarding neu gestartet',
    onboardingRestartedDescription: 'Die Einrichtungsanleitung erscheint beim nächsten Besuch des Dashboards.',
    resetToCycValues: 'Auf CYC-Werte zurückgesetzt',
    resetToCycValuesDescription: 'Deine eigene Tabelle entspricht jetzt wieder CYC.',
    credibilityStatementCopied: 'Glaubwürdigkeitsaussage kopiert',
    credibilityStatementPaste: 'Füge sie in jedes Marktplatz-Listing ein.',
    listingCopied: 'Listing kopiert',
    listingCopiedPaste: 'Füge es direkt in deinen Marktplatz-Entwurf ein.',
    publishNotesSaved: 'Notizen gespeichert',
    publishNotesSavedDescription: 'Das Listing greift darauf zurück — sie sind bereits enthalten.',
    tableCopied: 'Tabelle kopiert',
    tableCopiedDescription: 'Gradierungstabelle in die Zwischenablage kopiert.',
    showTierNoted: 'Show-Ebene notiert',
    preEditSummaryCopied: 'Vor-Redaktions-Zusammenfassung kopiert',
    preEditSummaryPaste: 'Füge sie in dein Tech-Editor-Briefing oder deine eigene To-do-Liste ein.',
    testerCallCopied: 'Teststrick-Aufruf kopiert',
    testerCallPaste: 'Füge ihn in den Ravelry Testing Pool, Yarnpond oder deinen Newsletter ein.',
    rosterRebuilt: 'Roster neu aufgebaut',
    wholesaleCopied: 'In die Zwischenablage kopiert',
    wholesaleSelectManually: 'Manuell auswählen und kopieren',
    importSuccess: 'Import erfolgreich',
    importSuccessTitle: (n: number) => `Import erfolgreich — ${n} Projekt${n === 1 ? '' : 'e'} wiederhergestellt`,
    importMergedDescription: (imported: number, kept: number) => `Mit deinem Arbeitsbereich zusammengeführt; ${kept} vorhandene${kept === 1 ? 's' : ''} Projekt${kept === 1 ? '' : 'e'} unberührt beibehalten. (${imported} importiert)`,
    backupExportRequestedDescription: (n: number) => `Dein Browser wurde gebeten, ${n} Projekt${n === 1 ? '' : 'e'} zu speichern; prüfe bei Bedarf deine Downloads.`,
    measurementRestored: (label: string) => ({ title: `„${label}" wiederhergestellt`, description: 'Wieder im Abschnitt, nichts Weiteres wurde geändert.' }),
    measurementDeleted: (label: string) => ({ title: `„${label}" gelöscht`, description: 'Ein Klick ist nie endgültig: Mit Rückgängig innerhalb von 8s holst du es zurück.' }),
    measurementUpdatedAdded: (label: string, isUpdating: boolean) => ({
      title: isUpdating ? `„${label}" aktualisiert` : `„${label}" hinzugefügt`,
      description: isUpdating ? 'Mit seiner ursprünglichen ID gespeichert — nichts Weiterführendes geht kaputt.' : 'Füge ein weiteres hinzu oder schließe, wenn du fertig bist.',
    }),
    rosterRebuiltDescription: (sizes: number, slots: number) => `${sizes} Größen × ${slots} Platz${slots > 1 ? 'h' : ''}.`,
    yarnLoadedTitle: (name: string) => `${name} geladen — prüfe die Lauflänge gegen dein Wollband.`,
    yarnPoolRequired: (value: number, unit: string, max: number) => `${value} ${unit} erforderlich (max ${max}).`,
    showTierNotedDescription: (tierLabel: string) => `${tierLabel} — die Vorgaben sind Startpunkte, passe Besucherzahl und Gebühren an die tatsächliche Veranstaltung an.`,
    projectDuplicateDescription: (name: string) => `„${name} (Kopie)" wurde zu deinen Mustern hinzugefügt.`,
    projectExportRequestedDescription: (name: string) => `${name}.json-Export angefordert; prüfe bei Bedarf deine Browser-Downloads.`,
    projectDeletedDescription: (name: string) => `„${name}" wurde entfernt.`,
    projectImportedDescription: (name: string) => `„${name}" wurde zu deinen Mustern hinzugefügt.`,
    courseCopied: 'Kopiert',

    courseCopiedPaste: 'Füge es auf deiner Kursseite oder in deiner Pitch-E-Mail ein.',

    storesReconciled: 'Speicher abgeglichen',

    reconcileComplete: 'Abgleich fertig — Re-Export empfohlen',

    reconciledDescription: 'Beide Speicher enthalten jetzt identische Kopien jedes Projekts.',

    unifiedDescription: 'Deine Projekte wurden vereinheitlicht. Ein frisches Backup stellt sicher, dass beide Speicher deiner letzten Arbeit entsprechen.',

    reconcileFailed: 'Abgleich fehlgeschlagen',

    reconcileFailedDescription: 'Beim Vereinheitlichen der Speicher ist ein Fehler aufgetreten.',

    updated: 'aktualisiert',
    copyFailedSelectManually: 'copy fehlgeschlagen — bitte markiere den Text selbst.',
    incompleteQuarantine: 'Vervollständige die Details zum Kopieren',
        invalidMeasurementValue: (label, raw) => `Maß „${label}“ konnte nicht gespeichert werden: ${raw} ist keine gültige positive Zahl. Eine physische Abmessung kann nicht null oder negativ sein.`,
    artifactCreated: (label) => `Artefakt „${label}“ wurde im Publikationspaket gespeichert.`,
    artifactPrepared: (label) => `Druckübergabe für „${label}“ wurde im Browser vorbereitet. Der Paketeintrag enthält nur Metadaten; dein Browser entscheidet, ob eine Datei gespeichert wird.`,
    exportFailed: 'Export fehlgeschlagen. Bitte prüfe den Preflight-Status.',
  },
  fr: {
    copied: 'Copié',
    copiedDescription: 'Collez-le là où la campagne tourne.',
    copyFailed: 'Échec de la copie',
    copyFailedDescription: 'Sélectionnez le texte manuellement.',
    selectManually: 'Sélectionnez le texte manuellement.',
    selectManuallyFromBox: 'Sélectionnez le texte manuellement dans la zone ci-dessous.',
    notesSaved: 'Notes enregistrées',
    sectionDeletedTitle: 'Section supprimée',
    sectionDeletedDescription: 'Si c\'était une erreur, elle est toujours dans votre dernier export.',
    unknownError: 'Erreur inconnue.',
    fileCouldNotBeRead: 'Le fichier n\'a pas pu être lu.',
    importFailed: 'Échec de l\'import',
    importFailedDescription: 'Le fichier n\'a pas pu être analysé correctement.',
    backupExportRequested: 'Export de sauvegarde demandé',
    onboardingRestarted: 'Onboarding redémarré',
    onboardingRestartedDescription: 'Le guide de configuration apparaîtra lors de votre prochaine visite du tableau de bord.',
    resetToCycValues: 'Valeurs CYC rétablies',
    resetToCycValuesDescription: 'Votre tableau personnalisé correspond à nouveau à CYC.',
    credibilityStatementCopied: 'Déclaration de crédibilité copiée',
    credibilityStatementPaste: 'Collez-la dans n\'importe quelle annonce de marketplace.',
    listingCopied: 'Annonce copiée',
    listingCopiedPaste: 'Collez-la directement dans votre brouillon de marketplace.',
    publishNotesSaved: 'Notes enregistrées',
    publishNotesSavedDescription: 'L\'annonce s\'appuie dessus, elles sont donc déjà incluses.',
    tableCopied: 'Tableau copié',
    tableCopiedDescription: 'Tableau de gradation copié dans le presse-papiers.',
    showTierNoted: 'Niveau de salon noté',
    preEditSummaryCopied: 'Résumé pré-rédaction copié',
    preEditSummaryPaste: 'Collez-le dans votre brief d\'éditeur technique ou votre propre liste de tâches.',
    testerCallCopied: 'Appel aux testeurs copié',
    testerCallPaste: 'Collez-le sur le Ravelry Testing Pool, Yarnpond ou votre newsletter.',
    rosterRebuilt: 'Roster reconstruit',
    wholesaleCopied: 'Copié dans le presse-papiers',
    wholesaleSelectManually: 'Sélectionner et copier manuellement',
    importSuccess: 'Import réussi',
    importSuccessTitle: (n: number) => `Import réussi — ${n} projet${n > 1 ? 's' : ''} restauré${n > 1 ? 's' : ''}`,
    importMergedDescription: (imported: number, kept: number) => `Fusionné avec votre espace de travail ; ${kept} projet${kept > 1 ? 's' : ''} existant${kept > 1 ? 's' : ''} conservé${kept > 1 ? 's' : ''} intact. (${imported} importé)`,
    backupExportRequestedDescription: (n: number) => `Votre navigateur a été invité à enregistrer ${n} projet${n > 1 ? 's' : ''} ; vérifiez vos téléchargements si nécessaire.`,
    measurementRestored: (label: string) => ({ title: `« ${label} » restauré`, description: 'De retour dans la section, rien d\'autre n\'a changé.' }),
    measurementDeleted: (label: string) => ({ title: `« ${label} » supprimé`, description: 'Un clic n\'est jamais définitif : utilisez Annuler sous 8s pour le récupérer.' }),
    measurementUpdatedAdded: (label: string, isUpdating: boolean) => ({
      title: isUpdating ? `« ${label} » mis à jour` : `« ${label} » ajouté`,
      description: isUpdating ? 'Enregistré avec son identifiant d\'origine intact — rien en aval ne casse.' : 'Ajoutez-en un autre, ou fermez quand c\'est fait.',
    }),
    rosterRebuiltDescription: (sizes: number, slots: number) => `${sizes} tailles × ${slots} emplacement${slots > 1 ? 's' : ''}.`,
    yarnLoadedTitle: (name: string) => `${name} chargé — vérifiez le métrage par rapport à votre étiquette de pelote.`,
    yarnPoolRequired: (value: number, unit: string, max: number) => `${value} ${unit} necesario${value === 1 ? "" : "s"} (máx ${max}).`,
    showTierNotedDescription: (tierLabel: string) => `${tierLabel} — les valeurs par défaut sont des points de départ, ajustez la fréquentation et les frais à l'événement réel.`,
    projectDuplicateDescription: (name: string) => `« ${name} (Copie) » a été ajouté à vos motifs.`,
    projectExportRequestedDescription: (name: string) => `Export de ${name}.json demandé ; vérifiez vos téléchargements si nécessaire.`,
    projectDeletedDescription: (name: string) => `« ${name} » a été supprimé.`,
    projectImportedDescription: (name: string) => `« ${name} » a été ajouté à vos motifs.`,
    courseCopied: 'Copié',

    courseCopiedPaste: 'Collez-le sur la page de votre cours ou dans votre e-mail de pitch.',

    storesReconciled: 'Stockages synchronisés',

    reconcileComplete: 'Synchronisation terminée — ré-export recommandé',

    reconciledDescription: 'Les deux stockages contiennent désormais des copies identiques de chaque projet.',

    unifiedDescription: 'Vos projets ont été unifiés. Une nouvelle sauvegarde garantit que les deux stockages correspondent à votre travail le plus récent.',

    reconcileFailed: 'Synchronisation échouée',


    reconcileFailedDescription: "Une erreur est survenue lors de l'unification des stockages.",

        updated: 'mis à jour',
    copyFailedSelectManually: 'copie échouée — sélectionnez le texte manuellement.',
    incompleteQuarantine: 'Complétez les détails pour copier',
    invalidMeasurementValue: (label, raw) => `La mesure « ${label} » n’a pas pu être enregistrée : ${raw} n’est pas un nombre positif valide. Une dimension physique ne peut pas être nulle ou négative.`,
    artifactCreated: (label) => `L'artéfact « ${label} » a été enregistré dans le dossier de publication.`,
    artifactPrepared: (label) => `La préparation d’impression pour « ${label} » a été lancée dans votre navigateur. Le dossier ne contient que des métadonnées ; votre navigateur décide si un fichier est enregistré.`,
    exportFailed: "L'export a échoué. Veuillez vérifier l'état du contrôle préliminaire.",
  },
  es: {
    copied: 'Copiado',
    copiedDescription: 'Pégalo donde se ejecute la campaña.',
    copyFailed: 'Error al copiar',
    copyFailedDescription: 'Selecciona el texto manualmente.',
    selectManually: 'Selecciona el texto manualmente.',
    selectManuallyFromBox: 'Selecciona el texto manualmente del cuadro de abajo.',
    notesSaved: 'Notas guardadas',
    sectionDeletedTitle: 'Sección eliminada',
    sectionDeletedDescription: 'Si fue un error, sigue en tu última exportación.',
    unknownError: 'Error desconocido.',
    fileCouldNotBeRead: 'No se pudo leer el archivo.',
    importFailed: 'Error en la importación',
    importFailedDescription: 'El archivo no se pudo analizar correctamente.',
    backupExportRequested: 'Exportación de copia solicitada',
    onboardingRestarted: 'Onboarding reiniciado',
    onboardingRestartedDescription: 'La guía de configuración aparecerá en tu próxima visita al panel.',
    resetToCycValues: 'Restablecido a valores CYC',
    resetToCycValuesDescription: 'Tu tabla personalizada vuelve a coincidir con CYC.',
    credibilityStatementCopied: 'Declaración de credibilidad copiada',
    credibilityStatementPaste: 'Pégala en cualquier anuncio de marketplace.',
    listingCopied: 'Anuncio copiado',
    listingCopiedPaste: 'Pégalo directamente en tu borrador de marketplace.',
    publishNotesSaved: 'Notas guardadas',
    publishNotesSavedDescription: 'El anuncio tira de estas, así que ya están incluidas.',
    tableCopied: 'Tabla copiada',
    tableCopiedDescription: 'Tabla de gradación copiada al portapapeles.',
    showTierNoted: 'Nivel de feria anotado',
    preEditSummaryCopied: 'Resumen pre-edición copiado',
    preEditSummaryPaste: 'Pégalo en el briefing de tu editora técnica o en tu propia lista de tareas.',
    testerCallCopied: 'Llamada a testadoras copiada',
    testerCallPaste: 'Pégala en el Ravelry Testing Pool, Yarnpond o tu boletín.',
    rosterRebuilt: 'Roster reconstruido',
    wholesaleCopied: 'Copiado al portapapeles',
    wholesaleSelectManually: 'Selecciona y copia manualmente',
    importSuccess: 'Importación correcta',
    importSuccessTitle: (n: number) => `Importación correcta — ${n} proyecto${n === 1 ? '' : 's'} restaurado${n === 1 ? '' : 's'}`,
    importMergedDescription: (imported: number, kept: number) => `Fusionado con tu espacio de trabajo; ${kept} proyecto${kept === 1 ? '' : 's'} existente${kept === 1 ? '' : 's'} conservado${kept === 1 ? '' : 's'} intacto. (${imported} importado)`,
    backupExportRequestedDescription: (n: number) => `Se pidió a tu navegador que guardara ${n} proyecto${n === 1 ? '' : 's'}; comprueba tus descargas si hace falta.`,
    measurementRestored: (label: string) => ({ title: `«${label}» restaurado`, description: 'De vuelta en la sección, nada más ha cambiado.' }),
    measurementDeleted: (label: string) => ({ title: `«${label}» eliminado`, description: 'Un clic nunca es definitivo: pulsa Deshacer en 8s para recuperarlo.' }),
    measurementUpdatedAdded: (label: string, isUpdating: boolean) => ({
      title: isUpdating ? `«${label}» actualizado` : `«${label}» añadido`,
      description: isUpdating ? 'Guardado con su id original intacto — nada aguas abajo se rompe.' : 'Añade otro, o cierra cuando termines.',
    }),
    rosterRebuiltDescription: (sizes: number, slots: number) => `${sizes} tallas × ${slots} hueco${slots > 1 ? 's' : ''}.`,
    yarnLoadedTitle: (name: string) => `Cargado ${name} — verifica el metraje contra la etiqueta de tu ovillo.`,
    yarnPoolRequired: (value: number, unit: string, max: number) => `${value} ${unit} requerido${value === 1 ? '' : 's'} (máx ${max}).`,
    showTierNotedDescription: (tierLabel: string) => `${tierLabel} — los valores por defecto son puntos de partida, ajusta asistencia y tarifas al evento real.`,
    projectDuplicateDescription: (name: string) => `«${name} (Copia)» se añadió a tus patrones.`,
    projectExportRequestedDescription: (name: string) => `Exportación de ${name}.json solicitada; comprueba tus descargas si hace falta.`,
    projectDeletedDescription: (name: string) => `«${name}» se eliminó.`,
    projectImportedDescription: (name: string) => `«${name}» se añadió a tus patrones.`,
    courseCopied: 'Copiado',

    courseCopiedPaste: 'Pégalo en la página de tu curso o en tu correo de pitch.',

    storesReconciled: 'Almacenes reconciliados',

    reconcileComplete: 'Reconciliación completa — se recomienda re-exportar',

    reconciledDescription: 'Los dos almacenes ahora contienen copias idénticas de cada proyecto.',

    unifiedDescription: 'Tus proyectos fueron unificados. Una copia de seguridad fresca garantiza que ambos almacenes coinciden con tu trabajo más reciente.',

    reconcileFailed: 'Reconciliación fallida',

    reconcileFailedDescription: 'Algo salió mal al unificar los almacenes.',

        updated: 'actualizado',
    copyFailedSelectManually: 'no se pudo copiar — selecciona el texto manualmente.',
    incompleteQuarantine: 'Completa los detalles para copiar',
    invalidMeasurementValue: (label, raw) => `La medida « ${label} » no pudo guardarse: ${raw} no es un número positivo válido. Una dimensión física no puede ser nula o negativa.`,
    artifactCreated: (label) => `El artefacto "${label}" se registró en el paquete de publicación.`,
    artifactPrepared: (label) => `La preparación de impresión de "${label}" se inició en tu navegador. El paquete solo contiene metadatos; tu navegador decide si se guarda un archivo.`,
    exportFailed: 'Exportación fallida. Por favor, comprueba el estado preflight.',
  },
  pt: {
    copied: 'Copiado',
    copiedDescription: 'Cola-o onde a campanha decorre.',
    copyFailed: 'Falha ao copiar',
    copyFailedDescription: 'Seleciona o texto manualmente.',
    selectManually: 'Seleciona o texto manualmente.',
    selectManuallyFromBox: 'Seleciona o texto manualmente na caixa abaixo.',
    notesSaved: 'Notas guardadas',
    sectionDeletedTitle: 'Secção eliminada',
    sectionDeletedDescription: 'Se foi um engano, ainda está na tua última exportação.',
    unknownError: 'Erro desconhecido.',
    fileCouldNotBeRead: 'O ficheiro não pôde ser lido.',
    importFailed: 'Importação falhou',
    importFailedDescription: 'O ficheiro não pôde ser processado corretamente.',
    backupExportRequested: 'Exportação da cópia solicitada',
    onboardingRestarted: 'Onboarding reiniciado',
    onboardingRestartedDescription: 'O guia de configuração aparecerá na tua próxima visita ao painel.',
    resetToCycValues: 'Valores CYC repostos',
    resetToCycValuesDescription: 'A tua tabela personalizada volta a coincidir com CYC.',
    credibilityStatementCopied: 'Declaração de credibilidade copiada',
    credibilityStatementPaste: 'Cola-a em qualquer anúncio de marketplace.',
    listingCopied: 'Anúncio copiado',
    listingCopiedPaste: 'Cola-o diretamente no teu rascunho de marketplace.',
    publishNotesSaved: 'Notas guardadas',
    publishNotesSavedDescription: 'O anúncio usa estas, por isso já estão incluídas.',
    tableCopied: 'Tabela copiada',
    tableCopiedDescription: 'Tabela de graduação copiada para a área de transferência.',
    showTierNoted: 'Nível de feira anotado',
    preEditSummaryCopied: 'Resumo pré-edição copiado',
    preEditSummaryPaste: 'Cola-o no briefing da tua editora técnica ou na tua própria lista de tarefas.',
    testerCallCopied: 'Chamada a testadoras copiada',
    testerCallPaste: 'Cola-a no Ravelry Testing Pool, Yarnpond ou na tua newsletter.',
    rosterRebuilt: 'Roster reconstruído',
    wholesaleCopied: 'Copiado para a área de transferência',
    wholesaleSelectManually: 'Seleciona e copia manualmente',
    importSuccess: 'Importação bem-sucedida',
    importSuccessTitle: (n: number) => `Importação bem-sucedida — ${n} projeto${n === 1 ? '' : 's'} restaurado${n === 1 ? '' : 's'}`,
    importMergedDescription: (imported: number, kept: number) => `Juntado ao teu espaço de trabalho; ${kept} projeto${kept === 1 ? '' : 's'} existente${kept === 1 ? '' : 's'} mantido${kept === 1 ? '' : 's'} intacto. (${imported} importado)`,
    backupExportRequestedDescription: (n: number) => `O teu navegador recebeu um pedido para guardar ${n} projeto${n === 1 ? '' : 's'}; verifica as transferências se necessário.`,
    measurementRestored: (label: string) => ({ title: `«${label}» restaurado`, description: 'De volta à secção, mais nada foi alterado.' }),
    measurementDeleted: (label: string) => ({ title: `«${label}» eliminado`, description: 'Um clique nunca é definitivo: usa Desfazer dentro de 8s para o recuperar.' }),
    measurementUpdatedAdded: (label: string, isUpdating: boolean) => ({
      title: isUpdating ? `«${label}» atualizado` : `«${label}» adicionado`,
      description: isUpdating ? 'Guardado com o id original intacto — nada a jusante se quebra.' : 'Adiciona outro, ou fecha quando terminares.',
    }),
    rosterRebuiltDescription: (sizes: number, slots: number) => `${sizes} tamanhos × ${slots} vaga${slots > 1 ? 's' : ''}.`,
    yarnLoadedTitle: (name: string) => `${name} carregado — verifica a metragem contra o rótulo do teu novelo.`,
    yarnPoolRequired: (value: number, unit: string, max: number) => `${value} ${unit} obrigatório${value === 1 ? '' : 's'} (máx ${max}).`,
    showTierNotedDescription: (tierLabel: string) => `${tierLabel} — os padrões são pontos de partida, ajusta a afluência e as taxas ao evento real.`,
    projectDuplicateDescription: (name: string) => `«${name} (Cópia)» foi adicionado aos teus padrões.`,
    projectExportRequestedDescription: (name: string) => `Exportação de ${name}.json solicitada; verifica as transferências se necessário.`,
    projectDeletedDescription: (name: string) => `«${name}» foi removido.`,
    projectImportedDescription: (name: string) => `«${name}» foi adicionado aos teus padrões.`,
    courseCopied: 'Copiado',

    courseCopiedPaste: 'Cola-o na página do teu curso ou no teu e-mail de apresentação.',

    storesReconciled: 'Armazéns reconciliados',

    reconcileComplete: 'Reconciliação completa — recomenda-se re-exportar',

    reconciledDescription: 'Os dois armazéns agora contêm cópias idênticas de cada projeto.',

    unifiedDescription: 'Os teus projetos foram unificados. Uma cópia de segurança nova garante que ambos os armazéns correspondem ao teu trabalho mais recente.',

    reconcileFailed: 'Reconciliação falhou',

    reconcileFailedDescription: 'Algo correu mal ao unificar os armazéns.',

        updated: 'atualizado',
    copyFailedSelectManually: 'cópia falhou — selecione o texto manualmente.',
    incompleteQuarantine: 'Complete os detalhes para copiar',
    invalidMeasurementValue: (label, raw) => `A medida « ${label} » não pode ser guardada: ${raw} não é um número positivo válido. Uma dimensão física não pode ser nula ou negativa.`,
    artifactCreated: (label) => `O artefato "${label}" foi registrado no pacote de publicação.`,
    artifactPrepared: (label) => `A preparação de impressão de "${label}" foi iniciada no navegador. O pacote contém apenas metadados; o navegador decide se um ficheiro é guardado.`,
    exportFailed: 'A exportação falhou. Por favor, verifique o status do preflight.',
  },
};

export function getToastCopy(locale: string): ToastCopy {
  const code = locale.toLowerCase().split('-')[0] as LanguageCode;
  return COPY[code] ?? COPY.en;
}
