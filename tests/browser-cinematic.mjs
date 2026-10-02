import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { connect } from './company-browser-helpers.mjs';
const b = await connect();
const { send, evaluate, until, sleep, click } = b;
let injection;
async function advance(ms) { await evaluate(`window.raceOffset+=${ms}`); await sleep(180); }
async function enter() {
  await evaluate(`document.querySelector('[aria-label="Fullscreen cinematic mode"]').click()`);
  await until(`document.fullscreenElement?.classList.contains('race-presentation') && !!document.querySelector('.cinematic-broadcast')`);
}
async function exit() {
  await click('Exit fullscreen ⤢');
  await until(`!document.fullscreenElement && !document.querySelector('.cinematic-broadcast')`);
}
async function shot(name) { const { data } = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(`artifacts/cinematic/${name}.png`, Buffer.from(data, 'base64')); }
try {
  await mkdir('artifacts/cinematic', { recursive: true });
  injection = await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.raceOffset=0;const now=performance.now.bind(performance);performance.now=()=>now()+window.raceOffset;const raf=requestAnimationFrame;requestAnimationFrame=cb=>raf(t=>cb(t+window.raceOffset));` });
  await send('Emulation.setDeviceMetricsOverride', { width:1440, height:900, deviceScaleFactor:1, mobile:false });
  await send('Page.navigate', { url: process.env.COMPANY_TEST_URL || 'http://127.0.0.1:5177' });
  await until(`document.querySelector('.three-viewport')?.dataset.ready==='true'`);
  // Native fullscreen rejection must retain normal mode and an actionable message.
  await evaluate(`window.requestReal=document.querySelector('.race-presentation').requestFullscreen;document.querySelector('.race-presentation').requestFullscreen=()=>Promise.reject(new Error('denied'))`);
  await evaluate(`document.querySelector('[aria-label="Fullscreen cinematic mode"]').click()`);
  await until(`document.querySelector('.error')?.textContent.includes('Fullscreen is unavailable')`);
  assert.equal(await evaluate(`!!document.querySelector('.cinematic-broadcast')`), false);
  await evaluate(`document.querySelector('.race-presentation').requestFullscreen=window.requestReal;document.querySelector('.start-button').click()`);
  await until(`document.querySelector('.event-welcome')?.dataset.phase==='arrival'`);
  await advance(3100); await until(`document.querySelector('.event-welcome')?.dataset.phase==='welcome'`);
  await click('Pause event');
  const phase = await evaluate(`document.querySelector('.event-welcome').dataset.phaseTime`);
  await evaluate(`window.canvasBefore=document.querySelector('canvas');true`);
  await enter();
  assert.equal(await evaluate(`document.querySelector('canvas')===window.canvasBefore`), true);
  assert.equal(await evaluate(`document.querySelectorAll('.cinematic-leaders li').length`), 0);
  assert.equal(await evaluate(`!!document.querySelector('.event-welcome')`), false);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.full-field-locator')).display`), 'none');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.prototype-controls')).display`), 'none');
  assert.equal(await evaluate(`document.activeElement.getAttribute('aria-label')`), 'Exit cinematic fullscreen');
  await shot('welcome-desktop');
  await exit();
  assert.equal(await evaluate(`document.querySelector('.event-welcome').dataset.phaseTime`), phase);
  await click('Resume race');
  await advance(10100); await advance(3100); await advance(4100); await advance(2000);
  await until(`document.querySelector('canvas').dataset.cameraView==='rolling'`);
  await click('Pause event');
  const top = await evaluate(`[...document.querySelectorAll('.broadcast-board .focus-employee')].slice(0,3).map(e=>e.textContent)`);
  await enter();
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.cinematic-leaders li>span')].map(e=>e.textContent)`), top);
  assert.equal(await evaluate(`document.querySelector('canvas').dataset.cameraView`), 'rolling');
  assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('.three-labels')).display`), 'none');
  await until(`[...document.querySelectorAll('.three-name')].some(e=>getComputedStyle(e).visibility==='visible' && getComputedStyle(e.querySelector('.label-name')).display!=='none')`);
  const held = await evaluate(`document.querySelector('.cinematic-clock strong').textContent`);
  await advance(6000);
  assert.equal(await evaluate(`document.querySelector('.cinematic-clock strong').textContent`), held);
  await shot('race-desktop');
  // Context loss and retry preserve the same cinematic presentation and clock.
  await evaluate(`document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`);
  await until(`!![...document.querySelectorAll('button')].find(e=>e.textContent==='Retry 3D')`);
  assert.equal(await evaluate(`[...document.querySelectorAll('.cinematic-actions button')].find(e=>e.textContent==='Resume').disabled`), true);
  await click('Retry 3D'); await until(`document.querySelector('.three-viewport').dataset.ready==='true'`);
  assert.equal(await evaluate(`document.querySelector('.cinematic-clock strong').textContent`), held);
  await click('Resume'); await advance(2000);
  assert.notEqual(await evaluate(`document.querySelector('.cinematic-clock strong').textContent`), held);
  // Browser-initiated exit follows fullscreenchange, as Escape does.
  await evaluate(`document.exitFullscreen()`);
  await until(`!document.querySelector('.cinematic-broadcast')`);
  assert.equal(await evaluate(`document.querySelectorAll('.broadcast-board li').length`), 6);
  await send('Emulation.setDeviceMetricsOverride', { width:390, height:844, deviceScaleFactor:1, mobile:true });
  await enter(); await click('Pause'); await shot('race-mobile');
  assert.ok(await evaluate(`document.fullscreenElement.scrollWidth<=innerWidth`));
  await click('Resume'); await advance(60000);
  await until(`document.querySelector('.cinematic-status').textContent.includes('Race complete')`);
  assert.equal(await evaluate(`document.querySelector('canvas').dataset.cameraView`), 'finish');
  assert.equal(await evaluate(`document.querySelectorAll('.cinematic-leaders li').length`), 3);
  await exit(); await until(`document.querySelector('canvas').dataset.cameraView==='winner'`);
  assert.deepEqual(b.errors, []);
  console.log('PASS cinematic: native entry/exit, rejection, same canvas, opening clock, Top 3, pause, recovery, mobile, results restore');
} finally {
  if (injection) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier });
  b.ws.close();
}
