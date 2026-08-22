import type { LanguageCode } from './i18n';

export interface RecognitionCopy {
  cleanGradeTitle: string;
  cleanGradeBody: (count: number) => string;
  cleanGradeDismiss: string;
  checkGrading: string;
}

export const COPY: Record<LanguageCode, RecognitionCopy> = {
  en: {
    cleanGradeTitle: 'First clean grade',
    cleanGradeBody: (count) => `This set is Ready across ${count} sizes. A quiet checkpoint: the numbers line up. Nothing else is required.`,
    cleanGradeDismiss: 'Dismiss',
    checkGrading: 'Check grading',
  },
  de: {
    cleanGradeTitle: 'Erste saubere Gradierung',
    cleanGradeBody: (count) => `Dieser Satz ist für ${count} Größen als „Bereit“ eingestuft. Ein ruhiger Meilenstein: Die Zahlen stimmen. Du musst nichts weiter tun.`,
    cleanGradeDismiss: 'Schließen',
    checkGrading: 'Gradierung prüfen',
  },
  fr: {
    cleanGradeTitle: 'Première gradation validée',
    cleanGradeBody: (count) => `Cette série est « prête » pour ${count} tailles. Un repère discret : les chiffres s’alignent. Rien d’autre n’est requis.`,
    cleanGradeDismiss: 'Fermer',
    checkGrading: 'Vérifier la gradation',
  },
  es: {
    cleanGradeTitle: 'Primera gradación limpia',
    cleanGradeBody: (count) => `Este conjunto está « listo » para ${count} tallas. Un punto de referencia tranquilo: los números encajan. No tienes que hacer nada más.`,
    cleanGradeDismiss: 'Cerrar',
    checkGrading: 'Comprobar gradación',
  },
  pt: {
    cleanGradeTitle: 'Primeira graduação limpa',
    cleanGradeBody: (count) => `Este conjunto está « pronto » para ${count} tamanhos. Um marco discreto: os números estão alinhados. Não é preciso fazer mais nada.`,
    cleanGradeDismiss: 'Fechar',
    checkGrading: 'Verificar graduação',
  },
};

export function getRecognitionCopy(locale: string): RecognitionCopy {
  return COPY[locale.toLowerCase().split('-')[0] as LanguageCode] ?? COPY.en;
}
