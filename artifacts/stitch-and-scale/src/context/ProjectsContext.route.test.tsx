/** @vitest-environment happy-dom */
import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/storage-lib', () => ({
  writeProjects: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./SettingsContext', () => ({
  useSettings: () => ({ language: 'en' }),
}));

import { DEMO_PROJECT_ID, ProjectsProvider, useProject } from './ProjectsContext';

function ProjectProbe({ id, onProject }: { id?: string; onProject: (projectId?: string) => void }) {
  const projectHook = useProject(id);
  onProject(projectHook?.project.id);
  return <output data-project-id={projectHook?.project.id ?? ''}>{projectHook?.project.name ?? 'missing'}</output>;
}

function ChangingProjectProbe({ onProject }: { onProject: (projectId?: string) => void }) {
  const [id, setId] = useState<string>();
  return (
    <>
      <button type="button" onClick={() => setId(DEMO_PROJECT_ID)}>open demo</button>
      <ProjectProbe id={id} onProject={onProject} />
    </>
  );
}

async function settleReact() {
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
}

describe('canonical demo route seed', () => {
  let container: HTMLDivElement;
  let root: Root;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await act(async () => root?.unmount());
    consoleError.mockRestore();
    container.remove();
  });

  it('returns a usable demo project while seeding happens after render', async () => {
    const renderedIds: Array<string | undefined> = [];
    root = createRoot(container);

    await act(async () => {
      root.render(
        <ProjectsProvider>
          <ProjectProbe id={DEMO_PROJECT_ID} onProject={id => renderedIds.push(id)} />
        </ProjectsProvider>,
      );
    });
    await settleReact();

    expect(renderedIds).toContain(DEMO_PROJECT_ID);
    expect(container.querySelector('output')?.dataset.projectId).toBe(DEMO_PROJECT_ID);
    expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/Maximum update depth exceeded|Cannot update a component while rendering/);
  });

  it('keeps hook order stable when a project route id changes from absent to demo', async () => {
    const renderedIds: Array<string | undefined> = [];
    root = createRoot(container);

    await act(async () => {
      root.render(
        <ProjectsProvider>
          <ChangingProjectProbe onProject={id => renderedIds.push(id)} />
        </ProjectsProvider>,
      );
    });
    await settleReact();

    await act(async () => {
      container.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settleReact();

    expect(renderedIds).toContain(DEMO_PROJECT_ID);
    expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/Rendered (more|fewer) hooks than during the previous render/);
  });
});
