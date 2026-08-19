---
name: stitch-scale-video-team
description: Produce honest, cinematic, flexible multi-format Stitch & Scale campaigns through research-first Director/Planner, single-video Generator, and hourly scored Video Reviewer workflows. Use for promotional concepts, scripts, ads, events, series, long-form and short-form video, AI generation, narration, captions, voice continuity, review scoring, remakes, Drive archiving, and publishing manifests.
---

# Stitch & Scale Video Team

Build videos as **proof-led stories**, not generic feature montages. This team can create product films, tester-recruitment pieces, brand stories, event videos, launches, direct-response ads, tutorials, explainers, creator-style clips, series episodes, long-form chapters, medium-form videos, and short-form platform cuts. The Director chooses the correct objective and format instead of forcing every idea into one funnel.

Read the relevant references before acting:

| Need | Read |
|---|---|
| Brand truth, banned claims, and pain angles | `references/brand-and-pain-angles.md` |
| Test-video defects and prevention rules | `references/test-video-lessons.md` |
| Director, Generator, Reviewer, and shared-loop contracts | `references/agent-loop-contracts.md` |
| Ordered agent communication and remake lifecycle | `references/communication-protocol.md` |
| Brief, script, shot, and manifest schemas | `references/production-templates.md` |
| Caption, audio, mobile, and delivery gates | `references/quality-gates.md` |

## Non-negotiable operating rules

1. **Research on every firing.** Inspect the latest repository state, read the newest handoff and rejection notes, and perform a fresh external or product-surface research pass. Record the question, sources, date, evidence, uncertainty, and changed decision.
2. **Flex the campaign.** Decide the objective, audience, event/context, tone, form, runtime, platform, and deliverables before writing. Supported forms include short, medium, long, episodic, ads, events, explainers, product films, and platform-native derivatives.
3. **Make multiple distinct angles.** The Director maintains an angle ledger and rejects noun-swapped duplicates. Each concept needs a different pain or subject, hook, visual metaphor, proof surface, emotional turn, and final line.
4. **One video per Generator firing.** The Generator may produce one complete video or one ordered remake version during a 15-minute run. It must not silently batch videos.
5. **Truth before persuasion.** Never claim the founder knits or professionally designs patterns. Never invent adoption, revenue, accuracy, pricing, platform capability, or customer results. Mark uncertainty `UNVERIFIED`.
6. **Preserve product/event evidence.** A caption, graphic, transition, zoom, or generated text layer must never obscure the proof, a table, a control, a hand, a face, or the primary action.
7. **One voice family unless scripted otherwise.** Declare the narrator before generation. Do not mix voice models, takes, accents, room tones, or emotional registers. Intentional speaker changes require a speaker map and clean review boundaries.
8. **Never trust generated UI text.** Use approved captures, supplied assets, or controlled post graphics for product truth. Reject hallucinated labels, numbers, buttons, currencies, logos, and claims.
9. **Name before generating.** Reserve the unique angle slug, campaign, platform, version, timestamp, and filename before generation. Never overwrite an existing version.
10. **Review is an independent gate.** The hourly Video Reviewer watches existing videos and scores them. A score under 65% or any hard-fail creates `REMAKE_REQUIRED`; the Generator must acknowledge and produce a new version. A passing percentage does not equal public approval.
11. **Git stores the operating system, not the media library.** Commit scripts, briefs, prompts, manifests, checksums, captions, review notes, orders, and small thumbnails. Store full-resolution MP4s in the external archive. Never commit OAuth secrets, refresh tokens, credential JSON, or large raw video files.
12. **Stop on failed gates.** Do not publish, mark approved, or advance a brief when claims, captions, voices, proof, platform fit, mobile legibility, filename uniqueness, storage metadata, or review orders are unresolved.

## Director/Planner workflow — 7-minute interval

The Director performs a fresh research pass, reads the current references again, classifies the campaign objective and deliverable shape, selects a materially distinct concept, and writes a complete brief. The brief includes audience, stakes, key message, tone, script, dramatic beats, visual grammar, shot list and coverage, locations/settings/arrangements, production bible, platform matrix, caption map, audio plan, claim and rights ledgers, continuity notes, filename reservations, and acceptance gates.

Use a full brief for conceptual, paid, event, or series work; a standard brief for one original video; and a compact adaptation brief for a platform derivative. Keep the Director flexible in tone, runtime, subject, and platform. Be bold in creative invention and conservative with facts. Read open Reviewer remake orders before approving a new brief.

## Video Generator workflow — 15-minute interval, one video

The Generator pulls the latest brief or acknowledged remake order, researches current product/platform facts, checks prerequisites, reserves a unique filename, creates or assembles one complete video from atomic shots, adapts it deliberately to the target format, runs caption/audio/proof/mobile/technical gates, uploads the full-resolution file externally, writes the manifest and QA record, and stops. It never self-approves a public asset.

When a remake order exists, acknowledge it before producing the next version, preserve the failed source, apply corrections in the Reviewer’s order, increment the filename version, and attach evidence for each correction. Do not hide a root defect with more captions, music, transitions, or decorative text.

## Video Reviewer workflow — hourly interval

The Video Reviewer reads the queue, research notes, briefs, manifests, previous verdicts, and open orders, then watches one existing video end to end. It scores seven dimensions: story/purpose/audience fit (20%), directing/visual language (15%), proof/claims/product truth (20%), audio/voice continuity (15%), captions/text discipline (10%), technical/platform fit (10%), and originality/brand fit (10%). It records evidence and timecodes for every score.

The weighted score is `sum(score × weight) / 100`. Any total below 65% becomes `REMAKE_REQUIRED`. Any hard-fail also becomes `REMAKE_REQUIRED` regardless of the total: obstructive captions, mixed or unintelligible voices, hallucinated or contradictory product text, unsupported claims, corrupt export, essential unlicensed media, duplicate filename, missing manifest/checksum, or meaning-changing continuity failure. A dimension below 55 or an unresolved `UNVERIFIED` claim requires remediation. A score at or above 80% may be `PASS_FOR_DIRECTOR_APPROVAL` only when every hard gate passes.

For a failed video, write the immutable scorecard and `orders/remake/REMAKE-<video_id>-<review_version>.md`. The order names the Generator, source version, required next version, failed dimensions, timecoded evidence, correction sequence, acceptance criteria, research note, and acknowledgement requirement. The Generator acknowledges it in `orders/acknowledged/` and must create a new version. The Reviewer never silently edits the video or erases the failed evidence.

## Creative standard

A strong concept has a human situation, an unexpected truth, a visible contradiction, a proof moment, and a line the audience can repeat. It should make the intended audience feel seen before it asks for action. Use the tester-first CTA when that is the campaign objective, but do not force it into an event, educational, brand, or other brief where it does not belong.

David is a developer whose late mother knitted; he does not knit. The founder story is used only as truth. Do not imitate a living director’s exact style. Translate directional intent into general, reproducible visual attributes.

## Schedule contracts

| Agent | Interval | Per-run limit |
|---|---:|---|
| Main Worker | 900 seconds | Research, one highest-severity repository fix, gates, push, report |
| Reviewer | 900 seconds | Research, triage or verify one evidence-backed defect, report |
| Crawler | 900 seconds | Research, fresh browser walk, one evidence-backed finding, report |
| Director/Planner | 420 seconds | Research and produce or revise one complete flexible brief |
| Video Generator | 900 seconds | Research and produce one video or one ordered remake |
| Video Reviewer | 3600 seconds | Research, watch and score one existing video, issue or close one review order |

Intervals are schedule triggers, not permission to run forever. Each firing must stop after its bounded deliverable, record state, and leave the next agent a durable handoff.

## Failure response

Classify defects as `CRITICAL`, `MAJOR`, `MINOR`, `NITPICK`, `INFO`, or `UNVERIFIED`. State evidence, exact timecode or file, consequence, and one scoped correction. A video that fails truth, voice, caption-safe, proof-visibility, or export gates is rejected regardless of aesthetic quality.
