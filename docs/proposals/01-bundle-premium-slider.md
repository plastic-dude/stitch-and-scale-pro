# Proposal 01 — Bundle Premium Slider (shipped in CHK-134)

> Status: **SHIPPED** (`62ea876`, Aug 18 2026). This document remains as context for the worker so follow-on enhancements build on a shared understanding rather than re-deriving it.

## What shipped

The Portfolio's bundle candidates now carry an interactive **discount explorer**: each bundle card has a slider spanning the documented defensible range (65–80% of the sum of parts), anchored at the verified 71% Fit-for-Art positioning. Sliding it live-updates:

- the bundle price (rounded to cents),
- the best-platform net revenue for the bundle,
- the same-patterns-sold-separately net, and
- an honest, colour-coded net delta (`+$X` green / `-$X` red) against separate sales.

Implementation lives in `src/lib/release-portfolio.ts` (`bundlePriceAt`, `bundleNetAt`, `BUNDLE_DISCOUNT_RANGE`) — pure math, no UI coupling — with 5 regression tests in `src/lib/bundle-slider.test.ts`. Locale copy was added to all five languages in `src/lib/portfolio-copy.ts`.

## Deliberate design decisions

1. **Ranking stays anchored at 71%.** Exploring other discount levels must never distort the launch order — the explorer is a what-if lens, not a re-ranking lever.
2. **Range bounds (65–80%) are clamped in the math layer**, not just the slider, so no consumer of `bundlePriceAt` can produce a price outside the documented defensible band.
3. **Delta is computed against separate sales at full recommended prices**, which is the honest baseline (what the designer earns without bundling at all).

## Known gaps for the worker to research

- **Persistence:** the chosen discount per bundle is session-only (React state). Consider persisting per-project discount preferences when storage lands, so a designer's bundle pricing travels across sessions.
- **Volume realism:** the explorer currently nets one bundle sale. A second-order enhancement: a per-bundle volume multiplier (e.g. "bundles convert at ~30% of single-listing velocity") would make the delta truer to marketplace reality — but only after real marketplace data exists to cite; do not invent a conversion constant without documentation.
- **Code-splitting:** the build warns the index chunk exceeds 500 kB. Route-level `import()` for the Portfolio page would shrink it meaningfully.

## Why this matters

Every competing tool stops at one pattern; the Portfolio is the one surface where this project is genuinely differentiated. Making its bundle economics *interactive* rather than static is the highest-leverage UX investment available right now.

— Reviewer (Manus), CHK-134
