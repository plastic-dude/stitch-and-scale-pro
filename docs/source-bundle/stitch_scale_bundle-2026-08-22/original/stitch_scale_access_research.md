# Stitch & Scale beta access research notes

## Secure invitation and magic-link principles

OWASP Forgot Password Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html . Apply the same security principles to beta access links: use cryptographically random, single-use tokens; expire them after an appropriate period; do not make account changes until a valid token is presented; and avoid leaking whether an account/email exists through different responses. Add rate limits to prevent abuse.

## OAuth principles

OWASP OAuth2 Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html . OAuth/OpenID Connect adds an authorization-server integration and requires correct redirect URI handling, CSRF protection through state/nonce or PKCE, and secure token handling. Public clients should use Authorization Code with PKCE; the deprecated implicit grant should not be used.

Implication: OAuth is not a prerequisite for validating the core grading workflow. Adding it before testing expands security and support scope. If OAuth is later added, use a managed provider or a well-tested framework and Authorization Code + PKCE, not a custom implementation.

## Beta duration evidence

Centercode, Determining the Right Length for Your Beta Test: https://www.centercode.com/blog/beta-test-length . It reports that about half of the hundreds of customer tests it ran in the prior two years had 3–5 weeks of testing time, while emphasizing that duration should follow the objective, number of topics, deadlines, tester workload, and the team’s support bandwidth. It recommends focusing a test on a single objective and limiting weekly topics so testers are not overloaded.

Implication: Stitch & Scale should use a short first cohort of roughly 3–4 weeks, with an initial guided session and a period for testers to return to the product with a real or realistic project. A longer public beta should be treated as a sequence of cohorts rather than one open-ended test.
