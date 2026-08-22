import type { LanguageCode } from './i18n';

export interface HandoffCopy {
  download: string;
  downloadRequested: string;
  downloadRequestedDescription: string;
}

const COPY: Record<LanguageCode, HandoffCopy> = {
  en: { download: 'Handoff JSON', downloadRequested: 'Download requested', downloadRequestedDescription: 'Check your downloads for the structured technical evidence packet.' },
  de: { download: 'Übergabe-JSON', downloadRequested: 'Download angefordert', downloadRequestedDescription: 'Prüfe deine Downloads auf das strukturierte technische Nachweispaket.' },
  fr: { download: 'JSON de passation', downloadRequested: 'Téléchargement demandé', downloadRequestedDescription: 'Vérifiez vos téléchargements pour le dossier technique structuré.' },
  es: { download: 'JSON de entrega', downloadRequested: 'Descarga solicitada', downloadRequestedDescription: 'Revisa tus descargas para encontrar el paquete técnico estructurado.' },
  pt: { download: 'JSON de entrega', downloadRequested: 'Transferência solicitada', downloadRequestedDescription: 'Verifica as tuas transferências para encontrar o pacote técnico estruturado.' },
};

export function getHandoffCopy(locale: string): HandoffCopy {
  return COPY[locale.toLowerCase().split('-')[0] as LanguageCode] ?? COPY.en;
}
