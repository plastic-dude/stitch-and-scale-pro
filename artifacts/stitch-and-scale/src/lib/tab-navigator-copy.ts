// CHK-120 — Localized copy for the responsive tab navigator (QA #62).
// Follows the per-lab -copy.ts pattern: one typed block per locale,
// no calculation semantics involved.
import type { LanguageCode } from '@/lib/i18n';

export interface TabNavigatorCopy {
  /** Button/trigger label shown next to the group chips. */
  allLabs: string;
  /** Grouped list title, e.g. "All {{count}} labs". */
  labsTitle: string;
  /** Grouped list description. */
  labsDescription: string;
  /** ARIA label for the desktop dropdown trigger. */
  allLabsAriaLabel: string;
  /** Search input placeholder. */
  searchPlaceholder: string;
  /** No results found for search. */
  noResults: string;
  /** Favorites section title. */
  favorites: string;
  /** Recent section title. */
  recent: string;
  /** Tooltip/ARIA for adding to favorites. */
  addToFavorites: string;
  /** Tooltip/ARIA for removing from favorites. */
  removeFromFavorites: string;
}

export const COPY: Record<LanguageCode, TabNavigatorCopy> = {
  en: {
    allLabs: 'All Labs',
    labsTitle: 'All {{count}} Labs',
    labsDescription: 'Every tool for this pattern, grouped so nothing stays buried off-screen.',
    allLabsAriaLabel: 'Open grouped list of all {{count}} workspace labs',
    searchPlaceholder: 'Search labs...',
    noResults: 'No labs match your search',
    favorites: 'Favorites',
    recent: 'Recent',
    addToFavorites: 'Add to favorites',
    removeFromFavorites: 'Remove from favorites',
  },
  de: {
    allLabs: 'Alle Labore',
    labsTitle: 'Alle {{count}} Labore',
    labsDescription: 'Jedes Werkzeug für dieses Muster, gruppiert — damit nichts unsichtbar bleibt.',
    allLabsAriaLabel: 'Gruppierte Liste aller {{count}} Arbeitsbereichs-Labore öffnen',
    searchPlaceholder: 'Labore suchen...',
    noResults: 'Keine Labore gefunden',
    favorites: 'Favoriten',
    recent: 'Zuletzt verwendet',
    addToFavorites: 'Zu Favoriten hinzufügen',
    removeFromFavorites: 'Aus Favoriten entfernen',
  },
  fr: {
    allLabs: 'Tous les labos',
    labsTitle: 'Les {{count}} labos',
    labsDescription: 'Tous les outils de ce patron, regroupés pour ne rien laisser hors écran.',
    allLabsAriaLabel: 'Ouvrir la liste groupée des {{count}} labos de l’espace de travail',
    searchPlaceholder: 'Rechercher des labos...',
    noResults: 'Aucun labo trouvé',
    favorites: 'Favoris',
    recent: 'Récents',
    addToFavorites: 'Ajouter aux favoris',
    removeFromFavorites: 'Retirer des favoris',
  },
  es: {
    allLabs: 'Todos los labs',
    labsTitle: 'Los {{count}} labs',
    labsDescription: 'Todas las herramientas de este patrón, agrupadas para que nada quede fuera de pantalla.',
    allLabsAriaLabel: 'Abrir la lista agrupada de los {{count}} laboratorios del espacio de trabajo',
    searchPlaceholder: 'Buscar labs...',
    noResults: 'No se encontraron labs',
    favorites: 'Favoritos',
    recent: 'Recientes',
    addToFavorites: 'Añadir a favoritos',
    removeFromFavorites: 'Quitar de favoritos',
  },
  pt: {
    allLabs: 'Todos os labs',
    labsTitle: 'Os {{count}} labs',
    labsDescription: 'Todas as ferramentas deste padrão, agrupadas para que nada fique fora do ecrã.',
    allLabsAriaLabel: 'Abrir a lista agrupada dos {{count}} laboratórios do espaço de trabalho',
    searchPlaceholder: 'Procurar labs...',
    noResults: 'Nenhum lab encontrado',
    favorites: 'Favoritos',
    recent: 'Recentes',
    addToFavorites: 'Adicionar aos favoritos',
    removeFromFavorites: 'Remover dos favoritos',
  },
};

export const NAVIGATOR_COPY = COPY;
