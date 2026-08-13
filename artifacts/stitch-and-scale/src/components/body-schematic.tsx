import * as React from 'react';
import type { GradingKey } from '@/lib/grading-engine';

interface PointDef {
  key: GradingKey;
  /** Anchor point on the body outline (viewBox units) */
  x: number;
  y: number;
  /** Label position — offset from the anchor, label sits to left or right */
  labelX: number;
  labelY: number;
  side: 'left' | 'right';
}

// Positions tuned to a simple front-view technical flat, viewBox 0 0 300 460.
// This is a reference diagram (matches how CYC's own charts present body
// points), not a per-garment construction schematic — it answers "where on
// a body does this measurement come from," not "how is this piece shaped."
const POINTS: PointDef[] = [
  { key: 'neckCircumference', x: 150, y: 44, labelX: 210, labelY: 40, side: 'right' },
  { key: 'shoulder', x: 116, y: 62, labelX: 40, labelY: 58, side: 'left' },
  { key: 'bust', x: 150, y: 118, labelX: 220, labelY: 118, side: 'right' },
  { key: 'armholeDepth', x: 108, y: 100, labelX: 30, labelY: 100, side: 'left' },
  { key: 'upperArm', x: 78, y: 130, labelX: 20, labelY: 140, side: 'left' },
  { key: 'waist', x: 150, y: 196, labelX: 220, labelY: 196, side: 'right' },
  { key: 'lowerArm', x: 62, y: 200, labelX: 15, labelY: 210, side: 'left' },
  { key: 'hip', x: 150, y: 244, labelX: 220, labelY: 244, side: 'right' },
  { key: 'wrist', x: 54, y: 258, labelX: 15, labelY: 268, side: 'left' },
  { key: 'thigh', x: 130, y: 300, labelX: 220, labelY: 300, side: 'right' },
  { key: 'calf', x: 128, y: 368, labelX: 220, labelY: 368, side: 'right' },
  { key: 'ankle', x: 126, y: 420, labelX: 220, labelY: 420, side: 'right' },
  { key: 'backLength', x: 150, y: 150, labelX: 30, labelY: 320, side: 'left' },
  { key: 'sleeveLength', x: 60, y: 165, labelX: 30, labelY: 380, side: 'left' },
];

const LABELS: Record<GradingKey, string> = {
  bust: 'Bust', waist: 'Waist', hip: 'Hip', upperArm: 'Upper Arm', lowerArm: 'Lower Arm',
  wrist: 'Wrist', shoulder: 'Shoulder', neckCircumference: 'Neck', backLength: 'Back Length',
  sleeveLength: 'Sleeve Length', thigh: 'Thigh', calf: 'Calf', ankle: 'Ankle', armholeDepth: 'Armhole Depth',
};

export function BodySchematic({ usedKeys }: { usedKeys: GradingKey[] }) {
  const activeSet = new Set(usedKeys);
  const activePoints = POINTS.filter(p => activeSet.has(p.key));

  if (activePoints.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Measurement Reference</p>
      <p className="text-sm text-muted-foreground mb-4">Where each measurement below is taken from, at a glance.</p>
      <div className="w-full overflow-x-auto" style={{ contain: 'layout inline-size' }}>
        <svg
          viewBox="-50 0 400 460"
          className="mx-auto block h-auto"
          style={{ width: 'min(100%, 380px)' }}
          role="img"
          aria-label="Body measurement reference diagram"
        >
          {/* Silhouette — simple technical flat, not anatomical illustration */}
          <g fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/50">
            <circle cx="150" cy="30" r="18" />
            <path d="M116,60 Q150,50 184,60 L200,140 Q150,160 100,140 Z" />
            <path d="M100,90 L60,90 L48,270" />
            <path d="M200,90 L240,90 L252,270" />
            <path d="M116,155 L112,300 L118,440" />
            <path d="M184,155 L188,300 L182,440" />
          </g>
          {/* Guide lines at bust/waist/hip, the standard pattern-drafting convention */}
          {activeSet.has('bust') && <line x1="90" y1="118" x2="210" y2="118" stroke="currentColor" strokeDasharray="3 3" className="text-accent/50" strokeWidth="1" />}
          {activeSet.has('waist') && <line x1="90" y1="196" x2="210" y2="196" stroke="currentColor" strokeDasharray="3 3" className="text-accent/50" strokeWidth="1" />}
          {activeSet.has('hip') && <line x1="90" y1="244" x2="210" y2="244" stroke="currentColor" strokeDasharray="3 3" className="text-accent/50" strokeWidth="1" />}

          {activePoints.map((p) => (
            <g key={p.key}>
              <circle cx={p.x} cy={p.y} r="4" className="fill-accent" />
              <line
                x1={p.x} y1={p.y}
                x2={p.side === 'left' ? p.labelX + 4 : p.labelX - 4}
                y2={p.labelY}
                stroke="currentColor"
                strokeWidth="1"
                className="text-accent/40"
              />
              <text
                x={p.labelX}
                y={p.labelY}
                textAnchor={p.side === 'left' ? 'end' : 'start'}
                dominantBaseline="middle"
                className="fill-foreground"
                style={{ fontSize: '11px', fontWeight: 500 }}
              >
                {LABELS[p.key]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
