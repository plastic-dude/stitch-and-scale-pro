# Cycle 64 visual inspection notes

The clean 360px onboarding screenshot `chk127--android-360--overlay-before-skip.png` shows a stable first-launch screen with the Stitch & Scale mark at left, progress indicator, and `Skip setup` at the upper right. The Skip control is visible and does not overlap the onboarding content.

The post-onboarding screenshot `shell-nav--android-360--settings-activated.png` shows the actual mobile shell at the top of a live Settings screen. Projects, Portfolio, and Settings are visibly represented by compact icon-only controls, with the New Project plus control at the far right. The measured hit areas for the three icon-only destinations are 36×36 CSS pixels at 360px, 390px, and 430px; each real pointer activation succeeded, but the controls are below the supplied 44×44px minimum touch-target standard. This is a distinct residual from the now-verified #64 and #65 navigation fixes.

The Project Details capture `project-details-modal--empty__iphone-390.png` shows the Add New Section action opening an inline bottom form with a Section Name input, Save, and Close. It is not a Radix dialog, so future autocomplete checks must target the visible page input rather than `[role="dialog"]`.

The Settings capture `settings--export-workspace-after-action__iphone-390.png` shows the Data & Backups card with a clearly labeled `Download Backup` action and an `Upload File` restore action. The visual state is stable and readable at 390px; the current deep-state probe recorded no browser errors, but did not obtain a download artifact because it targeted the descriptive heading rather than the download button.
