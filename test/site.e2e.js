/* Real-browser check of every page + key interactions. Needs: php -S 127.0.0.1:8099 -t site/public */
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://127.0.0.1:8099';
const paths = [...fs.readFileSync(__dirname + '/../site/public/sitemap.xml', 'utf8').matchAll(/<loc>https:\/\/jskjs\.org([^<]*)<\/loc>/g)].map(m => m[1]);
let pass = 0, fail = 0;
const t = (name, ok, info = '') => { ok ? pass++ : (fail++, console.log('FAIL', name, info)); };

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(/googletagmanager|google-analytics/, r => r.abort());
  const errs = {};
  const open = async (p) => {
    const page = await ctx.newPage();
    errs[p] = [];
    page.on('pageerror', e => errs[p].push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/googletagmanager|ERR_FAILED|404|500|503|Failed to load resource/.test(m.text())) errs[p].push(m.text()); });
    page.on('dialog', d => d.accept());
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.waitForTimeout(250);
    return page;
  };

  for (const p of paths) {
    const page = await open(p);
    t('no JS errors ' + p, errs[p].length === 0, errs[p].join(' | '));
    t('has h1 ' + p, await page.locator('h1').count() === 1);
    await page.close();
  }

  const W = ms => new Promise(r => setTimeout(r, ms));
  let pg;
  // Hyper: live search
  pg = await open('/features/triggers/');
  await pg.locator('#tr-q').pressSequentially('anim'); await W(700);
  t('triggers: search.php results', (await pg.textContent('#tr-results')).includes('animation'));
  await pg.locator('#tr-user').pressSequentially('admin'); await W(800);
  t('triggers: validate.php', /taken|available/.test(await pg.textContent('#tr-user-msg')));
  await pg.close();
  // Notes app POST + DELETE
  pg = await open('/features/declarative-requests/');
  await pg.fill('#note-text', 'Hello <b>x</b>'); await pg.press('#note-text', 'Enter'); await W(600);
  t('notes: post adds escaped note', (await pg.locator('#notes li').count()) === 2 && (await pg.innerHTML('#notes')).includes('&lt;b&gt;'));
  t('notes: form reset', (await pg.inputValue('#note-text')) === '');
  await pg.locator('#notes li').first().locator('button').click(); await W(600);
  t('notes: delete removes', (await pg.locator('#notes li').count()) === 1);
  await pg.click('button[kj-put]'); await W(600);
  t('verbs: PUT body arrives', /"method": "PUT"[\s\S]*Replaced/.test(await pg.textContent('#verbs-out')));
  await pg.close();
  // Infinite scroll
  pg = await open('/features/lazy-loading/');
  await pg.locator('.feed-box').scrollIntoViewIfNeeded(); await W(900);
  for (let i = 0; i < 3; i++) { await pg.locator('.feed-box').evaluate(el => el.scrollTop = 99999); await W(700); }
  t('infinite scroll loaded multiple pages', (await pg.locator('#feed li b').count()) >= 8);
  t('load trigger comments', (await pg.textContent('body')).includes('replaced 4 script tags'));
  await pg.close();
  // Polling
  pg = await open('/features/polling/'); await W(2600);
  t('polling ticker', (await pg.textContent('#ticker')).includes('$'));
  await pg.close();
  // Pulse
  pg = await open('/features/reactive-state/');
  t('tip calc renders', (await pg.textContent('.tc-result strong')).startsWith('$'));
  await pg.click('[aria-label="More people"]'); await W(100);
  t('tip calc reacts', (await pg.textContent('.tipcalc output')).trim() === '4');
  await pg.close();
  pg = await open('/features/conditional-display/');
  await pg.fill('#wz-name', 'Ada'); await pg.click('text=Next'); await W(150);
  await pg.check('input[value="team"]'); await W(50);
  await pg.click('button[\\@click="go(3)"]'); await W(150);
  t('wizard radio + summary', (await pg.textContent('body')).includes('Plan: team'));
  await pg.close();
  pg = await open('/features/two-way-binding/');
  await pg.click('[aria-label="Hyper pink"]'); await W(100);
  t('mixer preset → hex + slider', (await pg.inputValue('#mx-hex')) === '#FF4F8B' && (await pg.inputValue('#mx-r')) === '255');
  await pg.close();
  pg = await open('/features/event-directives/');
  await pg.fill('#td-in', 'Ship it'); await pg.press('#td-in', 'Enter'); await W(150);
  t('todo add + field cleared', (await pg.textContent('[kj-data="todos"] ul')).includes('Ship it') && (await pg.inputValue('#td-in')) === '');
  await pg.close();
  pg = await open('/features/components/');
  t('rating components x3', (await pg.locator('.stars button').count()) === 15);
  await pg.locator('.rate').nth(2).locator('.stars button').nth(2).click(); await W(100);
  t('rating click', (await pg.locator('.rate').nth(2).textContent()).includes('3 of 5'));
  await pg.close();
  pg = await open('/features/global-store/');
  await pg.click('text=Easing mug · $18'); await W(100);
  t('store shared', (await pg.textContent('body')).includes('1 items · $18'));
  await pg.close();
  // Motion
  pg = await open('/features/timelines/');
  await pg.click('#rk-go'); await W(5200);
  t('timeline completes', (await pg.textContent('#rk-log')).includes('Liftoff'));
  await pg.close();
  pg = await open('/features/transforms/');
  await pg.click('#tf-spin'); await W(1200);
  t('zero-duration tween safe', !(await pg.textContent('#tf-out')).includes('NaN'));
  await pg.close();
  // Core
  pg = await open('/features/selectors/');
  await pg.click('[data-sel="li:has(b)"]');
  t('selector :has()', (await pg.textContent('#sel-out')).includes('2 match'));
  await pg.close();
  pg = await open('/features/timeouts-and-errors/');
  await pg.click('#te-timeout'); await W(1200);
  t('timeout aborts', (await pg.textContent('#te-out')).includes('AbortError'));
  await pg.close();
  // Big demo + download
  pg = await open('/demo/');
  await pg.click('text=Load products'); await W(500);
  t('demo shop loads', (await pg.locator('.shop-card').count()) === 6);
  await pg.fill('#shop-filter', 'kitchen'); await W(500);
  t('demo shop filter (not(fn))', (await pg.locator('.shop-card:visible').count()) === 2);
  await pg.locator('input[name="q"]').pressSequentially('anim'); await W(700);
  t('demo search via PHP', (await pg.textContent('#results')).includes('animation'));
  t('demo no errors after interaction', errs['/demo/'].length === 0, errs['/demo/'].join('|'));
  await pg.close();
  pg = await open('/download/');
  t('repo card staged (inert teaser) before roll', await pg.locator('#reveal').evaluate(el => el.hasAttribute('data-staged') && el.inert));
  await pg.click('#roll'); await W(4500);
  t('drum roll reveals repo', await pg.locator('#reveal').evaluate(el => !el.hasAttribute('data-staged') && !el.inert));
  t('download no errors', errs['/download/'].length === 0, errs['/download/'].join('|'));
  await pg.close();

  // Theme switch (Pulse component) — flips page colours, persists, follows system until chosen
  pg = await open('/features/selectors/');
  const bg0 = await pg.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const head0 = await pg.evaluate(() => getComputedStyle(document.querySelector('.page-head-band')).backgroundColor);
  await pg.click('#theme-toggle'); await W(500);
  const bg1 = await pg.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const head1 = await pg.evaluate(() => getComputedStyle(document.querySelector('.page-head-band')).backgroundColor);
  t('theme: body colour changes', bg0 !== bg1);
  t('theme: page-head band follows theme', head0 !== head1);
  t('theme: aria-pressed reflects state', (await pg.getAttribute('#theme-toggle', 'aria-pressed')) === 'true');
  await pg.reload(); await W(300);
  t('theme: choice persists after reload', (await pg.evaluate(() => getComputedStyle(document.body).backgroundColor)) === bg1);
  t('theme: icon matches after reload', await pg.locator('.ico-moon').isVisible());
  await pg.close();
  // Mobile menu (Pulse component)
  { const c = await browser.newContext({ viewport: { width: 390, height: 800 } }); await c.route(/googletagmanager/, r => r.abort());
    const m = await c.newPage(); await m.goto(BASE + '/'); await W(300);
    t('menu closed initially', !(await m.locator('#mnav-panel').isVisible()));
    await m.click('.mnav-btn'); await W(300);
    t('menu opens', await m.locator('#mnav-panel').isVisible() && (await m.getAttribute('.mnav-btn', 'aria-expanded')) === 'true');
    await m.keyboard.press('Escape'); await W(200);
    t('menu closes on Escape', !(await m.locator('#mnav-panel').isVisible()));
    await c.close(); }
  // Mobile + dark screenshots for visual review
  const shots = process.env.SHOTS;
  if (shots) {
    for (const [p, w, theme] of [['/', 1280, 'light'], ['/', 390, 'dark'], ['/features/tweens/', 1280, 'dark'], ['/download/', 390, 'light'], ['/ai/', 1280, 'light'], ['/jquery/weight/', 1280, 'light']]) {
      const c = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme });
      await c.route(/googletagmanager/, r => r.abort());
      const s = await c.newPage(); await s.goto(BASE + p); await s.waitForTimeout(2200);
      await s.screenshot({ path: `${shots}/${p.replace(/\//g, '_') || 'home'}-${w}-${theme}.png`, fullPage: false });
      const overflow = await s.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      t(`no horizontal scroll ${p} @${w}`, !overflow);
      await c.close();
    }
  }
  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed (${paths.length} pages crawled)`);
  process.exit(fail ? 1 : 0);
})();
