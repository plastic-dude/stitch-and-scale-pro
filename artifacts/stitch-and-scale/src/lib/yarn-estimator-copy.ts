// CHK-145 localization module — Yarn Requirement Estimate panel (was bare English).
import type { LanguageCode } from '@/lib/i18n';

export interface YarnEstimatorCopy {
  yarnRequirementEstimate: string;
  yardageDescription: string;
  compareAcrossWeights: string;
  baseSizeOf: string; // e.g. "base size" segment used in description
  yarnWeight: string;
  yardsMeters: string; // "yards ({n} m)"
  skeins100gMin: string; // "× 100g skeins (min.)"
  sqInOfFabricBase: string; // "sq in of fabric (base size)"
  thWeight: string;
  thYards: string;
  thMeters: string;
  th100gSkeins: string;
  footerNote: string;
}

const en: YarnEstimatorCopy = {
  yarnRequirementEstimate: 'Yarn Requirement Estimate',
  yardageDescription: 'Estimated yardage for the {size} base size, per the Craft Yarn Council weight system. A first-pass planning figure — always confirm against your own swatch before publishing.',
  compareAcrossWeights: 'Compare across weights',
  baseSizeOf: 'base size',
  yarnWeight: 'Yarn weight',
  yardsMeters: 'yards ({n} m)',
  skeins100gMin: '× 100g skeins (min.)',
  sqInOfFabricBase: 'sq in of fabric (base size)',
  thWeight: 'Weight',
  thYards: 'Yards',
  thMeters: 'Meters',
  th100gSkeins: '100g skeins',
  footerNote: 'Estimate computed from the graded base-size dimensions ({area} sq in of fabric) scaled by the CYC reference gauge for the selected weight. Graded-up sizes (L–5XL) need roughly proportionally more yardage — use this panel after grading if you want per-size totals.',
};
const de: YarnEstimatorCopy = {
  yarnRequirementEstimate: 'Garnbedarfs-Schätzung',
  yardageDescription: 'Geschätzte Yardage für die Basisgröße {size} gemäß dem Craft Yarn Council Gewichtssystem. Eine Ersteinschätzung — immer mit deiner eigenen Maschenprobe abgleichen, bevor du veröffentlichst.',
  compareAcrossWeights: 'Über Garnstärken vergleichen',
  baseSizeOf: 'Basisgröße',
  yarnWeight: 'Garnstärke',
  yardsMeters: 'Yards ({n} m)',
  skeins100gMin: '× 100-g-Knäuel (min.)',
  sqInOfFabricBase: 'sq in Stoff (Basisgröße)',
  thWeight: 'Stärke',
  thYards: 'Yards',
  thMeters: 'Meter',
  th100gSkeins: '100-g-Knäuel',
  footerNote: 'Schätzung aus den gestuften Basisgröße-Dimensionen ({area} sq in Stoff), skaliert mit der CYC-Referenzmaschenprobe der gewählten Stärke. Größere gestufte Größen (L–5XL) brauchen etwa proportional mehr Yardage — nutze dieses Panel nach der Stufung für pro-Größen-Totale.',
};
const fr: YarnEstimatorCopy = {
  yarnRequirementEstimate: 'Estimation du besoin en laine',
  yardageDescription: 'Yardage estimé pour la taille de base {size}, selon le système du Craft Yarn Council. Un chiffre de planification initial — vérifie toujours avec ton propre échantillon avant de publier.',
  compareAcrossWeights: 'Comparer entre épaisseurs',
  baseSizeOf: 'taille de base',
  yarnWeight: 'Épaisseur de laine',
  yardsMeters: 'yards ({n} m)',
  skeins100gMin: '× pelotes de 100 g (min.)',
  sqInOfFabricBase: 'po² de tissu (taille de base)',
  thWeight: 'Épaisseur',
  thYards: 'Yards',
  thMeters: 'Mètres',
  th100gSkeins: 'Pelotes 100 g',
  footerNote: 'Estimation calculée à partir des dimensions graduées de la taille de base ({area} po² de tissu), ajustée par l\u2019échantillon CYC de référence de l\u2019épaisseur choisie. Les tailles supérieures (L–5XL) demandent proportionnellement plus de yardage — utilise ce panneau après la graduation pour les totaux par taille.',
};
const es: YarnEstimatorCopy = {
  yarnRequirementEstimate: 'Estimación de hilo necesario',
  yardageDescription: 'Yardas estimadas para la talla base {size}, según el sistema de grosores del Craft Yarn Council. Una cifra inicial de planificación — confírmala siempre con tu propia muestra antes de publicar.',
  compareAcrossWeights: 'Comparar entre grosores',
  baseSizeOf: 'talla base',
  yarnWeight: 'Grosor del hilo',
  yardsMeters: 'yardas ({n} m)',
  skeins100gMin: '× ovillos de 100 g (mín.)',
  sqInOfFabricBase: 'pul² de tejido (talla base)',
  thWeight: 'Grosor',
  thYards: 'Yardas',
  thMeters: 'Metros',
  th100gSkeins: 'Ovillos 100 g',
  footerNote: 'Estimación calculada a partir de las dimensiones graduadas de la talla base ({area} pul² de tejido) escaladas por la muestra CYC de referencia del grosor seleccionado. Las tallas mayores (L–5XL) necesitan aproximadamente proporcionalmente más yardas — usa este panel tras la graduación si quieres totales por talla.',
};
const pt: YarnEstimatorCopy = {
  yarnRequirementEstimate: 'Estimativa de necessidade de fio',
  yardageDescription: 'Jardas estimadas para o tamanho base {size}, conforme o sistema de espessuras do Craft Yarn Council. Um número inicial de planejamento — confirme sempre com sua própria amostra antes de publicar.',
  compareAcrossWeights: 'Comparar entre espessuras',
  baseSizeOf: 'tamanho base',
  yarnWeight: 'Espessura do fio',
  yardsMeters: 'jardas ({n} m)',
  skeins100gMin: '× novelos de 100 g (mín.)',
  sqInOfFabricBase: 'pol² de tecido (tamanho base)',
  thWeight: 'Espessura',
  thYards: 'Jardas',
  thMeters: 'Metros',
  th100gSkeins: 'Novelos 100 g',
  footerNote: 'Estimativa calculada a partir das dimensões graduadas do tamanho base ({area} pol² de tecido), escalonada pela amostra de referência CYC da espessura selecionada. Tamanhos maiores (L–5XL) precisam proporcionalmente de mais jardas — use este painel após a graduação se quiser totais por tamanho.',
};

export const YARN_ESTIMATOR_COPY: Record<LanguageCode, YarnEstimatorCopy> = { en, de, fr, es, pt };
export function getYarnEstimatorCopy(language: LanguageCode): YarnEstimatorCopy {
  return YARN_ESTIMATOR_COPY[language] ?? YARN_ESTIMATOR_COPY.en;
}
