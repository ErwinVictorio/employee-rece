import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { connect } from './company-browser-helpers.mjs';
import { raceTiming } from '../src/utils/roster.js';
const b = await connect();
const { send, evaluate, until, sleep, click } = b;
const cases = [];
let injection;
async function screenshot(name) {
 await evaluate(`document.querySelector('.prototype-stadium').scrollIntoView()`);
 const { data } = await send('Page.captureScreenshot', { format: 'png' });
 await writeFile(`artifacts/full-roster/${name}.png`, Buffer.from(data,'base64'));
}
async function pause() {
 await evaluate(`Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));`);
 await until(`[...document.querySelectorAll('button')].some(b=>b.textContent==='Resume race')`);
}
async function resume() {
 await evaluate(`delete document.hidden`); await click('Resume race');
}
try {
 await mkdir('artifacts/full-roster',{recursive:true});
 await send('Runtime.discardConsoleEntries'); b.errors.length=0;
 injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.raceOffset=0;const realNow=performance.now.bind(performance);performance.now=()=>realNow()+window.raceOffset;const raf=requestAnimationFrame;window.requestAnimationFrame=cb=>raf(t=>cb(t+window.raceOffset));`});
 for (const mobile of [false,true]) for(const venue of ['stadium','company-grounds']) for(const count of [2,12,13,25,50,100]) {
  await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:1080,deviceScaleFactor:1,mobile});
  await send('Page.navigate',{url:process.env.COMPANY_TEST_URL || 'http://127.0.0.1:5175'});
  await until(`document.querySelector('.three-viewport')?.dataset.ready==='true' && !!document.querySelector('#bulk-names')`);
  if(count<6) for(let i=6;i>count;i--){await evaluate(`document.querySelector('[aria-label^="Remove "]').click()`);await sleep(30);}
  if(count>6){
   await evaluate(`(()=>{const e=document.querySelector('#bulk-names');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,Array.from({length:${count-6}},(_,i)=>'Employee '+(i+7)).join(String.fromCharCode(10)));e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
   await click('Add pasted names');
  }
  if(venue==='company-grounds') await evaluate(`document.querySelectorAll('.location-settings button')[1].click()`);
  await click('30SEC');
  await until(`document.querySelectorAll('.three-name').length===${count}`);
  assert.equal(await evaluate(`document.querySelector('.prototype-stadium').dataset.environmentLanes`),String(count));
  assert.equal(await evaluate(`document.querySelectorAll('.full-field-locator circle').length`),count);
  assert.equal(await evaluate(`document.querySelectorAll('.broadcast-board li').length`),count);
  assert.equal(await evaluate(`document.querySelector('canvas').dataset.cameraView`),'overview');
  if(count===100) await screenshot(`${venue}-${mobile?'mobile':'desktop'}-overview`);
  await evaluate(`document.querySelector('.start-button').click()`);
  await until(`!!document.querySelector('.three-countdown')`);
  await evaluate(`window.raceOffset+=6500`);
  await until(`document.querySelector('canvas')?.dataset.cameraView==='rolling'`);
  await pause();
  await sleep(1000);
  const saved=await evaluate(`document.querySelector('canvas').dataset.cameraTargetZ`);
  await sleep(300);
  assert.equal(await evaluate(`document.querySelector('canvas').dataset.cameraTargetZ`),saved,'paused camera holds');
  assert.equal(await evaluate(`document.querySelectorAll('.three-name').length`),count);
  if(count>12) assert.equal(await evaluate(`document.querySelector('canvas').dataset.renderedRunners`),String(count));
  if(count===100){
   await screenshot(`${venue}-${mobile?'mobile':'desktop'}-rolling`);
   await evaluate(`document.querySelectorAll('.broadcast-board .focus-employee')[50].click()`);
   await sleep(1200);
   assert.notEqual(await evaluate(`document.querySelector('canvas').dataset.cameraTargetZ`),saved);
   const labels = await evaluate(`Array.from(document.querySelectorAll('.three-name')).filter(e=>getComputedStyle(e).visibility==='visible').map(e=>({name:e.title,shown:getComputedStyle(e.querySelector('.label-name')).display}))`);
   assert.ok(labels.length>0 && labels.every(l=>l.shown!=='none'),'readable close names');
   await click('Resume auto camera');await sleep(1100);
   assert.equal(await evaluate(`document.querySelector('canvas').dataset.cameraTargetZ`),saved);
   await click('All runners');await sleep(1100);
   assert.equal(await evaluate(`document.querySelector('canvas').dataset.cameraView`),'overview');
   await screenshot(`${venue}-${mobile?'mobile':'desktop'}-mid-overview`);
   await click('Rolling camera');await sleep(1100);
  }
  const timing=raceTiming(count,30);
  await resume();
  await evaluate(`window.raceOffset+=${(timing.duration*timing.splitFraction)*1000}`);
  await until(`document.querySelector('canvas')?.dataset.cameraBlend==='1.000'`);
  await pause();
  if(count===100) await screenshot(`${venue}-${mobile?'mobile':'desktop'}-finish`);
  assert.equal(await evaluate(`document.querySelectorAll('.full-field-locator circle').length`),count);
  assert.ok(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'no horizontal overflow');
  await resume();await evaluate(`window.raceOffset+=${timing.duration*1000}`);
  await until(`document.querySelector('canvas')?.dataset.cameraView==='winner'`);
  await click('View Results');
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`),count);
  const times=await evaluate(`[...document.querySelectorAll('tbody tr')].map(r=>parseFloat(r.cells[2].textContent))`);
  assert.ok(times.every((t,i)=>!i||t>times[i-1]));
  cases.push({mobile,venue,count,results:times.length});console.log('PASS',cases.at(-1));
 }
 assert.deepEqual(b.errors,[]);
 await writeFile('artifacts/full-roster/matrix.json',JSON.stringify(cases,null,2));
} finally { if(injection) await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});b.ws.close(); }
