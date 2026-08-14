/**
 * Pattern Finish & Care Guide — generates the last page of every good
 * pattern: yarn substitution, blocking, washing, drying and storage notes,
 * all derived from the project's own yarn data.
 *
 * Session-12 research, turned into interface:
 * - No competitor outputs this section. YarnSub is knitter-facing (a
 *   substitution search engine) and never appears inside a designer's
 *   pattern; grading/charting tools stop at the size chart. The "last
 *   page" of the pattern is written by hand, if at all — and usually as
 *   generic boilerplate that's wrong for the actual fibre.
 * - Care logic is fibre-law, not opinion: wool felts under heat +
 *   agitation (hand wash cool, lay flat); superwash tolerates a gentle
 *   machine cycle; acrylic melts under high heat (cold wash, dry low);
 *   cotton shrinks in hot drying; blends follow the most delicate fibre.
 *   Sources: TKGA blocking guide, Estako care guide, Purl Soho fibre
 *   guide, Provenance Craft finishing notes (all cited in the
 *   session-12 research file).
 * - Blocking methods split by fibre: wet (wool/linen/cotton), steam
 *   (cotton/acrylic/ribbing), spritz (silk/delicates/novelty).
 * - Substitution line follows the universal rule from YarnSub's ply table:
 *   match metres per 100 g and swatch to gauge — so the designer gets a
 *   paste-ready "or any yarn in the same class (~X m/100 g)" line.
 *
 * Pure library — no UI, no persistence, no new constants from grading.
 */
import { PatternProject } from './grading-engine';
import { YARN_WEIGHT_LABELS } from './yarn-estimator';

export type Fibre =
  | 'wool'
  | 'superwash-wool'
  | 'alpaca'
  | 'cashmere'
  | 'mohair'
  | 'silk'
  | 'cotton'
  | 'linen'
  | 'acrylic'
  | 'nylon'
  | 'other';

export const FIBRE_LABELS: Record<Fibre, string> = {
  wool: 'Wool',
  'superwash-wool': 'Superwash wool',
  alpaca: 'Alpaca',
  cashmere: 'Cashmere',
  mohair: 'Mohair',
  silk: 'Silk',
  cotton: 'Cotton',
  linen: 'Linen',
  acrylic: 'Acrylic',
  nylon: 'Nylon',
  other: 'Other fibre',
};

export type WashMethod = 'hand-wash' | 'machine-gentle' | 'machine-normal' | 'dry-clean';
export type DryMethod = 'lay-flat' | 'tumble-low' | 'drip-dry' | 'hang-dry-never';

export interface FibreBehavior {
  fibres: Fibre[];
  wash: WashMethod;
  dry: DryMethod;
  /** Blocking method best suited to the blend. */
  block: 'wet' | 'steam' | 'spritz' | 'pin-only';
  /** One-line reasoning a designer can keep or trim. */
  reasoning: string;
  drape: 'stiff' | 'moderate' | 'fluid';
  elasticity: 'springy' | 'moderate' | 'low';
  warmth: 'cool' | 'moderate' | 'very-warm';
  mothRisk: boolean;
}

/** A blend follows its most delicate fibre. Precedence order comes straight
 *  from the cited care guides — silk/delicates need the gentlest handling,
 *  wool felts, acrylic melts, cotton shrinks, and sturdy synthetics/plants
 *  take machine care. */
const DELICACY: Fibre[] = [
  'silk',
  'mohair',
  'cashmere',
  'alpaca',
  'wool',
  'superwash-wool',
  'acrylic',
  'cotton',
  'linen',
  'nylon',
  'other',
];

function mostDelicate(fibres: Fibre[]): Fibre {
  for (const f of DELICACY) {
    if (fibres.includes(f)) return f;
  }
  return fibres[0];
}

export function classifyFibreBehavior(fibres: Fibre[]): FibreBehavior {
  const blend = fibres.length > 1;
  const dominant = mostDelicate(fibres);
  const hasAnimal = fibres.some(f =>
    ['wool', 'superwash-wool', 'alpaca', 'cashmere', 'mohair', 'silk'].includes(f),
  );

  let wash: WashMethod = 'hand-wash';
  let dry: DryMethod = 'lay-flat';
  let block: FibreBehavior['block'] = 'wet';
  let reasoning = '';
  let drape: FibreBehavior['drape'] = 'moderate';
  let elasticity: FibreBehavior['elasticity'] = 'moderate';
  let warmth: FibreBehavior['warmth'] = 'moderate';

  switch (dominant) {
    case 'silk':
      dry = 'lay-flat';
      block = 'spritz';
      reasoning =
        'Silk is strong by weight but heat-shy and heavy when wet; a light spritz block and a flat dry keep the drape and luster. Wet silk smells unpleasant while drying — normal.';
      drape = 'fluid';
      elasticity = 'low';
      break;
    case 'mohair':
      block = 'wet';
      reasoning =
        'Mohair blooms with a wet block and hates agitation — hand wash gently without rubbing so the halo stays fluffy. Lay flat; hanging stretches the airy fabric.';
      drape = 'fluid';
      elasticity = 'low';
      warmth = 'very-warm';
      break;
    case 'cashmere':
      reasoning =
        'Cashmere is fine and low-twist — hand wash cool, no wringing, dry flat. It follows wool rules but needs even gentler handling.';
      drape = 'fluid';
      elasticity = 'low';
      warmth = 'very-warm';
      break;
    case 'alpaca':
      reasoning =
        'Alpaca has hollow fibres (very warm, low elasticity) and stretches over time — never hang a wet alpaca garment. Hand wash cool and dry flat.';
      drape = 'fluid';
      elasticity = 'low';
      warmth = 'very-warm';
      break;
    case 'wool':
      reasoning =
        'Wool felts under heat plus agitation — hand wash cool or lukewarm, swish gently, never rub or wring, then roll in a towel and dry flat. Never hang wet: the weight stretches it.';
      warmth = 'very-warm';
      elasticity = 'springy';
      break;
    case 'superwash-wool':
      wash = 'machine-gentle';
      block = 'wet';
      reasoning =
        'Superwash wool tolerates a gentle machine cycle in cool water, but superwash stretches when saturated — dry flat and note in the pattern that it may grow beyond the schematic when pinned; pin to final measurements and let excess lie in bunches.';
      warmth = 'very-warm';
      elasticity = 'springy';
      break;
    case 'acrylic':
      wash = 'machine-normal';
      dry = 'tumble-low';
      block = 'steam';
      reasoning =
        'Acrylic is a plastic: cold or warm machine wash is fine, but high heat melts and permanently distorts the fibres — tumble dry low at most, and never let an iron touch the fabric. Steam blocking sets acrylic permanently.';
      elasticity = 'moderate';
      break;
    case 'cotton':
      wash = 'machine-normal';
      dry = 'tumble-low';
      block = 'steam';
      reasoning =
        'Cotton is cool, absorbent and machine-friendly, but it shrinks in a hot wash or dryer — wash gentle, dry on low. Cotton takes a lighter steam block than wool.';
      drape = 'moderate';
      elasticity = 'low';
      break;
    case 'linen':
      wash = 'machine-normal';
      dry = 'lay-flat';
      block = 'wet';
      reasoning =
        'Linen is dense and cool with a hardworking hand; it softens and gains drape with every wash. Wet block (linen responds well), dry flat — machine drying over-stresses the long fibres.';
      drape = 'fluid';
      elasticity = 'low';
      warmth = 'cool';
      break;
    case 'nylon':
      wash = 'machine-normal';
      dry = 'tumble-low';
      block = 'steam';
      reasoning =
        'Nylon is strong and easy-care; machine wash cool and tumble dry low. Steam block away from the soleplate.';
      elasticity = 'moderate';
      break;
    default:
      reasoning =
        'For unlisted fibres, keep the ball band from one skein — its care symbols are the definitive reference for the whole project.';
      elasticity = 'moderate';
      break;
  }

  if (blend) {
    reasoning +=
      ' This is a blend: always follow the most delicate fibre in the mix (here, ' +
      FIBRE_LABELS[dominant] +
      ') when in doubt.';
  }

  return { fibres, wash, dry, block, reasoning, drape, elasticity, warmth, mothRisk: hasAnimal };
}

/** Blocking recommendation for the project's fabric, with the why. */
export function recommendBlocking(fibres: Fibre[], fabricNotes?: string): {
  method: FibreBehavior['block'];
  text: string;
} {
  const behavior = classifyFibreBehavior(fibres);
  const base: Record<FibreBehavior['block'], string> = {
    wet: 'Block this piece wet: soak in room-temperature water, gently squeeze out excess water (never wring), roll in a towel and stand on the roll to absorb moisture, then pin to the schematic measurements on blocking mats and let it dry completely. Wool and linen take the most dramatic wet block; steam-blocking cotton, acrylic and neckbands is fine instead.',
    steam: 'Block with steam: pin the piece out to its schematic measurements, then hover a steamer (or a steam iron that never touches the fabric) over the wrong side to set the stitches. Steam blocking is permanent on acrylic, so pin to your exact final measurements.',
    spritz: 'Block with a light spritz: pin to shape, mist until evenly damp, and dry flat. Gentle enough for delicate and novelty fibres.',
    'pin-only': 'No full block is needed — weave in ends, give the fabric a firm shake, and let it rest flat for a day or two before wearing or seaming.',
  };
  let text = base[behavior.block];
  if (fibres.includes('superwash-wool')) {
    text +=
      ' Superwash pieces can grow past their schematic measurements when pinned — pin to the final measurements anyway and let the extra fabric lie in bunches until dry.';
  }
  if (fabricNotes) text += ' ' + fabricNotes;
  return { method: behavior.block, text };
}

/** YarnSub ply table — maps CYC weight names to their metric put-up, the
 *  universal substitution basis (match metres per 100 g, then swatch). */
export const METRES_PER_100G: Record<NonNullable<PatternProject['yarnWeight']>, [number, number]> = {
  lace: [400, 800],
  fingering: [280, 400],
  sport: [230, 280],
  DK: [210, 230],
  worsted: [180, 210],
  bulky: [120, 180],
  'super-bulky': [80, 120],
};

export interface SubstituteLine {
  /** The paste-ready substitution sentence. */
  line: string;
  /** Same, plus the swatch-and-measure instruction for stricter designers. */
  lineWithGaugeNote: string;
  /** Lower/upper metres-per-100g bounds for the weight class. */
  metresPer100g: [number, number];
  weightLabel: string;
}

export function generateSubstituteLine(project: PatternProject, metresPer100g?: number): SubstituteLine {
  const weight = project.yarnWeight ?? 'worsted';
  const bounds = METRES_PER_100G[weight];
  const label = YARN_WEIGHT_LABELS[weight];
  const putUp = metresPer100g;
  const base = putUp
    ? `or any yarn in the same weight class with a similar put-up (around ${putUp} m per 100 g)`
    : `or any yarn in the same weight class (approximately ${bounds[0]}–${bounds[1]} m per 100 g)`.trim() + ' — swatch to the stated gauge after blocking before committing'
  return {
    line: `${label} (${label} weight, ${putUp ?? bounds[0]}–${bounds[1]} m/100 g). You can substitute ${base}.`,
    lineWithGaugeNote: `${label} (${label} weight). You can substitute ${base}; a fibre swap (wool for cotton, for example) changes drape and bounce even at matched put-up.`,
    metresPer100g: putUp ? [putUp, putUp] : bounds,
    weightLabel: label,
  };
}

export interface FinishGuide {
  fibres: Fibre[];
  behavior: FibreBehavior;
  substitute: SubstituteLine;
  blocking: ReturnType<typeof recommendBlocking>;
  washing: string;
  drying: string;
  storage: string;
  /** Full copy-ready pattern section, from "Materials" substitution line
   *  through the care block. */
  patternSection: string;
}

/** Wash/dry/storage sentences in pattern voice. */
function washText(b: FibreBehavior): string {
  switch (b.wash) {
    case 'hand-wash':
      return 'Hand wash in cool or lukewarm water with a gentle wool wash. Swish gently — do not rub, scrub or wring — rinse at the same temperature, then press the water out and roll the piece in a towel to absorb the excess.';
    case 'machine-gentle':
      return 'Machine washable on a gentle or wool cycle in cool water. This garment is finished, so treat it gently: cool water, mild detergent, and no hot drying.';
    case 'machine-normal':
      return 'Machine washable — wash on a gentle cycle in cool or warm water.';
    case 'dry-clean':
      return 'Dry clean only.';
  }
}

function dryText(b: FibreBehavior): string {
  switch (b.dry) {
    case 'lay-flat':
      return 'Dry flat, reshaping to the schematic measurements as it dries. Never hang a wet garment of this fibre — the weight stretches it permanently.';
    case 'tumble-low':
      return 'Tumble dry on low at most; high heat will shrink or distort this fibre.';
    case 'drip-dry':
      return 'Lay flat or drip dry away from direct heat and sunlight.';
    case 'hang-dry-never':
      return 'Never hang this fibre wet — dry flat and reshape.';
  }
}

/** Build the complete pattern-section text from the project. `fibres` is the
 *  designer's declared blend (defaults to wool, the most common single-fibre
 *  case) and `metresPer100g` pins the substitution line to the actual yarn. */
export function generateFinishGuide(
  project: PatternProject,
  opts: { fibres?: Fibre[]; metresPer100g?: number; fabricNotes?: string } = {},
): FinishGuide {
  const fibres = opts.fibres ?? ['wool'];
  const behavior = classifyFibreBehavior(fibres);
  const substitute = generateSubstituteLine(project, opts.metresPer100g);
  const blocking = recommendBlocking(fibres, opts.fabricNotes);

  const washing = washText(behavior);
  const drying = dryText(behavior);
  const storage = behavior.mothRisk
    ? 'Store clean and completely dry. Animal fibres attract moths — keep finished pieces in airtight bins with cedar or lavender, never stored dirty. Keep out of direct sunlight and away from damp.'
    : 'Store clean and completely dry, away from direct sunlight and damp, to prevent fading and mildew.';

  const lines = [
    'MATERIALS & SUBSTITUTION',
    substitute.line,
    '',
    'FINISHING',
    blocking.text,
    '',
    'CARE',
    washing,
    drying,
    storage,
    '',
    'Note: keep the ball band from one skein — its care symbols are the definitive reference for your specific dye lot.',
  ];

  return {
    fibres,
    behavior,
    substitute,
    blocking,
    washing,
    drying,
    storage,
    patternSection: lines.join('\n'),
  };
}
