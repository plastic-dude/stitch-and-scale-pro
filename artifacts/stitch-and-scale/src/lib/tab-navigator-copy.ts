// CHK-120 — Localized copy for the responsive tab navigator (QA #62).
// Follows the per-lab -copy.ts pattern: one typed block per locale,
// no calculation semantics involved.
import type { LanguageCode } from '@/lib/i18n';

export interface TabNavigatorCopy {
  /** Button/trigger label shown next to the group chips. */
  allLabs: string;
  /** Grouped list title, e.g. "All 79 labs". */
  labsTitle: string;
  /** Grouped list description. */
  labsDescription: string;
  /** ARIA label for the desktop dropdown trigger. */
  allLabsAriaLabel: string;
  searchPlaceholder: string;
  recentLabs: string;
  noResults: string;
}

export const NAVIGATOR_COPY: Record<LanguageCode, TabNavigatorCopy> = {
  en: {
    allLabs: 'All Labs',
    labsTitle: 'All 79 Labs',
    labsDescription: 'Every tool for this pattern, grouped so nothing stays buried off-screen.',
    allLabsAriaLabel: 'Open grouped list of all 79 workspace labs',
    searchPlaceholder: 'Search labs…', recentLabs: 'Recent labs', noResults: 'No labs match this search.',
  },
  de: {
    allLabs: 'Alle Labore',
    labsTitle: 'Alle 79 Labore',
    labsDescription: 'Jedes Werkzeug für dieses Muster, gruppiert — damit nichts unsichtbar bleibt.',
    allLabsAriaLabel: 'Gruppierte Liste aller 79 Arbeitsbereichs-Labore öffnen',
    searchPlaceholder: 'Labore suchen…', recentLabs: 'Zuletzt verwendet', noResults: 'Keine passenden Labore gefunden.',
  },
  fr: {
    allLabs: 'Tous les labos',
    labsTitle: 'Les 79 labos',
    labsDescription: 'Tous les outils de ce patron, regroupés pour ne rien laisser hors écran.',
    allLabsAriaLabel: 'Ouvrir la liste groupée des 79 labos de l’espace de travail',
    searchPlaceholder: 'Rechercher un labo…', recentLabs: 'Labos récents', noResults: 'Aucun labo ne correspond à cette recherche.',
  },
  es: {
    allLabs: 'Todos los labs',
    labsTitle: 'Los 79 labs',
    labsDescription: 'Todas las herramientas de este patrón, agrupadas para que nada quede fuera de pantalla.',
    allLabsAriaLabel: 'Abrir la lista agrupada de los 79 laboratorios del espacio de trabajo',
    searchPlaceholder: 'Buscar laboratorios…', recentLabs: 'Laboratorios recientes', noResults: 'Ningún laboratorio coincide con la búsqueda.',
  },
  pt: {
    allLabs: 'Todos os labs',
    labsTitle: 'Os 79 labs',
    labsDescription: 'Todas as ferramentas deste padrão, agrupadas para que nada fique fora do ecrã.',
    allLabsAriaLabel: 'Abrir a lista agrupada dos 79 laboratórios do espaço de trabalho',
    searchPlaceholder: 'Pesquisar labs…', recentLabs: 'Labs recentes', noResults: 'Nenhum laboratório corresponde à pesquisa.',
  },
};
