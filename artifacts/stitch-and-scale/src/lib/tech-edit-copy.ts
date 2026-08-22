import type { LanguageCode } from '@/lib/i18n';

export interface TechEditCopy {
  title: string;
  description: string;
  verdictClean: string;
  verdictCheck: string;
  verdictFix: string;
  severityError: string;
  severityWarning: string;
  severityNote: string;
  severityPass: string;
  findingsCount: (errors: number, warnings: number, notes: number) => string;
  cleanSweep: string;
  editorBillSaved: string;
  editorRateLabel: string;
  perHour: string;
  marketQuoteTitle: string;
  marketQuoteDetails: (hours: number, days: number) => string;
  negotiateHint: (count: number) => string;
  preEditSummaryTitle: string;
  copyForEditor: string;
  preEditSummaryHeader: (name: string) => string;
  designerLabel: string;
  baseSizeLabel: string;
  gaugeLabel: string;
  auditScoreLabel: (score: number, verdict: string) => string;
  alreadyCheckedLabel: string;
  checkedItems: string[];
  outstandingItemsLabel: (count: number) => string;
  prosePassLabel: string;
  prosePassDetails: string;
  savingsNote: (pending: number) => string;
  cleanSavingsNote: string;
  marketNotePending: (pending: number, low: number, high: number, hours: number, sizes: number, sizesWord: string, days: number) => string;
  marketNoteClean: (low: number, high: number, hours: number, sizes: number, sizesWord: string, days: number) => string;
  
  // Findings
  findingGa01Title: string;
  findingGa01Detail: string;
  findingGa02Title: string;
  findingGa02Detail: (val: number) => string;
  findingGa02bTitle: string;
  findingGa02bDetail: string;
  findingGa03Title: string;
  findingGa03Detail: (sizes: string, values: string, unit: string) => string;
  findingGa04Title: (pct: number, size: string) => string;
  findingGa04Detail: (rounded: number, raw: string) => string;
  findingGa04bTitle: (pct: number, size: string) => string;
  findingGa04bDetail: (rounded: number, raw: string) => string;
  findingGa05Title: (rep: number) => string;
  findingGa05Detail: (rep: number) => string;
  findingGa05bTitle: string;
  findingGa05bDetail: (rem: number, rep: number) => string;
  findingGa05cTitle: string;
  findingGa05cDetail: string;
  findingGa06Title: (size: string) => string;
  findingGa06Detail: (count: number) => string;
  findingGa07Title: string;
  findingGa07Detail: (label: string, key: string) => string;
  findingGa08Title: string;
  findingGa08Detail: string;
  findingGa08bTitle: string;
  findingGa08bDetail: string;
  findingGa09Title: (pct: number, standard: string, size: string) => string;
  findingGa09Detail: (val: number, unit: string, standard: string, size: string, target: string) => string;
  findingGa09bTitle: (standard: string, size: string) => string;
  findingGa09bDetail: (val: number, unit: string, target: string) => string;
  findingGa10Title: (label: string) => string;
  findingGa10Detail: (n: number, section: string) => string;
  findingGa11Title: string;
  findingGa11Detail: string;
  findingGa12Title: string;
  findingGa12Detail: string;
}

const en: TechEditCopy = {
  title: 'Self Tech-Edit Audit',
  description: 'A numbers-first pass before a human editor sees the pattern — editors bill $20–40/hr at ~10-day turnaround, so every finding you resolve is billable time saved.',
  verdictClean: 'Clean — the numbers sweep passed',
  verdictCheck: 'Worth a look',
  verdictFix: 'Fix before publishing',
  severityError: 'Error',
  severityWarning: 'Warning',
  severityNote: 'Note',
  severityPass: 'Pass',
  findingsCount: (e, w, n) => `${e} error${e === 1 ? '' : 's'} · ${w} warning${w === 1 ? '' : 's'} · ${n} note${n === 1 ? '' : 's'}`,
  cleanSweep: 'The numbers sweep passed clean: gauge validity, size-progression monotonicity, stitch/row rounding vs your repeats, stitch counts in every size, key-vs-type consistency, and base values against the body standard all check out.',
  editorBillSaved: 'Editor bill saved',
  editorRateLabel: "Your editor's hourly rate",
  perHour: '/hr',
  marketQuoteTitle: 'Market quote for this sweep',
  marketQuoteDetails: (h, d) => `≈${h}h of editor time · ~${d}-day turnaround`,
  negotiateHint: (n) => `${n} finding(s) — resolve to negotiate the lower end`,
  preEditSummaryTitle: 'Pre-edit summary',
  copyForEditor: 'Copy for your editor',
  preEditSummaryHeader: (name) => `PRE-EDIT SUMMARY — ${name}`,
  designerLabel: 'Designer',
  baseSizeLabel: 'Base size',
  gaugeLabel: 'Gauge',
  auditScoreLabel: (s, v) => `Self tech-edit audit score: ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Already checked automatically (numbers sweep):',
  checkedItems: [
    'gauge validity',
    'size progression monotonicity across all graded sizes',
    'stitch/row rounding vs repeat and parity constraints',
    'stitch count plausibility in every size',
    'measurement key vs type (width/length/circumference) consistency',
    'base values vs body standard for the base size',
    'duplicate labels, row gauge completeness'
  ],
  outstandingItemsLabel: (n) => `Outstanding items (${n}):`,
  prosePassLabel: 'What I still need from you (the prose pass):',
  prosePassDetails: 'style/abbreviations consistency, clarity of instructions, UK/US spelling, cohesiveness with charts/schematics.',
  savingsNote: (p) => `Resolve the ${p} outstanding finding(s) above before a human editor touches the pattern — every one they don't have to find is billable time saved.`,
  cleanSavingsNote: 'The numbers sweep is clean — a paid editor can now focus purely on the prose pass (style, abbreviations, clarity), which is the half of the bill that genuinely needs human eyes.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Editors charge $${low}–$${high}/hr for this sweep (~${h}h for ${s} ${sw}) and document a real shortage — patterns wait ~${d} days in queue. Resolve findings first to justify negotiating the lower end.`,
  marketNoteClean: (low, high, h, s, sw, d) => `A human editor would quote $${low}–$${high} for the same ${h}h of arithmetic, at $20–$40/hr — and most would add a per-size premium. The numbers sweep is fully automatable; their flaw is charging hourly rates for arithmetic.`,

  findingGa01Title: 'Gauge not set — every number below is unreliable',
  findingGa01Detail: 'Set stitches/rows per 4in in the project gauge. A tech editor cannot verify math without it, and neither can a tester. This is the first thing on any tech-edit pre-edit checklist.',
  findingGa02Title: 'Base measurement is negative',
  findingGa02Detail: (v) => `Base value ${v} is negative. Measurements must be positive — a negative width or length cannot be knit.`,
  findingGa02bTitle: 'Base measurement is zero — excluded from grading',
  findingGa02bDetail: 'A zero base value excludes this measurement from all graded sizes. If this is intentional (e.g. a decorative panel), fine; if not, enter the base size value.',
  findingGa03Title: 'Size progression is not monotonic',
  findingGa03Detail: (s, v, u) => `Physical values across ${s} are: ${v} ${u}. Garment dimensions should grow (or stay level) with size — check whether this measurement's grading key or type is correct.`,
  findingGa04Title: (p, s) => `Stitch count pulled ${p}% from raw target (${s})`,
  findingGa04Detail: (r, raw) => `Rounded to ${r} stitches vs raw ${raw}. The stitch pattern's repeat/parity constraint is forcing the count away from the target measurement — check the finished fit at this size.`,
  findingGa04bTitle: (p, s) => `Row count pulled ${p}% from raw target (${s})`,
  findingGa04bDetail: (r, raw) => `Rounded to ${r} rows vs raw ${raw}. Length tolerance is usually forgiving, but flag if the measurement is critical (e.g. armhole depth).`,
  findingGa05Title: (r) => `Stitch repeat of ${r} is a no-op`,
  findingGa05Detail: (r) => `A repeat of ${r} rounds to the nearest integer like no repeat at all. Set the actual stitch-pattern multiple (e.g. 6 for a 6-stitch cable panel) or clear it.`,
  findingGa05bTitle: 'Stitch remainder is invalid for the repeat',
  findingGa05bDetail: (rem, rep) => `Remainder ${rem} is outside the valid range 0…${rep - 1} for a repeat of ${rep}. Valid counts would be …${rep + rem}, ${2 * rep + rem}, …`,
  findingGa05cTitle: 'Both parity and repeat set — parity wins',
  findingGa05cDetail: 'When both are set, parity rounding takes precedence. Keep whichever constraint actually governs this measurement.',
  findingGa06Title: (s) => `Zero/negative stitch count at size ${s}`,
  findingGa06Detail: (c) => `Rounded stitch count is ${c}. A count this small usually means the base value, gauge, or grading key is wrong for this measurement.`,
  findingGa07Title: 'Length key graded as a width',
  findingGa07Detail: (l, k) => `${l} uses the ${k} key (a length) with type "width", which halves the value when grading. If this measurement should be a length, set its type to "length" or "direct".`,
  findingGa08Title: 'No sizes graded',
  findingGa08Detail: "Every measurement has a zero base value, so nothing is graded. Enter the base size's measurements first.",
  findingGa08bTitle: 'Single-size pattern',
  findingGa08bDetail: 'Only one size is graded. Single-size patterns are a common buyer complaint class ("why isn\'t this in more sizes?") — multi-size patterns consistently out-sell them on Ravelry and Etsy. Consider grading 3+ sizes before publishing.',
  findingGa09Title: (p, std, s) => `Base value ${p}% below the ${std} ${s} standard`,
  findingGa09Detail: (v, u, std, s, t) => `You entered ${v}${u} for this measurement, but the ${std} standard body value for size ${s} is ${t}${u}. A garment can't be smaller than the body it covers — check whether this should be a circumference grading key, or whether the base value belongs to a different size.`,
  findingGa09bTitle: (std, s) => `Base value more than double the ${std} ${s} standard`,
  findingGa09bDetail: (v, u, t) => `You entered ${v}${u} vs a body value of ${t}${u}. Ease explains drift, but not a doubling — this usually means a circumference was entered where a half-width belongs (or vice versa).`,
  findingGa10Title: (l) => `Duplicate measurement label "${l}"`,
  findingGa10Detail: (n, s) => `This label appears ${n} times in "${s}". Two measurements with the same name confuse both test knitters and tech editors — give each a distinct name (e.g. "Bust (front)" / "Bust (back)").`,
  findingGa11Title: 'Row rounding used but row gauge is not set',
  findingGa11Detail: 'At least one measurement rounds its row count, but rows/4in is unset. Row counts will be computed with zero gauge — every length in the pattern is silently wrong. Enter the row gauge before publishing.',
  findingGa12Title: 'Pattern has a single section',
  findingGa12Detail: 'Most garments have at least a body and sleeves. If this pattern is genuinely one piece (scarf, cowl), ignore this; otherwise add sections before the publish readiness check.',
};

const de: TechEditCopy = {
  ...en,
  title: 'Self Tech-Edit Audit',
  description: 'Eine Zahlen-Vorprüfung, bevor ein menschlicher Editor das Muster sieht — Editoren berechnen 20–40 $/Std. bei ~10 Tagen Bearbeitungszeit. Jeder gelöste Befund spart bares Geld.',
  verdictClean: 'Sauber — die Zahlenprüfung war erfolgreich',
  verdictCheck: 'Einen Blick wert',
  verdictFix: 'Vor der Veröffentlichung beheben',
  severityError: 'Fehler',
  severityWarning: 'Warnung',
  severityNote: 'Hinweis',
  severityPass: 'Bestanden',
  findingsCount: (e, w, n) => `${e} Fehler · ${w} Warnung${w === 1 ? '' : 'en'} · ${n} Hinweis${n === 1 ? '' : 'e'}`,
  cleanSweep: 'Die Zahlenprüfung war erfolgreich: Maschenproben-Gültigkeit, Monotonie der Größenprogression, Maschen-/Reihenrundung vs. Rapporte, Maschenzahlen in jeder Größe, Konsistenz von Schlüssel zu Typ und Basiswerte gegen den Körperstandard wurden überprüft.',
  editorBillSaved: 'Editor-Rechnung gespart',
  editorRateLabel: 'Stundensatz deines Editors',
  perHour: '/Std.',
  marketQuoteTitle: 'Marktangebot für diese Prüfung',
  marketQuoteDetails: (h, d) => `≈${h} Std. Editorzeit · ~${d} Tage Bearbeitungszeit`,
  negotiateHint: (n) => `${n} Befund${n === 1 ? '' : 'e'} — beheben, um das untere Ende zu verhandeln`,
  preEditSummaryTitle: 'Pre-Edit Zusammenfassung',
  copyForEditor: 'Für deinen Editor kopieren',
  preEditSummaryHeader: (name) => `PRE-EDIT ZUSAMMENFASSUNG — ${name}`,
  designerLabel: 'Designer',
  baseSizeLabel: 'Basisgröße',
  gaugeLabel: 'Maschenprobe',
  auditScoreLabel: (s, v) => `Self Tech-Edit Audit Score: ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Bereits automatisch geprüft (Zahlenprüfung):',
  checkedItems: [
    'Gültigkeit der Maschenprobe',
    'Monotonie der Größenprogression über alle gradierten Größen',
    'Maschen-/Reihenrundung vs. Rapport- und Paritätsvorgaben',
    'Plausibilität der Maschenzahlen in jeder Größe',
    'Konsistenz von Messschlüssel vs. Typ (Breite/Länge/Umfang)',
    'Basiswerte vs. Körperstandard für die Basisgröße',
    'Doppelte Labels, Vollständigkeit der Reihenprobe'
  ],
  outstandingItemsLabel: (n) => `Offene Punkte (${n}):`,
  prosePassLabel: 'Was ich noch von dir brauche (der Text-Check):',
  prosePassDetails: 'Konsistenz von Stil/Abkürzungen, Klarheit der Anweisungen, Schreibweise, Übereinstimmung mit Charts/Schemata.',
  savingsNote: (p) => `Löse die ${p} offenen Befunde oben, bevor ein menschlicher Editor das Muster anfasst — jeder Punkt, den er nicht finden muss, spart abrechenbare Zeit.`,
  cleanSavingsNote: 'Die Zahlenprüfung ist sauber — ein bezahlter Editor kann sich rein auf den Text-Check (Stil, Abkürzungen, Klarheit) konzentrieren, was die Hälfte der Rechnung ausmacht, die wirklich menschliche Augen braucht.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Editoren berechnen ${low}–${high} $/Std. für diese Prüfung (~${h} Std. für ${s} ${sw}) und es gibt einen echten Mangel — Muster warten ~${d} Tage in der Warteschlange. Löse Befunde zuerst, um das untere Ende zu verhandeln.`,
  marketNoteClean: (low, high, h, s, sw, d) => `Ein menschlicher Editor würde ${low}–${high} $ für dieselben ${h} Std. Arithmetik verlangen, bei $20–$40/Std. — und die meisten würden einen Aufpreis pro Größe verlangen. Die Zahlenprüfung ist voll automatisierbar; ihr Fehler ist es, Stundensätze für Arithmetik zu verlangen.`,

  findingGa01Title: 'Maschenprobe nicht gesetzt — alle Zahlen unten sind unzuverlässig',
  findingGa01Detail: 'Lege Maschen/Reihen pro 10 cm in der Projekt-Maschenprobe fest. Ein Tech-Editor kann die Mathematik ohne sie nicht prüfen, und ein Tester auch nicht. Dies ist der erste Punkt auf jeder Pre-Edit-Checkliste.',
  findingGa02Title: 'Basismaß ist negativ',
  findingGa02Detail: (v) => `Der Basiswert ${v} ist negativ. Maße müssen positiv sein — eine negative Breite oder Länge kann nicht gestrickt werden.`,
  findingGa02bTitle: 'Basismaß ist Null — von der Gradierung ausgeschlossen',
  findingGa02bDetail: 'Ein Basiswert von Null schließt dieses Maß von allen gradierten Größen aus. Wenn dies beabsichtigt ist (z. B. ein dekoratives Panel), ist das in Ordnung; wenn nicht, gib den Wert der Basisgröße ein.',
  findingGa03Title: 'Größenprogression ist nicht monoton',
  findingGa03Detail: (s, v, u) => `Die physischen Werte über ${s} sind: ${v} ${u}. Kleidungsstücke sollten mit der Größe wachsen (oder gleich bleiben) — prüfe, ob der Gradierungsschlüssel oder Typ korrekt ist.`,
  findingGa04Title: (p, s) => `Maschenzahl um ${p}% vom Rohziel verschoben (${s})`,
  findingGa04Detail: (r, raw) => `Gerundet auf ${r} Maschen vs. Rohwert ${raw}. Die Rapport-/Paritätsvorgabe zwingt die Zahl vom Zielmaß weg — prüfe die Passform in dieser Größe.`,
  findingGa04bTitle: (p, s) => `Reihenzahl um ${p}% vom Rohziel verschoben (${s})`,
  findingGa04bDetail: (r, raw) => `Gerundet auf ${r} Reihen vs. Rohwert ${raw}. Längentoleranz ist meist unkritisch, außer bei wichtigen Maßen wie der Armlochtiefe.`,
  findingGa05Title: (r) => `Maschenrapport von ${r} ist wirkungslos`,
  findingGa05Detail: (r) => `Ein Rapport von ${r} rundet wie gar kein Rapport. Setze das tatsächliche Muster-Vielfache (z. B. 6 für ein 6-Maschen-Zopfmuster) oder lösche es.`,
  findingGa05bTitle: 'Maschenrest ist ungültig für den Rapport',
  findingGa05bDetail: (rem, rep) => `Rest ${rem} liegt außerhalb des gültigen Bereichs 0…${rep - 1} für einen Rapport von ${rep}. Gültige Zahlen wären …${rep + rem}, ${2 * rep + rem}, …`,
  findingGa05cTitle: 'Parität und Rapport gesetzt — Parität gewinnt',
  findingGa05cDetail: 'Wenn beides gesetzt ist, hat die Paritätsrundung Vorrang. Behalte die Vorgabe, die dieses Maß tatsächlich steuert.',
  findingGa06Title: (s) => `Null oder negative Maschenzahl bei Größe ${s}`,
  findingGa06Detail: (c) => `Die gerundete Maschenzahl ist ${c}. Eine so kleine Zahl bedeutet meist, dass Basiswert, Maschenprobe oder Gradierungsschlüssel falsch sind.`,
  findingGa07Title: 'Längenschlüssel als Breite gradiert',
  findingGa07Detail: (l, k) => `${l} verwendet den Schlüssel ${k} (eine Länge) mit Typ "Breite", was den Wert halbiert. Wenn dies eine Länge sein soll, setze den Typ auf "Länge" oder "Direkt".`,
  findingGa08Title: 'Keine Größen gradiert',
  findingGa08Detail: "Jedes Maß hat einen Basiswert von Null, daher wird nichts gradiert. Gib zuerst die Maße der Basisgröße ein.",
  findingGa08bTitle: 'Ein-Größen-Muster',
  findingGa08bDetail: 'Nur eine Größe wird gradiert. Muster mit nur einer Größe werden oft kritisiert — Mehr-Größen-Muster verkaufen sich deutlich besser. Erwäge, mindestens 3 Größen zu gradieren.',
  findingGa09Title: (p, std, s) => `Basiswert ${p}% unter dem ${std} ${s} Standard`,
  findingGa09Detail: (v, u, std, s, t) => `Du hast ${v}${u} eingegeben, aber der ${std}-Standardwert für Größe ${s} ist ${t}${u}. Ein Kleidungsstück kann nicht kleiner als der Körper sein — prüfe den Gradierungsschlüssel oder die Größe.`,
  findingGa09bTitle: (std, s) => `Basiswert mehr als doppelt so hoch wie der ${std} ${s} Standard`,
  findingGa09bDetail: (v, u, t) => `Du hast ${v}${u} eingegeben vs. Körperwert ${t}${u}. Bequemlichkeitszugabe erklärt Abweichungen, aber keine Verdopplung — meist wurde ein Umfang statt einer halben Breite eingegeben.`,
  findingGa10Title: (l) => `Doppeltes Messlabel "${l}"`,
  findingGa10Detail: (n, s) => `This label appears ${n}-times in "${s}". Doppelte Namen verwirren Teststricker und Tech-Editoren — gib jedem Maß einen eindeutigen Namen.`,
  findingGa11Title: 'Reihenrundung aktiv, aber Reihenprobe fehlt',
  findingGa11Detail: 'Mindestens ein Maß rundet die Reihenzahl, aber Reihen/10cm ist nicht gesetzt. Reihenzahlen werden mit Null berechnet — jede Länge im Muster ist falsch. Gib die Reihenprobe ein.',
  findingGa12Title: 'Muster hat nur einen Abschnitt',
  findingGa12Detail: 'Die meisten Kleidungsstücke haben mindestens Körper und Ärmel. Wenn dies ein einteiliges Accessoire ist, ignoriere dies; andernfalls füge Abschnitte hinzu.',
};

const fr: TechEditCopy = {
  ...en,
  title: 'Auto-audit technique',
  description: 'Une vérification des chiffres avant l\'intervention d\'un éditeur humain — les éditeurs facturent 20–40 $/h avec un délai de ~10 jours. Chaque point résolu est du temps économisé.',
  verdictClean: 'Conforme — la vérification des chiffres est réussie',
  verdictCheck: 'À vérifier',
  verdictFix: 'À corriger avant publication',
  severityError: 'Erreur',
  severityWarning: 'Avertissement',
  severityNote: 'Note',
  severityPass: 'Réussi',
  findingsCount: (e, w, n) => `${e} erreur${e === 1 ? '' : 's'} · ${w} avertissement${w === 1 ? '' : 's'} · ${n} note${n === 1 ? '' : 's'}`,
  cleanSweep: 'La vérification des chiffres est réussie : validité de l\'échantillon, monotonie de la progression des tailles, arrondis des mailles/rangs vs vos rapports, nombre de mailles par taille, cohérence clé-type et valeurs de base vs standards corporels.',
  editorBillSaved: 'Facture éditeur économisée',
  editorRateLabel: 'Taux horaire de votre éditeur',
  perHour: '/h',
  marketQuoteTitle: 'Devis du marché pour cet audit',
  marketQuoteDetails: (h, d) => `≈${h}h de temps éditeur · délai ~${d} jours`,
  negotiateHint: (n) => `${n} point${n === 1 ? '' : 's'} — à résoudre pour négocier le bas de la fourchette`,
  preEditSummaryTitle: 'Résumé pré-audit',
  copyForEditor: 'Copier pour votre éditeur',
  preEditSummaryHeader: (name) => `RÉSUMÉ PRÉ-AUDIT — ${name}`,
  designerLabel: 'Designer',
  baseSizeLabel: 'Taille de base',
  gaugeLabel: 'Échantillon',
  auditScoreLabel: (s, v) => `Score d'auto-audit technique : ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Déjà vérifié automatiquement (chiffres) :',
  checkedItems: [
    'validité de l\'échantillon',
    'monotonie de la progression des tailles',
    'arrondis mailles/rangs vs contraintes de rapport et parité',
    'plausibilité du nombre de mailles dans chaque taille',
    'cohérence clé de gradation vs type (largeur/longueur/circonférence)',
    'valeurs de base vs standard corporel pour la taille de base',
    'libellés en double, complétude de l\'échantillon de rangs'
  ],
  outstandingItemsLabel: (n) => `Points en suspens (${n}) :`,
  prosePassLabel: 'Ce que j\'attends encore de vous (la vérification du texte) :',
  prosePassDetails: 'cohérence du style/abréviations, clarté des instructions, orthographe, harmonie avec les diagrammes/schémas.',
  savingsNote: (p) => `Résolvez les ${p} point(s) en suspens ci-dessus avant qu'un éditeur humain ne touche au modèle — chaque point qu'il n'a pas à trouver est du temps facturable économisé.`,
  cleanSavingsNote: 'La vérification des chiffres est propre — un éditeur payé peut maintenant se concentrer uniquement sur le texte (style, abréviations, clarté), ce qui représente la moitié de la facture nécessitant réellement un œil humain.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Les éditeurs facturent $${low}–$${high}/h pour cet audit (~${h}h pour ${s} ${sw}) et il y a une réelle pénurie — les modèles attendent ~${d} jours en file. Résolvez les points d'abord pour négocier le bas de la fourchette.`,
  marketNoteClean: (low, high, h, s, sw, d) => `Un éditeur humain demanderait entre $${low} et $${high} pour les mêmes ${h}h d'arithmétique, à $20–$40/h — et la plupart ajouteraient un supplément par taille. L'audit des chiffres est entièrement automatisable ; leur tort est de facturer des taux horaires pour de l'arithmétique.`,
  findingGa08Title: 'Aucune taille gradée',
  findingGa08Detail: "Chaque mesure a une valeur de base nulle, donc rien n'est gradé. Saisissez d'abord les mesures de la taille de base.",
};

const es: TechEditCopy = {
  ...en,
  title: 'Auto-auditoría técnica',
  description: 'Una revisión de números antes de que un editor humano vea el patrón — los editores cobran 20–40 $/h con una demora de ~10 días. Cada hallazgo resuelto es dinero ahorrado.',
  verdictClean: 'Limpio — la revisión de números fue exitosa',
  verdictCheck: 'Vale la pena revisar',
  verdictFix: 'Corregir antes de publicar',
  severityError: 'Error',
  severityWarning: 'Advertencia',
  severityNote: 'Nota',
  severityPass: 'Aprobado',
  findingsCount: (e, w, n) => `${e} error${e === 1 ? '' : 'es'} · ${w} advertencia${w === 1 ? '' : 's'} · ${n} nota${n === 1 ? '' : 's'}`,
  cleanSweep: 'La revisión de números fue exitosa: validez de la muestra, monotonía de la progresión de tallas, redondeo de puntos/vueltas vs tus repeticiones, conteo de puntos en cada talla, consistencia clave-tipo y valores base contra el estándar corporal.',
  editorBillSaved: 'Factura del editor ahorrada',
  editorRateLabel: 'Tarifa por hora de tu editor',
  perHour: '/h',
  marketQuoteTitle: 'Cotización de mercado para esta revisión',
  marketQuoteDetails: (h, d) => `≈${h}h de tiempo de editor · demora ~${d} días`,
  negotiateHint: (n) => `${n} hallazgo${n === 1 ? '' : 's'} — resolver para negociar el rango bajo`,
  preEditSummaryTitle: 'Resumen pre-edición',
  copyForEditor: 'Copiar para tu editor',
  preEditSummaryHeader: (name) => `RESUMEN PRE-EDICIÓN — ${name}`,
  designerLabel: 'Diseñador',
  baseSizeLabel: 'Talla base',
  gaugeLabel: 'Muestra',
  auditScoreLabel: (s, v) => `Puntuación de auto-auditoría técnica: ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Ya verificado automáticamente (revisión de números):',
  checkedItems: [
    'validez de la muestra',
    'monotonía de la progresión de tallas en todas las tallas gradadas',
    'redondeo de puntos/vueltas vs restricciones de repetición y paridad',
    'plausibilidad del conteo de puntos en cada talla',
    'consistencia entre clave de gradación y tipo (ancho/largo/circunferencia)',
    'valores base vs estándar corporal para la talla base',
    'etiquetas duplicadas, completitud de la muestra de vueltas'
  ],
  outstandingItemsLabel: (n) => `Temas pendientes (${n}):`,
  prosePassLabel: 'Lo que aún necesito de ti (la revisión de texto):',
  prosePassDetails: 'consistencia de estilo/abreviaturas, claridad de instrucciones, ortografía, coherencia con gráficos/esquemas.',
  savingsNote: (p) => `Resuelve los ${p} hallazgo(s) pendiente(s) antes de que un editor humano toque el patrón — cada uno que no tengan que encontrar es tiempo facturable ahorrado.`,
  cleanSavingsNote: 'La revisión de números está limpia — un editor pagado puede ahora enfocarse puramente en el texto (style, abréviations, claridad), que es la mitad de la factura que realmente necesita ojos humanos.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Los editores cobran $${low}–$${high}/h por esta revisión (~${h}h para ${s} ${sw}) y hay una escasez real — los patrones esperan ~${d} días en cola. Resuelve los hallazgos primero para negociar el rango bajo.`,
  marketNoteClean: (low, high, h, s, sw, d) => `Un editor humano cobraría entre $${low} y $${high} por las mismas ${h}h de aritmética, a $20–$40/h — y la mayoría añadiría un recargo por talla. La revisión de números es totalmente automatizable; su error es cobrar tarifas por hora por aritmética.`,
};

const pt: TechEditCopy = {
  ...en,
  title: 'Auto-auditoria técnica',
  description: 'Uma revisão de números antes de um editor humano ver o modelo — os editores cobram 20–40 $/h com uma demora de ~10 dias. Cada problema resolvido é dinheiro poupado.',
  verdictClean: 'Limpo — a revisão de números foi bem-sucedida',
  verdictCheck: 'Vale a pena rever',
  verdictFix: 'Corrigir antes de publicar',
  severityError: 'Erro',
  severityWarning: 'Aviso',
  severityNote: 'Nota',
  severityPass: 'Aprovado',
  findingsCount: (e, w, n) => `${e} erro${e === 1 ? '' : 's'} · ${w} aviso${w === 1 ? '' : 's'} · ${n} nota${n === 1 ? '' : 's'}`,
  cleanSweep: 'A revisão de números foi bem-sucedida: validade da amostra, monotonia da progressão de tamanhos, arredondamento de malhas/voltas vs as suas repetições, contagem de malhas em cada tamanho, consistência chave-tipo e valores base contra o padrão corporal.',
  editorBillSaved: 'Fatura do editor poupada',
  editorRateLabel: 'Tarifa horária do seu editor',
  perHour: '/h',
  marketQuoteTitle: 'Cotação de mercado para esta revisão',
  marketQuoteDetails: (h, d) => `≈${h}h de tempo de editor · demora ~${d} dias`,
  negotiateHint: (n) => `${n} problema${n === 1 ? '' : 's'} — resolver para negociar o valor baixo`,
  preEditSummaryTitle: 'Resumo pré-edição',
  copyForEditor: 'Copiar para o seu editor',
  preEditSummaryHeader: (name) => `RESUMO PRÉ-EDIÇÃO — ${name}`,
  designerLabel: 'Designer',
  baseSizeLabel: 'Tamanho base',
  gaugeLabel: 'Amostra',
  auditScoreLabel: (s, v) => `Pontuação de auto-auditoria técnica: ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Já verificado automaticamente (revisão de números):',
  checkedItems: [
    'validade da amostra',
    'monotonia da progressão de tamanhos em todos os tamanhos gradados',
    'arredondamento de malhas/voltas vs restrições de repetição e paridade',
    'plausibilidade da contagem de malhas em cada tamanho',
    'consistência entre chave de gradação e tipo (largura/comprimento/circunferência)',
    'valores base vs padrão corporal para o tamanho base',
    'etiquetas duplicadas, completude da amostra de voltas'
  ],
  outstandingItemsLabel: (n) => `Itens pendentes (${n}):`,
  prosePassLabel: 'O que ainda preciso de si (a revisão de texto):',
  prosePassDetails: 'consistência de estilo/abreviaturas, clareza das instruções, ortografia, coerência com gráficos/esquemas.',
  savingsNote: (p) => `Resolva o(s) ${p} problema(s) pendente(s) antes de um editor humano tocar no modelo — cada um que não tiverem de encontrar é tempo faturável poupado.`,
  cleanSavingsNote: 'A revisão de números está limpa — um editor pago pode agora focar-se puramente no texto (estilo, abreviaturas, clareza), que é a metade da fatura que realmente precisa de olhos humanos.',
  marketNoteClean: (low, high, h, s, sw, d) => `Um editor humano cobraria entre $${low} e $${high} pelas mesmas ${h}h de aritmética, a $20–$40/h — e a maioria adicionaria uma taxa por tamanho. A revisão de números é totalmente automatizável; o erro deles é cobrar taxas horárias por aritmética.`,
  findingGa08Title: 'Nenhum tamanho graduado',
  findingGa08Detail: 'Cada medida tem um valor base zero, portanto nada é graduado. Insira primeiro as medidas do tamanho base.',
};

export const TECH_EDIT_COPY: Record<LanguageCode, TechEditCopy> = {
  en, de, fr, es, pt
};
