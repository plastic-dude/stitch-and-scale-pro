// @vitest-environment happy-dom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { useProjectStorage, useProjectStorageState } from './storage-lib';

type FixtureState = { marker: string };

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function StorageProbe({ projectId }: { projectId: string }) {
  const handle = useProjectStorage<FixtureState>('hook-test', projectId);
  const [state] = useProjectStorageState(handle, (raw) => raw ?? { marker: 'empty' });
  return <output data-testid="marker">{state.marker}</output>;
}

function renderProbe(root: Root, projectId: string) {
  act(() => {
    root.render(<StorageProbe projectId={projectId} />);
  });
}

describe('useProjectStorageState project-key hydration', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(() => {
    act(() => root?.unmount());
    root = null;
    container?.remove();
    container = null;
    localStorage.clear();
  });

  it('hydrates a switched project before writing and preserves its scoped state', () => {
    localStorage.setItem('stitch-and-scale-hook-test-alpha', JSON.stringify({ marker: 'alpha' }));
    localStorage.setItem('stitch-and-scale-hook-test-beta', JSON.stringify({ marker: 'beta' }));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    renderProbe(root, 'alpha');
    expect(container.querySelector('[data-testid="marker"]')?.textContent).toBe('alpha');

    renderProbe(root, 'beta');

    expect(container.querySelector('[data-testid="marker"]')?.textContent).toBe('beta');
    expect(JSON.parse(localStorage.getItem('stitch-and-scale-hook-test-beta') ?? '{}')).toEqual({ marker: 'beta' });
  });
});

