import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, FileText, Type } from 'lucide-react';
import { PatternProject, ALL_SIZES, GRADING_KEY_LABELS } from '@/lib/grading-engine';
import { renderDraft } from '@/lib/pattern-draft-renderer';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { estimateYarn } from '@/lib/yarn-estimator';

/**
 * Pattern Draft — write your pattern text once, let the grading engine
 * fill in every number.
 *
 * The designer composes pattern text in plain prose with typed
 * placeholders ({Gauge.stitches}, {Size.XS.bust}, {Yardage}, …) and the
 * rendered version resolves every placeholder against the live graded
 * tables. Charting tools like Stitchmastery draw the chart and leave the
 * writing to you; this is the layer that actually writes the pattern —
 * and because the numbers are computed from the grading tables, the text
 * can never fall out of sync with the size chart.
 */
const PLACEHOLDER_GROUPS: { label: string; items: { token: string; hint: string }[] }[] = [
  {
    label: 'Basics',
    items: [
      { token: '{Name}', hint: 'Pattern name' },
      { token: '{Author}', hint: 'Designer name' },
      { token: '{Gauge.stitches}', hint: 'Stitches per 4"' },
      { token: '{Gauge.rows}', hint: 'Rows per 4"' },
      { token: '{Yardage}', hint: 'Estimated yards (base size)' },
    ],
  },
  {
    label: 'Single size (e.g. XS)',
    items: [
      ...ALL_SIZES.slice(0, 3).map(s => ({
        token: `{Size.${s}.bust.stitch}`,
        hint: `${s} bust stitch count`,
      })),
    ],
  },
  {
    label: 'All sizes',
    items: [
      { token: '{Size.bust}', hint: 'Bust in every size' },
      { token: '{Size.backLength}', hint: 'Back length in every size' },
    ],
  },
];

const SAMPLE_DRAFT = `# {Name}
by {Author}

A seamless crewneck worked top-down.

**Gauge:** {Gauge.stitches} sts x {Gauge.rows} rows = 4in in stockinette.

**Sizes:** {Size.bust}

**Yarn:** approx {Yardage} yards (base size).`;

export function PatternDraftCard({ project }: { project: PatternProject }) {
  const { customStandard } = useSettings();
  const { toast } = useToast();
  const [draft, setDraft] = React.useState(
    () => (project as any).__draft || '',
  );
  const [preview, setPreview] = React.useState(true);
  const rendered = renderDraft(draft, project, customStandard);

  const insert = (token: string) => {
    setDraft((d: string) => (d ? `${d} ${token}` : token));
  };

  const handleSave = () => {
    (project as any).__draft = draft;
    toast({ title: 'Draft saved locally', description: 'It reopens with your project.' });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rendered);
      toast({ title: 'Pattern text copied', description: 'Paste it into Ravelry, Etsy, or your tech editor.' });
    } catch {
      toast({ title: 'Copy blocked', description: 'Your browser blocked clipboard access.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent" />
          Pattern Draft
        </CardTitle>
        <CardDescription>
          Write your pattern in plain text. Placeholders like {`{Size.bust}`} and {`{Gauge.stitches}`}
          resolve live against your grading tables — change a measurement and the pattern updates with it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDER_GROUPS.map(group => (
            <div key={group.label} className="flex flex-wrap gap-1.5">
              {group.items.map(item => (
                <button
                  key={item.token}
                  type="button"
                  onClick={() => insert(item.token)}
                  title={item.hint}
                  className="px-2 py-1 rounded-full text-[11px] font-mono border border-border/70 bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  data-testid={`insert-${item.token.replace(/[{}.]/g, '')}`}
                >
                  {item.token}
                </button>
              ))}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[11px]"
            onClick={() => setDraft(SAMPLE_DRAFT)}
            data-testid="button-load-sample-draft"
          >
            <Type className="w-3.5 h-3.5 mr-1" /> Load sample draft
          </Button>
        </div>

        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Start typing your pattern text… e.g. Work {Size.XS.bust.stitch} sts across."
          className="min-h-[160px] resize-y font-mono text-sm"
          data-testid="textarea-pattern-draft"
        />

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreview(p => !p)} data-testid="button-toggle-preview">
              {preview ? 'Hide preview' : 'Show preview'}
            </Button>
            <Button size="sm" onClick={handleSave} data-testid="button-save-draft">
              Save Draft
            </Button>
            <Button variant="default" size="sm" className="bg-primary hover:bg-primary/90" onClick={handleCopy} data-testid="button-copy-pattern">
              <Copy className="w-4 h-4 mr-2" /> Copy Pattern
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Numbers are computed from your live grading tables — never typed twice, never out of sync.
          </p>
        </div>

        {preview && draft && (
          <div className="border border-border rounded-lg bg-muted/30 p-5 prose prose-sm max-w-none" data-testid="pattern-preview">
            {rendered.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return <h1 key={i} className="text-2xl font-serif font-bold mb-3">{line.slice(2)}</h1>;
              }
              if (line === '') return <br key={i} />;
              // Inline bold: **text**
              const parts = line.split(/(\*\*[^*]+\*\*)/g);
              return (
                <p key={i} className="mb-2 leading-relaxed">
                  {parts.map((part, j) =>
                    /^\*\*.+\*\*$/.test(part) ? (
                      <strong key={j}>{part.slice(2, -2)}</strong>
                    ) : (
                      <React.Fragment key={j}>{part}</React.Fragment>
                    ),
                  )}
                </p>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
