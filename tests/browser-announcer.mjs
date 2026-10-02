import assert from 'node:assert/strict';
import { connect } from './company-browser-helpers.mjs';
const b=await connect(); const {send,evaluate,until,click,sleep}=b; let injection;
try {
  injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.voiceCalls=[]; window.voiceCancels=0; window.media=[]; window.pendingVoice=null;
    const audio=window.Audio; window.Audio=function(...args){const a=new audio(...args);media.push(a);return a;};
    window.mockVoices=[{voiceURI:'local',name:'Test Device Voice',lang:'en-US',localService:true}];
    const synth=new EventTarget();synth.getVoices=()=>mockVoices;synth.resume=()=>{};synth.cancel=()=>{voiceCancels++;pendingVoice=null;};
    synth.speak=u=>{voiceCalls.push(u.text);pendingVoice=u;setTimeout(()=>{if(pendingVoice===u)u.onstart?.();},10);};
    Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
    window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
    window.raceOffset=0;const now=performance.now.bind(performance);performance.now=()=>now()+raceOffset;const raf=requestAnimationFrame;requestAnimationFrame=cb=>raf(t=>cb(t+raceOffset));
  `});
  await send('Page.navigate',{url:process.env.COMPANY_TEST_URL||'http://127.0.0.1:5177'});
  await until(`document.querySelector('.three-viewport')?.dataset.ready==='true' && !!document.querySelector('[aria-label="Announcer voice"] option[value="local"]')`);
  await click('Test Voice'); await until(`document.querySelector('.announcer-caption')?.textContent.includes('Welcome, racers')`);
  assert.equal(await evaluate(`media.find(a=>a.src.includes('crowd-cheering')).volume`),.075);
  await evaluate(`pendingVoice.onend()`); await until(`!document.querySelector('.announcer-caption')`);
  assert.equal(await evaluate(`media.find(a=>a.src.includes('crowd-cheering')).volume`),.3);
  await evaluate(`mockVoices.push({voiceURI:'remote',name:'Online Test',lang:'en-US',localService:false});speechSynthesis.dispatchEvent(new Event('voiceschanged'))`);
  await until(`document.querySelectorAll('[aria-label="Announcer voice"] option').length===2`);
  assert.equal(await evaluate(`document.querySelector('[aria-label="Announcer voice"]').value`),'local');
  await click('Test Voice');await sleep(100);
  await evaluate(`document.querySelector('.start-button').click()`);
  await until(`document.querySelector('.event-welcome')?.dataset.phase==='arrival'`);
  assert.equal(await evaluate(`!!document.querySelector('.announcer-caption')`),false);
  for(const ms of [3100,10100,3100,4100]){await evaluate(`raceOffset+=${ms}`);await sleep(150);}
  await evaluate(`raceOffset+=1000`);await sleep(150);
  // Sample real motion over time until one genuine event has spoken.
  for(let i=0;i<35;i++){
    if(await evaluate(`voiceCalls.some(t=>/lead|second|comeback|wins/.test(t))`))break;
    await evaluate(`raceOffset+=450`);await sleep(100);
  }
  await until(`voiceCalls.some(t=>/lead|second|comeback|wins/.test(t))`);
  await until(`!!document.querySelector('.announcer-caption')`);
  const text=await evaluate(`document.querySelector('.announcer-caption').textContent`);
  await evaluate(`document.querySelector('[aria-label="Fullscreen cinematic mode"]').click()`);
  await until(`!!document.fullscreenElement`);
  assert.equal(await evaluate(`document.querySelector('.announcer-caption').textContent`),text);
  await evaluate(`document.exitFullscreen()`);await sleep(100);
  if(await evaluate(`!![...document.querySelectorAll('button')].find(b=>b.textContent==='Pause event')`)) {
    await click('Pause event');assert.equal(await evaluate(`!!document.querySelector('.announcer-caption')`),false);
    await click('Resume race');
  }
  await evaluate(`raceOffset+=60000`);await until(`document.querySelector('canvas')?.dataset.cameraView==='winner'`);
  await until(`voiceCalls.some(t=>t.endsWith('wins!'))`);
  assert.equal(await evaluate(`voiceCalls.filter(t=>t.endsWith('wins!')).length`),1);
  await evaluate(`document.querySelector('nav button').click()`);await until(`!document.querySelector('.announcer-caption')`);
  assert.equal(await evaluate(`pendingVoice===null`),true);
  await evaluate(`document.querySelector('nav button').click()`);
  await evaluate(`[...document.querySelectorAll('nav button')].find(b=>b.textContent.includes('Reset')).click()`);
  await click('Reset race'); await until(`!!document.querySelector('.start-button')`);
  await click('Test Voice'); await until(`!!document.querySelector('.announcer-caption')`);
  await evaluate(`Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))`);
  await until(`!document.querySelector('.announcer-caption')`);
  await evaluate(`delete document.hidden`);
  await click('Test Voice');await sleep(50);
  await evaluate(`pendingVoice.onerror()`);
  await until(`document.querySelector('.announcer-controls small')?.textContent.includes('captions only')`);
  assert.equal(await evaluate(`media.find(a=>a.src.includes('crowd-cheering')).volume`),.3);
  await evaluate(`mockVoices=[];speechSynthesis.dispatchEvent(new Event('voiceschanged'))`);
  await until(`document.querySelector('[aria-label="Announcer voice"]').disabled`);
  await click('Test Voice');await until(`document.querySelector('.announcer-caption')?.textContent.includes('Welcome, racers')`);
  assert.deepEqual(b.errors,[]);
  console.log('PASS: voice loading, Test Voice, duck/restore, test cancellation, live speech, fullscreen continuity, pause, winner once, master mute');
} finally {if(injection)await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});b.ws.close();}
