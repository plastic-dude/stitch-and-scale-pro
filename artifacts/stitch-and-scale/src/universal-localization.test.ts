import { describe, it, expect } from 'vitest';
import { runTechEditAudit } from './lib/tech-edit-audit';
import { analyzePricingPsychology } from './lib/pricing-psychology-lab';
import { analyzePodcastAffiliate } from './lib/podcast-affiliate-lab';
import { analyzePODPatterns } from './lib/pod-patterns-lab';
import { getSampleCrewNeckSweater, getSampleBasicBeanie } from './lib/sample-projects';

describe('Universal Localization II (CHK-163)', () => {
  describe('Tech-Edit Audit Localization', () => {
    it('returns German findings when language is de', () => {
      const result = runTechEditAudit({
        id: 'p1',
        name: 'Test',
        sections: [{ id: 's1', name: 'Body', measurements: [] }],
        baseSize: 'M',
        gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' }
      } as any, { language: 'de' });
      
      expect(result.findings.some(f => f.title === 'Keine Größen gradiert')).toBe(true);
      expect(result.marketBill.note.includes('Editoren berechnen')).toBe(true);
    });

    it('returns French findings when language is fr', () => {
      const result = runTechEditAudit({
        id: 'p1',
        name: 'Test',
        sections: [{ id: 's1', name: 'Body', measurements: [] }],
        baseSize: 'M',
        gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' }
      } as any, { language: 'fr' });
      
      expect(result.findings.some(f => f.title === 'Aucune taille gradée')).toBe(true);
    });
  });

  describe('Pricing Psychology Localization', () => {
    it('returns German findings when language is de', () => {
      const result = analyzePricingPsychology({
        patternName: 'Test',
        currentPrice: 10.00,
        candidatePrice: 9.99,
        platformTakeRate: 0.1,
        unitsPerMonth: 50,
        tierPositioning: 'mainstream',
        multiTierShop: false,
        shopTiers: [],
        bundleSize: 1,
        componentPrice: 0,
        bundleCandidateTotal: 0,
        bundleUnitsPerMonth: 0,
        componentUnitsPerMonth: 0
      }, { language: 'de' });
      
      expect(result.flags.some(f => f.title.includes('Barriere'))).toBe(true);
    });
  });

  describe('Podcast Affiliate Localization', () => {
    it('returns localized lane labels', () => {
      const result = analyzePodcastAffiliate({
        downloadsPerEpisode: 1000,
        episodesPerMonth: 4,
        productionHoursPerEpisode: 4,
        setupCosts: 0,
        monthlyCosts: 0,
        cpmRate: 25,
        adSlotsPerEpisode: 1,
        networkCut: 0.2,
        fillRate: 1,
        flatFeePerRead: 100,
        readsPerMonth: 4,
        programs: [],
        hourlyRate: 50
      }, { language: 'de' });
      
      expect(result.lanes.some(l => l.label === 'CPM-Sponsoring')).toBe(true);
    });
  });

  describe('Sample Project Localization', () => {
    it('returns German project name for de', () => {
      const project = getSampleCrewNeckSweater('de');
      expect(project.name).toBe('Klassischer Rundhalspullover');
      expect(project.sections[0].name).toBe('Körper');
    });

    it('returns French project name for fr', () => {
      const project = getSampleCrewNeckSweater('fr');
      expect(project.name).toBe('Pull à col rond classique');
      expect(project.sections[0].name).toBe('Corps');
    });
  });
});
