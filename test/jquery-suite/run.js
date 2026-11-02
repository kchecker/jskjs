/* Runs jQuery 3.7.1's own QUnit suite twice — once with real jQuery, once with jsKjs as "jQuery" —
 * and writes results.json: how many of the tests that pass with jQuery also pass with jsKjs.
 *
 *   git clone --depth 1 --branch 3.7.1 https://github.com/jquery/jquery.git test/jquery-suite/jquery
 *   npm i --no-save jquery@3.7.1 raw-body
 *   npm run build && node test/jquery-suite/run.js
 */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const HERE = __dirname, SUITE = path.join(HERE, 'jquery'), REPO = path.join(HERE, '..', '..');
if (!fs.existsSync(SUITE)) { console.error('Clone jQuery first (see the header of this file).'); process.exit(1); }
const fixture = path.join(SUITE, 'test/data/qunit-fixture.js');
fs.writeFileSync(fixture, 'QUnit.config.fixture = ' + JSON.stringify(fs.readFileSync(path.join(SUITE, 'test/data/qunit-fixture.html'), 'utf8')) + ';\n');
const it = path.join(SUITE, 'test/data/core/jquery-iterability-transpiled');
if (!fs.existsSync(it + '.js')) fs.copyFileSync(it + '-es6.js', it + '.js');
const mock = require(path.join(SUITE, 'test/middleware-mockserver.js'))();
const types = { '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.txt': 'text/plain' };
process.on('uncaughtException', e => console.error('server:', e.message));
function serve(lib) {
  return http.createServer((req, res) => mock(req, res, () => {
    const p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/base\//, '/');
    const file = /^\/dist\/jquery(\.min)?\.js$/.test(p) ? lib : path.join(SUITE, p);
    fs.readFile(file, (err, buf) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); res.end(buf); });
  })).listen(0);
}
const MODULES = 'basic core callbacks deferred deprecated support data queue attributes event selector traversing manipulation wrap css serialize ajax effects offset dimensions animation tween ready'.split(' ');
async function runAll(browser, port) {
  const out = {};
  await Promise.all(MODULES.map(async (mod, i) => {
    await new Promise(r => setTimeout(r, i * 250));
    const ctx = await browser.newContext(); const pg = await ctx.newPage();
    pg.on('dialog', d => d.dismiss());
    try {
      await pg.goto(`http://127.0.0.1:${port}/base/test/index.html?dev&module=${mod}`);
      await pg.waitForFunction(() => /completed/.test((document.getElementById('qunit-testresult') || {}).textContent || ''), null, { timeout: 300000, polling: 1000 });
    } catch (e) { console.error(mod, e.message.slice(0, 80)); }
    out[mod] = await pg.evaluate(() => [...document.querySelectorAll('#qunit-tests > li')].map(li => ({
      t: li.querySelector('.test-name').textContent, ok: li.classList.contains('pass'),
      a: [...li.querySelectorAll('ol > li')].map(x => x.classList.contains('pass')) }))).catch(() => []);
    await ctx.close();
  }));
  return out;
}
(async () => {
  const jq = require.resolve('jquery/dist/jquery.js');
  const s1 = serve(jq), s2 = serve(path.join(REPO, 'dist/jskjs.js'));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium' });
  const [ref, ours] = await Promise.all([runAll(browser, s1.address().port), runAll(browser, s2.address().port)]);
  await browser.close(); s1.close(); s2.close();
  let total = 0, passed = 0, assertTotal = 0, assertPassed = 0; const modules = {}, failing = [];
  for (const m of MODULES) {
    const got = new Map((ours[m] || []).map(r => [r.t, r]));
    let t = 0, p = 0;
    for (const r of ref[m] || []) {
      if (!r.ok) continue;
      const g = got.get(r.t);
      t++; assertTotal += r.a.length;
      if (g) { if (g.ok) p++; else failing.push(m + ': ' + r.t); assertPassed += Math.min(r.a.length, g.a.filter(Boolean).length); }
      else failing.push(m + ': ' + r.t + ' (did not run)');
    }
    modules[m] = { passed: p, total: t }; total += t; passed += p;
  }
  const result = { jquery: '3.7.1', date: new Date().toISOString().slice(0, 10), total, passed, assertTotal, assertPassed, modules, failing };
  fs.writeFileSync(path.join(HERE, 'results.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(`${passed}/${total} tests (${(100 * passed / total).toFixed(1)}%), ${(100 * assertPassed / assertTotal).toFixed(1)}% of assertions`);
  failing.forEach(f => console.log('  ✗', f));
})();
