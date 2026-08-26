# Pass 2: Smallest Viable Steps for "Reaching the Real User"

**Date:** 2026-08-26  
**Cycle:** CHK-252  
**Status:** Design Complete (Pass 2 of 2)  
**Reference Brief:** `docs/research/reaching-the-real-user-2026-08-24.md`  
**Pass 1 Evidence:** `docs/leader-notes/cycle-2026-08-26-CHK-251-reaching-real-user-pass1.md`  
**Live HEAD:** `2122c3f`

## 1. Finding 1: MCP Discoverability
**Confirmed Gap:** The MCP layer is invisible to users; no in-app configuration UI exists for the `/api/mcp` endpoint or API key.

### Smallest Viable First Step: "Developer Settings" Section
Instead of a complex management system, add a dedicated **"Developer & MCP"** section to the existing Settings page. This section will surface the live production endpoint and provide a way for technically-inclined makers to use the live tools.

| Component | Design |
|---|---|
| **Settings Section** | Add "Developer & MCP" at the bottom of `settings.tsx`. |
| **Endpoint Display** | Show the read-only production endpoint URL (e.g., `https://stitch-and-scale-pro.vercel.app/api/mcp`) with a copy button. |
| **Status Badge** | A simple "MCP Server Active" indicator based on the current environment. |
| **Instructions** | Localized text explaining how to use this URL in Claude/MCP clients. |

**Non-Goal:** Managing the `MCP_API_KEY` in-app (too high risk for Phase 1). The owner still manages the key via Vercel.

## 2. Finding 2: Accessibility Audit
**Confirmed Gap:** No dedicated app-specific accessibility audit exists in `docs/`.

### Smallest Viable First Step: The "Core Path" Accessibility Audit
Perform a manual and automated audit of the **Trust-Critical Path** (New Project → Measurement Entry → Grading Result → PDF Export).

| Action | Design |
|---|---|
| **Automated Baseline** | Add `axe-core` to the test suite and run a baseline scan of the `project-workspace` and `project-grading` routes. |
| **Manual Focus Pass** | Verify keyboard-only navigation for the grading table and measurement forms. |
| **Screen Reader Pass** | Audit the ARIA labels and relationships in the `McpGradingAssistantCard` and `PublicationIntegrity` status badges. |
| **Log Outcome** | Record findings in `docs/audit/accessibility-2026-08-26-core-path.md`. |

## 3. Finding 3: Cross-Device Continuity
**Confirmed Gap:** Framing is limited to "Backup/Restore" with no mention of cross-device movement.

### Smallest Viable First Step: "Switch Device" Framing
Re-frame the existing `OriginMigrationPackage` flow to explicitly mention cross-device movement in the UI.

| Location | Design |
|---|---|
| **Settings UI** | Update the Data section header to "Backup & Device Sync." |
| **Action Labels** | Change "Download Backup" to "Export for Another Device" and "Restore from Backup" to "Import from Another Device." |
| **Onboarding Hint** | Add a one-sentence tip to the final onboarding step: "Working on multiple devices? Use the Export/Import tool in Settings to move your workspace." |
| **Storage Badge** | Update the popover warning to include "Switching to a laptop? Export your data first." |

## Conclusion
These three designs represent the smallest possible footprint that addresses the "reachability" gap for each finding. Implementation tickets `QUEUE-071`, `QUEUE-072`, and `QUEUE-073` should now be opened to execute these steps independently.
