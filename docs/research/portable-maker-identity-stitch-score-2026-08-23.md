# Portable Maker Identity — Stitch Score, Brag-ables & Profile-ables — Research Brief

**Owner directive, 2026-08-23.** Compiled by Claude (PM) at the owner's request. This is a **research document, not an implementation spec.** See the Directive section before doing anything else.

---

## 1. Directive (read this first)

The owner's request, restated precisely for unambiguous execution:

> Design a structured, honest, non-manipulative system for maker identity within Stitch & Scale — a "Stitch Score" (not a streak), brag-able facts, and profile-able identifiers — that is computed and stored **entirely locally, inside this app**, but designed from the ground up to be **exportable/portable data** that a maker could later carry to a *separate* community site (not built yet, not part of this codebase). **Stitch & Scale itself gains no community, social, account, or server features from this work** — it only needs to produce well-structured, trustworthy data that could feed one later.

**Binding constraints on how this directive is worked, identical in spirit to the soothing-recognition directive it extends:**

1. **Do not implement anything from this document yet.** Research-only ticket.
2. **Two independent research passes, on two separate scheduled firings**, before any implementation ticket opens. Each pass re-derives conclusions from live code at current HEAD, not from this document's cached assumptions.
   - **Pass 1:** re-verify §5 (current-state audit) against live HEAD, and — critically — investigate and report back on §6.2 (the verifiability problem) with a concrete, buildable recommendation. This is the single hardest open question in this brief and Pass 1 should not skip it in favor of the easier parts.
   - **Pass 2:** design the actual `StitchIdentityV1` data shape (building on the versioned-schema pattern `recognition.ts` already establishes), draft what facts and score components are legitimate signal per §6.1, and produce a concrete export flow sketch (reusing the `grading.export_csv` / `export.brag_card` conventions already shipped). Still stop short of application code.
   - Log each pass as its own `docs/leader-notes/cycle-*.md` entry.
3. **Only after Pass 2** should a numbered implementation ticket be opened, scoped narrowly.
4. **Non-goals, stated up front:**
   - No accounts, no login, no server, no sync, no in-app social features of any kind. This app's local-first, nothing-uploaded promise (reinforced by the CHK-149 onboarding truth audit) is not being changed by this work.
   - No leaderboard *inside* this app. Whether a future separate site builds one is that site's decision, made by whoever builds it, with its own data.
   - No comparison-to-others anywhere in this app's own UI.
   - This is not a request to build the community site. It is a request to make this app's data *good enough* that a community site could be built later without needing to ask makers to re-earn everything from zero.

---

## 2. Why "portable, not embedded" changes the design problem

Every constraint from the earlier soothing-recognition brief still applies (Self-Determination Theory framing, no loss states, no streaks, milestone-only, honest-by-construction) — this document does not repeat those, it adds to them. The new constraint is specific: **data that is computed and stored entirely client-side, with no server ever validating it, and that is *designed to leave the device* and be presented somewhere else, has a trust problem the soothing-recognition work never had to solve.** A private in-app toast that says "you graded your first pattern" only has to be honest to the maker who already knows the truth. An exported "Stitch Score" that might one day sit on a community profile page, next to other makers' scores, has to be honest to *strangers who cannot verify it themselves.*

This is the central design tension of the whole brief, and it is worth stating plainly: **anything computed 100% client-side and exported as plain data is, by construction, editable by anyone with a text editor before it's ever uploaded anywhere.** That is not a hypothetical edge case — it is the default state of any local-first export, and it must be designed for honestly rather than glossed over.

---

## 3. Grounding research (external)

**On score/reputation gaming in general:** the literature on reputation-system manipulation (eBay's seller-reputation exploitation after history resets; Stack Overflow's documented voting-ring reputation fraud, formally studied across nearly 1,700 Meta Stack Exchange posts) converges on a few durable defenses that are directly relevant even though this app's score has no peer-voting component: **keep the scoring rules public and legible** ("people do not need to read the code behind a scoring model, but they need to understand the principles — what counts, what gets discounted, what can be appealed"), and **weight consistency over bursts** ("manipulation almost always shows up in bursts"). Applied here: a Stitch Score formula should never be a hidden black box, and it should resist being inflated by a burst of low-effort actions (e.g., regrading the same simple pattern five times in one sitting) — it should reward the kind of activity `recognition.ts` already deliberately scopes tightly (`isEligibleFirstCleanGrade` requires a `ready` verdict, a real graded size count, and zero flags — not just "an attempt was made").

**On making client-computed, exported data actually trustworthy:** this is where the research points to a specific, mature, real-world answer rather than a novel invention. The **Open Badges 3.0 standard** (1EdTech Consortium, built on the **W3C Verifiable Credentials Data Model**) exists precisely to solve "portable achievement data that a stranger can trust without calling back to the original issuer's server." <cite index="37-1">The verifier reads the signed credential directly, checks the signature against the issuer's published public key, and confirms authenticity offline — the issuer's server can disappear and the credential still verifies.</cite> The mechanism is straightforward: <cite index="40-1">the issuer signs each badge with a private key it alone holds; the matching public key lives in a small public file, and anyone can fetch it to confirm a badge is genuine without calling the issuing platform's servers.</cite> Critically for a local-first app with no central server, <cite index="39-1">an Open Badge is portable because the earner owns it and can move it freely across platforms, with structured achievement data baked directly into the credential rather than living only inside one app.</cite>

This maps almost exactly onto Stitch & Scale's situation, with one adaptation Pass 1 needs to investigate: there is no central "Stitch & Scale server" to act as a traditional issuer with a stable, publicly-hosted key. The closest honest analog is a **self-issued, device-local keypair** (generated once, kept in local storage, never leaves the device except as the exported public key) — this proves *internal consistency* (the exported history was genuinely produced incrementally by that installation over time, signed as it went, not fabricated in one sitting right before export) even without a trusted third party vouching for the app's identity. This is weaker than a real Open-Badges-style institutional issuer, but it is a real, known pattern (closely related to `did:key`-style self-sovereign identity) and is meaningfully stronger than the app's current fingerprinting.

---

## 4. Why the current fingerprint mechanism is not sufficient (and must not be assumed to be)

`recognition.ts` already reuses `publicationSourceFingerprint()` from `publication-integrity.ts` to tie a recognition event to a source snapshot. **This is not a security or authenticity mechanism and must not be treated as one for the Stitch Score work.** Confirmed by reading it directly: `publicationSourceFingerprint()` is a plain `JSON.stringify()` of selected project fields — its stated purpose is *change detection* ("has the source changed since a human approved it"), not tamper-evidence. Anyone editing their local IndexedDB (or a JSON export) can produce a fingerprint that matches arbitrary fabricated data, because the "fingerprint" is just a deterministic re-serialization of whatever data is handed to it — it contains no secret, so there is nothing to check it against. Pass 1 should confirm this reading is still accurate at current HEAD, and Pass 2 should not reuse this function for any purpose beyond what it already does (post-approval source-change detection).

---

## 5. Current-state audit (hypothesis — Pass 1 must verify against live HEAD)

- `recognition.ts` / `recognition-copy.ts`: a versioned (`RECOGNITION_SCHEMA_VERSION`), fail-closed, single-milestone-kind (`first-clean-grade`) system, **scoped per-project**, storing `RecognitionEvent[]` with a strict normalizer that discards anything malformed rather than trusting it. This is the correct foundation to extend — a Stitch Score needs a **per-maker, cross-project** aggregate layer on top of this, not a replacement for it.
- No existing cross-project aggregation exists yet (confirmed no reference to a maker-level total anywhere in `recognition.ts`) — this is the actual gap a Stitch Score fills.
- `grading.export_csv` (MCP, shipped) and `export.brag_card` (MCP + in-app Brag Cards, shipped) are the two existing, proven export conventions to build on — one for structured tabular data, one for a shareable visual artifact. A "Stitch Identity Export" plausibly wants both: a structured JSON/CSV export (for a future site to ingest) and a shareable card (for a maker to post a "brag-able" screenshot today, even before any community site exists).
- `publication-integrity.ts`'s `publicationSourceFingerprint()` — confirmed a plain re-serialization, not a cryptographic mechanism (§4).

---

## 6. Open questions Pass 1 and Pass 2 must resolve

### 6.1 — What should actually count? (legitimate signal vs. gameable volume)

A Stitch Score should be built from facts that are hard to inflate through repetition, mirroring how `isEligibleFirstCleanGrade` already deliberately excludes anything short of a clean, real, sized grade. Candidate signal categories to evaluate (not a final list — Pass 2's job):

- Distinct clean-graded patterns (not attempts, not re-grades of the same source)
- Size-inclusive grading practice (breadth of sizes actually graded, not just claimed)
- Tenure/consistency signals that are explicitly **not** streak-shaped (e.g., "graded patterns across N distinct months" rather than "N consecutive days") — this distinction matters and should not be blurred in implementation
- Real exports actually produced (PDF, Project Book) — an artifact that left the workspace, not just a button click
- Explicitly excluded: raw counts that reward repetition of trivial actions, anything from the ~80 business-lab calculators (advisory tools, not achievements — see the earlier soothing-recognition brief's §5 reasoning, which still applies), anything requiring third-party/community data this app doesn't have

### 6.2 — The verifiability problem (the hard one — see §3)

Pass 1 must produce a concrete recommendation, not just restate the problem. Candidates to evaluate, roughly in order of ambition:

1. **Do nothing cryptographic; be transparent instead.** Export the data plainly, clearly labeled "self-reported," and let any future community site decide how (or whether) to weight self-attested data. Simplest, most honest-by-omission, zero new complexity — but the weakest brag-able, since anyone could hand-edit a JSON file.
2. **Device-local signing keypair** (§3's Open-Badges-inspired adaptation). Meaningfully stronger — proves the exported history was built incrementally by one real installation over time — without needing any server or institutional issuer identity. Real implementation cost (key generation, storage, signing on each event, a verifier the future site would need to implement) that Pass 1 should size honestly rather than assume is trivial.
3. **Full Open Badges 3.0 / Verifiable Credentials compliance.** Maximum interoperability (works with any Open-Badges-compatible wallet/display, not just a bespoke future site) at meaningfully higher implementation cost and complexity than this app's current architecture carries anywhere else. Worth Pass 1 at least evaluating as the "if we're going to do this right" ceiling, even if the eventual recommendation is a lighter-weight subset.

### 6.3 — What is a "profile-able" vs a "brag-able" vs the "Score" itself?

The owner's framing distinguishes several related-but-different things worth keeping conceptually separate in the eventual data shape: **profile-ables** (durable facts about a maker — patterns graded, techniques covered, member-since date), **brag-ables** (specific, shareable moments — closer to what Brag Cards already does, just extended beyond financial stats), and **the Stitch Score** itself (a single legible, documented, hard-to-inflate summary number or tier). Pass 2 should propose a data shape that keeps these three as distinct, separately-exportable pieces rather than collapsing them into one opaque blob — a future community site might want to display profile-ables and brag-ables prominently while treating the Score as secondary, or vice versa, and that choice shouldn't be foreclosed by how this app structures the export.

---

## 7. Sources

- HackerNoon, "Why Ecosystem Reputation Systems Get Gamified and How to Prevent It" — legibility and consistency-over-bursts as core anti-gaming principles.
- Mazloomzadeh, Uddin, Khomh & Sami, "Reputation Gaming in Stack Overflow" (arXiv 2111.07101) — documented voting-ring and reputation-fraud patterns in a real, large-scale peer-reputation system; used here for the general manipulation-resistance principles, even though this app's score has no peer-voting surface.
- 1EdTech / IMS Global, Open Badges 3.0 Specification and Implementation Guide — the real-world standard for portable, cryptographically verifiable, server-independent achievement credentials; the primary technical grounding for §3 and §6.2.
- W3C Verifiable Credentials Data Model 2.0 — the underlying data model Open Badges 3.0 is built on.
- Internal: this document extends `docs/research/soothing-recognition-gamification-2026-08-22.md` (SDT/dark-pattern grounding, non-goals around streaks/loss states — not repeated here) and is grounded in direct reads of `recognition.ts`, `recognition-copy.ts`, and `publication-integrity.ts` at current HEAD.

---

## 8. What Pass 1 and Pass 2 should each produce

- **Pass 1 output:** updated §5 against live HEAD, plus a concrete, sized recommendation for §6.2 (one of the three options, or a documented alternative, with honest effort/complexity notes — not just "option 2 sounds nice"). Log as `docs/leader-notes/cycle-<date>-<chk>-stitch-identity-pass1.md`.
- **Pass 2 output:** the `StitchIdentityV1` data shape sketch (versioned, following the `recognition.ts` pattern), a concrete list of what counts per §6.1, and an export-flow sketch reusing the `grading.export_csv` / `export.brag_card` conventions. Log as `docs/leader-notes/cycle-<date>-<chk>-stitch-identity-pass2.md`. Only after this log lands should a numbered `QUEUE-` implementation item be opened, scoped to the smallest viable first piece (plausibly: the data shape and local storage, with export deferred to a later ticket).
