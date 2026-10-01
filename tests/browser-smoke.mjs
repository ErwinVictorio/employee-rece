import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const pages = await (await fetch('http://127.0.0.1:9334/json/list')).json()
const ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl)
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }))
let seq = 0
const pending = new Map()
const errors = []
ws.addEventListener('message', e => {
  const message = JSON.parse(e.data)
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
  if (message.id && pending.has(message.id)) { const { resolve, reject } = pending.get(message.id); pending.delete(message.id); if (message.error) reject(message.error); else resolve(message.result) }
})
function send(method, params = {}) { return new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })) }) }
async function evaluate(expression) { const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value }
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
async function until(expression, timeout = 20000) { const start = Date.now(); while (Date.now() - start < timeout) { if (await evaluate(expression)) return; await sleep(100) } throw new Error(`Timeout: ${expression}`) }
async function click(text) { await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(text)})?.click()`); await sleep(150) }
async function name(value) { await evaluate(`(() => { const input = document.querySelector('#employee-name'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`); await sleep(100) }
async function screenshot(file) { const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); await writeFile(`artifacts/${file}.png`, Buffer.from(data, 'base64')) }
try {
  await mkdir('artifacts', { recursive: true })
  await send('Runtime.enable'); await send('Runtime.discardConsoleEntries'); errors.length = 0; await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://127.0.0.1:5173' })
  await until(`document.querySelectorAll('.employee-row').length === 6`)
  await evaluate(`(() => { const select = document.querySelector('[aria-label=Presentation]'); select.value = '2d'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`)
  await until(`Array.from(document.images).every(i => i.complete && i.naturalWidth > 0)`)
  await screenshot('setup-desktop')
  await name('   '); await click('+ Add'); assert.ok(await evaluate(`document.querySelector('[role=alert]').textContent.includes('Enter')`))
  const { root } = await send('DOM.getDocument')
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector: 'input[type=file]' })
  await send('DOM.setFileInputFiles', { nodeId, files: [new URL('../src/assets/character/RedRunner.png', import.meta.url).pathname.replace(/^\//, '').replaceAll('%20', ' ')] })
  await until(`!!document.querySelector('.upload-preview')`)
  await name('Browser Racer'); await click('+ Add'); assert.equal(await evaluate(`document.querySelectorAll('.employee-row').length`), 7)
  assert.equal(await evaluate(`document.querySelectorAll('.employee-row img.photo').length`), 1)
  await evaluate(`document.querySelector('[aria-label="Edit Browser Racer"]').click()`); await name('Edited Racer'); await click('Save')
  assert.ok(await evaluate(`!!document.querySelector('[aria-label="Edit Edited Racer"]')`))
  await evaluate(`document.querySelector('[aria-label="Remove Edited Racer"]').click()`)
  await click('10SEC')
  await click('Start Race →')
  await until(`!!document.querySelector('.countdown-overlay')`)
  await screenshot('countdown')
  await click('↺ Reset'); await click('Cancel')
  assert.equal(await evaluate(`document.querySelectorAll('.employee-row').length`), 0)
  await until(`document.querySelectorAll('.running').length > 0`)
  await sleep(2000); await screenshot('racing')
  await until(`!!document.querySelector('.results-panel')`)
  await click('View Results')
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`), 6)
  const result = await evaluate(`Array.from(document.querySelectorAll('tbody tr')).map(row => ({ name: row.cells[1].textContent, time: parseFloat(row.cells[2].textContent) }))`)
  assert.equal(new Set(result.map(r => r.name)).size, 6)
  assert.ok(result.every((r, i) => !i || r.time > result[i - 1].time))
  assert.equal(await evaluate(`document.querySelector('.winner-heading h2').textContent`), result[0].name)
  const lanes = await evaluate(`Array.from(document.querySelectorAll('.race-lane')).map(l => ({ name: l.querySelector('.lane-label b').textContent, rank: Number(l.querySelector('.finish-rank').textContent) }))`)
  lanes.forEach(l => assert.equal(result[l.rank - 1].name, l.name))
  await screenshot('results-desktop')
  await click('↻ Race Again'); await until(`!!document.querySelector('.countdown-overlay')`)
  await click('↺ Reset'); await click('Reset race'); await until(`document.querySelectorAll('.employee-row').length === 6`)
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await screenshot('setup-mobile')
  assert.ok(await evaluate(`document.documentElement.scrollWidth <= window.innerWidth`))
  for (let i = 6; i < 12; i++) { await name(`Employee ${i}`); await click('+ Add') }
  assert.equal(await evaluate(`document.querySelectorAll('.employee-row').length`), 12)
  assert.ok(await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent === '+ Add').disabled`))
  await click('Start Race →'); await until(`!!document.querySelector('.results-panel')`)
  await click('New Game'); await click('Cancel'); assert.ok(await evaluate(`!!document.querySelector('.results-panel')`))
  await click('New Game'); await evaluate(`document.querySelector('dialog .primary').click()`); await until(`!!document.querySelector('#employee-name')`)
  assert.equal(await evaluate(`document.querySelectorAll('.employee-row').length`), 0)
  assert.ok(await evaluate(`document.querySelector('.start-button').disabled`))
  assert.deepEqual(errors, [])
  console.log('PASS: desktop/mobile, CRUD, blank/maximum validation, countdown, finish order, results, replay, cancel-safe reset/new game; no runtime exceptions.')
} finally { ws.close() }
