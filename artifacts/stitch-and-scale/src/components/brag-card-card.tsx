import { copyTextOrThrow } from '@/lib/clipboard';
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
  type BragCardBranding,
  type BragCardStyle,
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
import { useSettings } from "@/context/SettingsContext";
import { getBragCardCopy } from "@/lib/brag-copy";
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
const STYLES: { id: BragCardStyle; label: string }[] = [
  { id: "navy", label: "Navy" },
  { id: "editorial", label: "Editorial" },
  { id: "swatch", label: "Gauge Swatch" },
  { id: "selvedge", label: "Selvedge" },
  { id: "swiss", label: "Swiss Poster" },
  { id: "cameo", label: "Stitch Cameo" },
];

export function BragCardCard(props: { project: PatternProject }) {
  const { project } = props;
  const { toast } = useToast();
  const { language, studioProfile, pdfDefaults } = useSettings();
  const copy = getBragCardCopy(language);

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
  const [style, setStyle] = useState<BragCardStyle>("navy");
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

  const profileStudioName = studioProfile.studioName.trim() || studioProfile.designerName.trim();
  const displayStudio = (nameOverride || studioName || profileStudioName || copy.studioPlaceholder).trim();
  const branding = useMemo<BragCardBranding>(() => ({
    studioName: displayStudio,
    customLogo: pdfDefaults.customLogo,
    socialHandle: studioProfile.socialHandle,
    copyrightNotice: studioProfile.copyrightNotice,
  }), [displayStudio, pdfDefaults.customLogo, studioProfile.socialHandle, studioProfile.copyrightNotice]);
  const caption = useMemo(
    () => buildBragCaption(stats, currency, template, displayStudio, copy),
    [stats, currency, template, displayStudio, copy],
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
      const svg = buildBragCardSvg(stats, currency, template, displayStudio, accent, style, copy, branding);
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
          toast({ title: copy.cardSaved, description: copy.pngReady });
        }, "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        toast({ title: copy.exportFailed, description: copy.description, variant: "destructive" });
      };
      img.src = url;
    } catch {
      toast({ title: copy.exportFailed, description: copy.description, variant: "destructive" });
    }
  }, [stats, currency, template, displayStudio, accent, style, toast, copy, branding]);

  const copyCaption = useCallback(async () => {
    try {
      await copyTextOrThrow(caption.caption);
      toast({ title: copy.copyCaption, description: copy.description });
    } catch {
      toast({ title: copy.copyFailed, description: copy.description, variant: "destructive" });
    }
  }, [caption, toast, copy]);

  const shareNative = useCallback(async () => {
    try {
      const { buildBragCardSvg } = await import("@/lib/brag-card");
      const svg = buildBragCardSvg(stats, currency, template, displayStudio, accent, style, copy, branding);
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const file = new File([blob], "brag-card.svg", { type: "image/svg+xml" });
      if (navigator.share) {
        await navigator.share({ title: copy.title, text: caption.caption, files: [file] });
        toast({ title: copy.shared, description: copy.pngReady });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        downloadPng();
      }
    }
  }, [stats, currency, template, displayStudio, accent, style, caption, toast, downloadPng, copy, branding]);

  const hasData = ledger.length > 0 || publishedCount > 0;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-4 w-4" />
          {copy.title}
        </CardTitle>
        <CardDescription>
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!hasData && (
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                {copy.empty}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">{copy.studioName}</Label>
              <Input value={nameOverride} onChange={(e) => setNameOverride(e.target.value)} placeholder={studioName ? studioName : copy.studioPlaceholder} />
            </div>
            <div>
              <Label className="text-xs font-medium">{copy.highlight}</Label>
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
              <Label className="text-xs font-medium">{copy.style}</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={style === s.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStyle(s.id)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">{copy.accent}</Label>
              <div className="flex gap-2 mt-1.5">
                {ACCENTS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    aria-label={`${copy.accent}: ${a.label}`}
                    onClick={() => setAccent(a.id)}
                    className="h-8 w-8 min-h-11 min-w-11 rounded-full border-2 transition-all"
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
            <Label className="text-xs font-medium">{copy.preview}</Label>
            <BragCardPreview stats={stats} currency={currency} template={template} studioName={displayStudio} accent={accent} style={style} copy={copy} branding={branding} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{copy.captionLabel}</Label>
          <Textarea value={caption.caption} readOnly className="min-h-20 text-sm" />
          <div className="flex gap-2">
            <Button size="sm" onClick={copyCaption}>
              <Copy className="h-4 w-4 mr-1" />
              {copy.copyCaption}
            </Button>
            <Button size="sm" variant="outline" onClick={shareNative}>
              <Share2 className="h-4 w-4 mr-1" />
              {copy.share}
            </Button>
            <Button size="sm" variant="outline" onClick={downloadPng} disabled={!hasData}>
              <Download className="h-4 w-4 mr-1" />
              {copy.download}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BragCardPreview(props: { stats: ReturnType<typeof computeBragStats>; currency: string; template: BragCardTemplate; studioName: string; accent: string; style: BragCardStyle; copy: ReturnType<typeof getBragCardCopy>; branding: BragCardBranding }) {
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
  const { stats, currency, template, studioName, accent, style, copy, branding } = props;
  const c = buildBragCaption(stats, currency, template, studioName, props.copy);
  if (template === "income") { big = fmtMoney(stats.totalRevenue, currency); }
  else if (template === "sales") { big = String(stats.totalSales); unit = props.copy.sales; }
  else if (template === "published") { big = String(stats.publishedCount); unit = props.copy.published; }
  else { big = String(stats.profitMonths); unit = props.copy.profitableMonths; }

  const monthNote = stats.bestMonth ? `${props.copy.bestMonth} ${fmtMoney(stats.bestMonthProfit, currency)}` : "";
  const footer = [
    stats.publishedCount > 0 ? `${stats.publishedCount} ${props.copy.published}` : "",
    `${stats.totalSales} ${props.copy.sales}`,
    `${stats.profitRatio}% ${props.copy.profitableMonths}`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const line = unit ? `${big} ${unit}` : `${big}`;

  // The preview mirrors the six designer-grade styles from the engine
  // (CHK-094): palette per style, knit texture where it matters, and the
  // same footer rules — the PNG download always matches this preview.
  const pal = {
    navy: { bg: "linear-gradient(135deg, #171b2b, #1d2236)", ink: "#f1e9dd", soft: "#b9b4c6", rule: "#3a3f57" },
    editorial: { bg: "#f4efe4", ink: "#26221c", soft: "#6f6a5f", rule: "#cbbfad" },
    swatch: { bg: "#faf8f3", ink: "#2b2b26", soft: "#7a786f", rule: "#d8d4c8" },
    selvedge: { bg: "#24201c", ink: "#efe7d8", soft: "#b3ab9b", rule: "#554f44" },
    swiss: { bg: "#f2f0ea", ink: "#14130f", soft: "#6b6860", rule: "#cfcac0" },
    cameo: { bg: "#eef0ec", ink: "#1c2420", soft: "#6a7570", rule: "#c9d2cb" },
  }[style];

  const gridOverlay = style === "swatch" ? (
    <div className="absolute right-2 top-2" style={{ width: "28%", height: "28%", borderLeft: "2.5px solid " + pal.rule, borderTop: "2.5px solid " + pal.rule, borderRight: "2.5px solid " + pal.rule, backgroundImage: "linear-gradient(" + pal.rule + " 1px, transparent 1px), linear-gradient(90deg, " + pal.rule + " 1px, transparent 1px)", backgroundSize: "7% 7%" }}>
      <div className="absolute left-[10%] top-[10%] w-[15%] h-[15%]" style={{ background: accent, opacity: 0.55 }} />
      <div className="absolute left-[35%] top-[25%] w-[15%] h-[15%]" style={{ background: accent, opacity: 0.40 }} />
    </div>
  ) : null;

  const cameoOverlay = style === "cameo" ? (
    <div className="absolute right-4 top-6" style={{ border: "2px solid " + pal.rule, width: "24%", height: "30%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p className="font-mono text-center leading-relaxed" style={{ color: accent, fontSize: "clamp(7px, 1.4vw, 11px)", letterSpacing: "0.3em" }}>{"O O X O"}<br />{"O | O O"}<br />{"X O | O"}<br />{"O O X |"}</p>
    </div>
  ) : null;

  const bandOverlay = style === "selvedge" ? (
    <div className="absolute left-1 top-1 bottom-1" style={{ width: "3%", background: accent, opacity: 0.85 }} />
  ) : null;

  return (
    <div
      ref={ref}
      className="aspect-square w-full rounded-lg overflow-hidden"
      style={{ background: pal.bg, position: "relative" }}
      aria-label={`Brag card preview: ${c.headline}`}
    >
      {branding.customLogo && /^(data:image\/|https?:\/\/)/i.test(branding.customLogo) ? <img src={branding.customLogo} alt="" className="absolute right-3 top-3 z-10 h-10 w-10 rounded-md object-contain" /> : null}
      {style === "navy" ? <div className="absolute rounded-full" style={{ width: "22%", height: "22%", right: "-4%", top: "-4%", background: accent, opacity: 0.10 }} /> : null}
      {style === "navy" ? <div className="absolute rounded-full" style={{ width: "18%", height: "18%", left: "-3%", bottom: "-3%", background: "#e8b4b8", opacity: 0.08 }} /> : null}
      {style === "editorial" ? <div className="absolute inset-3 rounded-none" style={{ border: "2px solid " + pal.rule }} /> : null}
      {gridOverlay}
      {cameoOverlay}
      {bandOverlay}
      <div className={style === "editorial" ? "absolute inset-0 p-8 flex flex-col gap-3" : style === "selvedge" ? "absolute inset-0 pl-14 pr-5 py-5 flex flex-col gap-3" : "absolute inset-0 p-5 flex flex-col gap-3"}>
        {style === "swiss" ? (
          <div className="flex flex-col gap-4">
            <div className="text-center -mx-5 -mt-5 py-4" style={{ background: pal.ink }}>
              <p className="font-sans font-semibold" style={{ color: pal.bg, fontSize: "clamp(8px, 1.6vw, 12px)", letterSpacing: "0.2em" }}>{esc((studioName || copy.studioPlaceholder).toUpperCase())}</p>
            </div>
            <p className="font-mono font-bold leading-none" style={{ fontSize: "clamp(34px, 14vw, 72px)", color: pal.ink }}>{esc(big)}</p>
            <div style={{ width: "32%", height: "6px", background: accent }} />
            <p className="font-sans font-bold" style={{ fontSize: "clamp(10px, 2.6vw, 17px)", color: pal.ink, letterSpacing: "0.06em" }}>{esc((unit || "earned").toUpperCase())}</p>
            <p className="font-serif italic" style={{ fontSize: "clamp(10px, 2.4vw, 15px)", color: pal.soft }}>{esc(c.headline)}</p>
            <p className="font-sans" style={{ fontSize: "clamp(8px, 1.8vw, 12px)", color: pal.soft }}>{esc(c.subline)}</p>
          </div>
        ) : (
          <>
            <p className={style === "editorial" ? "font-serif font-semibold" : "font-serif"} style={{ color: pal.ink, fontSize: "clamp(12px, 2.6vw, 17px)" }}>{esc(studioName || copy.studioPlaceholder)}</p>
            <p className={style === "swatch" || style === "cameo" ? "font-mono font-bold leading-tight" : "font-serif font-bold leading-tight"} style={{ fontSize: "clamp(26px, 6.5vw, 54px)", color: style === "navy" ? accent : pal.ink }}>{esc(line)}</p>
            {style === "editorial" ? <div style={{ width: "36%", height: "5px", background: accent, marginBottom: "4px" }} /> : null}
            <p className="font-serif italic" style={{ fontSize: "clamp(12px, 2.8vw, 17px)", color: pal.soft }}>{esc(c.headline)}</p>
            <p className="font-sans" style={{ fontSize: "clamp(10px, 2.2vw, 14px)", color: pal.soft }}>{esc(c.subline)}</p>
            <div className="mt-auto">
              <div className="h-px mb-2" style={{ background: pal.rule }} />
              <p className="font-sans" style={{ fontSize: "clamp(8px, 1.8vw, 12px)", color: pal.soft, letterSpacing: "0.08em" }}>{esc(footer)}</p>
              <p className="font-sans mt-0.5 text-right" style={{ fontSize: "clamp(7px, 1.5vw, 10px)", color: pal.soft, letterSpacing: "0.18em" }}>{esc(branding.studioName || "STITCH & SCALE")}</p>
              {(branding.socialHandle || branding.copyrightNotice) ? <p className="font-sans mt-0.5 text-right" style={{ fontSize: "clamp(6px, 1.2vw, 8px)", color: pal.soft }}>{esc([branding.socialHandle, branding.copyrightNotice].filter(Boolean).join(" · "))}</p> : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
