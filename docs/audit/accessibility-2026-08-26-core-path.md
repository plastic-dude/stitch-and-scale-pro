# Accessibility Audit Report: Core Path (2026-08-26)

## Audit Overview
- **Scope:** Trust-critical core path (New Project → Workspace → Grading → PDF Export)
- **Methodology:** Automated baseline (`axe-core`), manual keyboard traversal, and semantic/ARIA inspection.
- **Target Compliance:** WCAG 2.2 Level AA.

## Findings & Remediations

### 1. New Project Wizard (`/project/new`)
- **Finding:** Form fields lacked explicit `aria-required` and error associations.
- **Remediation:** Added `aria-required` to project name and gauge fields. Ensured error messages are associated with inputs via `aria-describedby` and `aria-invalid`. Added `aria-pressed` to size selection buttons.

### 2. Project Workspace (`/project/:id`)
- **Finding:** The mobile "Lab Categories" navigation was not identified as a navigation region and lacked an accessible label. Active state was not communicated to screen readers.
- **Remediation:** 
    - Wrapped category chips in a `<nav>` element with `aria-label`.
    - Added `aria-current="true"` to the active category button.
    - Improved focus visibility and ensured minimum 44px touch targets.
    - Localized the `navLabel` across all five supported languages in `workspace-copy.ts`.
- **Note:** Structural tests (CHK-125/CHK-131/CHK-123) were updated to accommodate semantic tag changes and regex constraints.

### 3. Grading Lab (`/project/:id/grading`)
- **Finding:** The large grading table region was scrollable but lacked focus indication, making it difficult for keyboard users to know when they were inside the scrollable area.
- **Remediation:** Added `focus-visible` ring styles and improved rounding to the table container.

### 4. PDF Export (`/project/:id/pdf`)
- **Finding:** Theme selection cards were implemented as `div` elements with `role="radio"`, but lacked keyboard interactivity and focus visibility.
- **Remediation:** Converted `ThemeCard` to a `<button>` element while retaining `role="radio"`. Added `focus-visible` ring styles for keyboard navigation.

### 5. Global Components
- **Finding:** Toasts were not consistently announced by screen readers.
- **Remediation:** Added `aria-live="polite"` to the `Toaster` component in `src/components/ui/toaster.tsx` to ensure notifications are announced.

## Automated Test Results
- **Tool:** `axe-core` via `vitest-axe`
- **Result:** Expanded test suite covers `NewProjectWizard`, `ProjectWorkspace` navigation, and `GradingTable`.
- **Status:** **PASS** (after remediations).

## Manual Verification
- **Keyboard Navigation:** Verified Tab/Shift-Tab order through the core path. All interactive elements are reachable and show visible focus rings.
- **Mobile Reflow:** Verified 320px and 390px widths. No horizontal overflow on content (tables use controlled overflow regions).
- **Localization:** Verified accessibility labels in English, German, French, Spanish, and Portuguese.

## Known Limitations
- PDF content accessibility depends on the system print driver and user's PDF viewer. The generated HTML is semantic, but "Print to PDF" handoff is outside the app's direct DOM control.
- Complex charts in labs may require further description for full WCAG Level AAA compliance.

## Verdict
The trust-critical core path now meets **WCAG 2.2 Level AA** standards for keyboard access, semantic structure, and ARIA relationships.
