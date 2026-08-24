import type { ReleaseDraftField, ReleaseDraftLocale } from '@/lib/release-draft';

export interface ReleaseDraftCopy {
  title: string;
  description: string;
  create: string;
  saved: string;
  titleLabel: string;
  purposeLabel: string;
  audienceLabel: string;
  localeLabel: string;
  purposeOptions: Record<'portfolio' | 'pattern-preview' | 'finished-work' | 'private-review', string>;
  audienceOptions: Record<'private' | 'trusted-reviewer' | 'public', string>;
  artifactsLabel: string;
  bragCardArtifact: string;
  artifactSelected: string;
  artifactSelect: string;
  artifactAvailable: string;
  artifactNeedsSource: string;
  artifactMissing: string;
  noArtifactsSelected: string;
  mediaLabel: string;
  noPhoto: string;
  photoSelected: string;
  captionLabel: string;
  altTextLabel: string;
  altTextReview: string;
  redactLabel: string;
  fieldsLabel: string;
  includeField: string;
  redactField: string;
  fieldUnavailable: string;
  fieldLabels: Record<ReleaseDraftField, string>;
  previewLabel: string;
  previewDescription: string;
  previewIncluded: string;
  previewOmitted: string;
  previewPurpose: string;
  previewAudience: string;
  previewArtifactSource: string;
  previewArtifactProvenance: string;
  previewFieldValue: string;
  previewMediaDetails: string;
  previewAltText: string;
  previewCaptionOmitted: string;
  previewNotSelected: string;
  previewRedacted: string;
  previewNoMedia: string;
  previewNoFields: string;
  notRecorded: string;
  reviewLabel: string;
  reviewed: string;
  notReviewed: string;
  validateLabel: string;
  ready: string;
  needsReview: string;
  handoffLabel: string;
  copyHandoff: string;
  handoffPrepared: string;
  handoffUnknown: string;
  clipboardUnavailable: string;
  withdraw: string;
  withdrawn: string;
  withdrawnHint: string;
  privateDefault: string;
  reviewHint: string;
  noDraft: string;
  delete: string;
  deleteTitle: string;
  deleteDescription: string;
  deleteConfirm: string;
  deleteCancel: string;
  deleteSuccess: string;
}

const FIELD_LABELS: Record<ReleaseDraftField, Record<ReleaseDraftLocale, string>> = {
  title: { en: 'Title', de: 'Titel', fr: 'Titre', es: 'Título', pt: 'Título' },
  description: { en: 'Description', de: 'Beschreibung', fr: 'Description', es: 'Descripción', pt: 'Descrição' },
  author: { en: 'Author', de: 'Autor', fr: 'Auteur', es: 'Autor', pt: 'Autoria' },
  gauge: { en: 'Gauge', de: 'Maschenprobe', fr: 'Échantillon', es: 'Muestra', pt: 'Amostra' },
  sizes: { en: 'Base size', de: 'Grundgröße', fr: 'Taille de base', es: 'Talla base', pt: 'Tamanho base' },
  'grading-summary': { en: 'Grading summary', de: 'Grading-Zusammenfassung', fr: 'Résumé du grading', es: 'Resumen de grading', pt: 'Resumo do grading' },
  notes: { en: 'Notes', de: 'Notizen', fr: 'Notes', es: 'Notas', pt: 'Notas' },
  'stitch-identity': { en: 'Stitch identity', de: 'Stitch-Identität', fr: 'Identité du point', es: 'Identidad del punto', pt: 'Identidade do ponto' },
};

const COPY: Record<ReleaseDraftLocale, ReleaseDraftCopy> = {
  en: {
    title: 'Release Draft',
    description: 'Prepare a private, reviewed handoff from this project. Nothing is posted or sent automatically.',
    create: 'Start a private draft',
    saved: 'Saved locally',
    titleLabel: 'Draft name',
    purposeLabel: 'Purpose',
    audienceLabel: 'Audience',
    localeLabel: 'Review language',
    purposeOptions: { portfolio: 'Portfolio', 'pattern-preview': 'Pattern preview', 'finished-work': 'Finished work', 'private-review': 'Private review' },
    audienceOptions: { private: 'Private', 'trusted-reviewer': 'Trusted reviewer', public: 'Public' },
    artifactsLabel: 'Artifacts to include',
    bragCardArtifact: 'Brag Card preview',
    artifactSelected: 'Included in preview',
    artifactSelect: 'Include this artifact',
    artifactAvailable: 'Available locally',
    artifactNeedsSource: 'Needs local source data',
    artifactMissing: 'Not available in this workspace',
    noArtifactsSelected: 'No artifact selected yet. Select an available local artifact before review.',
    mediaLabel: 'Finished-work media (optional)',
    noPhoto: 'No photo is required. You can prepare an artifact-only draft.',
    photoSelected: 'Selected local image',
    captionLabel: 'Caption',
    altTextLabel: 'Alt text',
    altTextReview: 'I reviewed this alt text',
    redactLabel: 'Redact from handoff',
    fieldsLabel: 'Project fields to include',
    includeField: 'Include field',
    redactField: 'Redact field',
    fieldUnavailable: 'Not recorded locally',
    fieldLabels: Object.fromEntries(Object.entries(FIELD_LABELS).map(([field, labels]) => [field, labels.en])) as Record<ReleaseDraftField, string>,
    previewLabel: 'Exact handoff preview',
    previewDescription: 'Only the included items below are eligible for the explicit clipboard request. Redacted and unselected items stay on this device.',
    previewIncluded: 'Included in clipboard payload',
    previewOmitted: 'Omitted from clipboard payload',
    previewPurpose: 'Purpose',
    previewAudience: 'Audience',
    previewArtifactSource: 'Source',
    previewArtifactProvenance: 'Provenance',
    previewFieldValue: 'Value',
    previewMediaDetails: 'Local file',
    previewAltText: 'Active-locale alt text',
    previewCaptionOmitted: 'Caption is omitted from the clipboard payload',
    previewNotSelected: 'Not selected',
    previewRedacted: 'Redacted locally',
    previewNoMedia: 'No media selected; this is the valid no-photo path.',
    previewNoFields: 'No project fields selected.',
    notRecorded: 'Not recorded locally',
    reviewLabel: 'Review state',
    reviewed: 'Reviewed for this handoff',
    notReviewed: 'Needs my review',
    validateLabel: 'Readiness',
    ready: 'Ready for an explicit browser handoff',
    needsReview: 'Needs review before handoff',
    handoffLabel: 'Browser handoff',
    copyHandoff: 'Copy reviewed handoff text',
    handoffPrepared: 'Prepared locally; clipboard result is not platform delivery proof.',
    handoffUnknown: 'Clipboard outcome is unknown. Check the destination yourself.',
    clipboardUnavailable: 'Clipboard is unavailable; no handoff was claimed.',
    withdraw: 'Withdraw draft',
    withdrawn: 'Withdrawn locally',
    withdrawnHint: 'This draft is withdrawn locally. Editing and browser handoff are disabled.',
    privateDefault: 'New drafts start private by default.',
    reviewHint: 'Only reviewed, non-redacted fields and media are included in the copied handoff text.',
    noDraft: 'No release draft exists for this project yet.',
    delete: 'Delete local draft',
    deleteTitle: 'Delete this local draft?',
    deleteDescription: 'This removes only the draft metadata stored on this device. It cannot retract text or media already handed off or copied elsewhere.',
    deleteConfirm: 'Delete local draft',
    deleteCancel: 'Keep draft',
    deleteSuccess: 'Local draft metadata deleted.',
  },
  de: {
    title: 'Freigabeentwurf',
    description: 'Bereite eine private, geprüfte Übergabe vor. Es wird nichts automatisch veröffentlicht oder gesendet.',
    create: 'Privaten Entwurf starten',
    saved: 'Lokal gespeichert',
    titleLabel: 'Name des Entwurfs',
    purposeLabel: 'Zweck',
    audienceLabel: 'Zielgruppe',
    localeLabel: 'Prüfsprache',
    purposeOptions: { portfolio: 'Portfolio', 'pattern-preview': 'Muster-Vorschau', 'finished-work': 'Fertiges Werk', 'private-review': 'Private Prüfung' },
    audienceOptions: { private: 'Privat', 'trusted-reviewer': 'Vertrauenswürdige Prüfung', public: 'Öffentlich' },
    artifactsLabel: 'Einzuschließende Artefakte',
    bragCardArtifact: 'Brag-Card-Vorschau',
    artifactSelected: 'In der Vorschau enthalten',
    artifactSelect: 'Dieses Artefakt aufnehmen',
    artifactAvailable: 'Lokal verfügbar',
    artifactNeedsSource: 'Lokale Quelldaten nötig',
    artifactMissing: 'In diesem Arbeitsbereich nicht verfügbar',
    noArtifactsSelected: 'Noch kein Artefakt ausgewählt. Wähle vor der Prüfung ein verfügbares lokales Artefakt.',
    mediaLabel: 'Medien zum fertigen Werk (optional)',
    noPhoto: 'Ein Foto ist nicht erforderlich. Ein Entwurf nur mit Artefakt ist möglich.',
    photoSelected: 'Lokales Bild ausgewählt',
    captionLabel: 'Bildunterschrift',
    altTextLabel: 'Alternativtext',
    altTextReview: 'Alternativtext geprüft',
    redactLabel: 'Für die Übergabe schwärzen',
    fieldsLabel: 'Einzuschließende Projektfelder',
    includeField: 'Feld aufnehmen',
    redactField: 'Feld schwärzen',
    fieldUnavailable: 'Lokal nicht erfasst',
    fieldLabels: Object.fromEntries(Object.entries(FIELD_LABELS).map(([field, labels]) => [field, labels.de])) as Record<ReleaseDraftField, string>,
    previewLabel: 'Exakte Übergabevorschau',
    previewDescription: 'Nur die folgenden enthaltenen Elemente können ausdrücklich in die Clipboard-Anfrage gelangen. Geschwärzte und nicht ausgewählte Elemente bleiben auf diesem Gerät.',
    previewIncluded: 'In Clipboard-Nutzlast enthalten',
    previewOmitted: 'Aus Clipboard-Nutzlast ausgeschlossen',
    previewPurpose: 'Zweck',
    previewAudience: 'Zielgruppe',
    previewArtifactSource: 'Quelle',
    previewArtifactProvenance: 'Herkunft',
    previewFieldValue: 'Wert',
    previewMediaDetails: 'Lokale Datei',
    previewAltText: 'Alternativtext der aktiven Sprache',
    previewCaptionOmitted: 'Bildunterschrift wird aus der Clipboard-Nutzlast ausgeschlossen',
    previewNotSelected: 'Nicht ausgewählt',
    previewRedacted: 'Lokal geschwärzt',
    previewNoMedia: 'Kein Medium ausgewählt; der gültige Weg ohne Foto.',
    previewNoFields: 'Keine Projektfelder ausgewählt.',
    notRecorded: 'Lokal nicht erfasst',
    reviewLabel: 'Prüfstatus',
    reviewed: 'Für diese Übergabe geprüft',
    notReviewed: 'Meine Prüfung steht aus',
    validateLabel: 'Bereitschaft',
    ready: 'Bereit für eine ausdrückliche Browser-Übergabe',
    needsReview: 'Vor der Übergabe ist eine Prüfung nötig',
    handoffLabel: 'Browser-Übergabe',
    copyHandoff: 'Geprüften Übergabetext kopieren',
    handoffPrepared: 'Lokal vorbereitet; das Clipboard ist kein Beweis für eine Plattformzustellung.',
    handoffUnknown: 'Clipboard-Ergebnis unbekannt. Ziel selbst prüfen.',
    clipboardUnavailable: 'Clipboard nicht verfügbar; keine Übergabe behauptet.',
    withdraw: 'Entwurf zurückziehen',
    withdrawn: 'Lokal zurückgezogen',
    withdrawnHint: 'Dieser Entwurf wurde lokal zurückgezogen. Bearbeitung und Browser-Übergabe sind deaktiviert.',
    privateDefault: 'Neue Entwürfe sind standardmäßig privat.',
    reviewHint: 'Nur geprüfte, nicht geschwärzte Felder und Medien werden in den kopierten Übergabetext aufgenommen.',
    noDraft: 'Für dieses Projekt gibt es noch keinen Freigabeentwurf.',
    delete: 'Lokalen Entwurf löschen',
    deleteTitle: 'Diesen lokalen Entwurf löschen?',
    deleteDescription: 'Nur die auf diesem Gerät gespeicherten Entwurfsmetadaten werden entfernt. Bereits übergebener oder kopierter Text und Medien können nicht zurückgerufen werden.',
    deleteConfirm: 'Lokalen Entwurf löschen',
    deleteCancel: 'Entwurf behalten',
    deleteSuccess: 'Lokale Entwurfsmetadaten gelöscht.',
  },
  fr: {
    title: 'Brouillon de diffusion',
    description: 'Préparez une remise privée et relue. Rien n’est publié ni envoyé automatiquement.',
    create: 'Commencer un brouillon privé',
    saved: 'Enregistré localement',
    titleLabel: 'Nom du brouillon',
    purposeLabel: 'Objectif',
    audienceLabel: 'Audience',
    localeLabel: 'Langue de relecture',
    purposeOptions: { portfolio: 'Portfolio', 'pattern-preview': 'Aperçu du patron', 'finished-work': 'Ouvrage terminé', 'private-review': 'Relecture privée' },
    audienceOptions: { private: 'Privée', 'trusted-reviewer': 'Lecteur de confiance', public: 'Publique' },
    artifactsLabel: 'Artefacts à inclure',
    bragCardArtifact: 'Aperçu Brag Card',
    artifactSelected: 'Inclus dans l’aperçu',
    artifactSelect: 'Inclure cet artefact',
    artifactAvailable: 'Disponible localement',
    artifactNeedsSource: 'Données source locales nécessaires',
    artifactMissing: 'Indisponible dans cet espace de travail',
    noArtifactsSelected: 'Aucun artefact sélectionné. Choisissez un artefact local disponible avant la relecture.',
    mediaLabel: 'Médias de l’ouvrage terminé (facultatif)',
    noPhoto: 'Aucune photo n’est requise. Un brouillon avec artefact seul est possible.',
    photoSelected: 'Image locale sélectionnée',
    captionLabel: 'Légende',
    altTextLabel: 'Texte alternatif',
    altTextReview: 'J’ai relu ce texte alternatif',
    redactLabel: 'Masquer pour la remise',
    fieldsLabel: 'Champs du projet à inclure',
    includeField: 'Inclure le champ',
    redactField: 'Masquer le champ',
    fieldUnavailable: 'Non enregistré localement',
    fieldLabels: Object.fromEntries(Object.entries(FIELD_LABELS).map(([field, labels]) => [field, labels.fr])) as Record<ReleaseDraftField, string>,
    previewLabel: 'Aperçu exact de la remise',
    previewDescription: 'Seuls les éléments inclus ci-dessous peuvent entrer dans la demande explicite au presse-papiers. Les éléments masqués ou non sélectionnés restent sur cet appareil.',
    previewIncluded: 'Inclus dans la charge du presse-papiers',
    previewOmitted: 'Exclus de la charge du presse-papiers',
    previewPurpose: 'Objectif',
    previewAudience: 'Audience',
    previewArtifactSource: 'Source',
    previewArtifactProvenance: 'Provenance',
    previewFieldValue: 'Valeur',
    previewMediaDetails: 'Fichier local',
    previewAltText: 'Texte alternatif de la langue active',
    previewCaptionOmitted: 'La légende est exclue de la charge du presse-papiers',
    previewNotSelected: 'Non sélectionné',
    previewRedacted: 'Masqué localement',
    previewNoMedia: 'Aucun média sélectionné ; le parcours valide sans photo.',
    previewNoFields: 'Aucun champ de projet sélectionné.',
    notRecorded: 'Non enregistré localement',
    reviewLabel: 'État de relecture',
    reviewed: 'Relu pour cette remise',
    notReviewed: 'Ma relecture est nécessaire',
    validateLabel: 'Préparation',
    ready: 'Prêt pour une remise explicite dans le navigateur',
    needsReview: 'Relecture nécessaire avant la remise',
    handoffLabel: 'Remise navigateur',
    copyHandoff: 'Copier le texte relu',
    handoffPrepared: 'Préparé localement ; le presse-papiers ne prouve pas une livraison à la plateforme.',
    handoffUnknown: 'Résultat du presse-papiers inconnu. Vérifiez la destination vous-même.',
    clipboardUnavailable: 'Presse-papiers indisponible ; aucune remise n’est annoncée.',
    withdraw: 'Retirer le brouillon',
    withdrawn: 'Retiré localement',
    withdrawnHint: 'Ce brouillon a été retiré localement. La modification et la remise dans le navigateur sont désactivées.',
    privateDefault: 'Les nouveaux brouillons sont privés par défaut.',
    reviewHint: 'Seuls les champs et médias relus et non masqués sont inclus dans le texte copié.',
    noDraft: 'Aucun brouillon de diffusion pour ce projet.',
    delete: 'Supprimer le brouillon local',
    deleteTitle: 'Supprimer ce brouillon local ?',
    deleteDescription: 'Seules les métadonnées du brouillon stockées sur cet appareil seront supprimées. Le texte ou les médias déjà remis ou copiés ailleurs ne peuvent pas être retirés.',
    deleteConfirm: 'Supprimer le brouillon local',
    deleteCancel: 'Garder le brouillon',
    deleteSuccess: 'Métadonnées du brouillon local supprimées.',
  },
  es: {
    title: 'Borrador de lanzamiento',
    description: 'Prepara una entrega privada y revisada. Nada se publica ni se envía automáticamente.',
    create: 'Iniciar borrador privado',
    saved: 'Guardado localmente',
    titleLabel: 'Nombre del borrador',
    purposeLabel: 'Propósito',
    audienceLabel: 'Audiencia',
    localeLabel: 'Idioma de revisión',
    purposeOptions: { portfolio: 'Portafolio', 'pattern-preview': 'Vista previa del patrón', 'finished-work': 'Trabajo terminado', 'private-review': 'Revisión privada' },
    audienceOptions: { private: 'Privada', 'trusted-reviewer': 'Revisor de confianza', public: 'Pública' },
    artifactsLabel: 'Artefactos que incluir',
    bragCardArtifact: 'Vista previa de Brag Card',
    artifactSelected: 'Incluido en la vista previa',
    artifactSelect: 'Incluir este artefacto',
    artifactAvailable: 'Disponible localmente',
    artifactNeedsSource: 'Necesita datos fuente locales',
    artifactMissing: 'No disponible en este espacio de trabajo',
    noArtifactsSelected: 'Aún no hay artefacto seleccionado. Elige un artefacto local disponible antes de revisar.',
    mediaLabel: 'Medios del trabajo terminado (opcional)',
    noPhoto: 'No se necesita una foto. Puedes preparar un borrador solo con el artefacto.',
    photoSelected: 'Imagen local seleccionada',
    captionLabel: 'Pie de foto',
    altTextLabel: 'Texto alternativo',
    altTextReview: 'He revisado este texto alternativo',
    redactLabel: 'Ocultar en la entrega',
    fieldsLabel: 'Campos del proyecto que incluir',
    includeField: 'Incluir campo',
    redactField: 'Ocultar campo',
    fieldUnavailable: 'No registrado localmente',
    fieldLabels: Object.fromEntries(Object.entries(FIELD_LABELS).map(([field, labels]) => [field, labels.es])) as Record<ReleaseDraftField, string>,
    previewLabel: 'Vista previa exacta de la entrega',
    previewDescription: 'Solo los elementos incluidos abajo pueden entrar en la solicitud explícita al portapapeles. Los elementos ocultos y no seleccionados permanecen en este dispositivo.',
    previewIncluded: 'Incluido en la carga del portapapeles',
    previewOmitted: 'Omitido de la carga del portapapeles',
    previewPurpose: 'Propósito',
    previewAudience: 'Audiencia',
    previewArtifactSource: 'Fuente',
    previewArtifactProvenance: 'Procedencia',
    previewFieldValue: 'Valor',
    previewMediaDetails: 'Archivo local',
    previewAltText: 'Texto alternativo del idioma activo',
    previewCaptionOmitted: 'El pie de foto se omite de la carga del portapapeles',
    previewNotSelected: 'No seleccionado',
    previewRedacted: 'Oculto localmente',
    previewNoMedia: 'No hay medios seleccionados; este es el recorrido válido sin foto.',
    previewNoFields: 'No hay campos del proyecto seleccionados.',
    notRecorded: 'No registrado localmente',
    reviewLabel: 'Estado de revisión',
    reviewed: 'Revisado para esta entrega',
    notReviewed: 'Necesita mi revisión',
    validateLabel: 'Preparación',
    ready: 'Listo para una entrega explícita en el navegador',
    needsReview: 'Necesita revisión antes de entregar',
    handoffLabel: 'Entrega del navegador',
    copyHandoff: 'Copiar texto revisado',
    handoffPrepared: 'Preparado localmente; el portapapeles no demuestra entrega en la plataforma.',
    handoffUnknown: 'El resultado del portapapeles es desconocido. Comprueba el destino tú mismo.',
    clipboardUnavailable: 'Portapapeles no disponible; no se afirma ninguna entrega.',
    withdraw: 'Retirar borrador',
    withdrawn: 'Retirado localmente',
    withdrawnHint: 'Este borrador se retiró localmente. La edición y la entrega del navegador están desactivadas.',
    privateDefault: 'Los borradores nuevos empiezan siendo privados.',
    reviewHint: 'Solo se incluyen en el texto copiado los campos y medios revisados y no ocultos.',
    noDraft: 'Aún no hay borrador de lanzamiento para este proyecto.',
    delete: 'Eliminar borrador local',
    deleteTitle: '¿Eliminar este borrador local?',
    deleteDescription: 'Esto elimina solo los metadatos del borrador guardados en este dispositivo. No puede retirar texto ni medios ya entregados o copiados en otro lugar.',
    deleteConfirm: 'Eliminar borrador local',
    deleteCancel: 'Conservar borrador',
    deleteSuccess: 'Metadatos del borrador local eliminados.',
  },
  pt: {
    title: 'Rascunho de lançamento',
    description: 'Prepare uma entrega privada e revisada. Nada é publicado ou enviado automaticamente.',
    create: 'Iniciar rascunho privado',
    saved: 'Salvo localmente',
    titleLabel: 'Nome do rascunho',
    purposeLabel: 'Objetivo',
    audienceLabel: 'Público',
    localeLabel: 'Idioma da revisão',
    purposeOptions: { portfolio: 'Portfólio', 'pattern-preview': 'Prévia do padrão', 'finished-work': 'Trabalho concluído', 'private-review': 'Revisão privada' },
    audienceOptions: { private: 'Privado', 'trusted-reviewer': 'Revisor de confiança', public: 'Público' },
    artifactsLabel: 'Artefatos a incluir',
    bragCardArtifact: 'Prévia do Brag Card',
    artifactSelected: 'Incluído na prévia',
    artifactSelect: 'Incluir este artefato',
    artifactAvailable: 'Disponível localmente',
    artifactNeedsSource: 'Precisa de dados locais de origem',
    artifactMissing: 'Indisponível neste espaço de trabalho',
    noArtifactsSelected: 'Nenhum artefato selecionado. Escolha um artefato local disponível antes da revisão.',
    mediaLabel: 'Mídia do trabalho concluído (opcional)',
    noPhoto: 'Nenhuma foto é necessária. É possível preparar um rascunho apenas com o artefato.',
    photoSelected: 'Imagem local selecionada',
    captionLabel: 'Legenda',
    altTextLabel: 'Texto alternativo',
    altTextReview: 'Revisei este texto alternativo',
    redactLabel: 'Ocultar na entrega',
    fieldsLabel: 'Campos do projeto a incluir',
    includeField: 'Incluir campo',
    redactField: 'Ocultar campo',
    fieldUnavailable: 'Não registrado localmente',
    fieldLabels: Object.fromEntries(Object.entries(FIELD_LABELS).map(([field, labels]) => [field, labels.pt])) as Record<ReleaseDraftField, string>,
    previewLabel: 'Prévia exata da entrega',
    previewDescription: 'Somente os itens incluídos abaixo podem entrar na solicitação explícita para a área de transferência. Itens ocultos e não selecionados permanecem neste dispositivo.',
    previewIncluded: 'Incluído na carga da área de transferência',
    previewOmitted: 'Omitido da carga da área de transferência',
    previewPurpose: 'Objetivo',
    previewAudience: 'Público',
    previewArtifactSource: 'Fonte',
    previewArtifactProvenance: 'Proveniência',
    previewFieldValue: 'Valor',
    previewMediaDetails: 'Arquivo local',
    previewAltText: 'Texto alternativo do idioma ativo',
    previewCaptionOmitted: 'A legenda é omitida da carga da área de transferência',
    previewNotSelected: 'Não selecionado',
    previewRedacted: 'Ocultado localmente',
    previewNoMedia: 'Nenhuma mídia selecionada; este é o caminho válido sem foto.',
    previewNoFields: 'Nenhum campo do projeto selecionado.',
    notRecorded: 'Não registrado localmente',
    reviewLabel: 'Estado da revisão',
    reviewed: 'Revisado para esta entrega',
    notReviewed: 'Precisa da minha revisão',
    validateLabel: 'Prontidão',
    ready: 'Pronto para uma entrega explícita no navegador',
    needsReview: 'Precisa de revisão antes da entrega',
    handoffLabel: 'Entrega pelo navegador',
    copyHandoff: 'Copiar texto revisado',
    handoffPrepared: 'Preparado localmente; a área de transferência não prova entrega na plataforma.',
    handoffUnknown: 'O resultado da área de transferência é desconhecido. Verifique o destino.',
    clipboardUnavailable: 'Área de transferência indisponível; nenhuma entrega foi afirmada.',
    withdraw: 'Retirar rascunho',
    withdrawn: 'Retirado localmente',
    withdrawnHint: 'Este rascunho foi retirado localmente. A edição e a entrega pelo navegador estão desativadas.',
    privateDefault: 'Novos rascunhos começam privados por padrão.',
    reviewHint: 'Somente campos e mídias revisados e não ocultos entram no texto copiado.',
    noDraft: 'Ainda não existe um rascunho de lançamento para este projeto.',
    delete: 'Excluir rascunho local',
    deleteTitle: 'Excluir este rascunho local?',
    deleteDescription: 'Isso remove apenas os metadados do rascunho armazenados neste dispositivo. Não pode retirar texto ou mídia já entregues ou copiados em outro lugar.',
    deleteConfirm: 'Excluir rascunho local',
    deleteCancel: 'Manter rascunho',
    deleteSuccess: 'Metadados do rascunho local excluídos.',
  },
};

export function getReleaseDraftCopy(language: ReleaseDraftLocale): ReleaseDraftCopy {
  return COPY[language] ?? COPY.en;
}

export function getReleaseDraftLocales(): readonly ReleaseDraftLocale[] {
  return Object.keys(COPY) as ReleaseDraftLocale[];
}

export const RELEASE_DRAFT_COPY = COPY;

export function assertReleaseDraftCopyParity(): true {
  const expected = ['en', 'de', 'fr', 'es', 'pt'] as const;
  if (expected.some((locale) => !COPY[locale])) throw new Error('Release Draft copy parity failure');
  return true;
}
