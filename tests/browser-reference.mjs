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
  await send('Runtime.enable'); await send('Runtime.discardConsoleEntries'); errors.length=0; await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width:1672,height:1100,deviceScaleFactor:1,mobile:false });
  await send('Page.navigate', { url:'http://127.0.0.1:5173' });
  await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true'`);
  assert.equal(await evaluate(`document.querySelectorAll('.character-choice').length`),6);
  await evaluate(`document.querySelector('.start-button').click()`);
  await until(`Number(document.querySelector('.broadcast-timer strong').textContent.split(':')[1]) > 4.5`);
  assert.equal(await evaluate(`document.querySelectorAll('.broadcast-board li').length`),6);
  assert.equal(await evaluate(`document.querySelectorAll('.runner-connectors g path[d]').length`),6);
  assert.equal(await evaluate(`new Set(Array.from(document.querySelectorAll('.three-name')).map(e=>e.style.getPropertyValue('--team-color'))).size`),6);
  const clip=await evaluate(`(()=>{const r=document.querySelector('.three-viewport').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scale:1};})()`);
  const shot=await send('Page.captureScreenshot',{format:'png',clip});
  await writeFile('artifacts/reference-enhancement.png',Buffer.from(shot.data,'base64'));
  await until(`!!document.querySelector('.results-panel')`);
  await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='View Results').click()`);
  await until(`!!document.querySelector('tbody tr')`);
  assert.equal(await evaluate(`document.querySelector('.spotlight-card h2').textContent`),await evaluate(`document.querySelector('tbody tr').cells[1].textContent`));
  assert.deepEqual(errors,[]);
  console.log('PASS six palettes, projected connector lines, overlay standings/result agreement; reference-enhancement.png captured.');
} finally {ws.close();}
