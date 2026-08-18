#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:5000';
const cdpUrl = process.env.CDP_URL ?? 'http://127.0.0.1:9222';
const outDir = process.env.SMOKE_OUT_DIR ?? '/tmp/stitch-and-scale-smoke';
const widths = [320, 360, 390, 430];

async function json(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function connect() {
  const pages = await json(`${cdpUrl}/json`);
  const page = pages.find((candidate) => candidate.type === 'page');
  if (!page?.webSocketDebuggerUrl) throw new Error('No CDP page target found');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const resolve = pending.get(message.id);
    if (!resolve) return;
    pending.delete(message.id);
    if (message.error) resolve(Promise.reject(new Error(JSON.stringify(message.error))));
    else resolve(message.result ?? {});
  });
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, (result) => Promise.resolve(result).then(resolve, reject));
    socket.send(JSON.stringify({ id, method, params }));
  });
  return { socket, call };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function evaluate(call, expression) {
  const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? 'Runtime evaluation failed');
  return result.result?.value;
}

async function navigate(call, route, width = 390, height = 844) {
  await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
  await call('Page.navigate', { url: `${baseUrl}${route}` });
  await sleep(900);
}

async function capture(call, name) {
  const screenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`${outDir}/${name}.png`, Buffer.from(screenshot.data, 'base64'));
}

async function metrics(call, name) {
  const value = await evaluate(call, `JSON.stringify({
    name: ${JSON.stringify(name)},
    url: location.href,
    bodyOverflow: document.body.scrollWidth > document.body.clientWidth,
    htmlOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    bodyWidth: document.body.scrollWidth,
    bodyClientWidth: document.body.clientWidth,
    htmlWidth: document.documentElement.scrollWidth,
    htmlClientWidth: document.documentElement.clientWidth,
    overflowNodes: [...document.querySelectorAll('body *')].map((el) => { const rect = el.getBoundingClientRect(); const parents = []; let node = el.parentElement; for (let i = 0; i < 4 && node; i += 1, node = node.parentElement) { const parentRect = node.getBoundingClientRect(); parents.push({ tag: node.tagName, id: node.id, cls: String(node.className).slice(0, 80), left: Math.round(parentRect.left), right: Math.round(parentRect.right), width: Math.round(parentRect.width) }); } return { tag: el.tagName, id: el.id, cls: String(el.className).slice(0, 80), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width), parents }; }).filter((item) => item.right > document.documentElement.clientWidth + 1).slice(0, 12),
    text: document.body.innerText.slice(0, 5000),
    controls: [...document.querySelectorAll('button,a,input,select,textarea')].slice(0, 120).map((el) => {
      const rect = el.getBoundingClientRect();
      return { text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().slice(0, 80), height: rect.height, width: rect.width, disabled: Boolean(el.disabled) };
    }),
  })`);
  return JSON.parse(value);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await mkdir(outDir, { recursive: true });
const { socket, call } = await connect();
await call('Page.enable');
await call('Runtime.enable');

try {
  for (const width of widths) {
    await navigate(call, '/', width, 844);
    const onboarding = await metrics(call, `onboarding-${width}`);
    assert(!onboarding.bodyOverflow && !onboarding.htmlOverflow, `onboarding horizontal overflow at ${width}px`);
    await capture(call, `onboarding-${width}`);
  }

  await navigate(call, '/', 390, 844);
  await evaluate(call, `localStorage.setItem('stitch-and-scale-settings-v1', JSON.stringify({
    unit: 'in', theme: 'dark', sizingStandard: 'CYC', onboardingCompleted: true, language: 'en',
    pdfDefaults: { themeId: 'minimal', accentColor: '', lastNamingTemplate: null, brandSuffix: 'never', firstExportTipSeen: true, includeCover: true, includeGaugeSummary: true, includeNotes: true }
  }))`);
  await call('Page.reload', { ignoreCache: true });
  await sleep(900);
  const dashboard = await metrics(call, 'dashboard');
  assert(!dashboard.bodyOverflow && !dashboard.htmlOverflow, 'dashboard horizontal overflow');
  await capture(call, 'dashboard-390');

  await navigate(call, '/project/new', 390, 844);
  const newProject = await metrics(call, 'new-project');
  const next = newProject.controls.find((control) => control.text === 'Next');
  assert(next?.disabled === true, 'new-project Next should be disabled for empty required fields');
  assert((next?.height ?? 0) >= 44, `new-project Next hit area is ${next?.height ?? 0}px`);
  assert(!newProject.bodyOverflow && !newProject.htmlOverflow, 'new-project horizontal overflow');
  await capture(call, 'new-project-390');

  await navigate(call, '/', 390, 844);
  await evaluate(call, `localStorage.setItem('stitch-and-scale-settings-v1', JSON.stringify({
    unit: 'in', theme: 'dark', sizingStandard: 'CYC', onboardingCompleted: false, language: 'en',
    pdfDefaults: { themeId: 'minimal', accentColor: '', lastNamingTemplate: null, brandSuffix: 'never', firstExportTipSeen: true, includeCover: true, includeGaugeSummary: true, includeNotes: true }
  }))`);
  await call('Page.reload', { ignoreCache: true });
  await sleep(900);
  const skipResult = await evaluate(call, `(() => { const button = [...document.querySelectorAll('button')].find((el) => /skip setup/i.test(el.innerText)); if (!button) return false; button.click(); return true; })()`);
  assert(skipResult, 'onboarding skip action was not found');
  await sleep(900);

  await navigate(call, '/project/sample-crew-neck-sweater', 390, 844);
  const workspace = await metrics(call, 'sample-workspace');
  assert(!workspace.bodyOverflow && !workspace.htmlOverflow, 'sample workspace horizontal overflow');
  await capture(call, 'sample-workspace-390');

  await navigate(call, '/project/sample-crew-neck-sweater/pdf', 390, 844);
  const exportPage = await metrics(call, 'export');
  assert(exportPage.text.includes('Ready to print') || exportPage.text.includes('Review before printing') || exportPage.text.includes('Fix before printing'), 'export preflight panel is missing');
  assert(exportPage.text.includes('Rendered artifact:'), 'rendered artifact evidence is missing');
  assert(!exportPage.bodyOverflow && !exportPage.htmlOverflow, 'export horizontal overflow');
  const exportButton = exportPage.controls.find((control) => control.text === 'Export PDF');
  assert((exportButton?.height ?? 0) >= 44, `Export PDF hit area is ${exportButton?.height ?? 0}px`);
  await capture(call, 'export-390');

  await navigate(call, '/project/sample-crew-neck-sweater', 390, 844);
  const clickVisible = (label) => evaluate(call, `(() => { const node = [...document.querySelectorAll('button,[role=tab],a')].find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (el.innerText || el.getAttribute('aria-label') || '').trim() === ${JSON.stringify(label)}; }); if (!node) return false; node.click(); return true; })()`);
  assert(await clickVisible('All Labs'), 'All Labs control was not found');
  await sleep(400);
  assert(await clickVisible('Grading Lab'), 'visible Grading Lab entry was not found');
  await sleep(700);
  const grading = await metrics(call, 'grading-lab');
  assert(grading.text.includes('Pattern QA preflight'), 'Pattern QA summary is missing from Grading Lab');
  assert(grading.text.includes('Technical-editor defect ledger'), 'technical-editor defect ledger is missing from Grading Lab');
  assert(grading.text.includes('Release evidence'), 'release-evidence checklist is missing from Grading Lab');
  assert(grading.text.includes('Physical print review'), 'physical-print evidence item is missing from Grading Lab');
  assert(await clickVisible('Record current QA findings'), 'defect-ledger record action was not found');
  await sleep(300);
  assert(!grading.bodyOverflow && !grading.htmlOverflow, `Grading Lab horizontal overflow: ${JSON.stringify({ body: [grading.bodyWidth, grading.bodyClientWidth], html: [grading.htmlWidth, grading.htmlClientWidth], nodes: grading.overflowNodes })}`);
  await capture(call, 'grading-lab-390');

  await navigate(call, '/project/sample-crew-neck-sweater', 390, 844);
  assert(await clickVisible('All Labs'), 'All Labs control was not found for search');
  await sleep(400);
  const labsWithSearch = await metrics(call, 'all-labs-search');
  assert(labsWithSearch.controls.some((control) => control.text === 'Search labs…'), 'lab search input is missing');
  const searchResult = await evaluate(call, `(() => { const input = [...document.querySelectorAll('input')].find((el) => el.getAttribute('placeholder') === 'Search labs…'); if (!input) return false; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set; setter?.call(input, 'Receipt'); input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  assert(searchResult, 'lab search input could not be populated');
  await sleep(300);
  const filteredLabs = await metrics(call, 'filtered-labs');
  assert(filteredLabs.text.includes('Receipt Lab'), 'lab search did not reveal Receipt Lab');
  assert(await clickVisible('Receipt Lab'), 'Receipt Lab search result was not found');
  await sleep(500);
  await navigate(call, '/project/sample-crew-neck-sweater', 390, 844);
  assert(await clickVisible('All Labs'), 'All Labs control was not found for ledger');
  await sleep(400);
  const recentLabs = await metrics(call, 'recent-labs');
  const recentHistory = await evaluate(call, `localStorage.getItem('stitch-and-scale-lab-history-sample-crew-neck-sweater') || ''`);
  assert(recentHistory.includes('receiptlab'), 'recent lab history was not persisted');
  assert(await clickVisible('Design Ledger'), 'visible Design Ledger entry was not found');
  await sleep(700);
  const ledger = await metrics(call, 'design-ledger');
  assert(ledger.text.includes('Design Ledger'), 'Design Ledger did not open');
  assert(ledger.text.includes('Operational records'), 'operational records card is missing from Design Ledger');
  assert(ledger.text.includes('Backup and restore'), 'operational backup panel is missing from Design Ledger');
  assert(ledger.controls.some((control) => control.text === 'Download JSON backup'), 'JSON backup download action is missing');
  assert(ledger.controls.some((control) => control.text === 'Restore JSON backup'), 'JSON backup restore action is missing');
  assert(await evaluate(call, `Boolean(document.querySelector('input[type=file][aria-label="Restore JSON backup"]'))`), 'JSON backup file input is not available as an accessible control');
  assert(!ledger.bodyOverflow && !ledger.htmlOverflow, `Design Ledger horizontal overflow: ${JSON.stringify({ body: [ledger.bodyWidth, ledger.bodyClientWidth], html: [ledger.htmlWidth, ledger.htmlClientWidth], nodes: ledger.overflowNodes })}`);
  const recordResult = await evaluate(call, `(() => {
    const name = document.querySelector('#op-sample-name');
    const location = document.querySelector('#op-sample-location');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (!name || !location || !setter) return false;
    setter.call(name, 'Smoke Sample'); name.dispatchEvent(new Event('input', { bubbles: true }));
    setter.call(location, 'Audit shelf'); location.dispatchEvent(new Event('input', { bubbles: true }));
    const add = [...document.querySelectorAll('button')].find((el) => el.innerText.trim() === 'Add record');
    if (!add) return false; add.click(); return true;
  })()`);
  assert(recordResult, 'operational sample record action was not found');
  await sleep(300);
  const recordPayload = await evaluate(call, `localStorage.getItem('stitch-and-scale-operations-sample-crew-neck-sweater') || ''`);
  assert(recordPayload.includes('Smoke Sample'), 'operational sample was not persisted');
  await call('Page.reload', { ignoreCache: true });
  await sleep(900);
  const postReload = await metrics(call, 'post-reload');
  assert(await clickVisible('All Labs'), 'All Labs could not be reopened after reload');
  await sleep(300);
  const reopened = await clickVisible('Design Ledger');
  assert(reopened, `Design Ledger could not be reopened after reload: ${JSON.stringify({ url: postReload.url, text: postReload.text.slice(0, 500), controls: postReload.controls.slice(0, 30).map((control) => control.text) })}`);
  await sleep(500);
  const recoveredLedger = await metrics(call, 'design-ledger-recovered');
  assert(recoveredLedger.text.includes('Smoke Sample'), 'operational sample did not recover after reload');
  await capture(call, 'design-ledger-390');

  await navigate(call, '/settings', 390, 844);
  const settings = await metrics(call, 'settings-backup');
  assert(settings.text.includes('Data & Backups'), 'Settings backup card is missing');
  assert(settings.controls.some((control) => control.text === 'Download Backup'), 'project-wide backup action is missing');
  assert(settings.controls.some((control) => control.text === 'Upload File'), 'project-wide restore action is missing');
  assert(await evaluate(call, `Boolean(document.querySelector('input[type=file][aria-label="Restore from Backup"]'))`), 'project-wide restore file input is not accessible');
  assert(!settings.bodyOverflow && !settings.htmlOverflow, 'Settings backup card horizontal overflow');
  await capture(call, 'settings-backup-390');

  console.log(JSON.stringify({ ok: true, outDir, checks: ['onboarding 320/360/390/430', 'dashboard', 'new project', 'sample workspace', 'export preflight + artifact evidence', 'grading lab QA + defect ledger', 'mobile lab search + recent history', 'design ledger + operational records backup/recovery', 'settings project-wide backup controls'] }, null, 2));
} finally {
  socket.close();
}
