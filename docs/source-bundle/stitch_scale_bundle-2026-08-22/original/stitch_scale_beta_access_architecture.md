# Stitch & Scale: Beta Access, Tester Rewards, Cloud, OAuth, and Limited-Slot Recruitment

## Executive answer

Your idea is workable, but separate three things that are easy to confuse:

| Concern | What it is | Recommended timing |
|---|---|---|
| **Beta admission** | Who is allowed to test the unfinished product | Before the first tester cohort |
| **Tester entitlement** | Which premium features a tester may use and for how long | Before the first tester cohort |
| **Cloud project storage** | Whether project data is saved on your servers and synchronized across devices | After the first core-workflow beta unless cross-device storage is itself being tested |
| **OAuth login** | Sign-in through Google, Apple, or another identity provider | Usually after the first beta; not required to validate grading |

The best first-beta architecture is therefore:

> **A local-first product with a very small server-side beta control plane: email reservation, invitation, one-time access link, lightweight tester account, server-side feature entitlements, feedback collection, and abuse protection.**

You do **not** need to build full cloud synchronization or several OAuth providers before testing the core product. You do need enough server-side identity to make tester rewards reliable and to prevent a premium feature from being unlocked merely by editing browser storage.

## 1. How tester-only paid features can work

### The wrong approach: front-end-only unlocking

Do not unlock premium features only with a browser flag such as `isTester = true` or a local-storage value. That is easy to copy, edit, lose when browser data is cleared, and difficult to revoke. It also does not constitute a dependable account-level reward.

### The recommended approach: server-side entitlements

Create a lightweight user account when the tester redeems the invitation. The account does not need to contain the user’s pattern projects yet. It only needs to establish that the email address has been approved for the beta and which features that user may access.

The application checks the entitlement when the tester opens the product and when a protected action is requested. The interface may hide or label locked features, but the server must also enforce the rule for any protected API or export operation.

A conceptual entitlement record looks like this:

| Field | Example | Purpose |
|---|---|---|
| `user_id` | `usr_123` | Identifies the tester account |
| `feature_key` | `pdf_export_pro` | Names one premium capability |
| `source` | `beta_tester_reward` | Explains why access exists |
| `starts_at` | Beta redemption time | Controls activation |
| `ends_at` | 90 days later or beta end | Makes the reward temporary and clear |
| `limits` | `projects: 5` | Prevents unrestricted use if desired |
| `status` | `active` or `revoked` | Supports abuse handling and rollback |

Use a feature-key model rather than a single undifferentiated “premium” flag. It will let you test which features actually create value and later convert the most valuable capabilities into paid plans.

### What to give testers

Do not unlock every planned paid feature. If testers receive everything, you will not learn what they would actually pay for. Give them a clearly named **Beta Tester Pass** with the features needed to test the core promise.

A sensible first pass would be:

| Capability | Beta access recommendation | Reason |
|---|---|---|
| Multi-size grading and full grading table | Included | This is the core value being validated |
| CSV/TSV or print-sheet export | Included | Tests practical handoff and workflow replacement |
| PDF export templates | Included, possibly with a reasonable project limit | Tests the professional deliverable |
| Pre-publish checks and warnings | Included | Tests trust and quality-control value |
| Basic yarn calculation | Included if it is part of the core workflow | Helps assess end-to-end usefulness |
| Pricing and income tools | Preview or limited access | Valuable, but should not distract from grading validation |
| Cloud sync | Exclude unless cloud is explicitly part of the beta | Avoids expanding privacy and storage risk prematurely |
| Collaboration, marketplace automation, clubs, wholesale, and advanced labs | Exclude initially | These modules create support scope without proving the core job |

Tell testers the exact reward in plain language:

> **Your Beta Tester Pass unlocks the listed preview features through the end of the current beta and for 90 days after activation. It does not guarantee permanent free access. Your local projects and exported files remain yours, but premium access may end when the pass expires.**

If you want the reward to feel generous without creating a permanent pricing liability, offer a future discount or a short period of the eventual creator plan rather than lifetime access.

## 2. Do you need accounts before testing?

You need **lightweight identity**, but not necessarily a full cloud account system.

There are three practical options:

| Option | Advantages | Weaknesses | Recommendation |
|---|---|---|---|
| Local unlock code only | Fastest to build | Shareable, lost with browser data, not account-level, difficult to revoke | Use only for a very small internal alpha |
| Email magic link plus local-first projects | Reliable tester identity without moving project files to the cloud | Requires email delivery and session security | **Best first public beta option** |
| Full OAuth plus cloud account | Strong cross-device foundation | More integration, privacy, and support complexity | Add after core beta evidence unless required |

The first public tester should receive an email link, redeem it, and obtain a normal authenticated session. Their projects can continue to live locally in the browser. The server stores only the identity, beta cohort, entitlements, and the minimum event or feedback data you decide to collect.

This gives you reliable account-level rewards without forcing you to make a promise that all project data is uploaded or synchronized.

## 3. Cloud and OAuth: before or after testing?

### Cloud synchronization should usually come after the first core beta

The first test should answer whether Stitch & Scale’s grading and publishing workflow is valuable and trustworthy. Cloud sync introduces separate questions: storage cost, backup guarantees, deletion requests, version conflicts, cross-device behavior, private intellectual property, outages, and support.

Add cloud before a later beta only if testers demonstrate a clear need, such as:

| Evidence | Suggested decision |
|---|---|
| Several testers cannot test because they work across devices | Prioritize cloud or a reliable project-file import/export path |
| Testers repeatedly lose local work or misunderstand browser storage | Prioritize a safer backup and recovery experience |
| Designers want to collaborate with tech editors or test knitters inside the product | Design cloud sharing as a separate validated workflow |
| Most qualified testers ask for account-based project history | Build the smallest secure sync feature, not a broad collaboration suite |

Until then, a robust JSON backup, restore, export, and clear local-storage warning may be more valuable than a rushed cloud system.

### OAuth should normally come later than email access

OAuth is useful for reducing sign-in friction and supporting familiar identity providers, but it is not required to validate the product’s core value. It also adds redirect, callback, consent, provider, account-linking, and security edge cases. OWASP recommends secure OAuth flows with correct redirect handling, CSRF protection through state/nonce or PKCE, and the Authorization Code flow with PKCE for public clients [2].

Start with one email-based access method. Add Google or another provider when one of these conditions is met:

1. A meaningful percentage of invited testers fail to complete email access or repeatedly request a social sign-in option.
2. Cross-device use becomes important and users want a persistent account experience.
3. You begin serving organizations or professional teams that require a specific identity provider.
4. Your chosen managed authentication provider makes OAuth low-risk and operationally simpler than maintaining separate flows.

Do not build custom OAuth yourself merely because “professional products should have OAuth.” Validate the workflow first.

## 4. Your proposed email reservation and token flow

Your limited-slot idea can work well if the scarcity is real and the counter is truthful. The flow should have two distinct stages: **reserve a place** and **redeem an invitation**.

### Stage A: reserve a place

1. A social post links to a short beta page explaining the product, the test duration, what is unfinished, the privacy model, and the type of tester wanted.
2. The visitor enters an email address and optionally answers two or three screening questions: role, experience, and whether they have designed or published a pattern.
3. The server rate-limits requests and sends a confirmation link. Do not count a raw unconfirmed email as a final seat.
4. After confirmation, the user receives a place in the waitlist or a temporary reservation.
5. The counter updates from server-side confirmed reservations, not from the browser.

### Stage B: issue access later

1. You select the next cohort, for example 10–15 people, from confirmed reservations.
2. The system sends a one-time invitation link to the selected email address.
3. The link opens a redemption page that repeats the beta terms, limitations, reward, expiry, and privacy choices.
4. After acceptance, the server creates or activates the lightweight tester account and grants the Beta Tester Pass.
5. The user receives a session and enters the product. Their local project data remains local unless cloud sync is separately enabled.
6. If the invitation expires, you can reissue it without creating a second account or duplicate entitlement.

OWASP guidance for password-reset flows is a useful security baseline for this invitation link: tokens should be single-use and expire after an appropriate period; account changes should occur only after a valid token is presented; and responses should avoid revealing whether a particular account or email exists [1].

### Token implementation principles

Use a cryptographically random opaque token. Store only a hash of the token server-side. Do not put a person’s email, plan, or entitlement data directly into a long-lived URL. Expire the token, mark it used immediately after successful redemption, and provide a safe “send another link” path.

Use a short redemption window such as 24–72 hours, depending on how quickly your cohort is moving. Add rate limiting to invitation requests and redemption attempts. Return the same generic response for an existing, unconfirmed, or already-registered email so that the system does not expose your user list.

The system should include a manual revocation path. If a link is forwarded publicly, you should be able to invalidate it and issue a replacement.

## 5. The live slot counter and countdown

A live counter can improve clarity, but a countdown can also create distrust if it is artificial. The safest form is a truthful capacity statement:

> **Private beta: 20 total places. 12 confirmed. 8 places currently available.**

Only decrease the available count after the email is confirmed. If you temporarily hold a seat after confirmation, show that policy clearly—for example, “A confirmed place is held for 24 hours while invitations are prepared.” Automatically release abandoned holds.

Avoid a timer that resets, changes without explanation, or claims a deadline that is not real. If you want a countdown, use it for a genuine operational event such as **“Applications close Sunday at 6:00 PM for the next review batch”**, not as a fake “only three minutes left” sales device.

The counter should be server-authoritative and resilient to refreshes, duplicate submissions, and concurrent sign-ups. It should never expose email addresses or allow a visitor to infer whether a specific person joined.

### Recommended states

| State | What the visitor sees |
|---|---|
| Open | “14 of 20 places confirmed; apply for the next cohort” |
| Temporarily held | “A place is being held while we confirm your email” |
| Full | “This cohort is full; join the waitlist for the next group” |
| Reviewing | “Applications are being reviewed; invitations will be sent on [real date]” |
| Closed | “Testing is paused while we fix and improve the beta” |

This makes limited capacity feel like a responsible support constraint rather than artificial pressure.

## 6. What data structures the feature requires

You do not need a large business system, but you do need clear separation between reservations, invitations, users, and entitlements.

| Record | Important fields |
|---|---|
| `beta_cohort` | Name, capacity, application status, open/close dates |
| `reservation` | Email or encrypted email, normalized email hash, cohort, confirmed time, status, hold expiry |
| `invitation` | Reservation/user, token hash, issued time, expiry, redeemed time, revoked time |
| `user` | Stable user ID, verified email, created time, last sign-in |
| `entitlement` | User ID, feature key, source, start/end, limits, active/revoked status |
| `feedback_submission` | User/cohort, task, severity, expected result, actual result, consent flags |
| `audit_event` | Invitation issued, redeemed, entitlement granted/revoked, export or feature access event |

Keep project content separate from this beta-control data. If your local-first promise says project data stays in the browser, do not quietly upload it for analytics. If you later change that, obtain fresh consent and update the privacy explanation.

## 7. How to gate the developing product

Gate the **beta entry and premium actions**, not the entire public explanation of the product.

A good structure is:

1. Public landing page: product explanation, sample screenshots or demo, beta terms, and reservation form.
2. Sample mode: let visitors understand the concept without creating a full account or uploading private work.
3. Beta redemption: require the emailed invitation link.
4. Core workspace: accessible to approved testers.
5. Protected premium action: server checks the tester’s entitlement before allowing the action.
6. Feedback and support: always accessible from the workspace.

Keep a protected staging environment for development and a separate beta deployment for human testers. Do not deploy unreviewed experiments directly into the beta. If a critical calculation or export defect is found, pause new invitations, notify affected testers, and publish a short known-issue update.

## 8. Recommended implementation order

### Phase 0: make the testable slice trustworthy

Stabilize the core path: sample project → new/imported project → measurements and gauge → grading table → warnings → backup/export. Make data-loss warnings, export, and restore easy to understand. Add an explicit beta limitations page.

### Phase 1: build the minimum beta control plane

Implement the reservation form, confirmation email, server-side capacity counter, cohort selection, invitation link, lightweight email-based session, entitlement records, feature checks, feedback form, rate limits, and basic audit logs.

At this point you can reward testers with account-level access to selected paid features without building cloud project storage.

### Phase 2: run the first private cohort

Invite 10–15 qualified people. Use the same tasks, watch for P0 and P1 issues, record completion and trust metrics, and avoid expanding feature scope during the sessions. If the core workflow is not reliable, stop recruitment and fix it.

### Phase 3: improve based on observed need

Prioritize defects and requests that block real use. Do not build cloud sync merely because it sounds like a complete-product requirement. Build the smallest capability that addresses a repeated, high-cost problem in the evidence.

### Phase 4: introduce cloud selectively

If cross-device access, backup, or collaboration is repeatedly requested, add cloud storage with explicit data ownership, deletion, privacy, versioning, and recovery behavior. Test cloud as its own beta capability; do not assume that local-first users automatically want their unpublished patterns uploaded.

### Phase 5: add OAuth selectively

Add OAuth when email access is measurably creating friction or when a validated professional segment needs it. Use a managed provider and a secure Authorization Code + PKCE flow rather than a custom implementation [2].

## 9. What to say in your social recruitment post

Use this wording or adapt it:

> **I’m opening 20 private-beta places for Stitch & Scale, a new workspace for independent knitwear designers.**
>
> The test focuses on one practical workflow: turning a base-size design into a transparent, reviewable multi-size pattern draft, checking warnings, and exporting a usable draft.
>
> The beta is free, and selected testers will receive a temporary Beta Tester Pass with access to selected preview features. No payment details are required. The product is unfinished, so testers should review and test all outputs before using them in a paid release. Projects remain local-first in this beta; export a backup before clearing browser data or changing devices.
>
> I’m limiting the first group to 20 people so I can review feedback carefully. If you design, grade, tech-edit, test-knit, or plan to publish knitwear patterns, reserve a place here: **[link]**.
>
> Honest feedback is welcome, including negative feedback. Public testimonials are optional and require separate permission.

This post communicates scarcity as an operational limit, not a manipulative sales tactic.

## 10. Decisions you should make before building the feature

| Decision | Recommended answer for the first beta |
|---|---|
| Do testers need full accounts? | Yes, but use lightweight email-based accounts; do not require cloud project storage |
| Can one tester use several browsers? | Allow it only if they authenticate through the same email; explain that local projects still need export/import |
| Should the reward be permanent? | No. Use a clearly documented beta period or fixed expiry, plus an optional future discount |
| Should every premium feature be unlocked? | No. Unlock only the features needed to test the core promise |
| Should the counter count email submissions? | No. Count confirmed reservations or accepted seats, using one server-side source of truth |
| Should access be sent immediately? | Not necessarily. Use a waitlist, screen applicants, then issue cohort invitations in batches |
| Should there be a countdown? | Only for a genuine application or invitation deadline; otherwise use a live capacity counter |
| Should cloud be before the first test? | Only if cross-device storage is part of the hypothesis; otherwise after the core beta |
| Should OAuth be before the first test? | Usually no. Start with email access; add OAuth after observed demand or sign-in friction |
| Should public visitors see the app? | Yes, through a sample/demo path; gate tester access and protected actions |
| Should the app collect project data? | Not unless the tester clearly agrees; preserve the local-first promise during the first beta |

## Final recommendation

Proceed with your plan, but name and implement it as a **controlled private beta program**, not merely a hidden development URL.

Build the smallest account layer needed to make the tester reward real: **verified email, one-time invitation, server-side entitlement, protected feature checks, and expiry/revocation**. Keep pattern projects local-first while you validate the core product. Use a truthful server-side “confirmed places remaining” counter, not a theatrical countdown. Invite in cohorts so the number of testers never exceeds your ability to respond to bugs and questions.

The sequence should be:

> **Stabilize core workflow → add beta access and entitlements → run 10–15 testers → fix trust and usability blockers → validate demand for cloud → add cloud if evidence supports it → add OAuth when sign-in or professional requirements justify it.**

This gives testers a meaningful reward without prematurely committing you to cloud storage, full account infrastructure, or a permanent free plan.

## References

[1]: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html "OWASP Cheat Sheet Series — Forgot Password"

[2]: https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html "OWASP Cheat Sheet Series — OAuth 2.0 Protocol Cheatsheet"

[3]: https://stitch-and-scale-pro-api-server.vercel.app/ "Stitch & Scale live application"
