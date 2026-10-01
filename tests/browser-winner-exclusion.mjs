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
 await send('Runtime.enable'); await send('Runtime.discardConsoleEntries'); errors.length=0; await send('Page.enable');
 await send('Page.navigate',{url:'http://127.0.0.1:5173'});
 await until(`document.querySelectorAll('.employee-row').length === 6`);
 await evaluate(`(()=>{const s=document.querySelector('[aria-label=Presentation]');s.value='2d';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 for(let i=0;i<3;i++) await evaluate(`document.querySelector('[aria-label^="Remove "]').click()`);
 await click('10SEC');
 for(let round=0;round<2;round++) {
  if(!round) await evaluate(`document.querySelector('.start-button').click()`);
  else await evaluate(`document.querySelector('.results-actions .primary').click()`);
  await until(`!!document.querySelector('.results-panel')`);
  assert.ok(await evaluate(`document.querySelector('.winner-exclusion').textContent.includes('${2-round} eligible')`));
  await click('View Results');
  const names=await evaluate(`Array.from(document.querySelectorAll('tbody tr')).map(r=>r.cells[1].textContent)`);
  assert.equal(names.length,3-round);
  if(round) assert.ok(!names.includes(globalThis.previousWinner));
  globalThis.previousWinner=names[0];
 }
 assert.equal(await evaluate(`document.querySelector('.results-actions .primary').disabled`),true);
 await click('Edit Participants');
 assert.equal(await evaluate(`document.querySelectorAll('.employee-row').length`),3);
 assert.equal(await evaluate(`document.querySelectorAll('.excluded-badge').length`),2);
 assert.equal(await evaluate(`document.querySelector('.start-button').disabled`),true);
 await evaluate(`document.querySelector('[aria-label="Exclude previous winners"]').click()`);
 assert.equal(await evaluate(`document.querySelector('.start-button').disabled`),false);
 await evaluate(`document.querySelector('[aria-label="Exclude previous winners"]').click()`);
 assert.equal(await evaluate(`document.querySelector('.start-button').disabled`),true);
 await click('Restore previous winners');
 assert.equal(await evaluate(`document.querySelectorAll('.excluded-badge').length`),0);
 assert.equal(await evaluate(`document.querySelector('.start-button').disabled`),false);
 assert.deepEqual(errors,[]);
 console.log('PASS cumulative auto-exclusion, next-race roster, preserved results/master list, exhausted pool, toggle and restore.');
} finally {ws.close();}