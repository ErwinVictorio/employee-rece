import assert from 'node:assert/strict';
import { connect } from './company-browser-helpers.mjs';
const b = await connect();
const { send, evaluate, sleep, until, click, screenshot } = b;
const url = process.env.COMPANY_TEST_URL || 'http://127.0.0.1:5175';
let injection;
try {
  injection = await send('Page.addScriptToEvaluateOnNewDocument', { source: `const now=performance.now.bind(performance),base=now(),scale=t=>base+(t-base)*80;performance.now=()=>scale(now());const raf=requestAnimationFrame;window.requestAnimationFrame=cb=>raf(t=>cb(scale(t)));` });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url }); await sleep(600);
  await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true' && !!document.querySelector('.location-settings')`);
  // Activate the selector using the keyboard, not a programmatic click.
  await evaluate(`document.querySelectorAll('.location-settings button')[1].focus()`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', windowsVirtualKeyCode: 13 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await until(`document.querySelector('.prototype-stadium').dataset.location === 'company-grounds'`);
  await evaluate(`[...document.querySelectorAll('.settings label')].find(e=>e.textContent.includes('Custom duration')).querySelector('input').click()`);
  await evaluate(`(()=>{const e=document.querySelector('#race-minutes');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'10');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await evaluate(`document.querySelector('.start-button').click()`);
  await until(`document.querySelector('canvas')?.dataset.cameraView === 'winner'`);
  await click('View Results');
  assert.equal(await evaluate(`parseFloat([...document.querySelectorAll('tbody tr')].at(-1).cells[2].textContent)`), 600);
  await click('New Game');
  await evaluate(`document.querySelector('dialog .primary').click()`);
  await until(`!!document.querySelector('.start-button')`);
  assert.equal(await evaluate(`document.querySelectorAll('.employee-row').length`), 0);
  assert.equal(await evaluate(`document.querySelector('.location-settings button[aria-pressed="true"] strong').textContent`), 'Company Grounds');
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier }); injection = null;
  // Reload defaults; simulate a device without WebGL from first load.
  injection = await send('Page.addScriptToEvaluateOnNewDocument', { source: `const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:get.call(this,type,...args);};` });
  await send('Page.navigate', { url }); await sleep(600); await until(`!!document.querySelector('.track-card')`);
  assert.equal(await evaluate(`document.querySelector('.track-card').dataset.location`), 'stadium');
  await evaluate(`document.querySelectorAll('.location-settings button')[1].click()`); await sleep(100);
  assert.equal(await evaluate(`document.querySelector('.track-card').dataset.location`), 'company-grounds');
  assert.equal(await evaluate(`document.querySelectorAll('.race-lane').length`), 6);
  await evaluate(`document.querySelector('.track-card').scrollIntoView()`); await screenshot('webgl-unavailable');
  assert.deepEqual(b.errors, []);
  console.log('PASS keyboard selection, accelerated ten-minute race, New Game retention, reload default and WebGL-unavailable Company Grounds fallback.');
} finally { if (injection) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier }); b.ws.close(); }
