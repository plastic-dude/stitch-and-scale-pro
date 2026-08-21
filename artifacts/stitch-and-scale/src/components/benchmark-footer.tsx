import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BenchmarkFooterProps {
  /** The primary benchmark claim text. */
  text: string;
  /** Localized label for the source/methodology, e.g. "Source: CYC Research". */
  sourceLabel?: string;
  /** Longer methodology explanation shown in the tooltip. */
  methodology?: string;
  className?: string;
}

export function BenchmarkFooter({ text, sourceLabel, methodology, className }: BenchmarkFooterProps) {
  return (
    <div className={`mt-4 pt-4 border-t border-border/40 ${className}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground/70 mr-1">Benchmarks baked in:</span>
            {text}
          </p>
          {sourceLabel && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
                {sourceLabel}
              </span>
              {methodology && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-primary transition-colors">
                        <Info className="h-3 w-3" />
                        <span className="sr-only">View methodology</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                      {methodology}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
