import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { connect } from './company-browser-helpers.mjs';

const b = await connect();
const { send, evaluate, sleep, until, click, screenshot } = b;
const venue = async index => {
  await evaluate(`document.querySelectorAll('.location-settings button')[${index}].click()`);
  await until(`document.querySelector('.prototype-stadium')?.dataset.location === '${index ? 'company-grounds' : 'stadium'}'`);
  await sleep(600);
};
const metrics = () => evaluate(`({...document.querySelector('canvas').dataset})`);
try {
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: process.env.COMPANY_TEST_URL || 'http://127.0.0.1:5175' });
  await sleep(1000);
  await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true' && !!document.querySelector('.location-settings')`);
  assert.equal(await evaluate(`document.querySelector('.prototype-stadium').dataset.location`), 'stadium');
  await evaluate(`document.querySelector('.prototype-stadium').scrollIntoView()`);
  await screenshot('stadium-final');
  const stadium = await metrics();
  await venue(1);
  await screenshot('company-desktop');
  const company = await metrics();
  await click('Rolling camera'); await screenshot('company-side'); await click('All runners');
  for (let i = 0; i < 4; i++) { await venue(0); await venue(1); }
  assert.equal(await evaluate(`document.querySelectorAll('canvas').length`), 1);
  const afterSwitches = await metrics();
  assert.equal(afterSwitches.geometries, company.geometries);
  assert.equal(afterSwitches.textures, company.textures);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(300); await evaluate(`document.querySelector('.prototype-stadium').scrollIntoView()`); await screenshot('company-mobile');
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });
  await click('10SEC');
  await evaluate(`document.querySelector('.start-button').click()`);
  await until(`!!document.querySelector('.three-countdown')`);
  await sleep(4300);
  await screenshot('company-racing');
  await evaluate(`document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`);
  await until(`document.body.textContent.includes('3D rendering paused')`);
  const clock = await evaluate(`document.querySelector('.race-hud').textContent`);
  await sleep(400); assert.equal(await evaluate(`document.querySelector('.race-hud').textContent`), clock);
  await click('Retry 3D');
  await until(`document.querySelector('.three-viewport')?.dataset.ready === 'true'`);
  assert.equal(await evaluate(`document.querySelector('.prototype-stadium').dataset.location`), 'company-grounds');
  await click('Resume race');
  await until(`document.querySelector('canvas')?.dataset.cameraView === 'winner'`);
  await screenshot('company-winner');
  const winner = await evaluate(`document.querySelector('canvas').dataset.winnerId`);
  await click('Use 2D');
  assert.equal(await evaluate(`document.querySelector('.track-card').dataset.location`), 'company-grounds');
  assert.ok(await evaluate(`!!document.querySelector('.company-banner')`));
  await screenshot('company-2d-results');
  assert.equal(await evaluate(`document.querySelectorAll('.full-standings li').length`), 6);
  assert.deepEqual(b.errors, []);
  await writeFile('artifacts/company-grounds/measurements.json', JSON.stringify({ stadium, company, afterSwitches, winner, errors: b.errors }, null, 2));
  console.log('Company Grounds switching, resource stability, mobile, race, context recovery, podium and 2D results passed.');
} finally { b.ws.close(); }
