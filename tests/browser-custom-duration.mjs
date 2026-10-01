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
let injected;
try {
 await send('Runtime.enable'); await send('Runtime.discardConsoleEntries');errors.length=0;await send('Page.enable');
 injected=await send('Page.addScriptToEvaluateOnNewDocument',{source:`const now=performance.now.bind(performance),base=now(),scale=t=>base+(t-base)*60;performance.now=()=>scale(now());const raf=requestAnimationFrame;window.requestAnimationFrame=callback=>raf(t=>callback(scale(t)));`});
 for(const minutes of [1,10]) {
  await send('Page.navigate',{url:'http://127.0.0.1:5173'});
  await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true'`);
  await evaluate(`Array.from(document.querySelectorAll('label')).find(l=>l.textContent.includes('Custom duration')).querySelector('input').click()`);
  for(const value of ['', '0','11','1.5',String(minutes)]) {
   await evaluate(`(()=>{const e=document.querySelector('#race-minutes');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
   await sleep(100);
   assert.equal(await evaluate(`document.querySelector('.start-button').disabled`),value!==String(minutes));
  }
  await evaluate(`document.querySelector('.start-button').click()`);
  await until(`!!document.querySelector('.results-panel')`);
  await click('View Results');
  const times=await evaluate(`Array.from(document.querySelectorAll('tbody tr')).map(r=>parseFloat(r.cells[2].textContent))`);
  assert.equal(times[0],minutes*54);assert.equal(times.at(-1),minutes*60);
  await click('Edit Participants');
  assert.equal(await evaluate(`document.querySelector('#race-minutes').value`),String(minutes));
  await click('15SEC');
  assert.equal(await evaluate(`!!document.querySelector('#race-minutes')`),false);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS custom 1/10 minute races, invalid input blocking, finish times, settings retention and preset switching (60x test clock).');
} finally {if(injected)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injected.identifier});ws.close();}