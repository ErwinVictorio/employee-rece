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
let injection;
try {
 await mkdir('artifacts',{recursive:true});await send('Runtime.enable');await send('Runtime.discardConsoleEntries');errors.length=0;await send('Page.enable');
 injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`const now=performance.now.bind(performance),base=now(),scale=t=>base+(t-base)*3;performance.now=()=>scale(now());const raf=requestAnimationFrame;window.requestAnimationFrame=cb=>raf(t=>cb(scale(t)));`});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1080,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:5173'});
 await until(`document.querySelector('.three-viewport')?.dataset.ready==='true'`);
 await evaluate(`(()=>{const e=document.querySelector('#bulk-names');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,Array.from({length:94},(_,i)=>'Employee '+(i+7)).join(String.fromCharCode(10)));e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await evaluate(`document.querySelector('#bulk-names').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}))`);
 await until(`document.querySelectorAll('.employee-row').length===100`);
 await click('10SEC');
 assert.ok(await evaluate(`document.querySelector('.large-race-note').textContent.includes('60 seconds')`));
 await evaluate(`(()=>{const e=document.querySelector('#bulk-names');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'Overflow');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await click('Add pasted names');assert.equal(await evaluate(`document.querySelectorAll('.employee-row').length`),100);
 await evaluate(`document.querySelector('.start-button').click()`);
 await until(`!!document.querySelector('.three-countdown')`);
 await evaluate(`Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));`);
 assert.equal(await evaluate(`document.querySelectorAll('.broadcast-board li').length`),100);
 assert.ok(await evaluate(`document.querySelectorAll('.three-name').length<=12`));
 await evaluate(`(()=>{const s=document.querySelector('[aria-label="Focused lanes"]');s.value='8';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 await until(`document.querySelectorAll('.three-name').length===4`);
 await screenshot('100-runners-desktop');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await sleep(300);
 assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`));
 assert.ok(await evaluate(`(()=>{const e=document.querySelector('.broadcast-board');return e.scrollHeight>e.clientHeight})()`));
 await screenshot('100-runners-mobile');
 await evaluate(`(()=>{const s=document.querySelector('[aria-label="Focused lanes"]');s.value='auto';s.dispatchEvent(new Event('change',{bubbles:true}));delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));})()`);
 await click('Resume race');
 await sleep(1800);
 assert.ok(await evaluate(`Array.from(document.querySelectorAll('.three-name')).filter(e=>getComputedStyle(e).display!=='none').length<=6`));
 await screenshot('100-runners-live-mobile');
 await until(`!!document.querySelector('.results-panel')`,60000);
 await click('View Results');
 const rows=await evaluate(`Array.from(document.querySelectorAll('tbody tr')).map(r=>({name:r.cells[1].textContent,time:parseFloat(r.cells[2].textContent)}))`);
 assert.equal(rows.length,100);assert.equal(new Set(rows.map(r=>r.name)).size,100);assert.equal(rows[0].time,48);assert.equal(rows[99].time,60);
 assert.ok(rows.every((r,i)=>!i||r.time>rows[i-1].time));
 await evaluate(`document.querySelector('.spotlight-actions .primary').click()`);
 await until(`!!document.querySelector('.three-countdown')`);
 assert.equal(await evaluate(`document.querySelectorAll('.broadcast-board li').length`),99);
 await click('Use 2D');assert.equal(await evaluate(`document.querySelectorAll('.race-lane').length`),99);
 assert.deepEqual(errors,[]);console.log('PASS 100 bulk entrants, overflow, worker, focused lanes, mobile scroll, all results/times, exclusion replay and 2D.');
} finally {if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});ws.close();}