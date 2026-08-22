import { describe, it, expect } from 'vitest';
import { makeDemoProject, DEMO_PROJECT_ID } from './context/ProjectsContext';

describe('Localized Demo Seeding', () => {
  it('should seed the demo project with the correct localized name', () => {
    const enDemo = makeDemoProject('en');
    expect(enDemo.name).toBe('Classic Crew Neck Sweater');
    expect(enDemo.id).toBe(DEMO_PROJECT_ID);

    const deDemo = makeDemoProject('de');
    expect(deDemo.name).toBe('Klassischer Rundhalspullover');
    
    const frDemo = makeDemoProject('fr');
    expect(frDemo.name).toBe('Pull à col rond classique');
    
    const esDemo = makeDemoProject('es');
    expect(esDemo.name).toBe('Suéter clásico de cuello redondo');
    
    const ptDemo = makeDemoProject('pt');
    expect(ptDemo.name).toBe('Suéter clássico de gola redonda');
  });

  it('should seed the demo project with localized section names', () => {
    const deDemo = makeDemoProject('de');
    const bodySection = deDemo.sections.find(s => s.name === 'Körper');
    expect(bodySection).toBeDefined();
    
    const frDemo = makeDemoProject('fr');
    const bodySectionFr = frDemo.sections.find(s => s.name === 'Corps');
    expect(bodySectionFr).toBeDefined();
  });
});
