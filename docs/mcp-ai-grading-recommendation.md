# Stitch & Scale Pro: MCP and Youth-Safe AI Grading Recommendation

**Prepared by:** Manus AI  
**Date:** 21 August 2026  
**Status:** Architecture and product recommendation; implementation not yet started

## Executive recommendation

**Yes, Stitch & Scale Pro should add an AI capability, and MCP is a credible interoperability layer—but MCP should not be the first or only user experience.** The right product is a focused **AI Grading Assistant** inside the PWA, backed by the existing deterministic grading and validation libraries. MCP should expose the same narrow capabilities to compatible AI clients as an optional connector.

The distinction matters because the current product is a Vite/React static PWA. Projects, settings, studio identity, and lab state are stored in browser IndexedDB/localStorage; there is no authenticated account, cloud project store, API route, or server-side PDF service. A remote MCP server therefore cannot simply “see” a user’s live workspace. It would require either an explicit snapshot bridge, a new authenticated sync layer, or a separate host-side local server. Putting an API key or unrestricted project data directly in the browser would be an unacceptable shortcut.

The highest-value first workflow is not a general chatbot and not an AI that invents grading arithmetic. It is a constrained assistant that lets a user ask, in plain language, **“Explain this grading,” “What is missing before I export?”, or “What should I check next?”** The app performs the calculation; the AI explains the result, identifies assumptions, and proposes reversible next steps. This gives young users accessibility and learning value without turning the product into an unsupervised AI companion or an evaluator of the child.

> **Core principle:** Stitch & Scale calculates. The AI explains. The user decides.

This recommendation is grounded in the current MCP specification, which treats tools as model-controlled but says implementations should keep a human in the loop, show which tools are exposed, visibly indicate invocation, and provide a way to deny calls [1]. MCP security guidance additionally requires careful consent, exact redirect validation, CSRF/state protection, token discipline, and scope minimization [2].

## What “AI grading” should mean

The word **grading** is ambiguous and must be defined in product copy. In Stitch & Scale, grading is the technical process of translating a base-size pattern into size-specific physical measurements and stitch/row counts. It should not mean judging a young person’s intelligence, body, creativity, or worth.

The assistant should therefore use language such as **“Explain size grading”**, **“Check my pattern grading”**, and **“Find missing grading inputs.”** It should avoid language such as **“Grade my ability,” “Rate my body,” “Tell me if I am good enough,”** or **“Give me the perfect fit.”** If a young user asks for a personal or appearance-based judgment, the assistant should redirect to technical, craft-focused help.

| Product meaning | Safe AI behavior | Unsafe behavior to prohibit |
|---|---|---|
| Technical pattern grading | Explain the deterministic output from `gradePattern()` and its assumptions. | Recalculate stitch counts from memory or silently override app math. |
| Pattern readiness | Identify missing gauge, measurements, standards, or invalid values. | Claim that a pattern will fit a real person without a fitting process. |
| Learning support | Explain width versus circumference, repeats, parity, units, and rounding in age-appropriate language. | Pretend certainty when the project is incomplete or ambiguous. |
| Workflow assistance | Suggest the next reversible task or prepare a draft. | Delete, publish, send, purchase, or share without explicit confirmation. |
| Commercial planning | Summarize calculator assumptions and scenarios for an adult user. | Give a young user high-confidence financial, contractual, or spending instructions. |

## Wide-research findings

The research produced five independent conclusions. The first is product fit: Stitch & Scale already contains deterministic, project-scoped domain logic and a large first-party workspace, so an AI layer can add explanation and orchestration without reimplementing the product. The second is architectural: the current static/local-first model is excellent for privacy but cannot support a remote connector without a deliberate data bridge. The third is protocol fit: MCP is well suited to narrow tools and private resources, but not to an unrestricted “run anything” agent. The fourth is youth safety: if the service is likely to be accessed by young users, privacy-preserving defaults and age-appropriate design must be built in rather than added as a disclaimer. The fifth is distribution: current ChatGPT custom MCP apps are web-oriented and workspace/admin-controlled, so an in-app mobile/PWA experience remains necessary [7] [8].

| Track | Evidence | Product consequence |
|---|---|---|
| Existing product | `PatternProject` is structured; `gradePattern()` is pure; validation and export seams already exist. | Reuse domain logic and expose structured results, not free-form AI arithmetic. |
| Current persistence | IndexedDB/localStorage only; no authenticated identity or cloud store. | Start with a local/in-app assistant or explicit snapshot bridge; add cloud sync only intentionally. |
| MCP protocol | Tools are model-controlled; resources are application-driven; prompts are user-controlled; structured schemas are supported [1] [3] [4]. | Expose a small read-only tool family and explicit user prompts. |
| Security | MCP requires per-client consent and strong authorization boundaries in proxy scenarios [2]. | Use narrow scopes, per-user authorization, audit events, rate limits, and no token passthrough. |
| Young users | COPPA can apply to child-directed services or services with actual knowledge of collecting data from under-13 users [9]. The ICO code expects high privacy by default, minimization, limited sharing, profiling controls, and no manipulative nudges [10]. | Do not treat age as a decorative profile field. Decide the age policy before enabling remote AI. |
| Child-centered AI | UNICEF emphasizes safety, privacy, fairness, transparency, accountability, well-being, inclusion, and skills [11]. | Build a learning assistant, not an anthropomorphic companion; show what was calculated and what was generated. |
| AI risk management | NIST’s generative-AI profile supports documented risks, provenance, evaluation, human oversight, and incident handling [12]. | Version every calculation and preserve assumptions, revisions, and user-visible warnings. |

## Recommended product shape

### 1. First-party in-app experience

Add an **Ask about this result** action near the Grading Table and relevant lab outputs. The action should be contextual rather than a blank chat box. The user sees the exact project and result that will be shared, can deselect fields, and can choose one of a few intents: **Explain**, **Check**, **Teach me**, or **Suggest next step**.

The result view should have two visibly separate sections. **Calculated by Stitch & Scale** should show the deterministic values, standards table, gauge, unit conversion, rounding rules, and validation status. **AI explanation** should contain the natural-language explanation, caveats, and optional next steps. This separation prevents a fluent paragraph from laundering an unverified model guess into a product fact.

The in-app assistant must be optional. The app should remain fully usable without AI, especially offline and for users who do not want project data to leave the device. If model access is server-mediated, the static client must call a controlled backend; it must never ship a provider secret in browser JavaScript.

### 2. Optional MCP connector

Expose the same domain capabilities to compatible AI hosts under a product name such as **Stitch & Scale AI Grading & Workflow**. The MCP server should be a narrow, first-party service. It should not proxy arbitrary third-party APIs, expose a generic code executor, or read the entire browser store.

The safest initial MCP modes are:

| Mode | How it works | Strength | Limitation |
|---|---|---|---|
| Local snapshot bridge | User explicitly supplies or selects a sanitized project snapshot. The server performs no persistent storage. | Strong privacy and fast to prototype. | Less seamless; host setup can be technical. |
| In-app assistant bridge | PWA sends only the selected result/context to a controlled AI endpoint. | Best mobile and youth UX. | Not itself a universal MCP connector. |
| Authenticated cloud mirror | User opts into account/sync; MCP server reads authorized project IDs. | Best cross-client seamlessness. | Requires identity, sync, retention, recovery, and youth policy work. |
| Unauthenticated remote “full workspace” server | Server accepts arbitrary storage or project dumps and exposes broad tools. | Appears easy. | **Reject.** High abuse, privacy, injection, and data-exfiltration risk. |

The recommendation is to implement the **in-app assistant first**, then a **read-only MCP server** against the same domain package. Cloud sync and write actions should be later stages, not prerequisites hidden inside an MVP.

## MCP tool contract

The initial tool list should be deliberately small. The MCP specification supports valid JSON Schema input and optional output schemas; it also permits tool availability to vary by authorization scope [1]. Use that capability to make the default list read-only and deterministic.

| Tool | Purpose | Default scope | Side effect |
|---|---|---|---|
| `project.list` | Return minimal project metadata and readiness flags. | `projects.read` | None |
| `project.get` | Return one explicitly selected project with a field-level projection. | `projects.read` | None |
| `project.validate` | Run existing completeness, measurement, and gauge validation. | `grading.read` | None |
| `grading.run` | Call the existing deterministic grading engine and return structured values. | `grading.run` | None |
| `grading.explain` | Produce a constrained explanation from a supplied result and provenance. | `grading.explain` | None |
| `portfolio.summarize` | Later, summarize selected projects and readiness without publishing. | `portfolio.read` | None |
| `export.prepare` | Later, prepare a user-visible export draft or handoff plan. | `exports.prepare` | Draft only |

The MVP should explicitly **not** expose `storage.read_all`, `run_calculator`, `run_code`, `write_project`, `delete_project`, `publish_project`, `share_export`, `send_message`, or any tool that accepts a URL and fetches arbitrary content. A tool named `run_tasks` is too broad to be safely understood by users or reliably authorized by hosts.

### Example `grading.run` contract

The remote/cloud form should accept a project reference plus a revision, not a mutable name or a blind storage key. The server verifies ownership and revision before reading data. The snapshot/bridge form may instead accept a validated, explicitly supplied project object.

```json
{
  "name": "grading.run",
  "title": "Run deterministic size grading",
  "description": "Calculate size-specific physical measurements and stitch/row counts using the selected project’s recorded gauge, standard, units, and rounding rules. The result is calculation only; it is not a fit guarantee.",
  "inputSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "projectId": { "type": "string", "minLength": 1, "maxLength": 120 },
      "projectRevision": { "type": "string", "minLength": 1, "maxLength": 80 },
      "includeExactValues": { "type": "boolean", "default": true },
      "includeWarnings": { "type": "boolean", "default": true }
    },
    "required": ["projectId"]
  }
}
```

The output should be structured and serializable. It should include `schemaVersion`, `projectId`, `projectRevision`, `calculationVersion`, `standardsSource`, `gauge`, `unit`, `roundingRules`, `warnings`, and `sections`. Each graded value should retain its size, physical value, exact stitch/row value, and rounded value. If any input is invalid, the tool should return a clear validation result rather than silently replacing a value and presenting a confident answer.

For the explanation tool, the model should receive the structured result and a constrained user intent, not the entire project by default. Notes, brand identity, author names, and unrelated commercial history should be excluded unless the user explicitly selects them. MCP resources are application-driven and may be private; if resources are used, use opaque project URIs and private cache scope rather than public file URLs [3]. Prompts should be user-controlled and explicitly invoked, not silently injected on every tool call [4].

## Permission and trust model

### Three action tiers

A clear action ladder will keep the assistant useful without making it autonomous.

| Tier | Examples | User control |
|---|---|---|
| **Assist** | Read current result, validate project, explain a formula, teach a concept. | Visible invocation; no mutation. |
| **Prepare** | Draft a note, propose a project-field change, prepare an export filename, create a task checklist. | Show a diff or draft; user chooses whether to save. |
| **Commit** | Update project fields, save a note, generate a file, publish or share an export, send an external message. | Explicit confirmation immediately before the side effect; high-risk actions may require a second confirmation or be adult-only. |

MCP host confirmations are useful, but they are not a substitute for server authorization. OpenAI’s current guidance distinguishes app permissions from the access granted to the app and warns that unsafe servers can increase prompt-injection exposure [7] [8]. The server must enforce ownership, scope, validation, and action policy independently.

### OAuth and server controls

If the MCP server reads account data, it should use a standard OAuth 2.1-style authorization flow with PKCE, protected-resource metadata, short-lived access tokens, refresh/revocation handling, and narrow scopes. The official MCP authorization guidance recommends authorization for user-specific data, auditing, user consent, and per-user rate limiting [5].

A consent screen should identify **Stitch & Scale Pro**, the connecting AI client, the exact project scope, the fields that may leave the device, the retention policy, and whether the request is read-only or can create a draft. Redirect URIs must be exact; state must be cryptographically random, single-use, short-lived, and validated. Per-client consent must bind to the client ID, not simply to the user [2] [5].

The server should also enforce the following controls:

| Control | Required behavior |
|---|---|
| Ownership | Every project reference is checked against the authenticated user. Never trust an ID supplied by the model. |
| Scope | `projects.read`, `grading.run`, and `grading.explain` are separate scopes. No write scope in the MVP. |
| Revision safety | Results include the source revision; writes later require an exact revision or an explicit conflict screen. |
| Data minimization | Send only fields necessary for the selected action. Do not upload the entire backup snapshot by default. |
| Retention | Make prompt/result retention ephemeral by default; do not use project content for model training without explicit, separate consent. |
| Prompt-injection resistance | Treat project names, notes, descriptions, and imported text as untrusted data, never as instructions. Do not echo hidden instructions into future tool calls. |
| Rate limiting | Limit calls per user, client, tool, and IP; apply payload-size and timeout limits. |
| Auditability | Record tool name, user, client, scope, project reference, revision, outcome, and timestamp without retaining unnecessary content. |
| Failure behavior | Return structured validation or policy errors. Never serialize `NaN`, `Infinity`, secrets, or raw stack traces. |
| UI visibility | Show when an AI call occurs, what was shared, which result is calculated, and whether a draft was created. |

## Youth-safe design

### Age policy decision

“May be used by young people” is not the same as “child-directed,” but the product must make an explicit policy decision before collecting age signals or sending project data to a remote model. The FTC states that COPPA covers services directed to children under 13 and services with actual knowledge that they collect personal information from a child under 13 [9]. The ICO’s Age Appropriate Design Code applies a risk-based approach to services likely to be accessed by children and expects high-privacy defaults, minimization, limited sharing, profiling controls, and avoidance of manipulative nudges [10]. This document is product-risk guidance, not jurisdiction-specific legal advice; counsel should review the final age and data policy.

The safest initial policy is:

| Audience state | Recommended AI behavior |
|---|---|
| Age unknown | Local deterministic grading remains available. Remote AI is off until the user or responsible adult chooses the applicable mode. Do not silently infer age from writing style. |
| Under 13 or child-directed use | Keep grading and teaching local where possible. Do not enable remote MCP or persistent AI history until a compliant parental-consent and data process exists. |
| Teen user | Offer an age-appropriate, privacy-first assistant with ephemeral processing, no public sharing, no profiling, no autonomous external actions, and clear adult-sensitive boundaries. |
| Adult user | Allow optional remote AI and read-only MCP connection with the same explicit data-sharing and scope controls. |

This is intentionally conservative. It avoids promising that a generic AI connector is safe for children merely because the subject matter is knitting. Body measurements, names, photos, voice, school references, and commercial activity can all become personal data in context.

### Youth-mode behavior

A youth-safe mode should not be a patronizing visual theme. It should be a meaningful data and action policy. The assistant should use plain language, explain uncertainty, support accessibility, and avoid body-shaming or appearance judgments. It should not use engagement loops, streak pressure, scarcity language, or nudges designed to increase time spent or disclosure. It should not act as a friend, therapist, romantic companion, or secret-keeper.

The assistant should answer craft questions such as **“Why did the sleeve change by four stitches?”** or **“What does width mean here?”** It should say **“The app calculated this from your recorded gauge and CYC table”** rather than **“I know this will fit you.”** If a project lacks measurements, the correct response is to identify the missing input and explain how to obtain it, not invent a value.

For youth users, commercial labs should initially be explanation-only. The assistant may explain revenue, costs, and assumptions in an educational context, but it should not direct a child to spend money, sign a contract, contact a retailer, publish a listing, or share personal information. Any external action should be adult-confirmed and, for an under-13 mode, disabled until the product has a reviewed consent and supervision model.

UNICEF’s current guidance calls for safety, privacy, fairness, transparency, accountability, well-being, inclusion, and skills, and specifically recognizes accessibility and learning as positive opportunities [11]. That maps cleanly to an assistant that teaches the user how the result was obtained while keeping the calculation inspectable.

## Onboarding additions without making onboarding stressful

The onboarding should remain short. Add one optional, honest sentence rather than a long AI tour:

> **AI is optional. Stitch & Scale calculates your grading results in the app; if you ask for an AI explanation, you will see what information is shared before it leaves your device.**

The first AI invocation should contain the real consent detail. It should show a compact checklist: **project selected, fields shared, destination/model, retention, and action scope**. A link can open the full privacy explanation. Do not claim “your data stays private” if a remote model receives it; say exactly whether the data leaves the device and whether it is retained.

The onboarding should not promise that AI can run every task. The truthful capability statement is:

> **AI can explain calculations, find missing inputs, and prepare reversible drafts. You remain in control of changes, exports, and sharing.**

## Evaluation and red-team plan

Before release, test the assistant as aggressively as the existing calculator audit. The evaluation set should include valid projects, empty projects, malformed persisted state, extreme but finite values, `NaN`/`Infinity` serialization attempts, missing custom standards, mixed units, width versus circumference, parity/repeat rounding, zero or impossible values, stale project revisions, unauthorized project IDs, prompt-injection text in notes, and requests to publish or share without confirmation.

The quality gate should verify four independent properties. **Numerical correctness** means every number comes from the deterministic domain library and agrees with the existing tests. **Provenance** means the response identifies calculation version, standards, gauge, units, and revision. **Privacy** means the tool receives no fields outside the user-approved projection and retains no unnecessary content. **Action safety** means no mutation or external side effect can occur without a server-enforced scope and user confirmation.

NIST’s generative-AI profile provides a useful governance frame for documenting risks, evaluating outputs, maintaining provenance, keeping human oversight, and handling incidents [12]. Store golden test cases and expected structured results in the repository. Track false confidence, missing caveats, unsafe action attempts, age-mode bypasses, and data-leakage regressions as release-blocking defects.

## Phased implementation roadmap

| Phase | Deliverable | Exit criteria |
|---|---|---|
| 0. Policy and naming | Define “AI Grading Assistant,” audience modes, data-sharing notice, retention statement, and action tiers. | Product copy is truthful; age/remote-data decision is reviewed. |
| 1. Domain contract | Extract or share the pure grading, validation, normalizer, and provenance code used by the PWA and future server. | One calculation library; no duplicated formulas; hostile-input tests pass. |
| 2. In-app read-only assistant | Add contextual explain/check/teach flows. Keep local results and AI prose separate. | Mobile UX works without MCP; user sees exactly what is shared; no provider secret in client. |
| 3. Stateless MCP prototype | Expose `project.validate`, `grading.run`, and `grading.explain` using an explicitly supplied sanitized snapshot or one-time bridge. | Schema validation, rate limits, no persistence, structured outputs, security tests, and MCP Inspector/client tests pass. |
| 4. Authenticated read-only MCP | Add account/sync or a secure project mirror, OAuth, per-user scopes, consent, audit ledger, and exact revision checks. | Unauthorized IDs fail; scope changes are enforced; consent and revocation tests pass. |
| 5. Prepare-only workflows | Add draft note, export-preparation, and proposed project-change tools with visible diffs. | No silent mutation; user can reject; stale revisions cannot overwrite current data. |
| 6. Controlled writes | Consider a small number of reversible writes, with explicit confirmation and adult/youth policy enforcement. | Threat model, abuse tests, rollback, incident response, and UX review all pass. |

## Brutal assessment

The idea is valuable, but the phrase **“add an MCP function so young users can seamlessly grade or run tasks”** currently hides three separate products: an in-app AI assistant, an interoperability connector, and an agent capable of taking actions. They have different technical and safety requirements.

The **in-app assistant** is the best immediate value because it fits the mobile PWA and can use the current project context. The **MCP connector** is strategically valuable because it makes the deterministic grading capability available to ChatGPT, Claude, IDE agents, and future clients, but current ChatGPT custom MCP app guidance is web-only and workspace/admin controlled [7] [8]. The **autonomous task runner** is the highest-risk and should not be built first. It would require authenticated identity, detailed permissions, confirmation UX, rollback, conflict handling, abuse detection, and a youth policy.

The strongest 10/10 position is therefore not “AI controls Stitch & Scale.” It is **“Stitch & Scale remains the source of truth, while AI becomes a transparent, optional, age-appropriate interpreter and preparation assistant.”** That yields real accessibility and learning value, preserves the app’s local-first trust advantage, and leaves room for a standards-based MCP connector without turning a calm craft tool into an opaque agent platform.

## References

[1]: https://modelcontextprotocol.io/specification/2026-07-28/server/tools "Model Context Protocol — Tools specification"

[2]: https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices "Model Context Protocol — Security Best Practices"

[3]: https://modelcontextprotocol.io/specification/2026-07-28/server/resources "Model Context Protocol — Resources specification"

[4]: https://modelcontextprotocol.io/specification/2026-07-28/server/prompts "Model Context Protocol — Prompts specification"

[5]: https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/authorization "Model Context Protocol — Understanding Authorization in MCP"

[6]: https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro "Model Context Protocol — What is MCP?"

[7]: https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt "OpenAI Help — Developer mode and MCP apps in ChatGPT"

[8]: https://help.openai.com/en/articles/11487775-connectors-in-chatgpt "OpenAI Help — Apps in ChatGPT"

[9]: https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa "FTC — Children’s Online Privacy Protection Rule (COPPA)"

[10]: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/ "UK ICO — Age appropriate design: a code of practice for online services"

[11]: https://www.unicef.org/innocenti/reports/policy-guidance-ai-children "UNICEF Innocenti — Guidance on AI and children, version 3.0"

[12]: https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence "NIST — Artificial Intelligence Risk Management Framework: Generative AI Profile"
