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
 await mkdir('artifacts',{recursive:true});
 await send('Runtime.enable'); await send('Runtime.discardConsoleEntries'); errors.length=0; await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1080,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:5173'});
 await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true'`);
 await click('10SEC');
 const expected=await evaluate(`(async()=>{
  const {createRace}=await import('/src/utils/race.js');
  const {defaultEmployees}=await import('/src/data/assets.js');
  const rng=initial=>{let seed=initial;return ()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296)};
  for(let seed=1;seed<100;seed++) {
   const race=createRace(defaultEmployees,10,{},rng(seed));
   if(race.scenario!=='comeback')continue;
   const original=Math.random;Math.random=rng(seed);
   try {document.querySelector('.start-button').click();} finally {Math.random=original;}
   return race.order[0].name;
  }
 })()`);
 await until(`Number(document.querySelector('canvas')?.dataset.cameraBlend)>0`);
 await evaluate(`Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));`);
 const leader=await evaluate(`document.querySelector('.broadcast-board li>span:last-of-type').childNodes[0].textContent`);
 assert.notEqual(leader,expected,'eventual winner is trailing at final stretch');
 await screenshot('comeback-trailing');
 await evaluate(`delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));`);
 await click('Resume race');
 await until(`document.querySelector('.broadcast-caption')?.textContent.includes('is making a comeback!')`);
 await screenshot('comeback-overtake');
 await until(`!!document.querySelector('.spotlight-card')`);
 assert.equal(await evaluate(`document.querySelector('.spotlight-card h2').textContent`),expected);
 assert.ok(await evaluate(`document.querySelector('.winner-exclusion').textContent.includes('5 eligible')`));
 assert.deepEqual(errors,[]);
 console.log('PASS seeded comeback: winner trails at final stretch, live overtake notice, pause/resume, correct result and exclusion.');
} finally {ws.close();}