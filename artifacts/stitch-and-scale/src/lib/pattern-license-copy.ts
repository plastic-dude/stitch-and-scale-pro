import type { LanguageCode } from '@/lib/i18n';

export interface PatternLicenseCopy {
  title: string;
  description: string;
  yarnWeight: string;
  selfSell: string;
  patternPrice: string;
  monthlySales: string;
  designRate: string;
  hoursInvested: string;
  horizon: string;
  dealStructure: string;
  oneOffFee: string;
  minimumGuarantee: string;
  licensorSales: string;
  royalty: string;
  exclusivity: string;
  production: string;
  paymentLag: string;
  coverCosts: string;
  worldwide: string;
  derivatives: string;
  keepRights: string;
  rightsAuditPassed: (passed: number) => string;
  selfSellWindow: string;
  feeRoyalties: string;
  labourFloor: string;
  totalOffer: string;
  keepVsSell: (months: number, keep: string, sell: string, winner: string, difference: string) => string;
  rightsAudit: string;
  reply: string;
  copy: string;
  copied: string;
  copyManually: string;
  sellWinsBy: string;
  keepWinsBy: string;
}

const en: PatternLicenseCopy = {
  title: 'Pattern License Planner',
  description: 'A yarn company or marketplace wants the rights to this pattern? Price their offer against what self-publishing would earn — and run an eight-point rights audit before you sign anything.',
  yarnWeight: 'Yarn weight', selfSell: "Where you'd self-sell", patternPrice: 'Pattern price ($)', monthlySales: 'Expected monthly sales', designRate: 'Design rate ($/hr)', hoursInvested: 'Hours already invested', horizon: 'Comparison horizon (months)', dealStructure: 'Deal structure', oneOffFee: 'One-off fee ($)', minimumGuarantee: 'Minimum guarantee ($)', licensorSales: 'Licensor monthly sales', royalty: 'Royalty (%)', exclusivity: 'Exclusivity window (months, 0 = none)', production: "Production you'd cover ($)", paymentLag: 'Payment lag (months)', coverCosts: 'They cover sample / photo / tech edit', worldwide: 'Worldwide rights', derivatives: 'Derivatives transfer to them', keepRights: 'I keep credit & promotion rights', rightsAuditPassed: (passed) => `Rights audit: ${passed}/8 passed`, selfSellWindow: 'Self-sell window value', feeRoyalties: 'Fee + royalties value', labourFloor: 'Your labour floor', totalOffer: 'Total offer value', keepVsSell: (months, keep, sell, winner, difference) => `Keep self-publishing for ${months} months: ${keep} · Sell under this deal now: ${sell} · ${winner} ${difference}`, rightsAudit: 'Rights audit', reply: 'Your reply', copy: 'Copy', copied: 'Copied to clipboard', copyManually: 'Select and copy manually', sellWinsBy: 'Sell wins by', keepWinsBy: 'Keep wins by',
};

const de: PatternLicenseCopy = { ...en, title: 'Planer für Musterlizenzen', description: 'Ein Garnunternehmen oder Marktplatz möchte die Rechte an diesem Muster? Vergleiche das Angebot mit deinen möglichen Einnahmen beim Eigenverlag und prüfe vor der Unterschrift acht Rechtepunkte.', yarnWeight: 'Garnstärke', selfSell: 'Wo du selbst verkaufen würdest', patternPrice: 'Musterpreis ($)', monthlySales: 'Erwartete Verkäufe pro Monat', designRate: 'Designsatz ($/Std.)', hoursInvested: 'Bereits investierte Stunden', horizon: 'Vergleichszeitraum (Monate)', dealStructure: 'Vertragsstruktur', oneOffFee: 'Einmalige Vergütung ($)', minimumGuarantee: 'Mindestgarantie ($)', licensorSales: 'Monatliche Verkäufe des Lizenzgebers', royalty: 'Tantieme (%)', exclusivity: 'Exklusivitätszeitraum (Monate, 0 = keiner)', production: 'Von dir übernommene Produktion ($)', paymentLag: 'Zahlungsverzug (Monate)', coverCosts: 'Sie übernehmen Muster / Fotos / Technikschnitt', worldwide: 'Weltweite Rechte', derivatives: 'Abgeleitete Rechte gehen an sie', keepRights: 'Ich behalte Namensnennung und Werberechte', rightsAuditPassed: (p) => `Rechteprüfung: ${p}/8 bestanden`, selfSellWindow: 'Wert des Eigenverkaufs', feeRoyalties: 'Wert von Vergütung und Tantiemen', labourFloor: 'Deine Arbeitsuntergrenze', totalOffer: 'Gesamtwert des Angebots', keepVsSell: (m,k,s,w,d) => `Eigenveröffentlichung für ${m} Monate: ${k} · Jetzt unter diesem Vertrag verkaufen: ${s} · ${w} ${d}`, rightsAudit: 'Rechteprüfung', reply: 'Deine Antwort', copy: 'Kopieren', copied: 'In die Zwischenablage kopiert', copyManually: 'Bitte auswählen und manuell kopieren', sellWinsBy: 'Verkauf gewinnt mit', keepWinsBy: 'Behalten gewinnt mit' };
const fr: PatternLicenseCopy = { ...en, title: 'Planificateur de licence de patron', description: 'Une entreprise de fil ou une marketplace veut les droits de ce patron ? Comparez son offre à ce que l’autoédition pourrait rapporter et vérifiez huit points avant de signer.', yarnWeight: 'Épaisseur du fil', selfSell: 'Où vous vendriez vous-même', patternPrice: 'Prix du patron ($)', monthlySales: 'Ventes mensuelles prévues', designRate: 'Tarif de conception ($/h)', hoursInvested: 'Heures déjà investies', horizon: 'Horizon de comparaison (mois)', dealStructure: 'Structure de l’accord', oneOffFee: 'Montant forfaitaire ($)', minimumGuarantee: 'Garantie minimale ($)', licensorSales: 'Ventes mensuelles du concédant', royalty: 'Royalties (%)', exclusivity: 'Période d’exclusivité (mois, 0 = aucune)', production: 'Production à votre charge ($)', paymentLag: 'Délai de paiement (mois)', coverCosts: 'Ils couvrent échantillon / photo / édition technique', worldwide: 'Droits mondiaux', derivatives: 'Les créations dérivées leur sont transférées', keepRights: 'Je conserve les droits au crédit et à la promotion', rightsAuditPassed: (p) => `Audit des droits : ${p}/8 validés`, selfSellWindow: 'Valeur de l’autoédition', feeRoyalties: 'Valeur des frais et royalties', labourFloor: 'Votre seuil de travail', totalOffer: 'Valeur totale de l’offre', keepVsSell: (m,k,s,w,d) => `Autoédition pendant ${m} mois : ${k} · Vendre maintenant avec cet accord : ${s} · ${w} ${d}`, rightsAudit: 'Audit des droits', reply: 'Votre réponse', copy: 'Copier', copied: 'Copié dans le presse-papiers', copyManually: 'Sélectionnez et copiez manuellement', sellWinsBy: 'La vente gagne de', keepWinsBy: 'La conservation gagne de' };
const es: PatternLicenseCopy = { ...en, title: 'Planificador de licencias de patrones', description: '¿Una empresa de lana o un marketplace quiere los derechos de este patrón? Compara su oferta con lo que ganarías publicándolo por tu cuenta y revisa ocho puntos antes de firmar.', yarnWeight: 'Grosor del hilo', selfSell: 'Dónde venderías por tu cuenta', patternPrice: 'Precio del patrón ($)', monthlySales: 'Ventas mensuales previstas', designRate: 'Tarifa de diseño ($/h)', hoursInvested: 'Horas ya invertidas', horizon: 'Horizonte de comparación (meses)', dealStructure: 'Estructura del acuerdo', oneOffFee: 'Pago único ($)', minimumGuarantee: 'Garantía mínima ($)', licensorSales: 'Ventas mensuales del licenciante', royalty: 'Regalías (%)', exclusivity: 'Periodo de exclusividad (meses, 0 = ninguno)', production: 'Producción que cubrirías ($)', paymentLag: 'Retraso del pago (meses)', coverCosts: 'Ellos cubren muestra / fotos / edición técnica', worldwide: 'Derechos mundiales', derivatives: 'Las obras derivadas pasan a ellos', keepRights: 'Conservo los derechos de crédito y promoción', rightsAuditPassed: (p) => `Auditoría de derechos: ${p}/8 superados`, selfSellWindow: 'Valor de venta propia', feeRoyalties: 'Valor de pago y regalías', labourFloor: 'Tu mínimo de trabajo', totalOffer: 'Valor total de la oferta', keepVsSell: (m,k,s,w,d) => `Publicar por tu cuenta durante ${m} meses: ${k} · Vender ahora con este acuerdo: ${s} · ${w} ${d}`, rightsAudit: 'Auditoría de derechos', reply: 'Tu respuesta', copy: 'Copiar', copied: 'Copiado al portapapeles', copyManually: 'Selecciona y copia manualmente', sellWinsBy: 'Vender gana por', keepWinsBy: 'Conservar gana por' };
const pt: PatternLicenseCopy = { ...en, title: 'Planejador de licenças de padrões', description: 'Uma empresa de fios ou marketplace quer os direitos deste padrão? Compare a oferta com o que a publicação própria renderia e faça uma auditoria de oito pontos antes de assinar.', yarnWeight: 'Peso do fio', selfSell: 'Onde você venderia por conta própria', patternPrice: 'Preço do padrão ($)', monthlySales: 'Vendas mensais esperadas', designRate: 'Taxa de design ($/h)', hoursInvested: 'Horas já investidas', horizon: 'Horizonte de comparação (meses)', dealStructure: 'Estrutura do acordo', oneOffFee: 'Pagamento único ($)', minimumGuarantee: 'Garantia mínima ($)', licensorSales: 'Vendas mensais do licenciante', royalty: 'Royalties (%)', exclusivity: 'Período de exclusividade (meses, 0 = nenhum)', production: 'Produção que você cobriria ($)', paymentLag: 'Atraso de pagamento (meses)', coverCosts: 'Eles cobrem amostra / foto / edição técnica', worldwide: 'Direitos mundiais', derivatives: 'Direitos derivados passam para eles', keepRights: 'Mantenho os direitos de crédito e promoção', rightsAuditPassed: (p) => `Auditoria de direitos: ${p}/8 aprovados`, selfSellWindow: 'Valor da venda própria', feeRoyalties: 'Valor de pagamento e royalties', labourFloor: 'Seu piso de trabalho', totalOffer: 'Valor total da oferta', keepVsSell: (m,k,s,w,d) => `Publicar por conta própria por ${m} meses: ${k} · Vender agora neste acordo: ${s} · ${w} ${d}`, rightsAudit: 'Auditoria de direitos', reply: 'Sua resposta', copy: 'Copiar', copied: 'Copiado para a área de transferência', copyManually: 'Selecione e copie manualmente', sellWinsBy: 'Vender ganha por', keepWinsBy: 'Manter ganha por' };

export const PATTERN_LICENSE_COPY: Record<LanguageCode, PatternLicenseCopy> = { en, de, fr, es, pt };
