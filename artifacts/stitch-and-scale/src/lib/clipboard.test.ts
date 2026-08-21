import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from './clipboard';

function stubTextareaDocument(execResult: boolean) {
  const remove = vi.fn();
  const area = {
    value: '',
    style: {} as Record<string, string>,
    setAttribute: vi.fn(),
    focus: vi.fn(),
    select: vi.fn(),
    setSelectionRange: vi.fn(),
    remove,
  };
  const execCommand = vi.fn().mockReturnValue(execResult);
  const documentStub = {
    body: { appendChild: vi.fn() },
    createElement: vi.fn().mockReturnValue(area),
    execCommand,
  };
  vi.stubGlobal('document', documentStub);
  return { area, execCommand };
}

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses the modern Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyToClipboard('hello')).resolves.toEqual({ ok: true, method: 'clipboard' });
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to a temporary textarea when the Clipboard API rejects', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    const { area, execCommand } = stubTextareaDocument(true);

    await expect(copyToClipboard('manual fallback')).resolves.toEqual({ ok: true, method: 'textarea' });
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(area.value).toBe('manual fallback');
    expect(area.remove).toHaveBeenCalledOnce();
  });

  it('reports failure when neither clipboard route is available', async () => {
    vi.stubGlobal('navigator', {});
    const { area, execCommand } = stubTextareaDocument(false);

    await expect(copyToClipboard('cannot copy')).resolves.toEqual({ ok: false, method: 'none' });
    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(area.remove).toHaveBeenCalledOnce();
  });

  it('reports failure when the document is unavailable', async () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('document', undefined);

    await expect(copyToClipboard('no document')).resolves.toEqual({ ok: false, method: 'none' });
  });

  it('does not attempt browser APIs for empty text', async () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await expect(copyToClipboard('')).resolves.toEqual({ ok: false, method: 'none' });
    expect(writeText).not.toHaveBeenCalled();
  });
});
