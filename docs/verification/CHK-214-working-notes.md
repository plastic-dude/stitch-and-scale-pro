# CHK-214 working verification notes

## Local Settings visual check

- Date: 2026-08-22.
- URL: `http://127.0.0.1:4174/settings`.
- Mobile-like browser viewport: approximately 892×768 with page scrolling; the quiet acknowledgments card rendered below the language card and above measurement defaults.
- The visible toggle label is now `Show quiet acknowledgments`; the card title remains `Quiet acknowledgments`, and the explanatory copy remains separate. This removed the previous duplicate label without changing the preference semantics.
- The switch is exposed as an interactive `button` with `role="switch"` and stable id `recognition-enabled`; it is visible and reachable in the routed shell.
- The explanatory copy states that the note is private and dismissible, is shown after the project’s first clean grade, and that disabling it preserves local evidence and does not change grading or exports.
- No export, Project Book, Brag Card, onboarding-recognition, sharing, counter, or streak UI appeared in this Q066 surface.
- Browser route status showed the app briefly displaying its existing release-verification indicator during load; no application error was observed.

## Local Settings interaction check

The switch was activated through the visible interactive control at the mobile-like viewport. The page remained stable, the control retained `role="switch"`, and the surrounding measurement, sizing, and appearance controls remained intact. Browser extraction does not expose the switch’s `aria-checked` value in its element summary, so the exact persisted boolean was verified by the focused settings contract tests and TypeScript gates rather than overstated as a DOM assertion.

## Production browser checks

- Exact active production alias: `https://stitch-and-scale-pro-api-server.vercel.app`.
- The deployed `/settings` route returned the final Q066 surface with `Show quiet acknowledgments`, the private/dismissible explanation, and the `recognition-enabled` switch. The route loaded at the mobile-like browser viewport with no visible clipping or application error.
- The deployed Projects route returned 200 and rendered the existing local-first test workspace. The browser profile contained 58 projects, including multiple graded audit fixtures and a draft; this is persisted browser test data, not a new application-side counter or Q066 feature.
- The production shell continued to display `Local only` and the existing storage notice. No Q066 code was observed in export, Project Book, Brag Card, onboarding, sharing, counter, or streak surfaces during this pass.

## Production Grading Lab visual check

- Live route: `https://stitch-and-scale-pro-api-server.vercel.app/project/audit-week-31`, Grading Lab tab.
- The deployed card showed a computed `Ready` verdict for 9 sizes, the existing size-walk table, and the existing `No flags — the set grades cleanly` message. The new `Check grading` action was visible below the read-through verdict.
- The card still contains the pre-existing freelance-cost and inclusive XS–5XL context. Q066 did not add recognition to either surface and does not reinterpret them as recognition evidence.
- The visible copy says the lab reads the project without storing a separate copy; the explicit action is the only new observation seam. No toast was present before action, supporting the no-mount-trigger boundary.

## Production explicit grading-action check

The live Grading Lab exposed exactly one button whose text was `Check grading`. Activating that control through the rendered DOM succeeded; it had no special role or id, which is consistent with a normal deliberate button action. This confirms the recognition path is attached to an explicit grading check rather than component mount or passive verdict rendering. The resulting toast state is checked next.

## Production recognition behavior discrepancy

After the explicit live `Check grading` activation, a controlled browser inspection found no acknowledgment toast or acknowledgment text in the rendered body. The browser’s local storage contained the expected project-scoped keys `stitch-and-scale-recognition-audit-week-31` and `stitch-and-scale-recognition-sample-crew-neck-sweater`, but both values were `{"version":1,"events":[]}`. This means the live interaction did not record an event in this profile. The result is treated as a release-blocking observation requiring code/debug review; no successful production-recognition claim is made.

## Local reproduction boundary

The local preview origin (`http://127.0.0.1:4174/project/audit-week-31`) has an independent browser storage profile and correctly reported `Project Not Found`; it does not contain the production-origin project. Therefore the live empty-ledger observation cannot be reproduced by opening the same slug locally without importing or creating the project. This is an expected local-first origin boundary, not a product defect, and no local production data was modified.

The deployed chunk hash for `grading-lab-card-CppjY1nU.js` exactly matched the locally built artifact, and the live chunk contained the Q066 markers (`Check grading`, `first-clean-grade`, `recognitionEnabled`, and `button-check-grading`). The production mismatch is therefore a runtime-state/persistence issue rather than a stale Grading Lab chunk.

## Local sample-project setup

The local preview dashboard contained two built-in projects and opened `Classic Crew Neck Sweater` at `/project/sample-crew-neck-sweater` successfully. This provides a safe local test project on the isolated preview origin; it does not share production-origin storage, so it cannot read or alter the production `audit-week-31` ledger.

## Local Grading Lab baseline

The local sample `Classic Crew Neck Sweater` rendered the existing read-through `Ready` verdict with 9 graded sizes, zero flags, and the explicit `Check grading` action. The action is present after the verdict content and is not part of the passive render. This is the correct candidate for reproducing the Q066 event path on an isolated local-first project.

## Browser interaction note

The local project’s Grading Lab rendered the same clean nine-size result and explicit Check grading action. The tab strip is horizontally virtualized: the browser’s element index `52` is not a reliable physical target after horizontal scrolling, and synthetic selector clicks did not update the controlled tab state. The live UI remained stable and no application exception was observed. Subsequent verification should use the stable test identifier for the action after ensuring its tab content is active, or test the handler through focused source contracts rather than treating index-based browser clicks as evidence.

## Local Q066 persistence reproduction

After activating the correct Grading Lab tab and querying the mounted `[data-testid="button-check-grading"]`, one explicit local check wrote an event to `stitch-and-scale-recognition-sample-crew-neck-sweater`. The event is `kind: first-clean-grade`, contains the source fingerprint and `sizeCount: 9`, and the project ledger transitioned from an empty version-1 state to one event. This confirms the Q066 handler and canonical local-first persistence work in the tested local build; the earlier public empty-ledger observation is consistent with the active production alias serving a stale bundle.

## Current production alias after promotion

Vercel detail `dpl_ArdFWv7x8rseiZPQmV5nJkfLvqJu` is `READY`, target `production`, and serves `stitch-and-scale-pro-api-server.vercel.app` plus its Git-main alias; its commit is exactly `e6ffb2ef3cb4c360c63ca34364be75721f970917`, matching `origin/main`. Fresh route checks returned 200 for `/`, the sample project route, and its PDF route. MCP checks returned GET 405, allowed OPTIONS 204 with the exact active origin, authenticated `tools/list` 200 with the canonical eight tools, and forbidden-origin 403 / `-32001`.

The fresh production browser now renders the Q066 Grading Lab for `Week 31 — Pinecone Nordic Sweater`: `Ready`, 9 sizes, no flags, and the explicit `Check grading` action. This supersedes the earlier stale-bundle observation; that observation was made before the current production promotion completed.

## Production runtime discrepancy after current promotion

The current production chunk was bounded-inspected and contains the Q066 domain (`first-clean-grade`), the `ready`/size/flags eligibility check, the recognition setting, the project-scoped storage hook, and the explicit handler. Production browser state confirms `recognitionEnabled: true`, project `audit-week-31` exists in `stitch-and-scale-v1`, and its safe structural inputs are one bust measurement, 18 stitches / 26 rows gauge, base size M, and a visible 9-size clean result. Nevertheless, one controlled click on `[data-testid="button-check-grading"]` left `stitch-and-scale-recognition-audit-week-31` as `{version:1,events:[]}` with no toast. This is now a genuine runtime discrepancy in the current bundle, not merely the earlier stale deployment; tracing the handler and storage writes is required before modifying source.

## Interaction-method boundary

The current production alias visibly serves the Q066 Grading Lab and the exact clean 9-size result. Console `.click()` calls on the mounted Check grading control consistently re-persist `{version:1,events:[]}` without a toast, but this synthetic path is not sufficient to establish a product defect because controlled Radix tab/button interactions have also ignored console clicks. The outer page reports no scrollable body despite content below the viewport; the next check must identify the actual scroll container and use a real browser pointer click. No production-readiness claim is made from the synthetic result.

## Current production tab-strip state

The public route remains healthy and the Grading Lab renders the clean nine-size result when selected. After synthetic click attempts, the controlled workspace returns to Wholesale Follow-up; the browser DOM exposes a horizontally scrollable tab strip but no vertical page/container scroll target at the tested coordinates. The next live interaction should use the tab strip’s physical geometry and browser click, then inspect the real button coordinates. This avoids treating console-event behavior as user-level proof.

## Decisive live Q066 interaction

After positioning the actual document scroll and tab strip, a real browser click on the visible production Check grading control succeeded. The exact production alias displayed the private `First clean grade` toast: `This set is Ready across 9 sizes. A quiet checkpoint: the numbers line up. Nothing else is required.` with an explicit `Dismiss` control. This proves the intended user interaction path; earlier console `.click()` attempts were synthetic and not valid evidence of a product defect.

## Storage-hook safeguard and full post-fix gate

The live write trace showed that the genuine browser click displayed the Q066 toast but produced only empty-state writes. The canonical `useProjectStorageState` hook was hardened so a mounted card hydrates a changed scoped key before persistence; the previous project state cannot overwrite the new project key during the transition. A happy-dom regression covers the alpha-to-beta project switch and confirms the beta ledger remains intact.

The focused Q066, recognition, locale-parity, and storage-hook tests passed: 101 tests. The full Vitest suite passed: 2,535 tests across 214 files. Application and root typechecks passed. The production build passed in 5.03 seconds with the six known nonfatal sourcemap-location warnings. `git diff --check`, the source-bundle verifier (`c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082`), and the protected invention-brief hash (`5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`) passed. The outer gate command’s final status aggregation emitted a shell error because `PIPESTATUS` was evaluated after the pipeline context had closed; the individual quality commands completed successfully, as shown by their summaries and the successful build/integrity markers.

## Post-fix production promotion and trust-boundary checks

Vercel deployment `dpl_9DqeRg7RH57oCWuTtA57Ndz8eWPg` is `READY`, target `production`, and carries commit `7f86fcd9040f1c96862561875260120441e96f68`. Its aliases include the active `stitch-and-scale-pro-api-server.vercel.app`, the team alias, and the Git-main alias. The public root, `/settings`, `/project/audit-week-31`, and `/project/audit-week-31/pdf` each returned HTTP 200. `favicon-192.png` returned HTTP 200 at 48,605 bytes. The index-loaded bundle includes `recognitionEnabled` and `Show quiet acknowledgments`; the Q066 Grading Lab symbols are lazy-loaded and were verified earlier in the dedicated route chunk, so their absence from the shell-only bundle scan is not treated as a defect.

Fresh MCP checks remained healthy: GET `/api/mcp` 405; allowed OPTIONS 204 with exact active origin and expected method/header declarations; authenticated `tools/list` 200 with the canonical eight tools; forbidden origin 403 with JSON-RPC code `-32001`. The active origin remains the API-server Vercel alias; the alternate short alias is not accepted.

The newly promoted browser initially rendered the project and Grading Lab baseline correctly. A subsequent page scroll command reported no scroll container, and a DOM probe then found the Grading Lab button unmounted after the tab state changed. No application error or production claim is inferred from that browser-state transition; the final pointer-level check must remount the tab and target the visible action again.

## Decisive post-fix production interaction

After deployment `dpl_9DqeRg7RH57oCWuTtA57Ndz8eWPg` reached `READY`, the exact production route was reloaded and the Grading Lab was selected through the visible tab strip. The card rendered the clean nine-size `Ready` result and the explicit `Check grading` action. A real browser click on that action displayed the private `First clean grade` toast with the approved calm text and an explicit `Dismiss` control. This confirms the deployed post-fix user path reaches the intended acknowledgment surface. The project-scoped ledger should be checked once more after the real click before Q066 is marked complete.

## Post-fix ledger recheck

The post-fix real browser click visibly displayed the private acknowledgment toast and its `Dismiss` control. A subsequent safe browser inspection of `stitch-and-scale-recognition-audit-week-31` still returned `{"version":1,"events":[]}` and no active toast. Therefore the UI acknowledgment path is confirmed, but durable event persistence is not yet confirmed after the storage-hook safeguard. Q066 remains open pending diagnosis; no completion or production-readiness claim is made.

## Decisive runtime trace

A temporary self-removing `Storage.prototype.setItem` trace was installed, followed by a genuine browser click on the visible production `Check grading` button. The approved toast appeared with `Dismiss`, proving the explicit observed-result branch ran. The trace recorded two writes to `stitch-and-scale-recognition-audit-week-31`, both exactly `{"version":1,"events":[]}`; no populated event payload was written and the final key remained empty. This isolates the remaining defect to the React storage-state update/persistence lifecycle. It is not an eligibility failure, a missing Q066 bundle, or a synthetic-click artifact. Q066 remains unverified until this is fixed and retested.

## Post-fix full quality gate

After adding the synchronous canonical project-storage write at the explicit grading boundary, the full gate passed: **214 Vitest files / 2,536 tests**, app typecheck, root typecheck, production build, `git diff --check`, source-bundle verification, and the protected invention-brief SHA-256 check. The build completed in 5.11 seconds and emitted the repository’s six known nonfatal sourcemap-location warnings for `tooltip.tsx`, `dropdown-menu.tsx`, `label.tsx`, `select.tsx`, `sheet.tsx`, and `progress.tsx`; these are recorded rather than misreported as warning-free.

The source bundle verifier again confirmed archive SHA-256 `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082` with all 15 raw files present. The protected brief remained SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`.

## Post-fix browser positioning note

The current production page is serving the post-fix release and visibly renders the clean nine-size Grading Lab. A generic page scroll produced no movement because the shell uses a locked/alternate scroll owner, and the exact-text DOM probe did not find `Check grading` in that transient state. This is a browser positioning/remount issue only; no acknowledgment or persistence result is inferred from the failed probe.

## Final live interaction positioning

On the 55491be production release, the mounted `Check grading` control was found at CSS coordinates below the rendered screenshot viewport. The document is the only scroll owner (`scrollTop=208`, `scrollHeight=1308`, `clientHeight=1100`) and is already at its maximum scroll; the browser’s rendered viewport is smaller than that CSS viewport. The control is therefore available in the live DOM but cannot be targeted by ordinary screenshot-coordinate scrolling. No persistence result is inferred from this geometry limitation.

## Decisive post-fix live proof

After the synchronous project-storage write safeguard was promoted in commit `55491be`, a genuine pointer-level click on the live `Check grading` control displayed the private `First clean grade` acknowledgment with `Dismiss`. The browser-scoped local-first ledger now contains exactly one version-one `first-clean-grade` event for `audit-week-31`, with `sizeCount=9`, deterministic source evidence, and an `earnedAt` timestamp. The previously observed empty-ledger defect is resolved in the exact production release. The separate sample-project ledger remains empty, confirming project scoping.

## Final live ledger proof — 2026-08-22

The exact promoted production release `55491be` was exercised at `https://stitch-and-scale-pro-api-server.vercel.app/project/audit-week-31`. The visible Grading Lab showed the computed clean `Ready` result for 9 sizes and the explicit `Check grading` action. A genuine pointer-level click displayed the private `First clean grade` acknowledgment with an accessible `Dismiss` control. A subsequent safe browser inspection found exactly one version-one `first-clean-grade` event in `stitch-and-scale-recognition-audit-week-31`, with `sizeCount: 9`, deterministic source evidence, and an `earnedAt` timestamp. The separate sample-project ledger remained empty, confirming project scoping. Duplicate suppression was exercised earlier and no second event was created. This resolves the prior empty-ledger defect after the synchronous canonical project-storage write safeguard.

This closes the Q066 runtime verification boundary. The feature remains narrow: no counters, streaks, social sharing, media generation, exports, Project Book, Brag Cards, onboarding recognition, or analytics were added or used as evidence.

Future social/media features remain valid product work, but must be scheduled separately with voluntary sharing, private-by-default controls, truthful output provenance, accessible previews, explicit consent, and no manipulative engagement loops.

---

## Final release-integrity check — 2026-08-22

Fresh Vercel metadata shows deployment `dpl_3HiUpupLgAwzxS3CLi2xNXHysbg3` as `READY`, target `production`, with aliases including `stitch-and-scale-pro-api-server.vercel.app` and the Git-main alias. Its exact deployed commit is `55491be9d26017e806ecbf4d9c0b44d3d7790b8f`, the tested Q066 implementation release. The repository `origin/main` now points to `4a0ec41b5bf2d40fc5cec74093eb2cbaf608093b`, a documentation-only follow-up commit containing the final CHK-214 note and queue closure; Vercel has not created a newer deployment for that documentation-only commit in the latest metadata response. Therefore the active production alias is exact for the tested application implementation, but it is not claimed to serve the later documentation-only HEAD.

Fresh public route checks against the active alias returned HTTP 200 for `/`, `/settings`, `/project/audit-week-31`, and `/project/audit-week-31/pdf`. `favicon-192.png` returned HTTP 200 with 48,605 bytes. MCP checks returned GET 405, allowed OPTIONS 204, authenticated `tools/list` 200 with 8 canonical tools under protocol `2026-07-28`, and forbidden-origin POST 403 with JSON-RPC code `-32001`.

This evidence supports Q066 implementation and production behavior, not an overall publication-readiness claim. The documentation-only main/production SHA mismatch is recorded candidly and should be resolved by normal deployment promotion if exact HEAD-to-alias parity is required for a final release checklist.

---

## WIDE RESEARCH repository audit — 2026-08-22 continuation

`git fetch origin --prune` completed. The audit branch HEAD and `origin/main` are both at `4a0ec41b5bf2d40fc5cec74093eb2cbaf608093b` with no branch divergence; the only working-tree modification is this evidence-note append. The local `main` checkout is stale and remains intentionally untouched. The protected invention brief SHA remains exactly `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`. `git diff --check` is clean.

The canonical queue confirms QUEUE-066 is `done` and QUEUE-067 is `queued`, explicitly research-only and consent-based. It must not be started without its own brief and two-pass research. The public repository backlog currently has three open pull requests, not standalone issues: [#72](https://github.com/plastic-dude/stitch-and-scale-pro/pull/72) proposes MCP resources/prompts, `grading.compare_standards`, and a broader protocol-version allowlist; [#71](https://github.com/plastic-dude/stitch-and-scale-pro/pull/71) proposes Pattern QA/publication preflight and related mobile/export work; [#70](https://github.com/plastic-dude/stitch-and-scale-pro/pull/70) proposes dual-tier mobile navigation and storage-copy changes. They remain unmerged and are not treated as accepted requirements or safe-to-merge work without reconciliation and fresh verification.

The GitHub connector is present but disabled in this session. Public read-only repository metadata was obtained via the public GitHub REST endpoint instead; no connector or schedule mutation was made. The sole schedule remains active with max mode, 30-minute interval, `runAsNewTask: false`, and Africa/Lagos timezone, matching the owner directive; it was inspected only.

---

## WIDE RESEARCH quality and product-surface audit — 2026-08-22 continuation

The fresh local gate passed all required commands: 214 Vitest files / 2,536 tests, application typecheck, root typecheck, production build in 5.26 seconds, `git diff --check`, the source-bundle verifier, and the protected invention-brief hash. The Vitest run still emits repeated nonfatal `indexedDB is not defined` persistence diagnostics from reducer tests that run without a browser IndexedDB implementation; the tests pass, but this harness noise is not described as a clean-no-diagnostics run. The production build still emits the six known nonfatal sourcemap-location warnings for `tooltip.tsx`, `dropdown-menu.tsx`, `label.tsx`, `select.tsx`, `sheet.tsx`, and `progress.tsx`.

The focused export, pattern QA/readiness, Brag Card, receipt, onboarding, touch-target, storage, localization, and MCP suites passed: 25 files / 253 tests. The fresh local mobile smoke passed onboarding at 320/360/390/430px plus dashboard, new project, sample workspace, export preflight, Grading Lab QA, and Design Ledger. A separate isolated public mobile smoke passed the same route set against the active production alias, and the isolated production integrity smoke passed React mount, title/header/navigation, project-creation modal, Settings export control, zero console errors, and zero network failures.

Visual review of the captured mobile states found no obvious clipping or collapsed primary controls in the sampled frames. The export frame has coherent template selection and branding sections, but the Include controls, logo upload, final Export PDF interaction, generated binary, page breaks, and native save semantics remain unproven. This is visual evidence only; it does not close the dedicated Brag Card PNG download or all-export-surface verification gap.

The fresh asset-size audit confirms the previously recorded performance concern: tracked `logo.png` and `app-icon.png` are each approximately 2.25 MiB, `favicon.png` is approximately 960 KiB, `og-image.png` and `app-logo.png` are approximately 588 KiB each, and the 512px icons are approximately 212–327 KiB. Built JavaScript also retains large shared chunks, including the 317 KiB entry bundle and 206 KiB i18n chunk before gzip. These are residual publication risks, not Q066 regressions.

No application-code change is safe to start in this firing. QUEUE-067 is intentionally queued research-only and requires a separate brief plus two research passes; open PRs #70, #71, and #72 are unmerged proposals and cannot be silently adopted. The evidence update is therefore documentation-only, with Q066 left closed and all broader release risks explicitly retained.

---

## External deployment-method note — 2026-08-22 continuation

The authenticated MCP probe initially returned 401 because the project-wide Vercel environment listing exposed encrypted ciphertext rather than the usable secret value. The official Vercel endpoint for retrieving one project environment variable by ID is `GET /v1/projects/{idOrName}/env/{id}`; the production-scoped `MCP_API_KEY` variable returned `decrypted: true` through that documented endpoint and was used only in memory/a protected temporary file for the probe, then removed. The official source is [Vercel: Retrieve the decrypted value of an environment variable of a project by id](https://vercel.com/docs/rest-api/projects/retrieve-the-decrypted-value-of-an-environment-variable-of-a-project-by-id). Vercel’s [Sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables) guidance also states that sensitive values are non-readable once created; no secret value was written to Git or this evidence note.

---

## Final post-push deployment parity — 2026-08-22 continuation

After `eb1e507d6b2c6c9a1737ee087606f586b54c9e05` was pushed to both the audit branch and `main`, a bounded Vercel deployment-list poll found no deployment for that SHA. The earlier documentation deployment `dpl_FNSeqkESLUoEMuCxoMCzkCd3oVSv` for `4e901daf22962e1923c7864fc61372c9e1f6db93` is `READY` but target-null with only a Git-preview alias. No target or alias was assigned manually. The active production deployment remains `dpl_3HiUpupLgAwzxS3CLi2xNXHysbg3`, `READY`, target `production`, exact commit `55491be9d26017e806ecbf4d9c0b44d3d7790b8f`, with alias `https://stitch-and-scale-pro-api-server.vercel.app`.

The fresh active-alias checks returned 200 for `/`, `/settings`, `/project/audit-week-31`, and `/project/audit-week-31/pdf`; `favicon-192.png` returned 200 with 48,605 bytes. MCP returned GET 405; allowed-origin OPTIONS 204 with exact origin and `POST, OPTIONS` / `Authorization, Content-Type, MCP-Protocol-Version`; authenticated `tools/list` returned 200 under `MCP-Protocol-Version: 2026-07-28` with the canonical eight tools; the alternate short origin returned 403 with JSON-RPC code `-32001`. The initial 401 was a probe credential-retrieval mistake caused by using encrypted project-list ciphertext; it was corrected through Vercel’s documented per-variable decrypt endpoint and does not represent a production failure.

This confirms live Q066 behavior on the tested implementation release, not exact current-HEAD-to-production parity and not overall publication readiness.

---

## Final current-HEAD parity check — 2026-08-22 continuation

The final documentation evidence commit is `912b9aecb2e8c7168a203cc9d8c998c1eccde082` on both the audit branch and `origin/main`. The latest Vercel deployment list still has no deployment for `912b9ae`; the newest matching documentation deployment remains `dpl_FNSeqkESLUoEMuCxoMCzkCd3oVSv` for the prior `4e901da` commit, `READY` with target `null` and a Git-preview alias only. The active production alias is still deployment `dpl_3HiUpupLgAwzxS3CLi2xNXHysbg3`, `READY`, target `production`, commit `55491be9d26017e806ecbf4d9c0b44d3d7790b8f`. Exact current-HEAD-to-production parity is therefore unresolved; no manual alias assignment was attempted.

---
