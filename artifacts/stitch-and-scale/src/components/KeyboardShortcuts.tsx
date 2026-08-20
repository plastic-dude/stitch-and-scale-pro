import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Command } from 'lucide-react';

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? to toggle shortcuts
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && e.target instanceof HTMLBodyElement) {
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcuts = [
    { key: '?', label: 'Show / Hide Keyboard Shortcuts' },
    { key: 'Cmd/Ctrl + S', label: 'Save Project (Auto-saves on change)' },
    { key: 'Cmd/Ctrl + K', label: 'Global Search' },
    { key: 'Cmd/Ctrl + N', label: 'New Project' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="w-5 h-5" /> Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">{shortcut.label}</span>
              <kbd className="pointer-events-none inline-flex h-6 items-center gap-1 rounded border bg-muted px-2.5 font-mono text-[11px] font-semibold text-muted-foreground">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
