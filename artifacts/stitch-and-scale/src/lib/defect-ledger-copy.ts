import type { LanguageCode } from '@/lib/i18n';

export interface DefectLedgerCopy {
  title: string;
  description: string;
  recordFindings: string;
  recorded: (count: number) => string;
  empty: string;
  open: string;
  accepted: string;
  fixed: string;
  severity: Record<'error' | 'warn' | 'info', string>;
  status: Record<'open' | 'accepted' | 'fixed', string>;
  disposition: Record<'verified' | 'needs-designer-decision' | 'requires-test-knit', string>;
  noDisposition: string;
}

const COPY: Record<LanguageCode, DefectLedgerCopy> = {
  en: {
    title: 'Technical-editor defect ledger', description: 'Record QA evidence and the decision still needed before publication.', recordFindings: 'Record current QA findings', recorded: (count) => `${count} finding(s) recorded.`, empty: 'No findings have been recorded for this review yet.', open: 'Open', accepted: 'Accepted', fixed: 'Fixed', severity: { error: 'Error', warn: 'Warning', info: 'Info' }, status: { open: 'Open', accepted: 'Accepted', fixed: 'Fixed' }, disposition: { verified: 'Verified', 'needs-designer-decision': 'Needs designer decision', 'requires-test-knit': 'Requires test knit' }, noDisposition: 'No disposition yet',
  },
  de: {
    title: 'Fehlerprotokoll für die technische Redaktion', description: 'QA-Nachweise und offene Entscheidungen vor der Veröffentlichung festhalten.', recordFindings: 'Aktuelle QA-Befunde erfassen', recorded: (count) => `${count} Befund(e) erfasst.`, empty: 'Für diese Prüfung wurden noch keine Befunde erfasst.', open: 'Offen', accepted: 'Akzeptiert', fixed: 'Behoben', severity: { error: 'Fehler', warn: 'Warnung', info: 'Info' }, status: { open: 'Offen', accepted: 'Akzeptiert', fixed: 'Behoben' }, disposition: { verified: 'Verifiziert', 'needs-designer-decision': 'Designerentscheidung nötig', 'requires-test-knit': 'Teststrick erforderlich' }, noDisposition: 'Noch keine Entscheidung',
  },
  fr: {
    title: 'Registre des défauts de révision technique', description: 'Conservez les preuves de QA et les décisions nécessaires avant publication.', recordFindings: 'Enregistrer les résultats QA', recorded: (count) => `${count} constat(s) enregistré(s).`, empty: 'Aucun constat n’a encore été enregistré pour cette vérification.', open: 'Ouvert', accepted: 'Accepté', fixed: 'Corrigé', severity: { error: 'Erreur', warn: 'Alerte', info: 'Info' }, status: { open: 'Ouvert', accepted: 'Accepté', fixed: 'Corrigé' }, disposition: { verified: 'Vérifié', 'needs-designer-decision': 'Décision du designer nécessaire', 'requires-test-knit': 'Test tricot requis' }, noDisposition: 'Aucune décision',
  },
  es: {
    title: 'Registro de defectos de edición técnica', description: 'Guarda las pruebas de QA y las decisiones pendientes antes de publicar.', recordFindings: 'Registrar hallazgos de QA', recorded: (count) => `${count} hallazgo(s) registrado(s).`, empty: 'Aún no se han registrado hallazgos para esta revisión.', open: 'Abierto', accepted: 'Aceptado', fixed: 'Corregido', severity: { error: 'Error', warn: 'Aviso', info: 'Info' }, status: { open: 'Abierto', accepted: 'Aceptado', fixed: 'Corregido' }, disposition: { verified: 'Verificado', 'needs-designer-decision': 'Requiere decisión del diseñador', 'requires-test-knit': 'Requiere test knit' }, noDisposition: 'Sin decisión',
  },
  pt: {
    title: 'Registo de defeitos de edição técnica', description: 'Registe evidências de QA e decisões pendentes antes da publicação.', recordFindings: 'Registar resultados de QA', recorded: (count) => `${count} resultado(s) registado(s).`, empty: 'Ainda não há resultados registados para esta verificação.', open: 'Aberto', accepted: 'Aceite', fixed: 'Corrigido', severity: { error: 'Erro', warn: 'Aviso', info: 'Info' }, status: { open: 'Aberto', accepted: 'Aceite', fixed: 'Corrigido' }, disposition: { verified: 'Verificado', 'needs-designer-decision': 'Requer decisão do designer', 'requires-test-knit': 'Requer test knit' }, noDisposition: 'Sem decisão',
  },
};

export function getDefectLedgerCopy(locale: string): DefectLedgerCopy {
  return COPY[locale.toLowerCase().split('-')[0] as LanguageCode] ?? COPY.en;
}
