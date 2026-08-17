// CHK-080 — Gauge & Fit Translator card.
// Weakness-conversion feature: stitchscale.app proved knitters love a
// gauge-to-fit matcher, but theirs is a dead-end single page with no project,
// no persistence, and no grading integration. This version ties a test
// knitter's swatch tension to the designer's OWN graded sizing table: every
// written size is translated at the tester's gauge, and the lab recommends
// which size each tester should knit. Designer-side only — rivals can't
// copy this without a grading system underneath.
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  HelpCircle,
  Lightbulb,
  Minus,
  Plus,
  Ruler,
  Trash2,
} from "lucide-react";
import {
  DEFAULT_FIT_INPUT,
  FIT_KEYS_LABEL,
  analyzeFit,
  type FitInput,
  type FitResult,
  type TesterGauge,
} from "@/lib/gauge-fit-translator";
import type { PatternProject, GradingKey } from "@/lib/grading-engine";
import { projectStorage } from "@/lib/storage-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/context/SettingsContext";
import { GAUGE_FIT_COPY, getGaugeFlagTitle, getGaugeFlagNote, getGaugeKeyLabel, getGaugeVerdict, getGaugeVerdictNote } from "@/lib/gauge-fit-copy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STORAGE_KEY = "stitch-and-scale-gaugefit-v1";

interface StoredState {
  input: FitInput;
  ts: number;
}

const DEFAULT_TESTER = (): TesterGauge => ({
  label: "",
  stitchesPer4In: 20,
  rowsPer4In: 28,
});

function loadStored(project: PatternProject): FitInput {
  try {
    const handle = projectStorage<StoredState>("gaugefit", project.id, [STORAGE_KEY]);
    const stored = handle.read();
    if (stored && stored.input) {
      const n = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : undefined);
      const testers = Array.isArray(stored.input.testers) && stored.input.testers.length > 0
        ? stored.input.testers
            .filter((t) => t && typeof t.stitchesPer4In === "number")
            .map((t) => ({
              label: typeof t.label === "string" ? t.label : "Tester",
              stitchesPer4In: n(t.stitchesPer4In) ?? 20,
              rowsPer4In: n(t.rowsPer4In) ?? 28,
            }))
        : DEFAULT_FIT_INPUT.testers;
      return {
        ...DEFAULT_FIT_INPUT,
        ...stored.input,
        patternStitchesPer4In: n(stored.input.patternStitchesPer4In) ?? DEFAULT_FIT_INPUT.patternStitchesPer4In,
        patternRowsPer4In: n(stored.input.patternRowsPer4In) ?? DEFAULT_FIT_INPUT.patternRowsPer4In,
        testers,
        translateKeys: Array.isArray(stored.input.translateKeys)
          ? stored.input.translateKeys
          : DEFAULT_FIT_INPUT.translateKeys,
        grading: stored.input.grading || {},
        sizeOrder: Array.isArray(stored.input.sizeOrder)
          ? stored.input.sizeOrder
          : [],
        targetCircumference: n(stored.input.targetCircumference),
      } as FitInput;
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_FIT_INPUT };
}

function NumField(props: {
  label: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  suffix?: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  const { label, value, step, min = 0, max, suffix, hint, onChange } = props;
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          value={Math.round(value * 100) / 100}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (isFinite(v)) onChange(Math.max(min, Math.round(v * 100) / 100));
          }}
          className="h-8 bg-background"
        />
        {suffix && <span className="text-xs text-muted-foreground whitespace-nowrap">{suffix}</span>}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function pct(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return (rounded >= 0 ? "+" : "") + rounded.toFixed(rounded % 1 === 0 ? 0 : 1) + "%";
}

export function GaugeFitTranslatorCard({ project }: { project: PatternProject }) {
  const { language } = useSettings();
  const copy = GAUGE_FIT_COPY[language];
  const [input, setInput] = useState<FitInput>(() => loadStored(project));

  const persist = (next: FitInput) => {
    setInput(next);
    try {
      const handle = projectStorage<StoredState>("gaugefit", project.id, [STORAGE_KEY]);
      handle.write({ input: next, ts: Date.now() });
    } catch {
      // storage best-effort
    }
  };

  const set = <K extends keyof FitInput>(key: K, value: FitInput[K]) =>
    persist({ ...input, [key]: value });

  const result: FitResult = useMemo(() => analyzeFit(input), [input]);

  const sizeKeys = useMemo(() => {
    const keys = Object.keys(input.grading);
    return keys.length > 0 ? keys : ["XS", "S", "M", "L", "XL"];
  }, [input.grading]);

  const circumferenceKeys: GradingKey[] = useMemo(
    () => (["bust", "chest", "waist", "hip", "upperArm", "thigh"] as GradingKey[]).filter(
      (k) => Object.values(input.grading).some((row) => row[k] != null) || !Object.keys(input.grading).length,
    ),
    [input.grading],
  );

  const primaryKey =
    input.translateKeys.length > 0
      ? input.translateKeys[0]
      : (Object.keys(input.grading).length > 0
          ? (Object.keys(input.grading)[Object.keys(input.grading).length - 1])
          : "bust");

  const gradingEmpty = Object.keys(input.grading).length === 0;

  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start gap-2.5">
          <Ruler className="h-4 w-4 mt-0.5 text-primary shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">{copy.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {copy.description}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumField
            label={copy.patternStitches}
            value={input.patternStitchesPer4In}
            step={0.25}
            min={0}
            hint={copy.patternStitchesHint}
            onChange={(v) => set("patternStitchesPer4In", v)}
          />
          <NumField
            label={copy.patternRows}
            value={input.patternRowsPer4In}
            step={0.25}
            min={0}
            hint={copy.patternRowsHint}
            onChange={(v) => set("patternRowsPer4In", v)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">{copy.testers}</Label>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() =>
                set("testers", [
                  ...input.testers,
                  { ...DEFAULT_TESTER(), label: `Tester ${input.testers.length + 1}` },
                ])
              }
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> {copy.addTester}
            </Button>
          </div>
          <div className="space-y-2.5">
            {input.testers.map((tester, idx) => (
              <div key={idx} className="rounded-md border bg-muted/30 p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={`${copy.tester} ${idx + 1}`}
                    value={tester.label}
                    onChange={(e) => {
                      const next = [...input.testers];
                      next[idx] = { ...tester, label: e.target.value };
                      set("testers", next);
                    }}
                    className="h-7 bg-background flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    disabled={input.testers.length <= 1}
                    onClick={() =>
                      set("testers", input.testers.filter((_, i) => i !== idx))
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <NumField
                    label={copy.stitches}
                    value={tester.stitchesPer4In}
                    step={0.25}
                    min={0}
                    onChange={(v) => {
                      const next = [...input.testers];
                      next[idx] = { ...tester, stitchesPer4In: v };
                      set("testers", next);
                    }}
                  />
                  <NumField
                    label={copy.rows}
                    value={tester.rowsPer4In}
                    step={0.25}
                    min={0}
                    onChange={(v) => {
                      const next = [...input.testers];
                      next[idx] = { ...tester, rowsPer4In: v };
                      set("testers", next);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{copy.primary}</Label>
            <Select
              value={primaryKey}
              onValueChange={(v) => set("translateKeys", [v as GradingKey])}
            >
              <SelectTrigger className="h-8 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {circumferenceKeys.map((k) => (
                  <SelectItem key={k} value={k}>
                    {getGaugeKeyLabel(language, k, FIT_KEYS_LABEL[k] ?? k)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {copy.ratioHint}
            </p>
          </div>
          <NumField
            label={copy.target}
            value={input.targetCircumference ?? 0}
            step={0.5}
            min={0}
            hint={copy.targetHint}
            onChange={(v) =>
              set("targetCircumference", v > 0 ? v : undefined)
            }
          />
        </div>

        {gradingEmpty && (
          <div className="flex items-start gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
            <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {copy.empty.replace('Grading Lab', '')} <strong>{copy.gradingLab}</strong> — the translation math works the same either way.
            </span>
          </div>
        )}

        <Separator />

        {result.testers.map((t, idx) => (
          <div key={idx} className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <h4 className="font-medium text-sm">
                {t.label || `Tester ${idx + 1}`}
                <span className="text-xs text-muted-foreground ml-2 font-normal">
                  {copy.ratio} {t.stitchRatio.toFixed(3)} · {copy.ratio} {t.rowRatio.toFixed(3)}
                </span>
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium px-2.5 py-0.5">
                  <BadgeCheck className="h-3 w-3" />
                  {copy.recommended}: {t.recommendedSize}
              </span>
            </div>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 text-left">
                    <th className="px-2.5 py-1.5 font-medium">{copy.size}</th>
                    <th className="px-2.5 py-1.5 font-medium">{copy.nominal}</th>
                    <th className="px-2.5 py-1.5 font-medium">{copy.atGauge}</th>
                    <th className="px-2.5 py-1.5 font-medium">{copy.shift}</th>
                    {t.fits.some((f) => f.targetDelta != null) && (
                      <th className="px-2.5 py-1.5 font-medium">{copy.vsTarget}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {t.fits.map((f) => (
                    <tr key={f.size} className="border-t">
                      <td className="px-2.5 py-1.5 font-medium">{f.size}</td>
                      <td className="px-2.5 py-1.5">{f.nominal.toFixed(1)}</td>
                      <td className="px-2.5 py-1.5">{f.translated.toFixed(1)}</td>
                      <td
                        className={`px-2.5 py-1.5 ${
                          Math.abs(f.deltaPct) >= 5 ? "text-amber-600 font-medium" : ""
                        }`}
                      >
                        {pct(f.deltaPct)}
                      </td>
                      {f.targetDelta != null && (
                        <td
                          className={`px-2.5 py-1.5 ${
                            Math.abs(f.targetDelta) >= 1 ? "text-amber-600 font-medium" : ""
                          }`}
                        >
                          {f.targetDelta >= 0 ? "+" : ""}
                          {f.targetDelta.toFixed(1)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {t.flags.length > 0 && (
              <div className="space-y-1.5">
                {t.flags.map((f, fi) => (
                  <div
                    key={fi}
                    className="flex items-start gap-2 rounded-md border bg-muted/20 p-2.5 text-xs"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-medium">{getGaugeFlagTitle(language, f.code, f.title)}</span>
                      <span className="text-muted-foreground"> — {getGaugeFlagNote(language, f.code, f.note, t.label, t.stitchRatio, t.rowRatio)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <Separator />

        <div
          className={`rounded-md border p-3 text-xs ${
            result.hasMaterialMismatch ? "border-amber-300 bg-amber-50" : "border-green-200 bg-green-50"
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <Lightbulb className="h-3.5 w-3.5" />
            {copy.verdict}: {getGaugeVerdict(language, result.verdict)}
          </div>
          <p className="mt-1 text-muted-foreground">{copy.verdictNote} {getGaugeVerdictNote(language, result.verdict, result.testers.length, result.testers.filter((t) => Math.abs(t.stitchRatio - 1) >= 0.05).length)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
