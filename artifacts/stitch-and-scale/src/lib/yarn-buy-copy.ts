// CHK-145 localization module — Yarn Buy calculator placeholder (was bare English).
import type { LanguageCode } from '@/lib/i18n';

export interface YarnBuyCopy {
  pickAYarn: string;
  yarnWeight: string;
  yardagePerSkein: string;
  pricePerSkein: string;
  stashOfThisYarn: string;
  gramsPerSkein: string;
  swatchConfirmedBefore: string;
  swatchConfirmedNote: string;
  baseYardageLabel: string;
  targetWithRiskBuffer: string;
  skeinsToBuyLabel: string;
  coveredByStash: string;
  buyListCost: string;
  acrossGrades: string;
  riskBufferWhy: string;
  dyeLotFloorNote: string;
  enterYardageAndPrice: string;
  buyOneExtraSkein: string;
  extraSkeinBody: string;
  stashCovers: string;
  stashShortfall: string;
  buyListPrefix: string;
  buyListTotal: string;
  baseSizeNote: string;
  confirmAgainstSwatch: string;
  sources: string;
  skeinWord: string;
  largerSizesUpTo: string;
  confirmSizeAndSwatch: string;
  stashMessage: string;
  quickLoadLabel: string;
}

const en: YarnBuyCopy = {
  pickAYarn: 'Pick a yarn...',
  yarnWeight: 'Yarn weight',
  yardagePerSkein: 'Yardage per skein (ball band)',
  pricePerSkein: 'Price per skein',
  stashOfThisYarn: 'Stash of this yarn (grams)',
  gramsPerSkein: 'Grams per skein',
  swatchConfirmedBefore: 'Swatch confirmed before buying',
  swatchConfirmedNote: '— a confirmed swatch holds the buffer at the documented 10% floor.',
  baseYardageLabel: 'Base yardage ({size} base size)',
  targetWithRiskBuffer: 'Target with risk buffer ({pct}%)',
  skeinsToBuyLabel: 'Skeins to buy, one dye lot',
  coveredByStash: 'covered by stash ({exact} skein eq.)',
  buyListCost: 'Buy-list cost',
  acrossGrades: 'across grades',
  riskBufferWhy: 'Risk buffer — why {pct}%',
  dyeLotFloorNote: 'industry-documented 10–15% rule for dye-lot irreversibility — the buffer is the documented floor unless risk factors push it up.',
  enterYardageAndPrice: 'Enter the yardage and price from your yarn\u2019s ball band to price the buy list — yardage per skein is the only number that matters here.',
  buyOneExtraSkein: 'Buy one extra skein of this same dye lot as insurance.',
  extraSkeinBody: 'Standard pro practice: a same-lot spare keeps the project repairable and re-sellable. Unopened lots hold resale value on Ravelry and Etsy yarn groups.',
  stashCovers: 'Your stash covers {n} skein{s}.',
  stashShortfall: 'the remaining {yd} yd still need a same-dye-lot purchase — buy the shortfall in one go, not piecemeal.',
  buyListPrefix: 'Buy list:',
  buyListTotal: 'total.',
  baseSizeNote: 'Base-size estimate ({yd} yd) is graded for {size};',
  confirmAgainstSwatch: 'confirm against the size you will actually release. Always confirm yardage against your own swatch — the ball band is truth, the model is a plan.',
  sources: 'Sources: the 10–15% buffer rule is published buying guidance (Mary Maxim, 2026); dye lots cannot be re-ordered once depleted (Lion Brand support); stash offsets round down to whole skeins because a partial skein still requires a full same-lot purchase.',
  skeinWord: 'skein{pl}',
  largerSizesUpTo: 'larger sizes run up to {max}.',
  confirmSizeAndSwatch: 'confirm against the size you will actually release. Always confirm yardage against your own swatch — the ball band is truth, the model is a plan.',
  stashMessage: 'Your stash covers {n} skein{pl}; the remaining {yd} yd still need a same-dye-lot purchase — buy the shortfall in one go, not piecemeal.',
  quickLoadLabel: 'Quick-load a market-standard yarn (edit the numbers to match your ball band)',
};

const de: YarnBuyCopy = {
  ...en,
  pickAYarn: 'Garn auswählen …',
  yarnWeight: 'Garnstärke',
  yardagePerSkein: 'Lauflänge pro Strang (Banderole)',
  pricePerSkein: 'Preis pro Strang',
  stashOfThisYarn: 'Vorrat dieses Garns (Gramm)',
  gramsPerSkein: 'Gramm pro Strang',
  swatchConfirmedBefore: 'Maschenprobe vor dem Kauf bestätigt',
  swatchConfirmedNote: '— eine bestätigte Maschenprobe hält den Puffer bei den dokumentierten 10 %.',
  baseYardageLabel: 'Basis-Lauflänge (Basisgröße {size})',
  targetWithRiskBuffer: 'Ziel mit Risikopuffer ({pct} %)',
  skeinsToBuyLabel: 'Zu kaufende Stränge, ein Färbelot',
  coveredByStash: 'aus dem Vorrat gedeckt ({exact} Strang-Äquivalent)',
  buyListCost: 'Kosten der Kaufliste',
  acrossGrades: 'über alle Größen',
  riskBufferWhy: 'Risikopuffer — warum {pct} %',
  dyeLotFloorNote: 'branchendokumentierte 10–15-%-Regel für nicht nachbestellbare Färbelots — der Puffer ist die dokumentierte Untergrenze, außer Risikofaktoren treiben ihn höher.',
  enterYardageAndPrice: 'Gib Lauflänge und Preis von der Banderole deines Garns ein, um die Kaufliste zu kalkulieren — die Lauflänge pro Strang ist hier die einzige Zahl, die zählt.',
  buyOneExtraSkein: 'Kauf einen Extrastrang desselben Färbelots als Reserve.',
  extraSkeinBody: 'Standard-Profi-Praxis: Ein Reserve-Strang aus demselben Lot hält das Projekt reparierbar und weiterverkaufbar. Ungeöffnete Lots behalten ihren Wiederverkaufswert in Ravelry- und Etsy-Garn-Gruppen.',
  stashCovers: 'Dein Vorrat deckt {n} Strang{s}.',
  stashShortfall: 'die fehlenden {yd} yd brauchen noch einen Kauf aus demselben Färbelot — kauf den Rest auf einmal, nicht in Etappen.',
  buyListPrefix: 'Kaufliste:',
  buyListTotal: 'Gesamt.',
  baseSizeNote: 'Die Basis-Lauflängenschätzung ({yd} yd) ist für {size} abgestuft;',
  confirmAgainstSwatch: 'prüfe sie gegen die Größe, die du wirklich releasen wirst. Bestätige die Lauflänge immer mit deiner eigenen Maschenprobe — die Banderole ist die Wahrheit, das Modell ist nur ein Plan.',
  sources: 'Quellen: Die 10–15-%-Pufferregel ist veröffentlichte Kaufberatung (Mary Maxim, 2026); Färbelots können nach dem Ausverkauf nicht nachbestellt werden (Lion Brand Support); Vorratsabzüge werden auf ganze Stränge abgerundet, denn ein Teilstrang erfordert trotzdem einen vollen Kauf aus demselben Lot.',
  skeinWord: 'Strang{pl}',
  largerSizesUpTo: 'größere Größen bis zu {max}.',
  confirmSizeAndSwatch: 'prüfe sie gegen die Größe, die du wirklich releasen wirst. Bestätige die Lauflänge immer mit deiner eigenen Maschenprobe — die Banderole ist die Wahrheit, das Modell ist nur ein Plan.',
  stashMessage: 'Dein Vorrat deckt {n} Strang{pl}; die fehlenden {yd} yd brauchen noch einen Kauf aus demselben Färbelot — kauf den Rest auf einmal, nicht in Etappen.',
  quickLoadLabel: 'Standard-Garn schnell laden (Zahlen an deine Banderole anpassen)',
};

const fr: YarnBuyCopy = {
  ...en,
  pickAYarn: 'Choisir une laine…',
  yarnWeight: 'Épaisseur de la laine',
  yardagePerSkein: 'Métrage par écheveau (étiquette)',
  pricePerSkein: 'Prix par écheveau',
  stashOfThisYarn: 'Stock de cette laine (grammes)',
  gramsPerSkein: 'Grammes par écheveau',
  swatchConfirmedBefore: 'Échantillon confirmé avant achat',
  swatchConfirmedNote: '— un échantillon confirmé maintient la marge au plancher documenté de 10 %.',
  baseYardageLabel: 'Métrage de base (taille de base {size})',
  targetWithRiskBuffer: 'Cible avec marge de risque ({pct} %)',
  skeinsToBuyLabel: 'Écheveaux à acheter, un seul lot de teinture',
  coveredByStash: 'couvert par le stock ({exact} équiv. écheveau)',
  buyListCost: 'Coût de la liste d\u2019achat',
  acrossGrades: 'toutes tailles confondues',
  riskBufferWhy: 'Marge de risque — pourquoi {pct} %',
  dyeLotFloorNote: 'règle documentée de 10–15 % pour les lots de teinture irremplaçables — la marge est le plancher documenté sauf si des facteurs de risque la poussent plus haut.',
  enterYardageAndPrice: 'Saisis le métrage et le prix de l\u2019étiquette de ta laine pour calculer la liste d\u2019achat — le métrage par écheveau est le seul chiffre qui compte ici.',
  buyOneExtraSkein: 'Achète un écheveau supplémentaire de ce même lot de teinture en réserve.',
  extraSkeinBody: 'Pratique pro standard : un écheveau de réserve du même lot garde le projet réparable et revendable. Les lots non ouverts conservent leur valeur de revente sur Ravelry et dans les groupes Etsy.',
  stashCovers: 'Ton stock couvre {n} écheveau{x}.',
  stashShortfall: 'les {yd} yd restants nécessitent encore un achat du même lot de teinture — achète le manque en une fois, pas en plusieurs fois.',
  buyListPrefix: 'Liste d\u2019achat :',
  buyListTotal: 'total.',
  baseSizeNote: 'L\u2019estimation de métrage de base ({yd} yd) est graduée pour {size} ;',
  confirmAgainstSwatch: 'vérifie-la avec la taille que tu vas réellement publier. Confirme toujours le métrage avec ton propre échantillon — l\u2019étiquette fait foi, le modèle n\u2019est qu\u2019un plan.',
  sources: 'Sources : la règle de marge de 10–15 % est une recommandation d\u2019achat publiée (Mary Maxim, 2026) ; les lots de teinture ne peuvent pas être recomandés une fois épuisés (support Lion Brand) ; les déductions de stock sont arrondies aux écheveaux entiers car un écheveau partiel exige quand même un achat complet du même lot.',
  skeinWord: 'écheveau{x}',
  largerSizesUpTo: 'les tailles supérieures jusqu\u2019à {max}.',
  confirmSizeAndSwatch: 'vérifie-la avec la taille que tu vas réellement publier. Confirme toujours le métrage avec ton propre échantillon — l\u2019étiquette fait foi, le modèle n\u2019est qu\u2019un plan.',
  stashMessage: 'Ton stock couvre {n} écheveau{x} ; les {yd} yd restants nécessitent encore un achat du même lot de teinture — achète le manque en une fois, pas en plusieurs fois.',
  quickLoadLabel: 'Charger rapidement une laine standard du marché (adapte les chiffres à ton étiquette)',
};

const es: YarnBuyCopy = {
  ...en,
  pickAYarn: 'Elige un hilo…',
  yarnWeight: 'Grosor del hilo',
  yardagePerSkein: 'Metraje por madeja (etiqueta)',
  pricePerSkein: 'Precio por madeja',
  stashOfThisYarn: 'Reserva de este hilo (gramos)',
  gramsPerSkein: 'Gramos por madeja',
  swatchConfirmedBefore: 'Muestra confirmada antes de comprar',
  swatchConfirmedNote: '— una muestra confirmada mantiene el margen en el suelo documentado del 10 %.',
  baseYardageLabel: 'Metraje base (talla base {size})',
  targetWithRiskBuffer: 'Objetivo con margen de riesgo ({pct} %)',
  skeinsToBuyLabel: 'Madejas a comprar, un solo lote de tinte',
  coveredByStash: 'cubierto por la reserva ({exact} madeja equiv.)',
  buyListCost: 'Coste de la lista de compra',
  acrossGrades: 'en todas las tallas',
  riskBufferWhy: 'Margen de riesgo — por qué {pct} %',
  dyeLotFloorNote: 'regla documentada del 10–15 % para lotes de tinte irremplazables — el margen es el suelo documentado salvo que los factores de riesgo lo suban.',
  enterYardageAndPrice: 'Introduce el metraje y el precio de la etiqueta de tu hilo para calcular la lista de compra — el metraje por madeja es el único número que importa aquí.',
  buyOneExtraSkein: 'Compra una madeja extra de este mismo lote de tinte como reserva.',
  extraSkeinBody: 'Práctica profesional estándar: una madeja de reserva del mismo lote mantiene el proyecto reparable y revensible. Los lotes sin abrir conservan su valor de reventa en Ravelry y en los grupos de Etsy.',
  stashCovers: 'Tu reserva cubre {n} madeja{pl}.',
  stashShortfall: 'los {yd} yd restantes aún necesitan una compra del mismo lote de tinte — compra el resto de una vez, no por partes.',
  buyListPrefix: 'Lista de compra:',
  buyListTotal: 'total.',
  baseSizeNote: 'La estimación de metraje base ({yd} yd) está graduada para {size};',
  confirmAgainstSwatch: 'confírmala con la talla que realmente vas a publicar. Confirma siempre el metraje con tu propia muestra — la etiqueta es la verdad, el modelo es solo un plan.',
  sources: 'Fuentes: la regla de margen del 10–15 % es una guía de compra publicada (Mary Maxim, 2026); los lotes de tinte no pueden reordenarse una vez agotados (soporte Lion Brand); las deducciones de reserva se redondean a madejas enteras porque una madeja parcial aún requiere una compra completa del mismo lote.',
  skeinWord: 'madeja{pl}',
  largerSizesUpTo: 'las tallas mayores hasta {max}.',
  confirmSizeAndSwatch: 'confírmala con la talla que realmente vas a publicar. Confirma siempre el metraje con tu propia muestra — la etiqueta es la verdad, el modelo es solo un plan.',
  stashMessage: 'Tu reserva cubre {n} madeja{pl}; los {yd} yd restantes aún necesitan una compra del mismo lote de tinte — compra el resto de una vez, no por partes.',
  quickLoadLabel: 'Cargar rápido un hilo estándar del mercado (ajusta los números a tu etiqueta)',
};

const pt: YarnBuyCopy = {
  ...en,
  pickAYarn: 'Escolha um fio…',
  yarnWeight: 'Espessura do fio',
  yardagePerSkein: 'Metragem por novelo (etiqueta)',
  pricePerSkein: 'Preço por novelo',
  stashOfThisYarn: 'Estoque deste fio (gramas)',
  gramsPerSkein: 'Gramas por novelo',
  swatchConfirmedBefore: 'Amostra confirmada antes da compra',
  swatchConfirmedNote: '— uma amostra confirmada mantém a margem no piso documentado de 10 %.',
  baseYardageLabel: 'Metragem base (tamanho base {size})',
  targetWithRiskBuffer: 'Meta com margem de risco ({pct} %)',
  skeinsToBuyLabel: 'Novelos a comprar, um único lote de tingimento',
  coveredByStash: 'coberto pelo estoque ({exact} eq. novelo)',
  buyListCost: 'Custo da lista de compra',
  acrossGrades: 'em todos os tamanhos',
  riskBufferWhy: 'Margem de risco — por que {pct} %',
  dyeLotFloorNote: 'regra documentada de 10–15 % para lotes de tingimento irrepetíveis — a margem é o piso documentado, salvo fatores de risco que a elevem.',
  enterYardageAndPrice: 'Digite a metragem e o preço da etiqueta do seu fio para calcular a lista de compra — a metragem por novelo é o único número que importa aqui.',
  buyOneExtraSkein: 'Compre um novelo extra deste mesmo lote de tingimento como reserva.',
  extraSkeinBody: 'Prática profissional padrão: um novelo de reserva do mesmo lote mantém o projeto reparável e revendável. Lotes fechados conservam valor de revenda no Ravelry e nos grupos do Etsy.',
  stashCovers: 'Seu estoque cobre {n} novelo{s}.',
  stashShortfall: 'os {yd} yd restantes ainda precisam de uma compra do mesmo lote de tingimento — compre o restante de uma vez, não em partes.',
  buyListPrefix: 'Lista de compra:',
  buyListTotal: 'total.',
  baseSizeNote: 'A estimativa de metragem base ({yd} yd) é graduada para {size};',
  confirmAgainstSwatch: 'confirme com o tamanho que você realmente vai lançar. Confirme sempre a metragem com sua própria amostra — a etiqueta é a verdade, o modelo é só um plano.',
  sources: 'Fontes: a regra de margem de 10–15 % é uma orientação de compra publicada (Mary Maxim, 2026); lotes de tingimento não podem ser reordenados após esgotados (suporte Lion Brand); deduções de estoque são arredondadas para novelos inteiros porque um novelo parcial ainda exige uma compra completa do mesmo lote.',
  skeinWord: 'novelo{s}',
  largerSizesUpTo: 'tamanhos maiores até {max}.',
  confirmSizeAndSwatch: 'confirme com o tamanho que você realmente vai lançar. Confirme sempre a metragem com sua própria amostra — a etiqueta é a verdade, o modelo é só um plano.',
  stashMessage: 'Seu estoque cobre {n} novelo{s}; os {yd} yd restantes ainda precisam de uma compra do mesmo lote de tingimento — compre o restante de uma vez, não em partes.',
  quickLoadLabel: 'Carregar rapidamente um fio padrão do mercado (ajuste os números à sua etiqueta)',
};

export const COPY: Record<LanguageCode, YarnBuyCopy> = { en, de, fr, es, pt };
export function getYarnBuyCopy(language: LanguageCode): YarnBuyCopy {
  return YARN_BUY_COPY[language] ?? YARN_BUY_COPY.en;
}

export const YARN_BUY_COPY = COPY;
