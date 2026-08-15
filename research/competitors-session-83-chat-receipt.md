# Session 83 — Chat-first receipt pain research (for indie knitwear/craft sellers)

## The core pain is real and widespread

1. **Etsy does NOT issue invoices/receipts to buyers** — only order confirmations. Sellers in Etsy seller FB groups repeatedly ask how to produce invoices for wholesale/custom buyers, and answer with "I use Square/PayPal invoicing" or "Excel/Google Sheets". (Facebook Etsy seller group, Jan 2025: "Etsy does not generate invoices just order confirmation.")
2. **Market/craft-fair sellers still handwrite receipts or skip them entirely.** r/CraftFairs thread: sellers use yellow-highlighted Excel rows, notebooks, invoice books, or nothing. Tools used: QuickBooks (expensive, raised prices repeatedly, overkill), Wave, Square, Inventora, or pure spreadsheet chaos. One seller: paid more income tax for years because QBSE counted sales tax as income — accounting tools are scary for micro-businesses.
3. **Home-based and custom-order sellers run on DMs.** Instagram/TikTok/FB crochet & knit accounts almost universally take custom orders via DM ("DM me for custom orders"), with WhatsApp as the payment/proof channel. Order process posts literally read: "1) send pictures of your order to our WhatsApp... 2) make payment... 3) send proof of payment." The receipt lives in chat, not email.
4. **WhatsApp receipts have ~98% open rate vs ~20% email** for small-business messages (SimpleReceiptMaker data). In Nigeria (founder's home market), India, Kenya etc. WhatsApp IS the storefront. Home-bakers, market sellers, tutors, freelancers all send receipts via WhatsApp. Craft is the missing vertical for knit-specific receipts.
5. **Custom-order sellers need proof-of-order and proof-of-payment documents** (deposits 30–50%, delivery timelines, "what did they ask for" disputes). Reddit r/Etsy: "NEVER communicate with a buyer off the Etsy platform... you won't have proof of what they've asked for" — sellers crave written order records to protect themselves, and Etsy's own rules push them off-platform-risky. A clean written order/quote document per chat conversation = protection AND professionalism.

## Weaknesses of existing tools (our strengths)

| Tool | What it does | Flaw for knit sellers |
|---|---|---|
| Wave/QuickBooks/Invoicely | generic invoicing | built for freelancers/B2B; no pattern/custom-knit fields (size range, yarn, gauge); email-first not chat-first; subscription or accounting-scariness |
| Square/PayPal invoices | payments + receipt | requires payment processing; overkill for cash/bank-transfer sellers; fees |
| SimpleReceiptMaker | free web receipt gen + WhatsApp share | one-off generator, no memory of sales, no ledger, no per-sale profit math, no pattern data |
| Craftybase | craft inventory/COGS | $25+/mo, inventory-focused, no receipt output |
| Etsy | marketplace | no buyer invoices; off-platform custom work = no paper trail at all |

**Nobody combines: (a) receipt/quote generation + (b) sales ledger + (c) per-sale profit using existing pricing-lab cost data + (d) chat-first shareable output (PNG for WhatsApp/Signal/iMessage, not just PDF). That's the Receipt Lab.**

## Design decisions (from research)

- Receipt must work as a **PNG image** (chat-first, looks native in WhatsApp/Signal/iMessage) AND as printable **PDF** (tax/wholesale).
- Three doc types: **Receipt** (sale completed), **Quote/Order confirmation** (custom order, protects the seller with written terms: deposit, timeline, what was agreed), **Refund note**.
- Must prefill from existing pattern data (pattern name, size range, price from pricing lab) — one-tap from the workspace.
- Per-sale profit line: price − materials − fees = profit, reusing Intl Pricing Lab / income data.
- Brand: business name, logo placeholder, currency. Honest-branding per brand-voice brief (no fake "made by designer" claims).
- Ledger: monthly totals, refunds netted, commission fees — feeds the existing income lab narrative.
- Local-first, project-scoped storage seam (no backend). No auto-send (no WhatsApp API without backend); share = copy/save PNG + web-share API where supported.
