# CHK-213 — Soothing recognition: independent Pass 2 design stress test

**Status:** Research-only complete. **No application code, copy module, storage schema, queue implementation item, or UI behavior was changed before this note was written.**

**Source audited:** `fea34f15b9f4514a503a0f61224723fb3c92283b` (`origin/main` at the start of this pass).

**Binding sources:**

- `docs/research/soothing-recognition-gamification-2026-08-22.md`
- `docs/leader-notes/cycle-2026-08-22-CHK-212-soothing-recognition-pass1.md`
- `docs/queue/work-queue.md`
- `src/lib/storage-lib.ts`
- Current workflow source paths named in the Pass 1 note

## Executive decision

Pass 2 confirms that recognition can support the product goal, but only as a **quiet acknowledgment of a verified craft-control fact**. It must not become a retention system, a progress scoreboard, a claim about publication, or a reward for repeated usage.

The smallest viable first touchpoint is:

> **First clean grade:** recognize a newly observed `ready` grading result for the current project, after the existing integrity preflight has passed, using calm copy that says exactly what the app computed and asks nothing of the maker.

The first implementation must not include counters, streaks, a “completed” percentage, sound, confetti, modal interruption, social sharing, or export recognition. It should be a dismissible, accessible, private, localized toast or inline acknowledgment. It must be possible to turn the recognition layer off in Settings without changing grading, export, or project data.

## Pass 2 design-principle stress test

The following table applies every non-negotiable principle from the binding brief to every surviving or previously proposed touchpoint. “Survives” means suitable for a future, separately queued implementation; it does not authorize implementation in this research pass.

| Touchpoint | 1. Milestone-only | 2. No loss | 3. Private by default | 4. Already-computed truth | 5. Opt-out | 6. No urgency/FOMO | 7. Five locales | 8. Local-first | 9. Accessible/non-blocking | Decision |
|---|---|---|---|---|---|---|---|---|---|---|
| First clean grade (`ready`) | Yes; event is a result, not time or frequency | Yes; permanent fact, no reset | Yes; no share action | Yes, if keyed only to a genuine current `ready` result after preflight; never to render or attempt | Yes; global setting can silence acknowledgment without deleting evidence | Yes; no return request or next target | Copy drafted below for `en/de/fr/es/pt` | Yes; project-scoped local ledger | Yes; quiet toast/inline region, dismissible, no modal | **Survives as first implementation candidate** |
| First PDF print handoff | Yes, but the event is operational rather than craft completion | Yes | Yes | **No for “export succeeded”:** `openPrintWindow` proves acceptance of a print surface, not save; `afterprint` can include cancel | Possible | Yes | Possible | Yes | Yes | **Exclude until print outcome is truthful; if ever used, call it “print handoff prepared”** |
| Nth distinct project graded | Yes in form, but volume pressure risk is high | Yes | Yes | **No current durable distinct-project clean-grade counter** | Possible | Could drift toward “keep going” pressure | Possible | Yes | Possible | **Exclude from first release; do not add a counter merely for engagement** |
| First inclusive-sizing audit | Yes if framed as an audit result, not a grade | Yes | Yes | **Only partly:** analyzer output is computed, but completion/acceptance is not a durable event; do not claim inclusive grading | Possible | Yes | Possible | Yes | Yes | **Future candidate only after an explicit truthful audit outcome exists** |
| First Project Book print handoff | Yes, but not a saved export | Yes | Yes | **No for “export succeeded”:** renderer creates print-ready HTML and `bookReady` means print preparation | Possible | Yes | Possible | Yes | Yes | **Exclude until outcome semantics improve; never call it a saved PDF** |
| Onboarding finished or dismissed | Yes; one transition, not a schedule | Yes | Yes | **Yes only with soft wording:** the durable flag also represents skip, sample, and create-own exits | Yes | Yes | Possible | Yes | Yes | **Future candidate; wording must say “welcome step finished or dismissed,” never “setup complete”** |
| Explicit human-review record | Yes; a user-recorded control event | Yes | Yes | Potentially yes if the record is explicit and durable; viewing a panel is insufficient | Possible | Yes | Possible | Yes | Yes | **Strong future candidate, more aligned than an arbitrary count** |
| Explicit publication-package handoff | Yes; an operational handoff | Yes | Yes | Potentially yes if the package state is durable; must not claim publication or market release | Possible | Yes | Possible | Yes | Yes | **Future candidate after precise copy and outcome semantics** |

### Principle-level stress conclusion

The first-clean-grade candidate passes all nine principles only under a narrow trigger: the app observes a real `ready` result for the current project, after the same integrity checks that make the result trustworthy. The event must not be created by opening the lab, rendering a result, clicking re-run, seeing `review`, seeing `blocked`, or editing a project without running the grading path.

The export touchpoints fail the truth test at the current print boundary. The inclusive-sizing touchpoint fails the completion-semantics test until the app can distinguish an observed analyzer result from an accepted audit. The Nth-pattern idea fails the necessity and pressure test and has no current durable source. Onboarding and explicit human-review/publication handoff remain possible, but they are not the smallest first implementation.

## Smallest viable five-locale copy draft

These are draft strings only. They are intentionally not written into an application copy module during Pass 2. The `{count}` interpolation must use the actual number of sizes in the `ready` result; it must not be invented or silently rounded.

### English (`en`)

- `cleanGradeTitle`: **First clean grade**
- `cleanGradeBody(count)`: **This set is Ready across {count} sizes. A quiet checkpoint: the numbers line up. Nothing else is required.**
- `cleanGradeDismiss`: **Dismiss**

### German (`de`)

- `cleanGradeTitle`: **Erste saubere Gradierung**
- `cleanGradeBody(count)`: **Dieser Satz ist für {count} Größen als „Bereit“ eingestuft. Ein ruhiger Meilenstein: Die Zahlen stimmen. Du musst nichts weiter tun.**
- `cleanGradeDismiss`: **Schließen**

### French (`fr`)

- `cleanGradeTitle`: **Première gradation validée**
- `cleanGradeBody(count)`: **Cette série est « prête » pour {count} tailles. Un repère discret : les chiffres s’alignent. Rien d’autre n’est requis.**
- `cleanGradeDismiss`: **Fermer**

### Spanish (`es`)

- `cleanGradeTitle`: **Primera gradación limpia**
- `cleanGradeBody(count)`: **Este conjunto está « listo » para {count} tallas. Un punto de referencia tranquilo: los números encajan. No tienes que hacer nada más.**
- `cleanGradeDismiss`: **Cerrar**

### Portuguese (`pt`)

- `cleanGradeTitle`: **Primeira graduação limpa**
- `cleanGradeBody(count)`: **Este conjunto está « pronto » para {count} tamanhos. Um marco discreto: os números estão alinhados. Não é preciso fazer mais nada.**
- `cleanGradeDismiss`: **Fechar**

### Copy review

The draft uses the product’s existing factual register and repeats the computed verdict instead of claiming that the pattern is publishable, profitable, technically perfect, or finished. “Nothing else is required” refers only to the acknowledgment itself; it does not waive existing review, export, or publication gates. The UI should retain the existing `ready` explanation and flags beneath or beside the acknowledgment.

A production copy module would need to match the existing `LanguageCode` and `*-copy.ts` convention, pass the repository’s locale-parity tests, and be reviewed by a fluent speaker before release. This note is not that implementation.

## Local-first storage-schema sketch

This is a design sketch only. It follows `storage-lib.ts`’s `projectStorage` / `useProjectStorageState` seam and deliberately avoids a new persistence architecture.

```ts
// Project-scoped source-of-truth, stored through
// useProjectStorageState(projectStorage('recognition', project.id, ...))
type RecognitionKind = 'first-clean-grade';

type RecognitionEvent = {
  id: string; // deterministic: `${kind}:${sourceFingerprint}`
  kind: RecognitionKind;
  earnedAt: string; // ISO timestamp recorded when the event is observed
  sourceFingerprint: string; // publicationSourceFingerprint(project) at observation
  sizeCount: number; // copied from the ready result; never recomputed for display
  acknowledgedAt: string | null;
};

interface ProjectRecognitionStateV1 {
  version: 1;
  events: RecognitionEvent[]; // one event per kind + source fingerprint
}

// App-level preference, persisted with existing SettingsContext storage.
interface RecognitionPreferences {
  recognitionEnabled: boolean; // default true; opt-out without deleting events
}
```

### Schema rules

1. The event is written only after a genuine `ready` result is returned by the existing grading workflow and only once for the same project source fingerprint. A render, button click, `review`, or `blocked` result cannot write it.
2. The source fingerprint binds the acknowledgment to the project data that produced the result. If project source changes, a later clean grade may create a new event; an old acknowledgment is never rewritten to imply that the changed source was graded.
3. `acknowledgedAt` is presentation bookkeeping, not proof of grading. If it is absent, the UI may offer the private acknowledgment once; if it is present, the UI remains quiet. Dismissing the acknowledgment does not delete the event or downgrade the grade.
4. No global count, rank, streak, deadline, “next milestone,” or cross-studio field exists in V1. The app can derive whether the maker has any first-clean-grade event from project-scoped state without creating a pressure economy.
5. `recognitionEnabled` controls only the acknowledgment layer. Turning it off must preserve projects, grading results, exports, and recognition event evidence.
6. The schema contains no server endpoint, account identifier, social field, or remote analytics requirement. It is local-first and compatible with future storage migration through the existing seam.
7. Malformed or unknown recognition state must normalize to an empty event list and never block the project workspace. Unknown future event kinds should be ignored rather than displayed with invented copy.
8. The future implementation must add focused tests for the `ready`-only trigger, source-change separation, opt-out preservation, malformed-state normalization, duplicate suppression, locale parity, and keyboard/screen-reader dismissal.

## Narrow implementation recommendation after this note

Only now that Pass 2 is complete may a numbered implementation item be opened. It should be scoped to **first clean grade only**, not a system-wide rollout:

- Add the copy module and all five locales.
- Add the minimal project-scoped state through `useProjectStorageState` plus the existing Settings preference seam.
- Emit a non-blocking, accessible acknowledgment only after a newly observed clean `ready` result.
- Do not touch PDF, Project Book, Brag Card, Receipt Lab, Nth-pattern counters, or onboarding recognition in that implementation item.
- Add focused tests first and retain a feature-off path.

## Pass 2 decision

**Research-only outcome:** the recognition concept survives in a narrow form. The first clean grade is the only current candidate recommended for a future first implementation. Export-related recognition, volume counters, and inclusive-sizing recognition are not implementation-ready. Onboarding and explicit human-review/publication handoffs require separate future decisions.

**Implementation hold released only for queueing, not for coding:** the next queue edit may open a single narrow implementation item after this note is committed. No application code should be written in this Pass 2 firing.

**Protected files:** `/home/ubuntu/first_novel_invention_brief.md` and all product-goal documents were not modified.

**Verification scope:** This note is a research artifact. It does not claim that the app has a recognition system, durable recognition state, saved-PDF proof, or publication readiness.

---

*Prepared as an independent design-stress and copy/schema artifact, not an implementation specification.*
