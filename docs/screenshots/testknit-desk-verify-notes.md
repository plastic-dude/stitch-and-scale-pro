# CHK-043 visual verification notes

- App renders on localhost:5000. Tab strip shows "Test Knit" (value=testknit) between Chart Lab and Submissions.
- Test Knit tab contains TWO cards: the existing "Test-Knit Programme" card (pre-existing) followed by the new "Test Knit Desk" card.
- Test Knit Desk card renders: description mentioning Yarnpond ghosting, "blocked" verdict banner, "1 erro(r)" + coverage count.
- Page scrolled to bottom showing Submissions card — need to scroll to the desk card specifically for screenshot.
- Quality gates: typecheck clean, vitest 744 tests / 43 files pass, build clean.
- Screenshot file to save: docs/screenshots/testknit-desk.webp (grab from /home/ubuntu/screenshots/ after viewing desk card).
