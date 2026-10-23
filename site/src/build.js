/* build.js — generates jskjs.org into site/public/. Run: node site/src/build.js */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { execSync } = require('child_process');

const SRC = __dirname;
const SITE = path.resolve(SRC, '..');
const REPO = path.resolve(SITE, '..');
const OUT = path.join(SITE, 'public');
const C = require('./config');
const BUILD_DATE = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);

/* ---------------- 1. library: minify, measure, hash ---------------- */
fs.mkdirSync(path.join(REPO, 'dist'), { recursive: true });
fs.copyFileSync(path.join(REPO, 'src/jskjs.js'), path.join(REPO, 'dist/jskjs.js'));
execSync(`npx terser "${REPO}/src/jskjs.js" -c -m --comments "/^!/" -o "${REPO}/dist/jskjs.min.js"`, { cwd: REPO, stdio: 'inherit' });
const minBuf = fs.readFileSync(path.join(REPO, 'dist/jskjs.min.js'));
const fullBuf = fs.readFileSync(path.join(REPO, 'dist/jskjs.js'));
const gz = zlib.gzipSync(minBuf, { level: 9 }).length;
C.KJ_GZ_KB = (gz / 1024).toFixed(1);
C.KJ_MIN_KB = (minBuf.length / 1024).toFixed(1);
C.KJ_SRC_KB = (fullBuf.length / 1024).toFixed(1);
const sri = b => 'sha384-' + crypto.createHash('sha384').update(b).digest('base64');
C.SRI_MIN = sri(minBuf); C.SRI_FULL = sri(fullBuf);
const OTHERS_GZ = C.SIZES.reduce((s, x) => s + x.gz, 0);
const KB = n => (n / 1024).toFixed(1);
console.log(`jskjs.min.js ${minBuf.length} B, gzip ${gz} B (${C.KJ_GZ_KB} KB) — others ${KB(OTHERS_GZ)} KB`);

/* ---------------- 2. content (after sizes are known) ---------------- */
const L = require('./lib/layout');
const { esc, codeBlock, stage, render, pageHead, ICON_GH } = L;
const FEATURES = [...require('./content/features-core'), ...require('./content/features-hyper-pulse'), ...require('./content/features-motion-util')];
const DOCS = require('./content/docs-data');
const JQ = require('./content/jquery');
const COMPARE = require('./content/compare');
const AI = require('./content/ai');
const RULES = require('./content/ai-rules');

const MODS = {
  core:   { name: 'Core',      long: 'Core · jQuery-compatible', from: 'jQuery', blurb: 'Selectors, DOM, traversal, events and fetch-powered AJAX — the jQuery API on native browser features.' },
  hyper:  { name: 'Hyper',     long: 'Hyper · htmx-style',       from: 'htmx',   blurb: 'Requests described in HTML attributes. The server returns HTML; jsKjs puts it where you said.' },
  pulse:  { name: 'Pulse',     long: 'Pulse · Alpine-style',     from: 'Alpine.js', blurb: 'Reactive state declared on the element: kj-data, kj-text, kj-model, @click, components and stores.' },
  motion: { name: 'Motion',    long: 'Motion · GSAP-style',      from: 'GSAP',   blurb: 'Tweens, transforms, easing, stagger and timelines on requestAnimationFrame — with Promises.' },
  util:   { name: 'Utilities', long: 'Utilities',                from: 'jQuery', blurb: 'Debounce, throttle, deep extend, escaping, UUIDs and the classic $ helpers.' },
};

/* ---------------- docs overrides for v1.0.0 behaviour ---------------- */
const DOC_OVERRIDES = {
  '.not()': { s: '.not(selector | fn(i, el) | element | collection) → KJ', d: 'Drop matching elements. Accepts a selector, an element or collection, or a predicate function.', e: "$('.item').not('.sold-out').show();\n$('.item').not((i, el) => el.dataset.price > 100);" },
  '.is()': { s: '.is(selector | fn(i, el) | element) → boolean', d: 'Test whether any element in the set matches a selector, element, collection or predicate.' },
  '.css()': { d: 'Get a computed style from the first element, or set styles on all. Numbers become px except for unitless properties. Custom properties (<code>--name</code>) are read with <code>getPropertyValue</code> and written without px.', e: "$('.card').css('color');\n$('.card').css('margin-top', 20);          // → 20px\n$('.card').css({ opacity: .5, '--accent': 'tomato' });\n$(':root').css('--hue', 200);               // no px for custom properties" },
  '$.timeline()': { s: '$.timeline({ paused?, onComplete?, ...defaults }) → timeline', d: 'Sequence tweens. Steps run in order; position <code>\'<\'</code> starts a step with the previous one; <code>\'+=0.3\'</code> waits 0.3 s first. Methods: <code>.to()</code>, <code>.from()</code>, <code>.fromTo()</code>, <code>.add(fn)</code> (waits if fn returns a Promise), <code>.play()</code> → Promise. Auto-plays unless <code>paused: true</code>.', e: "const tl = $.timeline({ paused: true, duration: .5, ease: 'power2.out' })\n  .from('.hero', { opacity: 0 })\n  .from('.hero h1', { y: 30 })\n  .from('.hero p', { y: 30 }, '<')    // together with the h1\n  .from('.cta', { scale: .8 }, '+=0.2');\nawait tl.play();" },
  '$.component()': { s: '$.component(name, (...args) => state)', d: 'Register a reusable component factory, then use it with <code>kj-data="name"</code> or with arguments: <code>kj-data="name(4, \'Docs\')"</code>. An <code>init(el)</code> method receives the root element.', e: "$.component('rating', (initial = 0) => ({\n  value: initial,\n  rate(n) { this.value = n; },\n}));\n// <div kj-data=\"rating(4)\">…</div>" },
  'kj-model': { d: 'Two-way binding for text, number and range inputs, textareas, selects, checkboxes (booleans) and radio buttons (the checked radio’s value). The field being typed in is never rewritten mid-typing; programmatic changes update it immediately.' },
  'Lifecycle events': { d: '<code>kj:before</code> (before the request), <code>kj:after</code> (response received, before the swap; <code>detail.html</code>) and <code>kj:error</code> (<code>detail.error.status</code>) fire on the requesting element. <code>kj:load</code> fires on the target after the swap — or on its former parent when <code>outerHTML</code> replaced it. All bubble.' },
  'Easings': { d: 'Built in: <code>linear, ease-in, ease-out, ease-in-out, power2.in, power2.out, power2.inOut, back.out, elastic.out, bounce.out</code> — exposed as <code>$.easings</code> — or pass any function mapping 0→1 progress.' },
  'kj-get / kj-post / kj-put / kj-patch / kj-delete': { d: 'The URL to request with that HTTP verb. Forms send their fields; named inputs, selects and textareas send their own value. Bodies are URL-encoded (multipart when a form contains file inputs). Default triggers: forms → <code>submit</code>, inputs/selects → <code>change</code>, everything else → <code>click</code>.' },
};
for (const sec of DOCS) for (const f of sec.fns) if (DOC_OVERRIDES[f.n]) Object.assign(f, DOC_OVERRIDES[f.n]);

const anchor = (secId, name) => secId + '-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const DOC_INDEX = {};
for (const sec of DOCS) for (const f of sec.fns) DOC_INDEX[f.n] = { sec, f, id: anchor(sec.id, f.n) };
const FEATURE_FOR_DOC = {};
for (const ft of FEATURES) for (const n of ft.api || []) {
  if (!DOC_INDEX[n]) console.warn('⚠ feature', ft.slug, 'references missing doc entry', n);
  else if (!FEATURE_FOR_DOC[n]) FEATURE_FOR_DOC[n] = ft;
}

/* ---------------- output helpers ---------------- */
fs.rmSync(OUT, { recursive: true, force: true });
const PAGES = [];
function writeFile(rel, content) {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
}
function emit(page, body) {
  page.ogSlug = page.ogSlug || (page.path === '/' ? 'home' : page.path.replace(/^\/|\/$/g, '').replace(/[\/.]+/g, '-'));
  const html = render(page, body);
  writeFile(page.path.endsWith('.html') ? page.path : page.path + 'index.html', html);
  if (!page.noindex) PAGES.push(page);
}
function copyDir(from, to) {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); copyDir(a, b); } else fs.copyFileSync(a, b);
  }
}
const techArticle = (page, extra = {}) => ({
  '@context': 'https://schema.org', '@type': 'TechArticle', headline: page.title, description: page.desc,
  url: C.SITE + page.path, author: C.AUTHOR_PEOPLE, datePublished: '2026-10-23', dateModified: BUILD_DATE,
  publisher: { '@type': 'Organization', name: 'jsKjs', url: C.SITE },
  image: C.SITE + '/assets/og/' + (page.ogSlug || 'default') + '.png',
  about: { '@type': 'SoftwareSourceCode', name: 'jsKjs', codeRepository: C.GITHUB }, ...extra,
});
const card = (href, mod, label, title, text, go = 'Open →', search = '') =>
  `<a class="card plate mod-top" data-mod="${mod}" href="${href}"${search ? ` data-search="${esc(search)}"` : ''}><span class="label">${label}</span><h3>${title}</h3><p>${text}</p><span class="go">${go}</span></a>`;

/* static assets + API + library */
fs.mkdirSync(OUT, { recursive: true });
copyDir(path.join(SITE, 'static'), OUT);
for (const dir of [`cdn/${C.VERSION}`, 'cdn']) {
  fs.mkdirSync(path.join(OUT, dir), { recursive: true });
  fs.copyFileSync(path.join(REPO, 'dist/jskjs.js'), path.join(OUT, dir, 'jskjs.js'));
  fs.copyFileSync(path.join(REPO, 'dist/jskjs.min.js'), path.join(OUT, dir, 'jskjs.min.js'));
}

/* =====================================================================
   FEATURE PAGES
   ===================================================================== */
const FEATURE_ORDER = ['core', 'hyper', 'pulse', 'motion', 'util'];
FEATURES.sort((a, b) => FEATURE_ORDER.indexOf(a.mod) - FEATURE_ORDER.indexOf(b.mod));
const bySlug = Object.fromEntries(FEATURES.map(f => [f.slug, f]));

FEATURES.forEach((ft, i) => {
  const m = MODS[ft.mod];
  const page = {
    path: `/features/${ft.slug}/`, title: ft.title, seoTitle: `${ft.seo} — jsKjs`, desc: ft.desc, lede: ft.lede,
    kicker: m.long, mod: ft.mod, nav: 'features', ogTitle: ft.title,
    crumbs: [{ name: 'Features', path: '/features/' }, { name: m.name, path: `/features/#${ft.mod}` }, { name: ft.title, path: `/features/${ft.slug}/` }],
    headExtra: ft.css ? `<style>${ft.css}</style>` : '',
  };
  page.jsonld = techArticle(page, { proficiencyLevel: 'Beginner', dependencies: 'jsKjs ' + C.VERSION });
  const demos = (ft.demos || []).map(d => stage(page, d)).join('\n');
  const examples = (ft.examples || []).map(ex => `<h3>${esc(ex.title)}</h3>${codeBlock(ex.code, ex.lang)}`).join('');
  const api = (ft.api || []).map(n => {
    const d = DOC_INDEX[n]; if (!d) return '';
    return `<div class="api-item"><span class="sig">${esc(d.f.s)}</span><p>${d.f.d}</p><a href="/docs/#${d.id}" style="font-size:14px">Reference: ${esc(d.f.n)} →</a></div>`;
  }).join('');
  const from = (ft.from || []).map(f => `<div class="note"><strong>Coming from ${esc(f.lib)}</strong>${f.note}</div>`).join('');
  const related = (ft.related || []).map(s => bySlug[s]).filter(Boolean)
    .map(r => card(`/features/${r.slug}/`, r.mod, MODS[r.mod].name, esc(r.title), r.desc.split('. ')[0] + '.')).join('');
  const prev = FEATURES[i - 1], next = FEATURES[i + 1];
  const siblings = FEATURES.filter(f => f.mod === ft.mod);
  const aside = `<aside class="aside" aria-label="${m.name} features">
    <div class="aside-group"><h2>${m.long}</h2><ul>${siblings.map(s => `<li><a href="/features/${s.slug}/"${s === ft ? ' aria-current="page"' : ''}>${esc(s.title)}</a></li>`).join('')}</ul></div>
    <div class="aside-group"><h2>Other modules</h2><ul>${FEATURE_ORDER.filter(k => k !== ft.mod).map(k => `<li><a href="/features/#${k}">${MODS[k].long}</a></li>`).join('')}</ul></div>
    <div class="aside-group"><h2>Also</h2><ul><li><a href="/docs/">API reference</a></li><li><a href="/compare/${ft.mod === 'util' ? 'jquery' : { core: 'jquery', hyper: 'htmx', pulse: 'alpine', motion: 'gsap' }[ft.mod]}/">What's ported from ${m.from}</a></li><li><a href="/ai/">Build it with AI</a></li></ul></div>
  </aside>`;
  const body = pageHead(page) + `
<div class="wrap section"><div class="layout"><article>
  <div class="prose">${ft.body}</div>
  ${demos}
  ${examples ? `<h2 style="margin-top:48px">More examples</h2>${examples}` : ''}
  ${api ? `<h2 style="margin-top:48px">API</h2><div class="api-list">${api}</div>` : ''}
  ${from ? `<h2 style="margin-top:48px">Migrating</h2>${from}` : ''}
  ${related ? `<h2 style="margin-top:48px">Related features</h2><div class="grid g3" style="margin-top:18px">${related}</div>` : ''}
  <nav class="pager" aria-label="Previous and next feature">
    ${prev ? `<a class="prev" href="/features/${prev.slug}/"><span class="dir">← Previous</span><strong>${esc(prev.title)}</strong></a>` : '<span></span>'}
    ${next ? `<a class="next" href="/features/${next.slug}/"><span class="dir">Next →</span><strong>${esc(next.title)}</strong></a>` : ''}
  </nav>
</article>${aside}</div></div>`;
  emit(page, body);
});

/* features hub */
{
  const page = { path: '/features/', title: 'Every jsKjs feature, with a live demo', seoTitle: 'jsKjs Features: 40 Live Demos of jQuery, htmx, Alpine & GSAP-style APIs',
    desc: `Browse all ${FEATURES.length} jsKjs features — jQuery-compatible core, htmx-style requests, Alpine-style reactivity, GSAP-style motion and utilities — each with a working demo and source.`,
    lede: `${FEATURES.length} features across five modules. Every page has a working demo — many backed by real PHP endpoints — plus the exact source that runs it.`,
    kicker: 'Features', nav: 'features', crumbs: [{ name: 'Features', path: '/features/' }] };
  page.jsonld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: page.title, description: page.desc, url: C.SITE + page.path,
    hasPart: FEATURES.map(f => ({ '@type': 'TechArticle', headline: f.title, url: `${C.SITE}/features/${f.slug}/` })) };
  const modules = FEATURE_ORDER.map(k => `<div class="plate mod-top" data-mod="${k}" id="${k}"><span class="label">${MODS[k].long}</span><p style="margin-top:10px;font-size:15px;color:var(--muted)">${MODS[k].blurb}</p><p style="margin-top:8px;font:600 12.5px var(--mono)">${FEATURES.filter(f => f.mod === k).length} features</p></div>`).join('');
  const cards = FEATURES.map(f => card(`/features/${f.slug}/`, f.mod, MODS[f.mod].name, esc(f.title), f.desc.split('. ')[0] + '.', 'Live demo →', `${f.title} ${f.desc} ${(f.api || []).join(' ')}`)).join('');
  emit(page, pageHead(page) + `
<div class="wrap section">
  <div class="grid g3" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))">${modules}</div>
  <div class="filterbar" style="margin-top:40px" role="search">
    <label for="ft-q" class="sr-only">Filter features</label>
    <input id="ft-q" type="search" placeholder="Filter: try “scroll”, “form”, “kj-swap”…" data-filter="#ft-grid">
    <button type="button" data-filter-mod="all" aria-pressed="true">All</button>
    ${FEATURE_ORDER.map(k => `<button type="button" data-filter-mod="${k}" aria-pressed="false">${MODS[k].name}</button>`).join('')}
    <span class="muted" id="filter-count" aria-live="polite" style="font:600 13px var(--mono)">${FEATURES.length} shown</span>
  </div>
  <div class="grid g3" id="ft-grid">${cards}</div>
</div>`);
}

/* =====================================================================
   DOCS
   ===================================================================== */
{
  const page = { path: '/docs/', title: 'API reference', seoTitle: 'jsKjs API Reference — Every Function, Attribute and Directive',
    desc: 'Complete jsKjs API reference: jQuery-compatible core, AJAX, kj-* Hyper attributes, Pulse directives (kj-data, kj-model, @click), Motion ($.to, timelines, easings), effects and utilities — with examples.',
    lede: `Every function, attribute and directive in jsKjs ${C.VERSION}, with signatures and examples. Each entry links to a live demo.`,
    kicker: 'Documentation', nav: 'docs', crumbs: [{ name: 'Docs', path: '/docs/' }] };
  page.jsonld = techArticle(page);
  const nav = DOCS.map(sec => `<div class="aside-group"><h2>${esc(sec.title)}</h2><ul>${sec.fns.map(f => `<li><a href="#${anchor(sec.id, f.n)}">${esc(f.n)}</a></li>`).join('')}</ul></div>`).join('');
  const sections = DOCS.map(sec => `<section id="${sec.id}" style="margin-top:56px" data-mod="${{ hyper: 'hyper', pulse: 'pulse', motion: 'motion', effects: 'motion', utilities: 'util' }[sec.id] || 'core'}">
    <p class="label">${esc(sec.title)}</p><h2 style="margin-top:12px">${esc(sec.title)}</h2><p class="muted" style="max-width:68ch;margin-top:8px">${sec.intro}</p>
    ${sec.fns.map(f => {
      const live = FEATURE_FOR_DOC[f.n];
      const lang = /^\s*</.test(f.e) ? 'html' : 'js';
      return `<article id="${anchor(sec.id, f.n)}" style="margin-top:30px;padding-top:22px;border-top:1px dashed var(--line)">
        <h3 style="font-family:var(--mono);font-stretch:90%;font-size:1.05rem">${esc(f.n)}</h3>
        <p class="sig" style="font:600 13px/1.5 var(--mono);color:var(--mod-ink);margin-top:6px;overflow-wrap:anywhere">${esc(f.s)}</p>
        <p style="margin-top:8px;max-width:72ch">${f.d}</p>
        ${codeBlock(f.e, lang)}
        ${live ? `<p style="font-size:14.5px"><a href="/features/${live.slug}/">See it live: ${esc(live.title)} →</a></p>` : ''}
      </article>`;
    }).join('')}
  </section>`).join('');
  emit(page, pageHead(page) + `
<div class="wrap section"><div class="layout" style="grid-template-columns:240px minmax(0,1fr)">
  <aside class="aside" aria-label="API sections" style="max-height:calc(100vh - 110px);overflow:auto">${nav}</aside>
  <div>
    <div class="note" data-mod="motion"><strong>Compatibility notes</strong>Collections are real Arrays, so native <code>.map()</code>/<code>.slice()</code> return plain arrays. <code>.val()</code> on a checkbox returns a boolean. AJAX returns native Promises. Handlers receive native events. Full list: <a href="/migrate/">migrating from jQuery</a> and <a href="/compare/">comparisons</a>.</div>
    ${sections}
    <section style="margin-top:56px"><h2>Browser support</h2><p style="margin-top:10px;max-width:70ch">Evergreen browsers: Chrome and Edge 90+, Firefox 90+, Safari 15+. Internet Explorer and pre-2021 browsers are unsupported by design — that is where the small size comes from.</p></section>
  </div>
</div></div>`);
}

/* =====================================================================
   LEGACY FEATURE TOUR → /demo/
   ===================================================================== */
{
  let src = fs.readFileSync(path.join(SRC, 'content/demo-legacy.html'), 'utf8');
  const style = src.match(/<style>([\s\S]*?)<\/style>/)[1]
    .replace("html.dark, html.dark body { color: #e6edf3; }", '')
    .replace('.toast { background: var(--ink); color: #fff;', '.toast { background: var(--ink); color: var(--bg);')
    .replace('.badge { display: inline-block; background: var(--teal); color: #fff;', '.badge { display: inline-block; background: var(--teal); color: var(--surface);')
    .replace('.tabs button[aria-selected="true"] { background: var(--ink); color: #fff; }', '.tabs button[aria-selected="true"] { background: var(--ink); color: var(--bg); }');
  let main = src.match(/<main>([\s\S]*?)<\/main>/)[1];
  const toc = main.match(/<div class="toc">[\s\S]*?<\/div>/)[0];
  main = main.replace(/<header style="padding: 64px 0 8px" class="narrow">[\s\S]*?<\/header>/, '');
  const scripts = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  let js = scripts[scripts.length - 1];
  js = js.replace(/\/\* =+\n \* Static-host shim[\s\S]*?\}\)\(\);\n/, '');
  const fixes = [
    [/\.\.\/api\//g, '/api/'],
    ['kj-get="/api/search"', 'kj-get="/api/search.php"'],
    ['kj-post="/api/subscribe"', 'kj-post="/api/subscribe.php"'],
    ['kj-delete="/api/items/1"', 'kj-delete="/api/items.php?id=1"'],
    ['kj-delete="/api/items/2"', 'kj-delete="/api/items.php?id=2"'],
    ['kj-post="/api/filter"', 'kj-post="/api/echo.php"'],
    ['<pre id="filter-echo" style="margin-top:10px; min-height:2.4em"></pre>', '<div id="filter-echo" style="margin-top:10px" aria-live="polite"></div>'],
    ['<span class="muted" style="font-size:.7em">simulated — needs a query</span>', '<span class="muted" style="font-size:.7em">real PHP endpoint</span>'],
    [/<span class="muted" style="font-size:.7em">simulated slow endpoint<\/span>/g, '<span class="muted" style="font-size:.7em">real PHP endpoint</span>'],
    [/<span class="muted" style="font-size:.7em">simulated<\/span>/g, '<span class="muted" style="font-size:.7em">real PHP endpoint</span>'],
    ['— filters /api/packages.json', '— /api/search.php filters packages.json in PHP'],
    ['<button id="theme-toggle">Toggle dark mode</button>', '<button id="demo-theme">Toggle dark mode</button>'],
    ['.css(\'--paper\', …) live CSS-variable theming', 'flips the site theme (data-theme + CSS variables)'],
    ['position:fixed; top:0; left:0; height:3px;', 'position:fixed; top:64px; left:0; height:3px;'],
  ];
  const jsFixes = [
    [/\.\.\/api\//g, '/api/'],
    ["url: '/api/slow', timeout: 800", "url: '/api/slow.php?ms=3000', timeout: 800"],
    ["url: '/api/slow' }", "url: '/api/slow.php?ms=3000' }"],
    [/const dark = \{[^\n]*\n\s*const light = \{[^\n]*\n\s*\$\('#theme-toggle'\)\.click\(function \(\) \{[\s\S]*?\n  \}\);/, "$('#demo-theme').click(function () {\n    $('#theme-toggle').click();                // drives the site's own theme switch\n    const dark = document.documentElement.getAttribute('data-theme') === 'dark';\n    $(this).text(dark ? 'Toggle light mode' : 'Toggle dark mode');\n  });"],
  ];
  for (const [a, b] of fixes) main = main.split ? (a instanceof RegExp ? main.replace(a, b) : main.split(a).join(b)) : main;
  for (const [a, b] of jsFixes) js = a instanceof RegExp ? js.replace(a, b) : js.split(a).join(b);
  if (js.includes('realFetch') || js.includes("'#theme-toggle').click(function")) throw new Error('demo adaptation incomplete');
  const page = { path: '/demo/', title: 'The full feature tour', seoTitle: 'jsKjs Live Demo: 37 Interactive Examples on One 7.8 KB Script',
    desc: 'The complete jsKjs feature tour: a mini-shop, a game, split-text animation, modals, toasts and 29 focused demos of every module — wired to real PHP endpoints. View source on any of it.',
    lede: 'Thirty-seven demos on one page — eight mini-apps that combine modules, then twenty-nine focused examples. Requests go to real PHP endpoints under <code>/api/</code>: open the network tab and watch.',
    kicker: 'Demo', nav: 'demo', crumbs: [{ name: 'Demo', path: '/demo/' }],
    headExtra: `<style>${style}
.legacy-demo .panel { background:var(--surface); border:1px solid var(--line); border-radius:14px; padding:22px; box-shadow:var(--shadow); }
.legacy-demo .grid2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,330px),1fr)); gap:18px; margin-top:18px; }
.legacy-demo .tag { display:inline-block; font:600 11.5px/1 var(--mono); letter-spacing:.12em; text-transform:uppercase; padding:6px 10px; border-radius:6px; background:var(--ink); color:var(--bg); margin-bottom:12px; }
.legacy-demo .tag.teal { background:var(--pulse); color:#13152B; } .legacy-demo .tag.violet { background:var(--hyper); color:#13152B; } .legacy-demo .tag.amber { background:var(--motion); color:#13152B; }
.legacy-demo .narrow { max-width:900px; }
.legacy-demo > section { margin-top:72px; }
.legacy-demo h2 { margin-bottom:6px; }
.legacy-demo button { font:700 14px/1 var(--body); color:var(--ink); background:var(--surface); border:1.5px solid var(--ink); border-radius:9px; padding:10px 14px; cursor:pointer; }
.legacy-demo button:hover { background:var(--ink); color:var(--bg); }
.legacy-demo button:disabled { opacity:.45; cursor:not-allowed; }
.legacy-demo pre { font:12.5px/1.65 var(--mono); background:var(--code-bg); color:var(--code-fg); border-radius:10px; padding:14px 16px; overflow:auto; margin-top:12px; }
.toc a { background:var(--chrome-2) !important; color:var(--chrome-ink) !important; border-color:var(--chrome-line) !important; }
</style>` };
  page.jsonld = techArticle(page);
  page.scripts = [js.trim()];
  emit(page, pageHead(page, toc) + `<div class="wrap legacy-demo">${main}</div>`);
}

/* =====================================================================
   jQUERY SERIES
   ===================================================================== */
const sizeChart = () => {
  const rows = [...C.SIZES.map(s => ({ name: s.name, sub: 'v' + s.ver, gz: s.gz })), { name: 'All four', sub: 'combined', gz: OTHERS_GZ, total: true }, { name: 'jsKjs', sub: 'v' + C.VERSION, gz, kj: true }];
  return `<figure style="margin:24px 0"><div class="sizes" role="img" aria-label="Gzipped size comparison: ${rows.map(r => `${r.name} ${KB(r.gz)} KB`).join(', ')}">
    ${rows.map(r => `<div class="size-row${r.kj ? ' kj' : ''}${r.total ? ' total' : ''}" title="${r.name}: ${KB(r.gz)} KB gzipped"><span class="name">${r.name}<small>${r.sub}</small></span><span class="track"><span class="fill" style="width:${(r.gz / OTHERS_GZ * 100).toFixed(1)}%"></span></span><span class="val">${KB(r.gz)} KB</span></div>`).join('')}
  </div><figcaption class="muted" style="font-size:13.5px;margin-top:12px">Official minified builds from npm (jquery, htmx.org, alpinejs, gsap), compressed with <code>gzip -9</code>, October 2026. jsKjs ports the commonly used subset of each — <a href="/compare/">see exactly what's included</a>.</figcaption></figure>`;
};
{
  const h = JQ.hub;
  const page = { path: '/jquery/', title: h.title, seoTitle: h.seo, desc: h.desc, lede: h.lede, kicker: 'A fair review · 8 essays', nav: 'jquery', mod: 'hyper', crumbs: [{ name: 'What aged in jQuery', path: '/jquery/' }] };
  page.jsonld = techArticle(page, { '@type': 'Article' });
  const cards = JQ.items.map(it => `<a class="card plate" data-mod="hyper" href="/jquery/${it.slug}/"><span class="series-num" aria-hidden="true">${String(it.n).padStart(2, '0')}</span><h3>${esc(it.title)}</h3><p>${it.desc.split('. ')[0]}.</p><span class="go">Read essay ${it.n} →</span></a>`).join('');
  emit(page, pageHead(page) + `<div class="wrap section"><div class="prose" style="margin-bottom:36px">${h.intro}</div><div class="grid g2">${cards}</div></div>`);
}
JQ.items.forEach((it, i) => {
  const page = { path: `/jquery/${it.slug}/`, title: it.title, seoTitle: `${it.seo} — jsKjs`, desc: it.desc, lede: it.lede, nav: 'jquery', mod: 'hyper',
    kicker: `What aged in jQuery · ${it.n} of ${JQ.items.length}`, ogType: 'article',
    crumbs: [{ name: 'What aged in jQuery', path: '/jquery/' }, { name: it.title, path: `/jquery/${it.slug}/` }] };
  page.jsonld = techArticle(page, { '@type': 'Article', isPartOf: { '@type': 'CreativeWorkSeries', name: 'What aged in jQuery', url: C.SITE + '/jquery/' } });
  const prev = JQ.items[i - 1], next = JQ.items[i + 1];
  const sources = (it.sources || []).map(k => JQ.SRC[k]).filter(Boolean);
  emit(page, pageHead(page) + `
<div class="wrap section"><div class="layout"><article>
  <div class="prose">
    <h2>Why it made sense</h2><p>${it.then}</p>
    <h2>What changed</h2>${it.now}
  </div>
  ${it.sizes ? sizeChart() : ''}
  <div class="prose"><h2>What jsKjs does instead</h2>${it.fix}</div>
  <div class="verdict"><div><h3>jQuery</h3>${codeBlock(it.before.code, it.before.lang)}</div><div><h3>jsKjs</h3>${codeBlock(it.after.code, it.after.lang)}</div></div>
  ${sources.length ? `<h2 style="margin-top:40px;font-size:1.2rem">Sources</h2><ul style="margin-top:10px">${sources.map(([t, u]) => `<li><a href="${u}" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>` : ''}
  <nav class="pager" aria-label="Previous and next essay">
    ${prev ? `<a class="prev" href="/jquery/${prev.slug}/"><span class="dir">← Essay ${prev.n}</span><strong>${esc(prev.title)}</strong></a>` : '<a class="prev" href="/jquery/"><span class="dir">← Series</span><strong>All essays</strong></a>'}
    ${next ? `<a class="next" href="/jquery/${next.slug}/"><span class="dir">Essay ${next.n} →</span><strong>${esc(next.title)}</strong></a>` : '<a class="next" href="/migrate/"><span class="dir">Next →</span><strong>Migrate from jQuery</strong></a>'}
  </nav>
</article>
<aside class="aside" aria-label="Series"><div class="aside-group"><h2>The series</h2><ul>${JQ.items.map(x => `<li><a href="/jquery/${x.slug}/"${x === it ? ' aria-current="page"' : ''}>${x.n}. ${esc(x.title)}</a></li>`).join('')}</ul></div>
<div class="aside-group"><h2>Next steps</h2><ul><li><a href="/migrate/">Migrate from jQuery</a></li><li><a href="/compare/jquery/">jsKjs vs jQuery</a></li><li><a href="/start/">Getting started</a></li></ul></div></aside>
</div></div>`);
});

/* =====================================================================
   COMPARE
   ===================================================================== */
{
  const page = { path: '/compare/', title: 'jsKjs compared, honestly', seoTitle: 'jsKjs vs jQuery, htmx, Alpine.js and GSAP — Honest Comparison',
    desc: 'How jsKjs compares with jQuery 4, htmx 2, Alpine.js 3 and GSAP 3: measured sizes, what each module ports, what it leaves out, and when to pick the original library instead.',
    lede: 'jsKjs replaces the <em>commonly used</em> parts of four libraries. Here is precisely what that means — including when you should use the original instead.',
    kicker: 'Compare', nav: 'compare', crumbs: [{ name: 'Compare', path: '/compare/' }] };
  page.jsonld = techArticle(page);
  const count = (c, s) => c.rows.filter(r => r[1] === s).length;
  emit(page, pageHead(page) + `<div class="wrap section">${sizeChart()}
  <div class="table-wrap"><table><caption class="sr-only">Coverage summary</caption><thead><tr><th scope="col">Library</th><th scope="col">jsKjs module</th><th scope="col">Supported</th><th scope="col">Partial</th><th scope="col">Not included</th><th scope="col"></th></tr></thead><tbody>
  ${COMPARE.map(c => `<tr><th scope="row" style="font:inherit;font-weight:700;text-transform:none;letter-spacing:0;background:none;color:var(--ink)">${c.lib} ${c.ver}</th><td>${MODS[c.mod].name}</td><td class="yes">${count(c, 'yes')}</td><td class="partial">${count(c, 'partial')}</td><td class="no">${count(c, 'no')}</td><td><a href="/compare/${c.slug}/">Details →</a></td></tr>`).join('')}
  </tbody></table></div>
  <div class="grid g2" style="margin-top:30px">${COMPARE.map(c => card(`/compare/${c.slug}/`, c.mod, MODS[c.mod].long, `jsKjs vs ${c.lib}`, c.desc.split(': ')[0] + '.', 'Full comparison →')).join('')}</div></div>`);
}
COMPARE.forEach(c => {
  const page = { path: `/compare/${c.slug}/`, title: `jsKjs vs ${c.lib}`, seoTitle: `${c.seo} — jsKjs`, desc: c.desc, lede: c.lede, kicker: `Compare · ${MODS[c.mod].long}`, nav: 'compare', mod: c.mod,
    crumbs: [{ name: 'Compare', path: '/compare/' }, { name: `vs ${c.lib}`, path: `/compare/${c.slug}/` }] };
  page.jsonld = techArticle(page);
  const label = { yes: '✓ Yes', partial: '◐ Partial', no: '✗ No' };
  emit(page, pageHead(page) + `<div class="wrap section">
  <div class="grid g2">
    <div class="plate mod-top" data-mod="${c.mod}"><span class="label">Choose jsKjs when…</span><ul style="margin-top:12px;padding-left:1.2em">${c.chooseUs.map(x => `<li style="margin-top:6px">${x}</li>`).join('')}</ul></div>
    <div class="plate mod-top" data-mod="util"><span class="label">Choose ${c.lib} when…</span><ul style="margin-top:12px;padding-left:1.2em">${c.chooseThem.map(x => `<li style="margin-top:6px">${x}</li>`).join('')}</ul></div>
  </div>
  <h2 style="margin-top:56px">Feature by feature</h2>
  <p class="muted" style="margin-top:8px">Compared with ${c.lib} ${c.ver}. ✓ works the same · ◐ supported with differences · ✗ not included.</p>
  <div class="table-wrap"><table><caption class="sr-only">${c.lib} features and jsKjs support</caption><thead><tr><th scope="col">${c.lib}</th><th scope="col">jsKjs</th><th scope="col">Notes</th></tr></thead><tbody>
  ${c.rows.map(([f, s, n]) => `<tr><td>${esc(f)}</td><td class="${s}" style="white-space:nowrap">${label[s]}</td><td>${esc(n)}</td></tr>`).join('')}
  </tbody></table></div>
  ${(c.examples || []).map(ex => `<h2 style="margin-top:48px">${esc(ex.title)}</h2>${codeBlock(ex.code, ex.lang)}`).join('')}
  <p style="margin-top:30px"><a class="btn" href="/features/#${c.mod}">See every ${MODS[c.mod].name} feature live →</a></p>
</div>`);
});

/* =====================================================================
   AI SECTION
   ===================================================================== */
const KIT_FLAT = {
  'AGENTS.md': 'AGENTS.md', 'CLAUDE.md': 'CLAUDE.md', '.claude/skills/jskjs/SKILL.md': 'SKILL.md',
  '.github/copilot-instructions.md': 'copilot-instructions.md', '.github/instructions/jskjs.instructions.md': 'jskjs.instructions.md',
  '.cursor/rules/jskjs.mdc': 'jskjs.mdc', '.clinerules/jskjs.md': 'cline-jskjs.md', '.roo/rules/jskjs.md': 'roo-jskjs.md',
  '.continue/rules/jskjs.md': 'continue-jskjs.md', '.windsurf/rules/jskjs.md': 'windsurf-jskjs.md', 'GEMINI.md': 'GEMINI.md',
};
const KIT_BY_PATH = Object.fromEntries(RULES.FILES.map(f => [f.path, f]));
/* kit files: flat downloads + zips with real paths (also copied into the repo) */
const KIT_DIR = path.join(REPO, 'ai-kit');
fs.rmSync(KIT_DIR, { recursive: true, force: true });
for (const f of RULES.FILES) {
  writeFile(`ai/kit/${KIT_FLAT[f.path]}`, f.content);
  const p = path.join(KIT_DIR, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.content);
}
fs.writeFileSync(path.join(KIT_DIR, 'README.md'), `# jsKjs AI agent kit\n\nCopy the files for your tool into the root of your project, keeping their paths.\nDetails for every tool: ${C.SITE}/ai/kit/\n\n| File | Read by |\n|---|---|\n${RULES.FILES.map(f => `| \`${f.path}\` | ${f.tools} |`).join('\n')}\n`);
execSync(`cd "${KIT_DIR}" && rm -f ../kit.zip && zip -qr -X ../kit.zip . && mv ../kit.zip "${path.join(OUT, 'ai/kit/jskjs-ai-kit.zip')}"`);
{
  const tmp = path.join(REPO, '.skilltmp/jskjs'); fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(path.join(tmp, 'SKILL.md'), KIT_BY_PATH['.claude/skills/jskjs/SKILL.md'].content);
  execSync(`cd "${path.dirname(tmp)}" && zip -qr -X skill.zip jskjs && mv skill.zip "${path.join(OUT, 'ai/kit/jskjs-skill.zip')}"`);
  fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
}
writeFile('ai/kit/.htaccess', `AddType text/markdown;charset=utf-8 .md .mdc\n<IfModule mod_headers.c>\n  Header set X-Robots-Tag "noindex"\n  Header set Access-Control-Allow-Origin "*"\n</IfModule>\n`);

const fileBlock = (p, open = false) => {
  const f = KIT_BY_PATH[p];
  return `<details class="plate" style="padding:0;margin-top:12px"${open ? ' open' : ''}><summary style="padding:14px 18px;cursor:pointer;font:600 14px var(--mono)">${esc(p)} <span class="muted" style="font-family:var(--body);font-weight:500">— ${esc(f.tools)}</span></summary>
  <div style="padding:0 18px 18px"><p style="margin:4px 0 0"><a href="/ai/kit/${KIT_FLAT[p]}" download>Download ${esc(KIT_FLAT[p])}</a> · <code>curl -fsSLo ${esc(p)} ${C.SITE}/ai/kit/${KIT_FLAT[p]}</code></p>${codeBlock(f.content, 'md', 'Markdown')}</div></details>`;
};
const toolCards = () => AI.TOOLS.map(t => card(`/ai/${t.slug}/`, 'pulse', esc(t.vendor), esc(t.name), t.files.map(f => `<code>${esc(f)}</code>`).join(' '), 'Set it up →')).join('');

{
  const page = { path: '/ai/', title: 'Tell your AI agent to use jsKjs', seoTitle: 'Vibe Coding with jsKjs: Why AI Coding Agents Should Use It (and How)',
    desc: 'Why AI coding agents build better front-ends with jsKjs — one small, documented API, reviewable HTML, no build step — plus ready-made rules for Claude, Codex, Copilot, Cursor, Cline, Roo, Continue, Windsurf and Gemini.',
    lede: 'Ask your coding agent to use jsKjs and you get smaller diffs, fewer invented APIs and pages that work by opening a file. Drop in one rules file, say one sentence.',
    kicker: 'Build with AI', nav: 'ai', mod: 'pulse', crumbs: [{ name: 'AI agents', path: '/ai/' }] };
  page.jsonld = techArticle(page);
  emit(page, pageHead(page, `<div class="head-meta"><a class="btn btn-primary" href="/ai/kit/">Get the agent kit</a><a class="btn" href="/ai/prompts/">Prompt library</a></div>`) + `
<div class="wrap section">
  <div class="section-head"><p class="label">The advantages</p><h2>Why ask your agent to use jsKjs?</h2></div>
  <div class="grid g2">${AI.ADVANTAGES.map(([t, d], i) => `<div class="plate" data-mod="pulse"><span class="label">${String(i + 1).padStart(2, '0')}</span><h3 style="margin-top:12px">${t}</h3><p style="margin-top:8px;color:var(--muted);font-size:15.5px">${d}</p></div>`).join('')}</div>
  <div class="note" data-mod="motion" style="margin-top:28px"><strong>Honest limits</strong>jsKjs is for server-rendered sites, dashboards, marketing pages, forms and interactive widgets. A large single-page app with client-side routing and hundreds of components is still a job for a framework. Pulse needs <code>'unsafe-eval'</code> under a strict CSP. And it is a young library — the rules file lists what is <em>not</em> included so your agent can tell you instead of improvising.</div>
</div>
<div class="wrap section">
  <div class="section-head"><p class="label">How to ask</p><h2>Three steps</h2></div>
  <ol class="grid g3" style="list-style:none;padding:0;counter-reset:s">
    <li class="plate"><span class="series-num" aria-hidden="true">1</span><h3 style="margin-top:6px">Drop in the rules</h3><p class="muted" style="margin-top:8px">Copy one file for your tool — or <code>AGENTS.md</code>, which most agents read. <a href="/ai/kit/">Get the kit</a>.</p></li>
    <li class="plate"><span class="series-num" aria-hidden="true">2</span><h3 style="margin-top:6px">Say one sentence</h3><p class="muted" style="margin-top:8px">Start your request with “Use jsKjs”. The rules do the rest: one script tag, attributes first, real APIs only.</p></li>
    <li class="plate"><span class="series-num" aria-hidden="true">3</span><h3 style="margin-top:6px">Review the HTML</h3><p class="muted" style="margin-top:8px"><code>kj-post="/save.php" kj-target="#msg"</code> reads like a sentence. Approve, open the file, done.</p></li>
  </ol>
  <h3 style="margin-top:36px">The one sentence</h3>
  ${codeBlock(AI.PROMPTS[0].items[0][1], 'txt', 'Prompt')}
</div>
<div class="wrap section">
  <div class="section-head"><p class="label">Pick your tool</p><h2>Rules files for every major coding agent</h2><p class="lede" style="color:var(--muted)">Each is generated from the same source, so they never drift apart.</p></div>
  <div class="grid g3">${toolCards()}${card('/ai/llms-txt/', 'pulse', 'Any agent with web access', 'llms.txt & llms-full.txt', 'Point any model at <code>/llms-full.txt</code>.', 'Learn more →')}</div>
</div>`);
}
{
  const page = { path: '/ai/kit/', title: 'The jsKjs agent kit', seoTitle: 'jsKjs AI Agent Kit: AGENTS.md, CLAUDE.md, Skills, Cursor & Copilot Rules',
    desc: 'Download ready-made jsKjs rules for AI coding agents: AGENTS.md, CLAUDE.md and a Claude skill, Copilot instructions, Cursor .mdc, Cline, Roo Code, Continue, Windsurf and Gemini files.',
    lede: `Eleven files, one source of truth. Copy the one for your tool into your project — paths matter — or grab them all.`,
    kicker: 'Build with AI · Kit', nav: 'ai', mod: 'pulse', crumbs: [{ name: 'AI agents', path: '/ai/' }, { name: 'Agent kit', path: '/ai/kit/' }] };
  page.jsonld = techArticle(page);
  emit(page, pageHead(page, `<div class="head-meta"><a class="btn btn-primary" href="/ai/kit/jskjs-ai-kit.zip" download>Download all (zip)</a><a class="btn" href="/ai/kit/jskjs-skill.zip" download>Claude skill (zip)</a></div>`) + `
<div class="wrap section">
  <div class="table-wrap"><table><caption class="sr-only">Files in the jsKjs AI agent kit</caption><thead><tr><th scope="col">Put it at</th><th scope="col">Read by</th><th scope="col">Download</th></tr></thead><tbody>
  ${RULES.FILES.map(f => `<tr><td><code>${esc(f.path)}</code></td><td>${esc(f.tools)}</td><td><a href="/ai/kit/${KIT_FLAT[f.path]}" download>${esc(KIT_FLAT[f.path])}</a></td></tr>`).join('')}
  </tbody></table></div>
  <h2 style="margin-top:40px">Install from the terminal</h2>
  ${codeBlock(`# Universal (Codex, Copilot, Cursor, Cline, Roo, Windsurf…)\ncurl -fsSLo AGENTS.md ${C.SITE}/ai/kit/AGENTS.md\n\n# Claude Code\ncurl -fsSLo CLAUDE.md ${C.SITE}/ai/kit/CLAUDE.md\nmkdir -p .claude/skills/jskjs && curl -fsSLo .claude/skills/jskjs/SKILL.md ${C.SITE}/ai/kit/SKILL.md\n\n# Cursor\nmkdir -p .cursor/rules && curl -fsSLo .cursor/rules/jskjs.mdc ${C.SITE}/ai/kit/jskjs.mdc\n\n# GitHub Copilot\nmkdir -p .github && curl -fsSLo .github/copilot-instructions.md ${C.SITE}/ai/kit/copilot-instructions.md`, 'bash')}
  <h2 style="margin-top:40px">Every file</h2>
  ${RULES.FILES.map((f, i) => fileBlock(f.path, i === 0)).join('')}
  <h2 style="margin-top:40px">Set-up guides</h2>
  <div class="grid g3" style="margin-top:18px">${toolCards()}</div>
</div>`);
}
AI.TOOLS.forEach(t => {
  const page = { path: `/ai/${t.slug}/`, title: `jsKjs with ${t.name}`, seoTitle: `${t.seo} — jsKjs`, desc: t.desc, lede: t.desc, kicker: `Build with AI · ${t.vendor}`, nav: 'ai', mod: 'pulse',
    crumbs: [{ name: 'AI agents', path: '/ai/' }, { name: t.name, path: `/ai/${t.slug}/` }] };
  page.jsonld = techArticle(page, { '@type': 'HowTo', name: page.title, step: t.steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, text: s.replace(/<[^>]+>/g, '') })) });
  emit(page, pageHead(page, `<div class="head-meta">${t.files.map(f => `<a class="btn btn-sm" href="/ai/kit/${KIT_FLAT[f]}" download>${esc(KIT_FLAT[f])}</a>`).join('')}</div>`) + `
<div class="wrap section"><div class="layout"><article>
  ${t.intro ? `<div class="prose">${t.intro}</div>` : ''}
  <h2>Set-up</h2>
  <ol style="margin-top:14px;padding-left:1.3em;max-width:72ch">${t.steps.map(s => `<li style="margin-top:12px">${s}</li>`).join('')}</ol>
  <h2 style="margin-top:44px">The files</h2>
  ${t.files.map((f, i) => fileBlock(f, i === 0)).join('')}
  <h2 style="margin-top:44px">Prompts to try</h2>
  ${AI.PROMPTS[1].items.slice(0, 2).map(([title, p]) => `<h3 style="margin-top:18px">${esc(title)}</h3>${codeBlock(p, 'txt', 'Prompt')}`).join('')}
  <p><a href="/ai/prompts/">More prompts →</a></p>
  <h2 style="margin-top:44px;font-size:1.2rem">Official documentation</h2>
  <ul style="margin-top:10px">${t.docs.map(([n, u]) => `<li><a href="${u}" rel="noopener">${esc(n)}</a></li>`).join('')}</ul>
</article>
<aside class="aside" aria-label="AI tools"><div class="aside-group"><h2>Tools</h2><ul>${AI.TOOLS.map(x => `<li><a href="/ai/${x.slug}/"${x === t ? ' aria-current="page"' : ''}>${esc(x.name)}</a></li>`).join('')}</ul></div>
<div class="aside-group"><h2>More</h2><ul><li><a href="/ai/">Why jsKjs for agents</a></li><li><a href="/ai/kit/">The full kit</a></li><li><a href="/ai/prompts/">Prompt library</a></li><li><a href="/ai/recipes/">Vibe recipes</a></li></ul></div></aside>
</div></div>`);
});
{
  const page = { path: '/ai/prompts/', title: 'Prompt library', seoTitle: 'jsKjs Prompt Library: Copy-paste Prompts for AI Coding Agents',
    desc: 'Copy-paste prompts that get AI coding agents to build with jsKjs: kick-off, PHP backend pairing, live search, forms, reactive widgets, motion, jQuery migration and rule-based review.',
    lede: 'Prompts that work, because they name the right jsKjs feature. Copy, paste, adjust the file names.', kicker: 'Build with AI · Prompts', nav: 'ai', mod: 'pulse',
    crumbs: [{ name: 'AI agents', path: '/ai/' }, { name: 'Prompts', path: '/ai/prompts/' }] };
  page.jsonld = techArticle(page);
  emit(page, pageHead(page) + `<div class="wrap section" style="max-width:900px">${AI.PROMPTS.map(g => `<h2 style="margin-top:40px">${esc(g.group)}</h2>${g.items.map(([t, p]) => `<h3 style="margin-top:22px">${esc(t)}</h3>${codeBlock(p, 'txt', 'Prompt')}`).join('')}`).join('')}
  <div class="note" data-mod="pulse" style="margin-top:36px"><strong>Tip</strong>Agents follow rules files more reliably than long prompts. Put the rules in <a href="/ai/kit/">the kit file for your tool</a> and keep prompts about <em>what</em> you want.</div></div>`);
}
{
  const page = { path: '/ai/recipes/', title: 'Vibe recipes', seoTitle: 'Vibe Coding Recipes: Prompts and the jsKjs Code They Produce',
    desc: 'Real vibe-coding recipes: the prompt you give an AI agent and the jsKjs result, running live — newsletter signup, pricing toggle, live search with highlighting.',
    lede: 'A prompt on the left, the result running on the right. Each result is idiomatic jsKjs: attributes first, a few lines of JavaScript at most.', kicker: 'Build with AI · Recipes', nav: 'ai', mod: 'pulse',
    crumbs: [{ name: 'AI agents', path: '/ai/' }, { name: 'Recipes', path: '/ai/recipes/' }],
    headExtra: `<style>.price-big{font:850 46px/1 var(--display);font-stretch:115%}.toggle-row button[aria-pressed="true"]{background:var(--ink);color:var(--bg)}#rc-results mark{background:color-mix(in srgb,var(--pulse) 35%,transparent);color:inherit}</style>` };
  page.jsonld = techArticle(page);
  const recipes = [
    { t: 'Newsletter signup with server validation', p: 'Use jsKjs. Add a newsletter form that posts to subscribe.php without reloading, shows the server\'s message below it, and shows "Subscribing…" while the request runs.',
      html: String.raw`
<form kj-post="/api/subscribe.php" kj-target="#rc-msg" kj-indicator="#rc-spin" class="row">
  <label for="rc-email" class="sr-only">Email</label>
  <input id="rc-email" name="email" type="email" required placeholder="you@example.com" style="flex:1;min-width:200px">
  <button type="submit">Subscribe</button>
</form>
<p id="rc-spin" hidden class="muted">Subscribing…</p>
<p id="rc-msg" aria-live="polite"></p>` },
    { t: 'Pricing toggle', p: 'Use jsKjs. Turn the pricing card into a kj-data component with a Monthly / Yearly toggle (yearly = 2 months free). Use aria-pressed on the toggle buttons.',
      html: String.raw`
<div kj-data="{ yearly: false, base: 12 }">
  <div class="row toggle-row" role="group" aria-label="Billing period">
    <button type="button" @click="yearly = false" :aria-pressed="yearly ? 'false' : 'true'">Monthly</button>
    <button type="button" @click="yearly = true" :aria-pressed="yearly ? 'true' : 'false'">Yearly · 2 months free</button>
  </div>
  <p style="margin-top:16px"><span class="price-big" kj-text="'$' + (yearly ? base * 10 : base)"></span>
    <span class="muted" kj-text="yearly ? '/ year' : '/ month'"></span></p>
</div>` },
    { t: 'Live search with highlighted matches', p: 'Use jsKjs and PHP. Add a search box that queries search.php as I type (debounced), and have the PHP wrap the matched text in <mark>, escaping everything else.',
      html: String.raw`
<label for="rc-q">Search packages</label>
<input id="rc-q" name="q" type="search" autocomplete="off" style="margin-top:6px"
       kj-get="/api/search.php" kj-trigger="keyup delay:250ms" kj-target="#rc-results">
<ul id="rc-results" class="list-plain" aria-live="polite" style="font-family:var(--mono);font-size:14px"></ul>` },
  ];
  emit(page, pageHead(page) + `<div class="wrap section">${recipes.map((r, i) => `<section style="margin-top:${i ? 64 : 0}px"><p class="label">Recipe ${i + 1}</p><h2 style="margin-top:12px">${esc(r.t)}</h2>
  <div class="grid g2" style="margin-top:20px;align-items:start"><div><h3>The prompt</h3>${codeBlock(r.p, 'txt', 'Prompt')}<p class="muted" style="font-size:14.5px">With the <a href="/ai/kit/">rules file</a> in place, agents produce markup like this — zero JavaScript.</p></div>
  <div>${stage(page, { title: r.t, html: r.html })}</div></div></section>`).join('')}</div>`);
}
{
  const page = { path: '/ai/llms-txt/', title: 'llms.txt for jsKjs', seoTitle: 'jsKjs llms.txt and llms-full.txt: Documentation for Language Models',
    desc: 'jsKjs publishes llms.txt (an index for language models) and llms-full.txt (the complete rules and API in one file) so any AI with web access can learn the library in one fetch.',
    lede: 'Any model that can read a URL can learn jsKjs in one request. <code>/llms.txt</code> is the index; <code>/llms-full.txt</code> is everything.', kicker: 'Build with AI · llms.txt', nav: 'ai', mod: 'pulse',
    crumbs: [{ name: 'AI agents', path: '/ai/' }, { name: 'llms.txt', path: '/ai/llms-txt/' }] };
  page.jsonld = techArticle(page);
  emit(page, pageHead(page, `<div class="head-meta"><a class="btn btn-primary" href="/llms-full.txt">Open llms-full.txt</a><a class="btn" href="/llms.txt">Open llms.txt</a></div>`) + `<div class="wrap section"><div class="prose">
  <p><a href="https://llmstxt.org/" rel="noopener">llms.txt</a> is a proposed convention: a Markdown file at a site's root that tells language models what the site is and where the important pages are. jsKjs publishes two:</p>
  <ul><li><strong><a href="/llms.txt">/llms.txt</a></strong> — a short summary plus links to every feature, guide and comparison.</li><li><strong><a href="/llms-full.txt">/llms-full.txt</a></strong> — the complete agent rules and API in one file (the same text as <code>AGENTS.md</code>).</li></ul>
  <p>Tell an agent with web access: <em>“Read https://jskjs.org/llms-full.txt, then build …”</em>. For agents without web access, use the <a href="/ai/kit/">rules files</a> instead.</p></div>
  ${codeBlock(`Read ${C.SITE}/llms-full.txt first. Then, using jsKjs only, build …`, 'txt', 'Prompt')}</div>`);
}

/* =====================================================================
   START, MIGRATE, CDN, RELEASES, DOWNLOAD, 404
   ===================================================================== */
const SCRIPT_TAG = `<script src="https://jskjs.org/cdn/${C.VERSION}/jskjs.min.js"\n        integrity="${C.SRI_MIN}"\n        crossorigin="anonymous"></script>`;
{
  const page = { path: '/start/', title: 'Getting started', seoTitle: 'Getting Started with jsKjs: Your First Page in 60 Seconds',
    desc: 'Install jsKjs with one script tag, build a first page that uses all four modules, pair it with a tiny PHP endpoint, and set up your AI agent — in about a minute.',
    lede: 'One script tag, one HTML file, no build step. Here is a complete first page that uses all four modules.', kicker: 'Getting started', nav: 'start', mod: 'core', crumbs: [{ name: 'Getting started', path: '/start/' }] };
  page.jsonld = techArticle(page, { '@type': 'HowTo', name: 'Get started with jsKjs', step: ['Add the script tag', 'Write your first page', 'Add a backend endpoint', 'Tell your AI agent'].map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s })) });
  const first = String.raw`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>My first jsKjs page</title></head>
<body>
  <!-- Pulse: reactive state, no JavaScript -->
  <div kj-data="{ count: 0 }">
    <button @click="count++">Clicked <span kj-text="count"></span> times</button>
  </div>

  <!-- Hyper: load HTML from the server on click -->
  <button kj-get="/hello.php" kj-target="#greeting">Say hello</button>
  <p id="greeting" aria-live="polite"></p>

  <ul id="list"><li>One</li><li>Two</li></ul>

  <script src="https://jskjs.org/cdn/${C.VERSION}/jskjs.min.js"></script>
  <script>
    // Core: the jQuery API you know
    $('#list').on('click', 'li', function () { $(this).toggleClass('done'); });

    // Motion: a staggered entrance (seconds, not milliseconds)
    $.from('#list li', { x: -20, opacity: 0, duration: .4, stagger: .1 });
  </script>
</body>
</html>`;
  emit(page, pageHead(page) + `<div class="wrap section"><div class="layout"><article>
  <h2>1 · Add the script</h2>
  <p style="margin-top:10px;max-width:70ch">Use the pinned CDN URL with its integrity hash — it never changes, so browsers can cache it for a year:</p>
  ${codeBlock(SCRIPT_TAG, 'html')}
  <p style="max-width:70ch">Prefer to self-host? <a href="/cdn/${C.VERSION}/jskjs.min.js" download>Download jskjs.min.js</a> (${C.KJ_MIN_KB} KB, ${C.KJ_GZ_KB} KB gzipped) or the <a href="/download/">whole repository</a>. Put the tag at the end of <code>&lt;body&gt;</code>, and register any <code>$.component()</code> or <code>$.store()</code> in a script right after it.</p>
  <h2 style="margin-top:44px">2 · Write your first page</h2>
  ${codeBlock(first, 'html')}
  <h2 style="margin-top:44px">3 · Add a backend endpoint</h2>
  <p style="margin-top:10px;max-width:70ch">Hyper requests expect HTML back. Any server works; on shared hosting, a PHP file is the shortest path:</p>
  ${codeBlock(String.raw`<?php // hello.php
header('Content-Type: text/html; charset=utf-8');
$name = htmlspecialchars($_GET['name'] ?? 'world', ENT_QUOTES, 'UTF-8');   // always escape
echo "Hello, $name — served at " . date('H:i:s');`, 'php')}
  <h2 style="margin-top:44px">4 · Tell your AI agent</h2>
  <p style="margin-top:10px;max-width:70ch">Drop <a href="/ai/kit/AGENTS.md" download>AGENTS.md</a> (or the file for your tool) into the project and start your prompt with “Use jsKjs”. <a href="/ai/">Why this works →</a></p>
  <h2 style="margin-top:44px">Browser support</h2>
  <div class="table-wrap"><table><thead><tr><th scope="col">Browser</th><th scope="col">Minimum</th></tr></thead><tbody><tr><td>Chrome / Edge</td><td>90</td></tr><tr><td>Firefox</td><td>90</td></tr><tr><td>Safari (macOS & iOS)</td><td>15</td></tr><tr><td>Internet Explorer</td><td>Not supported</td></tr></tbody></table></div>
  <h2 style="margin-top:44px">Where next?</h2>
  <div class="grid g3" style="margin-top:18px">${card('/features/', 'core', 'Learn', 'All features', 'Forty live demos with source.')}${card('/docs/', 'hyper', 'Reference', 'API reference', 'Every function and attribute.')}${card('/migrate/', 'motion', 'Upgrade', 'Migrate from jQuery', 'Checklist and differences.')}</div>
</article><aside class="aside" aria-label="On this page"><div class="aside-group"><h2>Quick links</h2><ul><li><a href="/cdn/">CDN & SRI</a></li><li><a href="/download/">Download the repo</a></li><li><a href="/demo/">Feature tour</a></li><li><a href="/ai/kit/">AI agent kit</a></li></ul></div></aside></div></div>`);
}
{
  const page = { path: '/migrate/', title: 'Migrate from jQuery', seoTitle: 'Migrate from jQuery to jsKjs: Checklist, Differences and Replacements',
    desc: 'Move a jQuery site to jsKjs: swap the script, check the short list of behavioural differences, replace removed APIs, then optionally adopt kj-* attributes, kj-data and $.to.',
    lede: 'For most pages: swap one script tag, run your test pass, and fix the handful of differences below. Then adopt the new modules at your own pace.', kicker: 'Migrate', nav: 'start', mod: 'core', crumbs: [{ name: 'Migrate from jQuery', path: '/migrate/' }] };
  page.jsonld = techArticle(page);
  const diffs = [
    ['<code>$.ajax()</code> returns a native Promise (not jqXHR)', '<code>.done/.fail/.always</code> and callbacks still work. <code>xhr.status</code> becomes <code>err.status</code>; <code>xhr.responseText</code> becomes <code>err.data</code>.'],
    ['Handlers receive the native Event', 'Use <code>e.key</code>, <code>e.target</code>, <code>e.detail</code>. <code>e.originalEvent</code> does not exist (you already have it).'],
    ['<code>.trigger(type, payload)</code> takes one payload', 'Pass an object instead of an array of extra parameters.'],
    ['<code>.val()</code> on a checkbox returns <code>true/false</code>', 'Use <code>.attr("value")</code> if you need the value attribute.'],
    ['Collections are real Arrays', 'Native <code>.map()</code> (callback <code>(el, i)</code>) returns a plain array. jQuery\'s <code>.map((i, el) =&gt; …)</code> → use <code>$.map()</code> or swap the parameters.'],
    ['Selectors are pure CSS', 'Replace <code>:visible</code>, <code>:first</code>, <code>:eq(n)</code>, <code>:even</code> with methods or CSS (<code>:nth-child</code>).'],
    ['Browser support', 'Evergreen only: no IE11, no pre-2021 Safari/Firefox.'],
  ];
  const removed = [
    ['.stop() .finish() .delay() .queue()', 'await, $.timeline(), setTimeout'], ['$.Deferred() $.when()', 'new Promise(), Promise.all()'],
    ['.bind() .live() .delegate()', '.on() with a selector'], ['$.ajaxSetup()', 'a small wrapper around $.ajax'], ['.nextAll() .prevAll() .parentsUntil()', 'loops with .next() / .parent(), or native APIs'],
    ['.wrapAll() .wrapInner() .unwrap()', 'native DOM (before/append)'], ['.innerWidth() .outerWidth()', 'getBoundingClientRect() / clientWidth'], ['$.grep() $.inArray()', 'Array.prototype.filter / includes'],
  ];
  emit(page, pageHead(page) + `<div class="wrap section" style="max-width:980px">
  <h2>The checklist</h2>
  <ol style="margin-top:14px;padding-left:1.3em;max-width:72ch">
    <li style="margin-top:10px">Replace the jQuery script tag with ${'`'}jskjs.min.js${'`'.replace('`', '')} — see <a href="/cdn/">CDN</a>. jsKjs also defines <code>window.jQuery</code> if nothing else has.</li>
    <li style="margin-top:10px">Search your code for the APIs in <a href="#removed">“Removed and replaced”</a> and for jQuery-only selectors (<code>:visible</code>, <code>:first</code>, <code>:eq</code>).</li>
    <li style="margin-top:10px">Check AJAX error handlers: <code>xhr.status</code> → <code>err.status</code>.</li>
    <li style="margin-top:10px">Run your tests or click through. Most pages need no further changes.</li>
    <li style="margin-top:10px">Optional: replace hand-wired AJAX with <a href="/features/declarative-requests/"><code>kj-*</code> attributes</a>, state juggling with <a href="/features/reactive-state/"><code>kj-data</code></a>, and <code>.animate()</code> with <a href="/features/tweens/"><code>$.to()</code></a>.</li>
  </ol>
  <h2 style="margin-top:48px">Behaviour that differs</h2>
  <div class="table-wrap"><table><thead><tr><th scope="col">Difference</th><th scope="col">What to do</th></tr></thead><tbody>${diffs.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table></div>
  <h2 style="margin-top:48px" id="removed">Removed and replaced</h2>
  <div class="table-wrap"><table><thead><tr><th scope="col">jQuery</th><th scope="col">Use instead</th></tr></thead><tbody>${removed.map(([a, b]) => `<tr><td><code>${esc(a)}</code></td><td>${esc(b)}</td></tr>`).join('')}</tbody></table></div>
  <h2 style="margin-top:48px">Let an agent do it</h2>
  ${codeBlock(AI.PROMPTS[2].items[0][1], 'txt', 'Prompt')}
  <p><a href="/compare/jquery/">Full line-by-line comparison with jQuery 4 →</a></p>
</div>`.replace("${'`'}jskjs.min.js${'`'.replace('`', '')}", '<code>jskjs.min.js</code>'));
}
{
  const page = { path: '/cdn/', title: 'CDN & downloads', seoTitle: `jsKjs CDN: Pinned Script Tags, SRI Hashes and Downloads (v${C.VERSION})`,
    desc: `Official jsKjs ${C.VERSION} CDN URLs with subresource-integrity hashes, minified and source builds, caching and CORS details, and self-hosting instructions.`,
    lede: 'Pinned, immutable URLs with integrity hashes. Served with CORS and long-lived caching, so any site can use them safely.', kicker: 'CDN', nav: 'cdn', mod: 'motion', crumbs: [{ name: 'CDN', path: '/cdn/' }] };
  page.jsonld = { '@context': 'https://schema.org', '@type': 'SoftwareSourceCode', name: 'jsKjs', version: C.VERSION, codeRepository: C.GITHUB, programmingLanguage: 'JavaScript', license: 'https://opensource.org/licenses/MIT', downloadUrl: `${C.SITE}/cdn/${C.VERSION}/jskjs.min.js` };
  emit(page, pageHead(page) + `<div class="wrap section" style="max-width:980px">
  <h2>Production (minified) — recommended</h2>
  <p class="muted" style="margin-top:8px">${C.KJ_MIN_KB} KB · ${C.KJ_GZ_KB} KB gzipped · cached for a year (immutable)</p>
  ${codeBlock(SCRIPT_TAG, 'html')}
  <p><a class="btn btn-primary" href="/cdn/${C.VERSION}/jskjs.min.js" download>Download jskjs.min.js</a></p>
  <h2 style="margin-top:48px">Development (readable source)</h2>
  <p class="muted" style="margin-top:8px">${C.KJ_SRC_KB} KB, fully commented — the best way to read how jsKjs works</p>
  ${codeBlock(`<script src="https://jskjs.org/cdn/${C.VERSION}/jskjs.js"\n        integrity="${C.SRI_FULL}"\n        crossorigin="anonymous"></script>`, 'html')}
  <p><a class="btn" href="/cdn/${C.VERSION}/jskjs.js" download>Download jskjs.js</a></p>
  <h2 style="margin-top:48px">All URLs</h2>
  <div class="table-wrap"><table><thead><tr><th scope="col">URL</th><th scope="col">Caching</th><th scope="col">Use for</th></tr></thead><tbody>
    <tr><td><code>/cdn/${C.VERSION}/jskjs.min.js</code></td><td>1 year, immutable</td><td>Production (with SRI)</td></tr>
    <tr><td><code>/cdn/${C.VERSION}/jskjs.js</code></td><td>1 year, immutable</td><td>Debugging (with SRI)</td></tr>
    <tr><td><code>/cdn/jskjs.min.js</code></td><td>1 hour</td><td>Always-latest experiments — no SRI, may change</td></tr>
    <tr><td><code>/cdn/jskjs.js</code></td><td>1 hour</td><td>Always-latest source</td></tr>
  </tbody></table></div>
  <div class="note" data-mod="motion"><strong>Why pin?</strong>An integrity hash only matches one exact file. The versioned URLs never change, so the hash stays valid and browsers can cache them for a year. The “latest” URLs will change with each release — never combine them with <code>integrity</code>.</div>
  <h2 style="margin-top:48px">Self-hosting</h2>
  <p style="margin-top:10px;max-width:70ch">Copy <code>jskjs.min.js</code> next to your pages and reference it with a relative path. It has no dependencies and needs no build step. If you serve it cross-origin with SRI, send <code>Access-Control-Allow-Origin: *</code>. The source is also on <a href="${C.GITHUB}" rel="noopener">GitHub</a>.</p>
</div>`);
}
{
  const page = { path: '/releases/', title: 'Release notes', seoTitle: 'jsKjs Release Notes and Changelog',
    desc: `jsKjs changelog. v${C.VERSION} (${C.RELEASE_DATE}): jQuery-compatible core, Hyper declarative requests, Pulse reactivity, Motion animation — ${C.KJ_GZ_KB} KB gzipped, MIT licensed.`,
    lede: 'jsKjs follows semantic versioning. The documented API is stable within a major version.', kicker: 'Releases', nav: 'cdn', mod: 'motion', crumbs: [{ name: 'Releases', path: '/releases/' }] };
  page.jsonld = techArticle(page);
  emit(page, pageHead(page) + `<div class="wrap section" style="max-width:900px"><article class="plate screws" data-mod="motion">
  <p class="label">v${C.VERSION} · ${C.RELEASE_DATE} · first public release</p>
  <div class="prose" style="margin-top:16px">
  <h2 style="margin-top:0">Core — jQuery-compatible</h2>
  <p>Native <code>querySelectorAll</code> selectors; Array-subclass collections; content, attribute, class, CSS (including custom properties), geometry and WeakMap-backed data methods; traversal with selector/function/element matchers; insertion and removal; events with delegation, namespaces, <code>.one()</code> and custom-event payloads; fetch-based <code>$.ajax</code>, <code>$.get</code>, <code>$.post</code>, <code>$.getJSON</code>, <code>.load()</code>, <code>.serialize()</code>, <code>.serializeObject()</code>.</p>
  <h2>Hyper — htmx-style</h2>
  <p><code>kj-get/post/put/patch/delete</code>, <code>kj-target</code>, eight <code>kj-swap</code> strategies, <code>kj-trigger</code> (events, <code>delay:</code>, <code>load</code>, <code>revealed</code>, <code>every Ns</code>), <code>kj-confirm</code>, <code>kj-indicator</code> with automatic <code>aria-busy</code>, <code>kj-include</code>, <code>kj-vals</code>, <code>kj-push-url</code>; lifecycle events <code>kj:before/after/error/load</code>; automatic wiring of new content.</p>
  <h2>Pulse — Alpine-style</h2>
  <p><code>kj-data</code> with <code>init(el)</code>, <code>kj-text</code>, <code>kj-html</code>, <code>kj-show</code>, <code>kj-model</code> (text, number, range, select, checkbox, radio), <code>@event</code> with <code>.prevent/.stop/.enter/.escape</code>, <code>:attr</code> binding, <code>$.component()</code> with arguments, <code>$.store()</code>, <code>$.reactive()</code>.</p>
  <h2>Motion — GSAP-style</h2>
  <p><code>$.to/$.from/$.fromTo</code> with independent transforms, ten easings (<code>$.easings</code>) or custom functions, <code>stagger</code>, Promises; <code>$.timeline()</code> with <code>'&lt;'</code> and <code>'+=N'</code> positions, <code>paused</code>, <code>play()</code>, <code>onComplete</code>; classic <code>fadeIn/fadeOut/fadeToggle/slideDown/slideUp/slideToggle/animate</code>.</p>
  <h2>Hardening before launch</h2>
  <ul>
    <li>Deep <code>$.extend</code> ignores <code>__proto__</code>, <code>constructor</code> and <code>prototype</code> keys (prototype-pollution fix, with regression test).</li>
    <li>HTML strings with surrounding whitespace are parsed as HTML, not selectors.</li>
    <li>Hyper sends URL-encoded bodies (multipart only for file uploads) and includes a named input's own value.</li>
    <li><code>kj:after</code> fires before the swap and <code>kj:load</code> reaches document listeners even after <code>outerHTML</code> swaps.</li>
    <li>Polling stops when its element is removed.</li>
    <li><code>kj-model</code> supports radio buttons and accepts programmatic changes on focused fields.</li>
    <li>Callback-style AJAX no longer reports unhandled promise rejections.</li>
    <li><code>.not()</code>/<code>.is()</code> accept functions and elements; <code>.css()</code> reads and writes custom properties without <code>px</code>.</li>
    <li>Timelines start <code>'&lt;'</code> steps together with the previous step; zero-duration tweens are safe.</li>
  </ul>
  <h2>Footprint & support</h2>
  <p>${C.KJ_MIN_KB} KB minified, ${C.KJ_GZ_KB} KB gzipped, zero dependencies. Chrome/Edge/Firefox 90+, Safari 15+. Tested with ${47} unit tests and real-browser checks of every demo on this site.</p>
  </div></article>
  <p style="margin-top:24px">Report issues and follow future releases on <a href="${C.GITHUB}" rel="noopener">GitHub</a>.</p></div>`);
}
{
  const page = { path: '/download/', title: 'Drum roll, please.', seoTitle: 'Download jsKjs — Source Code on GitHub (kchecker/jskjs)',
    desc: 'Download jsKjs: the open-source repository on GitHub (github.com/kchecker/jskjs) with source, minified build, tests, the AI agent kit and this website. MIT licensed.',
    lede: '', kicker: 'The repository', nav: '', mod: 'motion', crumbs: [{ name: 'Download', path: '/download/' }], cable: false,
    headExtra: `<style>.drum-band .crumbs{justify-content:center}.drum-stage h1{max-width:none;margin:14px auto 8px}.drum-controls{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;align-items:center;margin-top:26px}.drum-controls label{color:var(--chrome-muted);font-weight:600}.stick{transform-box:fill-box;transform-origin:90% 90%}.stick-r{transform-origin:10% 90%}</style>` };
  page.jsonld = { '@context': 'https://schema.org', '@type': 'SoftwareSourceCode', name: 'jsKjs', codeRepository: C.GITHUB, downloadUrl: C.GITHUB_ZIP, license: 'https://opensource.org/licenses/MIT', programmingLanguage: 'JavaScript', version: C.VERSION, author: C.AUTHOR_PEOPLE };
  const drum = `<svg class="drum-svg" viewBox="0 0 300 220" aria-hidden="true">
    <g id="stick-l" class="stick"><rect x="40" y="20" width="10" height="110" rx="5" fill="#FFB224" transform="rotate(-38 45 75)"/><circle cx="18" cy="38" r="9" fill="#FFC655"/></g>
    <g id="stick-r" class="stick stick-r"><rect x="250" y="20" width="10" height="110" rx="5" fill="#FFB224" transform="rotate(38 255 75)"/><circle cx="282" cy="38" r="9" fill="#FFC655"/></g>
    <ellipse cx="150" cy="200" rx="110" ry="16" fill="#1C1F3D"/>
    <path d="M40 120 v70 a110 22 0 0 0 220 0 v-70" fill="#4D7CFF"/>
    <path d="M40 140 L80 190 L120 140 L160 190 L200 140 L240 190 L260 160" stroke="#E9EBF7" stroke-width="3" fill="none" opacity=".7"/>
    <ellipse id="drum-head" cx="150" cy="120" rx="110" ry="24" fill="#E9EBF7" stroke="#FF4F8B" stroke-width="6"/>
  </svg>`;
  page.rawScripts = `<script>\n${fs.readFileSync(path.join(SRC, 'content/drumroll.js'), 'utf8')}\n</script>`;
  emit(page, `<div class="band drum-band"><div class="wrap drum-stage">
    <div>${L.crumbsHTML(page)}
    <p class="label" style="justify-content:center;margin-top:24px" data-mod="motion">The repository is public</p>
    <h1>Drum roll, please.</h1>
    ${drum}
    <div class="drum-count" id="drum-count" aria-hidden="true"></div>
    <p class="drum-caption" id="drum-caption" aria-live="polite"></p>
    <div class="drum-controls" id="drum-controls">
      <button class="btn btn-primary" type="button" id="roll">🥁 Start the drum roll</button>
      <label><input type="checkbox" id="roll-sound" checked> Sound</label>
      <button class="btn" type="button" id="roll-skip">Skip to the link</button>
    </div>
    <div class="reveal" id="reveal" data-staged style="margin-top:34px">
      <div class="repo-card">
        <p class="label" style="color:var(--pulse)" data-mod="pulse">Open source · MIT</p>
        <p class="repo-name" style="margin-top:12px"><a id="repo-link" href="${C.GITHUB}" rel="noopener" style="text-decoration:none;color:inherit">github.com/<span>kchecker</span>/jskjs</a></p>
        <p style="color:var(--rack-muted);margin-top:10px">Source, minified build, tests, the AI agent kit and the code for this website.</p>
        <div class="repo-actions">
          <a class="btn btn-primary" href="${C.GITHUB}" rel="noopener">${ICON_GH.replace('<svg', '<svg width="18" height="18"')} Open on GitHub</a>
          <a class="btn" href="${C.GITHUB_ZIP}" rel="noopener">Download ZIP</a>
          <a class="btn" href="${C.GITHUB}/stargazers" rel="noopener">★ Star it</a>
        </div>
        ${codeBlock(`git clone ${C.GITHUB}.git\ncd jskjs && npm install && npm test`, 'bash')}
      </div>
    </div></div>
  </div></div>
  <div class="wrap section" style="max-width:900px">
    <h2>What's in the repository</h2>
    ${codeBlock(`jskjs/
├── src/jskjs.js          ← the library, fully commented (${C.KJ_SRC_KB} KB)
├── dist/                 ← jskjs.js + jskjs.min.js (${C.KJ_GZ_KB} KB gzipped)
├── test/                 ← unit tests (Node + jsdom)
├── ai-kit/               ← AGENTS.md, CLAUDE.md, skills and rules for every agent
├── site/                 ← this website: generator, content, PHP demo endpoints
├── .github/workflows/    ← CI tests + optional Hostinger deploy branch
├── README.md · LICENSE · CHANGELOG.md · DEPLOY.md`, 'txt', 'Tree')}
    <div class="grid g3" style="margin-top:26px">${card('/start/', 'core', 'No clone needed', 'Use the CDN', 'One script tag gets you started.')}${card('/ai/kit/', 'pulse', 'For your agent', 'AI agent kit', 'Rules for every major coding agent.')}${card('/releases/', 'motion', 'What shipped', 'Release notes', 'Everything in v' + C.VERSION + '.')}</div>
  </div>`);
}
{
  const page = { path: '/404.html', title: 'Page not found', seoTitle: 'Page not found — jsKjs', desc: 'This page does not exist. Find jsKjs features, docs and demos from here.',
    lede: 'This jack isn\'t patched to anything. The page may have moved — try one of these instead.', kicker: '404', noindex: true, mod: 'hyper' };
  emit(page, pageHead(page) + `<div class="wrap section"><div class="grid g4">${card('/', 'core', 'Home', 'jsKjs home', 'Start at the top.')}${card('/features/', 'hyper', 'Learn', 'All features', 'Forty live demos.')}${card('/docs/', 'pulse', 'Reference', 'API docs', 'Every function.')}${card('/download/', 'motion', 'Get it', 'Download 🥁', 'The repository.')}</div></div>`);
}

/* =====================================================================
   HOME
   ===================================================================== */
{
  const page = { path: '/', title: 'jsKjs', ogTitle: 'jsKjs — four libraries, one $', seoTitle: `jsKjs — jQuery-compatible JavaScript with htmx, Alpine & GSAP superpowers in ${C.KJ_GZ_KB} KB`,
    desc: `jsKjs is an open-source, jQuery-compatible JavaScript library with htmx-style requests, Alpine-style reactivity and GSAP-style animation in one ${C.KJ_GZ_KB} KB script. No build step, built for AI agents.`,
    nav: '', mod: 'motion' };
  page.jsonld = [
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'jsKjs', url: C.SITE + '/', description: page.desc, inLanguage: 'en' },
    { '@context': 'https://schema.org', '@type': 'SoftwareSourceCode', name: 'jsKjs', description: page.desc, codeRepository: C.GITHUB, programmingLanguage: 'JavaScript', runtimePlatform: 'Web browser', version: C.VERSION, license: 'https://opensource.org/licenses/MIT', author: C.AUTHOR_PEOPLE, url: C.SITE + '/' },
  ];
  const sz = n => KB(C.SIZES.find(s => s.name.startsWith(n)).gz);
  const mod = (k, name, from, size, knobs) => `<div class="module" data-mod="${k}"><div class="mname">${name}</div><div class="mfrom">${from}</div><div class="msize">replaces ${size} KB</div><div class="knobs">${knobs.map(v => `<span class="knob" style="--k:${v}%"></span>`).join('')}</div><span class="jack-out"></span></div>`;
  const hero = `<div class="band"><div class="wrap hero"><div class="hero-grid">
  <div>
    <p class="label" data-mod="motion">v${C.VERSION} · Open source · MIT</p>
    <h1>Four libraries.<br>One <span class="dollar">$</span>.</h1>
    <p class="lede">jsKjs is the jQuery API you already know — plus htmx-style requests, Alpine-style reactivity and GSAP-style motion — in one ${C.KJ_GZ_KB} KB script. No build step. No dependencies. Made for humans and their AI agents.</p>
    <div class="cta"><a class="btn btn-primary" href="/start/">Start in 60 seconds</a><a class="btn" href="/features/">See it live</a><a class="btn" href="/download/">Get it 🥁</a></div>
    <div class="install">${codeBlock(`<script src="https://jskjs.org/cdn/${C.VERSION}/jskjs.min.js"></script>`, 'html', 'One script tag')}</div>
  </div>
  <div class="bay" id="bay" role="img" aria-label="Diagram: four modules — Core (jQuery API, replaces ${sz('jQuery')} KB), Hyper (htmx-style, ${sz('htmx')} KB), Pulse (Alpine-style, ${sz('Alpine')} KB) and Motion (GSAP-style, ${sz('GSAP')} KB) — patched into one ${C.KJ_GZ_KB} KB jsKjs output.">
    ${mod('core', 'Core', 'jQuery-compatible API', sz('jQuery'), [60, 35, 75])}
    ${mod('hyper', 'Hyper', 'htmx-style requests', sz('htmx'), [40, 70, 25])}
    ${mod('pulse', 'Pulse', 'Alpine-style state', sz('Alpine'), [80, 45, 55])}
    ${mod('motion', 'Motion', 'GSAP-style animation', sz('GSAP'), [30, 65, 50])}
    <div class="output"><span class="jack-in"></span><div class="big">$ ${C.KJ_GZ_KB} KB</div><div class="small">jsKjs · gzipped</div></div>
    <svg class="cables" aria-hidden="true"></svg>
  </div>
  </div></div>
  <div class="ticker"><div class="wrap"><span><b>${KB(OTHERS_GZ)} KB → ${C.KJ_GZ_KB} KB</b> gzipped</span><span><b>0</b> dependencies</span><span><b>0</b> build steps</span><span><b>${FEATURES.length}</b> features with live demos</span><span><b>${RULES.FILES.length}</b> AI-agent rule files</span></div></div></div>`;

  const rows = [
    { k: 'core', title: 'The $ you know', text: 'Selectors, traversal, events, delegation, AJAX — the jQuery API, on native browser features. Your muscle memory works on day one; collections are real arrays.', link: '/features/#core',
      demo: { title: 'Delegation in six lines', html: String.raw`
<form id="h-form" class="row"><label for="h-in" class="sr-only">New item</label><input id="h-in" type="text" placeholder="Add an item…" style="flex:1;min-width:160px"><button type="submit">Add</button></form>
<ul id="h-list" class="list-plain"><li>Click an item to strike it</li><li>New items work too</li></ul>`,
        js: String.raw`
$('#h-form').on('submit', e => {
  e.preventDefault();
  if ($('#h-in').val()) $('<li>').text($('#h-in').val()).appendTo('#h-list');
  $('#h-in').val('');
});
$('#h-list').on('click', 'li', function () { $(this).css('text-decoration', 'line-through').fadeOut(500); });` } },
    { k: 'hyper', title: 'Requests in your HTML', text: 'Describe the request in attributes and let the server answer with HTML. Live search, forms, polling and infinite scroll without writing a handler. This one is calling a real PHP endpoint.', link: '/features/#hyper',
      demo: { title: 'Live search — zero JavaScript', html: String.raw`
<label for="h-q">Search jsKjs internals</label>
<input id="h-q" name="q" type="search" autocomplete="off" placeholder="Try “anim” or “store”" style="margin-top:6px"
       kj-get="/api/search.php" kj-trigger="keyup delay:250ms" kj-target="#h-hits">
<ul id="h-hits" class="list-plain" aria-live="polite" style="font-family:var(--mono);font-size:14px"></ul>` } },
    { k: 'pulse', title: 'State that lives on the element', text: 'Declare state with kj-data, bind it with kj-text, kj-show, kj-model and @click. Change the data and the page follows — no build step, no virtual DOM.', link: '/features/#pulse',
      demo: { title: 'Pricing toggle — zero JavaScript', html: String.raw`
<div kj-data="{ yearly: false }">
  <div class="row" role="group" aria-label="Billing period">
    <button type="button" @click="yearly = false" :aria-pressed="yearly ? 'false' : 'true'">Monthly</button>
    <button type="button" @click="yearly = true" :aria-pressed="yearly ? 'true' : 'false'">Yearly</button>
  </div>
  <p style="margin:14px 0 0"><b style="font:850 40px/1 var(--display)" kj-text="yearly ? '$120' : '$12'"></b>
    <span class="muted" kj-text="yearly ? 'per year — two months free' : 'per month'"></span></p>
</div>` } },
    { k: 'motion', title: 'Motion with taste', text: 'Tweens, transforms, ten easings, stagger and timelines on requestAnimationFrame — with Promises you can await. Seconds, like GSAP; classic fadeIn() still works.', link: '/features/#motion',
      demo: { title: 'A staggered wave', html: String.raw`
<div id="h-dots" style="display:grid;grid-template-columns:repeat(12,1fr);gap:8px" aria-hidden="true"></div>
<div class="row" style="margin-top:14px"><button type="button" id="h-wave">Play the wave</button></div>`,
        js: String.raw`
for (let i = 0; i < 36; i++) $('<span>').css({ aspectRatio: '1', borderRadius: '50%', background: 'var(--motion)', opacity: .35 }).appendTo('#h-dots');
$('#h-wave').on('click', async () => {
  await $.to('#h-dots span', { y: -14, opacity: 1, duration: .25, stagger: .02, ease: 'power2.out' });
  $.to('#h-dots span', { y: 0, opacity: .35, duration: .5, stagger: .02, ease: 'bounce.out' });
});` } },
  ];
  const rowsHTML = rows.map(r => `<div class="feature-row" data-mod="${r.k}"><div><p class="label">${MODS[r.k].long}</p><h2 style="margin-top:14px">${r.title}</h2><p class="lede" style="margin-top:14px;color:var(--muted)">${r.text}</p><p style="margin-top:18px"><a class="btn" href="${r.link}">${MODS[r.k].name} features →</a></p></div><div>${stage(page, r.demo)}</div></div>`).join('');

  page.rawScripts = `<script>\n${fs.readFileSync(path.join(SRC, 'content/patchbay.js'), 'utf8')}\n</script>`;
  emit(page, hero + `
<div class="wrap section">${rowsHTML}</div>
<div class="wrap section"><div class="feature-row" style="align-items:start" data-mod="util">
  <div><p class="label">Measured, not guessed</p><h2 style="margin-top:14px">A twelfth of the weight</h2><p class="lede" style="margin-top:14px;color:var(--muted)">The official builds of the four libraries total ${KB(OTHERS_GZ)} KB gzipped. jsKjs is ${C.KJ_GZ_KB} KB, because it targets evergreen browsers and ports the parts most sites use. <a href="/compare/">See exactly what's included.</a></p></div>
  <div>${sizeChart()}</div>
</div></div>
<div class="wrap section" data-mod="pulse">
  <div class="section-head"><p class="label">Built for AI agents</p><h2>Tell your agent “use jsKjs”.</h2><p class="lede" style="color:var(--muted)">One documented API instead of four, HTML you can review at a glance, and nothing to build. Ready-made rules for every major coding agent.</p></div>
  <div class="grid g4">${AI.ADVANTAGES.slice(0, 4).map(([t, d]) => `<div class="plate"><h3>${t}</h3><p style="margin-top:8px;color:var(--muted);font-size:15px">${d.split('. ')[0]}.</p></div>`).join('')}</div>
  <div class="row" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:22px">${AI.TOOLS.map(t => `<a class="chip" href="/ai/${t.slug}/">${esc(t.name)}</a>`).join('')}<a class="chip" href="/ai/llms-txt/">llms.txt</a></div>
  <p style="margin-top:24px"><a class="btn btn-primary" href="/ai/">Why agents build better with jsKjs →</a> <a class="btn" href="/ai/kit/">Get the agent kit</a></p>
</div>
<div class="wrap section" data-mod="hyper">
  <div class="section-head"><p class="label">A fair review</p><h2>What aged in jQuery</h2><p class="lede" style="color:var(--muted)">jQuery changed the web. Eight short, sourced essays on what aged — and what jsKjs does instead.</p></div>
  <div class="grid g4">${JQ.items.map(it => `<a class="card plate" data-mod="hyper" href="/jquery/${it.slug}/"><span class="series-num" aria-hidden="true" style="font-size:40px">${String(it.n).padStart(2, '0')}</span><h3>${esc(it.title)}</h3></a>`).join('')}</div>
</div>
<div class="band"><div class="wrap section" style="text-align:center">
  <p class="label" data-mod="motion" style="justify-content:center">Open source · MIT</p>
  <h2 style="margin:16px auto 0;max-width:20ch">The repository is public. Want to see it?</h2>
  <p class="lede" style="margin:16px auto 0">Source, tests, the AI kit and this very website — on GitHub.</p>
  <p style="margin-top:28px"><a class="btn btn-primary" href="/download/">🥁 Drum roll, please</a></p>
</div></div>`);
}

/* =====================================================================
   ROOT FILES: llms, sitemap, robots, htaccess, manifest, og manifest
   ===================================================================== */
writeFile('llms.txt', RULES.llmsTxt(PAGES));
writeFile('llms-full.txt', RULES.llmsFull());
writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.map(p =>
  `  <url><loc>${C.SITE}${p.path}</loc><lastmod>${BUILD_DATE}</lastmod><priority>${p.path === '/' ? '1.0' : /^\/(features|start|docs|ai|download)\/$/.test(p.path) ? '0.9' : '0.7'}</priority></url>`).join('\n')}\n</urlset>\n`);
writeFile('robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${C.SITE}/sitemap.xml\n`);
writeFile('site.webmanifest', JSON.stringify({ name: 'jsKjs', short_name: 'jsKjs', start_url: '/', display: 'standalone', background_color: '#13152B', theme_color: '#13152B',
  icons: [{ src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2));
writeFile('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><clipPath id="c"><circle cx="32" cy="32" r="30"/></clipPath></defs><g clip-path="url(#c)"><rect width="32" height="32" fill="#4D7CFF"/><rect x="32" width="32" height="32" fill="#FF4F8B"/><rect y="32" width="32" height="32" fill="#FFB224"/><rect x="32" y="32" width="32" height="32" fill="#22CFA2"/></g><circle cx="32" cy="32" r="22" fill="#13152B"/><text x="32" y="43" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="800" font-size="30" fill="#E9EBF7">$</text></svg>`);
writeFile('.nojekyll', '');
writeFile('cdn/.htaccess', `<IfModule mod_headers.c>\n  Header set Access-Control-Allow-Origin "*"\n  Header set Cross-Origin-Resource-Policy "cross-origin"\n  Header set Cache-Control "public, max-age=3600"\n</IfModule>\nAddType application/javascript .js\n`);
writeFile(`cdn/${C.VERSION}/.htaccess`, `<IfModule mod_headers.c>\n  Header set Access-Control-Allow-Origin "*"\n  Header set Cross-Origin-Resource-Policy "cross-origin"\n  Header set Cache-Control "public, max-age=31536000, immutable"\n</IfModule>\n`);
writeFile('.htaccess', fs.readFileSync(path.join(SRC, 'htaccess.txt'), 'utf8'));
fs.rmSync(path.join(OUT, '.nojekyll'));
writeFile('../og-manifest.json', JSON.stringify([...PAGES, { path: '/404.html', ogSlug: '404', title: 'Page not found', kicker: '404', mod: 'hyper' }, { ogSlug: 'default', title: 'jsKjs', kicker: 'Four libraries. One $.', mod: 'motion', path: '/' }]
  .map(p => ({ slug: p.ogSlug, title: p.ogTitle || p.title, kicker: p.kicker || 'jsKjs', mod: p.mod || 'motion' })), null, 1));

console.log(`Built ${PAGES.length} indexable pages into ${path.relative(REPO, OUT)}/`);
module.exports = { PAGES };
