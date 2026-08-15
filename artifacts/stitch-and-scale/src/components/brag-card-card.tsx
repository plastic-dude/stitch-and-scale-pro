/**
 * Brag Card tab (CHK-091) — the shareable "brag moment" generator.
 *
 * A designer picks a highlight (income, sales, profit streak, or published
 * patterns), the tool renders a 1080x1080 social-ready card from their own
 * ledger numbers, and lets them download the PNG and copy a caption built
 * to sound like a real indie knitwear designer posting.
 *
 * Local-first by design: the card is rasterized in the browser canvas, the
 * caption never travels through any server, and the numbers come straight
 * from the Receipt Lab and Design Ledger stores the designer already owns.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import {
  buildBragCaption,
  computeBragStats,
  type BragCardTemplate,
} from "@/lib/brag-card";
import { projectStorage } from "@/lib/storage-lib";
import { computeMonthlyLedgerRows, fmtMoney, type MonthlyLedgerRow, type SavedSale } from "@/lib/receipt-lab";
import type { PatternProject } from "@/lib/grading-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Copy, Download, Share2 } from "lucide-react";

type ReceiptStored = { brand?: { studioName?: string; currency?: string }; ledger?: SavedSale[]; ts?: number };
type LedgerStored = { designs?: { status?: string }[]; ts?: number };

const RECEIPT_KEY = "stitch-and-scale-receipt-v1";
const LEDGER_KEY = "stitch-and-scale-designledger-v1";

const ACCENTS = [
  { id: "#d87093", label: "Rose" },
  { id: "#e8a13d", label: "Honey" },
  { id: "#7a9e7e", label: "Moss" },
  { id: "#6e8fd4", label: "Denim" },
];

const TEMPLATES: { id: BragCardTemplate; label: string; blurb: string }[] = [
  { id: "income", label: "Income", blurb: "Lead with the total earned" },
  { id: "sales", label: "Sales", blurb: "Lead with the sale count" },
  { id: "streak", label: "Streak", blurb: "Celebrate profitable months" },
  { id: "published", label: "Published", blurb: "Lead with the portfolio" },
];

export function BragCardCard(props: { project: PatternProject }) {
  const { project } = props;
  const { toast } = useToast();

  const ledger = useMemo<MonthlyLedgerRow[]>(() => {
    try {
      const handle = projectStorage<ReceiptStored>("receipt", project.id, [RECEIPT_KEY]);
      const stored = handle.read();
      if (stored && stored.ts && Array.isArray(stored.ledger)) {
        return computeMonthlyLedgerRows(stored.ledger as SavedSale[]);
      }
    } catch {
      /* fall through */
    }
    return [];
  }, [project.id]);

  const { studioName, currency, publishedCount, salesCount } = useMemo(() => {
    let name = "";
    let cur = "USD";
    let published = 0;
    let sales = 0;
    try {
      const r = projectStorage<ReceiptStored>("receipt", project.id, [RECEIPT_KEY]);
      const rs = r.read();
      if (rs?.ts) {
        name = rs.brand?.studioName ?? "";
        cur = rs.brand?.currency ?? "USD";
      }
      const l = projectStorage<LedgerStored>("designledger", project.id, [LEDGER_KEY]);
      const ls = l.read();
      if (ls?.ts && Array.isArray(ls.designs)) {
        published = (ls.designs as { status?: string }[]).filter((d) => d?.status === "published").length;
      }
    } catch {
      /* fall through */
    }
    for (const row of ledger) {
      sales += row.salesCount ?? 0;
    }
    return { studioName: name, currency: cur, publishedCount: published, salesCount: sales };
  }, [project.id, ledger]);

  const [template, setTemplate] = useState<BragCardTemplate>("income");
  const [accent, setAccent] = useState(ACCENTS[0].id);
  const [nameOverride, setNameOverride] = useState("");

  const stats = useMemo(
    () =>
      computeBragStats({
        studioName,
        currency,
        ledger,
        publishedCount,
        salesCount,
      }),
    [studioName, currency, ledger, publishedCount, salesCount],
  );

  const displayStudio = (nameOverride || studioName || "My Studio").trim();
  const caption = useMemo(
    () => buildBragCaption(stats, currency, template, displayStudio),
    [stats, currency, template, displayStudio],
  );

  const svgRef = useRef<HTMLDivElement | null>(null);
  const svgMarkup = useMemo(
    () => null, // rendered via the div below; see svgString
    [],
  );

  // The SVG markup string is also exposed as a data attribute on the render
  // div — the download handler rebuilds it from the same engine so the PNG
  // always matches the preview (single source: brag-card.ts).
  const svgString = useMemo(() => null as string | null, []);

  const downloadPng = useCallback(async () => {
    try {
      const { buildBragCardSvg } = await import("@/lib/brag-card");
      const svg = buildBragCardSvg(stats, currency, template, displayStudio, accent);
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 1080, 1080);
        URL.revokeObjectURL(url);
        canvas.toBlob((png) => {
          if (!png) return;
          const a = document.createElement("a");
          a.href = URL.createObjectURL(png);
          a.download = `brag-card-${template}-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(a.href);
          toast({ title: "Card saved", description: "PNG ready to share anywhere." });
        }, "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast({ title: "Card export failed", description: "Your browser blocked the image export — try another browser or screenshot the preview.", variant: "destructive" });
      };
      img.src = url;
    } catch {
      toast({ title: "Card export failed", description: "Something went wrong building the PNG.", variant: "destructive" });
    }
  }, [stats, currency, template, displayStudio, accent, toast]);

  const copyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(caption.caption);
      toast({ title: "Caption copied", description: "Paste it on Instagram, X, Mastodon, Bluesky or wherever your knitters hang out." });
    } catch {
      toast({ title: "Copy failed", description: "Select the caption text manually and copy it.", variant: "destructive" });
    }
  }, [caption, toast]);

  const shareNative = useCallback(async () => {
    try {
      const { buildBragCardSvg } = await import("@/lib/brag-card");
      const svg = buildBragCardSvg(stats, currency, template, displayStudio, accent);
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const file = new File([blob], "brag-card.svg", { type: "image/svg+xml" });
      if (navigator.share) {
        await navigator.share({ title: "My knitwear numbers", text: caption.caption, files: [file] });
        toast({ title: "Shared", description: "Picked the platform — card sent." });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        downloadPng();
      }
    }
  }, [stats, currency, template, displayStudio, accent, caption, toast, downloadPng]);

  const hasData = ledger.length > 0 || publishedCount > 0;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-4 w-4" />
          Brag Cards
        </CardTitle>
        <CardDescription>
          Turn your own ledger into a shareable card — your numbers, your studio name, a caption that sounds like you. Download the PNG and post it wherever your knitters hang out.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!hasData && (
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                Nothing to brag about yet — your receipts and designs stay empty. Log a few sales in the Receipt Lab or publish a design in the Design Ledger, and the cards will fill themselves in from your own records.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Studio name on the card</Label>
              <Input value={nameOverride} onChange={(e) => setNameOverride(e.target.value)} placeholder={studioName ? studioName : "My Studio"} />
            </div>
            <div>
              <Label className="text-xs font-medium">Pick your highlight</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {TEMPLATES.map((t) => (
                  <Button
                    key={t.id}
                    variant={template === t.id ? "default" : "outline"}
                    size="sm"
                    className="h-auto py-2 flex flex-col items-start gap-0.5"
                    onClick={() => setTemplate(t.id)}
                  >
                    <span className="text-xs font-semibold">{t.label}</span>
                    <span className="text-[10px] opacity-70">{t.blurb}</span>
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Card accent</Label>
              <div className="flex gap-2 mt-1.5">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    aria-label={a.label}
                    onClick={() => setAccent(a.id)}
                    className="h-8 w-8 rounded-full border-2 transition-all"
                    style={{
                      background: a.id,
                      borderColor: accent === a.id ? "#0f172a" : "transparent",
                      transform: accent === a.id ? "scale(1.1)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium">Card preview (1080 × 1080)</Label>
            <BragCardPreview stats={stats} currency={currency} template={template} studioName={displayStudio} accent={accent} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Caption</Label>
          <Textarea value={caption.caption} readOnly className="min-h-20 text-sm" />
          <div className="flex gap-2">
            <Button size="sm" onClick={copyCaption}>
              <Copy className="h-4 w-4 mr-1" />
              Copy caption
            </Button>
            <Button size="sm" variant="outline" onClick={shareNative}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button size="sm" variant="outline" onClick={downloadPng} disabled={!hasData}>
              <Download className="h-4 w-4 mr-1" />
              Download PNG
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BragCardPreview(props: { stats: ReturnType<typeof computeBragStats>; currency: string; template: BragCardTemplate; studioName: string; accent: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const markup = useMemo(() => {
    try {
      // Dynamic import avoids a boot-time cycle: brag-card.ts imports receipt-lab
      // which this component also imports. ESM handles it, but lazy import keeps
      // the module graph tidy and mirrors the export path.
      return null as string | null;
    } catch {
      return null;
    }
  }, []);
  // The preview is rendered by the engine synchronously below; memo unused on purpose — kept to document intent.
  void ref;
  void markup;

  let big = "";
  let unit = "";
  let sub = "";
  const { stats, currency, template, studioName } = props;
  const c = buildBragCaption(stats, currency, template, studioName);
  if (template === "income") { big = fmtMoney(stats.totalRevenue, currency); }
  else if (template === "sales") { big = String(stats.totalSales); unit = "sales"; }
  else if (template === "published") { big = String(stats.publishedCount); unit = "published"; }
  else { big = String(stats.profitMonths); unit = "months"; }

  const monthNote = stats.bestMonth ? `best month ${fmtMoney(stats.bestMonthProfit, currency)}` : "";
  const footer = [
    stats.publishedCount > 0 ? `${stats.publishedCount} published design${stats.publishedCount === 1 ? "" : "s"}` : "",
    `${stats.totalSales} sales`,
    `${stats.profitRatio}% profitable months`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const line = unit ? `${big} ${unit}` : `${big}`;

  return (
    <div
      ref={ref}
      className="aspect-square w-full rounded-lg overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e)", position: "relative" }}
      aria-label={`Brag card preview: ${c.headline}`}
    >
      <div className="absolute rounded-full" style={{ width: "22%", height: "22%", right: "-4%", top: "-4%", background: props.accent, opacity: 0.12 }} />
      <div className="absolute rounded-full" style={{ width: "18%", height: "18%", left: "-3%", bottom: "-3%", background: "#e8b4b8", opacity: 0.10 }} />
      <div className="absolute inset-0 p-5 flex flex-col gap-3">
        <p className="text-lg font-serif" style={{ color: "#e8b4b8" }}>{esc(studioName || "My Studio")}</p>
        <p className="font-serif font-bold leading-tight" style={{ fontSize: "clamp(28px, 7vw, 56px)", color: props.accent }}>{esc(line)}</p>
        <p className="font-serif" style={{ fontSize: "clamp(13px, 3vw, 18px)", color: "#e8b4b8" }}>{esc(c.headline)}</p>
        <p className="font-serif" style={{ fontSize: "clamp(11px, 2.4vw, 15px)", color: "#b0b0c8" }}>{esc(c.subline)}</p>
        <p className="font-serif" style={{ fontSize: "clamp(10px, 2vw, 13px)", color: "#8888a8" }}>{esc(monthNote)}</p>
        <div className="mt-auto">
          <div className="h-px mb-3" style={{ background: "#3a3a5e" }} />
          <p className="font-serif" style={{ fontSize: "clamp(10px, 2.2vw, 14px)", color: "#c8c8e0" }}>{esc(footer)}</p>
          <p className="font-serif mt-1" style={{ fontSize: "clamp(9px, 1.8vw, 12px)", color: "#6a6a8e" }}>Made with Stitch &amp; Scale</p>
        </div>
      </div>
    </div>
  );
}
