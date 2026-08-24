# Device Permissions — What's Actually Good for Our Users

**Owner directive, 2026-08-23.** Compiled by Claude (PM) at the owner's request. This is a **research document, not an implementation spec.** See the Directive section before doing anything else.

---

## 1. Directive (read this first)

The owner's request, restated precisely: audit which browser/device permissions Stitch & Scale should request — notifications named explicitly, "and more" — and recommend what's genuinely good for our users, not just technically possible.

**Binding constraints, same discipline as the two prior directives this extends:**

1. **Do not implement anything from this document yet.**
2. **Two independent research passes, on two separate scheduled firings**, before any implementation ticket opens.
   - **Pass 1:** re-verify §3 (current-state audit) against live HEAD, and confirm §5.1's central architectural finding — that true push notifications require a server this app doesn't have — still holds (browser/OS support shifts fast; re-check rather than trust this document's date-stamped research).
   - **Pass 2:** design the actual permission-request UX for whichever items in §5 are recommended (reusing `install-banner.tsx`'s existing contextual-priming pattern rather than inventing a new one), draft the priming copy in all 5 locales, and produce a concrete list of *trigger moments* (the specific user action that should precede each prompt). Still stop short of application code.
   - Log each pass as its own `docs/leader-notes/cycle-*.md` entry.
3. **Only after Pass 2** should a numbered implementation ticket be opened, scoped to one permission at a time — never request more than one new permission in the same release.
4. **Non-goals:** no permission should ever be requested at first launch or during onboarding, before the user has done anything that would make the reason obvious. No permission is ever required to use the app's core function (grading and export must work fully with every optional permission denied). This is not a request to build push-notification infrastructure — see §5.1 before assuming notifications means push.

---

## 2. Why this deserves real research, not a checklist

A permission prompt is the single highest-friction moment a web app can put in front of a user, and the research is unusually consistent on why: contextual, in-app framing works and blind upfront requests don't. <cite index="1-1">Apps that defer permission prompts until they're contextually relevant see up to a 28% higher grant rate than those requesting upfront, and studies show over 82% of users want a clear reason before granting access.</cite> The web-specific version of this finding is even sharper: <cite index="12-1">a large-scale analysis of permission interactions across 100 million Chrome installations found that geolocation and notification prompts are often ignored on the web specifically, while contextual information measurably increases the likelihood of granting.</cite> Google's own guidance is direct about the bar to clear: <cite index="15-1">you should only request the capabilities you need to provide value where users are likely to agree they'll find value, and ask for permission when it's apparent to the user why the capability is helpful.</cite>

For this app's specific userbase — makers who skew toward spreadsheet habits and, per the owner's own framing in the adjacent Stitch Score work, include elderly and non-technical users — a denied or ignored permission prompt isn't a neutral non-event. It's a moment where the app asked for something the person didn't understand, which is corrosive to exactly the trust this app has otherwise built carefully (the onboarding truth audit, the "nothing uploaded" promise, the plain honest verdict language). Every permission request considered below is judged against that bar: not "can we," but "would a first-time user immediately understand why, and would saying no cost them nothing."

---

## 3. Current-state audit (hypothesis — Pass 1 must verify against live HEAD)

- **No `Notification` API usage anywhere.** Confirmed by direct grep — `use-pwa-lifecycle.ts` and `main.tsx` reference `navigator.serviceWorker`, but only for PWA update-lifecycle detection (is a new app version installed), never for notification permission or delivery.
- **No `navigator.storage.persist()` call anywhere.** This is the API that protects IndexedDB from silent eviction under device storage pressure. Its absence is a real, load-bearing gap: this app's entire trust promise is "your patterns and grading data live on this device," and without requesting persistent storage, the browser is free to quietly evict that data if the device runs low on space — especially plausible on older phones, which skews toward exactly the elderly-user segment this app is trying to serve well.
- **`navigator.clipboard` already in use** (`clipboard.ts`), backing the "Copy TSV/CSV" buttons. Clipboard write access in response to a direct user click (not read, not background) requires no permission prompt in any current browser — this is already correctly scoped and needs no further work.
- **File inputs already in use** in multiple places (`assets-panel.tsx`, `import-csv.tsx`, `settings.tsx`, etc.) — standard `<input type="file">` elements. These do not require a browser permission grant at all; the user's OS-level file picker is the only gate. Worth stating plainly so this is never confused with a "permission" the app needs to request.
- **`install-banner.tsx` / `use-pwa-install.ts` / `install-banner-copy.ts`** — a real, already-shipped precedent for exactly the right pattern: the app's own UI explains the value ("install for faster access," with an iOS-specific manual-install guide since Safari doesn't support the native install prompt) *before* handing off to any OS-level flow, and has a cooldown so it doesn't nag. Any new permission-request UX should follow this exact shape, not invent a new one.
- No geolocation, camera, or microphone usage anywhere — confirmed, and per §5.4, none should be added.

---

## 4. Grounding research (external)

**On timing and framing:** covered above in §2 — contextual, benefit-explained, deferred-until-relevant requests measurably outperform upfront ones, on the web specifically as much as on mobile.

**On iOS/Safari's notification architecture (2026 state):** <cite index="22-1">web push works on iOS starting at version 16.4, but only for a PWA that has been added to the Home Screen — a tab open in Safari itself has no access to the Push API at all, and this restriction is identical across every browser on iOS because Apple requires all of them to use WebKit.</cite> This app already clears the Home-Screen-install precondition via `install-banner.tsx`. But there's a bigger structural fact underneath the browser-support trivia:

**True push notifications require a server, full stop.** Every implementation guide for iOS or Android web push describes the same shape: a service worker holds a subscription, and *a server* delivers payloads to it through Apple's APNs relay (for iOS) or a push service (for other platforms) — <cite index="27-1">a website needs to register with Apple Push Notification service (APNs) and obtain a unique identifier used to route notifications to the correct device.</cite> This is not an implementation detail this app can route around — it is the mechanism by which "closed app, still gets notified" works at all. For a deliberately server-less, local-first, nothing-uploaded app, standing up even a minimal notification-relay server is a real architectural decision, not a checkbox — it means Stitch & Scale would, for the first time, have *a* server component, even if it never touches project or grading data.

This distinction is the single most important finding in this brief: **"local notifications" (shown by the app itself, only while it's open or via its own service worker, no server involved) and "push notifications" (delivered by a server even when the app is fully closed) are architecturally very different asks for this specific app**, and conflating them would lead to committing to server infrastructure without that decision ever being made deliberately.

**On persistent storage:** the Storage API's `navigator.storage.persist()` exists precisely to prevent the failure mode described in §3 — silent, automatic eviction of local data under storage pressure — and is the standard, uncontroversial recommendation for any local-first web app that stores meaningful user data in IndexedDB. Unlike notifications, it has no server dependency and no user-facing "prompt fatigue" cost in most browsers (Chrome grants it automatically based on engagement heuristics in many cases; where a prompt is shown, it is a single one-time ask).

---

## 5. Permission-by-permission recommendation

### 5.1 — Notifications: **local-only, not push, and only for real completions — never "come back"**

Given §4's finding, the recommendation is to scope this narrowly for now: use the `Notification` API for **local, in-session or same-device notifications only** (e.g., a long-running export finishing while the user has switched tabs) — never build the server-backed push-relay infrastructure this would otherwise require, unless that's raised and decided as its own, separate architectural decision later.

Just as important as the *mechanism* is the *content*. This app already has a hard-won, evidence-grounded design principle from the soothing-recognition work: no loss states, no "come back" pressure, nothing Duolingo-shaped. That principle applies with equal force here. A legitimate local notification says "your Project Book PDF is ready" — something true, useful, and requested by an action the user just took. An illegitimate one says "you haven't graded a pattern in a while" — the exact re-engagement-pressure pattern already rejected elsewhere in this app's own research. Pass 2 should treat this as a hard boundary, not a style preference.

### 5.2 — Persistent storage: **recommended, proactively, tied to a real moment**

This is the clearest "yes" in this brief. `navigator.storage.persist()` should be requested — not at first launch, but the first time it actually matters (plausibly: the first time a user saves a project, or completes onboarding with real data entered) — framed honestly ("keep your patterns safe on this device") rather than left silent. Low cost, no server dependency, directly protects the app's core promise.

### 5.3 — Clipboard, file inputs: **no action needed**

Already correctly scoped, as noted in §3. Nothing to change.

### 5.4 — Explicitly not recommended: geolocation, camera, microphone, background sync

No existing or proposed feature in this app has a plausible use for any of these. Geolocation and camera in particular are the two capabilities the CHI research cited in §2 found users are most likely to view with suspicion when the reason isn't obvious — requesting either without a real, load-bearing feature behind it would spend trust for nothing. If a genuine future feature needs one of these (for example, a hypothetical gauge-swatch photo capture), that should be its own proposal, evaluated on its own merits when it exists — not pre-emptively requested now.

---

## 6. Sources

- Dogtown Media, "Mobile Permission Requests: Timing, Strategy & Compliance Guide" — the 28%-higher-grant-rate finding for deferred/contextual requests.
- web.dev, "Web permissions best practices" (Google) — the standard, authoritative web-specific guidance on requesting only what's needed, when the value is apparent.
- "Permission Rationales in the Web Ecosystem," CHI 2025 — the 100-million-Chrome-installation finding that geolocation/notification prompts are often ignored without context.
- MagicBell / Mobiloud / Notificare / OneSignal implementation guides on iOS Safari Web Push (2026) — converging, consistent description of the Home-Screen-install precondition and the server/APNs requirement underlying all push delivery.
- MDN / web platform documentation on `navigator.storage.persist()` (StorageManager API) — standard reference for the persistent-storage recommendation in §5.2.
- Internal: extends the design principles already established in `docs/research/soothing-recognition-gamification-2026-08-22.md` (no loss states, no re-engagement pressure) — applied here to notification *content*, not just to the recognition system that brief covered.

---

## 7. What Pass 1 and Pass 2 should each produce

- **Pass 1 output:** confirmation (or correction) of §3 against live HEAD, and a fresh check that §5.1's server-requirement finding still holds — browser/OS push architecture is exactly the kind of thing that can change between two firings of this queue. Log as `docs/leader-notes/cycle-<date>-<chk>-device-permissions-pass1.md`.
- **Pass 2 output:** the concrete request-UX design for persistent storage (§5.2) and local-only notifications (§5.1) — trigger moments, 5-locale priming copy reusing `install-banner-copy.ts`'s conventions, and confirmation that both remain fully optional with zero loss of core functionality when denied. Log as `docs/leader-notes/cycle-<date>-<chk>-device-permissions-pass2.md`. Only after this log lands should a numbered `QUEUE-` implementation item be opened, scoped to persistent storage first (§5.2 — the lower-risk, no-server, unambiguous win) before local notifications.
