import type { LanguageCode } from './i18n';

export interface HandoffCopy {
  download: string;
  downloaded: string;
  downloadedDescription: string;
}

const COPY: Record<LanguageCode, HandoffCopy> = {
  en: { download: 'Handoff JSON', downloaded: 'Handoff packet downloaded', downloadedDescription: 'The structured technical evidence packet is ready to share with an editor.' },
  de: { download: 'Übergabe-JSON', downloaded: 'Übergabepaket heruntergeladen', downloadedDescription: 'Das strukturierte technische Nachweispaket kann jetzt mit einer Redaktion geteilt werden.' },
  fr: { download: 'JSON de passation', downloaded: 'Paquet de passation téléchargé', downloadedDescription: 'Le dossier technique structuré peut maintenant être partagé avec un éditeur.' },
  es: { download: 'JSON de entrega', downloaded: 'Paquete de entrega descargado', downloadedDescription: 'El paquete técnico estructurado está listo para compartir con un editor.' },
  pt: { download: 'JSON de entrega', downloaded: 'Pacote de entrega descarregado', downloadedDescription: 'O pacote técnico estruturado está pronto para partilhar com um editor.' },
};

export function getHandoffCopy(locale: string): HandoffCopy {
  return COPY[locale.toLowerCase().split('-')[0] as LanguageCode] ?? COPY.en;
}
