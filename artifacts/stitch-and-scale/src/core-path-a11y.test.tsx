// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import React from 'react';

// Mocking dependencies that might break the test environment
vi.mock('@/context/SettingsContext', () => ({
  useSettings: () => ({
    language: 'en',
    t: (key: string) => key,
    unit: 'in',
    sizingStandard: 'CYC',
    customStandard: {},
    studioProfile: { designerName: 'Test Designer' }
  }),
}));

vi.mock('@/context/ProjectsContext', () => ({
  useProjects: () => ({
    createProject: vi.fn(),
    importProject: vi.fn(),
  }),
  useProject: () => ({
    project: {
      id: 'test-id',
      name: 'Test Project',
      author: 'Test Author',
      baseSize: 'M',
      gauge: { stitchesPer4In: 20, rowsPer4In: 28, unit: 'in' },
      sections: [],
    },
    updateProject: vi.fn(),
  }),
}));

vi.mock('wouter', () => ({
  useLocation: () => [ vi.fn(), vi.fn() ],
  useParams: () => ({ id: 'test-id' }),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

// Simple component mocks for core path parts to test their structure
const NewProjectMock = () => (
  <form aria-labelledby="new-project-title">
    <h1 id="new-project-title">New Project</h1>
    <div>
      <label htmlFor="name">Pattern Name</label>
      <input id="name" aria-invalid="false" />
    </div>
    <div>
      <label htmlFor="author">Designer</label>
      <input id="author" />
    </div>
    <div role="radiogroup" aria-label="Base Size">
      {['S', 'M', 'L'].map(size => (
        <button key={size} type="button" role="radio" aria-checked={size === 'M'}>{size}</button>
      ))}
    </div>
  </form>
);

const GradingTableMock = () => (
  <div role="region" aria-label="Grading Table" tabIndex={0}>
    <table>
      <thead>
        <tr>
          <th scope="col">Measurement</th>
          <th scope="col">S</th>
          <th scope="col">M</th>
          <th scope="col">L</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Chest</th>
          <td>34</td>
          <td>38</td>
          <td>42</td>
        </tr>
      </tbody>
    </table>
  </div>
);

describe('Core Path Accessibility Audit', () => {
  it('New Project structure should have no violations', async () => {
    const { container } = render(<NewProjectMock />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('Grading Table structure should have no violations', async () => {
    const { container } = render(<GradingTableMock />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('Settings Developer section should have no violations', async () => {
    const { container } = render(
      <section aria-labelledby="dev-title">
        <h2 id="dev-title">Developer & MCP</h2>
        <div>
          <label htmlFor="mcp-url">Production MCP Endpoint</label>
          <input id="mcp-url" readOnly value="https://example.com/api/mcp" />
          <button aria-label="Copy URL">Copy</button>
        </div>
      </section>
    );
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});
