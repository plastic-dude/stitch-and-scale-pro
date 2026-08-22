import type { LanguageCode } from '@/lib/i18n';

export const COPY: Record<LanguageCode, { partnersEmptyState: string }> = {
  en: { partnersEmptyState: "No partners added yet — the bundle is modeled with your pattern alone. Add the patterns your coalition organiser or fellow designers bring, and the split math becomes the coalition math instead of a guess." },
  de: { partnersEmptyState: "Noch keine Partner hinzugefügt — das Bündel wird nur mit deinem Muster modelliert. Füge die Muster hinzu, die deine Bündel-Organisatorin oder andere Designer einbringen, und die Aufteilungsrechnung wird zur echten Bündelrechnung statt einer Schätzung." },
  fr: { partnersEmptyState: "Aucun partenaire ajouté — le bundle est modélisé avec votre motif seul. Ajoutez les motifs que votre organisateur de coalition ou d’autres designers apportent, et le calcul du partage devient le vrai calcul de la coalition plutôt qu’une estimation." },
  es: { partnersEmptyState: "Aún no hay socios añadidos — el paquete se modela solo con tu patrón. Añade los patrones que traen tu organizadora de coalición u otros diseñadores, y el cálculo del reparto se vuelve el cálculo real de la coalición en lugar de una suposición." },
  pt: { partnersEmptyState: "Ainda não há parceiros adicionados — o pacote é modelado apenas com o teu padrão. Adiciona os padrões que a tua organizadora de coalizão ou outros designers trazem, e o cálculo da divisão torna-se a matemática real da coalizão em vez de um palpite." },
};

export function translationBundlePartnersEmptyState(language: LanguageCode): string {
  return COPY[language]?.partnersEmptyState ?? COPY.en.partnersEmptyState;
}
