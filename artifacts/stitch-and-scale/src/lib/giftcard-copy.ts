import type { LanguageCode } from '@/lib/i18n';
export interface GiftCardCopy { intro:string; cardSales:string; refundCredit:string; redemption:string; uplift:string; lag:string; dormancy:string; escheat:string; reset:string; cash:string; redemptions:string; breakage:string; liability:string; profit:string; flags:string; verdict:string; noFlags:string }
const en:GiftCardCopy={intro:'Price your gift-card and store-credit programme the honest accounting way: cash-in float versus liability, breakage, escheat, cash-back laws, and refund-credit loops.',cardSales:'Card sales per month',refundCredit:'Refund credit issued per month',redemption:'Redemption rate',uplift:'Spend uplift when redeeming',lag:'Redemption lag',dormancy:'Dormancy / escheat clock',escheat:'State escheat treatment',reset:'Reset to demo',cash:'Cash collected',redemptions:'Expected redemptions',breakage:'Kept breakage',liability:'Ending liability',profit:'Recognized profit',flags:'Watch-out flags',verdict:'Verdict',noFlags:'No flags — programme structure is clean.'};
const de:GiftCardCopy={...en,intro:'Bewerte dein Gutschein- und Guthabenprogramm ehrlich: eingehender Zahlungsfluss gegenüber Verbindlichkeiten, Verfall, staatlicher Einzug, Auszahlungsregeln und Rückerstattungsschleifen.',cardSales:'Gutscheinverkäufe pro Monat',refundCredit:'Ausgegebenes Rückerstattungsguthaben pro Monat',redemption:'Einlösungsquote',uplift:'Mehrumsatz bei Einlösung',lag:'Einlösungsverzögerung',dormancy:'Inaktivitäts-/Einziehungsfrist',escheat:'Staatliche Einziehungsregel',reset:'Demo zurücksetzen',cash:'Eingegangene Zahlungen',redemptions:'Erwartete Einlösungen',breakage:'Einbehaltener Verfall',liability:'Endverbindlichkeit',profit:'Erkannter Gewinn',flags:'Warnhinweise',verdict:'Ergebnis',noFlags:'Keine Warnungen — die Programmstruktur ist sauber.'};
const fr:GiftCardCopy={...en,intro:'Évaluez honnêtement votre programme de cartes-cadeaux et crédits: trésorerie reçue contre passif, rupture, déshérence, remboursements en espèces et boucles de crédit.',cardSales:'Ventes de cartes par mois',refundCredit:'Crédit de remboursement émis par mois',redemption:'Taux d’utilisation',uplift:'Surcroît de dépense à l’utilisation',lag:'Délai d’utilisation',dormancy:'Délai d’inactivité/déshérence',escheat:'Règle de déshérence de l’État',reset:'Réinitialiser la démo',cash:'Encaissement',redemptions:'Utilisations prévues',breakage:'Rupture conservée',liability:'Passif final',profit:'Bénéfice reconnu',flags:'Points de vigilance',verdict:'Verdict',noFlags:'Aucun signal — la structure est saine.'};
const es:GiftCardCopy={...en,intro:'Calcula tu programa de tarjetas y créditos con contabilidad honesta: efectivo recibido frente a pasivos, caducidad, abandono, pagos en efectivo y bucles de reembolso.',cardSales:'Ventas de tarjetas al mes',refundCredit:'Crédito de reembolso emitido al mes',redemption:'Tasa de canje',uplift:'Aumento del gasto al canjear',lag:'Retraso del canje',dormancy:'Plazo de inactividad/abandono',escheat:'Regla estatal de abandono',reset:'Restablecer demo',cash:'Efectivo cobrado',redemptions:'Canjes previstos',breakage:'Caducidad retenida',liability:'Pasivo final',profit:'Beneficio reconocido',flags:'Alertas',verdict:'Veredicto',noFlags:'Sin alertas: la estructura del programa es sólida.'};
const pt:GiftCardCopy={...en,intro:'Avalie o programa de cartões e créditos com contabilidade honesta: dinheiro recebido versus responsabilidade, saldos não usados, abandono, reembolsos em dinheiro e ciclos de crédito.',cardSales:'Vendas de cartões por mês',refundCredit:'Crédito de reembolso emitido por mês',redemption:'Taxa de utilização',uplift:'Aumento do gasto ao utilizar',lag:'Atraso da utilização',dormancy:'Prazo de inatividade/abandono',escheat:'Regra estadual de abandono',reset:'Repor demonstração',cash:'Dinheiro recebido',redemptions:'Utilizações previstas',breakage:'Saldo não utilizado retido',liability:'Responsabilidade final',profit:'Lucro reconhecido',flags:'Alertas',verdict:'Veredicto',noFlags:'Sem alertas — a estrutura do programa está limpa.'};
export const GIFTCARD_COPY:Record<LanguageCode,GiftCardCopy>={en,de,fr,es,pt};

export function giftCardVerdictLabel(language: LanguageCode, verdict: string): string {
  const labels: Record<LanguageCode, Record<string, string>> = {
    en: {},
    de: {
      'Do not sell cards — liability exceeds float': 'Keine Karten verkaufen — Verbindlichkeiten übersteigen den Zahlungsfluss',
      'Sell small — refund-credit loop dominates': 'Klein starten — Rückerstattungsguthaben dominiert',
      'Treat as pure float — keep it small and simple': 'Als reinen Zahlungsfluss behandeln — klein und einfach halten',
      'Worth running — float + breakage beat the cost of the liability': 'Betrieb sinnvoll — Zahlungsfluss und Verfall übertreffen die Verbindlichkeitskosten',
      'Strong program — uplift alone justifies it': 'Starkes Programm — der Mehrumsatz allein rechtfertigt es',
    },
    fr: {
      'Do not sell cards — liability exceeds float': 'Ne vendez pas de cartes — le passif dépasse la trésorerie',
      'Sell small — refund-credit loop dominates': 'Vendez peu — la boucle de crédit domine',
      'Treat as pure float — keep it small and simple': 'Traitez-le comme une trésorerie — restez petit et simple',
      'Worth running — float + breakage beat the cost of the liability': 'Intéressant — trésorerie et rupture dépassent le coût du passif',
      'Strong program — uplift alone justifies it': 'Programme solide — le surcroît de dépense suffit',
    },
    es: {
      'Do not sell cards — liability exceeds float': 'No vendas tarjetas — el pasivo supera el efectivo',
      'Sell small — refund-credit loop dominates': 'Vende poco — domina el ciclo de créditos de reembolso',
      'Treat as pure float — keep it small and simple': 'Trátalo como efectivo — mantenlo pequeño y sencillo',
      'Worth running — float + breakage beat the cost of the liability': 'Merece la pena — el efectivo y la caducidad superan el pasivo',
      'Strong program — uplift alone justifies it': 'Programa sólido — el aumento del gasto lo justifica',
    },
    pt: {
      'Do not sell cards — liability exceeds float': 'Não venda cartões — a responsabilidade excede o dinheiro recebido',
      'Sell small — refund-credit loop dominates': 'Venda pouco — o ciclo de créditos de reembolso domina',
      'Treat as pure float — keep it small and simple': 'Trate como dinheiro recebido — mantenha pequeno e simples',
      'Worth running — dinheiro recebido e saldo não utilizado superam o custo da responsabilidade': 'Vale a pena — o dinheiro recebido e os saldos não utilizados superam o custo',
      'Worth running — float + breakage beat the cost of the liability': 'Vale a pena — dinheiro recebido e saldo não utilizado superam o custo da responsabilidade',
      'Strong program — uplift alone justifies it': 'Programa forte — o aumento do gasto justifica-o',
    },
  };
  return labels[language][verdict] || verdict;
}

export function giftCardFlagTitle(language: LanguageCode, code: string, fallback: string): string {
  const titles: Record<LanguageCode, Record<string, string>> = {
    en: {},
    de: {'GC-01':'Rückerstattungsschleife ohne neue Verkäufe','GC-02':'Rückerstattungsguthaben über 30 % der Kartenverkäufe','GC-03':'Hohe Einziehungsgefährdung','GC-04':'Auszahlungsverbindlichkeit bei Kleinbeträgen','GC-05':'Gebühren ohne rechtliche Erlaubnis','GC-06':'Programm macht auf erkannter Basis Verlust','GC-07':'Niedrige Einlösung — Abwanderungsrisiko','GC-08':'Hohe Einlösungskosten','GC-09':'Verbindlichkeiten wachsen schneller als Einlösungen','GC-10':'Überschätzte Verfallsannahme','GC-11':'Einziehung übersteigt Programmgewinn'},
    fr: {'GC-01':'Boucle de crédit sans nouvelles ventes','GC-02':'Crédits de remboursement supérieurs à 30 % des ventes','GC-03':'Forte exposition à la déshérence','GC-04':'Passif de remboursement des petits soldes','GC-05':'Frais sans autorisation légale','GC-06':'Le programme est déficitaire','GC-07':'Faible utilisation — risque d’attrition','GC-08':'Coût élevé des utilisations','GC-09':'Le passif croît plus vite que les utilisations','GC-10':'Hypothèse de rupture surestimée','GC-11':'La déshérence dépasse le bénéfice'},
    es: {'GC-01':'Ciclo de crédito sin nuevas ventas','GC-02':'Créditos de reembolso superiores al 30 % de las ventas','GC-03':'Alta exposición al abandono','GC-04':'Pasivo de reembolso de saldos pequeños','GC-05':'Comisiones sin permiso legal','GC-06':'El programa pierde dinero','GC-07':'Canje bajo — riesgo de abandono','GC-08':'Coste alto de canje','GC-09':'El pasivo crece más rápido que los canjes','GC-10':'Supuesto de caducidad exagerado','GC-11':'El abandono supera el beneficio'},
    pt: {'GC-01':'Ciclo de crédito sem novas vendas','GC-02':'Créditos de reembolso acima de 30% das vendas','GC-03':'Elevada exposição ao abandono','GC-04':'Responsabilidade por reembolso de saldos pequenos','GC-05':'Taxas sem autorização legal','GC-06':'O programa dá prejuízo','GC-07':'Baixa utilização — risco de abandono','GC-08':'Custo elevado de utilização','GC-09':'A responsabilidade cresce mais rápido que as utilizações','GC-10':'Suposição de saldo não utilizado exagerada','GC-11':'O abandono excede o lucro'},
  };
  return titles[language][code] || fallback;
}
