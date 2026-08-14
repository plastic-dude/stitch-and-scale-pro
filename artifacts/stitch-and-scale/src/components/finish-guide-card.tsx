/**
 * Pattern Finish & Care Guide — the last page of every good pattern,
 * generated from the project's own yarn data.
 *
 * Session-12 research, turned into interface:
 * - YarnSub (substitution search) is knitter-facing; grading and
 *   charting tools stop at the size chart. No competitor writes the
 *   substitution / blocking / wash / dry / store block inside the
 *   pattern document — designers hand-write it as fiber-wrong
 *   boilerplate, or skip it entirely.
 * - Care logic is fibre law: wool felts under heat + agitation;
 *   superwash tolerates a gentle machine cycle; acrylic melts under
 *   high heat; cotton shrinks in hot drying; blends follow the most
 *   delicate fibre. Blocking methods split by fibre (wet / steam /
 *   spritz). Sources cited in competitors-session-12 research file.
 * - Designer choices (blend, put-up, fabric notes) persist in
 *   localStorage under a project-scoped key until cloud storage arrives.
 */
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Sparkles } from 'lucide-react';
import { PatternProject } from '@/lib/grading-engine';
import {
  FIBRE_LABELS,
  Fibre,
  generateFinishGuide,
} from '@/lib/pattern-finish-guide';

const FIBRE_ORDER: Fibre[] = [
  'wool',
  'superwash-wool',
  'alpaca',
  'cashmere',
  'mohair',
  'silk',
  'cotton',
  'linen',
  'acrylic',
  'nylon',
  'other',
];

interface FinishGuideSettings {
  fibres: Fibre[];
  metresPer100g?: number;
  fabricNotes?: string;
}

const STORAGE_KEY = 'stitch-and-scale-finishguide';

function loadSettings(projectId: string): FinishGuideSettings {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${projectId}`);
    if (!raw) return { fibres: ['wool'] };
    const parsed = JSON.parse(raw) as Partial<FinishGuideSettings>;
    return {
      fibres: parsed.fibres?.length ? (parsed.fibres as Fibre[]) : ['wool'],
      metresPer100g: typeof parsed.metresPer100g === 'number' ? parsed.metresPer100g : undefined,
      fabricNotes: typeof parsed.fabricNotes === 'string' ? parsed.fabricNotes : undefined,
    };
  } catch {
    return { fibres: ['wool'] };
  }
}

function saveSettings(projectId: string, settings: FinishGuideSettings) {
  try {
    localStorage.setItem(`${STORAGE_KEY}:${projectId}`, JSON.stringify(settings));
  } catch {
    /* storage unavailable — the guide still generates fine from defaults */
  }
}

export function FinishGuideCard({ project }: { project: PatternProject }) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<FinishGuideSettings>(() => loadSettings(project.id));
  const [copied, setCopied] = useState(false);

  const toggleFibre = (f: Fibre) => {
    const next = settings.fibres.includes(f)
      ? (settings.fibres.filter(x => x !== f) as Fibre[])
      : ([...settings.fibres, f] as Fibre[]);
    const updated = { ...settings, fibres: next.length ? next : (['wool'] as Fibre[]) };
    setSettings(updated);
    saveSettings(project.id, updated);
  };

  const setPutUp = (value: string) => {
    const num = value.trim() ? Number(value) : undefined;
    const updated = { ...settings, metresPer100g: num };
    setSettings(updated);
    saveSettings(project.id, updated);
  };

  const setNotes = (value: string) => {
    const updated = { ...settings, fabricNotes: value };
    setSettings(updated);
    saveSettings(project.id, updated);
  };

  const guide = generateFinishGuide(project, settings);
  const b = guide.behavior;

  const copySection = async () => {
    await navigator.clipboard.writeText(guide.patternSection);
    setCopied(true);
    toast({ title: 'Copied to clipboard', description: 'Paste it straight into your pattern doc.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Finish &amp; Care Guide
        </CardTitle>
        <CardDescription>
          The last page of every good pattern — fibre-correct substitution, blocking,
          wash, dry and store notes, generated from your yarn weight and declared blend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fibre blend */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Your fibre blend</Label>
          <p className="text-xs text-muted-foreground">
            Tick every fibre in your yarn. A blend follows its most delicate fibre —
            wool + acrylic is treated as wool.
          </p>
          <div className="flex flex-wrap gap-2">
            {FIBRE_ORDER.map(f => (
              <Button
                key={f}
                type="button"
                variant={settings.fibres.includes(f) ? 'default' : 'outline'}
                size="sm"
                className="text-xs"
                onClick={() => toggleFibre(f)}>
                {FIBRE_LABELS[f]}
              </Button>
            ))}
          </div>
        </div>

        {/* Put-up + notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fg-putup" className="text-sm font-medium">
              Metres per 100 g (optional)
            </Label>
            <p className="text-xs text-muted-foreground">
              Your yarn's put-up pins the substitution line to the actual skein;
              leave blank for the weight-class band.
            </p>
            <Input
              id="fg-putup"
              type="number"
              min={0}
              placeholder={`e.g. ${guide.substitute.metresPer100g[0]}`}
              value={settings.metresPer100g ?? ''}
              onChange={e => setPutUp(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fg-notes" className="text-sm font-medium">
              Fabric notes (optional)
            </Label>
            <p className="text-xs text-muted-foreground">
              Anything specific to this design, e.g. "ribbing blocked with steam only".
            </p>
            <Input
              id="fg-notes"
              placeholder="e.g. steam ribbing separately"
              value={settings.fabricNotes ?? ''}
              onChange={e => setNotes(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {/* Behaviour summary */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{b.wash.replace('-', ' ')}</Badge>
          <Badge variant="secondary">
            {b.dry.replace('-', ' ')}
          </Badge>
          <Badge variant="secondary">{b.block} block</Badge>
          <Badge variant="outline">{b.drape} drape</Badge>
          <Badge variant="outline">{b.elasticity}</Badge>
          <Badge variant="outline">{b.warmth.replace('-', ' ')}</Badge>
          {b.mothRisk && <Badge variant="outline">moth-prone fibre</Badge>}
        </div>

        {/* The pattern section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Copy-ready pattern section</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copySection}
              className="h-8">
              {copied ? <Check className="w-4 h-4 mr-1 text-green-600" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-xs bg-muted/60 border border-border rounded-md p-4 font-sans leading-relaxed max-h-96 overflow-y-auto">
            {guide.patternSection}
          </pre>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {b.reasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
