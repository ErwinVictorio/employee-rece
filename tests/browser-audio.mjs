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
  await send('Runtime.enable'); await send('Runtime.discardConsoleEntries'); errors.length = 0; await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.soundPlays=[]; window.soundObjects=[]; window.cueCount=0; const NativeAudio=Audio; window.Audio=class extends NativeAudio { constructor(...args){ super(...args); soundObjects.push(this); } play(){ soundPlays.push(this.src); return super.play(); } }; const make=AudioContext.prototype.createOscillator; AudioContext.prototype.createOscillator=function(){ cueCount++; return make.call(this); };` });
  await send('Page.navigate', { url: 'http://127.0.0.1:5173' });
  await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true'`);
  await click('10SEC');
  await evaluate(`document.querySelector('.start-button').click()`);
  await until(`!!document.querySelector('.three-countdown')`);
  const countdownPlays = await evaluate(`soundPlays.filter(s=>s.includes('race-start')).length`);
  await evaluate(`document.querySelector('nav button').click()`);
  await sleep(100);
  assert.ok(await evaluate(`soundObjects.every(s=>s.paused)`));
  await evaluate(`document.querySelector('nav button').click()`);
  await sleep(100);
  assert.equal(await evaluate(`soundPlays.filter(s=>s.includes('race-start')).length`), countdownPlays);
  await until(`cueCount === 2`);
  await click('Rolling camera'); await click('All runners');
  await sleep(500);
  assert.equal(await evaluate(`cueCount`), 2);
  await until(`!!document.querySelector('.results-panel')`);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.includes('Reset') && !b.textContent.includes('race')).click()`);
  await click('Reset race');
  assert.ok(await evaluate(`soundObjects.every(s=>s.paused)`));
  assert.deepEqual(errors, []);
  console.log('PASS immediate mute, no countdown replay on unmute, exactly two event cues, camera deduplication and reset cleanup.');
} finally { ws.close(); }
