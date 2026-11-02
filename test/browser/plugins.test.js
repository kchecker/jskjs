/* Real-browser tests for the add-ons. Run: node test/browser/plugins.test.js  (CHROME=/path/to/chromium optional) */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..');
const types = { '.js': 'application/javascript', '.html': 'text/html' };
const server = http.createServer((req, res) => {
  if (req.url.startsWith('/stream')) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    let n = 0;
    const id = setInterval(() => {
      n++;
      res.write('event: message\ndata: <li>tick ' + n + '</li>\n\n');
      if (n === 3) { clearInterval(id); res.write('retry: 600000\n\n'); res.end(); }
    }, 80);
    req.on('close', () => clearInterval(id));
    return;
  }
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'text/plain' }); res.end(b); });
}).listen(0);
const BASE = 'http://127.0.0.1:' + server.address().port;
let pass = 0, fail = 0;
const t = (name, ok, info) => { ok ? pass++ : (fail++, console.log('FAIL', name, info !== undefined ? JSON.stringify(info) : '')); };
const W = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push(m.text()); });
  await pg.goto(BASE + '/test/browser/plugins.html');
  await pg.waitForFunction(() => window.__ready);
  await W(200);

  /* ---- Scroll ---- */
  const scroll = await pg.evaluate(async () => {
    const log = [];
    const box = document.createElement('div'); box.id = 'stbox'; box.style.cssText = 'height:50px;background:#fc9;margin-top:900px'; document.body.appendChild(box);
    const pad = document.createElement('div'); pad.style.height = '1500px'; document.body.appendChild(pad);
    const tw = $.to('#stbox', { x: 300, ease: 'none', scrollTrigger: { trigger: '#stbox', start: 'top bottom', end: 'top top', scrub: true, onEnter: () => log.push('enter'), onLeave: () => log.push('leave') } });
    $.ScrollTrigger.refresh();
    const st = tw.scrollTrigger;
    const mid = (st.start + st.end) / 2;
    window.scrollTo(0, mid); await new Promise(r => setTimeout(r, 120));
    const p = tw.progress();
    window.scrollTo(0, st.end + 50); await new Promise(r => setTimeout(r, 120));
    const end = tw.progress();
    const pinSt = $.scrollTrigger({ trigger: '#pin', pin: true, start: 'top top', end: '+=300' });
    window.scrollTo(0, pinSt.start + 100); await new Promise(r => setTimeout(r, 120));
    const fixed = getComputedStyle(document.getElementById('pin')).position;
    window.scrollTo(0, pinSt.end + 100); await new Promise(r => setTimeout(r, 120));
    const after = getComputedStyle(document.getElementById('pin')).position;
    window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 120));
    const before = getComputedStyle(document.getElementById('pin')).position;
    const spacer = document.querySelector('.kj-pin-spacer') && document.querySelector('.kj-pin-spacer').offsetHeight;
    return { p, end, log, fixed, after, before, spacer, startLtEnd: st.start < st.end };
  });
  t('scrollTrigger computes start < end', scroll.startLtEnd, scroll);
  t('scrub maps scroll to progress (~0.5 mid-way)', Math.abs(scroll.p - 0.5) < 0.1, scroll.p);
  t('scrub reaches 1 past the end', scroll.end === 1, scroll.end);
  t('onEnter / onLeave fire', scroll.log.join() === 'enter,leave', scroll.log);
  t('pin: fixed while active', scroll.fixed === 'fixed', scroll.fixed);
  t('pin: released after end', scroll.after !== 'fixed' && scroll.before !== 'fixed', [scroll.after, scroll.before]);
  t('pin spacer adds pinSpacing', scroll.spacer >= 300, scroll.spacer);
  const scrolled = await pg.evaluate(async () => { await $.scrollTo('#pin', { duration: 0.2, offset: 10 }); return Math.round(window.scrollY); });
  t('$.scrollTo lands on target', scrolled > 0, scrolled);

  /* ---- Flip ---- */
  const flip = await pg.evaluate(async () => {
    window.scrollTo(0, 0);
    const cards = $('#grid .card');
    const before = cards.get().map(c => c.getBoundingClientRect().left);
    const tl = cards.flip(() => $('#grid').addClass('list'), { duration: 0.3, ease: 'none' });
    await new Promise(r => setTimeout(r, 50));
    const during = document.querySelectorAll('#grid .card')[1].style.transform;
    await tl;
    const after = cards.get().map(c => c.getBoundingClientRect().left);
    return { during, before, after, cleared: cards.get().every(c => !/translate\((?!0px, ?0px)/.test(c.style.transform || '')) };
  });
  t('Flip animates from the old position', /translate/.test(flip.during), flip.during);
  t('Flip ends in the new layout, transforms cleared', flip.cleared && flip.after[1] === flip.after[0], flip);

  /* ---- Drag ---- */
  await pg.evaluate(() => { window.__drag = $.Draggable.create('#knob', { type: 'x', bounds: '#track', onDragEnd() { window.__dragEnd = this.x; } })[0]; });
  const kb = await pg.locator('#knob').boundingBox();
  await pg.mouse.move(kb.x + 20, kb.y + 20); await pg.mouse.down();
  await pg.mouse.move(kb.x + 120, kb.y + 25, { steps: 6 }); await pg.mouse.move(kb.x + 900, kb.y + 25, { steps: 6 }); await pg.mouse.up();
  await W(400);
  const drag = await pg.evaluate(() => ({ x: window.__drag.x, end: window.__dragEnd, y: window.__drag.y }));
  t('Draggable moves along x only', drag.x > 0 && drag.y === 0, drag);
  t('Draggable respects bounds', drag.x <= 360 + 0.5, drag.x);
  await pg.focus('#knob'); await pg.keyboard.press('ArrowLeft');
  const afterKey = await pg.evaluate(() => window.__drag.x);
  t('Draggable keyboard arrows', afterKey < drag.x, [drag.x, afterKey]);
  const hit = await pg.evaluate(() => $.Draggable.hitTest('#knob', '#track') && !$.Draggable.hitTest('#knob', '#hdr'));
  t('hitTest', hit);

  /* ---- Split ---- */
  const split = await pg.evaluate(() => {
    const s = $.splitText('#para', { type: 'lines,words,chars', mask: 'lines' });
    const r = { chars: s.chars.length, words: s.words.length, lines: s.lines.length, aria: document.getElementById('para').getAttribute('aria-label'), bold: !!document.querySelector('#para b .word') };
    s.revert();
    r.reverted = document.getElementById('para').innerHTML.startsWith('The quick');
    return r;
  });
  t('splitText counts', split.words === 12 && split.chars > 50 && split.lines >= 2, split);
  t('splitText keeps aria-label and nested markup', split.aria.startsWith('The quick') && split.bold, split);
  t('splitText revert', split.reverted);

  /* ---- UI directives ---- */
  const ui1 = await pg.evaluate(async () => {
    const col = document.getElementById('col');
    const r = { hidden: getComputedStyle(col).display === 'none', persisted: localStorage.getItem('kj-test-n') };
    document.getElementById('inc').click(); await $.nextTick(); await new Promise(x => setTimeout(x, 30));
    r.afterInc = localStorage.getItem('kj-test-n');
    document.getElementById('tog').click(); await $.nextTick();
    await new Promise(x => setTimeout(x, 40));
    r.midHeight = col.offsetHeight;
    await new Promise(x => setTimeout(x, 200));
    r.open = getComputedStyle(col).display !== 'none' && col.style.height === '';
    r.trapFocus = document.activeElement && document.activeElement.id;
    return r;
  });
  t('kj-collapse starts hidden', ui1.hidden, ui1);
  t('$persist writes to storage', ui1.afterInc === '4', ui1);
  t('kj-collapse opens to auto height', ui1.open, ui1);
  t('kj-trap focuses inside', ui1.trapFocus === 't1', ui1.trapFocus);
  await pg.keyboard.press('Tab'); await pg.keyboard.press('Tab');
  t('kj-trap wraps Tab', await pg.evaluate(() => document.activeElement.id) === 't1');
  await pg.click('#mask'); await pg.keyboard.type('5551234567');
  t('kj-mask formats input and model', (await pg.inputValue('#mask')) === '(555) 123-4567' && await pg.evaluate(() => $.$data('#ui').phone) === '(555) 123-4567', await pg.inputValue('#mask'));
  t('kj-resize reports width', (await pg.textContent('#wv')) === '123', await pg.textContent('#wv'));
  await pg.locator('#seen').scrollIntoViewIfNeeded(); await W(200);
  t('kj-intersect fires', (await pg.evaluate(() => $.$data('#ui').seen)) >= 1);
  await pg.reload(); await pg.waitForFunction(() => window.__ready); await W(150);
  t('$persist restores after reload', (await pg.textContent('#pn')) === '4', await pg.textContent('#pn'));
  await pg.evaluate(() => localStorage.removeItem('kj-test-n'));

  /* ---- Live (SSE) ---- */
  await W(600);
  const items = await pg.locator('#sse-list li').count();
  t('kj-sse-connect + kj-sse-swap append events', items >= 3, items);

  t('no page errors', errors.length === 0, errors);
  await browser.close(); server.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); server.close(); process.exit(1); });
