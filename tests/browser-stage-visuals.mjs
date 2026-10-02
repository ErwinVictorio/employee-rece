import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { connect } from './company-browser-helpers.mjs';
const b = await connect();
const reports = [];
try {
  await mkdir('artifacts/stage-upgrade', { recursive: true });
  for (const [venue, count, mobile] of [['stadium', 6, false], ['company-grounds', 6, false], ['company-grounds', 6, true], ['stadium', 100, true], ['company-grounds', 100, false]]) {
    await b.send('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1440, height: mobile ? 844 : 1080, deviceScaleFactor: 1, mobile });
    await b.send('Page.navigate', { url: process.env.COMPANY_TEST_URL || 'http://127.0.0.1:5177' });
    await b.until(`document.querySelector('.three-viewport')?.dataset.ready === 'true'`);
    if (count > 6) {
      await b.evaluate(`(()=>{const e=document.querySelector('#bulk-names');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,Array.from({length:${count - 6}},(_,i)=>'Employee '+(i+7)).join(String.fromCharCode(10)));e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
      await b.click('Add pasted names');
    }
    if (venue === 'company-grounds') await b.evaluate(`document.querySelectorAll('.location-settings button')[1].click()`);
    await b.evaluate(`document.querySelector('.start-button').click()`);
    await b.until(`document.querySelector('.event-welcome')?.dataset.phase === 'welcome'`);
    await b.sleep(800); await b.click('Pause event');
    await b.evaluate(`document.querySelector('.prototype-stadium').scrollIntoView()`);
    await b.sleep(200);
    assert.equal(await b.evaluate(`document.querySelectorAll('.broadcast-board li').length`), count);
    assert.ok(await b.evaluate(`document.documentElement.scrollWidth <= innerWidth`));
    const { data } = await b.send('Page.captureScreenshot', { format: 'png' });
    await writeFile(`artifacts/stage-upgrade/${venue}-${count}-${mobile ? 'mobile' : 'desktop'}.png`, Buffer.from(data, 'base64'));
    reports.push({ venue, count, mobile, metrics: await b.evaluate(`({...document.querySelector('canvas').dataset})`) });
    console.log('PASS', venue, count, mobile ? 'mobile' : 'desktop');
  }
  assert.deepEqual(b.errors, []);
  await writeFile('artifacts/stage-upgrade/report.json', JSON.stringify(reports, null, 2));
} finally { b.ws.close(); }
