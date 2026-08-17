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

export interface GiftCardVerdictNoteValues {
  refunds: string;
  sales: string;
  netProfit: string;
  horizonMonths: string;
  upliftValue: string;
  hasRefundCredit: boolean;
}

export function giftCardVerdictNote(
  language: LanguageCode,
  verdict: string,
  values: GiftCardVerdictNoteValues,
  fallback: string,
): string {
  const { refunds, sales, netProfit, horizonMonths, upliftValue, hasRefundCredit } = values;
  const notes: Record<LanguageCode, Record<string, string>> = {
    en: {
      'Do not sell cards — liability exceeds float': `With ${refunds}/mo of refund credit and no new card sales, the program is pure liability. Cap refunds to the original payment method before running any card program.`,
      'Do not sell cards — liability exceeds float:no-sales': "No card sales means no float — issuing cards only adds a liability you can't offset. Start selling cards before issuing more credit.",
      'Sell small — refund-credit loop dominates': `Refund credits (${refunds}/mo) are larger than new card sales (${sales}/mo). The credit loop inflates liability faster than the float grows — fix the refund policy before scaling the program.`,
      'Treat as pure float — keep it small and simple': `On a recognized basis the program nets ${netProfit} over ${horizonMonths} months. The cash-in float is real, but breakage income is capped by escheat and cash-back law — run the program small, don't count on breakage.`,
      'Strong program — uplift alone justifies it': `Redeemers spend ${upliftValue} extra above face value — the uplift alone covers admin and processing. The float and kept breakage are upside.`,
      'Worth running — float + breakage beat the cost of the liability': `Recognized profit ${netProfit} over ${horizonMonths} months: float + uplift + kept breakage cover escheat, cash-back, admin and processing. Keep expiry law-compliant and never refund cards to cash.`,
    },
    de: {
      'Do not sell cards — liability exceeds float': `Mit ${refunds}/Monat Rückerstattungsguthaben und ohne neue Kartenverkäufe ist das Programm eine reine Verbindlichkeit. Erstatte auf die ursprüngliche Zahlungsart, bevor du ein Kartenprogramm startest.`,
      'Do not sell cards — liability exceeds float:no-sales': 'Ohne Kartenverkäufe gibt es keinen Zahlungsfluss — neue Karten schaffen nur eine nicht ausgleichbare Verbindlichkeit. Verkaufe Karten, bevor du weiteres Guthaben ausgibst.',
      'Sell small — refund-credit loop dominates': `Rückerstattungsguthaben (${refunds}/Monat) übersteigt neue Kartenverkäufe (${sales}/Monat). Die Guthabenschleife lässt die Verbindlichkeit schneller wachsen als den Zahlungsfluss — korrigiere die Rückerstattungsregel vor der Skalierung.`,
      'Treat as pure float — keep it small and simple': `Auf erkannter Basis erzielt das Programm über ${horizonMonths} Monate ${netProfit}. Der Zahlungsfluss ist real, aber Verfallserträge werden durch staatliche Einziehung und Auszahlungsregeln begrenzt — halte das Programm klein und zähle nicht auf Verfall.`,
      'Strong program — uplift alone justifies it': `Einlösende geben ${upliftValue} über den Nennwert hinaus aus — der Mehrumsatz allein deckt Verwaltung und Zahlungsabwicklung. Zahlungsfluss und einbehaltener Verfall sind zusätzlicher Nutzen.`,
      'Worth running — float + breakage beat the cost of the liability': `Erkannter Gewinn über ${horizonMonths} Monate: ${netProfit}. Zahlungsfluss, Mehrumsatz und einbehaltener Verfall decken Einziehung, Auszahlungen, Verwaltung und Zahlungsabwicklung. Halte das Programm gesetzeskonform und erstatte Karten nie bar.`,
    },
    fr: {
      'Do not sell cards — liability exceeds float': `Avec ${refunds}/mois de crédits de remboursement et aucune nouvelle vente, le programme est un passif pur. Remboursez selon le mode de paiement initial avant de lancer un programme.`,
      'Do not sell cards — liability exceeds float:no-sales': "Sans ventes de cartes, il n'y a pas de trésorerie — les cartes ajoutent seulement un passif impossible à compenser. Vendez des cartes avant d'émettre davantage de crédits.",
      'Sell small — refund-credit loop dominates': `Les crédits de remboursement (${refunds}/mois) dépassent les ventes (${sales}/mois). La boucle de crédit accroît le passif plus vite que la trésorerie — corrigez la règle de remboursement avant de développer le programme.`,
      'Treat as pure float — keep it small and simple': `Sur une base comptabilisée, le programme produit ${netProfit} sur ${horizonMonths} mois. La trésorerie est réelle, mais la rupture est limitée par la déshérence et les règles de remboursement — restez petit et ne comptez pas sur la rupture.`,
      'Strong program — uplift alone justifies it': `Les clients dépensent ${upliftValue} au-delà du montant initial — ce surcroît suffit à couvrir l'administration et le traitement. La trésorerie et la rupture conservée sont un avantage supplémentaire.`,
      'Worth running — float + breakage beat the cost of the liability': `Bénéfice comptabilisé de ${netProfit} sur ${horizonMonths} mois : la trésorerie, le surcroît et la rupture conservée couvrent déshérence, remboursements, administration et traitement. Respectez la loi et ne remboursez jamais les cartes en espèces.`,
    },
    es: {
      'Do not sell cards — liability exceeds float': `Con ${refunds}/mes de crédito de reembolso y sin nuevas ventas, el programa es solo un pasivo. Reembolsa al método de pago original antes de iniciar cualquier programa.`,
      'Do not sell cards — liability exceeds float:no-sales': 'Sin ventas de tarjetas no hay efectivo recibido; emitir tarjetas solo añade un pasivo que no puedes compensar. Vende tarjetas antes de emitir más crédito.',
      'Sell small — refund-credit loop dominates': `Los créditos de reembolso (${refunds}/mes) superan las nuevas ventas (${sales}/mes). El ciclo de crédito aumenta el pasivo más rápido que el efectivo; corrige la política de reembolsos antes de escalar.`,
      'Treat as pure float — keep it small and simple': `En base reconocida, el programa obtiene ${netProfit} durante ${horizonMonths} meses. El efectivo es real, pero la caducidad está limitada por el abandono estatal y la devolución en efectivo; mantén el programa pequeño y no dependas de la caducidad.`,
      'Strong program — uplift alone justifies it': `Los clientes gastan ${upliftValue} por encima del valor nominal; ese aumento cubre por sí solo la administración y el procesamiento. El efectivo y la caducidad retenida son ventajas adicionales.`,
      'Worth running — float + breakage beat the cost of the liability': `Beneficio reconocido de ${netProfit} durante ${horizonMonths} meses: el efectivo, el aumento y la caducidad retenida cubren abandono, devoluciones, administración y procesamiento. Cumple la ley y nunca reembolses tarjetas en efectivo.`,
    },
    pt: {
      'Do not sell cards — liability exceeds float': `Com ${refunds}/mês de crédito de reembolso e sem novas vendas, o programa é apenas uma responsabilidade. Reembolse pelo método de pagamento original antes de iniciar um programa.`,
      'Do not sell cards — liability exceeds float:no-sales': 'Sem vendas de cartões não há dinheiro recebido; emitir cartões apenas cria uma responsabilidade sem compensação. Venda cartões antes de emitir mais crédito.',
      'Sell small — refund-credit loop dominates': `Os créditos de reembolso (${refunds}/mês) superam as novas vendas (${sales}/mês). O ciclo de crédito aumenta a responsabilidade mais depressa que o dinheiro recebido — corrija a política antes de escalar.`,
      'Treat as pure float — keep it small and simple': `Numa base reconhecida, o programa rende ${netProfit} em ${horizonMonths} meses. O dinheiro recebido é real, mas o saldo não utilizado é limitado pelo abandono e pelas regras de reembolso — mantenha o programa pequeno e não conte com esse saldo.`,
      'Strong program — uplift alone justifies it': `Os clientes gastam ${upliftValue} acima do valor nominal — esse aumento cobre sozinho a administração e o processamento. O dinheiro recebido e o saldo retido são vantagens adicionais.`,
      'Worth running — float + breakage beat the cost of the liability': `Lucro reconhecido de ${netProfit} em ${horizonMonths} meses: dinheiro recebido, aumento e saldo retido cobrem abandono, pagamentos, administração e processamento. Cumpra a lei e nunca reembolse cartões em dinheiro.`,
    },
  };
  const key = verdict === 'Do not sell cards — liability exceeds float' && !hasRefundCredit ? `${verdict}:no-sales` : verdict;
  return notes[language][key] || fallback;
}

export interface GiftCardFlagNoteValues {
  refunds: string;
  sales: string;
  refundSharePct: string;
  escheatPct: string;
  dormancyYears: string;
  cashBackThreshold: string;
  netProfit: string;
  horizonMonths: string;
  redemptionPct: string;
  redeemedCostPct: string;
  peakLiability: string;
  monthlySales: string;
  breakagePct: string;
  totalEscheat: string;
}

export function giftCardFlagNote(
  language: LanguageCode,
  code: string,
  values: GiftCardFlagNoteValues,
  fallback: string,
): string {
  const {
    refunds,
    sales,
    refundSharePct,
    escheatPct,
    dormancyYears,
    cashBackThreshold,
    netProfit,
    horizonMonths,
    redemptionPct,
    redeemedCostPct,
    peakLiability,
    monthlySales,
    breakagePct,
    totalEscheat,
  } = values;
  const notes: Record<LanguageCode, Record<string, string>> = {
    en: {
      'GC-01': `You issue ${refunds}/mo in refund credit but sell no gift cards — credit is pure liability with no float benefit. Cap refunds to original payment method.`,
      'GC-02': `Refund credit (${refunds}/mo) is eating ${refundSharePct}% of your float. Refund to the original payment method instead of store credit.`,
      'GC-03': `Your state takes ${escheatPct}% of unredeemed balances after ${dormancyYears} yr. Many states exempt merchandise-only retail credits — check your state's retail-credit exemption before counting breakage as profit.`,
      'GC-04': `Balances under ${cashBackThreshold} must be paid out in cash (federal <$10; California <$15 from Apr 2026). This is a permanent liability no expiry date can remove.`,
      'GC-05': `You plan dormancy-fee income but expiry/fees aren't allowed in your state. Remove the fee income or your program becomes a compliance liability.`,
      'GC-06': `Recognized-program profit is ${netProfit} over ${horizonMonths} months — processing, COGS, escheat and admin outweigh the float.`,
      'GC-07': `At ${redemptionPct}% redemption, your float balloons but so does escheat exposure; industry average is 80-90%. Customers who forget cards become complaints, not revenue.`,
      'GC-08': `Physical goods redeem at ${redeemedCostPct}% cost — with 12% breakage the breakage cushion evaporates and every redeemed dollar costs you nearly a dollar.`,
      'GC-09': `Peak outstanding liability ${peakLiability} is ${monthlySales}× monthly sales. If your shop closed tomorrow, that's what you owe back.`,
      'GC-10': `Assuming ${breakagePct}% breakage is optimistic — measured breakage runs 10-19% and falls as tracking improves (7.5% by 2015 industry data).`,
      'GC-11': `${totalEscheat} gets surrendered to the state — more than the program earns. Check whether your state exempts merchandise-only credits.`,
    },
    de: {
      'GC-01': `Du gibst ${refunds}/Monat Rückerstattungsguthaben aus, verkaufst aber keine Gutscheine — das Guthaben ist eine reine Verbindlichkeit ohne Zahlungsfluss. Begrenze Erstattungen auf die ursprüngliche Zahlungsart.`,
      'GC-02': `Rückerstattungsguthaben (${refunds}/Monat) verbraucht ${refundSharePct} % deines Zahlungsflusses. Erstatte über die ursprüngliche Zahlungsart statt als Ladenguthaben.`,
      'GC-03': `Dein Staat nimmt ${escheatPct} % nicht eingelöster Guthaben nach ${dormancyYears} Jahren ein. Prüfe die Ausnahme für reine Warenguthaben, bevor du Verfall als Gewinn zählst.`,
      'GC-04': `Guthaben unter ${cashBackThreshold} müssen bar ausgezahlt werden (Bundesgrenze unter 10 $, Kalifornien unter 15 $ ab April 2026). Diese Verbindlichkeit kann kein Ablaufdatum beseitigen.`,
      'GC-05': `Du planst Einnahmen aus Inaktivitätsgebühren, aber Ablauf/Gebühren sind in deinem Staat nicht erlaubt. Entferne die Gebühreneinnahmen oder es entsteht eine Compliance-Verbindlichkeit.`,
      'GC-06': `Der erkannte Programmgewinn beträgt ${netProfit} über ${horizonMonths} Monate — Zahlungsabwicklung, Kosten, Einziehung und Verwaltung übersteigen den Zahlungsfluss.`,
      'GC-07': `Bei ${redemptionPct} % Einlösung wächst dein Zahlungsfluss, aber auch die Einziehungsgefahr; der Branchenwert liegt bei 80–90 %. Vergessene Karten führen zu Beschwerden, nicht zu Umsatz.`,
      'GC-08': `Waren werden mit ${redeemedCostPct} % Kosten eingelöst — bei 12 % Verfall verschwindet der Puffer, und jeder eingelöste Euro kostet fast einen Euro.`,
      'GC-09': `Die Spitzenverbindlichkeit ${peakLiability} beträgt das ${monthlySales}-Fache des Monatsumsatzes. Bei einer Schließung wäre dies deine Rückzahlungspflicht.`,
      'GC-10': `Die Annahme von ${breakagePct} % Verfall ist optimistisch — gemessener Verfall liegt bei 10–19 % und sinkt mit besserer Nachverfolgung.`,
      'GC-11': `${totalEscheat} werden an den Staat abgeführt — mehr als das Programm verdient. Prüfe, ob dein Staat reine Warenguthaben ausnimmt.`,
    },
    fr: {
      'GC-01': `Vous émettez ${refunds}/mois de crédits de remboursement sans vendre de cartes — le crédit est un passif pur sans trésorerie. Limitez les remboursements au mode de paiement initial.`,
      'GC-02': `Les crédits (${refunds}/mois) consomment ${refundSharePct} % de votre trésorerie. Remboursez selon le mode initial plutôt qu'en crédit boutique.`,
      'GC-03': `Votre État prélève ${escheatPct} % des soldes non utilisés après ${dormancyYears} ans. Vérifiez l'exemption des crédits de marchandises avant de compter la rupture comme bénéfice.`,
      'GC-04': `Les soldes inférieurs à ${cashBackThreshold} doivent être remboursés en espèces (seuil fédéral inférieur à 10 $, Californie inférieur à 15 $ dès avril 2026). Aucune expiration ne supprime ce passif.`,
      'GC-05': `Vous prévoyez des frais d'inactivité, mais les frais ou l'expiration ne sont pas autorisés dans votre État. Supprimez ce revenu ou créez un passif de conformité.`,
      'GC-06': `Le bénéfice comptabilisé est de ${netProfit} sur ${horizonMonths} mois — traitement, coûts, déshérence et administration dépassent la trésorerie.`,
      'GC-07': `Avec ${redemptionPct} % d'utilisation, la trésorerie et l'exposition à la déshérence augmentent; la moyenne est de 80–90 %. Les cartes oubliées deviennent des plaintes, pas du revenu.`,
      'GC-08': `Les produits physiques sont utilisés avec un coût de ${redeemedCostPct} % — avec 12 % de rupture, le coussin disparaît et chaque dollar coûte presque un dollar.`,
      'GC-09': `Le passif maximal de ${peakLiability} représente ${monthlySales} fois les ventes mensuelles. Si la boutique fermait demain, c'est ce qui serait dû.`,
      'GC-10': `Une rupture de ${breakagePct} % est optimiste — la rupture mesurée est de 10–19 % et baisse avec un meilleur suivi.`,
      'GC-11': `${totalEscheat} sont versés à l'État — davantage que le bénéfice du programme. Vérifiez l'exemption des crédits de marchandises.`,
    },
    es: {
      'GC-01': `Emites ${refunds}/mes de crédito de reembolso sin vender tarjetas — es un pasivo puro sin efectivo recibido. Limita los reembolsos al método de pago original.`,
      'GC-02': `El crédito (${refunds}/mes) consume el ${refundSharePct} % de tu efectivo. Reembolsa al método original en vez de dar crédito de tienda.`,
      'GC-03': `Tu estado se queda con el ${escheatPct} % de los saldos no canjeados después de ${dormancyYears} años. Comprueba la exención de créditos de mercancía antes de contar la caducidad como beneficio.`,
      'GC-04': `Los saldos inferiores a ${cashBackThreshold} deben pagarse en efectivo (federal inferior a 10 $, California inferior a 15 $ desde abril de 2026). Ninguna caducidad elimina este pasivo.`,
      'GC-05': `Planeas ingresos por inactividad, pero tu estado no permite esas comisiones o la caducidad. Elimina esos ingresos o crearás un pasivo de cumplimiento.`,
      'GC-06': `El beneficio reconocido es ${netProfit} en ${horizonMonths} meses — procesamiento, costes, abandono y administración superan el efectivo recibido.`,
      'GC-07': `Con un canje del ${redemptionPct} %, crecen el efectivo y la exposición al abandono; la media del sector es 80–90 %. Las tarjetas olvidadas generan quejas, no ingresos.`,
      'GC-08': `Los bienes físicos se canjean con un coste del ${redeemedCostPct} % — con un 12 % de caducidad, el colchón desaparece y cada dólar canjeado cuesta casi un dólar.`,
      'GC-09': `El pasivo máximo de ${peakLiability} equivale a ${monthlySales} veces las ventas mensuales. Si cerraras mañana, eso es lo que deberías devolver.`,
      'GC-10': `Suponer un ${breakagePct} % de caducidad es optimista — la caducidad medida es del 10–19 % y baja con un mejor seguimiento.`,
      'GC-11': `Se entregan ${totalEscheat} al estado — más de lo que gana el programa. Comprueba la exención de créditos de mercancía.`,
    },
    pt: {
      'GC-01': `Emite ${refunds}/mês em créditos de reembolso sem vender cartões — é uma responsabilidade pura sem dinheiro recebido. Limite os reembolsos ao método de pagamento original.`,
      'GC-02': `Os créditos (${refunds}/mês) consomem ${refundSharePct} % do dinheiro recebido. Reembolse pelo método original em vez de emitir crédito da loja.`,
      'GC-03': `O seu estado retém ${escheatPct} % dos saldos não utilizados após ${dormancyYears} anos. Confirme a isenção de créditos de mercadoria antes de contar esse saldo como lucro.`,
      'GC-04': `Saldos inferiores a ${cashBackThreshold} devem ser pagos em dinheiro (federal abaixo de 10 $, Califórnia abaixo de 15 $ desde abril de 2026). Nenhum prazo de validade elimina esta responsabilidade.`,
      'GC-05': `Planeia receber taxas de inatividade, mas o seu estado não permite taxas ou validade. Remova essa receita ou criará uma responsabilidade de conformidade.`,
      'GC-06': `O lucro reconhecido é ${netProfit} em ${horizonMonths} meses — processamento, custos, abandono e administração superam o dinheiro recebido.`,
      'GC-07': `Com ${redemptionPct} % de utilização, crescem o dinheiro recebido e a exposição ao abandono; a média do setor é 80–90 %. Cartões esquecidos geram reclamações, não receita.`,
      'GC-08': `Bens físicos são utilizados com custo de ${redeemedCostPct} % — com 12 % de saldo não utilizado, a margem desaparece e cada unidade custa quase uma unidade.`,
      'GC-09': `A responsabilidade máxima de ${peakLiability} equivale a ${monthlySales} vezes as vendas mensais. Se a loja fechasse amanhã, esse seria o valor devido.`,
      'GC-10': `Assumir ${breakagePct} % de saldo não utilizado é otimista — a taxa medida é de 10–19 % e diminui com melhor acompanhamento.`,
      'GC-11': `${totalEscheat} são entregues ao estado — mais do que o programa ganha. Confirme a isenção de créditos de mercadoria.`,
    },
  };
  return notes[language][code] || fallback;
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
