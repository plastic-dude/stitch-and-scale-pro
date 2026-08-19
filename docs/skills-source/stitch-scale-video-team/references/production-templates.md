# Production Templates

## Director brief

```markdown
# Production Brief — [project]

plan_id: [unique id]
angle_slug: [unique pain angle]
format: [9x16 / 1x1 / 16x9]
runtime: [seconds]
audience: [specific designer segment]
status: [research-needed / director-review / approved-for-generation]

## Pain and promise
Pain: [one concrete problem]
Private fear or cost: [what the viewer worries will happen]
Promise: [what the video lets them understand, not an unverified outcome]
Final beat: [the final image and line]

## Research ledger
| Question | Source | Date | Finding | Decision changed |
|---|---|---:|---|---|

## Claim ledger
| Claim | Evidence/source | Confidence | Spoken? | On-screen? |
|---|---|---|---|---|

## Assets and risks
| Asset | Version | Owner/location | Rights | Risk |
|---|---|---|---|---|
```

## Script and audio cue

```markdown
## Cue [number] — [time]
Narrator: [exact spoken words]
Intent: [what the line makes the viewer feel or understand]
Delivery: [pace, intimacy, energy, breath]
Sound bed: [room tone / original music / silence / effect]
Visual relationship: [what the image proves beyond the words]
Caption text: [exact caption, or NONE]
Caption zone: [declared safe zone]
```

## Shot list

| # | Duration | Framing/movement | Observable action | Proof purpose | Audio/caption | End state |
|---:|---:|---|---|---|---|---|
| 01 | 0–3s | [shot] | [one action] | [why it exists] | [cue] | [final frame] |

Every shot must express one observable action or reaction. Do not put a whole scene, multiple UI states, and multiple claims into one generation prompt.

## Caption map

Define before generation:

```yaml
caption_policy: accurate_access_captions
safe_zone: lower-left, above proof UI; exact pixel bounds recorded per format
max_lines: 2
max_characters_per_line: 38
background: none or restrained translucent backing only when it does not cover proof
editorial_overlay_policy: one non-caption text layer at a time
forbidden_overlap: faces, hands, tables, numbers, buttons, primary action, product logo
```

If captions cannot fit without obscuring proof, rewrite the narration or redesign the shot. Never solve the conflict by shrinking text until it becomes unreadable.

## Filename and manifest

Reserve a unique filename before generation:

```text
SS_<campaign>_<angle>_<format>_<version>_<status>_<YYYYMMDD-HHMMSS>.mp4
```

Example:

```text
SS_founder-receipt_stale-number_9x16_v001_director-review_20260819-143000.mp4
```

Store this manifest in Git, while storing the MP4 externally:

```yaml
video_id: [same as filename without extension]
filename: [exact filename]
angle_slug: [angle]
format: [dimensions/aspect]
version: v001
status: [blocked / director-review / approved / published / rejected]
script_version: [id]
plan_version: [id]
caption_version: [id]
audio_version: [id]
research_note: [path]
external_store: Google Drive
external_folder_id: [non-secret folder id]
drive_file_id: [id after upload]
drive_url: [link]
sha256: [checksum]
created_at: [RFC3339]
qa: [pass/fail plus report path]
notes: [short factual note]
```
