import { LanguageCode } from './i18n';

export interface PodcastAffiliateCopy {
  title: string;
  description: string;
  podcastNameLabel: string;
  listenersPerEpisodeLabel: string;
  affiliateCommissionLabel: string;
  patternPriceLabel: string;
  conversionRateLabel: string;
  episodesPerMonthLabel: string;
  monthlyNetLabel: string;
  totalReachLabel: string;
  impliedSalesLabel: string;
  verdictClean: string;
  verdictCheck: string;
  verdictFix: string;
  savingsNote: (count: number) => string;
  cleanSavingsNote: string;
  marketQuoteTitle: string;
  marketQuoteDetails: (reach: number) => string;
  preEditSummaryHeader: (name: string) => string;
  outstandingItemsLabel: (count: number) => string;
  findingPa01Title: string;
  findingPa01Detail: string;
  findingPa02Title: string;
  findingPa02Detail: string;
  // Legacy keys to maintain compatibility if needed
  adSlotsPerEpisode: string;
  avgOrderValue: string;
  clicksPerEpisode: string;
  commission: string;
  conversion: string;
  downloadsPerEpisode: string;
  enterYourDownloadsPer: string;
  episodesPerMonth: string;
  fillRateShareOf: string;
  flatFeePerRead: string;
  marketSanityHostReadMidRolls: string;
  networkMarketplaceCut: string;
  oneOffSetupCostsMic: string;
  platformCut: string;
  productionHoursPerEpisode: string;
  recurringMonthlyCostsHosting: string;
  sponsoredReadsPerMonth: string;
  whatIsYourKnitting: string;
  yourQuotedCpm: string;
}

export const COPY: Record<LanguageCode, PodcastAffiliateCopy> = {
  en: {
    title: 'Podcast Affiliate Lab',
    description: 'Calculate the ROI of podcast sponsorships and affiliate deals based on listener reach and conversion.',
    podcastNameLabel: 'Podcast Name',
    listenersPerEpisodeLabel: 'Listeners per Episode',
    affiliateCommissionLabel: 'Affiliate Commission',
    patternPriceLabel: 'Pattern Price',
    conversionRateLabel: 'Conversion Rate',
    episodesPerMonthLabel: 'Episodes per Month',
    monthlyNetLabel: 'Monthly Net Revenue',
    totalReachLabel: 'Total Monthly Reach',
    impliedSalesLabel: 'Implied Sales',
    verdictClean: 'High ROI Potential',
    verdictCheck: 'Moderate Potential',
    verdictFix: 'Low ROI Potential',
    savingsNote: (c) => `Modeling ${c} monthly sales from this channel.`,
    cleanSavingsNote: 'Channel performance is optimized.',
    marketQuoteTitle: 'Channel Reach',
    marketQuoteDetails: (r) => `Reaching ~${r} knitters monthly.`,
    preEditSummaryHeader: (name) => `Podcast ROI for ${name}`,
    outstandingItemsLabel: (c) => `Optimization Points (${c}):`,
    findingPa01Title: 'Low reach for commission rate',
    findingPa01Detail: 'The listener count is low compared to the expected commission. Consider a fixed fee or higher %.',
    findingPa02Title: 'High conversion barrier',
    findingPa02Detail: 'Your conversion rate estimate is aggressive for audio-only mentions. Use a 0.1-0.5% baseline.',
    adSlotsPerEpisode: 'Ad slots per episode',
    avgOrderValue: 'Avg order value',
    clicksPerEpisode: 'Clicks per episode',
    commission: 'Commission',
    conversion: 'Conversion',
    downloadsPerEpisode: 'Downloads per episode',
    enterYourDownloadsPer: 'Enter your downloads per episode and episode cadence for the lab to model the three lanes.',
    episodesPerMonth: 'Episodes per month',
    fillRateShareOf: 'Fill rate (share of episodes sold)',
    flatFeePerRead: 'Flat fee per read',
    marketSanityHostReadMidRolls: 'Market sanity: host-read mid-rolls trade $25–50 with host-read premium over programmatic ($15–25); industry standards are $18 pre-roll / $25 mid-roll. Network cuts run ~30%, marketplaces 10–20% (Podcorn 10%, Gumball 20%). Sponsorship is not worth pitching below ~200 downloads/episode and CPM starts working from ~5,000. Keep ad reads to 30–60 seconds and no more than ~10% of episode length — listener trust is the asset that makes host-read ads pay a premium.',
    networkMarketplaceCut: 'Network / marketplace cut',
    oneOffSetupCostsMic: 'One-off setup costs (mic, software)',
    platformCut: 'Platform cut',
    productionHoursPerEpisode: 'Production hours per episode',
    recurringMonthlyCostsHosting: 'Recurring monthly costs (hosting, editing)',
    sponsoredReadsPerMonth: 'Sponsored reads per month',
    whatIsYourKnitting: 'What is your knitting podcast, newsletter, or following actually worth — and which lane should you take at your current audience size? Industry CPM rates run $18 for a 30-sec pre-roll and $25 for a 60-sec mid-roll, with host-read mid-rolls at niche fiber-arts shows trading at $25–50 (a craft audience is a targeting premium, not a discount). Affiliate programs pay 10% (Knit Picks, Crochet.com) up to 30% (LoveCrafts). CPM deals only make sense from around 5,000 downloads/episode — below that, flat-fee reads and affiliate links are where small relevant shows actually profit. This lab models all three lanes side by side, nets out the 10–30% network cuts, prices your production hours against your real rate, and flags the exact deal terms to renegotiate.',
    yourQuotedCpm: 'Your quoted CPM',
  },
  de: {
    title: 'Podcast-Affiliate-Labor',
    description: 'Berechne den ROI von Podcast-Sponsoring und Affiliate-Deals basierend auf Reichweite und Konversion.',
    podcastNameLabel: 'Podcast-Name',
    listenersPerEpisodeLabel: 'Hörer pro Episode',
    affiliateCommissionLabel: 'Affiliate-Provision',
    patternPriceLabel: 'Anleitungspreis',
    conversionRateLabel: 'Konversionsrate',
    episodesPerMonthLabel: 'Episoden pro Monat',
    monthlyNetLabel: 'Monatlicher Netto-Umsatz',
    totalReachLabel: 'Monatliche Gesamtreichweite',
    impliedSalesLabel: 'Erwartete Verkäufe',
    verdictClean: 'Hohes ROI-Potenzial',
    verdictCheck: 'Mittleres Potenzial',
    verdictFix: 'Niedriges ROI-Potenzial',
    savingsNote: (c) => `Modellierung von ${c} monatlichen Verkäufen über diesen Kanal.`,
    cleanSavingsNote: 'Kanal-Performance ist optimiert.',
    marketQuoteTitle: 'Kanal-Reichweite',
    marketQuoteDetails: (r) => `Erreicht ca. ${r} Stricker/innen monatlich.`,
    preEditSummaryHeader: (name) => `Podcast-ROI für ${name}`,
    outstandingItemsLabel: (c) => `Optimierungspunkte (${c}):`,
    findingPa01Title: 'Geringe Reichweite für Provisionssatz',
    findingPa01Detail: 'Die Hörerzahl ist im Vergleich zur erwarteten Provision gering. Erwäge eine Fixgebühr oder einen höheren %-Satz.',
    findingPa02Title: 'Hohe Konversionsbarriere',
    findingPa02Detail: 'Deine Schätzung der Konversionsrate ist für reine Audio-Erwähnungen zu optimistisch. Nutze 0,1-0,5% als Basis.',
    adSlotsPerEpisode: 'Werbefenster pro Episode',
    avgOrderValue: 'Durchschn. Bestellwert',
    clicksPerEpisode: 'Klicks pro Episode',
    commission: 'Provision',
    conversion: 'Konversion',
    downloadsPerEpisode: 'Downloads pro Episode',
    enterYourDownloadsPer: 'Gib deine Downloads pro Episode und deinen Episoden-Takt an, damit das Lab die drei Spuren modellieren kann.',
    episodesPerMonth: 'Episoden pro Monat',
    fillRateShareOf: 'Fill-Rate (Anteil verkaufter Episoden)',
    flatFeePerRead: 'Flat-Fee pro Read',
    marketSanityHostReadMidRolls: 'Markt-Plausibilitätscheck: Host-Read-Mid-Rolls handeln 25–50 $ mit Host-Read-Premium über programmatisch (15–25 $); Industriestandards sind 18 $ Pre-Roll / 25 $ Mid-Roll. Netzwerk-Cuts ~30 %, Marktplätze 10–20 % (Podcorn 10 %, Gumball 20 %). Sponsorship lohnt unter ~200 Downloads/Episode nicht zu pitchen; CPM funktioniert ab ~5.000. Werbereads auf 30–60 Sekunden und höchstens ~10 % der Episodenlänge halten — Hörervertrauen ist das Asset, das Host-Read-Werbung teuer macht.',
    networkMarketplaceCut: 'Netzwerk-/Marktplatz-Cut',
    oneOffSetupCostsMic: 'Einmalige Setup-Kosten (Mikrofon, Software)',
    platformCut: 'Plattform-Cut',
    productionHoursPerEpisode: 'Produktionsstunden pro Episode',
    recurringMonthlyCostsHosting: 'Laufende Monatskosten (Hosting, Schnitt)',
    sponsoredReadsPerMonth: 'Gesponserte Reads pro Monat',
    whatIsYourKnitting: 'Was sind dein Strick-Podcast, dein Newsletter oder dein Publikum wirklich wert — und welche Spur solltest du bei deiner aktuellen Zuschauerzahl fahren? Industrielle CPM-Sätze liegen bei 18 $ für einen 30-Sek.-Pre-Roll und 25 $ für einen 60-Sek.-Mid-Roll, wobei Host-Read-Mid-Rolls bei Nischen-Fiber-Arts-Shows bei 25–50 $ handeln (ein Craft-Publikum ist ein Targeting-Bonus, kein Rabatt). Affiliate-Programme zahlen 10 % (Knit Picks, Crochet.com) bis 30 % (LoveCrafts). CPM-Deals lohnen sich erst ab ~5.000 Downloads/Episode — darunter sind Flat-Fee-Reads und Affiliate-Links die Kanäle, mit denen kleine relevante Shows wirklich verdienen. Dieses Lab modelliert alle drei Spuren nebeneinander, rechnet die 10–30 % Netzwerk-Cuts raus, bepreist deine Produktionsstunden gegen deine echte Rate und flaggt die Deal-Terme, die du neu verhandeln solltest.',
    yourQuotedCpm: 'Dein geforderter CPM',
  },
  fr: {
    title: 'Laboratoire Affiliation Podcast',
    description: 'Calculez le ROI des sponsorings de podcasts et des contrats d\'affiliation basés sur l\'audience et la conversion.',
    podcastNameLabel: 'Nom du Podcast',
    listenersPerEpisodeLabel: 'Auditeurs par épisode',
    affiliateCommissionLabel: 'Commission d\'affiliation',
    patternPriceLabel: 'Prix du modèle',
    conversionRateLabel: 'Taux de conversion',
    episodesPerMonthLabel: 'Épisodes par mois',
    monthlyNetLabel: 'Revenu net mensuel',
    totalReachLabel: 'Audience mensuelle totale',
    impliedSalesLabel: 'Ventes prévues',
    verdictClean: 'Haut potentiel ROI',
    verdictCheck: 'Potentiel modéré',
    verdictFix: 'Faible potentiel ROI',
    savingsNote: (c) => `Modélisation de ${c} ventes mensuelles via ce canal.`,
    cleanSavingsNote: 'La performance du canal est optimisée.',
    marketQuoteTitle: 'Portée du canal',
    marketQuoteDetails: (r) => `Touche environ ${r} tricoteurs par mois.`,
    preEditSummaryHeader: (name) => `ROI Podcast pour ${name}`,
    outstandingItemsLabel: (c) => `Points d'optimisation (${c}) :`,
    findingPa01Title: 'Faible portée pour le taux de commission',
    findingPa01Detail: 'Le nombre d\'auditeurs est faible par rapport à la commission attendue. Envisagez un frais fixe ou un % plus élevé.',
    findingPa02Title: 'Barrière de conversion élevée',
    findingPa02Detail: 'Votre estimation du taux de conversion est agressive pour des mentions audio uniquement. Utilisez une base de 0,1-0,5%.',
    adSlotsPerEpisode: 'Créneaux pub par épisode',
    avgOrderValue: 'Valeur moyenne de commande',
    clicksPerEpisode: 'Clics par épisode',
    commission: 'Commission',
    conversion: 'Conversion',
    downloadsPerEpisode: 'Téléchargements par épisode',
    enterYourDownloadsPer: 'Entrez vos téléchargements par épisode et votre cadence d’épisodes pour que le lab modélise les trois voies.',
    episodesPerMonth: 'Épisodes par mois',
    fillRateShareOf: 'Taux de remplissage (part d’épisodes vendus)',
    flatFeePerRead: 'Forfait par lecture',
    marketSanityHostReadMidRolls: 'Sanity check du marché : les mid-rolls lus par l’hôte se négocient 25–50 $ avec prime host-read sur le programmatique (15–25 $) ; standards de l’industrie : 18 $ pre-roll / 25 $ mid-roll. Coupes réseau ~30 %, marketplaces 10–20 % (Podcorn 10 %, Gumball 20 %). Le sponsoring ne vaut pas un pitch sous ~200 téléchargements/épisode ; le CPM fonctionne à partir de ~5 000. Gardez les pubs à 30–60 s et à moins de ~10 % de la durée d’épisode — la confiance des auditeurs est l’actif qui fait payer une prime aux pubs host-read.',
    networkMarketplaceCut: 'Coupe réseau / marketplace',
    oneOffSetupCostsMic: 'Coûts de setup uniques (micro, logiciels)',
    platformCut: 'Coupe de plateforme',
    productionHoursPerEpisode: 'Heures de production par épisode',
    recurringMonthlyCostsHosting: 'Coûts mensuels récurrents (hébergement, montage)',
    sponsoredReadsPerMonth: 'Lectures sponsorisées par mois',
    whatIsYourKnitting: 'Que valent réellement votre podcast tricot, votre newsletter ou votre audience — et quelle voie devriez-vous emprunter à votre taille d’audience actuelle ? Les tarifs CPM du marché tournent autour de 18 $ pour un pre-roll de 30 s et 25 $ pour un mid-roll de 60 s, les mid-rolls lus par l’hôte dans les shows de fiber arts de niche se négociant à 25–50 $ (une audience d’artisanes est une prime de ciblage, pas une remise). Les programmes d’affiliation paient 10 % (Knit Picks, Crochet.com) jusqu’à 30 % (LoveCrafts). Les deals CPM ne valent la peine qu’à partir d’environ 5 000 téléchargements/épisode — en dessous, les lectures à forfait et les liens d’affiliation sont là où les petites émissions pertinentes gagnent réellement. Ce lab modélise les trois voies côte à côte, déduit les coupes de réseau de 10–30 %, chiffre vos heures de production face à votre vrai tarif et signale les conditions de deal à renégocier.',
    yourQuotedCpm: 'Votre CPM demandé',
  },
  es: {
    title: 'Laboratorio de Afiliación Podcast',
    description: 'Calcula el ROI de patrocinios de podcasts y acuerdos de afiliados basados en el alcance y la conversión.',
    podcastNameLabel: 'Nombre del Podcast',
    listenersPerEpisodeLabel: 'Oyentes por episodio',
    affiliateCommissionLabel: 'Comisión de afiliado',
    patternPriceLabel: 'Precio del patrón',
    conversionRateLabel: 'Tasa de conversión',
    episodesPerMonthLabel: 'Episodios al mes',
    monthlyNetLabel: 'Ingreso neto mensual',
    totalReachLabel: 'Alcance mensual total',
    impliedSalesLabel: 'Ventas previstas',
    verdictClean: 'Alto potencial de ROI',
    verdictCheck: 'Potencial moderado',
    verdictFix: 'Bajo potencial de ROI',
    savingsNote: (c) => `Modelando ${c} ventas mensuales desde este canal.`,
    cleanSavingsNote: 'El rendimiento del canal está optimizado.',
    marketQuoteTitle: 'Alcance del canal',
    marketQuoteDetails: (r) => `Llegando a ~${r} tejedores mensualmente.`,
    preEditSummaryHeader: (name) => `ROI de Podcast para ${name}`,
    outstandingItemsLabel: (c) => `Puntos de optimización (${c}):`,
    findingPa01Title: 'Bajo alcance para la tasa de comisión',
    findingPa01Detail: 'El número de oyentes es bajo en comparación con la comisión esperada. Considera una tarifa fija o un % más alto.',
    findingPa02Title: 'Barrera de conversión alta',
    findingPa02Detail: 'Tu estimación de tasa de conversión es agresiva para menciones solo de audio. Usa una base de 0.1-0.5%.',
    adSlotsPerEpisode: 'Slots de anuncio por episodio',
    avgOrderValue: 'Valor promedio de pedido',
    clicksPerEpisode: 'Clics por episodio',
    commission: 'Comisión',
    conversion: 'Conversión',
    downloadsPerEpisode: 'Descargas por episodio',
    enterYourDownloadsPer: 'Ingresa tus descargas por episodio y tu cadencia de episodios para que el lab modele los tres carriles.',
    episodesPerMonth: 'Episodios por mes',
    fillRateShareOf: 'Tasa de llenado (parte de episodios vendidos)',
    flatFeePerRead: 'Tarifa plana por lectura',
    marketSanityHostReadMidRolls: 'Sanity de mercado: mid-rolls leídos por host transan a $25–50 con prima host-read sobre programático ($15–25); estándares de industria: $18 pre-roll / $25 mid-roll. Cortes de red ~30%, marketplaces 10–20% (Podcorn 10%, Gumball 20%). El sponsorship no vale un pitch bajo ~200 descargas/episodio; el CPM funciona desde ~5,000. Mantén los anuncios a 30–60 s y a menos de ~10% de la duración del episodio — la confianza de las oyentes es el activo que hace que los anuncios host-read paguen una prima.',
    networkMarketplaceCut: 'Corte de red / marketplace',
    oneOffSetupCostsMic: 'Costos de setup únicos (micrófono, software)',
    platformCut: 'Corte de plataforma',
    productionHoursPerEpisode: 'Horas de producción por episodio',
    recurringMonthlyCostsHosting: 'Costos mensuales recurrentes (hosting, edición)',
    sponsoredReadsPerMonth: 'Lecturas patrocinadas por mes',
    whatIsYourKnitting: '¿Cuánto valen realmente tu podcast de tejido, tu newsletter o tu audiencia — y qué carril deberías tomar al tamaño actual de tu audiencia? Las tarifas CPM de la industria corren a $18 para un pre-roll de 30 s y $25 para un mid-roll de 60 s, con mid-rolls leídos por el host en shows de arte textil de nicho transando a $25–50 (una audiencia craft es una prima de segmentación, no un descuento). Los programas de afiliados pagan 10% (Knit Picks, Crochet.com) hasta 30% (LoveCrafts). Los deals CPM solo tienen sentido desde ~5,000 descargas/episodio — por debajo, las lecturas de tarifa plana y los enlaces de afiliados son donde los shows pequeños relevantes realmente ganan. Este lab modela los tres carriles lado a lado, resta los cortes de red de 10–30%, tasifica tus horas de producción contra tu tasa real y marca los términos de deal a renegociar.',
    yourQuotedCpm: 'Tu CPM cotizado',
  },
  pt: {
    title: 'Laboratório de Afiliados Podcast',
    description: 'Calcule o ROI de patrocínios de podcasts e acordos de afiliados baseados no alcance e na conversão.',
    podcastNameLabel: 'Nome do Podcast',
    listenersPerEpisodeLabel: 'Ouvintes por episódio',
    affiliateCommissionLabel: 'Comissão de afiliado',
    patternPriceLabel: 'Preço do modelo',
    conversionRateLabel: 'Taxa de conversão',
    episodesPerMonthLabel: 'Episódios por mês',
    monthlyNetLabel: 'Receita líquida mensal',
    totalReachLabel: 'Alcance mensal total',
    impliedSalesLabel: 'Vendas previstas',
    verdictClean: 'Alto potencial de ROI',
    verdictCheck: 'Potencial moderado',
    verdictFix: 'Baixo potencial de ROI',
    savingsNote: (c) => `Modelando ${c} vendas mensais deste canal.`,
    cleanSavingsNote: 'O desempenho do canal está otimizado.',
    marketQuoteTitle: 'Alcance do canal',
    marketQuoteDetails: (r) => `Atingindo ~${r} tricotadores mensalmente.`,
    preEditSummaryHeader: (name) => `ROI de Podcast para ${name}`,
    outstandingItemsLabel: (c) => `Pontos de otimização (${c}):`,
    findingPa01Title: 'Baixo alcance para a taxa de comissão',
    findingPa01Detail: 'O número de ouvintes é baixo em relação à comissão esperada. Considere uma taxa fixa ou um % maior.',
    findingPa02Title: 'Barreira de conversão alta',
    findingPa02Detail: 'A sua estimativa de taxa de conversão é agressiva para menções apenas de áudio. Use uma base de 0.1-0.5%.',
    adSlotsPerEpisode: 'Slots de anúncio por episódio',
    avgOrderValue: 'Valor médio do pedido',
    clicksPerEpisode: 'Cliques por episódio',
    commission: 'Comissão',
    conversion: 'Conversão',
    downloadsPerEpisode: 'Downloads por episódio',
    enterYourDownloadsPer: 'Digite seus downloads por episódio e sua cadência de episódios para que o lab modele as três faixas.',
    episodesPerMonth: 'Episódios por mês',
    fillRateShareOf: 'Taxa de preenchimento (parte de episódios vendidos)',
    flatFeePerRead: 'Taxa fixa por leitura',
    marketSanityHostReadMidRolls: 'Sanity de mercado: mid-rolls lidos pelo host negociam a US$ 25–50 com prêmio host-read sobre programático (US$ 15–25); padrões da indústria: US$ 18 pre-roll / US$ 25 mid-roll. Cortes de rede ~30%, marketplaces 10–20% (Podcorn 10%, Gumball 20%). O sponsorship não vale um pitch abaixo de ~200 downloads/episódio; o CPM funciona a partir de ~5.000. Mantenha os anúncios em 30–60 s e em menos de ~10% da duração do episódio — a confiança das ouvintes é o ativo que faz os anúncios host-read pagarem um prêmio.',
    networkMarketplaceCut: 'Corte de rede / marketplace',
    oneOffSetupCostsMic: 'Custos de setup únicos (microfone, software)',
    platformCut: 'Corte de plataforma',
    productionHoursPerEpisode: 'Horas de produção por episódio',
    recurringMonthlyCostsHosting: 'Custos mensais recorrentes (hosting, edição)',
    sponsoredReadsPerMonth: 'Leituras patrocinadas por mês',
    whatIsYourKnitting: 'Quanto valem realmente seu podcast de tricô, sua newsletter ou sua audiência — e qual faixa você deveria tomar no tamanho atual de sua audiência? As taxas CPM da indústria rodam a US$ 18 para um pre-roll de 30 s e US$ 25 para um mid-roll de 60 s, com mid-rolls lidos pelo host em programas de fibra artesanal de nicho negociando a US$ 25–50 (uma audiência craft é um prêmio de segmentação, não um desconto). Programas de afiliados pagam 10% (Knit Picks, Crochet.com) até 30% (LoveCrafts). Deals CPM só fazem sentido a partir de ~5.000 downloads/episódio — abaixo disso, leituras de tarifa fixa e links de afiliados são onde os programas pequenos relevantes realmente lucram. Este lab modelos as três faixas lado a lado, deduz os cortes de rede de 10–30%, precifica suas horas de produção contra sua taxa real e sinaliza os termos de deal a renegociar.',
    yourQuotedCpm: 'Seu CPM cotado',
  },
};

export const PODCAST_AFFILIATE_COPY = COPY;
