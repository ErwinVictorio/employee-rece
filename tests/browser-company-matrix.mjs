import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { connect } from './company-browser-helpers.mjs';

const b = await connect();
const { send, evaluate, until, sleep, click, screenshot } = b;
const url = process.env.COMPANY_TEST_URL || 'http://127.0.0.1:5175';
const cases = [];
let injection;
async function load() {
  await send('Page.navigate', { url }); await sleep(600);
  await until(`!!document.querySelector('.location-settings') && document.querySelector('.three-viewport')?.dataset.ready === 'true'`);
}
async function roster(count) {
  if (count < 6) for (let i = 6; i > count; i--) {
    await evaluate(`document.querySelector('.employee-row button[aria-label^="Remove"]').click()`); await sleep(50);
  }
  if (count > 6) {
    await evaluate(`(()=>{const e=document.querySelector('#bulk-names');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,Array.from({length:${count - 6}},(_,i)=>'Employee '+(i+7)).join(String.fromCharCode(10)));e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await click('Add pasted names');
  }
  await until(`document.querySelectorAll('.employee-row').length === ${count}`);
}
async function selectCompany() { await evaluate(`document.querySelectorAll('.location-settings button')[1].click()`); await sleep(350); }
async function start() { await evaluate(`document.querySelector('.start-button').click()`); await until(`!!document.querySelector('.three-countdown')`); }
try {
  injection = await send('Page.addScriptToEvaluateOnNewDocument', { source: `const now=performance.now.bind(performance),base=now(),scale=t=>base+(t-base)*15;performance.now=()=>scale(now());const raf=requestAnimationFrame;window.requestAnimationFrame=cb=>raf(t=>cb(scale(t)));` });
  for (const count of [2, 12, 13, 100]) {
    await send('Emulation.setDeviceMetricsOverride', { width: count === 13 ? 768 : 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
    await load(); await roster(count); await selectCompany(); await click('10SEC');
    if (count === 12) {
      await evaluate(`document.querySelector('.prototype-controls input').click()`);
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    }
    await start();
    await evaluate(`Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));`);
    await until(`[...document.querySelectorAll('button')].some(b=>b.textContent === 'Resume race')`);
    await sleep(100);
    const clock = await evaluate(`document.querySelector('.race-hud').textContent`);
    await sleep(300); assert.equal(await evaluate(`document.querySelector('.race-hud').textContent`), clock);
    assert.equal(await evaluate(`document.querySelectorAll('.broadcast-board li').length`), count);
    if (count > 12) {
      await evaluate(`(()=>{const s=document.querySelector('[aria-label="Focus lane"]');s.value='${count - 1}';s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      await until(`document.querySelectorAll('.three-name').length === ${count}`);
      assert.equal(await evaluate(`document.querySelector('.prototype-stadium').dataset.environmentLanes`), String(count));
    }
    await evaluate(`document.querySelector('.prototype-stadium').scrollIntoView()`); await screenshot(`roster-${count}`);
    if (count === 100) {
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      await sleep(300); assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
      await screenshot('roster-100-mobile');
    }
    await evaluate(`delete document.hidden; document.dispatchEvent(new Event('visibilitychange'));`); await click('Resume race');
    await until(`document.querySelector('canvas')?.dataset.cameraView === 'finish'`);
    await screenshot(`finish-${count}`);
    await until(`document.querySelector('canvas')?.dataset.cameraView === 'winner'`);
    if (count === 100) await screenshot('winner-mobile');
    const winner = await evaluate(`document.querySelector('canvas').dataset.winnerId`);
    await click('View Results');
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`), count);
    const times = await evaluate(`Array.from(document.querySelectorAll('tbody tr')).map(r=>parseFloat(r.cells[2].textContent))`);
    assert.ok(times.every((time, i) => !i || time > times[i - 1]));
    cases.push({ count, winner, first: times[0], last: times.at(-1) });
    await click('Edit Participants');
    assert.equal(await evaluate(`document.querySelector('.location-settings button[aria-pressed="true"] strong').textContent`), 'Company Grounds');
    await send('Emulation.setEmulatedMedia', { features: [] });
  }
  // Long custom race, replay, reset cancellation/confirmation and New Game.
  await load(); await selectCompany();
  await evaluate(`[...document.querySelectorAll('.settings label')].find(e=>e.textContent.includes('Custom duration')).querySelector('input').click()`);
  await start(); await until(`document.querySelector('canvas')?.dataset.cameraView === 'winner'`);
  await evaluate(`document.querySelector('.spotlight-actions .primary').click()`);
  await until(`!!document.querySelector('.three-countdown')`);
  assert.equal(await evaluate(`document.querySelectorAll('.broadcast-board li').length`), 5);
  await click('Stop race'); await click('Cancel');
  assert.equal(await evaluate(`document.querySelector('.prototype-stadium').dataset.location`), 'company-grounds');
  await click('Stop race'); await click('Reset race');
  assert.equal(await evaluate(`document.querySelector('.location-settings button[aria-pressed="true"] strong').textContent`), 'Company Grounds');
  // A cancelled worker preparation must not revive a countdown.
  await roster(100);
  await evaluate(`document.querySelector('.start-button').click()`);
  await until(`document.body.textContent.includes('Cancel preparation')`);
  await click('Cancel preparation'); await sleep(1000);
  assert.ok(await evaluate(`!!document.querySelector('.start-button') && !document.querySelector('.three-countdown')`));
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier }); injection = null;
  assert.deepEqual(b.errors, []);
  await writeFile('artifacts/company-grounds/matrix.json', JSON.stringify(cases, null, 2));
  console.log('PASS Company Grounds 2/12/13/100 entrants, worker, lane groups, tablet/mobile, reduced motion, normal quality, visibility, finish cameras, full standings, replay, reset and cancellation.');
} finally {
  if (injection) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier });
  b.ws.close();
}
