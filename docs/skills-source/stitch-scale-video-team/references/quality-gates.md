# Video Quality Gates

Run these gates after generation and before an asset can be marked `approved`.

## Story and claim gate

Watch once without stopping. The opening must identify a concrete human problem, the middle must reveal a verifiable product proof, and the final beat must make an honest tester-first request. Compare every spoken and visible claim with the claim ledger and current product surface. Mark anything unsupported `UNVERIFIED` and reject public advancement.

## Caption and graphics gate

Watch captions off for visual clarity, then captions on for safe-zone compliance. Captions must be accurate, readable, synchronized, and subordinate to the proof. No caption or editorial overlay may obscure a face, hand, table, number, button, menu, product logo, or primary action. There must be no invented UI text, changing numbers, illegible labels, decorative copy that competes with the product, or multiple editorial text layers fighting for attention.

## Voice and audio gate

Listen once for story and once for technical defects. Confirm one narrator family or an explicitly documented speaker map. Reject mixed voice models, doubled words, overlapping speech, sudden accent or room-tone changes, audible edit clicks, harsh processing, and music or effects that mask consonants. Confirm the soundtrack remains intelligible at low volume and on ordinary speakers where possible.

## Product-proof gate

The video must show the product doing the claimed thing. A dense screen is an establishing view, not proof of exact values. Use zoomed shots for one measurement family, row, warning, or state change. Confirm that the screen is an approved capture or reference and that generated footage has not invented labels, buttons, values, currencies, or logos.

## Mobile and composition gate

Review at the intended export dimensions and at a small mobile preview. Confirm critical text and proof remain readable, touch-sized visual controls are not falsely represented, safe zones are respected, and the main subject is not buried under captions. Validate every shot’s start state, action, and end state.

## Technical and storage gate

Check duration, resolution, frame rate, aspect ratio, codec, audio presence, audio channel layout, loudness consistency, and export integrity. Confirm the filename is unique, the SHA-256 checksum is recorded, the full-resolution file is in the external archive, and the Git manifest contains the Drive file ID or external-store reference. Keep OAuth credentials and refresh tokens outside Git and outside public links.

## Verdict format

```markdown
# Video QA Verdict — [video_id]

status: [approved / director-review / rejected / blocked]
reviewer: [role]
reviewed_at: [RFC3339]

## Evidence
- Story/claim: [pass or defect with evidence]
- Captions/graphics: [pass or defect with timecode]
- Voice/audio: [pass or defect with timecode]
- Product proof: [pass or defect with timecode]
- Mobile/composition: [pass or defect with output size]
- Technical/storage: [pass or defect with measured values]

## One next action
[One scoped action for the owning agent.]
```
