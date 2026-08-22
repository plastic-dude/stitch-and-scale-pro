#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://127.0.0.1:5000';
const cdpUrl = process.env.CDP_URL ?? 'http://127.0.0.1:9222';
const outDir = process.env.SMOKE_OUT_DIR ?? '/tmp/stitch-and-scale-recovery';
const widths = [390];

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
    text: document.body.innerText.slice(0, 1200),
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
  // Clear local storage to simulate a fresh profile
  await navigate(call, '/', 390, 844);
  await evaluate(call, `localStorage.clear()`);
  await call('Page.reload', { ignoreCache: true });
  await sleep(900);

  // Navigate to an unknown project workspace
  await navigate(call, '/project/unknown-id-123', 390, 844);
  const workspaceRecovery = await metrics(call, 'workspace-recovery');
  assert(workspaceRecovery.text.includes('Project Not Found'), 'Workspace recovery: "Project Not Found" heading missing');
  assert(workspaceRecovery.text.includes('Import project from file'), 'Workspace recovery: "Import project from file" button missing');
  assert(workspaceRecovery.text.includes('Return to Dashboard'), 'Workspace recovery: "Return to Dashboard" button missing');
  await capture(call, 'workspace-recovery-390');

  // Navigate to an unknown project grading
  await navigate(call, '/project/unknown-id-123/grading', 390, 844);
  const gradingRecovery = await metrics(call, 'grading-recovery');
  assert(gradingRecovery.text.includes('Project Not Found'), 'Grading recovery: "Project Not Found" heading missing');
  assert(gradingRecovery.text.includes('Import project from file'), 'Grading recovery: "Import project from file" button missing');
  assert(gradingRecovery.text.includes('Return to Dashboard'), 'Grading recovery: "Return to Dashboard" button missing');
  await capture(call, 'grading-recovery-390');

  console.log(JSON.stringify({ ok: true, outDir, checks: ['workspace recovery UI', 'grading recovery UI'] }, null, 2));
} finally {
  socket.close();
}
