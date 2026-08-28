import type { LanguageCode } from './i18n';

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
  
  // Pattern Composition
  compositionTitle: string;
  compositionDescription: string;
  compositionCompile: string;
  compositionCompiling: string;
  compositionReview: string;
  compositionDraft: string;
  compositionLastCompiled: (date: string) => string;
  compositionNoCompile: string;
  compositionSectionName: string;
  compositionAddSection: string;
  compositionAddStep: string;
  compositionStepPlaceholder: string;
  compositionSectionPlaceholder: string;
  compositionAbbreviations: string;
  compositionGlossary: string;
  compositionConstruction: string;
  compositionFinishing: string;
  compositionCare: string;
  compositionTermPlaceholder: string;
  compositionDefPlaceholder: string;
  compositionAddAbbreviation: string;
  compositionAddTerm: string;
  compositionSectionOrder: string;
  compositionDeleteSection: string;
  compositionDeleteStep: string;
  compositionDeleteTerm: string;
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
  
  compositionTitle: 'Pattern Composition',
  compositionDescription: 'Assemble the written instructions, abbreviations, and finishing notes for the final publication.',
  compositionCompile: 'Compile Pattern',
  compositionCompiling: 'Compiling...',
  compositionReview: 'Ready for Review',
  compositionDraft: 'Draft',
  compositionLastCompiled: (d) => `Last compiled: ${d}`,
  compositionNoCompile: 'Not compiled yet',
  compositionSectionName: 'Section Name',
  compositionAddSection: 'Add Section',
  compositionAddStep: 'Add Step',
  compositionStepPlaceholder: 'Write instruction step...',
  compositionSectionPlaceholder: 'e.g. Back, Left Sleeve...',
  compositionAbbreviations: 'Abbreviations',
  compositionGlossary: 'Glossary',
  compositionConstruction: 'Construction Sequence',
  compositionFinishing: 'Finishing',
  compositionCare: 'Care Notes',
  compositionTermPlaceholder: 'Term',
  compositionDefPlaceholder: 'Definition',
  compositionAddAbbreviation: 'Add Abbreviation',
  compositionAddTerm: 'Add Term',
  compositionSectionOrder: 'Section Order',
  compositionDeleteSection: 'Delete Section',
  compositionDeleteStep: 'Delete Step',
  compositionDeleteTerm: 'Delete Term',
};

const de: TechEditCopy = {
  ...en,
  title: 'Selbstprüfung für technische Redaktion',
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
  auditScoreLabel: (s, v) => `Ergebnis deiner Tech-Edit-Prüfung: ${s}/100 (${v.toUpperCase()})`,
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

  findingGa01Title: 'Maschenprobe nicht festgelegt — alle Zahlen unten sind unzuverlässig',
  findingGa01Detail: 'Lege Maschen/Reihen pro 10 cm in der Projekt-Maschenprobe fest. Ein Tech-Editor kann die Mathematik ohne diese Angaben nicht überprüfen, und ein Tester auch nicht. Dies ist der erste Punkt auf jeder Tech-Edit-Checkliste.',
  findingGa02Title: 'Basismessung ist negativ',
  findingGa02Detail: (v) => `Der Basiswert ${v} ist negativ. Messungen müssen positiv sein — eine negative Breite oder Länge kann nicht gestrickt werden.`,
  findingGa02bTitle: 'Basismessung ist Null — von der Gradierung ausgeschlossen',
  findingGa02bDetail: 'Ein Basiswert von Null schließt diese Messung von allen gradierten Größen aus. Wenn dies beabsichtigt ist (z. B. ein dekoratives Panel), ist das in Ordnung; wenn nicht, gib den Wert für die Basisgröße ein.',
  findingGa03Title: 'Größenprogression ist nicht monoton',
  findingGa03Detail: (s, v, u) => `Die physischen Werte über ${s} sind: ${v} ${u}. Kleidungsstückmaße sollten mit der Größe wachsen (oder gleich bleiben) — prüfe, ob der Gradierungsschlüssel oder Typ dieser Messung korrekt ist.`,
  findingGa04Title: (p, s) => `Maschenzahl um ${p}% vom Rohziel abgewichen (${s})`,
  findingGa04Detail: (r, raw) => `Gerundet auf ${r} Maschen gegenüber ${raw} roh. Die Rapport-/Paritätsvorgabe des Maschenmusters zwingt die Zahl vom Zielmaß weg — prüfe die fertige Passform in dieser Größe.`,
  findingGa04bTitle: (p, s) => `Reihenzahl um ${p}% vom Rohziel abgewichen (${s})`,
  findingGa04bDetail: (r, raw) => `Gerundet auf ${r} Reihen gegenüber ${raw} roh. Die Längentoleranz ist meist großzügig, aber markiere es, wenn das Maß kritisch ist (z. B. Armlochtiefe).`,
  findingGa05Title: (r) => `Maschenrapport von ${r} ist wirkungslos`,
  findingGa05Detail: (r) => `Ein Rapport von ${r} rundet auf die nächste ganze Zahl, als gäbe es gar keinen Rapport. Lege das tatsächliche Vielfache des Maschenmusters fest (z. B. 6 für ein 6-Maschen-Zopfpanel) oder lösche es.`,
  findingGa05bTitle: 'Maschenrest ist ungültig für den Rapport',
  findingGa05bDetail: (rem, rep) => `Der Rest ${rem} liegt außerhalb des gültigen Bereichs 0…${rep - 1} für einen Rapport von ${rep}. Gültige Zahlen wären …${rep + rem}, ${2 * rep + rem}, …`,
  findingGa05cTitle: 'Sowohl Parität als auch Rapport festgelegt — Parität gewinnt',
  findingGa05cDetail: 'Wenn beides festgelegt ist, hat die Paritätsrundung Vorrang. Behalte die Vorgabe bei, die diese Messung tatsächlich steuert.',
  findingGa06Title: (s) => `Maschenzahl Null/negativ bei Größe ${s}`,
  findingGa06Detail: (c) => `Die gerundete Maschenzahl ist ${c}. Eine so kleine Zahl bedeutet normalerweise, dass der Basiswert, die Maschenprobe oder der Gradierungsschlüssel für diese Messung falsch ist.`,
  findingGa07Title: 'Längenschlüssel als Breite gradiert',
  findingGa07Detail: (l, k) => `${l} verwendet den ${k}-Schlüssel (eine Länge) mit dem Typ "Breite", was den Wert beim Gradieren halbiert. Wenn diese Messung eine Länge sein soll, setze ihren Typ auf "Länge" oder "Direkt".`,
  findingGa08Title: 'Keine Größen gradiert',
  findingGa08Detail: 'Jede Messung hat einen Basiswert von Null, daher wird nichts gradiert. Gib zuerst die Maße der Basisgröße ein.',
  findingGa08bTitle: 'Ein-Größen-Muster',
  findingGa08bDetail: 'Nur eine Größe ist gradiert. Ein-Größen-Muster sind eine häufige Käuferbeschwerde ("warum gibt es das nicht in mehr Größen?") — Multi-Größen-Muster verkaufen sich auf Ravelry und Etsy konsistent besser. Erwäge, mindestens 3 Größen zu gradieren, bevor du veröffentlichst.',
  findingGa09Title: (p, std, s) => `Basiswert ${p}% unter dem ${std} ${s} Standard`,
  findingGa09Detail: (v, u, std, s, t) => `Du hast ${v}${u} für diese Messung eingegeben, aber der ${std} Standard-Körperwert für Größe ${s} ist ${t}${u}. Ein Kleidungsstück kann nicht kleiner sein als der Körper, den es bedeckt — prüfe, ob dies ein Umfang-Gradierungsschlüssel sein sollte oder ob der Basiswert zu einer anderen Größe gehört.`,
  findingGa09bTitle: (std, s) => `Basiswert mehr als doppelt so hoch wie der ${std} ${s} Standard`,
  findingGa09bDetail: (v, u, t) => `Du hast ${v}${u} gegenüber einem Körperwert von ${t}${u} eingegeben. Bequemlichkeitszugabe erklärt Abweichungen, aber keine Verdoppelung — dies bedeutet normalerweise, dass ein Umfang eingegeben wurde, wo eine halbe Breite hingehört (oder umgekehrt).`,
  findingGa10Title: (l) => `Doppeltes Messlabel "${l}"`,
  findingGa10Detail: (n, s) => `Dieses Label erscheint ${n} Mal in "${s}". Zwei Messungen mit demselben Namen verwirren sowohl Teststricker als auch Tech-Editoren — gib jeder einen eindeutigen Namen (z. B. "Brust (vorne)" / "Brust (hinten)").`,
  findingGa11Title: 'Reihenrundung verwendet, aber Reihenprobe ist nicht festgelegt',
  findingGa11Detail: 'Mindestens eine Messung rundet ihre Reihenzahl, aber Reihen/10 cm ist nicht festgelegt. Reihenzahlen werden mit einer Maschenprobe von Null berechnet — jede Länge im Muster ist stillschweigend falsch. Gib die Reihenprobe vor der Veröffentlichung ein.',
  findingGa12Title: 'Muster hat einen einzigen Abschnitt',
  findingGa12Detail: 'Die meisten Kleidungsstücke haben mindestens einen Körper und Ärmel. Wenn dieses Muster wirklich aus einem Teil besteht (Schal, Loop), ignoriere dies; andernfalls füge Abschnitte vor der Veröffentlichungsprüfung hinzu.',
  
  compositionTitle: 'Muster-Zusammenstellung',
  compositionDescription: 'Stelle die schriftlichen Anweisungen, Abkürzungen und Abschlussnotizen für die finale Veröffentlichung zusammen.',
  compositionCompile: 'Muster kompilieren',
  compositionCompiling: 'Kompiliere...',
  compositionReview: 'Bereit zur Prüfung',
  compositionDraft: 'Entwurf',
  compositionLastCompiled: (d) => `Zuletzt kompiliert: ${d}`,
  compositionNoCompile: 'Noch nicht kompiliert',
  compositionSectionName: 'Abschnittsname',
  compositionAddSection: 'Abschnitt hinzufügen',
  compositionAddStep: 'Schritt hinzufügen',
  compositionStepPlaceholder: 'Anweisungsschritt schreiben...',
  compositionSectionPlaceholder: 'z. B. Rückenteil, Linker Ärmel...',
  compositionAbbreviations: 'Abkürzungen',
  compositionGlossary: 'Glossar',
  compositionConstruction: 'Konstruktionsreihenfolge',
  compositionFinishing: 'Fertigstellung',
  compositionCare: 'Pflegehinweise',
  compositionTermPlaceholder: 'Begriff',
  compositionDefPlaceholder: 'Definition',
  compositionAddAbbreviation: 'Abkürzung hinzufügen',
  compositionAddTerm: 'Begriff hinzufügen',
  compositionSectionOrder: 'Abschnittsreihenfolge',
  compositionDeleteSection: 'Abschnitt löschen',
  compositionDeleteStep: 'Schritt löschen',
  compositionDeleteTerm: 'Begriff löschen',
};

const fr: TechEditCopy = {
  ...en,
  title: 'Audit d’auto-révision technique',
  description: 'Une première passe sur les chiffres avant qu\'un éditeur humain ne voie le patron — les éditeurs facturent 20–40 $/h avec un délai d\'environ 10 jours, donc chaque anomalie résolue est du temps facturable économisé.',
  verdictClean: 'Conforme — le balayage des chiffres est réussi',
  verdictCheck: 'À vérifier',
  verdictFix: 'Corriger avant publication',
  severityError: 'Erreur',
  severityWarning: 'Avertissement',
  severityNote: 'Note',
  severityPass: 'Réussite',
  findingsCount: (e, w, n) => `${e} erreur${e === 1 ? '' : 's'} · ${w} avertissement${w === 1 ? '' : 's'} · ${n} note${n === 1 ? '' : 's'}`,
  cleanSweep: 'Le balayage des chiffres est réussi : validité de l\'échantillon, monotonie de la progression des tailles, arrondi mailles/rangs vs répétitions, nombre de mailles dans chaque taille, cohérence clé vs type, et valeurs de base par rapport au standard corporel, tout est correct.',
  editorBillSaved: 'Facture d\'éditeur économisée',
  editorRateLabel: 'Taux horaire de votre éditeur',
  perHour: '/h',
  marketQuoteTitle: 'Devis du marché pour ce balayage',
  marketQuoteDetails: (h, d) => `≈${h}h de temps d\'éditeur · délai de ~${d} jours`,
  negotiateHint: (n) => `${n} anomalie(s) — résolvez-les pour négocier le bas de la fourchette`,
  preEditSummaryTitle: 'Résumé pré-édition',
  copyForEditor: 'Copier pour votre éditeur',
  preEditSummaryHeader: (name) => `RÉSUMÉ PRÉ-ÉDITION — ${name}`,
  designerLabel: 'Designer',
  baseSizeLabel: 'Taille de base',
  gaugeLabel: 'Échantillon',
  auditScoreLabel: (s, v) => `Score de l'auto-audit technique : ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Déjà vérifié automatiquement (balayage des chiffres) :',
  checkedItems: [
    'validité de l\'échantillon',
    'monotonie de la progression des tailles sur toutes les tailles gradées',
    'arrondi mailles/rangs vs répétitions et contraintes de parité',
    'plausibilité du nombre de mailles dans chaque taille',
    'cohérence clé de mesure vs type (largeur/longueur/circonférence)',
    'valeurs de base vs standard corporel pour la taille de base',
    'étiquettes en double, complétude de l\'échantillon de rangs'
  ],
  outstandingItemsLabel: (n) => `Éléments en suspens (${n}) :`,
  prosePassLabel: 'Ce dont j\'ai encore besoin de votre part (la passe textuelle) :',
  prosePassDetails: 'cohérence style/abréviations, clarté des instructions, orthographe, cohérence avec les diagrammes/schémas.',
  savingsNote: (p) => `Résolvez les ${p} anomalie(s) en suspens ci-dessus avant qu\'un éditeur humain ne touche au patron — chaque point qu\'il n\'a pas à trouver est du temps facturable économisé.`,
  cleanSavingsNote: 'Le balayage des chiffres est conforme — un éditeur rémunéré peut désormais se concentrer uniquement sur la passe textuelle (style, abréviations, clarté), qui est la moitié de la facture nécessitant réellement un œil humain.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Les éditeurs facturent ${low}–${high} $/h pour ce balayage (~${h}h pour ${s} ${sw}) et documentent une réelle pénurie — les patrons attendent ~${d} jours en file d\'attente. Résolvez d\'abord les anomalies pour justifier la négociation du bas de la fourchette.`,
  marketNoteClean: (low, high, h, s, sw, d) => `Un éditeur humain demanderait ${low}–${high} $ pour les mêmes ${h}h d\'arithmétique, à 20–40 $/h — et la plupart ajouteraient un supplément par taille. Le balayage des chiffres est entièrement automatisable ; leur défaut est de facturer des taux horaires pour de l\'arithmétique.`,

  findingGa01Title: 'Échantillon non défini — tous les chiffres ci-dessous sont peu fiables',
  findingGa01Detail: 'Définissez les mailles/rangs pour 10 cm dans l\'échantillon du projet. Un éditeur technique ne peut pas vérifier les calculs sans cela, et un testeur non plus. C\'est le premier point de toute liste de contrôle pré-édition technique.',
  findingGa02Title: 'La mesure de base est négative',
  findingGa02Detail: (v) => `La valeur de base ${v} est négative. Les mesures doivent être positives — une largeur ou une longueur négative ne peut pas être tricotée.`,
  findingGa02bTitle: 'La mesure de base est nulle — exclue de la gradation',
  findingGa02bDetail: 'Une valeur de base nulle exclut cette mesure de toutes les tailles gradées. Si c\'est intentionnel (ex: un panneau décoratif), c\'est parfait ; sinon, entrez la valeur de la taille de base.',
  findingGa03Title: 'La progression des tailles n\'est pas monotone',
  findingGa03Detail: (s, v, u) => `Les valeurs physiques pour ${s} sont : ${v} ${u}. Les dimensions du vêtement doivent croître (ou rester stables) avec la taille — vérifiez si la clé de gradation ou le type de cette mesure est correct.`,
  findingGa04Title: (p, s) => `Nombre de mailles décalé de ${p}% par rapport à la cible (${s})`,
  findingGa04Detail: (r, raw) => `Arrondi à ${r} mailles vs ${raw} brut. La contrainte de répétition/parité du point force le compte à s\'éloigner de la mesure cible — vérifiez le bien-aller final sur cette taille.`,
  findingGa04bTitle: (p, s) => `Nombre de rangs décalé de ${p}% par rapport à la cible (${s})`,
  findingGa04bDetail: (r, raw) => `Arrondi à ${r} rangs vs ${raw} brut. La tolérance en longueur est généralement souple, mais signalez-le si la mesure est critique (ex: profondeur d'emmanchure).`,
  findingGa05Title: (r) => `Une répétition de mailles de ${r} n'a aucun effet`,
  findingGa05Detail: (r) => `Une répétition de ${r} arrondit à l'entier le plus proche comme s'il n'y avait aucune répétition. Définissez le multiple réel du point (ex: 6 pour une torsade de 6 mailles) ou effacez-le.`,
  findingGa05bTitle: 'Le reste des mailles est invalide pour la répétition',
  findingGa05bDetail: (rem, rep) => `Le reste ${rem} est en dehors de la plage valide 0…${rep - 1} pour une répétition de ${rep}. Les comptes valides seraient …${rep + rem}, ${2 * rep + rem}, …`,
  findingGa05cTitle: 'Parité et répétition définies — la parité l\'emporte',
  findingGa05cDetail: 'Quand les deux sont définis, l\'arrondi par parité est prioritaire. Gardez la contrainte qui régit réellement cette mesure.',
  findingGa06Title: (s) => `Nombre de mailles nul/négatif à la taille ${s}`,
  findingGa06Detail: (c) => `Le nombre de mailles arrondi est ${c}. Un compte aussi petit signifie généralement que la valeur de base, l'échantillon ou la clé de gradation est erroné pour cette mesure.`,
  findingGa07Title: 'Clé de longueur gradée comme une largeur',
  findingGa07Detail: (l, k) => `${l} utilise la clé ${k} (une longueur) avec le type "largeur", ce qui divise la valeur par deux lors de la gradation. Si cette mesure doit être une longueur, réglez son type sur "longueur" ou "direct".`,
  findingGa08Title: 'Aucune taille gradée',
  findingGa08Detail: 'Chaque mesure a une valeur de base nulle, donc rien n\'est gradé. Entrez d\'abord les mesures de la taille de base.',
  findingGa08bTitle: 'Patron taille unique',
  findingGa08bDetail: 'Seule une taille est gradée. Les patrons taille unique sont une source fréquente de plaintes des acheteurs ("pourquoi n\'est-ce pas disponible en plus de tailles ?") — les patrons multi-tailles se vendent systématiquement mieux sur Ravelry et Etsy. Envisagez de grader au moins 3 tailles avant de publier.',
  findingGa09Title: (p, std, s) => `Valeur de base ${p}% en dessous du standard ${std} ${s}`,
  findingGa09Detail: (v, u, std, s, t) => `Vous avez entré ${v}${u} pour cette mesure, mais la valeur corporelle standard ${std} pour la taille ${s} est ${t}${u}. Un vêtement ne peut pas être plus petit que le corps qu\'il couvre — vérifiez s\'il s\'agit d\'une clé de gradation de circonférence, ou si la valeur de base appartient à une taille différente.`,
  findingGa09bTitle: (std, s) => `Valeur de base plus du double du standard ${std} ${s}`,
  findingGa09bDetail: (v, u, t) => `Vous avez entré ${v}${u} vs une valeur corporelle de ${t}${u}. L\'aisance explique l\'écart, mais pas un doublement — cela signifie généralement qu\'une circonférence a été entrée là où une demi-largeur devrait être (ou vice versa).`,
  findingGa10Title: (l) => `Étiquette de mesure en double "${l}"`,
  findingGa10Detail: (n, s) => `Cette étiquette apparaît ${n} fois dans "${s}". Deux mesures portant le même nom déroutent à la fois les testeurs et les éditeurs techniques — donnez à chacune un nom distinct (ex: "Buste (devant)" / "Bust (dos)").`,
  findingGa11Title: 'Arrondi des rangs utilisé mais l\'échantillon de rangs n\'est pas défini',
  findingGa11Detail: 'Au moins une mesure arrondit son nombre de rangs, mais rangs/10 cm n\'est pas défini. Le nombre de rangs sera calculé avec un échantillon nul — chaque longueur dans le patron est silencieusement fausse. Entrez l\'échantillon de rangs avant de publier.',
  findingGa12Title: 'Le patron comporte une seule section',
  findingGa12Detail: 'La plupart des vêtements ont au moins un corps et des manches. Si ce patron est réellement d\'une seule pièce (écharpe, col), ignorez ceci ; sinon ajoutez des sections avant la vérification de publication.',
  
  compositionTitle: 'Composition du patron',
  compositionDescription: 'Assemblez les instructions écrites, les abréviations et les notes de finition pour la publication finale.',
  compositionCompile: 'Compiler le patron',
  compositionCompiling: 'Compilation...',
  compositionReview: 'Prêt pour révision',
  compositionDraft: 'Brouillon',
  compositionLastCompiled: (d) => `Dernière compilation : ${d}`,
  compositionNoCompile: 'Pas encore compilé',
  compositionSectionName: 'Nom de la section',
  compositionAddSection: 'Ajouter une section',
  compositionAddStep: 'Ajouter une étape',
  compositionStepPlaceholder: 'Écrire l\'étape d\'instruction...',
  compositionSectionPlaceholder: 'ex: Dos, Manche gauche...',
  compositionAbbreviations: 'Abréviations',
  compositionGlossary: 'Glossaire',
  compositionConstruction: 'Séquence de construction',
  compositionFinishing: 'Finitions',
  compositionCare: 'Conseils d\'entretien',
  compositionTermPlaceholder: 'Terme',
  compositionDefPlaceholder: 'Définition',
  compositionAddAbbreviation: 'Ajouter une abréviation',
  compositionAddTerm: 'Ajouter un terme',
  compositionSectionOrder: 'Ordre des sections',
  compositionDeleteSection: 'Supprimer la section',
  compositionDeleteStep: 'Supprimer l\'étape',
  compositionDeleteTerm: 'Supprimer le terme',
};

const es: TechEditCopy = {
  ...en,
  title: 'Auditoría de autoedición técnica',
  description: 'Una primera pasada por los números antes de que un editor humano vea el patrón — los editores facturan 20–40 $/h con una demora de ~10 días, por lo que cada hallazgo que resuelvas es tiempo facturable ahorrado.',
  verdictClean: 'Limpio — el barrido de números ha pasado',
  verdictCheck: 'Vale la pena echar un vistazo',
  verdictFix: 'Corregir antes de publicar',
  severityError: 'Error',
  severityWarning: 'Advertencia',
  severityNote: 'Nota',
  severityPass: 'Correcto',
  findingsCount: (e, w, n) => `${e} error${e === 1 ? '' : 'es'} · ${w} advertencia${w === 1 ? '' : 's'} · ${n} nota${n === 1 ? '' : 's'}`,
  cleanSweep: 'El barrido de números ha pasado limpio: validez de la muestra, monotonía de la progresión de tallas, redondeo de puntos/vueltas vs. repeticiones, recuento de puntos en cada talla, consistencia de clave vs. tipo y valores base frente al estándar corporal, todo comprobado.',
  editorBillSaved: 'Factura de editor ahorrada',
  editorRateLabel: 'Tarifa por hora de tu editor',
  perHour: '/h',
  marketQuoteTitle: 'Cotización de mercado para este barrido',
  marketQuoteDetails: (h, d) => `≈${h}h de tiempo de editor · demora de ~${d} días`,
  negotiateHint: (n) => `${n} hallazgo(s) — resuélvelos para negociar el extremo inferior`,
  preEditSummaryTitle: 'Resumen pre-edición',
  copyForEditor: 'Copiar para tu editor',
  preEditSummaryHeader: (name) => `RESUMEN PRE-EDICIÓN — ${name}`,
  designerLabel: 'Diseñador',
  baseSizeLabel: 'Talla base',
  gaugeLabel: 'Muestra',
  auditScoreLabel: (s, v) => `Puntuación de la autoauditoría técnica: ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Ya comprobado automáticamente (barrido de números):',
  checkedItems: [
    'validez de la muestra',
    'monotonía de la progresión de tallas en todas las tallas graduadas',
    'redondeo de puntos/vueltas vs. repeticiones y restricciones de paridad',
    'plausibilidad del recuento de puntos en cada talla',
    'consistencia clave de medida vs. tipo (ancho/largo/circunferencia)',
    'valores base vs. estándar corporal para la talla base',
    'etiquetas duplicadas, integridad de la muestra de vueltas'
  ],
  outstandingItemsLabel: (n) => `Elementos pendientes (${n}):`,
  prosePassLabel: 'Lo que todavía necesito de ti (la pasada de texto):',
  prosePassDetails: 'consistencia de estilo/abreviaturas, claridad de las instrucciones, ortografía, cohesión con gráficos/esquemas.',
  savingsNote: (p) => `Resuelve los ${p} hallazgo(s) pendiente(s) anteriores antes de que un editor humano toque el patrón — cada punto que no tengan que encontrar es tiempo facturable ahorrado.`,
  cleanSavingsNote: 'El barrido de números es limpio — un editor pagado puede ahora centrarse puramente en la pasada de texto (estilo, abreviaturas, claridad), que es la mitad de la factura que realmente necesita ojos humanos.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Los editores cobran ${low}–${high} $/h por este barrido (~${h}h para ${s} ${sw}) y documentan una escasez real — los patrones esperan ~${d} días en cola. Resuelve primero los hallazgos para justificar la negociación del extremo inferior.`,
  marketNoteClean: (low, high, h, s, sw, d) => `Un editor humano pediría ${low}–${high} $ por las mismas ${h}h de aritmética, a 20–40 $/h — y la mayoría añadiría un recargo por talla. El barrido de números es totalmente automatizable; su fallo es cobrar tarifas por hora por aritmética.`,

  findingGa01Title: 'Muestra no establecida — todos los números a continuación no son fiables',
  findingGa01Detail: 'Establece los puntos/vueltas por 10 cm en la muestra del proyecto. Un editor técnico no puede verificar los cálculos sin esto, y un probador tampoco. Esto es lo primero en cualquier lista de comprobación pre-edición técnica.',
  findingGa02Title: 'La medida base es negativa',
  findingGa02Detail: (v) => `El valor base ${v} es negativo. Las medidas deben ser positivas — un ancho o largo negativo no se puede tejer.`,
  findingGa02bTitle: 'La medida base es cero — excluida de la graduación',
  findingGa02bDetail: 'Un valor base cero excluye esta medida de todas las tallas graduadas. Si esto es intencionado (p. ej. un panel decorativo), está bien; si no, introduce el valor de la talla base.',
  findingGa03Title: 'La progresión de tallas no es monótona',
  findingGa03Detail: (s, v, u) => `Los valores físicos en ${s} son: ${v} ${u}. Las dimensiones de la prenda deben crecer (o mantenerse estables) con la talla — comprueba si la clave de graduación o el tipo de esta medida es correcto.`,
  findingGa04Title: (p, s) => `Recuento de puntos desviado un ${p}% del objetivo bruto (${s})`,
  findingGa04Detail: (r, raw) => `Redondeado a ${r} puntos frente a los ${raw} brutos. La restricción de repetición/paridad del punto está forzando el recuento fuera de la medida objetivo — comprueba el ajuste final en esta talla.`,
  findingGa04bTitle: (p, s) => `Recuento de vueltas desviado un ${p}% del objetivo bruto (${s})`,
  findingGa04bDetail: (r, raw) => `Redondeado a ${r} vueltas frente a las ${raw} brutas. La tolerancia en el largo suele ser flexible, pero márcalo si la medida es crítica (p. ej. profundidad de la sisa).`,
  findingGa05Title: (r) => `Una repetición de puntos de ${r} no tiene efecto`,
  findingGa05Detail: (r) => `Una repetición de ${r} redondea al entero más cercano como si no hubiera repetición. Establece el múltiplo real del patrón de puntos (p. ej. 6 para un panel de trenzas de 6 puntos) o bórralo.`,
  findingGa05bTitle: 'El resto de puntos no es válido para la repetición',
  findingGa05bDetail: (rem, rep) => `El resto ${rem} está fuera del intervalo válido 0…${rep - 1} para una repetición de ${rep}. Los recuentos válidos serían …${rep + rem}, ${2 * rep + rem}, …`,
  findingGa05cTitle: 'Tanto paridad como repetición establecidas — la paridad gana',
  findingGa05cDetail: 'Cuando se establecen ambas, el redondeo por paridad tiene prioridad. Mantén la restricción que realmente rige esta medida.',
  findingGa06Title: (s) => `Recuento de puntos cero/negativo en la talla ${s}`,
  findingGa06Detail: (c) => `El recuento de puntos redondeado es ${c}. Un recuento tan pequeño suele significar que el valor base, la muestra o la clave de graduación son erróneos para esta medida.`,
  findingGa07Title: 'Clave de largo graduada como un ancho',
  findingGa07Detail: (l, k) => `${l} usa la clave ${k} (un largo) con tipo "ancho", lo que reduce el valor a la mitad al graduar. Si esta medida debe ser un largo, establece su tipo como "largo" o "directo".`,
  findingGa08Title: 'No hay tallas graduadas',
  findingGa08Detail: 'Cada medida tiene un valor base cero, por lo que nada se gradúa. Introduce primero las medidas de la talla base.',
  findingGa08bTitle: 'Patrón de talla única',
  findingGa08bDetail: 'Solo se gradúa una talla. Los patrones de talla única son una queja común de los compradores ("¿por qué no está en más tallas?") — los patrones multitalle se venden sistemáticamente mejor en Ravelry y Etsy. Considera graduar al menos 3 tallas antes de publicar.',
  findingGa09Title: (p, std, s) => `Valor base ${p}% por debajo del estándar ${std} ${s}`,
  findingGa09Detail: (v, u, std, s, t) => `Has introducido ${v}${u} para esta medida, pero el valor corporal estándar ${std} para la talla ${s} es ${t}${u}. Una prenda no puede ser más pequeña que el cuerpo que cubre — comprueba si debería ser una clave de graduación de circunferencia, o si el valor base pertenece a una talla diferente.`,
  findingGa09bTitle: (std, s) => `Valor base más del doble del estándar ${std} ${s}`,
  findingGa09bDetail: (v, u, t) => `Has introducido ${v}${u} frente a un valor corporal de ${t}${u}. La holgura explica el desvío, pero no una duplicación — esto suele significar que se ha introducido una circunferencia donde pertenece una media anchura (o viceversa).`,
  findingGa10Title: (l) => `Etiqueta de medida duplicada "${l}"`,
  findingGa10Detail: (n, s) => `Esta etiqueta aparece ${n} veces en "${s}". Dos medidas con el mismo nombre confunden tanto a los tejedores de prueba como a los editores técnicos — da a cada una un nombre distinto (p. ej. "Busto (delante)" / "Busto (detrás)").`,
  findingGa11Title: 'Redondeo de vueltas usado pero la muestra de vueltas no está establecida',
  findingGa11Detail: 'Al menos una medida redondea su recuento de vueltas, pero vueltas/10 cm no está establecida. Los recuentos de vueltas se calcularán con una muestra de cero — cada largo en el patrón estará silenciosamente mal. Introduce la muestra de vueltas antes de publicar.',
  findingGa12Title: 'El patrón tiene una sola sección',
  findingGa12Detail: 'La mayoría de las prendas tienen al menos un cuerpo y mangas. Si este patrón es realmente de una sola pieza (bufanda, cuello), ignora esto; de lo contrario añade secciones antes de la comprobación de publicación.',
  
  compositionTitle: 'Composición del patrón',
  compositionDescription: 'Reúne las instrucciones escritas, las abreviaturas y las notas de acabado para la publicación final.',
  compositionCompile: 'Compilar patrón',
  compositionCompiling: 'Compilando...',
  compositionReview: 'Listo para revisión',
  compositionDraft: 'Borrador',
  compositionLastCompiled: (d) => `Última compilación: ${d}`,
  compositionNoCompile: 'Aún no compilado',
  compositionSectionName: 'Nombre de la sección',
  compositionAddSection: 'Añadir sección',
  compositionAddStep: 'Añadir paso',
  compositionStepPlaceholder: 'Escribir paso de instrucción...',
  compositionSectionPlaceholder: 'p. ej. Espalda, Manga izquierda...',
  compositionAbbreviations: 'Abreviaturas',
  compositionGlossary: 'Glosario',
  compositionConstruction: 'Secuencia de construcción',
  compositionFinishing: 'Acabado',
  compositionCare: 'Notas de cuidado',
  compositionTermPlaceholder: 'Término',
  compositionDefPlaceholder: 'Definición',
  compositionAddAbbreviation: 'Añadir abreviatura',
  compositionAddTerm: 'Añadir término',
  compositionSectionOrder: 'Orden de secciones',
  compositionDeleteSection: 'Eliminar sección',
  compositionDeleteStep: 'Eliminar paso',
  compositionDeleteTerm: 'Eliminar término',
};

const pt: TechEditCopy = {
  ...en,
  title: 'Auditoria de autoedição técnica',
  description: 'Uma primeira passagem pelos números antes de um editor humano ver o modelo — os editores faturam 20–40 $/h com um atraso de ~10 dias, pelo que cada descoberta que resolva é tempo faturável economizado.',
  verdictClean: 'Limpo — a verificação de números passou',
  verdictCheck: 'Vale a pena dar uma vista de olhos',
  verdictFix: 'Corrigir antes de publicar',
  severityError: 'Erro',
  severityWarning: 'Aviso',
  severityNote: 'Nota',
  severityPass: 'Correto',
  findingsCount: (e, w, n) => `${e} erro${e === 1 ? '' : 's'} · ${w} aviso${w === 1 ? '' : 's'} · ${n} nota${n === 1 ? '' : 's'}`,
  cleanSweep: 'A verificação de números passou limpa: validade da amostra, monotonia da progressão de tamanhos, arredondamento de malhas/voltas vs. repetições, contagem de malhas em cada tamanho, consistência de chave vs. tipo e valores base face ao padrão corporal, tudo verificado.',
  editorBillSaved: 'Fatura de editor poupada',
  editorRateLabel: 'Tarifa horária do seu editor',
  perHour: '/h',
  marketQuoteTitle: 'Cotação de mercado para esta verificação',
  marketQuoteDetails: (h, d) => `≈${h}h de tempo de editor · atraso de ~${d} dias`,
  negotiateHint: (n) => `${n} descoberta(s) — resolva-as para negociar o limite inferior`,
  preEditSummaryTitle: 'Resumo pré-edição',
  copyForEditor: 'Copiar para o seu editor',
  preEditSummaryHeader: (name) => `RESUMO PRÉ-EDIÇÃO — ${name}`,
  designerLabel: 'Designer',
  baseSizeLabel: 'Tamanho base',
  gaugeLabel: 'Amostra',
  auditScoreLabel: (s, v) => `Pontuação da autoauditoria técnica: ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Já verificado automaticamente (verificação de números):',
  checkedItems: [
    'validade da amostra',
    'monotonia da progressão de tamanhos em todos os tamanhos graduados',
    'arredondamento de malhas/voltas vs. repetições e restrições de paridade',
    'plausibilidade da contagem de malhas em cada tamanho',
    'consistência chave de medida vs. tipo (largura/comprimento/circunferência)',
    'valores base vs. padrão corporal para o tamanho base',
    'etiquetas duplicadas, integridade da amostra de voltas'
  ],
  outstandingItemsLabel: (n) => `Itens pendentes (${n}):`,
  prosePassLabel: 'O que ainda preciso de si (a passagem de texto):',
  prosePassDetails: 'consistência de estilo/abreviaturas, clareza das instruções, ortografia, coesão com gráficos/esquemas.',
  savingsNote: (p) => `Resolva a(s) ${p} descoberta(s) pendente(s) acima antes de um editor humano tocar no modelo — cada ponto que não tenham de encontrar é tempo faturável economizado.`,
  cleanSavingsNote: 'A verificação de números está limpa — um editor pago pode agora concentrar-se puramente na passagem de texto (estilo, abreviaturas, clareza), que é a metade da fatura que realmente precisa de olhos humanos.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Os editores cobram ${low}–${high} $/h por esta verificação (~${h}h para ${s} ${sw}) e documentam uma escassez real — os modelos esperam ~${d} dias em fila. Resolva primeiro as descobertas para justificar a negociação do limite inferior.`,
  marketNoteClean: (low, high, h, s, sw, d) => `Um editor humano pediria ${low}–${high} $ pelas mesmas ${h}h de aritmética, a 20–40 $/h — e a maioria adicionaria um suplemento por tamanho. A verificação de números é totalmente automatizável; a sua falha é cobrar tarifas horárias por aritmética.`,

  findingGa01Title: 'Amostra não definida — todos os números abaixo não são fiáveis',
  findingGa01Detail: 'Defina as malhas/voltas por 10 cm na amostra do projeto. Um editor técnico não pode verificar os cálculos sem isto, e um testador também não. Isto é o primeiro item em qualquer lista de verificação pré-edição técnica.',
  findingGa02Title: 'A medida base é negativa',
  findingGa02Detail: (v) => `O valor base ${v} é negativo. As medidas devem ser positivas — uma largura ou comprimento negativo não pode ser tricotado.`,
  findingGa02bTitle: 'A medida base é zero — excluída da graduação',
  findingGa02bDetail: 'Um valor base zero exclui esta medida de todos os tamanhos graduados. Se isto for intencional (ex. um painel decorativo), está bem; caso contrário, introduza o valor do tamanho base.',
  findingGa03Title: 'A progressão de tamanhos não é monótona',
  findingGa03Detail: (s, v, u) => `Os valores físicos em ${s} são: ${v} ${u}. As dimensões da peça devem crescer (ou manter-se estáveis) com o tamanho — verifique se a chave de graduação ou o tipo desta medida está correto.`,
  findingGa04Title: (p, s) => `Contagem de malhas desviada ${p}% do objetivo bruto (${s})`,
  findingGa04Detail: (r, raw) => `Arredondado para ${r} malhas face aos ${raw} brutos. A restrição de repetição/paridade do ponto está a forçar a contagem para fora da medida pretendida — verifique o ajuste final neste tamanho.`,
  findingGa04bTitle: (p, s) => `Contagem de voltas desviada ${p}% do objetivo bruto (${s})`,
  findingGa04bDetail: (r, raw) => `Arredondado para ${r} voltas face às ${raw} brutas. A tolerância no comprimento costuma ser flexível, mas avise se a medida for crítica (ex. profundidade da cava).`,
  findingGa05Title: (r) => `Uma repetição de malhas de ${r} não tem efeito`,
  findingGa05Detail: (r) => `Uma repetição de ${r} arredonda para o número inteiro mais próximo como se não houvesse repetição. Defina o múltiplo real do padrão de malha (ex. 6 para um painel de tranças de 6 malhas) ou limpe-o.`,
  findingGa05bTitle: 'O resto das malhas é inválido para a repetição',
  findingGa05bDetail: (rem, rep) => `O resto ${rem} está fora do intervalo válido 0…${rep - 1} para uma repetição de ${rep}. As contagens válidas seriam …${rep + rem}, ${2 * rep + rem}, …`,
  findingGa05cTitle: 'Paridade e repetição definidas — a paridade ganha',
  findingGa05cDetail: 'Quando ambas estão definidas, o arredondamento por paridade tem precedência. Mantenha a restrição que realmente rege esta medida.',
  findingGa06Title: (s) => `Contagem de malhas zero ou negativa no tamanho ${s}`,
  findingGa06Detail: (c) => `A contagem de malhas arredondada é ${c}. Um contagem tão pequena costuma significar que o valor base, a amostra ou a chave de gradação estão errados para esta medida.`,
  findingGa07Title: 'Chave de comprimento graduada como uma largura',
  findingGa07Detail: (l, k) => `${l} utiliza a chave ${k} (um comprimento) com o tipo "largura", o que reduz o valor a metade ao graduar. Se esta medida deve ser um comprimento, defina o seu tipo como "comprimento" ou "direto".`,
  findingGa08Title: 'Nenhum tamanho graduado',
  findingGa08Detail: 'Cada medida tem um valor base zero, portanto nada é graduado. Insira primeiro as medidas do tamanho base.',
  findingGa08bTitle: 'Modelo de tamanho único',
  findingGa08bDetail: 'Apenas um tamanho é graduado. Os modelos de tamanho único são uma classe comum de queixas dos compradores ("porque é que isto não está em mais tamanhos?") — os modelos multi-tamanho vendem consistentemente melhor no Ravelry e no Etsy. Considere graduar pelo menos 3 tamanhos antes de publicar.',
  findingGa09Title: (p, std, s) => `Valor base ${p}% abaixo do padrão ${std} ${s}`,
  findingGa09Detail: (v, u, std, s, t) => `Introduziu ${v}${u} para esta medida, mas o valor corporal padrão ${std} para o tamanho ${s} é ${t}${u}. Uma peça não pode ser mais pequena do que o corpo que cobre — verifique se deve ser uma chave de gradação de circunferência, ou se o valor base pertence a um tamanho diferente.`,
  findingGa09bTitle: (std, s) => `Valor base mais do que o dobro do padrão ${std} ${s}`,
  findingGa09bDetail: (v, u, t) => `Introduziu ${v}${u} vs um valor corporal de ${t}${u}. A folga explica o desvio, mas não uma duplicação — isto costuma significar que foi introduzida uma circunferência onde pertence uma meia largura (ou vice versa).`,
  findingGa10Title: (l) => `Etiqueta de medida duplicada «${l}»`,
  findingGa10Detail: (n, s) => `Esta etiqueta aparece ${n} vezes em «${s}». Duas medidas com o mesmo nome confundem tanto os testadores como os editores — dê a cada uma um nome distinto (ex. «Busto (frente)» / «Busto (costas)»).`,
  findingGa11Title: 'Arredondamento de voltas usado mas a amostra de voltas não está definida',
  findingGa11Detail: 'Pelo menos uma medida arredonda a sua contagem de voltas, mas as voltas/10 cm não estão definidas. As contagens de voltas serão calculadas com uma amostra de zero — cada comprimento no modelo está silenciosamente errado. Insira a amostra de voltas antes de publicar.',
  findingGa12Title: 'O modelo tem uma única secção',
  findingGa12Detail: 'A maioria das peças tem pelo menos um corpo e mangas. Se este modelo for genuinamente de uma só peça (cachecol, gola), ignore isto; caso contrário, adicione secções antes da verificação final.',
  
  compositionTitle: 'Composição do padrão',
  compositionDescription: 'Reúna as instruções escritas, abreviaturas e notas de acabamento para a publicação final.',
  compositionCompile: 'Compilar padrão',
  compositionCompiling: 'Compilando...',
  compositionReview: 'Pronto para revisão',
  compositionDraft: 'Rascunho',
  compositionLastCompiled: (d) => `Última compilação: ${d}`,
  compositionNoCompile: 'Ainda não compilado',
  compositionSectionName: 'Nome da secção',
  compositionAddSection: 'Adicionar secção',
  compositionAddStep: 'Adicionar passo',
  compositionStepPlaceholder: 'Escrever passo de instrução...',
  compositionSectionPlaceholder: 'ex: Costas, Manga esquerda...',
  compositionAbbreviations: 'Abreviaturas',
  compositionGlossary: 'Glossário',
  compositionConstruction: 'Sequência de construção',
  compositionFinishing: 'Acabamento',
  compositionCare: 'Cuidados',
  compositionTermPlaceholder: 'Termo',
  compositionDefPlaceholder: 'Definição',
  compositionAddAbbreviation: 'Adicionar abreviatura',
  compositionAddTerm: 'Adicionar termo',
  compositionSectionOrder: 'Ordem de secções',
  compositionDeleteSection: 'Eliminar secção',
  compositionDeleteStep: 'Eliminar passo',
  compositionDeleteTerm: 'Eliminar termo',
};

export const COPY: Record<LanguageCode, TechEditCopy> = {
  en, de, fr, es, pt
};

export const TECH_EDIT_COPY = COPY;
