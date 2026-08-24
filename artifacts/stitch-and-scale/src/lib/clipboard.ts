export type ClipboardCopyMethod = 'clipboard' | 'textarea' | 'none';

export interface ClipboardCopyResult {
  ok: boolean;
  method: ClipboardCopyMethod;
}

const CLIPBOARD_WRITE_TIMEOUT_MS = 1500;

async function writeClipboardWithTimeout(text: string): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    throw new Error('Clipboard API unavailable');
  }

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Clipboard write timed out'));
    }, CLIPBOARD_WRITE_TIMEOUT_MS);

    navigator.clipboard.writeText(text).then(
      () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        resolve();
      },
      (error: unknown) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

/**
 * Copy text without assuming a secure context or a working Clipboard API.
 *
 * The textarea route is intentionally kept as a compatibility fallback for
 * installed PWAs, embedded previews, and restricted/headless browsers where
 * navigator.clipboard is absent, rejects, or does not settle promptly. Callers
 * must inspect `ok` before claiming the text was copied.
 */
export async function copyToClipboard(text: string): Promise<ClipboardCopyResult> {
  if (!text) return { ok: false, method: 'none' };

  try {
    if (typeof navigator !== 'undefined') {
      await writeClipboardWithTimeout(text);
      return { ok: true, method: 'clipboard' };
    }
  } catch {
    // Continue to the DOM fallback. Clipboard permissions are commonly
    // rejected even when the API exists.
  }

  if (typeof document === 'undefined' || !document.body) {
    return { ok: false, method: 'none' };
  }

  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.style.position = 'fixed';
  area.style.top = '0';
  area.style.left = '-9999px';
  area.style.width = '1px';
  area.style.height = '1px';
  area.style.opacity = '0';
  document.body.appendChild(area);

  try {
    area.focus();
    area.select();
    area.setSelectionRange(0, area.value.length);
    const ok = typeof document.execCommand === 'function' && document.execCommand('copy');
    return { ok: Boolean(ok), method: ok ? 'textarea' : 'none' };
  } catch {
    return { ok: false, method: 'none' };
  } finally {
    area.remove();
  }
}

/**
 * Compatibility adapter for existing async action handlers. It resolves only
 * after either copy route succeeds and rejects when callers must expose their
 * manual-copy fallback.
 */
export async function copyTextOrThrow(text: string): Promise<void> {
  const result = await copyToClipboard(text);
  if (!result.ok) throw new Error('Clipboard copy failed');
}
