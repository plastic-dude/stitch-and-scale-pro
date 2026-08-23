import type { LanguageCode } from './i18n.js';
import type { BragCardStyle, BragCardTemplate, BragStats } from './brag-card.js';
import { fmtMoney } from './receipt-lab.js';

export type BragCardAccent = 'rose' | 'honey' | 'moss' | 'denim';
export type BragCardOption = { label: string; blurb: string };

export interface BragCardCopy {
  sales: string;
  published: string;
  profitableMonths: string;
  bestMonth: string;
  earned: string;
  earnedLabel: string;
  patternSales: string;
  oneStudio: string;
  monthsAllProfitable: string;
  onRecord: string;
  total: string;
  averagePerSale: string;
  ledger: string;
  honestLedger: string;
  knitLocal: string;
  report: string;
  cameo: string;
  gaugeSample: string;
  studioFallback: string;
  templateOptions: Record<BragCardTemplate, BragCardOption>;
  styleOptions: Record<BragCardStyle, string>;
  accentOptions: Record<BragCardAccent, string>;
  title: string;
  description: string;
  empty: string;
  studioName: string;
  studioPlaceholder: string;
  streakCaption: string;
  publishedHeadline: string;
  publishedCaption: string;
  highlight: string;
  style: string;
  accent: string;
  preview: string;
  captionLabel: string;
  copyCaption: string;
  share: string;
  download: string;
  downloadRequested: string;
  downloadRequestedDescription: string;
  shareRequestAccepted: string;
  shareRequestDescription: string;
  exportFailed: string;
  copyFailed: string;
  caption: (stats: BragStats, currency: string, template: BragCardTemplate, studioName: string) => {
    headline: string;
    subline: string;
    caption: string;
  };
}

const make = (_locale: LanguageCode, words: Omit<BragCardCopy, 'caption'> & { caption?: BragCardCopy['caption'] }): BragCardCopy => ({
  ...words,
  caption: words.caption ?? ((stats, currency, template, studioName) => {
    const rev = fmtMoney(stats.totalRevenue, currency);
    const perSale = fmtMoney(stats.revenuePerSale, currency);
    const best = stats.bestMonth ? `${words.bestMonth}: ${fmtMoney(stats.bestMonthProfit, currency)}` : '';
    const prefix = studioName ? `${studioName}: ` : '';
    if (template === 'income') return { headline: `${rev} ${words.patternSales}`, subline: `${stats.totalSales} ${words.sales}${best ? ` · ${best}` : ''}`, caption: `${prefix}${rev} ${words.earned} — ${stats.totalSales} ${words.sales}, ${perSale} ${words.averagePerSale}.` };
    if (template === 'sales') return { headline: `${stats.totalSales} ${words.sales}, ${words.oneStudio}`, subline: `${perSale} ${words.averagePerSale}${best ? ` · ${best}` : ''}`, caption: `${prefix}${stats.totalSales} ${words.sales}, ${rev} ${words.total}.` };
    if (template === 'streak') return { headline: `${stats.profitMonths} ${words.monthsAllProfitable}`, subline: `${words.onRecord} · ${rev} ${words.total}`, caption: `${prefix}${words.streakCaption.replace('{count}', String(stats.profitMonths)).replace('{total}', rev)}` };
    return { headline: `${stats.publishedCount} ${words.publishedHeadline}`, subline: `${rev} ${words.earned} · ${stats.totalSales} ${words.sales}`, caption: `${prefix}${words.publishedCaption.replace('{count}', String(stats.publishedCount)).replace('{revenue}', rev).replace('{sales}', String(stats.totalSales))}` };
  }),
});

export const COPY: Record<LanguageCode, BragCardCopy> = {
  en: make('en', {
    title: 'Brag Cards',
    studioPlaceholder: 'My Studio',
    studioFallback: 'My Studio',
    templateOptions: {
      income: { label: 'Income', blurb: 'Lead with the total earned' },
      sales: { label: 'Sales', blurb: 'Lead with the sale count' },
      streak: { label: 'Streak', blurb: 'Celebrate profitable months' },
      published: { label: 'Published', blurb: 'Lead with the portfolio' },
    },
    styleOptions: { navy: 'Navy', editorial: 'Editorial', swatch: 'Gauge Swatch', selvedge: 'Selvedge', swiss: 'Swiss Poster', cameo: 'Stitch Cameo' },
    accentOptions: { rose: 'Rose', honey: 'Honey', moss: 'Moss', denim: 'Denim' },
    gaugeSample: '18 sts × 24 rows / 4in',
    earnedLabel: 'earned',
    streakCaption: '{count} months in a row finishing above zero. {total} on the books and still designing. This is what a real design studio looks like.',
    publishedHeadline: 'patterns published',
    publishedCaption: '{count} published patterns, {revenue} earned, {sales} sales. The portfolio is the résumé.',
    description: 'Turn your own ledger into a shareable card — your numbers, your studio name, and a caption that sounds like you.',
    empty: 'Nothing to brag about yet — log sales in Receipt Lab or publish a design in Design Ledger and the cards will fill themselves in.',
    studioName: 'Studio name on the card',
    highlight: 'Pick your highlight',
    style: 'Card style',
    accent: 'Card accent',
    preview: 'Card preview (1080 × 1080)',
    captionLabel: 'Caption',
    copyCaption: 'Copy caption',
    share: 'Share',
    download: 'Download PNG',
    downloadRequested: 'Download requested',
    downloadRequestedDescription: 'Your browser was asked to download the PNG. Check your downloads.',
    shareRequestAccepted: 'Share request accepted',
    shareRequestDescription: 'Your device accepted the PNG for sharing. Any delivery is handled by the selected app.',
    exportFailed: 'Card export failed',
    copyFailed: 'Copy failed',
    sales: 'sales',
    published: 'published',
    profitableMonths: 'profitable months',
    bestMonth: 'best month',
    earned: 'earned from pattern sales',
    patternSales: 'in pattern sales',
    oneStudio: 'one studio',
    monthsAllProfitable: 'months, all profitable',
    onRecord: 'on record',
    total: 'total',
    averagePerSale: 'average per sale',
    ledger: 'THE LEDGER',
    honestLedger: 'HONEST LEDGER',
    knitLocal: 'KNIT LOCAL',
    report: 'LEDGER REPORT',
    cameo: 'CAMEO',
  }),
  de: make('de', {
    title: 'Brag Cards',
    studioPlaceholder: 'Mein Studio',
    studioFallback: 'Mein Studio',
    templateOptions: {
      income: { label: 'Einnahmen', blurb: 'Gesamteinnahmen hervorheben' },
      sales: { label: 'Verkäufe', blurb: 'Anzahl der Verkäufe hervorheben' },
      streak: { label: 'Serie', blurb: 'Profitable Monate feiern' },
      published: { label: 'Veröffentlicht', blurb: 'Portfolio hervorheben' },
    },
    styleOptions: { navy: 'Marineblau', editorial: 'Editorial', swatch: 'Maschenprobe', selvedge: 'Webkante', swiss: 'Schweizer Plakat', cameo: 'Maschen-Cameo' },
    accentOptions: { rose: 'Rosé', honey: 'Honig', moss: 'Moos', denim: 'Denim' },
    gaugeSample: '18 M × 24 R / 4in',
    earnedLabel: 'verdient',
    streakCaption: '{count} Monate in Folge über null. {total} insgesamt und weiterhin im Designprozess.',
    publishedHeadline: 'Muster veröffentlicht',
    publishedCaption: '{count} veröffentlichte Muster, {revenue} verdient, {sales} Verkäufe.',
    description: 'Verwandle dein eigenes Ledger in eine teilbare Karte — deine Zahlen, dein Studio und eine Bildunterschrift, die nach dir klingt.',
    empty: 'Noch nichts zum Prahlen — erfasse Verkäufe im Receipt Lab oder veröffentliche ein Design im Design Ledger.',
    studioName: 'Studio-Name auf der Karte',
    highlight: 'Highlight auswählen',
    style: 'Kartendesign',
    accent: 'Kartenakzent',
    preview: 'Kartenvorschau (1080 × 1080)',
    captionLabel: 'Bildunterschrift',
    copyCaption: 'Bildunterschrift kopieren',
    share: 'Teilen',
    download: 'PNG herunterladen',
    downloadRequested: 'Download angefordert',
    downloadRequestedDescription: 'Dein Browser wurde aufgefordert, das PNG herunterzuladen. Prüfe deine Downloads.',
    shareRequestAccepted: 'Teilanfrage angenommen',
    shareRequestDescription: 'Dein Gerät hat das PNG zum Teilen übernommen. Die Zustellung übernimmt die ausgewählte App.',
    exportFailed: 'Kartenexport fehlgeschlagen',
    copyFailed: 'Kopieren fehlgeschlagen',
    sales: 'Verkäufe',
    published: 'veröffentlicht',
    profitableMonths: 'profitablen Monaten',
    bestMonth: 'bester Monat',
    earned: 'aus Musterverkäufen verdient',
    patternSales: 'aus Musterverkäufen',
    oneStudio: 'ein Studio',
    monthsAllProfitable: 'Monate, alle profitabel',
    onRecord: 'laut Aufzeichnungen',
    total: 'insgesamt',
    averagePerSale: 'durchschnittlich pro Verkauf',
    ledger: 'DAS LEDGER',
    honestLedger: 'EHRLICHES LEDGER',
    knitLocal: 'LOKAL GESTRICKT',
    report: 'LEDGER-BERICHT',
    cameo: 'CAMEO',
  }),
  fr: make('fr', {
    title: 'Cartes de réussite',
    studioPlaceholder: 'Mon atelier',
    studioFallback: 'Mon atelier',
    templateOptions: {
      income: { label: 'Revenus', blurb: 'Mettre en avant le total gagné' },
      sales: { label: 'Ventes', blurb: 'Mettre en avant le nombre de ventes' },
      streak: { label: 'Série', blurb: 'Célébrer les mois bénéficiaires' },
      published: { label: 'Publiés', blurb: 'Mettre en avant le portfolio' },
    },
    styleOptions: { navy: 'Marine', editorial: 'Éditorial', swatch: 'Échantillon', selvedge: 'Lisière', swiss: 'Affiche suisse', cameo: 'Médaillon tricot' },
    accentOptions: { rose: 'Rose', honey: 'Miel', moss: 'Mousse', denim: 'Denim' },
    gaugeSample: '18 m × 24 r / 10 cm',
    earnedLabel: 'gagné',
    streakCaption: '{count} mois consécutifs au-dessus de zéro. {total} au total, et la création continue.',
    publishedHeadline: 'modèles publiés',
    publishedCaption: '{count} modèles publiés, {revenue} gagnés, {sales} ventes.',
    description: 'Transformez votre registre en carte à partager — vos chiffres, votre atelier et une légende qui vous ressemble.',
    empty: 'Pas encore de quoi se vanter — ajoutez des ventes dans Receipt Lab ou publiez un modèle dans Design Ledger.',
    studioName: 'Nom de l’atelier sur la carte',
    highlight: 'Choisir un temps fort',
    style: 'Style de carte',
    accent: 'Accent de carte',
    preview: 'Aperçu de la carte (1080 × 1080)',
    captionLabel: 'Légende',
    copyCaption: 'Copier la légende',
    share: 'Partager',
    download: 'Télécharger le PNG',
    downloadRequested: 'Téléchargement demandé',
    downloadRequestedDescription: 'Votre navigateur a reçu la demande de télécharger le PNG. Vérifiez vos téléchargements.',
    shareRequestAccepted: 'Demande de partage acceptée',
    shareRequestDescription: 'Votre appareil a accepté le PNG pour le partager. La livraison est gérée par l’application choisie.',
    exportFailed: 'Échec de l’export de la carte',
    copyFailed: 'Échec de la copie',
    sales: 'ventes',
    published: 'publiés',
    profitableMonths: 'mois bénéficiaires',
    bestMonth: 'meilleur mois',
    earned: 'gagnés grâce aux ventes de patrons',
    patternSales: 'de ventes de patrons',
    oneStudio: 'un atelier',
    monthsAllProfitable: 'mois, tous bénéficiaires',
    onRecord: 'au registre',
    total: 'au total',
    averagePerSale: 'en moyenne par vente',
    ledger: 'LE REGISTRE',
    honestLedger: 'REGISTRE HONNÊTE',
    knitLocal: 'TRICOT LOCAL',
    report: 'RAPPORT DU REGISTRE',
    cameo: 'CAMEO',
  }),
  es: make('es', {
    title: 'Tarjetas de logro',
    studioPlaceholder: 'Mi estudio',
    studioFallback: 'Mi estudio',
    templateOptions: {
      income: { label: 'Ingresos', blurb: 'Destaca el total ganado' },
      sales: { label: 'Ventas', blurb: 'Destaca el número de ventas' },
      streak: { label: 'Racha', blurb: 'Celebra los meses rentables' },
      published: { label: 'Publicados', blurb: 'Destaca el portafolio' },
    },
    styleOptions: { navy: 'Azul marino', editorial: 'Editorial', swatch: 'Muestra de tensión', selvedge: 'Orillo', swiss: 'Cartel suizo', cameo: 'Medallón de punto' },
    accentOptions: { rose: 'Rosa', honey: 'Miel', moss: 'Musgo', denim: 'Denim' },
    gaugeSample: '18 p × 24 v / 10 cm',
    earnedLabel: 'ganado',
    streakCaption: '{count} meses seguidos por encima de cero. {total} en total y el diseño continúa.',
    publishedHeadline: 'patrones publicados',
    publishedCaption: '{count} patrones publicados, {revenue} ganados, {sales} ventas.',
    description: 'Convierte tu registro en una tarjeta para compartir — tus cifras, tu estudio y un texto que suene a ti.',
    empty: 'Aún no hay nada que celebrar — registra ventas en Receipt Lab o publica un diseño en Design Ledger.',
    studioName: 'Nombre del estudio en la tarjeta',
    highlight: 'Elige tu destacado',
    style: 'Estilo de tarjeta',
    accent: 'Acento de tarjeta',
    preview: 'Vista previa (1080 × 1080)',
    captionLabel: 'Texto',
    copyCaption: 'Copiar texto',
    share: 'Compartir',
    download: 'Descargar PNG',
    downloadRequested: 'Descarga solicitada',
    downloadRequestedDescription: 'El navegador recibió la solicitud de descargar el PNG. Revisa tus descargas.',
    shareRequestAccepted: 'Solicitud de compartir aceptada',
    shareRequestDescription: 'El dispositivo aceptó el PNG para compartirlo. La entrega la gestiona la aplicación elegida.',
    exportFailed: 'Error al exportar la tarjeta',
    copyFailed: 'Error al copiar',
    sales: 'ventas',
    published: 'publicados',
    profitableMonths: 'meses rentables',
    bestMonth: 'mejor mes',
    earned: 'ganados con ventas de patrones',
    patternSales: 'en ventas de patrones',
    oneStudio: 'un estudio',
    monthsAllProfitable: 'meses, todos rentables',
    onRecord: 'en el registro',
    total: 'en total',
    averagePerSale: 'de media por venta',
    ledger: 'EL REGISTRO',
    honestLedger: 'REGISTRO HONESTO',
    knitLocal: 'TEJIDO LOCAL',
    report: 'INFORME DEL REGISTRO',
    cameo: 'CAMEO',
  }),
  pt: make('pt', {
    title: 'Cartões de conquista',
    studioPlaceholder: 'O meu estúdio',
    studioFallback: 'O meu estúdio',
    templateOptions: {
      income: { label: 'Receitas', blurb: 'Destacar o total ganho' },
      sales: { label: 'Vendas', blurb: 'Destacar o número de vendas' },
      streak: { label: 'Sequência', blurb: 'Celebrar meses rentáveis' },
      published: { label: 'Publicados', blurb: 'Destacar o portefólio' },
    },
    styleOptions: { navy: 'Azul-marinho', editorial: 'Editorial', swatch: 'Amostra de tensão', selvedge: 'Orla', swiss: 'Cartaz suíço', cameo: 'Medalhão de tricô' },
    accentOptions: { rose: 'Rosa', honey: 'Mel', moss: 'Musgo', denim: 'Denim' },
    gaugeSample: '18 m × 24 carr. / 10 cm',
    earnedLabel: 'ganho',
    streakCaption: '{count} meses seguidos acima de zero. {total} no total e o design continua.',
    publishedHeadline: 'padrões publicados',
    publishedCaption: '{count} padrões publicados, {revenue} ganhos, {sales} vendas.',
    description: 'Transforme o seu registo num cartão partilhável — os seus números, o seu estúdio e uma legenda com a sua voz.',
    empty: 'Ainda não há nada para celebrar — registe vendas no Receipt Lab ou publique um design no Design Ledger.',
    studioName: 'Nome do estúdio no cartão',
    highlight: 'Escolha o destaque',
    style: 'Estilo do cartão',
    accent: 'Destaque do cartão',
    preview: 'Pré-visualização do cartão (1080 × 1080)',
    captionLabel: 'Legenda',
    copyCaption: 'Copiar legenda',
    share: 'Partilhar',
    download: 'Descarregar PNG',
    downloadRequested: 'Transferência solicitada',
    downloadRequestedDescription: 'O navegador recebeu o pedido para descarregar o PNG. Verifique as suas transferências.',
    shareRequestAccepted: 'Pedido de partilha aceite',
    shareRequestDescription: 'O dispositivo aceitou o PNG para partilha. A entrega é gerida pela aplicação escolhida.',
    exportFailed: 'Falha ao exportar o cartão',
    copyFailed: 'Falha ao copiar',
    sales: 'vendas',
    published: 'publicados',
    profitableMonths: 'meses rentáveis',
    bestMonth: 'melhor mês',
    earned: 'ganhos com vendas de padrões',
    patternSales: 'em vendas de padrões',
    oneStudio: 'um estúdio',
    monthsAllProfitable: 'meses, todos rentáveis',
    onRecord: 'no registo',
    total: 'no total',
    averagePerSale: 'em média por venda',
    ledger: 'O REGISTO',
    honestLedger: 'REGISTO HONESTO',
    knitLocal: 'TRICÔ LOCAL',
    report: 'RELATÓRIO DO REGISTO',
    cameo: 'CAMEO',
  }),
};

export const BRAG_COPY = COPY;

export function getBragCardCopy(locale: string): BragCardCopy {
  const code = locale.toLowerCase().split('-')[0] as LanguageCode;
  return BRAG_COPY[code] ?? BRAG_COPY.en;
}
