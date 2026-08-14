import { describe, expect, it } from 'vitest';
import {
  classifyFibreBehavior,
  generateFinishGuide,
  generateSubstituteLine,
  recommendBlocking,
} from './pattern-finish-guide';
import { PatternProject } from './grading-engine';

function makeProject(yarnWeight?: PatternProject['yarnWeight']): PatternProject {
  return {
    id: 'p',
    name: 'Demo Crewneck Sweater',
    author: 'Stitch & Scale Demo',
    baseSize: 'M',
    gauge: { stitchesPer4In: 18, rowsPer4In: 24, unit: 'in' },
    sections: [],
    createdAt: 'x',
    updatedAt: 'x',
    yarnWeight,
  };
}

describe('classifyFibreBehavior', () => {
  it('wool gets hand-wash, flat dry, wet block, moth risk', () => {
    const b = classifyFibreBehavior(['wool']);
    expect(b.wash).toBe('hand-wash');
    expect(b.dry).toBe('lay-flat');
    expect(b.block).toBe('wet');
    expect(b.warmth).toBe('very-warm');
    expect(b.elasticity).toBe('springy');
    expect(b.mothRisk).toBe(true);
    expect(b.reasoning).toContain('felts');
  });

  it('superwash-wool upgrades to a gentle machine cycle and warns about growth', () => {
    const b = classifyFibreBehavior(['superwash-wool']);
    expect(b.wash).toBe('machine-gentle');
    expect(b.reasoning).toContain('grow');
    expect(b.mothRisk).toBe(true);
  });

  it('acrylic allows machine wash and low tumble, steam block', () => {
    const b = classifyFibreBehavior(['acrylic']);
    expect(b.wash).toBe('machine-normal');
    expect(b.dry).toBe('tumble-low');
    expect(b.block).toBe('steam');
    expect(b.reasoning).toContain('melt');
    expect(b.mothRisk).toBe(false);
  });

  it('cotton shrinks in heat and takes a steam block', () => {
    const b = classifyFibreBehavior(['cotton']);
    expect(b.wash).toBe('machine-normal');
    expect(b.dry).toBe('tumble-low');
    expect(b.block).toBe('steam');
    expect(b.reasoning).toContain('shrink');
  });

  it('silk gets the gentlest handling and a spritz block', () => {
    const b = classifyFibreBehavior(['silk']);
    expect(b.block).toBe('spritz');
    expect(b.drape).toBe('fluid');
    expect(b.reasoning).toContain('smell');
  });

  it('alpaca never hangs and is very warm with low elasticity', () => {
    const b = classifyFibreBehavior(['alpaca']);
    expect(b.warmth).toBe('very-warm');
    expect(b.elasticity).toBe('low');
    expect(b.reasoning).toContain('stretch');
  });

  it('linen is cool, fluid, and wet-blocked', () => {
    const b = classifyFibreBehavior(['linen']);
    expect(b.warmth).toBe('cool');
    expect(b.drape).toBe('fluid');
    expect(b.block).toBe('wet');
    expect(b.reasoning).toContain('softens');
  });

  it('a blend follows its most delicate fibre', () => {
    const b = classifyFibreBehavior(['acrylic', 'wool']);
    // wool outranks acrylic in delicacy — the blend is treated as wool.
    expect(b.wash).toBe('hand-wash');
    expect(b.reasoning).toContain('most delicate fibre');
    expect(b.reasoning).toContain('Wool');
  });

  it('a silk-cotton blend follows the silk, not the cotton', () => {
    const b = classifyFibreBehavior(['cotton', 'silk']);
    expect(b.block).toBe('spritz');
    expect(b.wash).toBe('hand-wash');
  });
});

describe('recommendBlocking', () => {
  it('superwash adds the pin-to-final-measurements warning', () => {
    const r = recommendBlocking(['superwash-wool']);
    expect(r.method).toBe('wet');
    expect(r.text).toContain('grow past');
  });

  it('passes extra fabric notes through', () => {
    const r = recommendBlocking(['wool'], 'Pin ribbing last.');
    expect(r.text).toContain('Pin ribbing last.');
  });
});

describe('generateSubstituteLine', () => {
  it('generates a DK substitution line from the weight table', () => {
    const s = generateSubstituteLine(makeProject('DK'));
    expect(s.weightLabel).toBe('DK (3)');
    expect(s.metresPer100g).toEqual([210, 230]);
    expect(s.line).toContain('210–230 m/100 g');
    expect(s.line).toContain('swatch to the stated gauge');
  });

  it('pins the line to an explicit put-up when given', () => {
    const s = generateSubstituteLine(makeProject('worsted'), 190);
    expect(s.metresPer100g).toEqual([190, 190]);
    expect(s.line).toContain('around 190 m per 100 g');
  });

  it('defaults to worsted when the project has no weight set', () => {
    const s = generateSubstituteLine(makeProject());
    expect(s.weightLabel).toBe('Worsted (4)');
  });

  it('covers all seven weight classes with sane bands', () => {
    for (const w of ['lace', 'fingering', 'sport', 'DK', 'worsted', 'bulky', 'super-bulky'] as const) {
      const [lo, hi] = generateSubstituteLine(makeProject(w)).metresPer100g;
      expect(lo).toBeGreaterThan(0);
      expect(hi).toBeGreaterThanOrEqual(lo);
    }
  });
});

describe('generateFinishGuide', () => {
  it('assembles a full copy-ready pattern section', () => {
    const guide = generateFinishGuide(makeProject('fingering'), { fibres: ['wool', 'silk'] });
    const ps = guide.patternSection;
    expect(ps).toContain('MATERIALS & SUBSTITUTION');
    expect(ps).toContain('FINISHING');
    expect(ps).toContain('CARE');
    // Silk is the most delicate fibre in the blend, so guidance follows silk.
    expect(guide.blocking.method).toBe('spritz');
    expect(ps).toContain('Never hang');
    expect(ps).toContain('ball band');
    expect(guide.fibres).toEqual(['wool', 'silk']);
  });

  it('uses the designer-provided put-up in the substitution line', () => {
    const guide = generateFinishGuide(makeProject('DK'), { fibres: ['cotton'], metresPer100g: 250 });
    expect(guide.patternSection).toContain('around 250 m per 100 g');
  });

  it('animal-fibre projects get moth storage advice; plant/synth do not', () => {
    const woolGuide = generateFinishGuide(makeProject(), { fibres: ['wool'] });
    const cottonGuide = generateFinishGuide(makeProject(), { fibres: ['cotton'] });
    expect(woolGuide.storage).toContain('moths');
    expect(cottonGuide.storage).not.toContain('moths');
  });
});
