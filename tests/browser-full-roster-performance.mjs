import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { connect } from './company-browser-helpers.mjs';
const b=await connect();const samples=[];
try {
 await b.send('Runtime.discardConsoleEntries'); b.errors.length=0;
 for(const mobile of [false,true]) for(const venue of ['stadium','company-grounds']) for(const low of [true,false]) {
  await b.send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1440,height:mobile?844:1080,deviceScaleFactor:1,mobile});
  await b.send('Page.navigate',{url:process.env.COMPANY_TEST_URL || 'http://127.0.0.1:5175'});
  await b.until(`document.querySelector('.three-viewport')?.dataset.ready==='true' && !!document.querySelector('#bulk-names')`);
  await b.evaluate(`(()=>{const e=document.querySelector('#bulk-names');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,Array.from({length:94},(_,i)=>'Employee '+(i+7)).join(String.fromCharCode(10)));e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await b.click('Add pasted names');
  if(venue==='company-grounds') await b.evaluate(`document.querySelectorAll('.location-settings button')[1].click()`);
  if(!low) await b.evaluate(`document.querySelector('.prototype-controls input').click()`);
  await b.until(`document.querySelector('canvas')?.dataset.renderedRunners==='100'`);
  await b.evaluate(`document.querySelector('.start-button').click()`);
  await b.until(`document.querySelector('canvas')?.dataset.cameraView==='rolling'`);
  await b.sleep(1800);
  for(const mode of ['rolling','overview']) {
   if(mode==='overview') {await b.click('All runners');await b.sleep(1100);}
   const sample=await b.evaluate(`new Promise(resolve=>{const times=[];let previous;function tick(t){if(previous)times.push(t-previous);previous=t;if(times.length<120)requestAnimationFrame(tick);else{const sorted=[...times].sort((a,b)=>a-b);const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');resolve({meanMs:times.reduce((a,b)=>a+b,0)/times.length,p95Ms:sorted[Math.floor(times.length*.95)],...canvas.dataset,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown'});}}requestAnimationFrame(tick);})`);
   samples.push({mobile,venue,low,mode,...sample,fps:1000/sample.meanMs});console.log(samples.at(-1));
  }
 }
 assert.deepEqual(b.errors,[]);
 await writeFile('artifacts/full-roster/performance.json',JSON.stringify(samples,null,2));
} finally {b.ws.close();}
