# Stitch & Scale Promotional Test Video — Lessons Learned

**Source:** `/home/ubuntu/upload/47e38440-9b5e-11f1-8f35-1d407b2dec04.mp4`

**Analysis date:** 2026-08-19

## Technical baseline

The file is a 103.04-second, 1280×720 H.264 video at 30 fps with a mono AAC audio track at 24 kHz. The file is approximately 7.27 MB. These values are useful as a baseline only; they do not prove that the video is suitable for a target platform.

## Directly observed visual defects

The most important defect is caption obstruction. Captions are rendered as very large, high-contrast text across the lower-middle of the frame rather than inside a restrained caption safe zone. In the representative 00:35 frame, the captions cover the central grading table, including the exact numbers the video is supposed to prove. They also cover lower navigation and status regions in the screen recording. This creates a direct conflict between narration access and product proof.

The first live-action section uses captions over the hands, paper, pen, and measuring action. That weakens the tactile opening because the caption becomes the dominant visual object. During the product demonstration, the caption block is not merely close to the interface; it physically hides the interface. This fails the rule that a promotional video must never obscure the evidence it is asking the viewer to trust.

The video also uses multiple visual-text layers at once. A small upper-left product statement, the software’s own UI labels, and a large narration caption compete for attention. Some overlay copy appears to be generated or composited rather than native product UI. The result is a hierarchy problem: the viewer cannot immediately tell which text is product truth, which text is editorial commentary, and which text is merely decoration.

The screen-recorded table is too dense for a 1280×720 social-video frame when shown at this scale. Even where the numbers are technically present, many are too small to be legible on mobile. A full-table shot should therefore be treated as an establishing view only. Proof shots must zoom into one row, one measurement family, or one verdict at a time.

The table contains mixed visual states and crowded navigation. The screen should be shown through a designed sequence of stable, purposeful states rather than a long static capture with narration laid over it. A viewer must be able to answer “what changed?” in each shot.

## Audio and voice findings

The extracted audio is a single-channel mono track, and independent transcription produced one continuous narration from 00:00.3 through 01:42.7. The transcription itself does not prove the absence of mixed voices, because voice identity and overlap require listening to the audio in context. The user’s report of mixed voices must therefore be treated as a valid production risk and a required review check, even though the automated transcript did not label multiple speakers.

The Generator must use one declared narrator identity per video unless a dialogue script explicitly names and separates speakers. It must not mix takes from different voices, accent profiles, emotional registers, or synthetic voice models. If a second voice is intentional, the script must include a speaker map, clean edit boundaries, and a review note explaining why the switch exists.

The audio review must include a listening pass at normal volume and a second pass at low volume on both headphones and ordinary speakers when available. The reviewer must check for overlapping phonemes, doubled words, sudden room-tone changes, contradictory breaths, changes in mic distance, abrupt accent changes, and music or effects masking consonants. The mono channel count is not evidence that only one voice was used.

## Script-quality assessment

The script is specific to the knitwear-design workflow and is substantially stronger than generic “save time and grow your business” copy. It names sizing standards, custom tables, grading bases, yarn estimation, live placeholders, tech editing, test-knit rosters, PDFs, and buyer readiness. That specificity is a strength.

However, the script remains mostly a feature tour. It does not yet dramatize a single high-stakes moment from the designer’s life, such as discovering that a supposedly graded 5XL is only a resized L, finding that a changed measurement left yesterday’s number inside the instructions, or realizing that a pattern price ignores the designer’s unpaid hours. Future scripts should select one pain, stage a visible contradiction, reveal the proof, and end with an honest tester invitation.

The product’s actual brand voice requires the founder’s honest outsider position: “I don’t know how to knit. My late mother did. I wrote the math so you don’t have to fight Excel at 11 PM.” Promotional scripts must never imply that David is a knitwear designer or that the product is already proven by revenue. They should sound like a builder asking designers to check his work, not a corporation claiming to transform a market.

## Non-negotiable prevention rules

| Failure class | Rule for Director/Planner | Rule for Generator | Rule for Reviewer |
|---|---|---|---|
| Caption obstruction | Design a caption map before the shot list; reserve a safe region that never overlaps the product proof | Keep captions within the declared safe zone; reduce size and line count before covering content; reject any frame where captions cover a table, button, hand, face, or primary action | Pause on representative frames and mark any obscured proof as a defect, not a style preference |
| Generated text overlay clutter | Limit editorial text to one intentional layer at a time; decide whether the video is caption-led or callout-led | Do not invent UI labels, numbers, buttons, product claims, or floating text; use supplied assets or approved post graphics only | Compare every visible claim against the approved script and product capture |
| Small data | Plan a sequence of close proof shots, each showing one claim | Zoom, crop, or replace the shot; never rely on a dense full-screen table to communicate exact numbers | Verify critical text at intended mobile output size |
| Mixed voices | Name the narrator and provide a voice-continuity plan | Use one narrator/take family unless a deliberate speaker change is scripted; never crossfade incompatible voices | Listen for identity drift, doubled speech, overlaps, and room-tone discontinuities |
| Generic script | Choose one pain angle and one surprising turn; use a concrete designer situation | Generate one complete video from the approved brief, not a generic feature montage | Reject feature lists that have no character, stakes, proof, or memorable final line |
| False claims | Anchor every claim to the current product and brand brief | Do not improvise pricing, adoption, revenue, capabilities, or founder credentials | Mark unsupported claims UNVERIFIED and return the video for correction |
| Naming conflicts | Assign a unique angle slug and version before generation | Use `SS_<campaign>_<angle>_<format>_<version>_<status>_<YYYYMMDD-HHMMSS>.mp4` | Reject duplicate or ambiguous filenames and record checksum |

## Recommended creative angles

The team should not repeatedly make one generic product overview. The Director should rotate distinct angles such as: the “XXL lie” where checkbox grading breaks outside the sample size; the 11 PM spreadsheet burden; the changed measurement that leaves stale instructions behind; the local-first privacy promise; the invisible labor behind a fair pattern price; the test-knit roster that exposes missing size coverage; the outsider-founder confession; and the “show me the math” challenge.

Each angle must have a different hook, visual metaphor, proof surface, emotional turn, and final line. Reusing the same script with nouns swapped is not angle diversity.

## Delivery gate

A video is not approved until it passes a full watch-through, a technical pass, a captions-off visual clarity pass, a captions-on safe-zone pass, a voice-continuity listening pass, a mobile legibility pass, a claim-verification pass, and a filename/checksum manifest pass. Generated footage that contains impossible text, changing numbers, inconsistent UI, or a conflicting voice should be regenerated rather than hidden with more overlays.
