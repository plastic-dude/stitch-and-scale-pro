import type { LanguageCode } from '@/lib/i18n';
export interface GaugeFitCopy { title:string; description:string; patternStitches:string; patternRows:string; patternStitchesHint:string; patternRowsHint:string; testers:string; addTester:string; tester:string; stitches:string; rows:string; primary:string; ratioHint:string; target:string; targetHint:string; empty:string; gradingLab:string; ratio:string; recommended:string; size:string; nominal:string; atGauge:string; shift:string; vsTarget:string; verdict:string; verdictNote:string }
const en:GaugeFitCopy={title:'Gauge & Fit Translator',description:'Enter each test knitter’s 4-inch swatch and see how their tension translates your graded sizing.',patternStitches:'Pattern gauge — stitches per 4 in',patternRows:'Pattern gauge — rows per 4 in',patternStitchesHint:'Your pattern’s published stitch gauge.',patternRowsHint:'Your pattern’s published row gauge.',testers:'Test knitters’ swatch gauges',addTester:'Add tester',tester:'Tester',stitches:'Stitches per 4 in',rows:'Rows per 4 in',primary:'Primary measurement',ratioHint:'Circumferences translate by the stitch ratio; lengths by the row ratio.',target:'Target finished circumference (optional)',targetHint:'A fit specification to check each translated size against.',empty:'This project has no graded sections yet. Translate will use placeholder sizes (XS–XL) until you add measurements in Grading Lab — the translation math works the same either way.',gradingLab:'Grading Lab',ratio:'stitch ratio',recommended:'Recommended size',size:'Size',nominal:'Nominal',atGauge:'At their gauge',shift:'Shift',vsTarget:'vs target',verdict:'Fit translation result',verdictNote:'Review each tester’s recommendation against the translated measurements.'};
const de:GaugeFitCopy={...en,title:'Maschenprobe- und Passformübersetzer',description:'Gib die 10-cm-Probe jeder Teststrickerin ein und übersetze deine gradierten Größen.',patternStitches:'Musterprobe — Maschen pro 10 cm',patternRows:'Musterprobe — Reihen pro 10 cm',patternStitchesHint:'Die veröffentlichte Maschenprobe deines Musters.',patternRowsHint:'Die veröffentlichte Reihenprobe deines Musters.',testers:'Maschenproben der Teststrickerinnen',addTester:'Testperson hinzufügen',tester:'Testperson',stitches:'Maschen pro 10 cm',rows:'Reihen pro 10 cm',primary:'Hauptmaß',ratioHint:'Umfänge werden über das Maschenverhältnis, Längen über das Reihenverhältnis übersetzt.',target:'Zielumfang (optional)',targetHint:'Eine Passformvorgabe zum Prüfen jeder übersetzten Größe.',empty:'Dieses Projekt hat noch keine gradierten Abschnitte. Bis du Maße im Grading Lab einträgst, werden Platzhaltergrößen (XS–XL) verwendet.',gradingLab:'Grading Lab',ratio:'Maschenverhältnis',recommended:'Empfohlene Größe',size:'Größe',nominal:'Nennmaß',atGauge:'Bei ihrer Probe',shift:'Abweichung',vsTarget:'gegen Zielwert',verdict:'Ergebnis der Passformübersetzung',verdictNote:'Prüfe jede Empfehlung anhand der übersetzten Maße.'};
const fr:GaugeFitCopy={...en,title:'Traducteur d’échantillon et d’ajustement',description:'Saisissez l’échantillon de 10 cm de chaque testeuse et traduisez vos tailles gradées.',patternStitches:'Échantillon — mailles pour 10 cm',patternRows:'Échantillon — rangs pour 10 cm',patternStitchesHint:'L’échantillon de mailles publié avec votre patron.',patternRowsHint:'L’échantillon de rangs publié avec votre patron.',testers:'Échantillons des testeuses',addTester:'Ajouter une testeuse',tester:'Testeuse',stitches:'Mailles pour 10 cm',rows:'Rangs pour 10 cm',primary:'Mesure principale',ratioHint:'Les circonférences suivent le ratio de mailles ; les longueurs, celui des rangs.',target:'Circonférence finie cible (facultatif)',targetHint:'Une spécification d’ajustement pour vérifier chaque taille traduite.',empty:'Ce projet ne contient pas encore de sections gradées. Des tailles fictives (XS–XL) seront utilisées jusqu’à l’ajout de mesures dans le Grading Lab.',gradingLab:'Grading Lab',ratio:'ratio de mailles',recommended:'Taille recommandée',size:'Taille',nominal:'Nominale',atGauge:'À son échantillon',shift:'Écart',vsTarget:'vs cible',verdict:'Résultat de la traduction',verdictNote:'Vérifiez chaque recommandation avec les mesures traduites.'};
const es:GaugeFitCopy={...en,title:'Traductor de tensión y ajuste',description:'Introduce la muestra de 10 cm de cada probadora y traduce tus tallas graduadas.',patternStitches:'Muestra — puntos por 10 cm',patternRows:'Muestra — vueltas por 10 cm',patternStitchesHint:'La tensión de puntos publicada de tu patrón.',patternRowsHint:'La tensión de vueltas publicada de tu patrón.',testers:'Muestras de las probadoras',addTester:'Añadir probadora',tester:'Probadora',stitches:'Puntos por 10 cm',rows:'Vueltas por 10 cm',primary:'Medida principal',ratioHint:'Los contornos se traducen con la proporción de puntos; los largos, con la de vueltas.',target:'Contorno acabado objetivo (opcional)',targetHint:'Una especificación de ajuste para comprobar cada talla traducida.',empty:'Este proyecto aún no tiene secciones graduadas. Se usarán tallas de referencia (XS–XL) hasta añadir medidas en Grading Lab.',gradingLab:'Grading Lab',ratio:'proporción de puntos',recommended:'Talla recomendada',size:'Talla',nominal:'Nominal',atGauge:'Con su muestra',shift:'Cambio',vsTarget:'vs objetivo',verdict:'Resultado de la traducción',verdictNote:'Comprueba cada recomendación frente a las medidas traducidas.'};
const pt:GaugeFitCopy={...en,title:'Tradutor de tensão e ajuste',description:'Introduza a amostra de 10 cm de cada testadora e traduza os seus tamanhos graduados.',patternStitches:'Amostra — malhas por 10 cm',patternRows:'Amostra — carreiras por 10 cm',patternStitchesHint:'A tensão de malhas publicada do seu padrão.',patternRowsHint:'A tensão de carreiras publicada do seu padrão.',testers:'Amostras das testadoras',addTester:'Adicionar testadora',tester:'Testadora',stitches:'Malhas por 10 cm',rows:'Carreiras por 10 cm',primary:'Medida principal',ratioHint:'As circunferências usam a proporção de malhas; os comprimentos, a de carreiras.',target:'Circunferência acabada alvo (opcional)',targetHint:'Uma especificação de ajuste para verificar cada tamanho traduzido.',empty:'Este projeto ainda não tem secções graduadas. Serão usados tamanhos de referência (XS–XL) até adicionar medidas no Grading Lab.',gradingLab:'Grading Lab',ratio:'proporção de malhas',recommended:'Tamanho recomendado',size:'Tamanho',nominal:'Nominal',atGauge:'Na amostra dela',shift:'Desvio',vsTarget:'vs alvo',verdict:'Resultado da tradução',verdictNote:'Verifique cada recomendação face às medidas traduzidas.'};
export const GAUGE_FIT_COPY:Record<LanguageCode,GaugeFitCopy>={en,de,fr,es,pt};

export const GAUGE_FLAG_TITLES: Record<LanguageCode, Record<string, string>> = {
  en: { 'GF-01':'Severe tension mismatch (≥10%)', 'GF-02':'Noticeable tension mismatch (5–10%)', 'GF-03':'Loose tension — sizes run big', 'GF-04':'Tight tension — sizes run small', 'GF-05':'Row-gauge mismatch (≥10%)' },
  de: { 'GF-01':'Starke Abweichung der Maschenprobe (≥10 %)', 'GF-02':'Deutliche Abweichung der Maschenprobe (5–10 %)', 'GF-03':'Lockere Spannung — Größen fallen groß aus', 'GF-04':'Feste Spannung — Größen fallen klein aus', 'GF-05':'Abweichung der Reihenprobe (≥10 %)' },
  fr: { 'GF-01':'Écart d’échantillon important (≥10 %)', 'GF-02':'Écart d’échantillon notable (5–10 %)', 'GF-03':'Tension lâche — les tailles sont grandes', 'GF-04':'Tension serrée — les tailles sont petites', 'GF-05':'Écart de rangs (≥10 %)' },
  es: { 'GF-01':'Desviación grave de tensión (≥10 %)', 'GF-02':'Desviación notable de tensión (5–10 %)', 'GF-03':'Tensión floja — las tallas quedan grandes', 'GF-04':'Tensión apretada — las tallas quedan pequeñas', 'GF-05':'Desviación de vueltas (≥10 %)' },
  pt: { 'GF-01':'Desvio grave da tensão (≥10%)', 'GF-02':'Desvio notável da tensão (5–10%)', 'GF-03':'Tensão solta — os tamanhos ficam grandes', 'GF-04':'Tensão apertada — os tamanhos ficam pequenos', 'GF-05':'Desvio da amostra de carreiras (≥10%)' },
};

export function getGaugeFlagTitle(locale: string, code: string, fallback: string): string {
  const language = locale.toLowerCase().split('-')[0] as LanguageCode;
  return GAUGE_FLAG_TITLES[language]?.[code] ?? fallback;
}

export function getGaugeVerdict(locale: string, verdict: string): string {
  const language = locale.toLowerCase().split('-')[0] as LanguageCode;
  const labels: Record<LanguageCode, Record<string, string>> = {
    en: { add: "Add at least one tester's gauge", proceed: 'Tension is on gauge — proceed', all: 'All testers off gauge — fix tension or size down the recommendation', mixed: 'Mixed tensions — size recommendations diverge' },
    de: { add: 'Füge mindestens eine Maschenprobe hinzu', proceed: 'Maschenprobe stimmt — fortfahren', all: 'Alle Testpersonen weichen ab — Spannung korrigieren oder Empfehlung kleiner wählen', mixed: 'Unterschiedliche Maschenproben — Größenvorschläge weichen ab' },
    fr: { add: 'Ajoutez au moins un échantillon de testeuse', proceed: 'Échantillon conforme — continuer', all: 'Toutes les testeuses sont hors échantillon — corrigez la tension ou réduisez la taille proposée', mixed: 'Échantillons différents — les tailles recommandées divergent' },
    es: { add: 'Añade al menos una muestra de una probadora', proceed: 'La tensión coincide — continuar', all: 'Todas las probadoras se desvían — corrige la tensión o reduce la recomendación', mixed: 'Tensiones mixtas — las recomendaciones de talla divergen' },
    pt: { add: 'Adicione pelo menos uma amostra de testadora', proceed: 'A tensão está correta — continuar', all: 'Todas as testadoras estão fora da amostra — corrija a tensão ou reduza a recomendação', mixed: 'Tensões mistas — as recomendações de tamanho divergem' },
  };
  const copy = labels[language] ?? labels.en;
  if (verdict.startsWith('Add at least')) return copy.add;
  if (verdict.startsWith('Tension is')) return copy.proceed;
  if (verdict.startsWith('All testers')) return copy.all;
  if (verdict.startsWith('Mixed tensions')) return copy.mixed;
  return verdict;
}

export function getGaugeFlagNote(locale: string, code: string, fallback: string, tester: string, stitchRatio: number, rowRatio: number): string {
  const language = locale.toLowerCase().split('-')[0] as LanguageCode;
  const sr = stitchRatio.toFixed(2);
  const rowPct = (rowRatio * 100).toFixed(0);
  const off = ((Math.abs(stitchRatio - 1)) * 100).toFixed(1);
  const notes: Record<LanguageCode, Record<string, string>> = {
    en: {
      'GF-01': `${tester} knits ${sr}× the pattern’s stitch gauge. Finished circumferences shift by over 10%; review blocking or the size before testing.`,
      'GF-02': `${tester} knits ${sr}× the pattern’s stitch gauge. Translated sizes shift by 5–10%; review the table before finalizing the recommendation.`,
      'GF-03': `Every written size finishes ${off}% larger than spec for ${tester}; consider a tighter ease note or blocking guidance.`,
      'GF-04': `Every written size finishes ${off}% smaller than spec for ${tester}; consider a gauge callout in the pattern notes.`,
      'GF-05': `${tester}’s row gauge is ${rowPct}% of the pattern’s. Lengths scale by this ratio; add a length note if needed.`,
    },
    de: {
      'GF-01': `${tester} strickt mit dem ${sr}-Fachen der Muster-Maschenprobe. Umfänge verschieben sich um mehr als 10 %; prüfe Blocken oder Größe.`,
      'GF-02': `${tester} strickt mit dem ${sr}-Fachen der Muster-Maschenprobe. Übersetzte Größen verschieben sich um 5–10 %; prüfe die Tabelle.`,
      'GF-03': `Jede Größe fällt bei ${tester} ${off} % größer aus; ergänze gegebenenfalls einen Hinweis zu Mehrweite oder Blocken.`,
      'GF-04': `Jede Größe fällt bei ${tester} ${off} % kleiner aus; ergänze gegebenenfalls einen Maschenprobenhinweis.`,
      'GF-05': `Die Reihenprobe von ${tester} beträgt ${rowPct} % der Musterprobe. Längen skalieren entsprechend; ergänze bei Bedarf einen Längenhinweis.`,
    },
    fr: {
      'GF-01': `${tester} tricote à ${sr}× l’échantillon de mailles du patron. Les circonférences varient de plus de 10 % ; vérifiez le blocage ou la taille.`,
      'GF-02': `${tester} tricote à ${sr}× l’échantillon du patron. Les tailles traduites varient de 5 à 10 % ; vérifiez le tableau.`,
      'GF-03': `Chaque taille finit ${off} % plus grande pour ${tester} ; ajoutez si besoin une note d’aisance ou de blocage.`,
      'GF-04': `Chaque taille finit ${off} % plus petite pour ${tester} ; ajoutez si besoin une note d’échantillon.`,
      'GF-05': `L’échantillon de rangs de ${tester} vaut ${rowPct} % de celui du patron. Les longueurs suivent ce ratio ; ajoutez une note si nécessaire.`,
    },
    es: {
      'GF-01': `${tester} teje a ${sr}× la tensión de puntos del patrón. Los contornos cambian más del 10 %; revisa el bloqueo o la talla.`,
      'GF-02': `${tester} teje a ${sr}× la tensión del patrón. Las tallas traducidas cambian un 5–10 %; revisa la tabla.`,
      'GF-03': `Cada talla termina un ${off} % más grande para ${tester}; añade una nota de holgura o bloqueo si procede.`,
      'GF-04': `Cada talla termina un ${off} % más pequeña para ${tester}; añade una nota sobre la tensión si procede.`,
      'GF-05': `La tensión de vueltas de ${tester} es el ${rowPct} % de la del patrón. Los largos siguen esta proporción; añade una nota si hace falta.`,
    },
    pt: {
      'GF-01': `${tester} tricota a ${sr}× a amostra de malhas do padrão. As circunferências mudam mais de 10%; reveja o bloqueio ou o tamanho.`,
      'GF-02': `${tester} tricota a ${sr}× a amostra do padrão. Os tamanhos traduzidos mudam 5–10%; reveja a tabela.`,
      'GF-03': `Cada tamanho fica ${off}% maior para ${tester}; acrescente uma nota de folga ou bloqueio se necessário.`,
      'GF-04': `Cada tamanho fica ${off}% menor para ${tester}; acrescente uma nota sobre a amostra se necessário.`,
      'GF-05': `A amostra de carreiras de ${tester} é ${rowPct}% da do padrão. Os comprimentos seguem esta proporção; acrescente uma nota se necessário.`,
    },
  };
  return notes[language]?.[code] ?? fallback;
}

export function getGaugeKeyLabel(locale: string, key: string, fallback: string): string {
  const language = locale.toLowerCase().split('-')[0] as LanguageCode;
  const labels: Record<LanguageCode, Record<string, string>> = {
    en: { bust:'Bust', chest:'Chest', waist:'Waist', hip:'Hip', upperArm:'Upper arm', thigh:'Thigh' },
    de: { bust:'Brust', chest:'Brustkorb', waist:'Taille', hip:'Hüfte', upperArm:'Oberarm', thigh:'Oberschenkel' },
    fr: { bust:'Poitrine', chest:'Torse', waist:'Taille', hip:'Hanches', upperArm:'Haut du bras', thigh:'Cuisse' },
    es: { bust:'Pecho', chest:'Tórax', waist:'Cintura', hip:'Cadera', upperArm:'Parte superior del brazo', thigh:'Muslo' },
    pt: { bust:'Peito', chest:'Tórax', waist:'Cintura', hip:'Anca', upperArm:'Braço', thigh:'Coxa' },
  };
  return labels[language]?.[key] ?? fallback;
}

export function getGaugeVerdictNote(locale: string, verdict: string, testerCount: number, mismatchCount: number): string {
  const language = locale.toLowerCase().split('-')[0] as LanguageCode;
  const notes: Record<LanguageCode, Record<string, string>> = {
    en: { add:'Enter a test knitter’s 4-inch swatch to translate their graded sizing.', proceed:`All ${testerCount} tester stitch gauges are within 5% of the pattern; no tension-based size change is needed.`, all:`All ${testerCount} testers drift at least 5%; re-swatch with the recommended needle or use the translated table for compensating sizes.`, mixed:`${mismatchCount} tester(s) drift at least 5%; follow each translated table instead of one blanket size call.` },
    de: { add:'Gib die 10-cm-Probe einer Testperson ein, um ihre gradierten Größen zu übersetzen.', proceed:`Die Maschenproben aller ${testerCount} Testpersonen liegen innerhalb von 5 %; aus Spannungssicht ist keine Größenänderung nötig.`, all:`Alle ${testerCount} Testpersonen weichen mindestens 5 % ab; stricke mit der empfohlenen Nadel neu oder nutze die Übersetzungstabelle.`, mixed:`${mismatchCount} Testperson(en) weichen mindestens 5 % ab; folge jeder Übersetzungstabelle statt einer pauschalen Größe.` },
    fr: { add:'Saisissez l’échantillon de 10 cm d’une testeuse pour traduire ses tailles graduées.', proceed:`Les échantillons des ${testerCount} testeuse(s) sont dans une marge de 5 % ; aucun changement de taille n’est nécessaire.`, all:`Les ${testerCount} testeuse(s) s’écartent d’au moins 5 % ; refaites l’échantillon ou utilisez le tableau traduit.`, mixed:`${mismatchCount} testeuse(s) s’écartent d’au moins 5 % ; suivez chaque tableau traduit plutôt qu’une taille unique.` },
    es: { add:'Introduce la muestra de 10 cm de una probadora para traducir sus tallas graduadas.', proceed:`Las muestras de las ${testerCount} probadora(s) están dentro del 5 %; no hace falta cambiar de talla por la tensión.`, all:`Las ${testerCount} probadora(s) se desvían al menos un 5 %; repite la muestra o usa la tabla traducida.`, mixed:`${mismatchCount} probadora(s) se desvían al menos un 5 %; sigue cada tabla traducida en lugar de una talla única.` },
    pt: { add:'Introduza a amostra de 10 cm de uma testadora para traduzir os seus tamanhos graduados.', proceed:`As amostras das ${testerCount} testadora(s) estão dentro de 5%; não é necessário mudar o tamanho.`, all:`As ${testerCount} testadora(s) desviam-se pelo menos 5%; repita a amostra ou use a tabela traduzida.`, mixed:`${mismatchCount} testadora(s) desviam-se pelo menos 5%; siga cada tabela traduzida em vez de um tamanho único.` },
  };
  const copy = notes[language] ?? notes.en;
  if (verdict.startsWith('Add at least')) return copy.add;
  if (verdict.startsWith('Tension is')) return copy.proceed;
  if (verdict.startsWith('All testers')) return copy.all;
  return copy.mixed;
}
