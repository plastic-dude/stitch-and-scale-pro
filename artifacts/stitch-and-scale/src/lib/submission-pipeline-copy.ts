import type { LanguageCode } from '@/lib/i18n';

export interface SubmissionPipelineCopy {
  title: string;
  description: string;
  callsTracked: string;
  addCall: string;
  noCalls: string;
  untitled: string;
  editView: string;
  callDetails: string;
  publicationPlaceholder: string;
  issuePlaceholder: string;
  offerComparison: string;
  compareBaseline: string;
  submissionPack: string;
  copyCoverLetter: string;
  coverLetter: string;
  copied: string;
  pasteHint: string;
  productionRates: string;
  analysis: string;
  notSet: string;
}

const EN: SubmissionPipelineCopy = {
  title: 'Submission Pipeline',
  description: 'Track publication calls, deadlines, production dates, and the economics of an exclusive offer in one local-first record.',
  callsTracked: 'Calls you’re tracking',
  addCall: 'Add call',
  noCalls: 'No calls yet — add one from a publication’s “Call for Submissions” page.',
  untitled: 'Untitled call',
  editView: 'Edit / View',
  callDetails: 'Call details',
  publicationPlaceholder: 'Publication name',
  issuePlaceholder: 'Issue or theme',
  offerComparison: 'Offer vs self-publishing',
  compareBaseline: 'Compare against solo baseline',
  submissionPack: 'Submission pack — the six parts editors expect',
  copyCoverLetter: 'Copy cover letter',
  coverLetter: 'Cover letter',
  copied: 'Copied',
  pasteHint: 'Paste it wherever you need it.',
  productionRates: 'Your production rates',
  analysis: 'Analysis',
  notSet: 'not set',
};

const DE: SubmissionPipelineCopy = {
  title: 'Einreichungs-Pipeline',
  description: 'Verwalte Ausschreibungen, Fristen, Produktionsdaten und die Wirtschaftlichkeit exklusiver Angebote in einem lokalen Datensatz.',
  callsTracked: 'Verfolgte Ausschreibungen', addCall: 'Ausschreibung hinzufügen', noCalls: 'Noch keine Ausschreibungen — füge eine über die Seite „Call for Submissions“ hinzu.', untitled: 'Unbenannte Ausschreibung', editView: 'Bearbeiten / Anzeigen', callDetails: 'Details zur Ausschreibung', publicationPlaceholder: 'Name der Publikation', issuePlaceholder: 'Ausgabe oder Thema', offerComparison: 'Angebot vs. Selbstveröffentlichung', compareBaseline: 'Mit eigener Basis vergleichen', submissionPack: 'Einreichungspaket — sechs erwartete Bestandteile', copyCoverLetter: 'Anschreiben kopieren', coverLetter: 'Anschreiben', copied: 'Kopiert', pasteHint: 'Füge es dort ein, wo du es brauchst.', productionRates: 'Deine Produktionsraten', analysis: 'Analyse', notSet: 'nicht festgelegt',
};
const FR: SubmissionPipelineCopy = {
  title: 'Pipeline de soumissions', description: 'Suivez les appels, échéances, dates de production et l’économie d’une offre exclusive dans un registre local.', callsTracked: 'Appels suivis', addCall: 'Ajouter un appel', noCalls: 'Aucun appel — ajoutez-en un depuis la page « Call for Submissions » d’une publication.', untitled: 'Appel sans titre', editView: 'Modifier / Voir', callDetails: 'Détails de l’appel', publicationPlaceholder: 'Nom de la publication', issuePlaceholder: 'Numéro ou thème', offerComparison: 'Offre vs autoédition', compareBaseline: 'Comparer à votre base solo', submissionPack: 'Dossier de soumission — les six éléments attendus', copyCoverLetter: 'Copier la lettre', coverLetter: 'Lettre de présentation', copied: 'Copié', pasteHint: 'Collez-la où vous en avez besoin.', productionRates: 'Vos cadences de production', analysis: 'Analyse', notSet: 'non défini',
};
const ES: SubmissionPipelineCopy = {
  title: 'Flujo de envíos', description: 'Registra convocatorias, fechas límite, producción y la economía de una oferta exclusiva en un registro local.', callsTracked: 'Convocatorias seguidas', addCall: 'Añadir convocatoria', noCalls: 'Aún no hay convocatorias — añade una desde la página «Call for Submissions» de una publicación.', untitled: 'Convocatoria sin título', editView: 'Editar / Ver', callDetails: 'Detalles de la convocatoria', publicationPlaceholder: 'Nombre de la publicación', issuePlaceholder: 'Número o tema', offerComparison: 'Oferta frente a autoedición', compareBaseline: 'Comparar con la base propia', submissionPack: 'Paquete de envío — las seis partes que esperan los editores', copyCoverLetter: 'Copiar carta', coverLetter: 'Carta de presentación', copied: 'Copiado', pasteHint: 'Pégala donde la necesites.', productionRates: 'Tus ritmos de producción', analysis: 'Análisis', notSet: 'sin definir',
};
const PT: SubmissionPipelineCopy = {
  title: 'Fluxo de submissões', description: 'Registe chamadas, prazos, datas de produção e a economia de uma oferta exclusiva num registo local.', callsTracked: 'Chamadas acompanhadas', addCall: 'Adicionar chamada', noCalls: 'Ainda não há chamadas — adicione uma a partir da página “Call for Submissions” de uma publicação.', untitled: 'Chamada sem título', editView: 'Editar / Ver', callDetails: 'Detalhes da chamada', publicationPlaceholder: 'Nome da publicação', issuePlaceholder: 'Edição ou tema', offerComparison: 'Oferta vs. autopublicação', compareBaseline: 'Comparar com a base própria', submissionPack: 'Pacote de submissão — as seis partes esperadas pelos editores', copyCoverLetter: 'Copiar carta', coverLetter: 'Carta de apresentação', copied: 'Copiado', pasteHint: 'Cole-a onde precisar.', productionRates: 'Os seus ritmos de produção', analysis: 'Análise', notSet: 'não definido',
};

export const SUBMISSION_PIPELINE_COPY: Record<LanguageCode, SubmissionPipelineCopy> = { en: EN, de: DE, fr: FR, es: ES, pt: PT };
