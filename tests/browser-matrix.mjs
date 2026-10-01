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
  const measurements = [];
  for (const count of [2, 6, 12]) {
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://127.0.0.1:5173' });
    await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true'`);
    if (count === 2) for (let i = 0; i < 4; i++) await evaluate(`document.querySelector('[aria-label^="Remove "]').click()`);
    if (count === 12) for (let i = 6; i < 12; i++) {
      await evaluate(`(() => { const input = document.querySelector('#employee-name'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'Long Employee Name ${i}'); input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
      await click('+ Add');
    }
    await click('10SEC');
    await evaluate(`document.querySelector('.start-button').click()`);
    await until(`!!document.querySelector('.three-countdown')`);
    await sleep(4500);
    await screenshot(`matrix-${count}-desktop`);
    await click('Trackside view');
    await screenshot(`matrix-${count}-side`);
    await send('Emulation.setDeviceMetricsOverride', { width: 768, height: 1024, deviceScaleFactor: 1, mobile: true });
    await sleep(400); await screenshot(`matrix-${count}-tablet`);
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await sleep(400); await screenshot(`matrix-${count}-mobile`);
    assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
    assert.ok(await evaluate(`(() => { const labels = Array.from(document.querySelectorAll('.three-name')).map(e => e.getBoundingClientRect()); return labels.every((a,i) => labels.every((b,j) => i===j || a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)); })()`), 'In-scene labels do not overlap');
    measurements.push({ count, fps: await evaluate(`document.querySelector('.three-viewport').dataset.fps`) });
    await until(`!!document.querySelector('.results-panel')`);
    await click('View Results');
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`), count);
    assert.equal(await evaluate(`document.querySelectorAll('canvas').length`), 1);
    const order = await evaluate(`Array.from(document.querySelectorAll('tbody tr')).map(r => r.cells[1].textContent)`);
    assert.equal(new Set(order).size, count);
    assert.equal(order[0], await evaluate(`document.querySelector('.spotlight-card h2').textContent`));
    console.log(`PASS ${count} runners: desktop/tablet/mobile, both views, full results.`);
  }
  await writeFile('artifacts/main-performance.json', JSON.stringify(measurements, null, 2));
  assert.deepEqual(errors, []);
} finally { ws.close(); }
