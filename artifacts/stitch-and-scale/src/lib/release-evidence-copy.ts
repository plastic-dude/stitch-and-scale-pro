import type { LanguageCode } from './i18n';
import type { ReleaseEvidenceKey, ReleaseEvidenceStatus } from './release-evidence';

export interface ReleaseEvidenceCopy {
  title: string;
  description: string;
  categories: Record<ReleaseEvidenceKey, string>;
  status: Record<ReleaseEvidenceStatus, string>;
  notePlaceholder: string;
  evidencePlaceholder: string;
  save: string;
  saved: string;
  readiness: string;
  ready: string;
  notReady: string;
  boundary: string;
}

const COPY: Record<LanguageCode, ReleaseEvidenceCopy> = {
  en: { title: 'Release evidence', description: 'Record physical and test-knit evidence separately from automated QA. This checklist does not replace technical editing.', categories: { 'physical-print': 'Physical print review', 'chart-readability': 'Chart readability', 'schematic-scale': 'Schematic scale', 'test-knit': 'Test knit' }, status: { 'not-started': 'Not started', 'in-review': 'In review', passed: 'Passed', blocked: 'Blocked' }, notePlaceholder: 'What was reviewed or observed?', evidencePlaceholder: 'Evidence path, knitter note, or print reference', save: 'Save evidence', saved: 'Evidence saved locally.', readiness: 'Certification status', ready: 'All four evidence items passed', notReady: 'Physical or test-knit evidence is still outstanding', boundary: 'Automated checks can support review but cannot prove physical print quality, chart scale, or successful test knitting.' },
  de: { title: 'Veröffentlichungsnachweise', description: 'Physische und Teststrick-Nachweise getrennt von automatisierter QA festhalten. Diese Checkliste ersetzt keine technische Redaktion.', categories: { 'physical-print': 'Physische Druckprüfung', 'chart-readability': 'Lesbarkeit der Strickschrift', 'schematic-scale': 'Maßstab der Schnittzeichnung', 'test-knit': 'Teststrick' }, status: { 'not-started': 'Nicht begonnen', 'in-review': 'In Prüfung', passed: 'Bestanden', blocked: 'Blockiert' }, notePlaceholder: 'Was wurde geprüft oder beobachtet?', evidencePlaceholder: 'Belegpfad, Stricker:innen-Notiz oder Druckreferenz', save: 'Nachweis speichern', saved: 'Nachweis lokal gespeichert.', readiness: 'Zertifizierungsstatus', ready: 'Alle vier Nachweise bestanden', notReady: 'Physische oder Teststrick-Nachweise fehlen noch', boundary: 'Automatisierte Prüfungen unterstützen die review, beweisen aber keine Druckqualität, Diagrammgröße oder erfolgreichen Teststrick.' },
  fr: { title: 'Preuves de publication', description: 'Consignez séparément les preuves d’impression et de test tricot. Cette liste ne remplace pas l’édition technique.', categories: { 'physical-print': 'Revue de l’impression', 'chart-readability': 'Lisibilité du diagramme', 'schematic-scale': 'Échelle du schéma', 'test-knit': 'Test tricot' }, status: { 'not-started': 'Non commencé', 'in-review': 'En revue', passed: 'Validé', blocked: 'Bloqué' }, notePlaceholder: 'Qu’avez-vous vérifié ou observé ?', evidencePlaceholder: 'Chemin de preuve, note du testeur ou référence d’impression', save: 'Enregistrer la preuve', saved: 'Preuve enregistrée localement.', readiness: 'État de certification', ready: 'Les quatre preuves sont validées', notReady: 'Des preuves d’impression ou de test tricot manquent encore', boundary: 'Les contrôles automatisés aident la revue mais ne prouvent pas la qualité d’impression, l’échelle du diagramme ou la réussite d’un test tricot.' },
  es: { title: 'Evidencias de publicación', description: 'Registra por separado las pruebas de impresión física y test knit. Esta lista no sustituye la edición técnica.', categories: { 'physical-print': 'Revisión de impresión física', 'chart-readability': 'Legibilidad del gráfico', 'schematic-scale': 'Escala del esquema', 'test-knit': 'Test knit' }, status: { 'not-started': 'Sin comenzar', 'in-review': 'En revisión', passed: 'Superado', blocked: 'Bloqueado' }, notePlaceholder: '¿Qué se revisó u observó?', evidencePlaceholder: 'Ruta de evidencia, nota de la persona que tejió o referencia impresa', save: 'Guardar evidencia', saved: 'Evidencia guardada localmente.', readiness: 'Estado de certificación', ready: 'Las cuatro evidencias están superadas', notReady: 'Aún falta evidencia física o de test knit', boundary: 'Las comprobaciones automáticas ayudan en la revisión, pero no prueban la calidad de impresión, la escala del gráfico ni un test knit satisfactorio.' },
  pt: { title: 'Evidências de publicação', description: 'Registe separadamente as provas de impressão física e de test knit. Esta lista não substitui a edição técnica.', categories: { 'physical-print': 'Revisão da impressão física', 'chart-readability': 'Legibilidade do gráfico', 'schematic-scale': 'Escala do esquema', 'test-knit': 'Test knit' }, status: { 'not-started': 'Não iniciado', 'in-review': 'Em revisão', passed: 'Aprovado', blocked: 'Bloqueado' }, notePlaceholder: 'O que foi verificado ou observado?', evidencePlaceholder: 'Caminho da evidência, nota da pessoa que testou ou referência impressa', save: 'Guardar evidência', saved: 'Evidência guardada localmente.', readiness: 'Estado de certificação', ready: 'As quatro evidências foram aprovadas', notReady: 'Ainda falta evidência física ou de test knit', boundary: 'As verificações automáticas apoiam a revisão, mas não provam a qualidade da impressão, a escala do gráfico ou um test knit bem-sucedido.' },
};

export function getReleaseEvidenceCopy(locale: string): ReleaseEvidenceCopy {
  return COPY[locale.toLowerCase().split('-')[0] as LanguageCode] ?? COPY.en;
}
