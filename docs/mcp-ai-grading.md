# Stitch & Scale Pro MCP — AI Grading MVP

## Status

This is a **read-only, stateless MCP-compatible JSON-RPC endpoint** for Stitch & Scale Pro. It supports a staged conversational workflow: an AI client may normalize an explicitly supplied partial pattern, ask for missing fields, run deterministic grading, explain the result, and prepare a real PDF artifact after the user confirms scope and filename. The deterministic grading engine remains the source of truth.

The endpoint is deployed at `/api/mcp` when the repository is deployed on Vercel. The static Vite application remains local-first: browser IndexedDB is not exposed to the server and no project is silently uploaded.

## Trust boundary

> Stitch & Scale calculates. The AI explains. The user decides.

The caller must supply a project snapshot explicitly in each tool call. The server does not read browser storage, enumerate projects, retain snapshots, save changes, publish, share, send messages, or call arbitrary code.

The `grading.run` result contains calculation provenance, including the contract version, calculation version, grading-lab version, standards source, gauge, rounding rules, warnings, graded table, and deterministic analysis. The AI client should present these as calculated facts and label its prose as an explanation.

## Enabled tools

| Tool | Purpose | Mutation | Required input |
|---|---|---:|---|
| `project.intake` | Normalize one full or partial explicit project snapshot and return bounded next questions. It never guesses missing measurements. | No | `arguments.project` |
| `project.validate` | Validate and normalize one explicit project snapshot. | No | `arguments.project` |
| `grading.run` | Run the existing deterministic grading engine and grading-lab analysis. | No | `arguments.project` |
| `grading.explain` | Create a constrained explanation envelope from a prior `grading.run` result. | No | `arguments.intent`, `arguments.grade` |
| `export.pattern_pdf` | Generate a real grading PDF from one explicit valid snapshot after user approval. It returns an embedded resource and does not save, publish, or share it. | No | `arguments.project`, `arguments.userApproved` |

The server deliberately does **not** expose project listing, all-storage reads, project writes, deletion, publishing, sharing, messaging, arbitrary code execution, or external web actions. The PDF tool is technically read-only: it renders a supplied snapshot into bytes, but cannot persist or distribute those bytes outside the current response.

## Vercel configuration

Configure these environment variables in the deployment environment:

```text
MCP_API_KEY=<long random secret, stored only as a Vercel secret>
MCP_ALLOWED_ORIGIN=https://stitch-and-scale-pro-api-server.vercel.app
```

`MCP_API_KEY` is required. If it is absent, the endpoint fails closed with `503`. Clients authenticate with either:

```http
Authorization: Bearer <MCP_API_KEY>
```

or the compatibility header `X-MCP-API-Key`. Prefer the Bearer form. The current MVP uses a server-side API key rather than a full OAuth authorization server; OAuth 2.1 + PKCE should be added before broad third-party distribution or multi-user account access.

The server rejects unexpected browser origins, non-JSON requests, unsupported protocol versions, oversized bodies above 256 KiB, and more than 60 requests per client identity per minute. Responses are `no-store` and include basic anti-sniffing, referrer, and frame-ancestor protections.

## Example request

```json
{
  "jsonrpc": "2.0",
  "id": "grade-1",
  "method": "tools/call",
  "params": {
    "name": "grading.run",
    "arguments": {
      "project": {
        "id": "sample-project",
        "name": "Classic Crew Neck",
        "author": "Designer",
        "baseSize": "M",
        "gauge": {
          "stitchesPer4In": 20,
          "rowsPer4In": 28,
          "unit": "in"
        },
        "sections": [
          {
            "id": "body",
            "name": "Body",
            "measurements": [
              {
                "id": "bust",
                "label": "Bust",
                "measurementType": "circumference",
                "gradingKey": "bust",
                "baseValue": 39
              }
            ]
          }
        ]
      }
    }
  }
}
```

The contract sanitizes text, enumerations, counts, physical values, repeats, gauge, sections, and custom standards before invoking the existing grading code. Invalid or hostile values produce structured validation issues rather than `NaN`, `Infinity`, unbounded strings, or silent mutation.

## Conversational workflow

The intended conversation is staged rather than autonomous:

1. The user describes a pattern in natural language or supplies a project snapshot.
2. The client converts only known facts into `project.intake` input.
3. Stitch & Scale returns normalized data and bounded next questions; the AI must ask rather than guess.
4. After the user confirms the completed scope, the client calls `grading.run`.
5. The client presents the deterministic verdict and warnings separately from any AI explanation.
6. The client asks the user to confirm PDF scope, filename, locale, and creation. Only then may it call `export.pattern_pdf` with `userApproved: true`.
7. The client presents the embedded PDF for the user to download. No server-side project or artifact storage occurs.

The full grading page includes **AI Grading Assistant**. It remains intentionally local-only in this tranche: it runs the same sanitized grading contract in the browser and prepares a bounded brief that a user may inspect and copy into an AI service. The button does not transmit anything and does not claim that an AI response was generated.

This preserves the product’s local-first promise while making the MCP capability discoverable. A future authenticated in-app conversation may replace the copy handoff only after explicit opt-in, a provider/data disclosure, and a tested consent boundary.

## Youth-safe requirements

The MVP is an educational assistant, not an autonomous agent. Product distribution must use age-appropriate defaults:

- Do not enable a remote AI connection for under-13 users until a compliant parental-consent and data-retention process exists.
- For teen users, use a privacy-first mode with no profiling, no public sharing, no targeted persuasion, no open-world actions, and minimal retention.
- Keep the local calculation available without an account or AI connection.
- Avoid body judgment or certainty about fit. The assistant can explain a measurement or grading rule, but it cannot diagnose how a garment will fit a particular person.
- Require visible user confirmation before any future write or export action. The current PDF tool requires explicit approval and is limited to rendering and returning bytes; it cannot save, publish, or share.
- Provide a report/remove pathway for harmful or inappropriate generated content before any broad youth launch.

## Deliberate non-goals

The following are unsafe or premature for this product and must not be added casually:

- `storage.read_all`
- `project.write`
- `project.delete`
- `publish_project`
- `share_export`
- `send_message`
- `autonomous_pattern_completion`
- `run_code`
- autonomous task loops
- hidden uploads of IndexedDB data
- model-generated replacement grading arithmetic

## Verification

The contract, dispatcher, workflow, and PDF renderer have focused regressions covering hostile snapshots, legacy snapshots, custom standards, finite serialization, tool allowlisting, JSON-RPC errors, body limits, protocol negotiation, approval gating, filename sanitization, real PDF parsing, and embedded resource handoff. The existing full app gates remain the release gate for merging this tranche.
