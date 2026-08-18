# Operational Record Backup and Restore Audit — 18 August 2026

**Branch:** `milestone/release-trust-and-records`  
**Scope:** Project-scoped operational records for samples, test knits, submissions, and wholesale follow-up  
**Author:** Manus AI

## Decision summary

The operational-record surface now provides a mobile-first JSON backup and restore workflow in addition to the existing CSV export. The backup is intentionally scoped to one project, carries an explicit `stitch-and-scale-operational-records` kind, preserves stable record IDs, and is rejected when the project identifier or envelope is invalid. Restore is not an implicit overwrite: the file is parsed first, then an inline confirmation step names the replacement action before persistence.

> **Release posture:** the workflow is suitable for continued release-candidate review. It is not a cloud-sync or accounting system; it is a local, portable record path with deterministic validation and explicit replacement semantics.

## Research basis

The implementation uses the browser’s `Blob` interface to construct a portable JSON file and a download URL. MDN describes `Blob` as a file-like immutable data object that can be read as text or binary data and constructed from serialized JSON [1]. The browser file input supplies a `File`; the application reads it asynchronously through the file’s text interface, consistent with the FileReader text-reading model described by MDN [2].

The application continues to persist operational records through the existing project-scoped local storage seam. This is deliberate: the existing `projectStorage<T>` contract keeps per-project state isolated. IndexedDB remains the project-data storage path elsewhere in the application; MDN identifies IndexedDB as the appropriate browser API for larger structured client-side data, while Web Storage is more limited [3]. This milestone does not introduce cloud sync, analytics, background transfer, or a second persistence system.

## Portable contract

| Property | Behavior |
|---|---|
| Envelope kind | `stitch-and-scale-operational-records` |
| Envelope version | `1` |
| Project identity | The project ID appears both in the envelope and in the nested operational-record payload. |
| Record families | Samples, test knits, submissions, and wholesale orders. |
| Identity | Existing stable record IDs are preserved; records are not regenerated during restore. |
| Validation | Restore rejects malformed JSON, the wrong envelope kind, unsupported version, missing collections, or a different project ID. |
| Persistence | Confirmed restore writes through the existing project-scoped storage handle. |
| User safety | Restore presents an inline confirmation with cancel and confirm actions; browser-blocking dialogs are not used. |
| Localization | Backup title, explanation, actions, warning, confirmation, cancellation, and status feedback exist in `en`, `de`, `fr`, `es`, and `pt`. |

## Mobile interaction review

The Design Ledger smoke journey was rerun against the Vite preview at the established mobile widths of 320, 360, 390, and 430 CSS pixels. At 390px, it confirms that the backup panel is visible, both JSON actions are discoverable, the operational-record card has no horizontal overflow, a sample record can be added, and the record survives a full reload and reopening of Design Ledger. Controls retain the project’s minimum 44px interaction-height convention.

The file restore parser and envelope validation are covered deterministically at the engine seam. The browser smoke deliberately verifies the visible recovery panel and the existing local persistence path without relying on a brittle synthetic file-input implementation in headless Chromium. This keeps the end-to-end check stable while the file payload contract remains covered by unit tests.

## Test and build evidence

| Gate | Result |
|---|---|
| Full Vitest regression | **143 test files / 2,014 tests passed** |
| TypeScript typecheck | **Passed** |
| Production build | **Passed**; Vite completed in 8.91 seconds. Existing large-chunk advisory remains informational. |
| Whitespace | **Passed** with `git diff --check`. |
| Mobile smoke | **Passed** across all eight journeys, including backup controls and operational-record recovery. |
| Focused operational tests | **6 tests passed** for records and five-locale backup copy. |

## Remaining decisions and limits

The JSON backup is readable and restorable outside the app only in the sense that it is a documented, UTF-8 JSON artifact; it is not intended to be hand-edited. CSV remains the better accounting-review format. The restore action replaces the current operational-record collection for the active project after confirmation; it does not merge individual records or restore other project data. A future milestone may add a preview of counts and timestamps before confirmation, but adding that preview is not required to claim the current contract.

The workflow does not certify physical print quality, test-knit correctness, tax treatment, profitability, or cloud durability. Those remain outside this milestone and within the release hold already recorded in the release-candidate artifact audit.

## References

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Blob "MDN Web Docs — Blob"

[2]: https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsText "MDN Web Docs — FileReader: readAsText() method"

[3]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API "MDN Web Docs — IndexedDB API"

## Pre-restore preview update

The restore flow now parses a valid backup into a non-mutating candidate before presenting replacement actions. The compact preview shows the active project name, the backup timestamp from the file, total record count, and counts for samples, test knits, submissions, and wholesale orders. It also states that confirmation will replace the current operational records for this project. Cancel leaves the current records untouched.

The parser rejects invalid JSON, the wrong envelope kind, unsupported version, wrong project ID, missing record collections, and invalid backup timestamps. The normalized records used after confirmation receive a fresh `updatedAt`, while the preview preserves the source backup timestamp so the designer can distinguish the artifact being reviewed from the time of local restoration.

The updated acceptance evidence is **143 test files / 2,015 tests passed**, typecheck passed, the production build completed in 8.48 seconds, `git diff --check` passed, and the eight-journey mobile smoke suite passed. The smoke suite confirms the backup panel, visible JSON actions, accessible restore file input, 390px overflow safety, and local record recovery after reload. No protected renderer or grading-engine file was modified.

| Preview concern | Result |
|---|---|
| Wrong project | Rejected before preview. |
| Malformed or incomplete envelope | Rejected before preview. |
| Invalid timestamp | Rejected before preview. |
| Counts and identity | Shown before confirmation. |
| Replacement semantics | Explicit warning plus separate cancel and confirm actions. |
| Current records on cancel | Not mutated. |

## Project-wide snapshot coverage update

The canonical `exportSnapshot` and `importSnapshot` seam now includes an `operationalRecords` map keyed by project ID. Settings-page exports and the always-visible quick-backup path both use this canonical snapshot, so a project-wide JSON backup contains patterns, settings, and project-scoped operational records rather than only the project list.

Merge semantics remain conservative. In merge mode, an incoming project ID that already exists remains the workspace truth and its current operational records are not overwritten. Operational records are restored only for genuinely new projects. Replace mode installs the incoming project list, removes orphaned `stitch-and-scale-operations-*` keys, and restores valid records for the incoming project IDs. Settings remain additive as before.

The dormant Settings `importData` API now delegates to the same canonical importer, preventing a future caller from silently restoring projects while omitting operational records. Backup and restore status messages on the Settings page are localized in all five supported locales.

| Snapshot surface | Operational-record behavior |
|---|---|
| Settings-page export | Includes `operationalRecords` keyed by project ID. |
| Header quick backup | Uses `exportSnapshot`, so it includes the same record map. |
| Settings-page merge restore | Adds records only alongside newly landed projects; existing project records remain untouched. |
| Replace restore | Removes orphaned operational keys and restores incoming project records. |
| Backup ledger | Records the snapshot payload size including operational records. |

Storage regression coverage now includes **26 storage tests**, including live snapshot export, new-project merge restore, collision preservation, replace cleanup, and operational-record recovery. The localized Settings backup-copy test adds one test across all five locales.

## Final project-wide snapshot gate

The canonical snapshot extension passed the complete release gate: **144 test files / 2,018 tests**, TypeScript typecheck, production build in 8.52 seconds, `git diff --check`, and all eight mobile-smoke journeys. The branch remained free of protected-file changes, and the working tree was clean before staging this milestone.

## Project-wide restore preview update

Settings restore now parses and inspects a snapshot before any storage mutation. The mobile-safe preview shows the number of projects in the file, the total operational-record count, and whether workspace settings are included. It explains that the default action is a non-destructive merge: new projects and their records are added, while existing projects and records remain preserved. The designer must choose either **Cancel restore** or **Merge backup**.

The preview fails closed for malformed top-level data and malformed operational-record partitions instead of silently presenting partial counts. The actual merge remains delegated to `importSnapshot`, preserving the canonical storage seam and the established project-ID collision policy.

The Settings smoke checkpoint confirms at 390px that the Data & Backups card, Download Backup action, Upload File action, accessible restore input, and no-overflow layout are present. The updated release gate passed with **144 test files / 2,020 tests**, typecheck, production build in 9.22 seconds, `git diff --check`, and all nine mobile-smoke checks.

| Restore preview property | Result |
|---|---|
| Mutation on file selection | None; selection only creates pending preview state. |
| Project count | Shown before merge. |
| Operational-record count | Shown before merge. |
| Settings inclusion | Shown when present. |
| Existing workspace data | Preserved by the default merge policy. |
| Malformed partitions | Rejected before preview. |
| Mobile layout | Verified at 390px with no horizontal overflow. |
