/* layout.js — page shell, SEO head, nav, footer, highlighter, demo stages */
const C = require('../config');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = s => esc(s).replace(/'/g, '&#39;');

/* ---------------- build-time syntax highlighter ---------------- */
const JS_RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\b(const|let|var|function|return|if|else|for|of|in|new|await|async|this|true|false|null|undefined|class|try|catch|throw|while|typeof|import|from|export|default)\b|(\b\d+(?:\.\d+)?(?:ms|s|px)?\b)|(\$(?![\w$])|\bkj\b)|(\.[a-zA-Z_]\w*(?=\())|([{}()[\];,])/g;
function hlJS(src) {
  let out = '', last = 0, m;
  JS_RE.lastIndex = 0;
  while ((m = JS_RE.exec(src))) {
    out += esc(src.slice(last, m.index));
    const [tok, com, str, kw, num, dollar, meth, punct] = m;
    const cls = com ? 't-c' : str ? 't-s' : kw ? 't-k' : num ? 't-n' : dollar ? 't-d' : meth ? 't-f' : punct ? 't-p' : '';
    out += cls ? `<span class="${cls}">${esc(tok)}</span>` : esc(tok);
    last = m.index + tok.length;
  }
  return out + esc(src.slice(last));
}
function hlTag(tag) {
  // tag like <button kj-get="/x" @click="n++"> or </div>
  const m = tag.match(/^(<\/?)([a-zA-Z][\w-]*)([\s\S]*?)(\/?>)$/);
  if (!m) return esc(tag);
  let [, open, name, rest, close] = m;
  const attrs = rest.replace(/([\s]+)([@:]?[a-zA-Z_][\w:.\-@]*)(?:(=)("[^"]*"|'[^']*'|[^\s>]+))?/g, (all, ws, an, eq, val) => {
    const isKj = /^(kj-|@|:)/.test(an);
    let s = esc(ws) + `<span class="${isKj ? 't-kj' : 't-at'}">${esc(an)}</span>`;
    if (eq) s += '<span class="t-p">=</span><span class="t-s">' + esc(val) + '</span>';
    return s;
  });
  return `<span class="t-tag">${esc(open + name)}</span>${attrs}<span class="t-tag">${esc(close)}</span>`;
}
function hlHTML(src) {
  let out = '', i = 0;
  const re = /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script>|<\/?[a-zA-Z][^>]*>/g;
  let m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(i, m.index));
    const t = m[0];
    if (t.startsWith('<!--')) out += `<span class="t-c">${esc(t)}</span>`;
    else if (/^<script/i.test(t)) {
      const open = t.match(/^<script\b[^>]*>/i)[0];
      out += hlTag(open) + hlJS(t.slice(open.length, -9)) + hlTag('</script>');
    } else out += hlTag(t);
    i = m.index + t.length;
  }
  return out + esc(src.slice(i));
}
function highlight(code, lang) {
  if (lang === 'js') return hlJS(code);
  if (lang === 'html') return hlHTML(code);
  return esc(code);
}

let codeId = 0;
function codeBlock(code, lang = 'js', label) {
  const id = 'code-' + (++codeId);
  const lbl = label || { js: 'JavaScript', html: 'HTML', php: 'PHP', md: 'Markdown', bash: 'Terminal', json: 'JSON', txt: 'Text', yaml: 'YAML' }[lang] || lang;
  return `<div class="code"><span class="code-label">${esc(lbl)}</span><button class="copy-btn" type="button" data-copy="${id}" aria-label="Copy ${esc(lbl)} code">Copy</button><pre id="${id}" tabindex="0"><code>${highlight(String(code).replace(/^\n+|\s+$/g, ''), lang)}</code></pre></div>`;
}

/* ---------------- live demo stage ---------------- */
// stage() returns markup; its JS is collected and emitted after the library loads.
function stage(page, { title, html = '', js = '', note, id }) {
  const sid = id || ('stage-' + (page._stages = (page._stages || 0) + 1));
  if (js) (page.scripts = page.scripts || []).push(js.trim());
  const src = [];
  if (html.trim()) src.push(codeBlock(html.trim(), 'html'));
  if (js.trim()) src.push(codeBlock(js.trim(), 'js'));
  return `<section class="stage" aria-labelledby="${sid}-t">
  <div class="stage-bar"><span class="led" aria-hidden="true"></span><h3 class="stage-title" id="${sid}-t" style="font:inherit">Live · ${esc(title)}</h3><span class="spacer"></span><span aria-hidden="true">jskjs ${C.VERSION}</span></div>
  <div class="stage-body" id="${sid}">${html.trim()}</div>
  ${note ? `<p class="static-note">${note}</p>` : ''}
  <details class="stage-src"><summary>View the source for this demo</summary>${src.join('')}</details>
</section>`;
}

/* ---------------- icons ---------------- */
const ICON_GH = '<svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>';
const ICON_THEME = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>';

/* ---------------- nav ---------------- */
const NAV = [
  ['/start/', 'Start', 'start'],
  ['/features/', 'Features', 'features'],
  ['/docs/', 'Docs', 'docs'],
  ['/demo/', 'Demo', 'demo'],
  ['/ai/', 'AI agents', 'ai'],
  ['/jquery/', 'Why not jQuery', 'jquery'],
  ['/compare/', 'Compare', 'compare'],
  ['/cdn/', 'CDN', 'cdn'],
];

function head(page) {
  const url = C.SITE + page.path;
  const og = C.SITE + '/assets/og/' + (page.ogSlug || 'default') + '.png';
  const title = page.seoTitle || (page.title + ' — jsKjs');
  const ld = [].concat(page.jsonld || []);
  if (page.crumbs && page.crumbs.length) {
    ld.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [{ name: 'Home', path: '/' }, ...page.crumbs].map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: C.SITE + c.path })) });
  }
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(page.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${page.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
<meta name="author" content="${attr(C.AUTHORS)}">
<meta name="theme-color" content="#13152B">
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:site_name" content="jsKjs">
<meta property="og:title" content="${attr(page.ogTitle || page.title)}">
<meta property="og:description" content="${attr(page.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${attr(page.ogTitle || page.title)} — jsKjs">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${attr(page.ogTitle || page.title)}">
<meta name="twitter:description" content="${attr(page.desc)}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt">
<link rel="preload" href="/assets/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css?v=${C.ASSET_V}">
<script>(function(){var d=document.documentElement;d.className+=' js';try{var t=localStorage.getItem('kj-theme');if(t)d.setAttribute('data-theme',t)}catch(e){}})();</script>
${page.headExtra || ''}
${ld.length ? `<script type="application/ld+json">${JSON.stringify(ld.length === 1 ? ld[0] : ld)}</script>` : ''}
${C.GA}
</head>`;
}

function header(page) {
  const links = NAV.map(([href, label, key]) =>
    `<a href="${href}"${page.nav === key ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<body${page.mod ? ` data-mod="${page.mod}"` : ''}>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="/" aria-label="jsKjs home"><span class="jack" aria-hidden="true"></span>jsKjs</a>
    <nav class="nav-main" aria-label="Primary">${links}</nav>
    <span class="spacer"></span>
    <button class="theme-toggle" type="button" id="theme-toggle" kj-data="themeSwitch" @click="toggle()"
      :aria-label="'Switch to ' + (dark ? 'light' : 'dark') + ' theme'" :aria-pressed="dark ? 'true' : 'false'" aria-label="Switch color theme">
      <span class="ico ico-sun" kj-show="!dark">${ICON_THEME}</span><span class="ico ico-moon" kj-show="dark" style="display:none">${ICON_MOON}</span></button>
    <a class="btn-gh" href="/download/">${ICON_GH}<span class="gh-text">Get jsKjs</span><span aria-hidden="true">🥁</span></a>
    <div class="mnav" kj-data="mobileMenu" @keyup.escape="close()">
      <button class="mnav-btn" type="button" @click="toggle()" :aria-expanded="open ? 'true' : 'false'" aria-expanded="false" aria-controls="mnav-panel"><span class="burger" aria-hidden="true"><i></i><i></i></span><span kj-text="open ? 'Close' : 'Menu'">Menu</span></button>
      <nav class="panel-menu" id="mnav-panel" aria-label="Mobile" kj-show="open" style="display:none">${links}<a href="/download/">Download 🥁</a></nav>
    </div>
  </div>
</header>`;
}

function crumbsHTML(page) {
  if (!page.crumbs || !page.crumbs.length) return '';
  const items = [{ name: 'Home', path: '/' }, ...page.crumbs];
  return `<nav aria-label="Breadcrumb"><ol class="crumbs">${items.map((c, i) =>
    i === items.length - 1 ? `<li><span aria-current="page">${esc(c.name)}</span></li>` : `<li><a href="${c.path}">${esc(c.name)}</a></li>`).join('')}</ol></nav>`;
}

const CABLE_SVG = `<svg class="cable" viewBox="0 0 560 260" aria-hidden="true"><path d="M10 250 C 120 40, 300 260, 550 20" stroke="var(--mod)" stroke-width="6" fill="none" stroke-linecap="round" opacity=".9"/><path d="M60 258 C 200 120, 340 230, 556 120" stroke="var(--chrome-line)" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="550" cy="20" r="9" fill="var(--chrome)" stroke="var(--mod)" stroke-width="4"/></svg>`;

function pageHead(page, extra = '') {
  return `<div class="band page-head-band"><div class="wrap page-head">
  ${crumbsHTML(page)}
  <p class="label" style="margin-top:22px">${esc(page.kicker || '')}</p>
  <h1>${page.h1 || esc(page.title)}</h1>
  ${page.lede ? `<p class="lede">${page.lede}</p>` : ''}
  ${extra}
</div>${page.cable === false ? '' : CABLE_SVG}</div>`;
}

function footer(page) {
  const col = (title, items) => `<div><h2>${title}</h2><ul>${items.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join('')}</ul></div>`;
  return `<footer class="band site-footer"><div class="wrap">
  <div class="foot-grid">
    <div class="foot-brand">
      <a class="brand" href="/"><span class="jack" aria-hidden="true"></span>jsKjs</a>
      <p class="muted" style="color:var(--chrome-muted); margin-top:14px; font-size:14.5px; max-width:34ch">The jQuery you know, plus htmx-style requests, Alpine-style reactivity and GSAP-style motion, in about ${C.KJ_GZ_KB} KB.</p>
      <p class="foot-cta"><a class="btn btn-sm" href="${C.GITHUB}" rel="noopener">${ICON_GH.replace('<svg', '<svg width="16" height="16"')} github.com/kchecker/jskjs</a></p>
    </div>
    ${col('Learn', [['/start/', 'Getting started'], ['/features/', 'All features'], ['/docs/', 'API reference'], ['/demo/', 'Feature tour'], ['/migrate/', 'Migrate from jQuery']])}
    ${col('Modules', [['/features/#core', 'Core (jQuery API)'], ['/features/#hyper', 'Hyper (htmx-style)'], ['/features/#pulse', 'Pulse (Alpine-style)'], ['/features/#motion', 'Motion (GSAP-style)'], ['/features/#util', 'Utilities']])}
    ${col('Why jsKjs', [['/jquery/', 'What aged in jQuery'], ['/compare/jquery/', 'jsKjs vs jQuery'], ['/compare/htmx/', 'jsKjs vs htmx'], ['/compare/alpine/', 'jsKjs vs Alpine.js'], ['/compare/gsap/', 'jsKjs vs GSAP']])}
    ${col('Build with AI', [['/ai/', 'Why agents love it'], ['/ai/kit/', 'Agent rules kit'], ['/ai/prompts/', 'Prompt library'], ['/ai/recipes/', 'Vibe recipes'], ['/llms.txt', 'llms.txt']])}
  </div>
  <div class="built-with" data-mod="motion"><span class="label">Built with itself</span><p>This website runs on jsKjs ${C.VERSION} — the theme switch, mobile menu, copy buttons, filters, scroll entrances and every demo use the same ${C.KJ_GZ_KB} KB file you would ship. <a href="${C.GITHUB}/tree/main/site" rel="noopener">Read the site's source →</a></p></div>
  <div class="foot-base">
    <span>© ${C.YEAR} jsKjs · <a href="${C.GITHUB}/blob/main/LICENSE" rel="noopener">MIT License</a> · Open source · <a href="/releases/">v${C.VERSION}</a> · <a href="/cdn/">CDN</a> · <a href="/download/">Download</a></span>
    <span>Authored by ${esc(C.AUTHORS)}</span>
  </div>
</div></footer>`;
}

function scripts(page) {
  const lib = `<script src="/cdn/${C.VERSION}/jskjs.min.js"></script>`;
  const site = `<script src="/assets/site.js?v=${C.ASSET_V}"></script>`;
  const pageJs = (page.scripts || []).map(s => `<script>\n${s}\n</script>`).join('\n');
  const raw = page.rawScripts || '';
  return `${lib}\n${site}\n${pageJs}\n${raw}\n</body>\n</html>`;
}

function render(page, body) {
  return head(page) + '\n' + header(page) + `\n<main id="main" tabindex="-1">\n${body}\n</main>\n` + footer(page) + '\n' + scripts(page);
}

module.exports = { esc, attr, highlight, codeBlock, stage, render, pageHead, crumbsHTML, ICON_GH, NAV };
