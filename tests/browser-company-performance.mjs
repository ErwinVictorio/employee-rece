import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { connect } from './company-browser-helpers.mjs';

const b = await connect();
const { send, evaluate, until, sleep } = b;
const samples = [];
let injection;
try {
  injection = await send('Page.addScriptToEvaluateOnNewDocument', { source: `let raceSeed=123;Math.random=()=>((raceSeed=(1664525*raceSeed+1013904223)>>>0)/4294967296);` });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
  for (const low of [true, false]) for (const location of ['stadium', 'company-grounds']) {
    await send('Page.navigate', { url: process.env.COMPANY_TEST_URL || 'http://127.0.0.1:5175' }); await sleep(600);
    await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true' && !!document.querySelector('.location-settings')`);
    if (location === 'company-grounds') await evaluate(`document.querySelectorAll('.location-settings button')[1].click()`);
    if (!low) await evaluate(`document.querySelector('.prototype-controls input').click()`);
    await b.click('30SEC');
    await evaluate(`document.querySelector('.start-button').click()`);
    await until(`!!document.querySelector('.three-countdown')`); await sleep(4800);
    samples.push(await evaluate(`new Promise(resolve => {
      const frames = []; let previous;
      function tick(now) { if (previous) frames.push(now-previous); previous=now;
        if(frames.length<90) requestAnimationFrame(tick); else {
          const sorted=[...frames].sort((a,b)=>a-b), canvas=document.querySelector('canvas');
          const gl=canvas.getContext('webgl2'), ext=gl.getExtension('WEBGL_debug_renderer_info');
          resolve({location:'${location}',low:${low},...canvas.dataset,meanMs:frames.reduce((a,b)=>a+b,0)/frames.length,p95Ms:sorted[Math.floor(sorted.length*.95)],maxMs:sorted.at(-1),gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable'});
        }
      } requestAnimationFrame(tick);
    })`));
  }
  assert.deepEqual(b.errors, []);
  await writeFile('artifacts/company-grounds/performance.json', JSON.stringify(samples, null, 2));
  console.log(samples);
} finally { if (injection) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier }); b.ws.close(); }
