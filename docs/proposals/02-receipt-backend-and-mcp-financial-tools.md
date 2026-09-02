# Proposal 02 — Optional backend persistence for Receipt Lab + scoped MCP financial tools

> Status: **PROPOSED**. Nothing in this document is implemented. It's a plan to be reviewed, cut into phases, and executed incrementally — the point is that the trust-boundary decisions get made deliberately, once, up front, rather than each getting bolted on ad hoc as a feature request lands.

## Why this exists

Receipt Lab (income/expense ledger, per-sale records, monthly rollups) is arguably the most business-critical surface in the app — it's the part that touches a designer's actual income and taxes, not just their pattern math. Today it's local-only (IndexedDB via `idb-keyval`), which is exactly right as a default: private by construction, zero signup friction, works offline. The gap is durability and cross-device access — there's no recovery if a browser profile is lost, and no way to work from a second device.

This proposal adds an **optional** backend (Supabase or Neon) for receipts specifically, and asks — separately and explicitly — what should be exposed to an AI over MCP once that data is real and persistent, rather than a caller-supplied snapshot that vanishes at the end of a request.

These are two different risk classes and should be reviewed as such:
1. Adding a backend at all (durability, sync, auth) — a data-persistence and product decision.
2. Letting MCP touch that backend (an AI agent reading or writing real financial records on a schedule it doesn't fully control) — a trust-boundary decision, and the harder one.

## Part 1 — Backend for Receipt Lab

### Non-negotiable constraint

Local-first stays the default. A designer who never opts in should see **zero** behavior change: no signup prompt, no background network calls, no silent migration of existing local data. Backend sync is an explicit opt-in from Settings, matching the existing "Persistent local-storage safety indicator" pattern already shipped in 0.10.0.

### Supabase vs. Neon, for this specific data

| | Supabase | Neon |
|---|---|---|
| Auth | Built-in (email/OTP, OAuth providers) | Bring your own (Clerk, Auth.js, etc.) |
| Per-row authorization | Row Level Security, enforced at the database | Must be enforced correctly in every API route by hand |
| Realtime sync primitives | Built-in (Postgres logical replication → websocket) | None built-in; needs a separate layer |
| Fit here | Auth + RLS out of the box removes an entire class of "did we check ownership on this route" bugs, which matters more for financial data than almost anywhere else in the app | Better fit only if there's already a reason to standardize on Neon elsewhere (e.g. Vercel Postgres integration) and auth is being solved centrally regardless |

**Recommendation: Supabase**, specifically because RLS gives a database-level backstop against an app-layer bug leaking one designer's receipts to another. That failure mode (leaking financial data across accounts) is expensive enough to be worth the opinionated stack.

### Schema sketch

```sql
create table receipts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id),
  kind          text not null check (kind in ('quote', 'receipt', 'refund')),
  date          date not null,
  items         jsonb not null,      -- [{ name, qty, unitPrice, materials }]
  fees          jsonb not null,      -- { platformCommissionPct, processingPct, processingFlat, taxPct, shippingCharged, shippingCost }
  deposit_received numeric not null default 0,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table receipts enable row level security;

create policy "Users can only see their own receipts"
  on receipts for select
  using (auth.uid() = user_id);

create policy "Users can only insert their own receipts"
  on receipts for insert
  with check (auth.uid() = user_id);

create policy "Users can only update their own receipts"
  on receipts for update
  using (auth.uid() = user_id);

create policy "Users can only delete their own receipts"
  on receipts for delete
  using (auth.uid() = user_id);
```

Every policy keys off `auth.uid()`, not an application-supplied user ID — an application bug can't forge ownership because the database itself is the enforcement point, not a line of app code that might get skipped.

### Sync model

Local IndexedDB remains the source of truth for offline use; the backend is a sync target, not a replacement:

- **Opt-in enrollment:** Settings → "Back up receipts to your account." Creates the Supabase auth session and does a one-time upload of existing local receipts, tagged with `user_id`.
- **Conflict resolution:** last-write-wins on `updated_at`, with a visible "synced Xm ago" indicator — matching the existing local-storage safety indicator's honesty about state rather than hiding sync status.
- **Deletion:** soft-delete (`deleted_at` column) rather than hard delete, so a sync conflict can't silently destroy a receipt a second device hasn't seen yet.
- **No account = no change.** Everything above is entirely inert until a user opts in.

### Migration phases

1. Schema + RLS policies, behind a feature flag, no UI.
2. Opt-in enrollment UI + one-way upload (local → cloud), no download yet — proves the write path safely before trusting the read/merge path.
3. Two-way sync with conflict resolution.
4. Cross-device: sign in on a second device, receipts appear.

## Part 2 — MCP financial tools (the harder decision)

### What changes, mechanically

Today's trust boundary works *because there's nothing to reach*: the MCP server is stateless, every tool takes an explicit caller-supplied snapshot, and `docs/mcp-ai-grading.md` can truthfully say the server never reads storage. The moment receipts live in a real, persistent, per-user database, that argument stops applying by default — it has to be re-earned deliberately for financial data specifically, not inherited from the grading tools' design.

Grading tools and financial tools are not the same risk class:

| | Grading tools (today) | Financial tools (proposed) |
|---|---|---|
| Data sensitivity | A sweater's measurements | Real income, client relationships, tax-relevant records |
| Data source | Caller-supplied per call | Persisted, queryable by the server itself |
| Auth model | One shared static API key | Must be per-user; a shared key would mean any caller could read any user's receipts |
| Blast radius of a bug | Wrong PDF, regenerate it | Wrong person's income data displayed to the wrong AI/human |

### Auth: this forces the OAuth gap closed

`docs/mcp-ai-grading.md` already flags this: *"OAuth 2.1 + PKCE should be added before broad third-party distribution or multi-user account access."* Financial tools **are** multi-user account access — this isn't optional groundwork anymore, it's a prerequisite. A single shared `MCP_API_KEY` (even the multi-key version from the rate-limit PR) identifies a *client application*, not an *end user* — it cannot express "this AI session is allowed to see designer X's receipts and no one else's." Financial MCP tools need the caller to present a token that resolves to a specific Supabase `auth.uid()`, so RLS enforces the same per-user boundary for MCP calls as for the app itself.

### Proposed tool set — read tools first, mutation tools separately and later

**Phase A — read-only, aggregated only:**

- `receipts.summary` — takes a date range, returns the same shape as `computeMonthlyLedgerRows` (month, revenue, sale count, profit). No item-level detail, no note text, no per-sale amounts. This is deliberately the least anyone could extract — an AI asked "how's my income trending" gets exactly the numbers needed to answer that and nothing else.

**Phase B — read-only, itemized (only if Phase A proves out):**

- `receipts.list` — paginated, date-range-scoped, returns individual receipts. Real exposure of note fields and item names, so: hard page-size cap, no full-ledger-in-one-call, and every call logged to an audit table (`mcp_access_log`: user, tool, timestamp, params — not results) so a designer can see exactly what an AI read and when, the same way the app already exposes local-storage state visibly rather than silently.

**Phase C — mutation (highest bar, evaluate last, maybe never):**

- `receipts.create` — an AI logging a sale on the designer's behalf. Every existing mutating-ish tool (`export.pattern_pdf`, artifact creation) already requires `userApproved: true` per call; this needs the same, non-negotiably, plus should probably require re-confirmation of the exact amount and date back to the user in the tool's own response before the human approves — so approval isn't just "yes, go" against something they haven't actually seen restated.

**Explicitly not proposed, ever, without a separate decision:**

- Bulk export (a "get me everything" tool) — the entire ledger in one call is the receipt-lab-card.tsx test's nightmare scenario made server-side; that test exists specifically to keep this kind of silent, programmatic full export out of the client, and an MCP tool shouldn't reintroduce it from the other direction.
- Cross-user aggregation of any kind (no "how do I compare to other designers" tool) — even anonymized, this is the kind of feature that's easy to justify and hard to fully de-anonymize once real financial data is behind it.
- Deletion via MCP — receipts feeding into someone's tax records shouldn't be a single AI tool call away from disappearing, approved or not.

### Rate limiting, applied to financial tools specifically

The rate-limit work in the current PR (`mcp-rate-limit.ts`) limits by *client IP*, which is the right unit for an anonymous, stateless grading tool. Financial tools need limiting by *authenticated user* as well — otherwise one compromised session could be used to enumerate another user's data by rotating IPs, which IP-based limiting alone won't catch. `McpRateLimitStore` already generalizes over the identity string passed to `checkMcpRateLimit`, so this is additive to the existing module, not a rework: financial tools would rate-limit on `user_id` in addition to (not instead of) the existing IP-based check.

## Suggested sequencing

1. Ship the rate-limit/key-rotation PR already open (#74) — no dependency on this proposal.
2. Backend Part 1, phases 1–2 (schema + one-way upload), fully independent of MCP — proves the persistence layer works before any AI ever touches it.
3. OAuth 2.1 + PKCE for MCP, motivated by and scoped to financial tools specifically (closes the gap `docs/mcp-ai-grading.md` already names).
4. `receipts.summary` only — the aggregated, lowest-exposure tool — with the audit log in place before this ships, not after.
5. Revisit Phase B/C only once Phase 4 has been in real use and the audit log shows what it's actually being asked for.

## Open questions for the project owner

- Does an AI reading aggregated income summaries need a different approval gesture than the existing `userApproved: true` per-call flag, given it's recurring read access rather than a one-off artifact?
- Should the audit log (`mcp_access_log`) be visible to the designer inside the app itself, the way the local-storage safety indicator is — i.e. "an AI read your July summary 3 times this week" as a real, visible UI element, not just a backend table?
- Is per-user OAuth worth building before there's a second real MCP client, or should it wait until there's an actual second caller to design against instead of an assumed one?
