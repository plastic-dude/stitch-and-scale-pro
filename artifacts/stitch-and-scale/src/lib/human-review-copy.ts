import type { LanguageCode } from '@/lib/i18n';
import type { HumanReviewStatus } from '@/lib/grading-engine';

export interface HumanReviewCopy {
  title: string;
  description: string;
  automatedLabel: string;
  automatedClean: string;
  automatedNeedsWork: string;
  reviewerLabel: string;
  reviewerPlaceholder: string;
  noteLabel: string;
  notePlaceholder: string;
  saveInReview: string;
  requestChanges: string;
  approve: string;
  reset: string;
  approvedNeedsClean: string;
  saved: string;
  statusLabels: Record<HumanReviewStatus, string>;
}

const COPY: Record<LanguageCode, HumanReviewCopy> = {
  en: {
    title: 'Human review record',
    description: 'Keep the automated numbers check separate from a real person’s review. This record travels with the project backup.',
    automatedLabel: 'Automated numbers check',
    automatedClean: 'Clean — ready for a human prose and presentation pass.',
    automatedNeedsWork: 'Needs attention before a reviewer can approve this draft.',
    reviewerLabel: 'Reviewer name',
    reviewerPlaceholder: 'You or your technical editor',
    noteLabel: 'Review note',
    notePlaceholder: 'What was checked, changed, or left for the next pass?',
    saveInReview: 'Mark in review',
    requestChanges: 'Request changes',
    approve: 'Approve handoff',
    reset: 'Clear review record',
    approvedNeedsClean: 'Resolve automated errors before approving a handoff.',
    saved: 'Review record saved',
    statusLabels: { 'not-reviewed': 'Not reviewed', 'in-review': 'In review', 'changes-requested': 'Changes requested', approved: 'Human approved' },
  },
  de: {
    title: 'Menschliches Prüfprotokoll',
    description: 'Automatische Zahlenprüfung und menschliche Prüfung bleiben getrennt. Dieser Eintrag reist mit der Projektsicherung mit.',
    automatedLabel: 'Automatische Zahlenprüfung',
    automatedClean: 'Sauber — bereit für eine menschliche Prüfung von Text und Darstellung.',
    automatedNeedsWork: 'Vor der Freigabe durch eine prüfende Person ist Aufmerksamkeit nötig.',
    reviewerLabel: 'Name der prüfenden Person',
    reviewerPlaceholder: 'Du oder dein technischer Editor',
    noteLabel: 'Prüfnotiz',
    notePlaceholder: 'Was wurde geprüft, geändert oder für den nächsten Durchgang offengelassen?',
    saveInReview: 'Prüfung beginnen',
    requestChanges: 'Änderungen anfordern',
    approve: 'Übergabe freigeben',
    reset: 'Prüfprotokoll löschen',
    approvedNeedsClean: 'Behebe automatische Fehler vor der Freigabe.',
    saved: 'Prüfprotokoll gespeichert',
    statusLabels: { 'not-reviewed': 'Nicht geprüft', 'in-review': 'In Prüfung', 'changes-requested': 'Änderungen angefordert', approved: 'Menschlich freigegeben' },
  },
  fr: {
    title: 'Suivi de revue humaine',
    description: 'La vérification automatique des chiffres reste distincte de la revue par une personne. Cette trace accompagne la sauvegarde du projet.',
    automatedLabel: 'Vérification automatique des chiffres',
    automatedClean: 'Propre — prêt pour une revue humaine du texte et de la présentation.',
    automatedNeedsWork: 'Des corrections sont nécessaires avant l’approbation humaine.',
    reviewerLabel: 'Nom de la personne qui vérifie',
    reviewerPlaceholder: 'Vous ou votre éditeur technique',
    noteLabel: 'Note de revue',
    notePlaceholder: 'Qu’est-ce qui a été vérifié, modifié ou laissé pour la prochaine passe ?',
    saveInReview: 'Marquer en revue',
    requestChanges: 'Demander des corrections',
    approve: 'Approuver la remise',
    reset: 'Effacer la revue',
    approvedNeedsClean: 'Corrigez les erreurs automatiques avant d’approuver la remise.',
    saved: 'Suivi de revue enregistré',
    statusLabels: { 'not-reviewed': 'Non vérifié', 'in-review': 'En revue', 'changes-requested': 'Corrections demandées', approved: 'Approuvé par une personne' },
  },
  es: {
    title: 'Registro de revisión humana',
    description: 'La comprobación automática de números permanece separada de la revisión de una persona. Este registro viaja con la copia del proyecto.',
    automatedLabel: 'Comprobación automática de números',
    automatedClean: 'Correcta — lista para una revisión humana del texto y la presentación.',
    automatedNeedsWork: 'Necesita atención antes de que una persona pueda aprobar esta entrega.',
    reviewerLabel: 'Nombre de quien revisa',
    reviewerPlaceholder: 'Tú o tu editora técnica',
    noteLabel: 'Nota de revisión',
    notePlaceholder: '¿Qué se comprobó, cambió o quedó para la próxima revisión?',
    saveInReview: 'Marcar en revisión',
    requestChanges: 'Solicitar cambios',
    approve: 'Aprobar entrega',
    reset: 'Borrar registro',
    approvedNeedsClean: 'Resuelve los errores automáticos antes de aprobar la entrega.',
    saved: 'Registro de revisión guardado',
    statusLabels: { 'not-reviewed': 'Sin revisar', 'in-review': 'En revisión', 'changes-requested': 'Cambios solicitados', approved: 'Aprobada por una persona' },
  },
  pt: {
    title: 'Registo de revisão humana',
    description: 'A verificação automática dos números fica separada da revisão de uma pessoa. Este registo acompanha a cópia de segurança do projeto.',
    automatedLabel: 'Verificação automática dos números',
    automatedClean: 'Limpa — pronta para uma revisão humana do texto e da apresentação.',
    automatedNeedsWork: 'Precisa de atenção antes de uma pessoa poder aprovar esta entrega.',
    reviewerLabel: 'Nome de quem revê',
    reviewerPlaceholder: 'Você ou o seu editor técnico',
    noteLabel: 'Nota de revisão',
    notePlaceholder: 'O que foi verificado, alterado ou deixado para a próxima passagem?',
    saveInReview: 'Marcar em revisão',
    requestChanges: 'Pedir alterações',
    approve: 'Aprovar entrega',
    reset: 'Limpar registo',
    approvedNeedsClean: 'Resolva os erros automáticos antes de aprovar a entrega.',
    saved: 'Registo de revisão guardado',
    statusLabels: { 'not-reviewed': 'Não revista', 'in-review': 'Em revisão', 'changes-requested': 'Alterações pedidas', approved: 'Aprovada por uma pessoa' },
  },
};

export function getHumanReviewCopy(locale: string): HumanReviewCopy {
  return COPY[locale.toLowerCase().split('-')[0] as LanguageCode] ?? COPY.en;
}
