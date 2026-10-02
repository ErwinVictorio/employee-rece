import assert from 'node:assert/strict';
import { connect } from './company-browser-helpers.mjs';
const b = await connect();
const { send, evaluate, until, click, sleep } = b;
try {
  await send('Page.navigate', { url: process.env.COMPANY_TEST_URL || 'http://127.0.0.1:5177' });
  await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true'`);
  assert.equal(await evaluate(`!!document.querySelector('[aria-label="Presentation"]')`), false);
  assert.equal(await evaluate(`[...document.querySelectorAll('button,option')].some(e=>/2D/.test(e.textContent))`), false);
  await evaluate(`document.querySelector('.start-button').click()`);
  await until(`document.querySelector('.event-welcome')?.dataset.phase === 'welcome'`);
  await click('Pause event');
  const saved = await evaluate(`document.querySelector('.event-welcome').dataset.phaseTime`);
  const roster = await evaluate(`[...document.querySelectorAll('.broadcast-board li')].map(e=>e.textContent)`);
  await evaluate(`document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`);
  await until(`!![...document.querySelectorAll('button')].find(e=>e.textContent==='Retry 3D')`);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(e=>e.textContent==='Resume race').disabled`), true);
  await click('Retry 3D');
  await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true'`);
  await sleep(500);
  assert.equal(await evaluate(`document.querySelector('.event-welcome').dataset.phaseTime`), saved);
  assert.deepEqual(await evaluate(`[...document.querySelectorAll('.broadcast-board li')].map(e=>e.textContent)`), roster);
  await click('Resume race');
  await until(`Number(document.querySelector('.event-welcome')?.dataset.phaseTime) > ${Number(saved) + .2}`);
  assert.deepEqual(b.errors, []);
  console.log('PASS: 3D-only controls; WebGL loss, retry, saved phase/roster, explicit resume');
} finally { b.ws.close(); }
