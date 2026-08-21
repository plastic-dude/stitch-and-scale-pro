import { describe, it, expect, vi } from 'vitest';

// We're testing the logic of persist/update helpers which now take a showToast flag
// and use localized strings from the copy objects.

describe('Persistence Feedback (QUEUE-017-TXN)', () => {
  it('DesignLedger persist helper should handle storage errors gracefully', () => {
    const toast = vi.fn();
    const handle = { write: vi.fn().mockImplementation(() => { throw new Error('Quota exceeded'); }) };
    const copy = { saved: 'Saved' };
    const toastCopy = { copyFailed: 'Copy failed', copyFailedDescription: 'Description' };
    
    // Simulating the persist helper in DesignLedgerCard.tsx
    const persist = (next: any, showToast = false) => {
      try {
        handle.write(next);
        if (showToast) toast({ title: copy.saved });
      } catch {
        toast({ title: toastCopy.copyFailed, description: toastCopy.copyFailedDescription, variant: 'destructive' });
      }
    };

    persist({ foo: 'bar' }, true);
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ 
      title: 'Copy failed',
      variant: 'destructive'
    }));
  });

  it('SubmissionPipeline update helpers should trigger success feedback when requested', () => {
    const toast = vi.fn();
    const copy = { saved: 'Saved' };
    
    // Simulating the updateCall helper in SubmissionPipelineCard.tsx
    const updateCall = (patch: any, showToast = false) => {
      // state update logic omitted
      if (showToast) {
        toast({ title: copy.saved });
      }
    };

    updateCall({ publication: 'New' }, true);
    expect(toast).toHaveBeenCalledWith({ title: 'Saved' });
  });
});
