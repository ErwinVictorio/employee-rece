import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { connect } from './company-browser-helpers.mjs';
const b = await connect();
const { send, evaluate, until, sleep, click } = b;
let injection;
async function shot(name) {
  await evaluate(`document.querySelector('.prototype-stadium, .track-card').scrollIntoView()`);
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(`artifacts/event-stage/${name}.png`, Buffer.from(data, 'base64'));
}
async function phase(value) { await until(`document.querySelector('.event-welcome')?.dataset.phase === '${value}'`); }
async function advance(ms) { await evaluate(`window.eventOffset += ${ms}`); await sleep(200); }
async function setup(count, venue, mobile = false, reduced = false) {
  await send('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1440, height: mobile ? 844 : 1080, deviceScaleFactor: 1, mobile });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
  await send('Page.navigate', { url: process.env.COMPANY_TEST_URL || 'http://127.0.0.1:5177' });
  await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true' && !!document.querySelector('#bulk-names')`);
  if (count < 6) for (let i = 6; i > count; i--) { await evaluate(`document.querySelector('[aria-label^="Remove "]').click()`); await sleep(40); }
  if (count > 6) {
    await evaluate(`(() => { const e = document.querySelector('#bulk-names'); Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(e, Array.from({length:${count - 6}}, (_,i) => 'Employee ' + (i + 7)).join(String.fromCharCode(10))); e.dispatchEvent(new Event('input', {bubbles:true})); })()`);
    await click('Add pasted names');
  }
  if (venue === 'company-grounds') await evaluate(`document.querySelectorAll('.location-settings button')[1].click()`);
  await until(`!document.querySelector('.start-button').disabled`);
  await evaluate(`document.querySelector('.start-button').click(); document.querySelector('.start-button')?.click()`);
  await phase('arrival');
}
try {
  await mkdir('artifacts/event-stage', { recursive: true });
  injection = await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.eventOffset=0; const now=performance.now.bind(performance); performance.now=()=>now()+window.eventOffset; const raf=requestAnimationFrame; window.requestAnimationFrame=cb=>raf(t=>cb(t+window.eventOffset)); window.audioPlays=[]; const play=HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play=function(){window.audioPlays.push({src:this.src,phase:document.querySelector('.event-welcome')?.dataset.phase,countdown:!!document.querySelector('.three-countdown,.countdown-overlay')}); return play.call(this);};` });
  const cases = [];
  for (const venue of ['stadium', 'company-grounds']) for (const count of [2, 12, 13, 25, 50, 100]) {
    await setup(count, venue, count === 100, count === 50);
    assert.equal(await evaluate(`document.querySelectorAll('.broadcast-board li').length`), count);
    await advance(3100); await phase('welcome');
    const start = Number(await evaluate(`document.querySelector('.event-welcome').dataset.phaseTime`));
    assert.ok(start < 1);
    assert.equal(await evaluate(`document.querySelectorAll('.three-countdown').length`), 0);
    await click('Pause event');
    const held = await evaluate(`document.querySelector('.event-welcome').dataset.phaseTime`);
    await advance(10000);
    assert.equal(await evaluate(`document.querySelector('.event-welcome').dataset.phaseTime`), held);
    if ([2, 100].includes(count)) await shot(`${venue}-${count}-welcome`);
    await click('Resume race');
    await advance(6000); await phase('welcome');
    assert.ok(Number(await evaluate(`document.querySelector('.event-welcome').dataset.phaseTime`)) < 9);
    assert.equal(await evaluate(`window.audioPlays.filter(p=>p.phase && p.src.includes('race-start-beeps')).length`), 0);
    await advance(4100); await phase('lineup');
    if (count === 100) { await click('Pause event'); await shot(`${venue}-${count}-lineup`); await click('Resume race'); }
    await advance(3100); await until(`!!document.querySelector('.three-countdown')`);
    await click('Pause event');
    const countdown = await evaluate(`document.querySelector('.three-countdown strong').textContent`);
    await advance(5000);
    assert.equal(await evaluate(`document.querySelector('.three-countdown strong').textContent`), countdown);
    if (count === 100) await shot(`${venue}-${count}-countdown`);
    await click('Resume race'); await advance(4100); await advance(2000);
    await until(`Number(document.querySelector('.broadcast-timer strong')?.textContent.replace(':',''))>0`);
    if (count === 100) { await click('Pause event'); await shot(`${venue}-${count}-racing`); await click('Resume race'); }
    await advance(60000); await until(`!!document.querySelector('.winner-spotlight-overlay, .winner-overlay') || document.querySelector('canvas')?.dataset.cameraView === 'winner'`);
    await click('View Results');
    assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`), count);
    assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
    cases.push({ venue, count }); console.log('PASS', venue, count);
  }
  assert.deepEqual(b.errors, []);
  await writeFile('artifacts/event-stage/matrix.json', JSON.stringify(cases, null, 2));
} finally {
  if (injection) await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier });
  b.ws.close();
}
