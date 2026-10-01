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
 await click('10SEC'); await evaluate(`document.querySelector('.start-button').click()`);
 await until(`!!document.querySelector('.winner-spotlight')`);
 await until(`document.querySelector('canvas').dataset.cameraView === 'winner'`);
 const winner=await evaluate(`document.querySelector('.spotlight-card h2').textContent`);
 assert.equal(await evaluate(`document.querySelector('.spotlight-time strong').textContent`),'9.00s');
 assert.equal(await evaluate(`document.querySelector('canvas').dataset.winnerId`),await evaluate(`document.querySelector('.winner-spotlight').dataset.winnerId`));
 assert.equal(await evaluate(`document.querySelectorAll('canvas').length`),1);
 const podiumIds = await evaluate(`JSON.parse(document.querySelector('canvas').dataset.podiumIds)`);
 assert.equal(podiumIds.length, 5);
 assert.equal(new Set(podiumIds).size, 5);
 assert.equal(String(podiumIds[0]), await evaluate(`document.querySelector('.winner-spotlight').dataset.winnerId`));
 assert.ok(await evaluate(`scrollY < 10`));
 await sleep(1000); await screenshot('winner-spotlight-desktop');
 await click('Pause animation');
 const angle=await evaluate(`document.querySelector('canvas').dataset.winnerRotation`);
 await sleep(400);
 assert.equal(await evaluate(`document.querySelector('canvas').dataset.winnerRotation`),angle);
 await click('Resume animation');
 await until(`Number(document.querySelector('canvas').dataset.winnerRotation) > 6.283`,25000);
 await click('View Results');
 await until(`document.querySelectorAll('tbody tr').length === 6`);
 assert.equal(await evaluate(`document.querySelector('tbody tr').cells[1].textContent`),winner);
 assert.equal(await evaluate(`document.querySelector('tbody tr').cells[2].textContent`),'9.00s');
 await evaluate(`window.scrollTo(0,0)`);
 await evaluate(`document.querySelector('.spotlight-actions .primary').click()`);
 await until(`!!document.querySelector('.three-countdown')`);
 assert.equal(await evaluate(`!!document.querySelector('.winner-spotlight')`),false);
 await until(`!!document.querySelector('.winner-spotlight')`);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await until(`document.querySelector('canvas').dataset.winnerRotation === '0.000'`);
 await screenshot('winner-spotlight-mobile');
 assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
 await send('Emulation.setEmulatedMedia',{features:[]});
 await evaluate(`document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`);
 await until(`document.body.textContent.includes('3D rendering paused')`);
 await click('Retry 3D'); await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true'`);
 await click('Resume animation');
 await until(`Number(document.querySelector('canvas').dataset.winnerRotation) > .1`);
 const retained=await evaluate(`document.querySelector('.spotlight-card h2').textContent`);
 await click('Use 2D');
 assert.equal(await evaluate(`document.querySelector('.winner-heading h2').textContent`),retained);
 assert.equal(await evaluate(`document.querySelectorAll('canvas').length`),0);
 assert.deepEqual(errors,[]);
 console.log('PASS winner identity/time, 360-degree rotation, pause, results, replay, single canvas, mobile, reduced motion, retry and 2D preservation.');
} finally {ws.close();}
