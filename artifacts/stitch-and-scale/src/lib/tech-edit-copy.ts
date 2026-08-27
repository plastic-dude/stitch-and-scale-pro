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

  compositionTitle: 'Zusammenstellung',
  compositionDescription: 'Stelle die schriftlichen Anweisungen, Abkürzungen und Fertigstellungshinweise für die endgültige Veröffentlichung zusammen.',
  compositionCompile: 'Muster kompilieren',
  compositionCompiling: 'Kompilierung...',
  compositionReview: 'Bereit zur Überprüfung',
  compositionDraft: 'Entwurf',
  compositionLastCompiled: (d) => `Zuletzt kompiliert: ${d}`,
  compositionNoCompile: 'Noch nicht kompiliert',
  compositionSectionName: 'Abschnittsname',
  compositionAddSection: 'Abschnitt hinzufügen',
  compositionAddStep: 'Schritt hinzufügen',
  compositionStepPlaceholder: 'Anweisungsschritt schreiben...',
  compositionSectionPlaceholder: 'z.B. Rückenteil, Linker Ärmel...',
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
  description: 'Une vérification des chiffres avant qu\'un éditeur humain ne voie le patron — les éditeurs facturent 20–40 $/h avec un délai de ~10 jours. Chaque problème résolu est du temps facturable économisé.',
  verdictClean: 'Propre — la vérification des chiffres a réussi',
  verdictCheck: 'À vérifier',
  verdictFix: 'À corriger avant publication',
  severityError: 'Erreur',
  severityWarning: 'Avertissement',
  severityNote: 'Note',
  severityPass: 'Réussi',
  findingsCount: (e, w, n) => `${e} erreur${e === 1 ? '' : 's'} · ${w} avertissement${w === 1 ? '' : 's'} · ${n} note${n === 1 ? '' : 's'}`,
  cleanSweep: 'La vérification des chiffres a réussi : validité de l\'échantillon, monotonie de la progression des tailles, arrondi des mailles/rangs vs vos répétitions, nombre de mailles dans chaque taille, cohérence clé-type et valeurs de base par rapport au standard corporel.',
  editorBillSaved: 'Facture d\'éditeur économisée',
  editorRateLabel: 'Taux horaire de votre éditeur',
  perHour: '/h',
  marketQuoteTitle: 'Devis du marché pour cette vérification',
  marketQuoteDetails: (h, d) => `≈${h}h de temps d'éditeur · délai de ~${d} jours`,
  negotiateHint: (n) => `${n} problème${n === 1 ? '' : 's'} — à résoudre pour négocier le tarif bas`,
  preEditSummaryTitle: 'Résumé pré-édition',
  copyForEditor: 'Copie pour votre éditeur',
  preEditSummaryHeader: (name) => `RÉSUMÉ PRÉ-ÉDITION — ${name}`,
  designerLabel: 'Designer',
  baseSizeLabel: 'Taille de base',
  gaugeLabel: 'Échantillon',
  auditScoreLabel: (s, v) => `Score d'auto-audit technique : ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Déjà vérifié automatiquement (chiffres) :',
  checkedItems: [
    'validité de l\'échantillon',
    'monotonie de la progression des tailles sur toutes les tailles gradées',
    'arrondi des mailles/rangs vs contraintes de répétition et parité',
    'plausibilité du nombre de mailles dans chaque taille',
    'cohérence clé de gradation vs type (largeur/longueur/circonférence)',
    'valeurs de base vs standard corporel pour la taille de base',
    'libellés en double, complétude de l\'échantillon de rangs'
  ],
  outstandingItemsLabel: (n) => `Éléments en suspens (${n}) :`,
  prosePassLabel: 'Ce que j\'attends encore de vous (vérification du texte) :',
  prosePassDetails: 'cohérence du style/abréviations, clarté des instructions, orthographe, cohérence avec les diagrammes/schémas.',
  savingsNote: (p) => `Résolvez les ${p} éléments en suspens ci-dessus avant qu'un éditeur humain ne touche au patron — chaque point qu'il n'a pas à trouver est du temps facturable économisé.`,
  cleanSavingsNote: 'La vérification des chiffres est propre — un éditeur payé peut maintenant se concentrer purement sur le texte (style, abréviations, claretté), ce qui est la moitié de la facture qui nécessite réellement des yeux humains.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Les éditeurs facturent $${low}–$${high}/h pour cette vérification (~${h}h pour ${s} ${sw}) et il y a une réelle pénurie — les patrons attendent ~${d} jours en file. Résolvez les problèmes d'abord pour justifier le tarif bas.`,
  marketNoteClean: (low, high, h, s, sw, d) => `Un éditeur humain facturerait entre $${low} et $${high} pour les mêmes ${h}h d'arithmétique, à $20–$40/h — et la plupart ajouteraient un supplément par taille. La vérification des chiffres est entièrement automatisable ; leur erreur est de facturer des taux horaires pour de l'arithmétique.`,

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
  compositionFinishing: 'Finition',
  compositionCare: 'Entretien',
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
  description: 'Una revisión de números antes de que un editor humano vea el patrón — los editores cobran 20–40 $/h con una demora de ~10 días. Cada hallazgo resuelto es tiempo facturable ahorrado.',
  verdictClean: 'Limpio — la revisión de números fue exitosa',
  verdictCheck: 'Vale la pena mirar',
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
  copyForEditor: 'Cotización para tu editor',
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
  savingsNote: (p) => `Resuelve los ${p} temas pendientes antes de que un editor humano toque el patrón — cada punto que no tengan que encontrar es tiempo facturable ahorrado.`,
  cleanSavingsNote: 'La revisión de números está limpia — un editor pagado puede ahora enfocarse puramente en el texto (estilo, abreviaturas, claridad), que es la mitad de la factura que realmente necesita ojos humanos.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Los editores cobran $${low}–$${high}/h por esta revisión (~${h}h para ${s} ${sw}) y hay una escasez real — los patrones esperan ~${d} días en cola. Resuelve los hallazgos primero para negociar el rango bajo.`,
  marketNoteClean: (low, high, h, s, sw, d) => `Un editor humano cobraría entre $${low} y $${high} por las mismas ${h}h de aritmética, a $20–$40/h — y la mayoría añadiría un recargo por talla. La revisión de números es totalmente automatizable; su error es cobrar tarifas por hora por aritmética.`,

  findingGa01Title: 'Muestra no establecida — todos los números a continuación no son fiables',
  findingGa01Detail: 'Establezca los puntos/vueltas por 10 cm en la muestra del proyecto. Un editor técnico no puede verificar los cálculos sin esto, ni tampoco un probador. Esto es lo primero en cualquier lista de verificación previa a la edición.',
  findingGa02Title: 'La medida base es negativa',
  findingGa02Detail: (v) => `El valor base ${v} es negativo. Las medidas deben ser positivas — no se puede tejer un ancho o largo negativo.`,
  findingGa02bTitle: 'La medida base es cero — excluida de la gradación',
  findingGa02bDetail: 'Un valor base cero excluye esta medida de todas las tallas gradadas. Si esto es intencional (p. ej., un panel decorativo), está bien; si no, introduzca el valor de la talla base.',
  findingGa03Title: 'La progresión de tallas no es monótona',
  findingGa03Detail: (s, v, u) => `Los valores físicos en ${s} son: ${v} ${u}. Las dimensiones de la prenda deben crecer (o mantenerse estables) con la talla — compruebe si la clave de gradación o el tipo de esta medida son correctos.`,
  findingGa04Title: (p, s) => `Conteo de puntos desviado un ${p}% del objetivo bruto (${s})`,
  findingGa04Detail: (r, raw) => `Redondeado a ${r} puntos vs ${raw} brutos. La restricción de repetición/paridad del patrón de puntos está alejando el conteo de la medida objetivo — compruebe el ajuste final en esta talla.`,
  findingGa04bTitle: (p, s) => `Conteo de vueltas desviado un ${p}% del objetivo bruto (${s})`,
  findingGa04bDetail: (r, raw) => `Redondeado a ${r} vueltas vs ${raw} brutas. La tolerancia del largo suele ser flexible, mas avise si la medida es crítica (p. ej., profundidad de la sisa).`,
  findingGa05Title: (r) => `Una repetición de puntos de ${r} no tiene efecto`,
  findingGa05Detail: (r) => `Una repetición de ${r} redondea al entero más cercano como si no hubiera repetición. Establezca el múltiplo real del patrón de puntos (p. ej., 6 para un panel de trenzas de 6 puntos) o bórrelo.`,
  findingGa05bTitle: 'El resto de puntos no es válido para la repetición',
  findingGa05bDetail: (rem, rep) => `El resto ${rem} está fuera del rango válido 0…${rep - 1} para una repetición de ${rep}. Los conteos válidos serían …${rep + rem}, ${2 * rep + rem}, …`,
  findingGa05cTitle: 'Paridad y repetición establecidas — la paridad gana',
  findingGa05cDetail: 'Cuando se establecen ambas, la paridad tiene prioridad. Mantenga la restricción que realmente rige esta medida.',
  findingGa06Title: (s) => `Conteo de puntos cero o negativo en la talla ${s}`,
  findingGa06Detail: (c) => `El conteo de puntos redondeado es ${c}. Un conteo tan pequeño suele significar que el valor base, la muestra o la clave de gradación son incorrectos para esta medida.`,
  findingGa07Title: 'Clave de largo gradada como un ancho',
  findingGa07Detail: (l, k) => `${l} utiliza la clave ${k} (un largo) con el tipo "ancho", lo que reduce el valor a la mitad al gradar. Si esta medida debe ser un largo, establezca su tipo en "largo" o "directo".`,
  findingGa08Title: 'No hay tallas gradadas',
  findingGa08Detail: "Cada medida tiene un valor base de cero, por lo que no se grada nada. Introduzca primero las medidas de la talla base.",
  findingGa08bTitle: 'Patrón de talla única',
  findingGa08bDetail: 'Solo se grada una talla. Los patrones de talla única son una clase común de quejas de los compradores ("¿por qué no está en más tallas?") — los patrones de varias tallas se venden sistemáticamente mejor en Ravelry y Etsy. Considere gradar al menos 3 tallas antes de publicar.',
  findingGa09Title: (p, std, s) => `Valor base un ${p}% por debajo del estándar ${std} ${s}`,
  findingGa09Detail: (v, u, std, s, t) => `Introdujo ${v}${u} para esta medida, pero el valor corporal estándar ${std} para la talla ${s} es ${t}${u}. Una prenda no puede ser más pequeña que el cuerpo que cubre — compruebe si debería ser una clave de gradación de circunferencia, o si el valor base pertenece a una talla diferente.`,
  findingGa09bTitle: (std, s) => `Valor base más del doble del estándar ${std} ${s}`,
  findingGa09bDetail: (v, u, t) => `Introdujo ${v}${u} frente a un valor corporal de ${t}${u}. La holgura explica la desviación, pero no una duplicación — esto suele significar que se introdujo una circunferencia donde corresponde una media anchura (o viceversa).`,
  findingGa10Title: (l) => `Etiqueta de medida duplicada «${l}»`,
  findingGa10Detail: (n, s) => `Esta etiqueta aparece ${n} veces en «${s}». Dos medidas con el mismo nombre confunden tanto a los probadores como a los editores — dé a cada una un nombre distinto (p. ej., «Busto (delantero)» / «Busto (espalda)»).`,
  findingGa11Title: 'Redondeo de vueltas usado pero la muestra de vueltas no está establecida',
  findingGa11Detail: 'Al menos una medida redondea su conteo de vueltas, pero las vueltas/10 cm no están establecidas. Los conteos de vueltas se calcularán con una muestra de cero — cada largo en el patrón es silenciosamente incorrecto. Introduzca la muestra de vueltas antes de publicar.',
  findingGa12Title: 'El patrón tiene una sola sección',
  findingGa12Detail: 'La mayoría de las prendas tienen al menos un cuerpo y mangas. Si este patrón es realmente de una sola pieza (bufanda, cuello), ignore esto; de lo contrario, añada secciones antes de la comprobación final.',
  
  compositionTitle: 'Composición del patrón',
  compositionDescription: 'Reúna las instrucciones escritas, las abreviaturas y las notas de acabado para la publicación final.',
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
  compositionCare: 'Cuidado',
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
  copyForEditor: 'Cotação para o seu editor',
  preEditSummaryHeader: (name) => `RESUMO PRÉ-EDIÇÃO — ${name}`,
  designerLabel: 'Designer',
  baseSizeLabel: 'Tamanho base',
  gaugeLabel: 'Amostra',
  auditScoreLabel: (s, v) => `Pontuação de auto-auditoria técnica: ${s}/100 (${v.toUpperCase()})`,
  alreadyCheckedLabel: 'Já verificado automaticamente (revisão de números):',
  checkedItems: [
    'valididade da amostra',
    'monotonia da progressão de tamanhos em todos os tamanhos gradados',
    'arredondamento de malhas/voltas vs restrições de repetição e paridad',
    'plausibilidade da contagem de malhas em cada tamanho',
    'consistência entre chave de gradação e tipo (largura/comprimento/cirunferência)',
    'valores base vs padrão corporal para o tamanho base',
    'etiquetas duplicadas, completude da amostra de voltas'
  ],
  outstandingItemsLabel: (n) => `Itens pendentes (${n}):`,
  prosePassLabel: 'O que ainda preciso de si (a revisão de texto):',
  prosePassDetails: 'consistência de estilo/abreviaturas, clareza das instruções, ortografia, coerência com gráficos/esquemas.',
  savingsNote: (p) => `Resolva o(s) ${p} problema(s) pendente(s) antes de um editor humano tocar no modelo — cada um que não tiverem de encontrar é tempo faturável poupado.`,
  cleanSavingsNote: 'A revisão de números está limpa — um editor pago pode agora focar-se puramente no texto (estilo, abreviaturas, clareza), que é a metade da fatura que realmente precisa de olhos humanos.',
  marketNotePending: (p, low, high, h, s, sw, d) => `Os editores cobram $${low}–$${high}/h por esta revisão (~${h}h para ${s} ${sw}) e há uma escassez real — os modelos esperam ~${d} dias na fila. Resolva os problemas primeiro para negociar o valor baixo.`,
  marketNoteClean: (low, high, h, s, sw, d) => `Um editor humano cobraria entre $${low} e $${high} pelas mesmas ${h}h de aritmética, a $20–$40/h — e a maioria adicionaria uma taxa por tamanho. A revisão de números é totalmente automatizada; o erro deles é cobrar taxas horárias por aritmética.`,

  findingGa01Title: 'Amostra não definida — todos os números abaixo não são fiáveis',
  findingGa01Detail: 'Defina as malhas/voltas por 10 cm na amostra do projeto. Um editor técnico não pode verificar os cálculos sem isso, nem um testador. Este é o primeiro item em qualquer lista de verificação pré-auditoria.',
  findingGa02Title: 'A medida base é negativa',
  findingGa02Detail: (v) => `O valor base ${v} est negativo. As medidas devem ser positivas — não se pode tricotar uma largura ou comprimento negativo.`,
  findingGa02bTitle: 'A medida base é zero — excluída da gradação',
  findingGa02bDetail: 'Um valor base zero exclui esta medida de todos os tamanhos graduados. Se isto for intencional (ex. um painel decorativo), está bem; caso contrário, insira o valor do tamanho base.',
  findingGa03Title: 'A progressão de tamanhos não é monótona',
  findingGa03Detail: (s, v, u) => `Os valores físicos em ${s} são: ${v} ${u}. As dimensões da peça devem crescer (ou manter-se estáveis) com o tamanho — verifique se a chave de gradação ou o tipo desta medida estão corretos.`,
  findingGa04Title: (p, s) => `Contagem de malhas desviada ${p}% do objetivo bruto (${s})`,
  findingGa04Detail: (r, raw) => `Arredondado para ${r} malhas vs ${raw} brutas. A restrição de repetição/paridade do padrão de malha está a afastar a contagem da medida objetivo — verifique o ajuste final neste tamanho.`,
  findingGa04bTitle: (p, s) => `Contagem de voltas desviada ${p}% do objetivo bruto (${s})`,
  findingGa04bDetail: (r, raw) => `Arredondado para ${r} voltas vs ${raw} brutas. A tolerância do comprimento costuma ser flexível, mas avise se a medida for crítica (ex. profundidade da cava).`,
  findingGa05Title: (r) => `Uma repetição de malhas de ${r} não tem efeito`,
  findingGa05Detail: (r) => `Uma repetição de ${r} arredonda para o número inteiro mais próximo como se não houvesse repetição. Defina o múltiplo real do padrão de malha (ex. 6 para um painel de tranças de 6 malhas) ou limpe-o.`,
  findingGa05bTitle: 'O resto das malhas é inválido para a repetição',
  findingGa05bDetail: (rem, rep) => `O resto ${rem} está fora do intervalo válido 0…${rep - 1} para uma repetição de ${rep}. As contagens válidas seriam …${rep + rem}, ${2 * rep + rem}, …`,
  findingGa05cTitle: 'Paridad e repetição definidas — a paridade ganha',
  findingGa05cDetail: 'Quando ambas estão definidas, a paridade tem precedência. Mantenha a restrição que realmente rege esta medida.',
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
  findingGa09bDetail: (v, u, t) => `Introduziu ${v}${u} vs um valor corporal de ${t}${u}. A folga explica o desvio, mas não uma duplicação — isto costuma significar que foi introduzida uma circunferência onde pertence uma meia largura (ou vice-versa).`,
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
  compositionFinishing: 'Acabado',
  compositionCare: 'Cuidados',
  compositionTermPlaceholder: 'Termo',
  compositionDefPlaceholder: 'Definição',
  compositionAddAbbreviation: 'Adicionar abreviatura',
  compositionAddTerm: 'Adicionar termo',
  compositionSectionOrder: 'Ordem das secções',
  compositionDeleteSection: 'Eliminar secção',
  compositionDeleteStep: 'Eliminar passo',
  compositionDeleteTerm: 'Eliminar termo',
};

export const COPY: Record<LanguageCode, TechEditCopy> = {
  en, de, fr, es, pt
};

export const TECH_EDIT_COPY = COPY;
