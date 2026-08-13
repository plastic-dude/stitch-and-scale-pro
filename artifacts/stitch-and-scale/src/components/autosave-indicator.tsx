import { motion, AnimatePresence } from 'framer-motion';
import { Check, CloudOff, Loader2 } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutosaveIndicatorProps {
  status: SaveStatus;
}

export function AutosaveIndicator({ status }: AutosaveIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {status !== 'idle' && (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 text-xs text-muted-foreground select-none"
          aria-live="polite"
          aria-label={
            status === 'saving' ? 'Saving…' :
            status === 'saved'  ? 'Saved locally' :
            'Save error'
          }
        >
          {status === 'saving' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving…</span>
            </>
          )}
          {status === 'saved' && (
            <>
              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-400 font-medium">Saved</span>
            </>
          )}
          {status === 'error' && (
            <>
              <CloudOff className="w-3 h-3 text-destructive" />
              <span className="text-destructive">Save failed</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
