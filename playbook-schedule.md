# Autonomous Stitch & Scale Advancement Playbook

You are continuing autonomous work on the user's GitHub repo `plastic-dude/stitch-and-scale-pro` (the advancement repo cloned from `stitch-and-scale-rc`, which must NEVER be modified).

## Working state
- Local repo clone is at /home/ubuntu/stitch-and-scale-pro (re-clone if missing: `git clone https://<TOKEN>@github.com/plastic-dude/stitch-and-scale-pro.git /home/ubuntu/stitch-and-scale-pro`, where TOKEN comes from the file the user provided earlier, or use `git ls-remote` with the same token URL pattern `https://ghp_<TOKEN>@github.com/plastic-dude/stitch-and-scale-pro.git`).
- The app lives under artifacts/stitch-and-scale (React + Vite + TypeScript + Tailwind). Quality gates before every commit: `pnpm run typecheck`, `pnpm exec vitest run`, `pnpm run build` all pass. Commit messages use the template: `[CHK-NNN] [STITCH-AND-SCALE-PRO] [VERIFIED] <description>` with bullet details of what/where/tested. Git identity: plastic-dude / plastic-dude@users.noreply.github.com (local config in that repo).
- Research notes accumulate in /home/ubuntu/research/ (e.g., competitors-session-1.md).
- Governing standard: EMLUX quality policy (zero hallucinations, every constant cited, build integrity before commits, no dead code).

## Each firing, do ALL of:
1. Pull latest main.
2. RESEARCH (different focus each time — do NOT repeat prior competitors): pick a fresh angle from this rotating list and research 3-5 NEW competitors, features, or market segments not yet covered in /home/ubuntu/research/:
   - knitting/crochet pattern-writing tools (Pattern Keeper, KnitBird, Sweater Wizard, KnitCAD)
   - tech editing and garment sizing software (Size.ly, Sizebot, Fit Analytics)
   - AI-assisted knitting tools and pattern generators
   - pattern marketplaces and monetization (Ravelry, LoveCrafts, Etsy digital, InStitches, Payhip)
   - adjacent maker SaaS pricing/metrics (Love2knit, WeCrochet apps, CraftYarnCouncil traffic)
   - wholesale/indie designer business models and revenue benchmarks
   Write findings into a NEW dated file in /home/ubuntu/research/ and extract a prioritized opportunity list.
3. BUILD: pick the single highest-value opportunity (monetization or differentiation first — paid-tier gating, pattern marketplace export, tech-editing exports, yarn-shop integration, cost calculator, subscription pricing page, SEO landing content) and implement it fully in the repo: code, tests, verified build, docs/screenshots, README updates.
4. Verify with typecheck + vitest + production build; visually confirm in a served preview when UI changes.
5. Commit with the quality-policy template and push to origin main.
6. End with a concise progress message to the user: what was researched, what was built, commit hash, next session's planned angle.

## Hard constraints
- The repo plastic-dude/stitch-and-scale-pro is PRIVATE (user business knowledge). Never make it public, publish a public link, or expose it in any user-facing preview (serve only on localhost).
- Keep the repo's visibility private; never run the GitHub API call that would re-open it.

## Rules
- Never touch stitch-and-scale-rc.
- Never invent features that can't be verified working; mark anything uncertain UNVERIFIED.
- Prioritize money-making: features that enable selling patterns, subscriptions, or premium tiers rank above internal tooling.

## Progress log (update each run)
- [CHK-001] a9cd394 — Yarn Requirement Estimator (CYC 7-weight model, tests 6/6)
- [CHK-002] 4c50cc7 — Pattern Income Planner (Ravelry/Etsy/Ribblr/Payhip fee model, breakeven, tests 9/9); repo set PRIVATE at user request
- Sessions research files: /home/ubuntu/research/competitors-session-1.md (grading tools + yarn ecosystem), competitors-session-2-marketplace-monetization.md (marketplace fees + income benchmarks)
