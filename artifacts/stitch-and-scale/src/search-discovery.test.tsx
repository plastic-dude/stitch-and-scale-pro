import { describe, it, expect } from 'vitest';
import { tabGroupsFromRegistry } from '@/components/tab-navigator';
import { NAVIGATOR_COPY } from '@/lib/tab-navigator-copy';

describe('TabNavigator Search and Discovery Logic (QUEUE-019)', () => {
  it('tabGroupsFromRegistry returns all labs grouped', () => {
    const groups = tabGroupsFromRegistry();
    const allLabs = groups.flatMap(g => g.entries);
    expect(allLabs.length).toBeGreaterThanOrEqual(79);
  });

  it('NAVIGATOR_COPY contains all required keys for all locales', () => {
    const locales = ['en', 'de', 'fr', 'es', 'pt'] as const;
    const requiredKeys = [
      'allLabs', 'labsTitle', 'labsDescription', 'allLabsAriaLabel',
      'searchPlaceholder', 'noResults', 'favorites', 'recent',
      'addToFavorites', 'removeFromFavorites'
    ];

    for (const lang of locales) {
      const copy = NAVIGATOR_COPY[lang];
      for (const key of requiredKeys) {
        expect(copy[key as keyof typeof copy], `Missing key ${key} in ${lang}`).toBeTruthy();
      }
    }
  });

  it('search logic correctly filters labs (simulation)', () => {
    const query = 'Yarn';
    const groups = tabGroupsFromRegistry();
    
    const filtered = groups.map(g => ({
      ...g,
      entries: g.entries.filter(t => 
        t.label.toLowerCase().includes(query.toLowerCase()) ||
        t.value.toLowerCase().includes(query.toLowerCase())
      )
    })).filter(g => g.entries.length > 0);

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.some(g => g.entries.some(t => t.value === 'yarn'))).toBe(true);
    expect(filtered.every(g => g.entries.every(t => !t.value.includes('sections')))).toBe(true);
  });

  it('favorites logic simulation', () => {
    const favorites = ['yarn', 'income'];
    
    expect(favorites).toContain('yarn');
    
    // Toggle favorite logic
    const toggle = (val: string, prev: string[]) => 
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val];
    
    expect(toggle('yarn', favorites)).not.toContain('yarn');
    expect(toggle('fit', favorites)).toContain('fit');
  });
});
