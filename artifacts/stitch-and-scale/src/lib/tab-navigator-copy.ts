// CHK-120 — Localized copy for the responsive tab navigator (QA #62).
// Follows the per-lab -copy.ts pattern: one typed block per locale,
// no calculation semantics involved.
import type { LanguageCode } from '@/lib/i18n';

export interface TabNavigatorCopy {
  /** Button/trigger label shown next to the group chips. */
  allLabs: string;
  /** Grouped list title with a {count} token, e.g. "All {count} Labs". */
  labsTitle: string;
  /** Grouped list description. */
  labsDescription: string;
  /** ARIA label for the desktop dropdown trigger with a {count} token. */
  allLabsAriaLabel: string;
}

export function formatTabNavigatorCopy(copy: TabNavigatorCopy, count: number): TabNavigatorCopy {
  const value = String(count);
  return {
    ...copy,
    labsTitle: copy.labsTitle.replace('{count}', value),
    allLabsAriaLabel: copy.allLabsAriaLabel.replace('{count}', value),
  };
}

export const NAVIGATOR_COPY: Record<LanguageCode, TabNavigatorCopy> = {
  en: {
    allLabs: 'All Labs',
    labsTitle: 'All {count} Labs',
    labsDescription: 'Every tool for this pattern, grouped so nothing stays buried off-screen.',
    allLabsAriaLabel: 'Open grouped list of all {count} workspace labs',
  },
  de: {
    allLabs: 'Alle Labore',
    labsTitle: 'Alle {count} Labore',
    labsDescription: 'Jedes Werkzeug für dieses Muster, gruppiert — damit nichts unsichtbar bleibt.',
    allLabsAriaLabel: 'Gruppierte Liste aller {count} Arbeitsbereichs-Labore öffnen',
  },
  fr: {
    allLabs: 'Tous les labos',
    labsTitle: 'Les {count} labos',
    labsDescription: 'Tous les outils de ce patron, regroupés pour ne rien laisser hors écran.',
    allLabsAriaLabel: 'Ouvrir la liste groupée des {count} labos de l’espace de travail',
  },
  es: {
    allLabs: 'Todos los labs',
    labsTitle: 'Los {count} labs',
    labsDescription: 'Todas las herramientas de este patrón, agrupadas para que nada quede fuera de pantalla.',
    allLabsAriaLabel: 'Abrir la lista agrupada de los {count} laboratorios del espacio de trabajo',
  },
  pt: {
    allLabs: 'Todos os labs',
    labsTitle: 'Os {count} labs',
    labsDescription: 'Todas as ferramentas deste padrão, agrupadas para que nada fique fora do ecrã.',
    allLabsAriaLabel: 'Abrir a lista agrupada dos {count} laboratórios do espaço de trabalho',
  },
};
