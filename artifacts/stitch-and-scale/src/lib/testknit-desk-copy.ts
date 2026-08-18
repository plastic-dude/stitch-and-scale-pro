import type { LanguageCode } from '@/lib/i18n';

const MAP: Record<LanguageCode, { testersEmptyState: string }> = {
  en: { testersEmptyState: "No testers yet — tap a size button above to add one." },
  de: { testersEmptyState: "Noch keine Tester — tippe oben auf einen Größen-Button, um einen hinzuzufügen." },
  fr: { testersEmptyState: "Aucun testeur pour le moment — touchez un bouton de taille ci-dessus pour en ajouter un." },
  es: { testersEmptyState: "Aún no hay probadores — toca un botón de talla de arriba para añadir uno." },
  pt: { testersEmptyState: "Ainda não há testers — toca num botão de tamanho acima para adicionar um." },
};

export function testknitDeskTestersEmptyState(language: LanguageCode): string {
  return MAP[language]?.testersEmptyState ?? MAP.en.testersEmptyState;
}
