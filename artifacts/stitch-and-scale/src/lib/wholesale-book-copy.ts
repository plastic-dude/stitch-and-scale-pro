// CHK-145 localization module — Wholesale Book Analyzer headings (was bare English).
import type { LanguageCode } from '@/lib/i18n';

export interface WholesaleBookCopy {
  bulkOrderChecklistReply: string;
}

const en: WholesaleBookCopy = { bulkOrderChecklistReply: 'Bulk-order checklist & reply' };
const de: WholesaleBookCopy = { bulkOrderChecklistReply: 'Checkliste für Großbestellungen & Antwort' };
const fr: WholesaleBookCopy = { bulkOrderChecklistReply: 'Checklist de commande en gros & réponse' };
const es: WholesaleBookCopy = { bulkOrderChecklistReply: 'Checklist de pedido al por mayor y respuesta' };
const pt: WholesaleBookCopy = { bulkOrderChecklistReply: 'Checklist de pedido por atacado e resposta' };

export const COPY: Record<LanguageCode, WholesaleBookCopy> = { en, de, fr, es, pt };
export function getWholesaleBookCopy(language: LanguageCode): WholesaleBookCopy {
  return WHOLESALE_BOOK_COPY[language] ?? WHOLESALE_BOOK_COPY.en;
}

export const WHOLESALE_BOOK_COPY = COPY;
