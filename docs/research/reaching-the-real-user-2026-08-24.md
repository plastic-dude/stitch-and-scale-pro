# Reaching the Real User — MCP Discoverability, Accessibility, and Cross-Device Continuity

**Owner directive, 2026-08-24.** Compiled by Claude (PM) at the owner's request, after a full-project review. This is a **research document, not an implementation spec.** See the Directive section before doing anything else.

---

## 1. Directive (read this first)

The owner asked for an honest assessment of what a full project review surfaces as valuable and currently uncaught. Three findings below are each independently verified against live code (not assumed), and are grouped here because they share a pattern: **real, working engineering investment that doesn't yet reach the actual user it was built for.**

**Binding constraints, same discipline as every prior directive in this file:**

1. **Do not implement anything from this document yet.**
2. **Two independent research passes, on two separate scheduled firings**, before any implementation ticket opens for any of the three findings below.
   - **Pass 1:** re-verify all three findings' current-state claims (§3, §4, §5) against live HEAD — this document was written from a real but necessarily partial review, and enough time may have passed that some of this has already changed.
   - **Pass 2:** for whichever finding(s) Pass 1 confirms are still open, produce a concrete, narrowly-scoped design for the smallest viable first step — not a full solution to all three at once.
   - Log each pass as its own `docs/leader-notes/cycle-*.md` entry.
3. **Only after Pass 2** should a numbered implementation ticket be opened, and it should address one finding at a time — these three are related by theme, not by implementation, and mixing them into one ticket would make review harder, not easier.
4. **Non-goals:** this document does not mandate solving all three. Pass 1 may find that one or more no longer applies, or that the fix is smaller or larger than estimated here — report that honestly rather than forcing a ticket to exist for its own sake.

---

## 2. Why these three, together

Every one of the recent audit cycles (localization, mobile resilience, security, MCP hardening, storage protection) has been rigorous and has genuinely improved the product. These three findings aren't about quality of work — they're about a blind spot in *where the audits pointed*: consistently at the code's correctness, rarely at whether the intended user can actually reach what was built. That distinction is the throughline connecting an MCP layer only a developer can configure, an app with real accessibility gaps for a stated elderly audience, and a local-first architecture with no real story for a maker's own phone-to-laptop workflow.

---

## 3. Finding 1 — The MCP layer is functionally invisible to real users

**Verified directly, not assumed:** `mcp-grading-assistant-card.tsx` — the only in-app surface referencing MCP at all — was read in full. It calls `copyToClipboard` on a prepared text brief and nothing else. It never displays the live `/api/mcp` endpoint URL, never mentions `MCP_API_KEY`, never explains how to add a custom connector in Claude (or any other MCP-aware AI client). The actual, tested, production MCP server — resources, prompts, `grading.compare_standards`, `grading.export_csv`, the whole trust-boundary design built and hardened across this project's own history — is reachable today only by whoever has direct access to the Vercel dashboard's environment variables. That is the owner. It is not the target user.

This means a genuinely good, safe, well-designed product capability (AI orchestrates intent, the deterministic engine does the math — the exact positioning this project has repeatedly reaffirmed) currently has no path to the person it was built for.

**What Pass 2 should design, if Pass 1 confirms this is still open:** not a full self-service API-key-management system necessarily (that has real complexity and security implications of its own — sizing that honestly is Pass 2's job, not this document's). At minimum, the in-app card should be honest about what MCP actually is and how a technically-inclined maker (or the owner, for now) could set it up, rather than silently only offering the copy-paste-brief path as if it were the only option.

---

## 4. Finding 2 — No accessibility (WCAG) work exists, despite the stated audience

**Verified directly:** searched the entire `docs/` tree for anything accessibility-related — zero results. No screen-reader pass, no color-contrast audit, no keyboard-navigation review, no font-scaling check. Compare this to the real, repeated investment in every other audit dimension: multiple dedicated "Localization Brutality" passes ensuring all 5 locales are complete, dedicated mobile-resilience and security hardening cycles, a whole MCP-specific security audit thread. Accessibility has had none of that attention, despite "elderly, non-technical makers" being named explicitly and repeatedly as core audience across the two most recent owner directives in this same file (the soothing-recognition and device-permissions briefs).

This isn't a claim that the app is currently inaccessible — that would require the audit this document is recommending, not assumed. It's a claim that **the absence of any audit, for the one audience dimension named most explicitly and most often, is itself the gap.**

**What Pass 2 should design, if Pass 1 confirms this is still open:** the smallest viable first accessibility pass — plausibly, an automated baseline (axe-core or equivalent) run against the core grading/export flow, the same flow every other audit in this project has treated as the trust-critical path, rather than an attempt to audit all ~80 tabs at once.

---

## 5. Finding 3 — No real cross-device continuity for a working designer

**Verified directly:** `origin-migration.ts` was read in full. It solves a genuinely different problem than the one this finding is about — moving local data when the app's *hosting domain* changes (same device, new URL), which matters given this project's own history of alias confusion between `stitch-and-scale-pro.vercel.app` and `stitch-and-scale-pro-api-server.vercel.app`. It does not solve, and was never meant to solve, a maker moving between their own phone and laptop. `exportData`/`importData` in Settings exist and are real, but they're framed and discoverable as backup/restore, not as "keep my devices in sync" — a designer would need to already know this mechanism exists and manually shuttle a JSON file themselves, with no in-app nudge that this is even a thing to do.

This is a direct, structural consequence of the local-first, no-server, no-accounts architecture this project has correctly and deliberately chosen for trust reasons — it is not a bug, and the fix should not compromise that architecture. But a real working designer plausibly grades on a phone between other tasks and finalizes exports at a desktop, and today that workflow has no supported path.

**What Pass 2 should design, if Pass 1 confirms this is still open:** not a server-based sync system (that would be a much larger architectural decision, and isn't what's being asked for here). More plausibly: whether the existing export/import mechanism can be surfaced and framed as a deliberate "move to another device" action, discoverable at the moment it would matter, without adding any new server dependency.

---

## 6. A fourth, lighter note — not a research mandate

No monetization mechanism for Stitch & Scale itself was found anywhere in the codebase — the ~80 business-lab calculators all compute *the user's own* pricing and revenue, none touch the app's own sustainability. This may be entirely intentional and outside this codebase's scope (a decision that plausibly belongs at the Emlux/product level, not the queue). It's recorded here for completeness, not as something Pass 1 or Pass 2 need to act on.

---

## 7. What Pass 1 and Pass 2 should each produce

- **Pass 1 output:** confirmation (or correction) of Findings 1–3 against live HEAD — has anything changed since 2026-08-24? Log as `docs/leader-notes/cycle-<date>-<chk>-reaching-real-user-pass1.md`.
- **Pass 2 output:** for each finding Pass 1 confirms is still open, the smallest viable first-step design (not a full solution) — sized honestly, the way this project's own research briefs have consistently done. Log as `docs/leader-notes/cycle-<date>-<chk>-reaching-real-user-pass2.md`. Only after this log lands should numbered `QUEUE-` implementation items be opened — one per finding, not combined.
