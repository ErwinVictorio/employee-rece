import { mkdir, writeFile } from 'node:fs/promises';
export async function connect() {
  const pages = await (await fetch('http://127.0.0.1:9334/json/list')).json();
  const ws = new WebSocket(pages.find(p => p.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let seq = 0; const pending = new Map(); const errors = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (pending.has(message.id)) { const { resolve, reject } = pending.get(message.id); pending.delete(message.id); if (message.error) reject(message.error); else resolve(message.result); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async (expression, timeout = 45000) => { const start = Date.now(); while (Date.now() - start < timeout) { if (await evaluate(expression)) return; await sleep(150); } throw new Error(`Timeout: ${expression}`); };
  const click = async text => { if (!await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === ${JSON.stringify(text)}); if (!b || b.disabled) return false; b.click(); return true; })()`)) throw new Error(`Unavailable: ${text}`); await sleep(100); };
  const screenshot = async name => { await mkdir('artifacts/company-grounds', { recursive: true }); const { data } = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(`artifacts/company-grounds/${name}.png`, Buffer.from(data, 'base64')); };
  await send('Runtime.enable'); await send('Page.enable');
  return { ws, send, evaluate, sleep, until, click, screenshot, errors };
}
