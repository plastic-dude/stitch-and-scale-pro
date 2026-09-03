# MiniMax task prompt — Stitch & Scale mobile crawl audit

Give this to MiniMax only after it has the `exhaustive-mobile-qa-crawl` skill installed. This prompt supplies the project-specific facts that skill needs (target, audience, surface inventory, priority question) — the methodology itself (SFDPOT coverage, SBTM sessions, eyes→click→eyes, reporting format) lives in the skill and isn't repeated here.

---

Paste everything below this line into MiniMax as its task instructions.

---

Apply the exhaustive-mobile-qa-crawl skill to:

**Target:** https://stitch-and-scale-pro-api-server.vercel.app (production)

**Audience context:** a knitwear pattern-grading tool used almost entirely on phones, by designers who are digitally comfortable but working in short, interrupted spare moments — not power users with time to spare, and not people who need things simplified for lack of technical skill. A flow that hangs or a control that's hard to hit costs a real person real time out of a small window they had for this.

**Surface inventory (Structure, for your SFDPOT plan):**
- Full onboarding, start to finish, as a brand-new visitor.
- Every workspace tab — the product has roughly 90 across design, pricing, launch, sales-channel, and business-record categories. Enumerate them from the app's own navigation once you're in a project; don't assume tabs in the same category behave alike, check each one.
- Every dialog, modal, and drawer reachable from inside each tab.
- Every export/download path reachable without account credentials (PDF, CSV, image, etc.) — confirm the resulting output actually renders and isn't blank or malformed.

**Platform dimension specifics:**
- All 5 supported locales — run the full critical path (onboarding → create a project → several representative tabs → an export attempt) in each. Watch for text overflowing its container, truncated buttons, wrong-looking currency/number formatting, and leftover English inside a non-English locale.
- Light and dark theme, if a toggle exists — full critical path in both.

**Charter this as your top-priority session, before anything else:** at every primary viewport width, confirm the app actually paints real content on first load — not a blank screen, not a stuck spinner, not a white flash that never resolves. Screenshot the very first frame, the moment real content appears, and the console output during that load, at each width. A prior internal review could not confirm or deny this without a real browser and flagged it as the single most important open question this audit exists to answer — close it out explicitly in your final summary either way.

**Operations/Time dimension specifics to include:** the PWA install prompt if one appears (confirm dismissing it doesn't break anything); deliberately triggered empty, loading, and error states (a fresh project with nothing filled in, an invalid input, a simulated slow/interrupted connection if possible) rather than only ever testing the fully-populated happy path.

Everything else — viewport matrix, session/charter structure, eyes→click→eyes protocol, coverage model, reporting format, screenshot naming, and final summary requirements — follow the skill exactly as written. Take as long as this requires; there is no time budget and no screenshot-count ceiling.
