import { useMemo, useState } from 'react';
import { useProjectStorage, useProjectStorageState } from '@/lib/storage-lib';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';
import { getToastCopy } from '@/lib/toast-copy';
import { getWholesaleBookCopy } from '@/lib/wholesale-book-copy';
import { ClipboardCopy, BookOpen, Package } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import { safeNum } from '@/lib/numeric-guard';
import {
  analyzeWholesaleDeal,
  analyzeBookDeal,
  buildWholesalePack,
  WholesaleInputs,
  BookInputs,
} from '@/lib/wholesale-book-analyzer';

const STORAGE_KEY = 'kskwsb-v1';

interface StoredState {
  showBook: boolean;
  wholesale: WholesaleInputs;
  book: BookInputs;
  bookReplyCopied: boolean;
}

function defaults(): StoredState {
  return {
    showBook: false,
    wholesale: {
      patterns: 5,
      retailPrice: 8,
      wholesaleRate: 4,
      orderQuantity: 100,
      repeatOrderChance: 0.4,
      workHours: 40,
      exclusive: false,
      cashCosts: 200,
      yourRate: 0,
    },
    book: {
      patterns: 10,
      advance: 5000,
      installments: 3,
      royaltyRate: 10,
      coverPrice: 28,
      workHours: 400,
      cashCosts: 800,
      selfPublishMonths: 24,
      monthlySelfSellUnits: 8,
      unitNet: 5.7,
    },
    bookReplyCopied: false,
  };
}

// CHK-152: pure derivation over the raw stored value — takes no
// handle, so it can never reach for a freshly-created handle in an initializer.
function loadStored(raw: StoredState | null): StoredState {
  const base = defaults();
  const clamp = (value: number, min: number, max = Infinity) => Math.min(max, Math.max(min, value));
  try {
    if (raw?.wholesale) {
      const wholesale = { ...base.wholesale, ...raw.wholesale };
      const book = { ...base.book, ...raw.book };
      return {
        ...base,
        ...raw,
        wholesale: {
          ...wholesale,
          patterns: clamp(safeNum(wholesale.patterns, base.wholesale.patterns), 1),
          retailPrice: clamp(safeNum(wholesale.retailPrice, base.wholesale.retailPrice), 0),
          wholesaleRate: clamp(safeNum(wholesale.wholesaleRate, base.wholesale.wholesaleRate), 0),
          orderQuantity: clamp(safeNum(wholesale.orderQuantity, base.wholesale.orderQuantity), 1),
          repeatOrderChance: clamp(safeNum(wholesale.repeatOrderChance, base.wholesale.repeatOrderChance), 0, 1),
          workHours: clamp(safeNum(wholesale.workHours, base.wholesale.workHours), 0),
          cashCosts: clamp(safeNum(wholesale.cashCosts, base.wholesale.cashCosts), 0),
          yourRate: clamp(safeNum(wholesale.yourRate, base.wholesale.yourRate), 0),
        },
        book: {
          ...book,
          patterns: clamp(safeNum(book.patterns, base.book.patterns), 1),
          advance: clamp(safeNum(book.advance, base.book.advance), 0),
          installments: clamp(Math.round(safeNum(book.installments, base.book.installments)), 2, 4) as 2 | 3 | 4,
          royaltyRate: clamp(safeNum(book.royaltyRate, base.book.royaltyRate), 0, 100),
          coverPrice: clamp(safeNum(book.coverPrice, base.book.coverPrice), 0.01),
          workHours: clamp(safeNum(book.workHours, base.book.workHours), 0),
          selfPublishMonths: clamp(safeNum(book.selfPublishMonths, base.book.selfPublishMonths), 1),
          monthlySelfSellUnits: clamp(safeNum(book.monthlySelfSellUnits, base.book.monthlySelfSellUnits), 0),
          unitNet: clamp(safeNum(book.unitNet, base.book.unitNet), 0),
        },
      };
    }
  } catch {
    /* storage unreadable — start fresh */
  }
  return base;
}

const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function WholesaleBookCard({ project }: { project: PatternProject }) {
  // issue #4 project seam: one scoped store per project; the legacy flat key 'kskwsb-v1' is folded in on first read, then removed.
  // CHK-152 (QUEUE-010): the old useMemo handle + `useState(() =>
// loadStored(handle))` lazy initializer was the crash class under HMR.
// Now flows through the shared seam: stable handle, memoized derivation.
const handle = useProjectStorage<StoredState>('wholesalebook', project.id, ['kskwsb-v1']);
  const { toast } = useToast();
  const { language } = useSettings();
  const tc = getToastCopy(language);
  const wbc = getWholesaleBookCopy(language);

  const [stored, setStored] = useProjectStorageState(handle, (raw) => loadStored(raw));
  // CHK-152: persistence owned by the seam's state hook — a manual
  // write-on-change effect would double-write every update.

  const wholesale = useMemo(() => analyzeWholesaleDeal(stored.wholesale), [stored.wholesale]);
  const pack = useMemo(() => buildWholesalePack(stored.wholesale, wholesale), [stored.wholesale, wholesale]);
  const book = useMemo(() => analyzeBookDeal(stored.book), [stored.book]);

  const setWholesale = (patch: Partial<WholesaleInputs>) =>
    setStored((s) => ({ ...s, wholesale: { ...s.wholesale, ...patch } }));
  const setBook = (patch: Partial<BookInputs>) =>
    setStored((s) => ({ ...s, book: { ...s.book, ...patch } }));

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: tc.wholesaleCopied });
    } catch {
      toast({ title: tc.wholesaleSelectManually });
    }
  };

  const verdictBadge = (v: string) =>
    v === 'go' ? (
      <Badge className="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">YES — GO</Badge>
    ) : v === 'no' ? (
      <Badge className="bg-destructive/15 text-destructive border border-destructive/30">NO</Badge>
    ) : (
      <Badge className="bg-amber-500/15 text-amber-700 border border-amber-500/30">MAYBE</Badge>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Package className="w-5 h-5 text-accent" />
          Wholesale &amp; Book-deal Analyzer
        </CardTitle>
        <CardDescription>
          Two decisions designers price on instinct: selling patterns at wholesale to shops and yarn brands,
          and taking a traditional book deal. Benchmarks: keystone wholesale at half retail, ~£130 direct
          cost and 34.5 hours per professionally produced pattern, royalties of 10% hardcover / 8% paperback /
          25% ebook against cover price, advances paid in installments that lag ~2 years behind the deal,
          15% agent and ~35% tax drag — and the $12/hr professional floor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" /> Wholesale / bulk-pattern offer
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="ws-patterns">Patterns offered</Label>
              <Input id="ws-patterns" type="number" min={1}
                value={stored.wholesale.patterns}
                onChange={(e) => setWholesale({ patterns: Math.max(1, safeNum(e.target.value, stored.wholesale.patterns)) })} />
            </div>
            <div>
              <Label htmlFor="ws-retail">Your retail price ($)</Label>
              <Input id="ws-retail" type="number" min={0} step={0.5}
                value={stored.wholesale.retailPrice}
                onChange={(e) => setWholesale({ retailPrice: Math.max(0, safeNum(e.target.value, stored.wholesale.retailPrice)) })} />
            </div>
            <div>
              <Label htmlFor="ws-rate">Wholesale rate offered ($)</Label>
              <Input id="ws-rate" type="number" min={0} step={0.25}
                value={stored.wholesale.wholesaleRate}
                onChange={(e) => setWholesale({ wholesaleRate: Math.max(0, safeNum(e.target.value, stored.wholesale.wholesaleRate)) })} />
            </div>
            <div>
              <Label htmlFor="ws-qty">Order quantity / term</Label>
              <Input id="ws-qty" type="number" min={1}
                value={stored.wholesale.orderQuantity}
                onChange={(e) => setWholesale({ orderQuantity: Math.max(1, safeNum(e.target.value, stored.wholesale.orderQuantity)) })} />
            </div>
            <div>
              <Label htmlFor="ws-repeat">Repeat-order chance (%)</Label>
              <Input id="ws-repeat" type="number" min={0} max={100}
                value={Math.round(stored.wholesale.repeatOrderChance * 100)}
                onChange={(e) => setWholesale({ repeatOrderChance: Math.min(100, Math.max(0, safeNum(e.target.value, stored.wholesale.repeatOrderChance * 100))) / 100 })} />
            </div>
            <div>
              <Label htmlFor="ws-hours">Your work hours</Label>
              <Input id="ws-hours" type="number" min={0}
                value={stored.wholesale.workHours}
                onChange={(e) => setWholesale({ workHours: Math.max(0, safeNum(e.target.value, stored.wholesale.workHours)) })} />
            </div>
            <div>
              <Label htmlFor="ws-costs">Cash costs — test knitting, tech edit, photo ($)</Label>
              <Input id="ws-costs" type="number" min={0}
                value={stored.wholesale.cashCosts}
                onChange={(e) => setWholesale({ cashCosts: Math.max(0, safeNum(e.target.value, stored.wholesale.cashCosts)) })} />
            </div>
            <div>
              <Label htmlFor="ws-net">Your direct net / pattern ($, 0 = Ravelry default)</Label>
              <Input id="ws-net" type="number" min={0} step={0.1}
                value={stored.wholesale.yourRate}
                onChange={(e) => setWholesale({ yourRate: Math.max(0, safeNum(e.target.value, stored.wholesale.yourRate)) })} />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 pt-2">
                <Switch id="ws-exclusive" checked={stored.wholesale.exclusive}
                  onCheckedChange={(c) => setWholesale({ exclusive: c })} />
                <Label htmlFor="ws-exclusive">Exclusive (can&apos;t self-sell)</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 bg-secondary/40 rounded-lg p-3">
            <div><div className="text-xs text-muted-foreground">Deal nets</div><div className="font-semibold">{fmt$(wholesale.wholesaleNet)}</div></div>
            <div><div className="text-xs text-muted-foreground">Same volume self-sold</div><div className="font-semibold">{fmt$(wholesale.directNetEquivalent)}</div></div>
            <div><div className="text-xs text-muted-foreground">Breakeven direct copies</div><div className="font-semibold">{Number.isFinite(wholesale.volumeBreakeven) ? wholesale.volumeBreakeven.toLocaleString() : '—'}</div></div>
            <div><div className="text-xs text-muted-foreground">Effective hourly</div><div className="font-semibold">{wholesale.effectiveHourly}/hr</div></div>
          </div>

          <div className="mt-3 flex items-center gap-2">{verdictBadge(wholesale.verdict)}</div>

          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            {wholesale.notes.map((n, i) => <p key={i}>{n}</p>)}
          </div>
        </section>

        <section>
          <h3 className="font-medium mb-3">{wbc.bulkOrderChecklistReply}</h3>
          <div className="space-y-2">
            {pack.checklist.map((c, i) => (
              <div key={i} className={`text-sm rounded-md border p-2 ${c.flag ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card border-border/60'}`}>
                <div className="flex items-start gap-2">
                  <span className={c.flag ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {c.flag ? '!' : '✓'}
                  </span>
                  <div>
                    <p className="font-medium">{c.check}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.rationale}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 bg-secondary/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Paste-ready reply / counteroffer</p>
              <Button size="sm" variant="outline" onClick={() => copy(pack.reply)}>
                <ClipboardCopy className="w-3 h-3 mr-1" /> Copy
              </Button>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">{pack.reply}</pre>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Switch id="ws-showbook" checked={stored.showBook}
              onCheckedChange={(c) => setStored((s) => ({ ...s, showBook: c }))} />
            <Label htmlFor="ws-showbook" className="flex items-center gap-2 cursor-pointer">
              <BookOpen className="w-4 h-4" /> Book / publisher offer (advance + royalties)
            </Label>
          </div>

          {stored.showBook && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="bk-patterns">Patterns in the book</Label>
                  <Input id="bk-patterns" type="number" min={1}
                    value={stored.book.patterns}
                    onChange={(e) => setBook({ patterns: Math.max(1, safeNum(e.target.value, stored.book.patterns)) })} />
                </div>
                <div>
                  <Label htmlFor="bk-advance">Total advance ($)</Label>
                  <Input id="bk-advance" type="number" min={0}
                    value={stored.book.advance}
                    onChange={(e) => setBook({ advance: Math.max(0, safeNum(e.target.value, stored.book.advance)) })} />
                </div>
                <div>
                  <Label htmlFor="bk-inst">Installments</Label>
                  <Input id="bk-inst" type="number" min={2} max={4}
                    value={stored.book.installments}
                    onChange={(e) => setBook({ installments: Math.min(4, Math.max(2, Math.round(safeNum(e.target.value, stored.book.installments)))) as 2 | 3 | 4 })} />
                </div>
                <div>
                  <Label htmlFor="bk-royalty">Royalty (% of cover)</Label>
                  <Input id="bk-royalty" type="number" min={0} max={100} step={0.5}
                    value={stored.book.royaltyRate}
                    onChange={(e) => setBook({ royaltyRate: Math.min(100, Math.max(0, safeNum(e.target.value, stored.book.royaltyRate))) })} />
                </div>
                <div>
                  <Label htmlFor="bk-cover">Cover price ($)</Label>
                  <Input id="bk-cover" type="number" min={0.01} step={0.5}
                    value={stored.book.coverPrice}
                    onChange={(e) => setBook({ coverPrice: Math.max(0.01, safeNum(e.target.value, stored.book.coverPrice)) })} />
                </div>
                <div>
                  <Label htmlFor="bk-hours">Your total work hours</Label>
                  <Input id="bk-hours" type="number" min={0}
                    value={stored.book.workHours}
                    onChange={(e) => setBook({ workHours: Math.max(0, safeNum(e.target.value, stored.book.workHours)) })} />
                </div>
                <div>
                  <Label htmlFor="bk-selfmonths">Self-publish window (months)</Label>
                  <Input id="bk-selfmonths" type="number" min={1}
                    value={stored.book.selfPublishMonths}
                    onChange={(e) => setBook({ selfPublishMonths: Math.max(1, safeNum(e.target.value, stored.book.selfPublishMonths)) })} />
                </div>
                <div>
                  <Label htmlFor="bk-units">Monthly self-sold units</Label>
                  <Input id="bk-units" type="number" min={0}
                    value={stored.book.monthlySelfSellUnits}
                    onChange={(e) => setBook({ monthlySelfSellUnits: Math.max(0, safeNum(e.target.value, stored.book.monthlySelfSellUnits)) })} />
                </div>
                <div>
                  <Label htmlFor="bk-unitnet">Net / self-sold unit ($)</Label>
                  <Input id="bk-unitnet" type="number" min={0} step={0.1}
                    value={stored.book.unitNet}
                    onChange={(e) => setBook({ unitNet: Math.max(0, safeNum(e.target.value, stored.book.unitNet)) })} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 bg-secondary/40 rounded-lg p-3">
                <div><div className="text-xs text-muted-foreground">Earn-out copies</div><div className="font-semibold">{Number.isFinite(book.earnOutCopies) ? book.earnOutCopies.toLocaleString() : '—'}</div></div>
                <div><div className="text-xs text-muted-foreground">Net advance (after 15% agent, ~35% tax)</div><div className="font-semibold">{fmt$(book.netAdvanceAfterDeductions)}</div></div>
                <div><div className="text-xs text-muted-foreground">Deal $/hr (your time)</div><div className="font-semibold">{book.dealNetPerHour}/hr</div></div>
                <div><div className="text-xs text-muted-foreground">Self-publish same patterns</div><div className="font-semibold">{fmt$(book.selfPublishNet)}</div></div>
              </div>

              <div className="mt-3 flex items-center gap-2">{verdictBadge(book.verdict)}</div>

              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>
                  Installments arrive: {book.installmentTimeline.join(' → ')}. First royalty statement
                  ~{book.firstStatementLagMonths} months after release.
                </p>
                {book.notes.map((n, i) => <p key={i}>{n}</p>)}
              </div>
            </>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
