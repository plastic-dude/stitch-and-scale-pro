import * as React from 'react';
import { ShieldCheck, Ruler, Info, Check, AlertCircle } from 'lucide-react';
import { type PatternProject, type EaseProfileReference, type SizingStandardMetadata, CYC_METADATA } from '@/lib/grading-engine';
import { EASE_PROFILES } from '@/lib/ease-profiles';
import { FIT_GOVERNANCE_COPY } from '@/lib/fit-governance-copy';
import { useSettings } from '@/context/SettingsContext';
import { cn } from '@/lib/utils';

interface FitGovernancePanelProps {
  project: PatternProject;
  onUpdate: (easeProfile?: EaseProfileReference, standardMetadata?: SizingStandardMetadata) => void;
}

export function FitGovernancePanel({ project, onUpdate }: FitGovernancePanelProps) {
  const { language } = useSettings();
  const copy = FIT_GOVERNANCE_COPY[language] || FIT_GOVERNANCE_COPY.en;
  
  const metadata = project.standardMetadata || (project.sizingStandard === 'CYC' ? CYC_METADATA : undefined);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">{copy.title}</h2>
      </div>

      {/* Sizing Standard Section */}
      <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">{copy.standardTitle}</h3>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
            {project.sizingStandard || 'CYC'}
          </span>
        </div>

        {metadata && (
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">{copy.sourceLabel}</span>
              <span className="font-medium">{metadata.source}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">{copy.versionLabel}</span>
              <span className="font-medium">{metadata.version}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">{copy.verifiedLabel}</span>
              <span className="font-medium">{metadata.lastVerified}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">{copy.inclusiveLabel}</span>
              <span className={cn("font-medium", metadata.isInclusive ? "text-emerald-600" : "text-amber-600")}>
                {metadata.isInclusive ? copy.inclusiveYes : copy.inclusiveNo}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ease Profile Section */}
      <div className="bg-card rounded-xl border border-border/60 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{copy.easeTitle}</h3>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {EASE_PROFILES.map((profile) => (
            <button
              key={profile.id}
              onClick={() => onUpdate({ id: profile.id, category: profile.category }, metadata)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg border text-xs transition-all flex items-center justify-between",
                project.easeProfile?.id === profile.id
                  ? "border-primary bg-primary/5 font-semibold"
                  : "border-border/40 hover:border-primary/30 hover:bg-secondary/10"
              )}
            >
              <span>{copy[profile.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof typeof copy] || profile.name}</span>
              {project.easeProfile?.id === profile.id && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostics Section */}
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <h3 className="font-medium text-sm text-amber-900 dark:text-amber-200">{copy.diagnosticTitle}</h3>
        </div>
        <p className="text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed">
          {copy.diagnosticDescription}
        </p>
      </div>
    </div>
  );
}
