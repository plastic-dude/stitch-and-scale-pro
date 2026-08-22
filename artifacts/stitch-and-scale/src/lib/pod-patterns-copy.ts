import { LanguageCode } from './i18n';

export interface PodPatternsCopy {
  title: string;
  description: string;
  patternNameLabel: string;
  basePriceLabel: string;
  monthlySalesLabel: string;
  podPlatformFeeLabel: string;
  shippingEstimateLabel: string;
  monthlyNetLabel: string;
  marginPerUnitLabel: string;
  verdictClean: string;
  verdictCheck: string;
  verdictFix: string;
  savingsNote: (margin: number) => string;
  cleanSavingsNote: string;
  marketQuoteTitle: string;
  marketQuoteDetails: (sales: number) => string;
  outstandingItemsLabel: (count: number) => string;
  findingPod01Title: string;
  findingPod01Detail: string;
  findingPod02Title: string;
  findingPod02Detail: string;
  // Legacy keys
  cannibalShare: string;
  channel: string;
  colorPages: string;
  coverLayoutCost0: string;
  coverLayoutHours: string;
  currentDigitalUnitsMo: string;
  digitalPdfPrice: string;
  expectedPhysicalUnitsMo: string;
  listPrice: string;
  negativeMonthlyNetMeans: string;
  opportunityRate: string;
  totalPages: string;
  verifiedAnchorsKdpB: string;
  wouldAPrintedBooklet: string;
}

export const COPY: Record<LanguageCode, PodPatternsCopy> = {
  en: {
    title: 'Print-on-Demand Patterns Lab',
    description: 'Analyze the economics of selling physical patterns via POD services like Gelato or Printful.',
    patternNameLabel: 'Pattern Name',
    basePriceLabel: 'Retail Price',
    monthlySalesLabel: 'Monthly Sales',
    podPlatformFeeLabel: 'POD Base Cost',
    shippingEstimateLabel: 'Shipping Estimate',
    monthlyNetLabel: 'Monthly Net Profit',
    marginPerUnitLabel: 'Margin per Unit',
    verdictClean: 'Healthy Margins',
    verdictCheck: 'Tight Margins',
    verdictFix: 'Loss Making',
    savingsNote: (m) => `Retaining $${m.toFixed(2)} per physical copy sold.`,
    cleanSavingsNote: 'POD economics are sustainable.',
    marketQuoteTitle: 'Volume Impact',
    marketQuoteDetails: (s) => `Processing ${s} physical orders monthly.`,
    outstandingItemsLabel: (c) => `Economic Risks (${c}):`,
    findingPod01Title: 'Negative margin detected',
    findingPod01Detail: 'Your base cost + shipping exceeds retail price. Raise price or find a cheaper POD partner.',
    findingPod02Title: 'Low volume for physical overhead',
    findingPod02Detail: 'Physical patterns at this volume may not justify the setup time vs digital sales.',
    cannibalShare: 'Cannibal share',
    channel: 'Channel',
    colorPages: 'Color pages',
    coverLayoutCost0: 'Cover/layout cost (0 = sunk)',
    coverLayoutHours: 'Cover/layout hours',
    currentDigitalUnitsMo: 'Current digital units/mo',
    digitalPdfPrice: 'Digital PDF price',
    expectedPhysicalUnitsMo: 'Expected physical units/mo',
    listPrice: 'List price',
    negativeMonthlyNetMeans: 'Negative monthly net means the physical title loses money every month at this volume — either raise the list, cut pages, or reserve the booklet purely as a marketing funnel for the PDF.',
    opportunityRate: 'Opportunity rate',
    totalPages: 'Total pages',
    verifiedAnchorsKdpB: 'Verified anchors: KDP B&W ≤110 pages is a flat $2.30/copy ($5.65 hardcover base, +$0.012/page above 110); color ink $0.065/page; the 60% royalty band needs $9.99+ list, else 50%; KDP takes 30% on Amazon.com (40% on expanded distribution); IngramSpark ≈ 55% wholesale discount (direct-reader residual ≈ list × 5%); Lulu direct ≈ 20% cut; Etsy ≈ 11% blended. Physical pattern booklets sell $12–25; a printed copy typically cannibalizes ~30% of a digital sale of the same design.',
    wouldAPrintedBooklet: 'Would a printed booklet of your patterns actually make money — or silently cannibalize your PDF sales while the print cost eats the margin? The spec is verified: KDP charges a flat $2.30 per copy through 110 black-and-white pages then $0.012/page, the 60% royalty band only applies at $9.99+ list, color ink runs $0.065/page, the paperback floor is 24 pages, and IngramSpark\'s ~55% wholesale discount means direct-reader sales through it net ~$0.70–2.40/copy where Lulu direct nets $5.50–12.70 on the same price. Designers have paid KDP print bills that left $1/copy against a $6 PDF — this lab prices the spec, the channel, and the cannibalization before you commit.',
  },
  de: {
    title: 'Print-on-Demand Anleitungs-Labor',
    description: 'Analysiere die Wirtschaftlichkeit des Verkaufs physischer Anleitungen über POD-Dienste wie Gelato oder Printful.',
    patternNameLabel: 'Anleitungsname',
    basePriceLabel: 'Verkaufspreis',
    monthlySalesLabel: 'Monatliche Verkäufe',
    podPlatformFeeLabel: 'POD-Basiskosten',
    shippingEstimateLabel: 'Versandkosten-Schätzung',
    monthlyNetLabel: 'Monatlicher Nettogewinn',
    marginPerUnitLabel: 'Marge pro Einheit',
    verdictClean: 'Gesunde Margen',
    verdictCheck: 'Knappe Margen',
    verdictFix: 'Verlustbringend',
    savingsNote: (m) => `Behält ${m.toFixed(2)} € pro verkaufter physischer Kopie.`,
    cleanSavingsNote: 'POD-Wirtschaftlichkeit ist nachhaltig.',
    marketQuoteTitle: 'Volumeneffekt',
    marketQuoteDetails: (s) => `Verarbeitet ${s} physische Bestellungen monatlich.`,
    outstandingItemsLabel: (c) => `Wirtschaftliche Risiken (${c}):`,
    findingPod01Title: 'Negative Marge erkannt',
    findingPod01Detail: 'Deine Basiskosten + Versand übersteigen den Verkaufspreis. Erhöhe den Preis oder suche einen günstigeren POD-Partner.',
    findingPod02Title: 'Geringes Volumen für physischen Overhead',
    findingPod02Detail: 'Physische Anleitungen bei diesem Volumen rechtfertigen möglicherweise nicht den Setup-Aufwand im Vergleich zu digitalen Verkäufen.',
    cannibalShare: 'Kannibalisierungs-Anteil',
    channel: 'Kanal',
    colorPages: 'Farbseiten',
    coverLayoutCost0: 'Cover-/Layout-Kosten (0 = versenkt)',
    coverLayoutHours: 'Cover-/Layout-Stunden',
    currentDigitalUnitsMo: 'Aktuelle digitale Einheiten/Monat',
    digitalPdfPrice: 'Digitaler PDF-Preis',
    expectedPhysicalUnitsMo: 'Erwartete physische Einheiten/Monat',
    listPrice: 'Listenpreis',
    negativeMonthlyNetMeans: 'Ein negativer Monatsnetto bedeutet: Der physische Titel verliert bei diesem Volumen jeden Monat Geld — entweder den Listenpreis anheben, Seiten kürzen oder das Buch rein als Marketing-Trichter für das PDF reservieren.',
    opportunityRate: 'Opportunitätsrate',
    totalPages: 'Seiten gesamt',
    verifiedAnchorsKdpB: 'Verifizierte Anker: KDP S/W ≤110 Seiten flat 2,30 $/Ex. (5,65 $ Hardcover-Basis, +0,012 $/Seite über 110); Farbdruck 0,065 $/Seite; die 60-%-Royalty-Band braucht 9,99 $+ Listenpreis, sonst 50 %; KDP nimmt 30 % auf Amazon.com (40 % auf erweiterten Vertrieb); IngramSpark ≈ 55 % Großhandelsrabatt (Direktleser-Rest ≈ Liste × 5 %); Lulu direkt ≈ 20 % Schnitt; Etsy ≈ 11 % geblendet. Physische Musterbücher verkaufen 12–25 $; eine gedruckte Kopie kannibalisiert typisch ~30 % eines digitalen Verkaufs desselben Designs.',
    wouldAPrintedBooklet: 'Lohnt sich ein gedrucktes Musterbuch wirklich — oder kannibalisiert es still deine PDF-Verkäufe, während die Druckkosten die Marge auffressen? Die Spez ist verifiziert: KDP berechnet flat 2,30 $ pro Exemplar bis 110 Schwarz-Weiß-Seiten, dann 0,012 $/Seite; die 60-%-Royalty-Band gilt erst ab 9,99 $ Listenpreis; Farbdruck kostet 0,065 $/Seite; das Taschenbuch-Minimum sind 24 Seiten; und IngramSparks ~55 % Großhandelsrabatt bedeutet, dass Direktleser-Verkäufe darüber nur ~0,70–2,40 $/Ex. netto bringen, während Lulu direkt 5,50–12,70 $ beim gleichen Preis zahlt. Designer haben KDP-Druckrechnungen bezahlt, die 1 $/Ex. gegen ein 6-$-PDF zurückließen — dieses Lab preist Spez, Kanal und Kannibalisierung, bevor du dich festlegst.',
  },
  fr: {
    title: 'Laboratoire Modèles Print-on-Demand',
    description: 'Analysez l\'économie de la vente de modèles physiques via des services POD comme Gelato ou Printful.',
    patternNameLabel: 'Nom du modèle',
    basePriceLabel: 'Prix de vente',
    monthlySalesLabel: 'Ventes mensuelles',
    podPlatformFeeLabel: 'Coût de base POD',
    shippingEstimateLabel: 'Estimation des frais de port',
    monthlyNetLabel: 'Bénéfice net mensuel',
    marginPerUnitLabel: 'Marge par unité',
    verdictClean: 'Marges saines',
    verdictCheck: 'Marges serrées',
    verdictFix: 'Déficitaire',
    savingsNote: (m) => `Conserve ${m.toFixed(2)} € par copie physique vendue.`,
    cleanSavingsNote: 'L\'économie du POD est durable.',
    marketQuoteTitle: 'Impact du volume',
    marketQuoteDetails: (s) => `Traite ${s} commandes physiques par mois.`,
    outstandingItemsLabel: (c) => `Risques économiques (${c}) :`,
    findingPod01Title: 'Marge négative détectée',
    findingPod01Detail: 'Votre coût de base + frais de port dépasse le prix de vente. Augmentez le prix ou trouvez un partenaire POD moins cher.',
    findingPod02Title: 'Faible volume pour les frais fixes physiques',
    findingPod02Detail: 'Les modèles physiques à ce volume peuvent ne pas justifier le temps d\'installation par rapport aux ventes numériques.',
    cannibalShare: 'Part cannibalisée',
    channel: 'Canal',
    colorPages: 'Pages couleur',
    coverLayoutCost0: 'Coût couverture/mise en page (0 = acquis)',
    coverLayoutHours: 'Heures couverture/mise en page',
    currentDigitalUnitsMo: 'Unités numériques actuelles/mois',
    digitalPdfPrice: 'Prix du PDF numérique',
    expectedPhysicalUnitsMo: 'Unités physiques attendues/mois',
    listPrice: 'Prix de liste',
    negativeMonthlyNetMeans: 'Un net mensuel négatif signifie que le titre physique perd de l’argent chaque mois à ce volume — soit haussez le prix de liste, soit coupez des pages, soit réservez le livre purement comme entonnoir marketing pour le PDF.',
    opportunityRate: 'Taux d’opportunité',
    totalPages: 'Pages totales',
    verifiedAnchorsKdpB: 'Repères vérifiés : KDP N&B ≤110 pages à 2,30 $ fixes/ex. (base livre relié 5,65 $, +0,012 $/page au-delà de 110) ; encre couleur 0,065 $/page ; le palier 60 % exige un prix de liste ≥9,99 $, sinon 50 % ; KDP prend 30 % sur Amazon.com (40 % en distribution élargie) ; IngramSpark ≈ 55 % de remise grossiste (résidu lecteur direct ≈ liste × 5 %) ; Lulu direct ≈ 20 % de coupe ; Etsy ≈ 11 % pondéré. Les livrets de patrons physiques se vendent 12–25 $ ; un exemplaire imprimé cannibalise typiquement ~30 % d’une vente numérique du même design.',
    wouldAPrintedBooklet: 'Un livre imprimé de vos patrons rapporterait-il vraiment de l’argent — ou cannibaliserait-il silencieusement vos ventes PDF pendant que le coût d’impression mange la marge ? Le cahier des charges est vérifié : KDP facture 2,30 $ fixes par exemplaire jusqu’à 110 pages noir et blanc, puis 0,012 $/page ; le palier de 60 % de redevance ne s’applique qu’à partir de 9,99 $ de prix de liste ; l’encre couleur coûte 0,065 $/page ; le minimum du livre broché est de 24 pages ; et la remise grossiste d’environ 55 % d’IngramSpark signifie que les ventes directes aux lecteurs via cette plateforme rapportent ~0,70–2,40 $/ex. là où Lulu en direct rapporte 5,50–12,70 $ au même prix. Des designers ont payé des factures d’impression KDP qui laissaient 1 $/ex. face à un PDF à 6 $ — ce lab chiffre les spécifications, le canal et la cannibalisation avant que vous ne vous engagiez.',
  },
  es: {
    title: 'Laboratorio de Patrones Print-on-Demand',
    description: 'Analiza la economía de vender patrones físicos a través de servicios POD como Gelato o Printful.',
    patternNameLabel: 'Nombre del patrón',
    basePriceLabel: 'Precio de venta',
    monthlySalesLabel: 'Ventas mensuales',
    podPlatformFeeLabel: 'Costo base POD',
    shippingEstimateLabel: 'Estimación de envío',
    monthlyNetLabel: 'Beneficio neto mensual',
    marginPerUnitLabel: 'Margen por unidad',
    verdictClean: 'Márgenes saludables',
    verdictCheck: 'Márgenes ajustados',
    verdictFix: 'Generando pérdidas',
    savingsNote: (m) => `Reteniendo $${m.toFixed(2)} por cada copia física vendida.`,
    cleanSavingsNote: 'La economía POD es sostenible.',
    marketQuoteTitle: 'Impacto del volumen',
    marketQuoteDetails: (s) => `Procesando ${s} pedidos físicos mensualmente.`,
    outstandingItemsLabel: (c) => `Riesgos económicos (${c}):`,
    findingPod01Title: 'Margen negativo detectado',
    findingPod01Detail: 'Tu costo base + envío supera el precio de venta. Sube el precio o busca un socio POD más barato.',
    findingPod02Title: 'Bajo volumen para gastos físicos',
    findingPod02Detail: 'Los patrones físicos a este volumen pueden no justificar el tiempo de configuración frente a las ventas digitales.',
    cannibalShare: 'Cuota de canibalización',
    channel: 'Canal',
    colorPages: 'Páginas a color',
    coverLayoutCost0: 'Costo de portada/diseño (0 = hundido)',
    coverLayoutHours: 'Horas de portada/diseño',
    currentDigitalUnitsMo: 'Unidades digitales actuales/mes',
    digitalPdfPrice: 'Precio del PDF digital',
    expectedPhysicalUnitsMo: 'Unidades físicas esperadas/mes',
    listPrice: 'Precio de lista',
    negativeMonthlyNetMeans: 'Un neto mensual negativo significa que el título físico pierde dinero cada mes a este volumen — sube la lista, corta páginas o reserva el folleto puramente como embudo de marketing para el PDF.',
    opportunityRate: 'Tasa de oportunidad',
    totalPages: 'Páginas totales',
    verifiedAnchorsKdpB: 'Anclas verificadas: KDP B&N ≤110 páginas a $2.30 fijos/copia ($5.65 base tapa dura, +$0.012/página arriba de 110); tinta color $0.065/página; la banda del 60% necesita lista de $9.99+, sino 50%; KDP toma 30% en Amazon.com (40% en distribución expandida); IngramSpark ≈ 55% de descuento mayorista (residual de lector directo ≈ lista × 5%); Lulu directa ≈ 20% de corte; Etsy ≈ 11% mezclado. Los folletos de patrones físicos se venden a $12–25; una copia impresa típicamente canibaliza ~30% de una venta digital del mismo diseño.',
    wouldAPrintedBooklet: '¿Un folleto impreso de tus patrones realmente daría dinero — o canibalizaría silenciosamente tus ventas de PDF mientras el costo de impresión se come el margen? La especificación está verificada: KDP cobra $2.30 fijos por copia hasta 110 páginas en blanco y negro, luego $0.012/página; la banda de regalía del 60% solo aplica a lista de $9.99+; la tinta a color cuesta $0.065/página; el mínimo del libro de bolsillo es 24 páginas; y el descuento mayorista de ~55% de IngramSpark significa que las ventas directas a lectoras a través de él netean ~$0.70–2.40/copia donde Lulu directa paga $5.50–12.70 al mismo precio. Diseñadoras han pagado facturas de impresión KDP que dejaban $1/copia frente a un PDF de $6 — este lab tasifica la especificación, el canal y la canibalización antes de comprometerte.',
  },
  pt: {
    title: 'Laboratório de Moldes Print-on-Demand',
    description: 'Analise a economia da venda de moldes físicos via serviços POD como Gelato ou Printful.',
    patternNameLabel: 'Nome do modelo',
    basePriceLabel: 'Preço de venda',
    monthlySalesLabel: 'Vendas mensais',
    podPlatformFeeLabel: 'Custo base POD',
    shippingEstimateLabel: 'Estimativa de envio',
    monthlyNetLabel: 'Lucro líquido mensal',
    marginPerUnitLabel: 'Margem por unidade',
    verdictClean: 'Margens saudáveis',
    verdictCheck: 'Margens apertadas',
    verdictFix: 'Prejuízo',
    savingsNote: (m) => `Retendo $${m.toFixed(2)} por cada cópia física vendida.`,
    cleanSavingsNote: 'A economia POD é sustentável.',
    marketQuoteTitle: 'Impacto do volume',
    marketQuoteDetails: (s) => `Processando ${s} pedidos físicos mensalmente.`,
    outstandingItemsLabel: (c) => `Riscos económicos (${c}):`,
    findingPod01Title: 'Margem negativa detetada',
    findingPod01Detail: 'O seu custo base + envio excede o preço de venda. Aumente o preço ou encontre um parceiro POD mais barato.',
    findingPod02Title: 'Baixo volume para custos físicos',
    findingPod02Detail: 'Moldes físicos neste volume podem não justificar o tempo de configuração face às vendas digitais.',
    cannibalShare: 'Parcela de canibalização',
    channel: 'Canal',
    colorPages: 'Páginas coloridas',
    coverLayoutCost0: 'Custo de capa/layout (0 = afundado)',
    coverLayoutHours: 'Horas de capa/layout',
    currentDigitalUnitsMo: 'Unidades digitais atuais/mês',
    digitalPdfPrice: 'Preço do PDF digital',
    expectedPhysicalUnitsMo: 'Unidades físicas esperadas/mês',
    listPrice: 'Preço de lista',
    negativeMonthlyNetMeans: 'Um líquido mensal negativo significa que o título físico perde dinheiro todo mês nesse volume — aumente a lista, corte páginas ou reserve o livreto puramente como funil de marketing para o PDF.',
    opportunityRate: 'Taxa de oportunidade',
    totalPages: 'Total de páginas',
    verifiedAnchorsKdpB: 'Âncoras verificadas: KDP P&B ≤110 páginas a US$ 2,30 fixos/cópia (base capa dura US$ 5,65, +US$ 0,012/página acima de 110); tinta colorida US$ 0,065/página; a banda de 60% exige lista de US$ 9,99+, senão 50%; o KDP fica com 30% na Amazon.com (40% em distribuição expandida); IngramSpark ≈ 55% de desconto de atacado (residual de leitor direto ≈ lista × 5%); Lulu direta ≈ 20% de corte; Etsy ≈ 11% misturado. Livretos físicos de padrões vendem US$ 12–25; uma cópia impressa tipicamente canibaliza ~30% de uma venda digital do mesmo design.',
    wouldAPrintedBooklet: 'Um livreto impresso dos seus padrões realmente daria dinheiro — ou canibalizaria silenciosamente suas vendas de PDF enquanto o custo de impressão consome a margem? A especificação está verificada: o KDP cobra US$ 2,30 fixos por cópia até 110 páginas em preto e branco, depois US$ 0,012/página; a banda de royalties de 60% só se aplica a partir de US$ 9,99 de lista; tinta colorida custa US$ 0,065/página; o mínimo do livro de capa mole é 24 páginas; e o desconto de atacado de ~55% da IngramSpark significa que vendas diretas aos leitores por ela rendem ~US$ 0,70–2,40/cópia onde a Lulu direta paga US$ 5,50–12,70 no mesmo preço. Designers pagaram contas de impressão KDP que deixavam US$ 1/cópia frente a um PDF de US$ 6 — este lab precifica a especificação, o canal e a canibalização antes de você se comprometer.',
  },
};

export const POD_PATTERNS_COPY = COPY;
