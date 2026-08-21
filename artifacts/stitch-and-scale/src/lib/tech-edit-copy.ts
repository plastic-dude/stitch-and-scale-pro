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
  marketNoteClean: (low, high, h, s, sw, d) => `A human editor would quote $${low}–$${high} for the same ${h}h of arithmetic, at $${low}–$${high}/hr — and most would add a per-size premium. The numbers sweep is fully automatable; their flaw is charging hourly rates for arithmetic.`,

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
  marketNoteClean: (low, high, h, s, sw, d) => `Ein menschlicher Editor würde ${low}–${high} $ für dieselben ${h} Std. Arithmetik verlangen, bei ${low}–${high} $/Std. — und die meisten würden einen Aufpreis pro Größe verlangen. Die Zahlenprüfung ist voll automatisierbar; ihr Fehler ist es, Stundensätze für Arithmetik zu verlangen.`,

  findingGa01Title: 'Maschenprobe nicht gesetzt — alle Zahlen unten sind unzuverlässig',
  findingGa01Detail: 'Lege Maschen/Reihen pro 10 cm in der Projekt-Maschenprobe fest. Ein Tech-Editor kann die Mathematik ohne sie nicht prüfen, und ein Tester auch nicht. Dies ist der erste Punkt auf jeder Pre-Edit-Checkliste.',
  findingGa02Title: 'Basismaß ist negativ',
  findingGa02Detail: (v) => `Der Basiswert ${v} ist negativ. Maße müssen positiv sein — eine negative Breite oder Länge kann nicht gestrickt werden.`,
  findingGa02bTitle: 'Basismaß ist Null — von der Gradierung ausgeschlossen',
  findingGa02bDetail: 'Ein Basiswert von Null schließt dieses Maß von allen gradierten Größen aus. Wenn dies beabsichtigt ist (z. B. ein dekoratives Panel), ist das in Ordnung; wenn nicht, gib den Wert der Basisgröße ein.',
  findingGa03Title: 'Größenprogression ist nicht monoton',
  findingGa03Detail: (s, v, u) => `Die physischen Werte über ${s} sind: ${v} ${u}. Kleidungsstücke sollten mit der Größe wachsen (oder gleich bleiben) — prüfe, ob der Gradierungsschlüssel oder Typ korrekt ist.`,
  findingGa04Title: (p, s) => `Maschenzahl um ${p} % vom Rohziel abgewichen (${s})`,
  findingGa04Detail: (r, raw) => `Gerundet auf ${r} Maschen vs. roh ${raw}. Der Rapport/Parität des Musters zwingt die Zahl vom Zielmaß weg — prüfe die Passform in dieser Größe.`,
  findingGa04bTitle: (p, s) => `Reihenzahl um ${p} % vom Rohziel abgewichen (${s})`,
  findingGa04bDetail: (r, raw) => `Gerundet auf ${r} Reihen vs. roh ${raw}. Längentoleranz ist meist verzeihlich, aber markiere es, wenn das Maß kritisch ist (z. B. Armlochtiefe).`,
  findingGa05Title: (r) => `Maschenrapport von ${r} ist wirkungslos`,
  findingGa05Detail: (r) => `Ein Rapport von ${r} rundet auf die nächste ganze Zahl, wie gar kein Rapport. Setze den tatsächlichen Rapport (z. B. 6 für ein 6-Maschen-Zopfmuster) oder lösche ihn.`,
  findingGa05bTitle: 'Maschenrest ist ungültig für den Rapport',
  findingGa05bDetail: (rem, rep) => `Der Rest ${rem} liegt außerhalb des gültigen Bereichs 0…${rep - 1} für einen Rapport von ${rep}. Gültige Zahlen wären …${rep + rem}, ${2 * rep + rem}, …`,
  findingGa05cTitle: 'Sowohl Parität als auch Rapport gesetzt — Parität gewinnt',
  findingGa05cDetail: 'Wenn beides gesetzt ist, hat die Paritätsrundung Vorrang. Behalte die Einschränkung bei, die dieses Maß tatsächlich steuert.',
  findingGa06Title: (s) => `Null/negative Maschenzahl bei Größe ${s}`,
  findingGa06Detail: (c) => `Die gerundete Maschenzahl ist ${c}. Eine so kleine Zahl bedeutet meist, dass der Basiswert, die Maschenprobe oder der Gradierungsschlüssel für dieses Maß falsch ist.`,
  findingGa07Title: 'Längenschlüssel als Breite gradiert',
  findingGa07Detail: (l, k) => `${l} verwendet den ${k}-Schlüssel (eine Länge) mit dem Typ „Breite“, was den Wert bei der Gradierung halbiert. Wenn dieses Maß eine Länge sein soll, setze den Typ auf „Länge“ oder „Direkt“.`,
  findingGa08Title: 'Keine Größen gradiert',
  findingGa08Detail: 'Jedes Maß hat einen Basiswert von Null, daher wird nichts gradiert. Gib zuerst die Maße der Basisgröße ein.',
  findingGa08bTitle: 'Einzelgrößen-Muster',
  findingGa08bDetail: 'Nur eine Größe wird gradiert. Einzelgrößen-Muster sind ein häufiger Beschwerdegrund („warum gibt es das nicht in mehr Größen?“) — Mehrgrößen-Muster verkaufen sich auf Ravelry und Etsy konsequent besser. Erwäge, 3+ Größen zu gradieren.',
  findingGa09Title: (p, std, s) => `Basiswert ${p} % unter dem ${std} ${s} Standard`,
  findingGa09Detail: (v, u, std, s, t) => `Du hast ${v}${u} für dieses Maß eingegeben, aber der ${std}-Standardwert für Größe ${s} ist ${t}${u}. Ein Kleidungsstück kann nicht kleiner als der Körper sein — prüfe den Gradierungsschlüssel oder die Basisgröße.`,
  findingGa09bTitle: (std, s) => `Basiswert mehr als doppelt so hoch wie der ${std} ${s} Standard`,
  findingGa09bDetail: (v, u, t) => `Du hast ${v}${u} eingegeben vs. einem Körperwert von ${t}${u}. Bequemlichkeitszugabe erklärt Abweichungen, aber keine Verdopplung — meist wurde ein Umfang statt einer Halbreite eingegeben (oder umgekehrt).`,
  findingGa10Title: (l) => `Doppeltes Maß-Label „${l}“`,
  findingGa10Detail: (n, s) => `Dieses Label erscheint ${n}-mal in „${s}“. Zwei Maße mit demselben Namen verwirren sowohl Teststricker als auch Tech-Editoren — gib jedem einen eindeutigen Namen (z. B. „Brust (vorne)“ / „Brust (hinten)“).`,
  findingGa11Title: 'Reihenrundung verwendet, aber Reihenprobe nicht gesetzt',
  findingGa11Detail: 'Mindestens ein Maß rundet seine Reihenzahl, aber Reihen/10 cm ist nicht gesetzt. Reihenzahlen werden mit Null berechnet — jede Länge im Muster ist stillschweigend falsch. Gib die Reihenprobe vor der Veröffentlichung ein.',
  findingGa12Title: 'Muster hat nur einen Abschnitt',
  findingGa12Detail: 'Die meisten Kleidungsstücke haben mindestens einen Körper und Ärmel. Wenn dieses Muster wirklich aus einem Stück besteht (Schal, Loop), ignoriere dies; andernfalls füge Abschnitte vor der Veröffentlichungsprüfung hinzu.',
};

const fr: TechEditCopy = {
  ...en,
  title: 'Audit d\'Auto-Révision Technique',
  description: 'Une vérification des chiffres avant qu\'un éditeur humain ne voie le patron — les éditeurs facturent 20–40 $/h avec un délai de ~10 jours. Chaque point résolu est une économie directe.',
  verdictClean: 'Propre — la vérification des chiffres a réussi',
  verdictCheck: 'À vérifier',
  verdictFix: 'À corriger avant publication',
  severityError: 'Erreur',
  severityWarning: 'Avertissement',
  severityNote: 'Note',
  severityPass: 'Réussi',
  findingsCount: (e, w, n) => `${e} erreur${e === 1 ? '' : 's'} · ${w} avertissement${w === 1 ? '' : 's'} · ${n} note${n === 1 ? '' : 's'}`,
  cleanSweep: 'La vérification des chiffres a réussi : validité de l\'échantillon, monotonie de la gradation, arrondis mailles/rangs vs rapports, nombre de mailles par taille, cohérence clé-type et valeurs de base vs standards corporels.',
  editorBillSaved: 'Économie sur la facture d\'édition',
  editorRateLabel: 'Taux horaire de votre éditeur',
  perHour: '/h',
  marketQuoteTitle: 'Devis du marché pour cette révision',
  marketQuoteDetails: (h, d) => `≈${h}h de temps d'édition · ~${d} jours de délai`,
  negotiateHint: (n) => `${n} point${n === 1 ? '' : 's'} à vérifier — résolvez-les pour négocier le bas de la fourchette`,
  preEditSummaryTitle: 'Résumé pré-édition',
  copyForEditor: 'Copier pour votre éditeur',
  preEditSummaryHeader: (name) => `RÉSUMÉ PRÉ-ÉDITION — ${name}`,
  designerLabel: 'Créateur',
  baseSizeLabel: 'Taille de base',
  gaugeLabel: 'Échantillon',
  auditScoreLabel: (s, v) => `Score d'auto-révision : ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Déjà vérifié automatiquement (chiffres) :',
  checkedItems: [
    'validité de l\'échantillon',
    'monotonie de la gradation sur toutes les tailles',
    'arrondis mailles/rangs vs rapports et parité',
    'plausibilité du nombre de mailles par taille',
    'cohérence clé de gradation vs type (largeur/longueur/circonférence)',
    'valeurs de base vs standards pour la taille de base',
    'doublons de libellés, complétude de l\'échantillon rangs'
  ],
  outstandingItemsLabel: (n) => `Points en suspens (${n}) :`,
  prosePassLabel: 'Ce que j\'attends encore de vous (révision du texte) :',
  prosePassDetails: 'cohérence du style/abréviations, clarté des instructions, orthographe, cohérence avec les diagrammes/schémas.',
  savingsNote: (p) => `Résolvez les ${p} points en suspens ci-dessus avant qu'un éditeur humain ne touche au patron — chaque point qu'il n'a pas à trouver est du temps facturable économisé.`,
  cleanSavingsNote: 'La vérification des chiffres est propre — un éditeur peut maintenant se concentrer uniquement sur le texte (style, abréviations, clarté), ce qui représente la moitié de la facture nécessitant un œil humain.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Les éditeurs facturent ${low}–${high} $/h pour cette révision (~${h}h pour ${s} ${sw}) et il y a une réelle pénurie — les patrons attendent ~${d} jours. Résolvez les points d'abord pour justifier de négocier le bas du tarif.`,
  marketNoteClean: (low, high, h, s, sw, d) => `Un éditeur humain demanderait ${low}–${high} $ pour les mêmes ${h}h d'arithmétique, à ${low}–${high} $/h — et la plupart ajouteraient un supplément par taille. La vérification des chiffres est automatisable ; leur tort est de facturer l'arithmétique à l'heure.`,

  findingGa01Title: 'Échantillon non défini — tous les chiffres ci-dessous sont peu fiables',
  findingGa01Detail: 'Définissez les mailles/rangs pour 10 cm. Un éditeur technique ne peut pas vérifier les calculs sans cela, et un testeur non plus. C\'est le premier point de toute liste de pré-édition.',
  findingGa02Title: 'La mesure de base est négative',
  findingGa02Detail: (v) => `La valeur de base ${v} est négative. Les mesures doivent être positives — on ne peut pas tricoter une largeur ou une longueur négative.`,
  findingGa02bTitle: 'La mesure de base est nulle — exclue de la gradation',
  findingGa02bDetail: 'Une valeur de base nulle exclut cette mesure de toutes les tailles gradées. Si c\'est intentionnel (ex: panneau décoratif), c\'est correct ; sinon, saisissez la valeur de la taille de base.',
  findingGa03Title: 'La progression des tailles n\'est pas monotone',
  findingGa03Detail: (s, v, u) => `Les valeurs physiques sur ${s} sont : ${v} ${u}. Les dimensions du vêtement devraient croître (ou rester stables) avec la taille — vérifiez la clé ou le type de gradation.`,
  findingGa04Title: (p, s) => `Nombre de mailles dévié de ${p}% de la cible brute (${s})`,
  findingGa04Detail: (r, raw) => `Arrondi à ${r} mailles vs brut ${raw}. Le rapport/parité du motif force le nombre loin de la mesure cible — vérifiez le bien-aller à cette taille.`,
  findingGa04bTitle: (p, s) => `Nombre de rangs dévié de ${p}% de la cible brute (${s})`,
  findingGa04bDetail: (r, raw) => `Arrondi à ${r} rangs vs brut ${raw}. La tolérance en longueur est souvent souple, mais signalez-le si la mesure est critique (ex: profondeur d'emmanchure).`,
  findingGa05Title: (r) => `Un rapport de mailles de ${r} est sans effet`,
  findingGa05Detail: (r) => `Un rapport de ${r} arrondit à l'entier le plus proche comme s'il n'y avait pas de rapport. Définissez le multiple réel (ex: 6 pour une torsade de 6 mailles) ou effacez-le.`,
  findingGa05bTitle: 'Le reste de mailles est invalide pour le rapport',
  findingGa05bDetail: (rem, rep) => `Le reste ${rem} est en dehors de la plage valide 0…${rep - 1} pour un rapport de ${rep}. Les nombres valides seraient …${rep + rem}, ${2 * rep + rem}, …`,
  findingGa05cTitle: 'Parité et rapport définis — la parité l\'emporte',
  findingGa05cDetail: 'Lorsque les deux sont définis, l\'arrondi par parité est prioritaire. Gardez la contrainte qui régit réellement cette mesure.',
  findingGa06Title: (s) => `Nombre de mailles nul ou négatif à la taille ${s}`,
  findingGa06Detail: (c) => `Le nombre de mailles arrondi est ${c}. Un nombre aussi petit signifie généralement que la valeur de base, l'échantillon ou la clé de gradation est erroné.`,
  findingGa07Title: 'Clé de longueur gradée comme une largeur',
  findingGa07Detail: (l, k) => `${l} utilise la clé ${k} (une longueur) avec le type "largeur", ce qui divise la valeur par deux lors de la gradation. S'il s'agit d'une longueur, changez le type en "longueur" ou "direct".`,
  findingGa08Title: 'Aucune taille gradée',
  findingGa08Detail: 'Toutes les mesures ont une valeur de base nulle, donc rien n\'est gradé. Saisissez d\'abord les mesures de la taille de base.',
  findingGa08bTitle: 'Patron en taille unique',
  findingGa08bDetail: 'Une seule taille est gradée. Les patrons en taille unique sont une source fréquente de plaintes ("pourquoi n\'y a-t-il pas plus de tailles ?") — les patrons multi-tailles se vendent mieux sur Ravelry et Etsy. Envisagez de grader au moins 3 tailles.',
  findingGa09Title: (p, std, s) => `Valeur de base ${p}% sous le standard ${std} ${s}`,
  findingGa09Detail: (v, u, std, s, t) => `Vous avez saisi ${v}${u}, mais la valeur standard ${std} pour la taille ${s} est ${t}${u}. Un vêtement ne peut pas être plus petit que le corps — vérifiez la clé de gradation ou la taille de base.`,
  findingGa09bTitle: (std, s) => `Valeur de base plus du double du standard ${std} ${s}`,
  findingGa09bDetail: (v, u, t) => `Vous avez saisi ${v}${u} vs une valeur corporelle de ${t}${u}. L'aisance explique l'écart, mais pas un doublement — cela signifie souvent une circonférence saisie à la place d'une demi-largeur (ou vice-versa).`,
  findingGa10Title: (l) => `Libellé de mesure en double « ${l} »`,
  findingGa10Detail: (n, s) => `Ce libellé apparaît ${n} fois dans « ${s} ». Deux mesures portant le même nom perdent les testeurs et les éditeurs — donnez un nom distinct à chacune (ex: "Buste (devant)" / "Buste (dos)").`,
  findingGa11Title: 'Arrondi des rangs utilisé mais échantillon rangs non défini',
  findingGa11Detail: 'Au moins une mesure arrondit son nombre de rangs, mais les rangs/10 cm ne sont pas définis. Les rangs seront calculés avec un échantillon nul — toutes les longueurs seront fausses. Définissez l\'échantillon rangs avant publication.',
  findingGa12Title: 'Le patron n\'a qu\'une seule section',
  findingGa12Detail: 'La plupart des vêtements ont au moins un corps et des manches. Si ce patron est réellement d\'une seule pièce (écharpe, col), ignorez ceci ; sinon ajoutez des sections avant la vérification de publication.',
};

const es: TechEditCopy = {
  ...en,
  title: 'Auditoría de Auto-Edición Técnica',
  description: 'Una revisión de los números antes de que un editor humano vea el patrón. Los editores cobran $20–40/h con un plazo de ~10 días. Cada error que resuelvas es dinero ahorrado.',
  verdictClean: 'Limpio — la revisión de números ha pasado',
  verdictCheck: 'Vale la pena revisar',
  verdictFix: 'Corregir antes de publicar',
  severityError: 'Error',
  severityWarning: 'Advertencia',
  severityNote: 'Nota',
  severityPass: 'Correcto',
  findingsCount: (e, w, n) => `${e} error${e === 1 ? '' : 'es'} · ${w} advertencia${w === 1 ? '' : 's'} · ${n} nota${n === 1 ? '' : 's'}`,
  cleanSweep: 'La revisión de números ha pasado con éxito: validez de la muestra, monotonía en la progresión de tallas, redondeo de puntos/vueltas vs repeticiones, recuento de puntos en cada talla, consistencia entre clave y tipo, y valores base frente al estándar corporal.',
  editorBillSaved: 'Ahorro en la factura del editor',
  editorRateLabel: 'Tarifa por hora de tu editor',
  perHour: '/h',
  marketQuoteTitle: 'Presupuesto de mercado para esta revisión',
  marketQuoteDetails: (h, d) => `≈${h}h de tiempo de edición · ~${d} días de espera`,
  negotiateHint: (n) => `${n} hallazgo${n === 1 ? '' : 's'} — resuélvelos para negociar el precio más bajo`,
  preEditSummaryTitle: 'Resumen pre-edición',
  copyForEditor: 'Copiar para tu editor',
  preEditSummaryHeader: (name) => `RESUMEN PRE-EDICIÓN — ${name}`,
  designerLabel: 'Diseñador',
  baseSizeLabel: 'Talla base',
  gaugeLabel: 'Muestra',
  auditScoreLabel: (s, v) => `Puntuación de auto-edición: ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Ya comprobado automáticamente (revisión de números):',
  checkedItems: [
    'validez de la muestra',
    'monotonía en la progresión de tallas en todas las tallas graduadas',
    'redondeo de puntos/vueltas vs restricciones de repetición y paridad',
    'plausibilidad del recuento de puntos en cada talla',
    'consistencia entre clave de gradación y tipo (ancho/largo/circunferencia)',
    'valores base vs estándar corporal para la talla base',
    'etiquetas duplicadas, completitud de la muestra de vueltas'
  ],
  outstandingItemsLabel: (n) => `Temas pendientes (${n}):`,
  prosePassLabel: 'Lo que todavía necesito de ti (revisión de texto):',
  prosePassDetails: 'consistencia en estilo/abreviaturas, claridad de instrucciones, ortografía, cohesión con gráficos/esquemas.',
  savingsNote: (p) => `Resuelve los ${p} hallazgos pendientes antes de que un editor humano toque el patrón. Cada uno que no tengan que encontrar es tiempo facturable ahorrado.`,
  cleanSavingsNote: 'La revisión de números está limpia. Un editor pagado puede centrarse puramente en la revisión de texto (estilo, abreviaturas, claridad), que es la mitad de la factura que realmente necesita ojos humanos.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Los editores cobran $${low}–$${high}/h por esta revisión (~${h}h para ${s} ${sw}) y hay escasez real — los patrones esperan ~${d} días. Resuelve los hallazgos primero para justificar la negociación del precio más bajo.`,
  marketNoteClean: (low, high, h, s, sw, d) => `Un editor humano cobraría $${low}–$${high} por las mismas ${h}h de aritmética, a $${low}–$${high}/h — y la mayoría añadiría un suplemento por talla. La revisión de números es totalmente automatizable; su error es cobrar tarifas por hora por aritmética.`,

  findingGa01Title: 'Muestra no establecida — todos los números de abajo no son fiables',
  findingGa01Detail: 'Establece los puntos/vueltas por cada 10 cm en la muestra del proyecto. Un editor técnico no puede verificar las matemáticas sin ella, y un probador tampoco. Es lo primero en cualquier lista de pre-edición.',
  findingGa02Title: 'La medida base es negativa',
  findingGa02Detail: (v) => `El valor base ${v} es negativo. Las medidas deben ser positivas — no se puede tejer un ancho o largo negativo.`,
  findingGa02bTitle: 'La medida base es cero — excluida de la gradación',
  findingGa02bDetail: 'Un valor base cero excluye esta medida de todas las tallas graduadas. Si esto es intencional (ej. un panel decorativo), está bien; si no, introduce el valor de la talla base.',
  findingGa03Title: 'La progresión de tallas no es monótona',
  findingGa03Detail: (s, v, u) => `Los valores físicos en ${s} son: ${v} ${u}. Las dimensiones de la prenda deben crecer (o mantenerse) con la talla — comprueba si la clave o el tipo de gradación son correctos.`,
  findingGa04Title: (p, s) => `Recuento de puntos desviado un ${p}% del objetivo bruto (${s})`,
  findingGa04Detail: (r, raw) => `Redondeado a ${r} puntos frente a los ${raw} brutos. La restricción de repetición/paridad del patrón está forzando el recuento lejos de la medida objetivo — comprueba el ajuste final en esta talla.`,
  findingGa04bTitle: (p, s) => `Recuento de vueltas desviado un ${p}% del objetivo bruto (${s})`,
  findingGa04bDetail: (r, raw) => `Redondeado a ${r} vueltas frente a las ${raw} brutas. La tolerancia en el largo suele ser flexible, pero márcalo si la medida es crítica (ej. profundidad de la sisa).`,
  findingGa05Title: (r) => `Una repetición de puntos de ${r} no tiene efecto`,
  findingGa05Detail: (r) => `Una repetición de ${r} redondea al entero más cercano como si no hubiera repetición. Establece el múltiplo real del patrón (ej. 6 para una trenza de 6 puntos) o bórralo.`,
  findingGa05bTitle: 'El resto de puntos no es válido para la repetición',
  findingGa05bDetail: (rem, rep) => `El resto ${rem} está fuera del rango válido 0…${rep - 1} para una repetición de ${rep}. Los recuentos válidos serían …${rep + rem}, ${2 * rep + rem}, …`,
  findingGa05cTitle: 'Establecidos paridad y repetición — la paridad gana',
  findingGa05cDetail: 'Cuando se establecen ambos, el redondeo por paridad tiene prioridad. Mantén la restricción que realmente gobierne esta medida.',
  findingGa06Title: (s) => `Recuento de puntos cero o negativo en la talla ${s}`,
  findingGa06Detail: (c) => `El recuento de puntos redondeado es ${c}. Un recuento tan pequeño suele significar que el valor base, la muestra o la clave de gradación son incorrectos para esta medida.`,
  findingGa07Title: 'Clave de largo graduada como ancho',
  findingGa07Detail: (l, k) => `${l} utiliza la clave ${k} (un largo) con tipo "ancho", lo que reduce el valor a la mitad al graduar. Si esta medida debe ser un largo, cambia su tipo a "largo" o "directo".`,
  findingGa08Title: 'No hay tallas graduadas',
  findingGa08Detail: 'Cada medida tiene un valor base de cero, por lo que no se grada nada. Introduce primero las medidas de la talla base.',
  findingGa08bTitle: 'Patrón de talla única',
  findingGa08bDetail: 'Solo se grada una talla. Los patrones de talla única son una queja común de los compradores ("¿por qué no está en más tallas?") — los patrones de varias tallas se venden mejor en Ravelry y Etsy. Considera graduar 3 o más tallas.',
  findingGa09Title: (p, std, s) => `Valor base un ${p}% por debajo del estándar ${std} ${s}`,
  findingGa09Detail: (v, u, std, s, t) => `Introdujiste ${v}${u} para esta medida, pero el valor corporal estándar ${std} para la talla ${s} es ${t}${u}. Una prenda no puede ser más pequeña que el cuerpo que cubre — comprueba la clave de gradación o la talla base.`,
  findingGa09bTitle: (std, s) => `Valor base más del doble del estándar ${std} ${s}`,
  findingGa09bDetail: (v, u, t) => `Introdujiste ${v}${u} frente a un valor corporal de ${t}${u}. La holgura explica la desviación, pero no una duplicación — esto suele significar que se introdujo una circunferencia donde corresponde un medio ancho (o viceversa).`,
  findingGa10Title: (l) => `Etiqueta de medida duplicada "${l}"`,
  findingGa10Detail: (n, s) => `Esta etiqueta aparece ${n} veces en "${s}". Dos medidas con el mismo nombre confunden tanto a probadores como a editores — da a cada una un nombre distinto (ej. "Busto (delantero)" / "Busto (espalda)").`,
  findingGa11Title: 'Redondeo de vueltas usado pero muestra de vueltas no establecida',
  findingGa11Detail: 'Al menos una medida redondea su recuento de vueltas, pero las vueltas/10 cm no están establecidas. Las vueltas se calcularán con muestra cero — cada largo en el patrón será incorrecto. Introduce la muestra de vueltas antes de publicar.',
  findingGa12Title: 'El patrón tiene una sola sección',
  findingGa12Detail: 'La mayoría de las prendas tienen al menos un cuerpo y mangas. Si este patrón es realmente de una sola pieza (bufanda, cuello), ignora esto; de lo contrario, añade secciones antes de la comprobación de publicación.',
};

const pt: TechEditCopy = {
  ...en,
  title: 'Auditoria de Auto-Edição Técnica',
  description: 'Uma verificação dos números antes de um editor humano ver o padrão — os editores cobram $20–40/h com um prazo de ~10 dias. Cada erro que resolver é dinheiro poupado.',
  verdictClean: 'Limpo — a verificação dos números passou',
  verdictCheck: 'Vale a pena verificar',
  verdictFix: 'Corrigir antes de publicar',
  severityError: 'Erro',
  severityWarning: 'Aviso',
  severityNote: 'Nota',
  severityPass: 'Correto',
  findingsCount: (e, w, n) => `${e} erro${e === 1 ? '' : 's'} · ${w} aviso${w === 1 ? '' : 's'} · ${n} nota${n === 1 ? '' : 's'}`,
  cleanSweep: 'A verificação dos números passou com sucesso: validade da amostra, monotonia na progressão de tamanhos, arredondamento de malhas/voltas vs repetições, contagem de malhas em cada tamanho, consistência entre chave e tipo, e valores base face ao padrão corporal.',
  editorBillSaved: 'Poupança na fatura do editor',
  editorRateLabel: 'Tarifa horária do seu editor',
  perHour: '/h',
  marketQuoteTitle: 'Orçamento de mercado para esta auditoria',
  marketQuoteDetails: (h, d) => `≈${h}h de tempo de edição · ~${d} dias de espera`,
  negotiateHint: (n) => `${n} erro${n === 1 ? '' : 's'} — resolva-os para negociar o preço mais baixo`,
  preEditSummaryTitle: 'Resumo pré-edição',
  copyForEditor: 'Copiar para o seu editor',
  preEditSummaryHeader: (name) => `RESUMO PRÉ-EDIÇÃO — ${name}`,
  designerLabel: 'Designer',
  baseSizeLabel: 'Tamanho base',
  gaugeLabel: 'Amostra',
  auditScoreLabel: (s, v) => `Pontuação de auto-edição: ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Já verificado automaticamente (números):',
  checkedItems: [
    'validade da amostra',
    'monotonia na progressão de tamanhos em todos os tamanhos graduados',
    'arredondamento de malhas/voltas vs restrições de repetição e paridade',
    'plausibilidade da contagem de malhas em cada tamanho',
    'consistência entre chave de graduação e tipo (largura/comprimento/circunferência)',
    'valores base vs padrão corporal para o tamanho base',
    'etiquetas duplicadas, completitude da amostra de voltas'
  ],
  outstandingItemsLabel: (n) => `Itens pendentes (${n}):`,
  prosePassLabel: 'O que ainda preciso de si (revisão do texto):',
  prosePassDetails: 'consistência no estilo/abreviaturas, clareza das instruções, ortografia, coesão com gráficos/esquemas.',
  savingsNote: (p) => `Resolva os ${p} itens pendentes acima antes de um editor humano tocar no padrão — cada um que não tenham de encontrar é tempo facturável poupado.`,
  cleanSavingsNote: 'A verificação dos números está limpa — um editor pago pode agora concentrar-se puramente na revisão do texto (estilo, abreviaturas, clareza), que é a metade da fatura que realmente precisa de olhos humanos.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Os editores cobram $${low}–$${high}/h por esta auditoria (~${h}h para ${s} ${sw}) e há uma escassez real — os padrões esperam ~${d} dias. Resolva os erros primeiro para justificar a negociação do preço mais baixo.`,
  marketNoteClean: (low, high, h, s, sw, d) => `Um editor humano cobraria $${low}–$${high} pelas mesmas ${h}h de aritmética, a $${low}–$${high}/h — e a maioria adicionaria um suplemento por tamanho. A verificação dos números é totalmente automatizável; o erro deles é cobrar tarifas horárias por aritmética.`,

  findingGa01Title: 'Amostra não definida — todos os números abaixo não são fiáveis',
  findingGa01Detail: 'Defina as malhas/voltas por cada 10 cm na amostra do projeto. Um editor técnico não pode verificar a matemática sem ela, e um testador também não. Este é o primeiro item em qualquer lista de pré-edição.',
  findingGa02Title: 'A medida base é negativa',
  findingGa02Detail: (v) => `O valor base ${v} é negativo. As medidas devem ser positivas — não se pode tecer uma largura ou comprimento negativo.`,
  findingGa02bTitle: 'A medida base é zero — excluída da graduação',
  findingGa02bDetail: 'Um valor base zero exclui esta medida de todos os tamanhos graduados. Se isto for intencional (ex: um painel decorativo), tudo bem; caso contrário, introduza o valor do tamanho base.',
  findingGa03Title: 'A progressão de tamanhos não é monótona',
  findingGa03Detail: (s, v, u) => `Os valores físicos em ${s} são: ${v} ${u}. As dimensões da peça devem crescer (ou manter-se) com o tamanho — verifique se a chave ou o tipo de graduação estão corretos.`,
  findingGa04Title: (p, s) => `Contagem de malhas desviada ${p}% do objetivo bruto (${s})`,
  findingGa04Detail: (r, raw) => `Arredondado para ${r} malhas vs ${raw} bruto. A restrição de repetição/paridade do padrão está a forçar a contagem para longe da medida objetivo — verifique o ajuste final neste tamanho.`,
  findingGa04bTitle: (p, s) => `Contagem de voltas desviada ${p}% do objetivo bruto (${s})`,
  findingGa04bDetail: (r, raw) => `Arredondado para ${r} voltas vs ${raw} bruto. A tolerância no comprimento costuma ser flexível, mas assinale se a medida for crítica (ex: profundidade da cava).`,
  findingGa05Title: (r) => `Uma repetição de malhas de ${r} não tem efeito`,
  findingGa05Detail: (r) => `Uma repetição de ${r} arredonda para o inteiro mais próximo como se não houvesse repetição. Defina o múltiplo real do padrão (ex: 6 para uma trança de 6 malhas) ou apague-o.`,
  findingGa05bTitle: 'O resto de malhas é inválido para a repetição',
  findingGa05bDetail: (rem, rep) => `O resto ${rem} está fora do intervalo válido 0…${rep - 1} para uma repetição de ${rep}. As contagens válidas seriam …${rep + rem}, ${2 * rep + rem}, …`,
  findingGa05cTitle: 'Estabelecidos paridade e repetição — a paridade ganha',
  findingGa05cDetail: 'Quando ambos são estabelecidos, o arredondamento por paridade tem prioridade. Mantenha a restrição que realmente governa esta medida.',
  findingGa06Title: (s) => `Contagem de malhas zero ou negativa no tamanho ${s}`,
  findingGa06Detail: (c) => `A contagem de malhas arredondada é ${c}. Uma contagem tão pequena costuma significar que o valor base, a amostra ou a chave de graduação estão errados para esta medida.`,
  findingGa07Title: 'Chave de comprimento graduada como largura',
  findingGa07Detail: (l, k) => `${l} utiliza a chave ${k} (um comprimento) com tipo "largura", o que reduz o valor a metade ao graduar. Se esta medida deve ser um comprimento, mude o tipo para "comprimento" ou "direto".`,
  findingGa08Title: 'Não há tamanhos graduados',
  findingGa08Detail: 'Cada medida tem um valor base de zero, por isso nada é graduado. Introduza primeiro as medidas do tamanho base.',
  findingGa08bTitle: 'Padrão de tamanho único',
  findingGa08bDetail: 'Apenas um tamanho é graduado. Padrões de tamanho único são uma queixa comum dos compradores ("porque é que não está em mais tamanhos?") — padrões de vários tamanhos vendem-se melhor no Ravelry e Etsy. Considere graduar 3 ou mais tamanhos.',
  findingGa09Title: (p, std, s) => `Valor base ${p}% abaixo do padrão ${std} ${s}`,
  findingGa09Detail: (v, u, std, s, t) => `Introduziu ${v}${u} para esta medida, mas o valor corporal padrão ${std} para o tamanho ${s} é ${t}${u}. Uma peça não pode ser mais pequena do que o corpo que cobre — verifique a chave de graduação ou o tamanho base.`,
  findingGa09bTitle: (std, s) => `Valor base mais do dobro do padrão ${std} ${s}`,
  findingGa09bDetail: (v, u, t) => `Introduziu ${v}${u} vs um valor corporal de ${t}${u}. A folga explica o desvio, mas não uma duplicação — isto costuma significar que foi introduzida uma circunferência onde corresponde uma meia-largura (ou vice-versa).`,
  findingGa10Title: (l) => `Etiqueta de medida duplicada "${l}"`,
  findingGa10Detail: (n, s) => `Esta etiqueta aparece ${n} vezes em "${s}". Duas medidas com o mesmo nome confundem tanto testadores como editores — dê a cada uma um nome distinto (ex: "Busto (frente)" / "Busto (costas)").`,
  findingGa11Title: 'Arredondamento de voltas usado mas amostra de voltas não definida',
  findingGa11Detail: 'Pelo menos uma medida arredonda a sua contagem de voltas, mas as voltas/10 cm não estão definidas. As voltas serão calculadas com amostra zero — cada comprimento no padrão estará silenciosamente errado. Introduza a amostra de voltas antes de publicar.',
  findingGa12Title: 'O padrão tem uma única secção',
  findingGa12Detail: 'A maioria das peças tem pelo menos um corpo e mangas. Se este padrão é realmente de uma só peça (cachecol, gola), ignore isto; caso contrário, adicione secções antes da verificação de publicação.',
};

export const TECH_EDIT_COPY: Record<LanguageCode, TechEditCopy> = { en, de, fr, es, pt };
