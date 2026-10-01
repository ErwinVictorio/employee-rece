import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const pages = await (await fetch('http://127.0.0.1:9334/json/list')).json();
const ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let seq = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  if (pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(message.error); else resolve(message.result);
  }
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(expression, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { if (await evaluate(expression)) return; await sleep(150); }
  throw new Error(`Timeout: ${expression}`);
}
async function click(text) {
  const clicked = await evaluate(`(() => { const b = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(text)}); if (!b || b.disabled) return false; b.click(); return true; })()`);
  assert.ok(clicked, `Button available: ${text}`);
  await sleep(200);
}
async function screenshot(name) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(`artifacts/3d-${name}.png`, Buffer.from(data, 'base64'));
}
try {
  await mkdir('artifacts', { recursive: true });
  await send('Runtime.enable'); await send('Runtime.discardConsoleEntries'); errors.length = 0; await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/?prototype=1' });
  await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true'`);
  await click('Run winner-falls fixture');
  await until(`document.querySelector('.race-hud p').textContent.includes('tumble')`);
  await sleep(450);
  await screenshot('fixture-grounded');
  await until(`document.querySelector('.race-hud p').textContent.includes('catching up')`);
  await screenshot('fixture-comeback');
  await until(`!!document.querySelector('.results-panel')`);
  assert.equal(await evaluate(`document.querySelector('.spotlight-card h2').textContent`), 'Juan');
  await screenshot('fixture-winner');
  await send('Page.navigate', { url: 'http://127.0.0.1:5173' });
  await until(`!!document.querySelector('.start-button')`);
  await click('10SEC');
  await evaluate(`document.querySelector('.start-button').click()`);
  await until(`!!document.querySelector('.three-countdown')`);
  await evaluate(`Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange'));`);
  await until(`Array.from(document.querySelectorAll('button')).some(b => b.textContent === 'Resume race')`);
  const countdown = await evaluate(`document.querySelector('.three-countdown strong').textContent`);
  await sleep(600);
  assert.equal(await evaluate(`document.querySelector('.three-countdown strong').textContent`), countdown);
  await evaluate(`delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));`);
  await click('Resume race');
  await until(`!!document.querySelector('.results-panel')`);
  const inject = await send('Page.addScriptToEvaluateOnNewDocument', { source: `const get = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type,...args) { return type === 'webgl2' ? null : get.call(this,type,...args); };` });
  await send('Page.navigate', { url: 'http://127.0.0.1:5173' });
  await until(`!!document.querySelector('.track-card')`);
  assert.equal(await evaluate(`document.querySelector('[aria-label=Presentation]').value`), '2d');
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: inject.identifier });
  assert.deepEqual(errors, []);
  console.log('PASS winner-falls visual fixture, visibility-event pause/resume, unsupported-WebGL fallback.');
} finally { ws.close(); }
