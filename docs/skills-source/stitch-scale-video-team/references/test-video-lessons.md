# Test-Video Failure Reference

The supplied test video is approximately 103 seconds, 1280×720, 30 fps, H.264 with mono AAC audio. It demonstrates a useful niche-specific script but fails the proof hierarchy when narration captions cover the product interface.

## Observed failure modes

### Captions obscure proof

The captions are very large and span the lower-middle of the frame. At approximately 00:35, the caption covers the grading table, including the numbers the narration claims viewers should inspect. In the opening, the caption covers the hands, paper, pen, and measuring action. In later screen recordings, it hides navigation and lower status regions.

**Prevent:** map the caption-safe zone before writing the shot list. A caption may never cover a table, number, button, face, hand, or primary action. Review a representative frame at intended mobile size, not only on a desktop monitor.

### Editorial and generated text collide

The video combines large narration captions, small upper-left claims, native UI labels, and possible composited callouts. The viewer cannot instantly distinguish product truth from editorial text. Generated text can hallucinate labels, numbers, or claims and should never be treated as the source of truth.

**Prevent:** use one editorial text layer at a time. Prefer real screen captures and approved post graphics. Delete decorative copy that does not change understanding.

### Dense screen proof is too small

A full table may establish that the product has depth, but it cannot prove exact numbers on mobile at this scale. Use one establishing shot followed by deliberate zoomed proof shots that show one row, one size relationship, or one warning at a time.

### Mixed-voice risk

Automated transcription found one continuous narration and the file contains one mono channel, but that does not prove speaker continuity. The user reported mixed voices at points, so the team must listen for voice identity drift, doubled words, overlap, accent changes, different room tone, inconsistent mic distance, and incompatible emotional registers.

**Prevent:** declare one narrator family per video. If intentional dialogue exists, provide a speaker map and clean edit boundaries. Never mix voice models or takes merely to repair a weak line.

### Feature-tour drift

The script names real knitwear workflow features and is stronger than generic SaaS copy, but it behaves mostly like a sequential feature tour. Future scripts should dramatize one high-stakes designer problem, show a surprising contradiction, provide one proof surface, and end with a memorable tester-first line.

## Mandatory review passes

The Generator and Reviewer must perform: uninterrupted watch-through; captions-off visual clarity; captions-on safe-zone check; mobile legibility; voice-continuity listening; claim-to-script comparison; generated-text inspection; and filename/checksum verification. A visual or audio defect must be regenerated or recut, not hidden beneath additional text or music.
