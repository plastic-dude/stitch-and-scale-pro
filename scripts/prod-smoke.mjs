#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:5000';
const cdpUrl = process.env.CDP_URL ?? 'http://127.0.0.1:9222';
const outDir = process.env.SMOKE_OUT_DIR ?? '/tmp/stitch-and-scale-smoke-prod';

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

async function navigate(call, route, width = 1280, height = 720) {
  await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: `${baseUrl}${route}` });
  await sleep(2000); // Give it more time for production hydration
}

async function capture(call, name) {
  const screenshot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`${outDir}/${name}.png`, Buffer.from(screenshot.data, 'base64'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await mkdir(outDir, { recursive: true });
const { socket, call } = await connect();
await call('Page.enable');
await call('Runtime.enable');
await call('Log.enable');
await call('Network.enable');

const consoleErrors = [];
const networkFailures = [];

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
    consoleErrors.push(message.params.entry.text);
  }
  if (message.method === 'Network.loadingFailed') {
    networkFailures.push(message.params.errorText);
  }
});

try {
  console.log(`[SMOKE] Testing production integrity at ${baseUrl}...`);
  
  await navigate(call, '/', 1280, 720);
  await capture(call, 'prod-root-initial');

  const rootContent = await evaluate(call, `document.getElementById('root').innerHTML`);
  assert(rootContent.length > 0, 'Production #root element is empty — React failed to mount');
  
  const hasReact = await evaluate(call, `!!(window.__REACT_DEVTOOLS_GLOBAL_HOOK__ || document.querySelector('[data-reactroot], #root > *'))`);
  assert(hasReact, 'No React components detected in #root');

  const title = await evaluate(call, `document.title`);
  assert(title.includes('Stitch & Scale'), `Unexpected page title: ${title}`);

  // Check for critical UI markers
  const hasHeader = await evaluate(call, `!!document.querySelector('header')`);
  assert(hasHeader, 'App shell header missing');

  const hasNav = await evaluate(call, `!!document.querySelector('nav')`);
  assert(hasNav, 'App shell navigation missing');

  // Exercise project creation
  console.log('[SMOKE] Exercising project creation...');
  await evaluate(call, `
    const newProjectBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('New Project'));
    if (newProjectBtn) newProjectBtn.click();
  `);
  await sleep(1000);
  await capture(call, 'prod-new-project-modal');
  
  const isModalOpen = await evaluate(call, `!!document.querySelector('[role="dialog"]')`);
  assert(isModalOpen, 'New Project modal failed to open');

  // Verify export flow readiness
  console.log('[SMOKE] Verifying export flow readiness...');
  await navigate(call, '/settings', 1280, 720);
  await capture(call, 'prod-settings-page');
  
  const hasExportBtn = await evaluate(call, `!!document.querySelector('[data-testid="button-export-data"]')`);
  assert(hasExportBtn, 'Export data button missing from Settings');

  // Final check for console/network failures
  assert(consoleErrors.length === 0, `Detected ${consoleErrors.length} console errors: ${consoleErrors.join(', ')}`);
  assert(networkFailures.length === 0, `Detected ${networkFailures.length} network failures: ${networkFailures.join(', ')}`);

  console.log(JSON.stringify({ 
    ok: true, 
    url: baseUrl,
    rootLength: rootContent.length,
    consoleErrors: consoleErrors.length,
    networkFailures: networkFailures.length,
    checks: [
      'root-not-empty', 
      'react-detected', 
      'title-match', 
      'header-present', 
      'nav-present',
      'project-creation-modal',
      'export-button-present',
      'no-console-errors',
      'no-network-failures'
    ] 
  }, null, 2));
} catch (err) {
  console.error(`[SMOKE] FAILED: ${err.message}`);
  process.exit(1);
} finally {
  socket.close();
}
