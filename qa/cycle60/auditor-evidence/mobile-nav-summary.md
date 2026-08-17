# Mobile navigation inspection summary

At 390px with a clean first-use context after onboarding skip, the visible workflow-group buttons are:

| Group | Bounding box |
|---|---|
| Design & Pattern · 12 | x=18, y=307, w≈141, h=44 |
| Sizing & Fit · 7 | x≈163, y=307, w≈102, h=44 |
| Pricing & Income · 15 | x=18, y=355, w≈142, h=44 |
| Launch & Marketing · 13 | x≈164, y=355, w≈158, h=44 |
| Selling Channels · 10 | x=18, y=403, w≈141, h=44 |
| Business & Community · 22 | x≈163, y=403, w≈180, h=44 |

A hidden/zero-rectangle button has accessible name `Open grouped list of all 79 workspace labs`, `data-testid=tab-navigator-trigger`, and text `All Labs`. The underlying 79 role=tab controls also exist in the DOM but have zero rectangles at this viewport, indicating that the mobile UI relies on a separate grouped navigator rather than the old visible flat strip.

The next required real-user check is to activate the visible group controls and/or the All Labs trigger through the actual mobile UI, verify that the grouped sheet/dropdown appears, and traverse representative and late labs. The current focused crawler’s text search did not find the hidden/zero-rectangle All Labs trigger because it is likely controlled by an icon or a different visible interaction surface.
