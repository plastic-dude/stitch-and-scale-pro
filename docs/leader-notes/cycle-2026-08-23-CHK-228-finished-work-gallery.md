# CHK-228 — Archive discoverability and finished-work gallery

**Date:** 2026-08-23  
**Author:** Manus AI  
**Status:** Code released to `main`; exact production deployment READY and active alias verified  
**Code commit:** `707ce8373aa848dd594d6e14ec0c7b2611f8d726`  
**Vercel production deployment:** `dpl_Bo7Li3RXL171cLjaS4yjdRWQWTrq`  
**Active origin:** `https://stitch-and-scale-pro-api-server.vercel.app`

## Direct answer: was it pushed to main?

**Yes.** The code was committed on the audit branch, pushed there first, then pushed to `main` only after a fresh fetch confirmed that `origin/main` was exactly the code commit’s parent. A read-only remote-tip check now reports both `refs/heads/main` and `refs/heads/coder/perfection-audit-2026-08-22` at `707ce8373aa848dd594d6e14ec0c7b2611f8d726`.

The new release received Vercel production deployment `dpl_Bo7Li3RXL171cLjaS4yjdRWQWTrq`, which progressed from `QUEUED` to `BUILDING` to `READY` for GitHub `main`. The active alias serves the matching entry asset `/assets/index-CuFITESx.js`. The documentation commit is intentionally separate and is not treated as application-code deployment evidence.

## Why this slice was selected

The product already had the right local-first seams but hid them behind generic terminology. Projects had a boolean archive state and assets persisted as local data URLs, yet the dashboard’s archive affordance was only rendered when at least one project existed. A maker with no archived projects therefore had no visible explanation of what the archive was or how to use it. The existing Assets panel already supported image upload and thumbnail management, so extending that surface was safer than inventing a second media store. The PDF renderer already had a single-project composition boundary, making an optional evidence section reversible and easy to test.

External craft-workflow research consistently points to a finished-object record as more than a grade: makers keep a project page, progress or finished photos, yarn and gauge details, notes, and an overview of planned, active, and finished work. Ravelry’s FAQ describes project pages with pictures and pattern, yarn, and other project information [1]. A knitting-journal product positions planned, active, and finished projects with notes as one overview [2]. Practitioner and community discussions likewise describe project tracking around pattern, yarn, gauge, needles, notes, progress pictures, and finished-object documentation [3] [4]. The implementation therefore treats a finished photo as **evidence attached to the production record**, not as a social feed or engagement counter.

## Implemented user experience

| Surface | Shipped behavior | Ownership and truth boundary |
|---|---|---|
| Dashboard archive | `Show Archived` remains visible in the empty-project/empty-archive state. When opened with no archived records, the dashboard presents a named archive panel explaining how to archive a project, offers a direct restore-backup action, and provides a return path to active projects. | Archive state remains local-first and reversible. No cloud archive or hidden remote collection was introduced. |
| Project workspace | The generic `Assets` workspace label is now **Gallery & Assets** across supported locales and the registry fallback. This makes the place for finished work explicit without adding another route or another media system. | The gallery lives inside the project that produced the work, preserving the production-control context. |
| Finished-work gallery | The Assets surface includes a visible Finished work section, an empty-state explanation, image upload, caption editing, featured-view selection, and per-photo PDF inclusion. Existing reference-asset management remains available. | Images continue to use the existing local data-URL asset path. Metadata is optional and backward-compatible, so older projects and ordinary reference photos remain valid. |
| Project PDF | PDF defaults include an optional `includeFinishedPhotos` preference. The export options show a localized Finished Work Photos control. The renderer includes only assets marked `isFinishedWork` and `includeInPdf`; ordinary reference photos are not silently promoted into finished evidence. A labeled photo section is rendered when eligible photos exist. | The export remains a browser print/save preparation flow. The UI does not claim that the device has durably saved or delivered a PDF. |

The canonical asset schema now supports the optional fields `caption`, `isFinishedWork`, `isFeatured`, and `includeInPdf`. The existing reducer/action seam persists these fields without a new service, connector, account requirement, or migration that could compromise local ownership.

## Validation evidence

The focused feature and accessibility suite passed **9 files / 44 tests**, including gallery contracts, asset behavior, PDF language and renderer behavior, archive copy, residual touch targets, responsive layout, dashboard selection, shell navigation, and New Project touch targets. The complete application gate passed **223 files / 2,574 tests**. Application and workspace TypeScript checks passed. The production build passed in **5.29 seconds**.

Source-bundle verification passed with archive SHA `c19b71cdd06d250326d80eddc27685cbb627f91b03d85a624f0bb4894ba2a082` across 15 protected files. The protected invention brief remained unchanged at SHA-256 `5a7668a95841e7e74fc2dcf702cf1ffa94deed06d7029116919dcc0489b609ce`.

A fresh isolated browser smoke against the **active public alias** passed at 390px, 768px, and 1024px. It verified the visible empty archive guidance, Gallery & Assets activation through the real mobile sheet or desktop tab strip, the Add Finished Photo form with image input and caption field, the PDF photo option and no-photo guidance, and no body/document horizontal overflow at any of the three widths. The smoke did not upload a real user photograph to a remote service; that is intentional because the product is local-first and the browser handoff boundary must remain truthful.

## “Feels like home” opportunities found during the audit

The immediate slice establishes the most valuable foundation: a project can graduate from grading into a private, visual finished-work record and carry selected evidence into its PDF. Several adjacent ideas are valuable but were deliberately not smuggled into this release.

| Opportunity | Value | Decision |
|---|---|---|
| Completion handoff after a clean grade | Gives the maker a calm next step: “Save the finished piece” rather than ending at a numeric result. | Strong next touchpoint. Add only after a separate copy/accessibility review so it does not become gamification or a success claim. |
| Finished-work timeline | A small ordered journal of start, progress, finish, and revision images would make the record feel personal and useful for repeat sampling. | Follow-up; reuse the same asset metadata and avoid a second storage model. |
| Featured cover image for Project Book | A selected finished image could lead a multi-project portfolio document. | Strong follow-up, but Project Book currently does not include assets; expand only with a dedicated renderer design and evidence tests. |
| Captions and maker notes | Captions make photos useful later, especially for fit observations, construction changes, or yarn substitution memory. | Included now as optional captions in Gallery & Assets; broader notes remain in the existing Notes surface. |
| “Made / gifted / sold / archived” lifecycle | Reflects real ownership and helps a maker distinguish an active pattern from a finished object. | Research/design item; do not conflate it with the existing archive boolean until its semantics are separately defined. |
| Private gallery index across projects | A calm visual home view would help a maker revisit finished work without opening each project. | Valuable but requires a cross-project index and careful local-storage/performance design; deferred. |
| Social/share card from selected photo and grade | Useful for social-first users, but must preserve privacy, attribution, and browser-handoff truth. | Defer to the existing Brag Card and export research boundaries; no automatic posting or engagement mechanics. |
| Cloud sync or account gallery | Enables device-to-device access but changes the product’s trust and privacy model. | Not part of this slice; local-first ownership remains the product default. |

## Residual risks and explicit non-claims

The release does not claim that finished photos synchronize between devices, upload to a server, or survive a browser-profile reset. It does not add photo pages to the multi-project Project Book export yet. It does not create a social feed, streak, counter, or gamification layer. It does not claim durable completion of browser print/save/share/download handoffs. Future custom-domain verification and authenticated MCP testing remain separate release tasks.

Known non-blocking diagnostics remain the project’s existing non-browser `indexedDB is not defined` reducer-test logs and six Vite sourcemap-location warnings. Widths below 390px were not part of this active-alias smoke. No connectors or schedules were modified.

## References

[1]: https://www.ravelry.com/help/faq/ "Ravelry FAQ — project pages, pictures, pattern, yarn, and project information"

[2]: https://apps.apple.com/us/app/knit-knitting-journal/id1558427713?platform "Knit Knitting Journal — planned, active, and finished project overview"

[3]: https://shortrounds.co.uk/how-i-track-my-knitting-projects-tools-yarn-notes-and-my-planning-system/ "Short Rounds — tracking knitting projects, tools, yarn, notes, and gauge"

[4]: https://www.reddit.com/r/knitting/comments/ycrrhh/any_good_knitting_apps_or_ways_to_track_document/ "Knitting community discussion — project tracking, progress pictures, and notes"
