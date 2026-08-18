import type { LanguageCode } from '@/lib/i18n';

export interface PdfLabels {
  by: string;
  designedBy: string;
  samplePattern: string;
  sampleDesigner: string;
  gauge: string;
  baseSize: string;
  yarnWeight: string;
  contents: string;
  materialsGauge: string;
  patternNotes: string;
  stitches: string;
  rows: string;
  per: string;
  designSize: string;
  measurement: string;
  weight: string;
  base: string;
  publication: string;
  important: string;
  note: string;
  tip: string;
  gradingNote: string;
  back: string;
  pdfExport: string;
  template: string;
  pdfTemplate: string;
  changeAccent: string;
  pickAccent: string;
  resetAccent: string;
  branding: string;
  yourLogo: string;
  replacesMark: string;
  removeLogo: string;
  processing: string;
  uploadLogo: string;
  imageErrorTitle: string;
  imageErrorFallback: string;
  include: string;
  coverPage: string;
  gaugeSummary: string;
  noneAdded: string;
  filename: string;
  filenamePlaceholder: string;
  exportFilename: string;
  usingSaved: string;
  namingRemembered: string;
  namingTip: string;
  preparing: string;
  exportPdf: string;
  printDialog: string;
  livePreview: string;
  page: string;
  loading: string;
  selectTemplate: string;
  measurements: string;
  moreSections: string;
  projectNotFound: string;
  returnDashboard: string;
  preflightTitle: string;
  preflightReady: string;
  preflightReadyDescription: string;
  artifactEvidence: (bytes: number, headings: number, tables: number) => string;
  preflightReview: string;
  preflightBlocked: string;
  preflightReviewDescription: (count: number) => string;
  preflightBlockedDescription: (count: number) => string;
  preflightCoverBudgetDescription: string;

}

const LABELS: Record<LanguageCode, PdfLabels> = {
  en: { by: 'by', designedBy: 'designed by', samplePattern: 'Sample Knitwear Pattern', sampleDesigner: 'by Designer', gauge: 'Gauge', baseSize: 'Base Size', yarnWeight: 'Yarn Weight', contents: 'Contents', materialsGauge: 'Materials & Gauge', patternNotes: 'Pattern Notes', stitches: 'Stitches', rows: 'Rows', per: 'per', designSize: 'design size', measurement: 'Measurement', weight: 'weight', base: 'Base', publication: 'A Stitch & Scale Publication', important: 'Important', note: 'Note', tip: 'Tip', gradingNote: 'All stitch counts are calculated from CYC standard body measurements using the gauge above. Match your gauge exactly before beginning.', back: 'Back', pdfExport: 'PDF Export', template: 'Template', pdfTemplate: 'PDF template', changeAccent: 'Change accent color', pickAccent: 'Pick accent color', resetAccent: 'Reset accent to theme default', branding: 'Branding', yourLogo: 'Your logo', replacesMark: 'Replaces the Stitch & Scale mark on the cover', removeLogo: 'Remove custom logo', processing: 'Processing…', uploadLogo: 'Upload your logo', imageErrorTitle: 'Could not use this image', imageErrorFallback: 'The image could not be processed.', include: 'Include', coverPage: 'Cover Page', gaugeSummary: 'Gauge Summary', noneAdded: 'none added', filename: 'Filename', filenamePlaceholder: 'Pattern filename…', exportFilename: 'Export filename', usingSaved: 'Using your saved naming style.', namingRemembered: 'Your naming style will be remembered after the first export.', namingTip: 'The filename is a suggestion — you can rename it before every export, and your preferred naming style will be remembered.', preparing: 'Preparing your PDF…', exportPdf: 'Export PDF', printDialog: 'A print dialog will open — choose “Save as PDF” there to finish', livePreview: 'Live preview', page: 'Page', loading: 'Loading…', selectTemplate: 'Select a template to preview', measurements: 'measurements', moreSections: 'more sections', projectNotFound: 'Project Not Found', returnDashboard: 'Return to Dashboard', preflightTitle: 'Export preflight', preflightReady: 'Ready to print', preflightReadyDescription: 'The pattern passed the automated checks currently available.', artifactEvidence: (bytes, headings, tables) => `Rendered artifact: ${bytes} bytes · ${headings} headings · ${tables} tables.`, preflightReview: 'Review before printing', preflightBlocked: 'Fix before printing', preflightReviewDescription: (count) => `${count} review note(s) remain. The preview is available, but check them before publishing.`, preflightBlockedDescription: (count) => `${count} blocking issue(s) must be fixed before this pattern can be printed.`, preflightCoverBudgetDescription: 'The cover title or notes are too long for the safe footer area. Shorten them or review the cover before printing.' },
  de: { by: 'von', designedBy: 'entworfen von', samplePattern: 'Beispiel-Strickmuster', sampleDesigner: 'von Designer', gauge: 'Maschenprobe', baseSize: 'Ausgangsgröße', yarnWeight: 'Garnstärke', contents: 'Inhalt', materialsGauge: 'Material & Maschenprobe', patternNotes: 'Musternotizen', stitches: 'Maschen', rows: 'Reihen', per: 'pro', designSize: 'Designgröße', measurement: 'Maß', weight: 'Stärke', base: 'Basis', publication: 'Eine Stitch-&-Scale-Publikation', important: 'Wichtig', note: 'Notiz', tip: 'Tipp', gradingNote: 'Alle Maschenzahlen werden anhand der CYC-Standardkörpermaße und der obigen Maschenprobe berechnet. Prüfe deine Maschenprobe vor dem Beginn genau.', back: 'Zurück', pdfExport: 'PDF-Export', template: 'Vorlage', pdfTemplate: 'PDF-Vorlage', changeAccent: 'Akzentfarbe ändern', pickAccent: 'Akzentfarbe wählen', resetAccent: 'Akzent auf Voreinstellung zurücksetzen', branding: 'Markenauftritt', yourLogo: 'Dein Logo', replacesMark: 'Ersetzt das Stitch-&-Scale-Zeichen auf dem Titelblatt', removeLogo: 'Eigenes Logo entfernen', processing: 'Wird verarbeitet…', uploadLogo: 'Logo hochladen', imageErrorTitle: 'Dieses Bild konnte nicht verwendet werden', imageErrorFallback: 'Das Bild konnte nicht verarbeitet werden.', include: 'Einfügen', coverPage: 'Titelblatt', gaugeSummary: 'Maschenproben-Zusammenfassung', noneAdded: 'nicht vorhanden', filename: 'Dateiname', filenamePlaceholder: 'Musterd​​ateiname…', exportFilename: 'Export-Dateiname', usingSaved: 'Dein gespeicherter Benennungsstil wird verwendet.', namingRemembered: 'Dein Benennungsstil wird nach dem ersten Export gespeichert.', namingTip: 'Der Dateiname ist ein Vorschlag – du kannst ihn vor jedem Export ändern, und dein Benennungsstil wird gespeichert.', preparing: 'PDF wird vorbereitet…', exportPdf: 'PDF exportieren', printDialog: 'Ein Druckdialog wird geöffnet – wähle dort „Als PDF speichern“.', livePreview: 'Live-Vorschau', page: 'Seite', loading: 'Wird geladen…', selectTemplate: 'Wähle eine Vorlage für die Vorschau', measurements: 'Messungen', moreSections: 'weitere Abschnitte', projectNotFound: 'Projekt nicht gefunden', returnDashboard: 'Zur Übersicht', preflightTitle: 'Exportprüfung', preflightReady: 'Druckbereit', preflightReadyDescription: 'Das Muster hat die derzeit verfügbaren automatischen Prüfungen bestanden.', artifactEvidence: (bytes, headings, tables) => `Gerendertes Artefakt: ${bytes} Bytes · ${headings} Überschriften · ${tables} Tabellen.`, preflightReview: 'Vor dem Drucken prüfen', preflightBlocked: 'Vor dem Drucken korrigieren', preflightReviewDescription: (count) => `${count} Prüfhinweis(e) sind noch offen. Die Vorschau ist verfügbar, aber prüfe sie vor der Veröffentlichung.`, preflightBlockedDescription: (count) => `${count} blockierende(s) Problem(e) müssen behoben werden, bevor dieses Muster gedruckt werden kann.`, preflightCoverBudgetDescription: 'Der Titel oder die Notizen auf dem Titelblatt sind zu lang für den sicheren Fußbereich. Kürze sie oder prüfe das Titelblatt vor dem Drucken.' },
  fr: { by: 'par', designedBy: 'créé par', samplePattern: 'Modèle de tricot exemple', sampleDesigner: 'par le designer', gauge: 'Échantillon', baseSize: 'Taille de base', yarnWeight: 'Épaisseur du fil', contents: 'Sommaire', materialsGauge: 'Matériel et échantillon', patternNotes: 'Notes du patron', stitches: 'Mailles', rows: 'Rangs', per: 'pour', designSize: 'taille du modèle', measurement: 'Mesure', weight: 'épaisseur', base: 'Base', publication: 'Une publication Stitch & Scale', important: 'Important', note: 'Note', tip: 'Conseil', gradingNote: 'Tous les nombres de mailles sont calculés à partir des mesures corporelles standard CYC avec l’échantillon ci-dessus. Vérifiez précisément votre échantillon avant de commencer.', back: 'Retour', pdfExport: 'Export PDF', template: 'Modèle', pdfTemplate: 'Modèle PDF', changeAccent: 'Modifier la couleur d’accent', pickAccent: 'Choisir la couleur d’accent', resetAccent: 'Réinitialiser la couleur d’accent', branding: 'Identité visuelle', yourLogo: 'Votre logo', replacesMark: 'Remplace la marque Stitch & Scale sur la couverture', removeLogo: 'Supprimer le logo personnalisé', processing: 'Traitement…', uploadLogo: 'Importer votre logo', imageErrorTitle: 'Impossible d’utiliser cette image', imageErrorFallback: 'L’image n’a pas pu être traitée.', include: 'Inclure', coverPage: 'Page de couverture', gaugeSummary: 'Résumé de l’échantillon', noneAdded: 'aucune note', filename: 'Nom du fichier', filenamePlaceholder: 'Nom du patron…', exportFilename: 'Nom du fichier exporté', usingSaved: 'Votre style de nommage enregistré est utilisé.', namingRemembered: 'Votre style de nommage sera mémorisé après le premier export.', namingTip: 'Le nom de fichier est une suggestion — vous pouvez le modifier avant chaque export et votre style de nommage sera mémorisé.', preparing: 'Préparation du PDF…', exportPdf: 'Exporter le PDF', printDialog: 'Une boîte d’impression va s’ouvrir — choisissez « Enregistrer au format PDF » pour terminer.', livePreview: 'Aperçu en direct', page: 'Page', loading: 'Chargement…', selectTemplate: 'Sélectionnez un modèle pour afficher l’aperçu', measurements: 'mesures', moreSections: 'sections supplémentaires', projectNotFound: 'Projet introuvable', returnDashboard: 'Retour au tableau de bord', preflightTitle: 'Vérification de l’export', preflightReady: 'Prêt à imprimer', preflightReadyDescription: 'Le modèle a réussi les contrôles automatiques actuellement disponibles.', artifactEvidence: (bytes, headings, tables) => `Artefact rendu : ${bytes} octets · ${headings} titres · ${tables} tableaux.`, preflightReview: 'À vérifier avant impression', preflightBlocked: 'À corriger avant impression', preflightReviewDescription: (count) => `${count} note(s) de vérification restent ouvertes. L’aperçu est disponible, mais vérifiez-les avant publication.`, preflightBlockedDescription: (count) => `${count} problème(s) bloquant(s) doivent être corrigés avant l’impression de ce modèle.`, preflightCoverBudgetDescription: 'Le titre ou les notes de couverture sont trop longs pour la zone de pied de page sûre. Raccourcissez-les ou vérifiez la couverture avant impression.' },
  es: { by: 'por', designedBy: 'diseñado por', samplePattern: 'Patrón de punto de ejemplo', sampleDesigner: 'por el diseñador', gauge: 'Muestra', baseSize: 'Talla base', yarnWeight: 'Grosor del hilo', contents: 'Contenido', materialsGauge: 'Materiales y muestra', patternNotes: 'Notas del patrón', stitches: 'Puntos', rows: 'Vueltas', per: 'por', designSize: 'talla de diseño', measurement: 'Medida', weight: 'grosor', base: 'Base', publication: 'Una publicación de Stitch & Scale', important: 'Importante', note: 'Nota', tip: 'Consejo', gradingNote: 'Todos los conteos de puntos se calculan con las medidas corporales estándar de CYC y la muestra anterior. Comprueba bien tu muestra antes de empezar.', back: 'Atrás', pdfExport: 'Exportar PDF', template: 'Plantilla', pdfTemplate: 'plantilla PDF', changeAccent: 'Cambiar color de acento', pickAccent: 'Elegir color de acento', resetAccent: 'Restablecer color de acento', branding: 'Marca', yourLogo: 'Tu logo', replacesMark: 'Reemplaza la marca de Stitch & Scale en la portada', removeLogo: 'Eliminar logo personalizado', processing: 'Procesando…', uploadLogo: 'Subir tu logo', imageErrorTitle: 'No se pudo usar esta imagen', imageErrorFallback: 'No se pudo procesar la imagen.', include: 'Incluir', coverPage: 'Portada', gaugeSummary: 'Resumen de muestra', noneAdded: 'no se añadió', filename: 'Nombre de archivo', filenamePlaceholder: 'Nombre del patrón…', exportFilename: 'Nombre de exportación', usingSaved: 'Se está usando tu estilo de nombres guardado.', namingRemembered: 'Tu estilo de nombres se recordará después del primer exportación.', namingTip: 'El nombre de archivo es una sugerencia — puedes cambiarlo antes de cada exportación y se recordará tu estilo de nombres.', preparing: 'Preparando tu PDF…', exportPdf: 'Exportar PDF', printDialog: 'Se abrirá un diálogo de impresión — elige «Guardar como PDF» para terminar.', livePreview: 'Vista previa en vivo', page: 'Página', loading: 'Cargando…', selectTemplate: 'Selecciona una plantilla para previsualizar', measurements: 'medidas', moreSections: 'secciones más', projectNotFound: 'Proyecto no encontrado', returnDashboard: 'Volver al panel', preflightTitle: 'Comprobación de exportación', preflightReady: 'Listo para imprimir', preflightReadyDescription: 'El patrón superó las comprobaciones automáticas disponibles actualmente.', artifactEvidence: (bytes, headings, tables) => `Artefacto renderizado: ${bytes} bytes · ${headings} encabezados · ${tables} tablas.`, preflightReview: 'Revisar antes de imprimir', preflightBlocked: 'Corregir antes de imprimir', preflightReviewDescription: (count) => `Quedan ${count} nota(s) de revisión. La vista previa está disponible, pero compruébalas antes de publicar.`, preflightBlockedDescription: (count) => `${count} problema(s) bloqueante(s) deben corregirse antes de imprimir este patrón.`, preflightCoverBudgetDescription: 'El título o las notas de la portada son demasiado largos para la zona segura del pie. Acórtalos o revisa la portada antes de imprimir.' },
  pt: { by: 'por', designedBy: 'desenhado por', samplePattern: 'Padrão de malha de exemplo', sampleDesigner: 'pelo designer', gauge: 'Amostra', baseSize: 'Tamanho base', yarnWeight: 'Espessura do fio', contents: 'Conteúdo', materialsGauge: 'Materiais e amostra', patternNotes: 'Notas do padrão', stitches: 'Pontos', rows: 'Carreiras', per: 'por', designSize: 'tamanho do modelo', measurement: 'Medida', weight: 'espessura', base: 'Base', publication: 'Uma publicação Stitch & Scale', important: 'Importante', note: 'Nota', tip: 'Dica', gradingNote: 'Todas as contagens de pontos são calculadas a partir das medidas corporais padrão CYC usando a amostra acima. Confirme cuidadosamente a sua amostra antes de começar.', back: 'Voltar', pdfExport: 'Exportar PDF', template: 'Modelo', pdfTemplate: 'modelo PDF', changeAccent: 'Alterar cor de destaque', pickAccent: 'Escolher cor de destaque', resetAccent: 'Repor cor de destaque', branding: 'Identidade', yourLogo: 'O seu logótipo', replacesMark: 'Substitui a marca Stitch & Scale na capa', removeLogo: 'Remover logótipo personalizado', processing: 'A processar…', uploadLogo: 'Carregar o seu logótipo', imageErrorTitle: 'Não foi possível usar esta imagem', imageErrorFallback: 'Não foi possível processar a imagem.', include: 'Incluir', coverPage: 'Capa', gaugeSummary: 'Resumo da amostra', noneAdded: 'não adicionado', filename: 'Nome do ficheiro', filenamePlaceholder: 'Nome do padrão…', exportFilename: 'Nome do ficheiro de exportação', usingSaved: 'A utilizar o seu estilo de nomes guardado.', namingRemembered: 'O seu estilo de nomes será guardado após a primeira exportação.', namingTip: 'O nome do ficheiro é uma sugestão — pode alterá-lo antes de cada exportação e o seu estilo de nomes será guardado.', preparing: 'A preparar o PDF…', exportPdf: 'Exportar PDF', printDialog: 'Será aberta uma janela de impressão — escolha “Guardar como PDF” para terminar.', livePreview: 'Pré-visualização ao vivo', page: 'Página', loading: 'A carregar…', selectTemplate: 'Selecione um modelo para pré-visualizar', measurements: 'medidas', moreSections: 'mais secções', projectNotFound: 'Projeto não encontrado', returnDashboard: 'Voltar ao painel', preflightTitle: 'Verificação da exportação', preflightReady: 'Pronto para imprimir', preflightReadyDescription: 'O padrão passou nas verificações automáticas disponíveis neste momento.', artifactEvidence: (bytes, headings, tables) => `Artefacto renderizado: ${bytes} bytes · ${headings} títulos · ${tables} tabelas.`, preflightReview: 'Rever antes de imprimir', preflightBlocked: 'Corrigir antes de imprimir', preflightReviewDescription: (count) => `Ainda há ${count} nota(s) de revisão. A pré-visualização está disponível, mas reveja-as antes de publicar.`, preflightBlockedDescription: (count) => `${count} problema(s) bloqueador(es) têm de ser corrigidos antes de imprimir este padrão.`, preflightCoverBudgetDescription: 'O título ou as notas da capa são demasiado longos para a zona segura do rodapé. Encurte-os ou reveja a capa antes de imprimir.' },
};

export function getPdfLabels(locale: string): PdfLabels {
  const code = locale.toLowerCase().split('-')[0] as LanguageCode;
  return LABELS[code] ?? LABELS.en;
}
