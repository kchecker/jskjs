/* Core module — the jQuery-compatible API. Demo code must not contain backticks or ${. */
module.exports = [
{
  slug: 'selectors', mod: 'core', title: 'Selectors & collections',
  seo: 'jQuery-style $() Selectors on Native querySelectorAll',
  desc: 'Use $() exactly like jQuery — CSS selectors, context, HTML creation and DOM-ready — powered by native querySelectorAll, with collections that are real JavaScript arrays.',
  lede: 'Everything starts with <code>$()</code>. Pass it a CSS selector, an element, an HTML string or a function, and get back a chainable collection that is also a real <code>Array</code>.',
  body: String.raw`
<h2>What you get</h2>
<p>jsKjs hands every selector straight to the browser's own <code>querySelectorAll</code>. There is no selector engine to download or execute, so anything your browser understands — <code>:has()</code>, <code>:is()</code>, <code>:not(a, b)</code>, attribute operators — works on day one. An invalid selector throws a clear error instead of quietly matching nothing.</p>
<p>The collection you get back <em>extends</em> <code>Array</code>. Chain jQuery-style methods such as <code>.addClass()</code>, or use native array features directly: spread it, destructure it, loop it with <code>for…of</code>, or <code>.map()</code> it into plain values.</p>
<h2>The five ways to call $()</h2>
<ul>
<li><code>$('.card')</code> — select by CSS selector (optionally scoped: <code>$('li', '#menu')</code>).</li>
<li><code>$(element)</code> / <code>$(window)</code> — wrap something you already have.</li>
<li><code>$([el1, el2])</code> or <code>$(nodeList)</code> — wrap any iterable of nodes.</li>
<li><code>$('&lt;li class="x"&gt;Hi&lt;/li&gt;')</code> — create elements from HTML.</li>
<li><code>$(fn)</code> — run code when the DOM is ready.</li>
</ul>`,
  demos: [{
    title: 'Selector playground',
    html: String.raw`
<div class="row">
  <label for="sel-in" class="sr-only">CSS selector</label>
  <input id="sel-in" type="text" value=".sale" spellcheck="false" autocomplete="off" style="max-width:300px;font-family:var(--mono)">
  <button id="sel-go" type="button">Select</button>
</div>
<div class="row" id="sel-presets" style="margin-top:10px" aria-label="Example selectors">
  <button type="button" class="chip" data-sel="li">li</button>
  <button type="button" class="chip" data-sel=".sale">.sale</button>
  <button type="button" class="chip" data-sel="li:nth-child(odd)">li:nth-child(odd)</button>
  <button type="button" class="chip" data-sel="[data-stock='0']">[data-stock='0']</button>
  <button type="button" class="chip" data-sel="li:has(b)">li:has(b)</button>
  <button type="button" class="chip" data-sel="li:not(.sale, [data-stock='0'])">li:not(.sale, …)</button>
</div>
<ul id="shelf" class="list-plain" style="margin-top:14px">
  <li data-stock="4">Tween Engine Tee</li>
  <li class="sale" data-stock="12">Selector Socks <b>−20%</b></li>
  <li data-stock="0">Easing Mug</li>
  <li class="sale" data-stock="2">Stagger Stickers <b>−50%</b></li>
  <li data-stock="7">Delegation Deskmat</li>
</ul>
<pre class="out" id="sel-out" aria-live="polite"></pre>`,
    js: String.raw`
function run(selector) {
  $('#shelf li').css('background', '');
  let $hits;
  try {
    $hits = $(selector, '#shelf');            // native querySelectorAll, scoped
  } catch (err) {
    $('#sel-out').text('✗ Not a valid CSS selector: ' + selector);
    return;
  }
  $hits.css('background', 'color-mix(in srgb, var(--core) 22%, transparent)');
  const names = $hits.map(el => el.firstChild.textContent.trim());   // it's an Array
  $('#sel-out').text("$('" + selector + "', '#shelf') → " + $hits.length + ' match(es)\n' + JSON.stringify(names));
}

$('#sel-go').on('click', () => run($('#sel-in').val()));
$('#sel-in').on('keyup', e => { if (e.key === 'Enter') run($('#sel-in').val()); });
$('#sel-presets').on('click', '[data-sel]', function () {
  $('#sel-in').val(this.dataset.sel);
  run(this.dataset.sel);
});
run('.sale');`,
  }],
  examples: [
    { title: 'Create, scope and wrap', lang: 'js', code: String.raw`
const $card = $('<article class="card"><h3>New</h3></article>').appendTo('#grid');
$('.price', '#cart').addClass('updated');      // only inside #cart
$(document.body).attr('data-ready', '');

$(() => console.log('DOM ready'));` },
    { title: 'It is an Array — use that', lang: 'js', code: String.raw`
const ids = $('[data-id]').map(el => el.dataset.id);   // plain array of strings
for (const img of $('img[loading="lazy"]')) observer.observe(img);
const [first, second] = $('.step');
const total = $('.line-item').reduce((sum, el) => sum + +el.dataset.price, 0);` },
  ],
  api: ['$()', '.each()', '.get()', '.eq()', '.first() / .last()', '.index()', '.add()'],
  from: [{ lib: 'jQuery', note: 'Identical calls. jQuery-only pseudo-selectors such as <code>:first</code>, <code>:eq()</code> and <code>:visible</code> are not CSS, so use <code>.first()</code>, <code>.eq()</code> or <code>.filter()</code>. Native array methods like <code>.map()</code> return plain arrays — wrap with <code>$()</code> to keep chaining.' }],
  related: ['traversal', 'dom-manipulation', 'event-delegation'],
},
{
  slug: 'dom-manipulation', mod: 'core', title: 'DOM manipulation',
  seo: 'DOM Manipulation: append, prepend, clone, remove with jsKjs',
  desc: 'Insert, move, clone, wrap and remove elements with the jQuery API you know — .append(), .prepend(), .before(), .after(), .clone(), .empty() — on modern DOM primitives.',
  lede: 'Read and write content, then move elements anywhere: <code>.html()</code>, <code>.text()</code>, <code>.append()</code>, <code>.after()</code>, <code>.clone()</code>, <code>.remove()</code> and friends.',
  body: String.raw`
<h2>Move, don't rebuild</h2>
<p>Every insertion method accepts HTML strings, elements, jsKjs collections or plain text — several at once. Inserting an <em>existing</em> element moves it, which is exactly what you want for drag-to-reorder, kanban columns or sorting a list: the node keeps its state, focus and listeners.</p>
<p>When content comes from users, prefer <code>.text()</code>: it can never inject markup. Use <code>.html()</code> for markup you control, and <code>$.escape()</code> when you build HTML strings by hand.</p>
<p>Removal is leak-free by design. jsKjs keeps per-element data in a <code>WeakMap</code>, so a removed element and its data are garbage-collected together — there is no cache to clean.</p>`,
  css: String.raw`
.kb { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:16px; }
.kb-col { background:var(--surface-2); border-radius:12px; padding:12px; min-height:160px; }
.kb-col h4 { font:700 11.5px/1 var(--mono); text-transform:uppercase; letter-spacing:.1em; margin:2px 0 10px; color:var(--muted); }
.kb-card { background:var(--surface); border:1px solid var(--line); border-radius:10px; padding:9px 10px !important; margin-bottom:8px; display:flex; flex-wrap:wrap; gap:5px; }
.kb-card span { flex:1 1 100%; font-weight:600; font-size:15px; }
.stage .kb-card button { padding:5px 8px; font-size:12px; border-width:1px; }
@media (max-width:640px) { .kb { grid-template-columns:1fr; } }`,
  demos: [{
    title: 'Kanban board in 30 lines',
    html: String.raw`
<form id="kb-form" class="row">
  <label for="kb-new" class="sr-only">New card</label>
  <input id="kb-new" type="text" placeholder="New card…" maxlength="60" style="flex:1;min-width:180px">
  <button type="submit">Add card</button>
  <button type="button" id="kb-clear">Clear “Done”</button>
</form>
<div class="kb">
  <section class="kb-col" data-col="todo" aria-label="To do"><h4>To do</h4><ul class="list-plain">
    <li class="kb-card"><span>Write the docs</span></li>
    <li class="kb-card"><span>Record a screencast</span></li></ul></section>
  <section class="kb-col" data-col="doing" aria-label="Doing"><h4>Doing</h4><ul class="list-plain">
    <li class="kb-card"><span>Ship v1.0</span></li></ul></section>
  <section class="kb-col" data-col="done" aria-label="Done"><h4>Done</h4><ul class="list-plain"></ul></section>
</div>`,
    js: String.raw`
const tools =
  '<button type="button" data-act="left" aria-label="Move left">←</button>' +
  '<button type="button" data-act="right" aria-label="Move right">→</button>' +
  '<button type="button" data-act="top">Pin</button>' +
  '<button type="button" data-act="dup">Copy</button>' +
  '<button type="button" data-act="del" aria-label="Delete">✕</button>';

$('.kb-card').append(tools);                       // each card gets its own toolbar

$('#kb-form').on('submit', e => {
  e.preventDefault();
  const text = $.trim($('#kb-new').val());
  if (!text) return;
  $('<li class="kb-card">')
    .append($('<span>').text(text))                // .text(): user input can't inject HTML
    .append(tools)
    .appendTo('[data-col="todo"] ul');
  $('#kb-new').val('').focus();
});

// One delegated listener drives every card — including ones added later
$('.kb').on('click', 'button[data-act]', function () {
  const $card = $(this).closest('.kb-card');
  const $col = $card.closest('.kb-col');
  const act = this.dataset.act;
  if (act === 'right') $col.next().find('ul').append($card);   // appending moves it
  if (act === 'left')  $col.prev().find('ul').append($card);
  if (act === 'top')   $card.parent().prepend($card);
  if (act === 'dup')   $card.after($card.clone());
  if (act === 'del')   $card.remove();
});

$('#kb-clear').on('click', () => $('[data-col="done"] ul').empty());`,
  }],
  examples: [
    { title: 'Text vs HTML', lang: 'js', code: String.raw`
$('#title').text(userInput);                       // always safe
$('#title').html('<b>' + $.escape(userInput) + '</b>');   // safe when escaped
$('#list').append('<li>One</li>', '<li>Two</li>');  // several at once` },
    { title: 'Wrap, replace, clone', lang: 'js', code: String.raw`
$('img.hero').wrap('<figure class="frame">');
$('.legacy-banner').replaceWith('<div class="banner">New</div>');
$('#row-template').clone().removeAttr('id').appendTo('tbody');` },
  ],
  api: ['.html()', '.text()', '.append() / .prepend()', '.before() / .after()', '.appendTo() / .prependTo()', '.wrap()', '.remove()', '.empty()', '.clone()', '.replaceWith()'],
  from: [{ lib: 'jQuery', note: 'Same names and argument styles. <code>.detach()</code> is an alias of <code>.remove()</code> (data survives either way). <code>.wrapAll()</code>, <code>.wrapInner()</code> and <code>.unwrap()</code> are not included.' }],
  related: ['selectors', 'event-delegation', 'attributes-and-data'],
},
{
  slug: 'attributes-and-data', mod: 'core', title: 'Attributes, properties & data',
  seo: 'attr(), prop() and data() with Leak-free WeakMap Storage',
  desc: 'Read and write HTML attributes, live DOM properties and per-element data. jsKjs parses data-* JSON automatically and stores values in a WeakMap, so nothing leaks.',
  lede: 'Three different things, three methods: <code>.attr()</code> for HTML attributes, <code>.prop()</code> for live DOM properties, <code>.data()</code> for values you attach to elements.',
  body: String.raw`
<h2>Which one do I use?</h2>
<ul>
<li><strong><code>.attr()</code></strong> reads and writes what is in the HTML: <code>href</code>, <code>aria-*</code>, <code>role</code>. Screen readers and CSS selectors see these.</li>
<li><strong><code>.prop()</code></strong> touches the live DOM object: <code>checked</code>, <code>disabled</code>, <code>value</code>, <code>scrollHeight</code>. Use it for state that changes after load.</li>
<li><strong><code>.data()</code></strong> reads <code>data-*</code> attributes (JSON is parsed for you) and stores anything — objects, dates, functions — against an element.</li>
</ul>
<h2>Leak-free by construction</h2>
<p>Stored data lives in a <code>WeakMap</code> keyed by the element. When the element is gone, so is its data. Nothing is written onto your nodes, and there is no global cache to clean up.</p>`,
  demos: [{
    title: 'Account card inspector',
    html: String.raw`
<article id="user-card" class="plate" data-user='{"name":"Ada","plan":"pro","seats":5}' style="box-shadow:none">
  <h4 style="margin:0">Ada Lovelace</h4>
  <p class="plan muted" style="margin:4px 0 12px">pro · 5 seats</p>
  <fieldset id="plan-fields" style="border:0;padding:0;display:flex;gap:16px;flex-wrap:wrap;align-items:center">
    <legend class="sr-only">Plan settings</legend>
    <label>Seats <input type="number" value="5" min="1" style="width:90px"></label>
    <label><input type="checkbox" checked> Billing emails</label>
  </fieldset>
</article>
<div class="row" style="margin-top:14px">
  <button type="button" id="read">Read data</button>
  <button type="button" id="upgrade">Upgrade plan</button>
  <button type="button" id="lock">Lock fields</button>
  <button type="button" id="fav" aria-pressed="false">☆ Favourite</button>
</div>
<pre class="out" id="attr-out" aria-live="polite"></pre>`,
    js: String.raw`
const $card = $('#user-card');

function inspect(note) {
  $('#attr-out').text(note + '\n\n' +
    ".data('user')         → " + JSON.stringify($card.data('user')) + '\n' +
    ".attr('data-user')    → " + $card.attr('data-user') + '\n' +
    ".prop('disabled')     → " + $('#plan-fields').prop('disabled') + '\n' +
    ".attr('aria-pressed') → " + $('#fav').attr('aria-pressed'));
}

$('#read').on('click', () => inspect('data-* JSON is parsed into an object for you.'));

$('#upgrade').on('click', () => {
  const user = $card.data('user');
  $card.data('user', { ...user, plan: 'team', seats: user.seats + 5 });   // stored in a WeakMap
  $card.find('.plan').text('team · ' + $card.data('user').seats + ' seats');
  inspect('.data() stored a new object — the HTML attribute is untouched.');
});

$('#lock').on('click', function () {
  const locked = !$('#plan-fields').prop('disabled');
  $('#plan-fields').prop('disabled', locked);          // live DOM property
  $(this).text(locked ? 'Unlock fields' : 'Lock fields');
  inspect('.prop() flipped the live disabled property.');
});

$('#fav').on('click', function () {
  const on = $(this).attr('aria-pressed') !== 'true';
  $(this).attr('aria-pressed', String(on)).text(on ? '★ Favourite' : '☆ Favourite');
  inspect('.attr() wrote aria-pressed — screen readers announce the new state.');
});

inspect('Ready. Try the buttons.');`,
  }],
  examples: [
    { title: 'Everyday calls', lang: 'js', code: String.raw`
$('a.external').attr({ target: '_blank', rel: 'noopener' });
$('#agree').prop('checked');                 // true / false
$('#save').prop('disabled', true);
$('#chart').data('series', bigArrayOfPoints); // any value, no serialization
$('#chart').removeData('series');` },
  ],
  api: ['.attr()', '.removeAttr()', '.prop()', '.data()', '.removeData()', '.val()'],
  from: [{ lib: 'jQuery', note: '<code>.data()</code> behaves the same (JSON parsing, object stores). One deliberate difference: <code>.val()</code> on a checkbox returns <code>true/false</code> rather than its <code>value</code> attribute — use <code>.attr("value")</code> if you need that.' }],
  related: ['classes-and-css', 'forms-and-serialize', 'reactive-state'],
},
{
  slug: 'classes-and-css', mod: 'core', title: 'Classes & CSS',
  seo: 'addClass, toggleClass and css() with CSS Custom Properties',
  desc: 'Toggle classes and set styles with addClass(), toggleClass() and css() — including CSS custom properties, which jsKjs reads and writes without adding px.',
  lede: 'Class lists and inline styles, the jQuery way — with first-class support for CSS custom properties, so one <code>.css(\'--accent\', …)</code> can re-theme a whole component.',
  body: String.raw`
<h2>Classes for state, variables for tuning</h2>
<p>Use classes for discrete states (<code>open</code>, <code>compact</code>, <code>error</code>) and CSS custom properties for continuous values (hue, radius, progress). <code>.css()</code> writes custom properties with <code>setProperty</code> and never appends <code>px</code> to them, so <code>.css('--hue', 200)</code> means exactly 200.</p>
<p>For ordinary properties, numbers become pixels automatically — except unitless ones such as <code>opacity</code>, <code>z-index</code> and <code>line-height</code>. Reading a property returns the <em>computed</em> value.</p>`,
  css: String.raw`
.tuner { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); align-items:end; }
.pv { --accent-h: 230; --r: 14px; margin-top:20px; border:2px solid hsl(var(--accent-h) 65% 50%); border-radius:var(--r); padding:22px; background:var(--surface); transition:box-shadow .2s, padding .2s; }
.pv.compact { padding:10px 14px; } .pv.compact p { display:none; }
.pv.elevated { box-shadow:0 24px 40px -18px hsl(var(--accent-h) 70% 40% / .75); }
.pv-badge { font:700 11px/1 var(--mono); background:hsl(var(--accent-h) 70% 36%); color:#fff; padding:6px 9px; border-radius:calc(var(--r) / 2); }
.pv h4 { margin:12px 0 4px; } .pv p { margin:0 0 14px; color:var(--muted); }
.stage .pv-btn { background:hsl(var(--accent-h) 70% 36%); color:#fff; border-color:transparent; border-radius:calc(var(--r) * .7); }`,
  demos: [{
    title: 'Theme tuner',
    html: String.raw`
<div class="tuner">
  <div class="field"><label for="t-hue">Accent hue: <span id="t-hue-v">230</span></label><input id="t-hue" type="range" min="0" max="360" value="230"></div>
  <div class="field"><label for="t-rad">Corner radius: <span id="t-rad-v">14</span>px</label><input id="t-rad" type="range" min="0" max="32" value="14"></div>
  <div class="row"><button type="button" id="t-compact" aria-pressed="false">Compact</button><button type="button" id="t-shadow" aria-pressed="false">Elevated</button></div>
</div>
<div id="preview" class="pv">
  <span class="pv-badge">NEW</span>
  <h4>Patch cable, 30 cm</h4>
  <p>Braided, gold-plated, guaranteed to make your modules talk.</p>
  <button type="button" class="pv-btn">Add to rack</button>
</div>
<pre class="out" id="css-out" aria-live="polite"></pre>`,
    js: String.raw`
const $pv = $('#preview');

function report(note) {
  $('#css-out').text(note + '\n' +
    "css('--accent-h')     → " + $pv.css('--accent-h') + '\n' +
    "css('border-radius')  → " + $pv.css('border-radius') + '\n' +
    "hasClass('compact')   → " + $pv.hasClass('compact') + '\n' +
    "hasClass('elevated')  → " + $pv.hasClass('elevated'));
}

$('#t-hue').on('input', function () {
  $pv.css('--accent-h', this.value);     // custom property: no px added
  $('#t-hue-v').text(this.value);
  report('One custom property re-themes border, badge, button and shadow.');
});

$('#t-rad').on('input', function () {
  $pv.css('--r', this.value + 'px');
  $('#t-rad-v').text(this.value);
  report('Radius flows to every corner through calc().');
});

$('#t-compact, #t-shadow').on('click', function () {
  const cls = this.id === 't-compact' ? 'compact' : 'elevated';
  $pv.toggleClass(cls);
  $(this).attr('aria-pressed', String($pv.hasClass(cls)));
  report(".toggleClass('" + cls + "')");
});

report('Drag a slider or toggle a class.');`,
  }],
  examples: [
    { title: 'Common patterns', lang: 'js', code: String.raw`
$('.tab').removeClass('active').eq(2).addClass('active');
$('#menu').toggleClass('open', isOpen);          // force on/off
$('.bar').css({ width: 240, opacity: .8 });       // width → 240px, opacity stays .8
$(':root').css('--brand', '#6c5ce7');             // theme the whole page` },
  ],
  api: ['.addClass()', '.removeClass()', '.toggleClass()', '.hasClass()', '.css()'],
  from: [{ lib: 'jQuery', note: 'Same API. jsKjs also reads custom properties with <code>.css("--name")</code> (returns the trimmed computed value).' }],
  related: ['geometry-and-scroll', 'transforms', 'attributes-and-data'],
},
{
  slug: 'geometry-and-scroll', mod: 'core', title: 'Geometry, scroll & visibility',
  seo: 'width(), offset(), scrollTop() and show/hide in jsKjs',
  desc: 'Measure and position elements with width(), height(), offset() and position(), control scrolling with scrollTop(), and show or hide elements without losing their display value.',
  lede: 'Measure anything, scroll anything, show and hide anything — with the same calls you used in jQuery, built on <code>getBoundingClientRect</code> and the native scroll APIs.',
  body: String.raw`
<h2>Measurements you can trust</h2>
<p><code>.width()</code> and <code>.height()</code> return the rendered size from <code>getBoundingClientRect()</code>, including transforms; on <code>$(window)</code> they return the viewport. <code>.offset()</code> gives page coordinates (scroll included) — perfect for positioning popovers — while <code>.position()</code> is relative to the nearest positioned ancestor.</p>
<h2>Scrolling</h2>
<p><code>.scrollTop()</code> and <code>.scrollLeft()</code> read and write scroll position on elements and on <code>$(window)</code>. Pair them with <code>$.throttle()</code> for scroll-driven UI such as progress bars and scroll-spy.</p>
<h2>Visibility</h2>
<p><code>.hide()</code> remembers the element's previous <code>display</code> value, so <code>.show()</code> restores <code>flex</code> or <code>grid</code> instead of forcing <code>block</code>.</p>`,
  css: String.raw`
.geo-bar { height:6px; background:var(--surface-2); border-radius:6px; margin:14px 0 10px; overflow:hidden; }
#geo-progress { height:100%; width:0; background:var(--core); }
.geo-panel { height:230px; overflow:auto; position:relative; border:1px solid var(--line); border-radius:12px; padding:0 18px; }
.geo-panel section { padding:16px 0 70px; }
.geo-panel h4 { margin:0 0 6px; }`,
  demos: [{
    title: 'Scroll spy with progress',
    html: String.raw`
<div class="row" id="geo-nav">
  <button type="button" data-to="0">Intro</button>
  <button type="button" data-to="1">Specs</button>
  <button type="button" data-to="2">Reviews</button>
  <button type="button" id="geo-toggle" aria-expanded="true" aria-controls="geo-panel">Hide panel</button>
</div>
<div class="geo-bar" aria-hidden="true"><div id="geo-progress"></div></div>
<div id="geo-panel" class="geo-panel" tabindex="0" role="region" aria-label="Product details (scrollable)">
  <section><h4>Intro</h4><p>The jsKjs patch cable connects any module to any other. It is the part of your rack you never think about until it is missing.</p></section>
  <section><h4>Specs</h4><p>30 cm braided sleeve, gold contacts, rated for ten thousand insertions. Weighs less than the jQuery Color plugin.</p></section>
  <section><h4>Reviews</h4><p>“Finally, a cable that does not need a build step.” — a reviewer who should know better.</p></section>
</div>
<pre class="out" id="geo-out" aria-live="off"></pre>`,
    js: String.raw`
const $panel = $('#geo-panel');

function measure() {
  const max = $panel.prop('scrollHeight') - $panel.prop('clientHeight');
  const pct = max ? $panel.scrollTop() / max : 0;
  $('#geo-progress').css('width', (pct * 100).toFixed(1) + '%');
  const off = $panel.offset();
  $('#geo-out').text(
    'scrollTop() → ' + Math.round($panel.scrollTop()) + 'px of ' + max + 'px\n' +
    'width()     → ' + Math.round($panel.width()) + 'px · height() → ' + Math.round($panel.height()) + 'px\n' +
    'offset()    → { top: ' + Math.round(off.top) + ', left: ' + Math.round(off.left) + ' }');
}

$panel.on('scroll', $.throttle(measure, 50));
$(window).on('resize', $.throttle(measure, 100));

$('#geo-nav').on('click', '[data-to]', function () {
  const $section = $panel.children('section').eq(+this.dataset.to);
  $panel.scrollTop($section.position().top - 8);    // position() is relative to the panel
});

$('#geo-toggle').on('click', function () {
  $panel.toggle();
  const open = $panel.css('display') !== 'none';
  $(this).attr('aria-expanded', String(open)).text(open ? 'Hide panel' : 'Show panel');
});

measure();`,
  }],
  examples: [
    { title: 'Position a popover under a button', lang: 'js', code: String.raw`
const { top, left } = $('#help').offset();
$('#popover').css({ top: top + $('#help').height() + 8, left }).show();` },
    { title: 'Back to top', lang: 'js', code: String.raw`
$('#to-top').on('click', () => $(window).scrollTop(0));
$(window).on('scroll', $.throttle(() => $('#to-top').toggle($(window).scrollTop() > 600), 100));` },
  ],
  api: ['.width() / .height()', '.offset()', '.position()', '.scrollTop() / .scrollLeft()', '.show() / .hide() / .toggle()'],
  from: [{ lib: 'jQuery', note: '<code>.innerWidth()</code>/<code>.outerWidth()</code> and the <code>.offset()</code> setter are not included; read <code>getBoundingClientRect()</code> or set <code>top/left</code> with <code>.css()</code>.' }],
  related: ['classes-and-css', 'debounce-and-throttle', 'classic-effects'],
},
{
  slug: 'traversal', mod: 'core', title: 'DOM traversal',
  seo: 'DOM Traversal: find, closest, siblings, parents in jsKjs',
  desc: 'Walk the DOM with find(), closest(), parent(), parents(), children(), siblings(), next(), prev(), filter(), not() and is() — every result chainable and de-duplicated.',
  lede: 'Move around the tree from wherever you are: up with <code>.closest()</code>, down with <code>.find()</code>, sideways with <code>.siblings()</code>, and narrow down with <code>.filter()</code> and <code>.not()</code>.',
  body: String.raw`
<p>Traversal methods return new, de-duplicated collections, so you can chain them freely. <code>.filter()</code>, <code>.not()</code> and <code>.is()</code> accept a selector, an element, a collection, or a predicate function <code>(index, element) =&gt; boolean</code>.</p>
<p><code>.closest()</code> is the workhorse of event handling: from the element that was clicked, climb to the card, row or form that owns it. It is built on the native <code>Element.closest()</code>.</p>`,
  css: String.raw`
.tree, .tree ul { list-style:none; padding-left:22px; margin:4px 0; }
.tree { padding-left:0; }
.tree li { padding:4px 8px; border-radius:7px; font:14px/1.5 var(--mono); }
.tree li.hit { background:color-mix(in srgb, var(--core) 24%, transparent); }
.tree li.anchor { outline:2px solid var(--core-ink); }`,
  demos: [{
    title: 'Traversal playground',
    html: String.raw`
<p class="muted" style="margin:0 0 10px;font-size:14.5px">The outlined node is the starting point. Each button highlights what the method returns.</p>
<ul class="tree" id="tree" aria-label="Example tree">
  <li>root
    <ul>
      <li class="branch">branch A
        <ul><li class="leaf">leaf A1</li><li class="leaf anchor" id="anchor-node">leaf A2 (start)</li><li class="leaf special">leaf A3 (.special)</li></ul>
      </li>
      <li class="branch">branch B
        <ul><li class="leaf">leaf B1</li><li class="leaf special">leaf B2 (.special)</li></ul>
      </li>
    </ul>
  </li>
</ul>
<div class="row" id="trav-buttons" style="margin-top:12px">
  <button type="button" data-m="siblings">.siblings()</button>
  <button type="button" data-m="next">.next()</button>
  <button type="button" data-m="prev">.prev()</button>
  <button type="button" data-m="parent">.parent().closest('li')</button>
  <button type="button" data-m="parents">.parents('.branch')</button>
  <button type="button" data-m="find">$('#tree').find('.leaf')</button>
  <button type="button" data-m="filter">.filter('.special')</button>
  <button type="button" data-m="notfn">.not(fn)</button>
</div>
<pre class="out" id="trav-out" aria-live="polite"></pre>`,
    js: String.raw`
const $start = $('#anchor-node');
const methods = {
  siblings: () => $start.siblings(),
  next:     () => $start.next(),
  prev:     () => $start.prev(),
  parent:   () => $start.parent().closest('li'),
  parents:  () => $start.parents('.branch'),
  find:     () => $('#tree').find('.leaf'),
  filter:   () => $('#tree .leaf').filter('.special'),
  notfn:    () => $('#tree .leaf').not((i, el) => el.textContent.includes('B')),
};

$('#trav-buttons').on('click', 'button', function () {
  $('#tree li').removeClass('hit');
  const $result = methods[this.dataset.m]();
  $result.addClass('hit');
  $('#trav-out').text($(this).text() + ' → ' + $result.length + ' element(s)\n' +
    'start.is(".leaf") = ' + $start.is('.leaf') + ' · start.is(".special") = ' + $start.is('.special'));
});`,
  }],
  examples: [
    { title: 'Climb, then search', lang: 'js', code: String.raw`
$(document).on('click', '.remove', function () {
  $(this).closest('.cart-row').remove();
});
const $form = $('#email').closest('form');
$form.find('[required]').filter((i, el) => !el.value).addClass('missing');` },
  ],
  api: ['.find()', '.filter()', '.not()', '.is()', '.closest()', '.parent() / .parents()', '.children()', '.siblings()', '.next() / .prev()'],
  from: [{ lib: 'jQuery', note: 'Core traversal matches jQuery. <code>.nextAll()</code>, <code>.prevAll()</code>, <code>.nextUntil()</code>, <code>.parentsUntil()</code>, <code>.has()</code>, <code>.contents()</code>, <code>.end()</code> and <code>.addBack()</code> are not included.' }],
  related: ['selectors', 'event-delegation', 'dom-manipulation'],
},
{
  slug: 'events', mod: 'core', title: 'Events',
  seo: 'Event Handling with on(), off(), one() and Namespaces',
  desc: 'Bind and unbind events with on(), off() and one(), group handlers with namespaces like click.menu, and use shortcut methods — the jQuery event API on native addEventListener.',
  lede: 'Attach handlers with <code>.on()</code>, remove them precisely with <code>.off()</code>, fire once with <code>.one()</code>, and group related handlers with namespaces such as <code>keydown.shortcuts</code>.',
  body: String.raw`
<h2>Namespaces make cleanup easy</h2>
<p>Suffix any event with a namespace — <code>'click.menu'</code>, <code>'keydown.shortcuts'</code> — and later remove exactly that group with <code>.off('.menu')</code>, leaving everyone else's handlers alone. This is the cleanest way to tear down a modal, a widget or a feature flag.</p>
<h2>Shortcuts and handler signature</h2>
<p><code>.click(fn)</code>, <code>.change(fn)</code>, <code>.submit(fn)</code> and friends bind; calling them with no argument triggers the event. Handlers receive <code>(event, detail)</code>, and <code>this</code> is the element — or, for delegated handlers, the matched descendant.</p>`,
  css: String.raw`
.ev-meter { height:34px; background:var(--surface-2); border-radius:99px; margin:14px 0 4px; position:relative; }
#ev-pos { position:absolute; top:5px; left:5px; width:24px; height:24px; border-radius:50%; background:var(--core); transition:left .15s; }`,
  demos: [{
    title: 'Keyboard shortcuts with namespaces',
    html: String.raw`
<p style="margin:0 0 12px">Press <kbd>J</kbd> / <kbd>K</kbd> to move the dot, <kbd>?</kbd> for help — anywhere on this page.</p>
<div class="row">
  <button type="button" id="ev-toggle" aria-pressed="true">Shortcuts on</button>
  <button type="button" id="ev-once">Claim one-time bonus</button>
  <button type="button" id="ev-fake">Simulate “J”</button>
</div>
<div class="ev-meter" aria-hidden="true"><span id="ev-pos"></span></div>
<pre class="out" id="ev-log" aria-live="polite">Event log…</pre>`,
    js: String.raw`
let pos = 0;
const log = msg => $('#ev-log').text((msg + '\n' + $('#ev-log').text()).split('\n').slice(0, 6).join('\n'));
const move = d => {
  pos = Math.max(0, Math.min(10, pos + d));
  $('#ev-pos').css('left', 'calc(' + pos * 9 + '% + 5px)');
};

function bindShortcuts() {
  $(document).on('keydown.shortcuts', e => {
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    if (e.key === 'j') { move(1);  log('keydown.shortcuts → J (position ' + pos + ')'); }
    if (e.key === 'k') { move(-1); log('keydown.shortcuts → K (position ' + pos + ')'); }
    if (e.key === '?') log('Help: J moves right, K moves left');
  });
}
bindShortcuts();

$('#ev-toggle').on('click', function () {
  const on = $(this).attr('aria-pressed') !== 'true';
  if (on) bindShortcuts();
  else $(document).off('.shortcuts');          // removes only this namespace
  $(this).attr('aria-pressed', String(on)).text(on ? 'Shortcuts on' : 'Shortcuts off');
  log(on ? "on('keydown.shortcuts') bound" : "off('.shortcuts') — namespace removed, other handlers untouched");
});

$('#ev-once').one('click', function () {
  log('.one() fired. Click again — nothing happens.');
  $(this).text('Bonus claimed ✓');
});

$('#ev-fake').on('click', () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' })));`,
  }],
  examples: [
    { title: 'The full toolbox', lang: 'js', code: String.raw`
$('.btn').on('click mouseenter', handler);       // several events
$('#dialog').on('keydown.modal', onKey);          // namespaced
$('#dialog').off('.modal');                       // remove the group
$('#intro').one('click', dismiss);                // runs once
$('#save').click(save);  $('#save').click();      // bind / trigger
$('.card').hover(lift, drop);                     // mouseenter + mouseleave` },
  ],
  api: ['.on()', '.one()', '.off()', '.trigger()', '.hover()', 'Shortcuts', '.focus() / .blur()'],
  from: [{ lib: 'jQuery', note: 'Same signatures. Handlers receive the native <code>Event</code> (no jQuery event wrapper), so use <code>e.key</code>, <code>e.target</code>, <code>e.preventDefault()</code> as usual. Legacy <code>.bind()</code>, <code>.live()</code>, <code>.delegate()</code> are not included — use <code>.on()</code>.' }],
  related: ['event-delegation', 'custom-events', 'event-directives'],
},
{
  slug: 'event-delegation', mod: 'core', title: 'Event delegation',
  seo: 'Event Delegation: One Listener for Thousands of Elements',
  desc: 'Handle clicks on thousands of rows — including rows added later — with a single listener using .on(event, selector, handler). Live demo with 1,000+ rows.',
  lede: 'Bind once on a container, handle events for every matching descendant — present and future. One listener instead of thousands, and nothing to re-bind after you add content.',
  body: String.raw`
<h2>Why delegation wins</h2>
<p>Binding a handler per row costs memory and setup time, and every row you add later needs binding again. Delegation attaches one listener to a stable ancestor. When an event bubbles up, jsKjs checks <code>event.target.closest(selector)</code> and calls your handler with <code>this</code> set to the matching element.</p>
<p>It also pairs perfectly with Hyper: content swapped in by <code>kj-get</code> is handled automatically, because the listener lives above it.</p>`,
  css: String.raw`
.dl-wrap { max-height:300px; overflow:auto; border:1px solid var(--line); border-radius:12px; margin-top:12px; }
.dl-wrap table { font-size:14px; }
.dl-wrap th { position:sticky; top:0; z-index:1; }
#dl-body tr { cursor:pointer; }
#dl-body tr.sel td { background:color-mix(in srgb, var(--core) 18%, transparent); }
.stage .dl-del { padding:4px 8px; font-size:12px; border-width:1px; }`,
  demos: [{
    title: '1,000 rows, one listener',
    html: String.raw`
<div class="row">
  <button type="button" id="dl-add">Add 250 rows</button>
  <button type="button" id="dl-reset">Reset</button>
  <span class="chip" id="dl-stats" aria-live="polite">0 rows · 1 listener</span>
</div>
<div class="dl-wrap" tabindex="0" role="region" aria-label="Orders table (scrollable)">
  <table>
    <thead><tr><th scope="col">#</th><th scope="col">Order</th><th scope="col">Total</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
    <tbody id="dl-body"></tbody>
  </table>
</div>
<p class="out" id="dl-out" aria-live="polite">Click a row to select it.</p>`,
    js: String.raw`
let n = 0;
const stats = () => $('#dl-stats').text($('#dl-body tr').length + ' rows · 1 listener');

function addRows(count) {
  const rows = [];
  for (let i = 0; i < count; i++) {
    n++;
    rows.push('<tr data-id="' + n + '"><td>' + n + '</td><td>Order #' + (1000 + n) + '</td><td>$' + (n * 7 % 90 + 10) +
      '</td><td><button type="button" class="dl-del" aria-label="Delete order ' + n + '">✕</button></td></tr>');
  }
  $('#dl-body').append(rows.join(''));
  stats();
}

// The ONLY listener: it serves every row that exists now or later
$('#dl-body').on('click', 'tr', function (e) {
  if ($(e.target).closest('.dl-del').length) {
    const id = $(this).remove().attr('data-id');
    $('#dl-out').text('Deleted row ' + id + ' — nothing to unbind.');
    return stats();
  }
  $(this).toggleClass('sel');
  $('#dl-out').text('Row ' + this.dataset.id + ' toggled · ' + $('#dl-body tr.sel').length + ' selected');
});

$('#dl-add').on('click', () => addRows(250));
$('#dl-reset').on('click', () => { $('#dl-body').empty(); n = 0; addRows(20); $('#dl-out').text('Reset.'); });
addRows(20);`,
  }],
  examples: [
    { title: 'Delegate from the document for app-wide behaviour', lang: 'js', code: String.raw`
$(document).on('click', '[data-copy]', function () {
  navigator.clipboard.writeText(this.dataset.copy);
});
$(document).on('submit', 'form[data-confirm]', function (e) {
  if (!confirm(this.dataset.confirm)) e.preventDefault();
});` },
  ],
  api: ['.on()', '.closest()'],
  from: [{ lib: 'jQuery', note: 'Identical: <code>.on(events, selector, handler)</code>. The old <code>.live()</code> and <code>.delegate()</code> forms are gone in favour of this one.' }],
  related: ['events', 'traversal', 'dom-manipulation'],
},
{
  slug: 'custom-events', mod: 'core', title: 'Custom events',
  seo: 'Custom Events with trigger() and Payloads — Decoupled UI',
  desc: 'Decouple your UI with custom events: trigger("cart:add", payload) once and let any number of independent listeners react. Built on native CustomEvent.',
  lede: 'Announce what happened with <code>.trigger(\'cart:add\', item)</code> and let any number of independent listeners react. The button doesn\'t need to know who is listening.',
  body: String.raw`
<p><code>.trigger(type, detail)</code> dispatches a native, bubbling <code>CustomEvent</code>. Listeners receive the payload as their second argument, so <code>(e, item) =&gt; …</code> reads naturally. Because the event bubbles, a single listener on <code>document</code> hears announcements from anywhere on the page.</p>
<p>This pattern keeps features independent: the cart badge, a toast system and analytics can each subscribe to <code>cart:add</code> without importing each other. Add or remove a listener and nothing else changes.</p>`,
  css: String.raw`
.ce-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; }
#ce-toasts { display:grid; gap:8px; min-height:44px; margin-top:14px; }
.toast { background:var(--ink); color:var(--bg); padding:10px 14px; border-radius:10px; font:600 13.5px/1.3 var(--mono); }`,
  demos: [{
    title: 'One event, three independent listeners',
    html: String.raw`
<div class="row" style="justify-content:space-between">
  <strong>Shop</strong>
  <span class="chip">🛒 <span id="ce-count">0</span> in cart</span>
</div>
<div class="ce-grid" id="ce-products" style="margin-top:12px">
  <button type="button" data-sku="TEE" data-price="24">Tween Tee</button>
  <button type="button" data-sku="MUG" data-price="18">Easing Mug</button>
  <button type="button" data-sku="MAT" data-price="32">Deskmat</button>
</div>
<div id="ce-toasts" role="status" aria-live="polite"></div>
<pre class="out" id="ce-log"></pre>`,
    js: String.raw`
// Listener 1 — cart badge
$(document).on('cart:add', () => $('#ce-count').text(+$('#ce-count').text() + 1));

// Listener 2 — toast
$(document).on('cart:add', (e, item) => {
  const $t = $('<div class="toast">').text('Added ' + item.name + ' · $' + item.price).appendTo('#ce-toasts');
  $.fromTo($t, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: .25 });
  setTimeout(() => $t.fadeOut(300, function () { $(this).remove(); }), 2200);
});

// Listener 3 — "analytics"
$(document).on('cart:add', (e, item) => {
  $('#ce-log').text('analytics ← cart:add ' + JSON.stringify(item) + '\n' + $('#ce-log').text());
});

// The buttons only announce what happened
$('#ce-products').on('click', 'button', function () {
  $(this).trigger('cart:add', { sku: this.dataset.sku, name: $(this).text(), price: +this.dataset.price });
});`,
  }],
  examples: [
    { title: 'Namespaced app events', lang: 'js', code: String.raw`
$(document).on('auth:login', (e, user) => $('#avatar').attr('src', user.avatar));
$(document).on('auth:logout', () => location.assign('/'));
$('#login-form').trigger('auth:login', { name: 'Ada', avatar: '/a.png' });` },
  ],
  api: ['.trigger()', '.on()'],
  from: [{ lib: 'jQuery', note: 'jQuery passes extra parameters as an array (<code>trigger("x", [a, b])</code>). jsKjs passes one payload — use an object — available as <code>e.detail</code> and as the handler\'s second argument.' }],
  related: ['events', 'lifecycle-events', 'global-store'],
},
{
  slug: 'ajax', mod: 'core', title: 'AJAX with $.ajax',
  seo: '$.ajax on fetch: Promises, JSON, Timeouts and Abort',
  desc: 'jQuery\'s $.ajax rebuilt on fetch: native Promises and async/await, JSON bodies, headers, timeouts with auto-abort, plus success/error callbacks and .done/.fail for migration.',
  lede: 'The familiar <code>$.ajax()</code> options, powered by <code>fetch</code>. Await it, or keep your <code>success</code> and <code>error</code> callbacks — both work. Try it against live PHP endpoints below.',
  body: String.raw`
<h2>Promises first, callbacks welcome</h2>
<p><code>$.ajax()</code> returns a native Promise, so <code>await</code> and <code>try/catch</code> just work. For migrating code it also accepts <code>success</code>, <code>error</code> and <code>complete</code> callbacks, and the promise carries <code>.done()</code>, <code>.fail()</code> and <code>.always()</code>.</p>
<h2>Options</h2>
<p><code>url</code>, <code>method</code> (or jQuery's <code>type</code>), <code>data</code> (object, <code>FormData</code> or string), <code>json: true</code> to send a JSON body, <code>dataType</code> (<code>'json'</code> or <code>'auto'</code>), <code>headers</code>, <code>timeout</code> in milliseconds (aborts automatically), and <code>credentials</code>. Failed responses reject with an <code>Error</code> carrying <code>.status</code> and <code>.data</code>; the promise also exposes <code>.abort()</code>.</p>`,
  demos: [{
    title: 'Request builder (real PHP endpoints)',
    html: String.raw`
<div class="grid g3" style="gap:12px">
  <div class="field"><label for="ax-method">Method</label>
    <select id="ax-method"><option>GET</option><option selected>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></div>
  <div class="field"><label for="ax-url">Endpoint</label>
    <select id="ax-url">
      <option value="/api/echo.php?format=json">/api/echo.php — echoes your request</option>
      <option value="/api/users.json">/api/users.json — static JSON</option>
      <option value="/api/fail.php?code=404">/api/fail.php?code=404 — error</option>
      <option value="/api/slow.php?ms=2500">/api/slow.php — 2.5 s response</option>
    </select></div>
  <div class="field"><label for="ax-name">data.name</label><input id="ax-name" type="text" value="Ada"></div>
  <div class="field"><label for="ax-timeout">timeout (ms, blank = none)</label><input id="ax-timeout" type="number" min="0" step="100" placeholder="e.g. 1000"></div>
  <label style="align-self:end;padding-bottom:10px"><input id="ax-json" type="checkbox"> Send as JSON (<code>json: true</code>)</label>
  <div style="align-self:end"><button type="button" id="ax-send">Send request</button></div>
</div>
<p id="ax-status" aria-live="polite" style="margin:14px 0 0;font-weight:700"></p>
<pre class="out" id="ax-out"></pre>`,
    js: String.raw`
$('#ax-send').on('click', async () => {
  const started = performance.now();
  $('#ax-status').text('Sending…');
  try {
    const data = await $.ajax({
      url: $('#ax-url').val(),
      method: $('#ax-method').val(),
      data: { name: $('#ax-name').val(), plan: 'pro' },
      json: $('#ax-json').val(),                       // checkbox .val() → boolean
      timeout: +$('#ax-timeout').val() || undefined,
    });
    $('#ax-status').html('<span class="yes">✓ OK</span> in ' + Math.round(performance.now() - started) + ' ms');
    $('#ax-out').text(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } catch (err) {
    const why = err.name === 'AbortError' ? 'aborted by timeout' : 'HTTP ' + err.status;
    $('#ax-status').html('<span class="no">✗ ' + why + '</span>');
    $('#ax-out').text(err.data || err.message);
  }
});`,
  }],
  examples: [
    { title: 'async/await', lang: 'js', code: String.raw`
try {
  const saved = await $.ajax({ url: '/api/items', method: 'POST', data: item, json: true, timeout: 5000 });
  render(saved);
} catch (err) {
  if (err.status === 422) showErrors(err.data);
}` },
    { title: 'jQuery-style callbacks still work', lang: 'js', code: String.raw`
$.ajax({
  url: '/api/items', type: 'POST', data: { title: 'Hi' },
  success(data) { render(data); },
  error(err) { alert('Failed: ' + err.status); },
});
$.ajax('/api/ping').done(onPong).fail(onError).always(hideSpinner);` },
  ],
  api: ['$.ajax()'],
  from: [{ lib: 'jQuery', note: 'Returns a Promise rather than a jqXHR. <code>$.ajaxSetup</code>, prefilters, transports and JSONP are not included; set shared headers with a small wrapper function instead.' }],
  related: ['fetch-shorthands', 'timeouts-and-errors', 'declarative-requests'],
},
{
  slug: 'fetch-shorthands', mod: 'core', title: '$.get, $.post & $.getJSON',
  seo: '$.get, $.post and $.getJSON Shorthands with async/await',
  desc: 'One-line GET, POST and JSON requests that return Promises: await $.getJSON(url), $.get(url, data), $.post(url, data) — live examples against real endpoints.',
  lede: 'The one-liners. <code>await $.getJSON(\'/api/users.json\')</code> and you have data; <code>$.post()</code> sends a form-encoded body; <code>$.get()</code> returns text or JSON based on the response.',
  body: String.raw`
<p>Each shorthand returns the same Promise as <code>$.ajax()</code>. For <code>$.get()</code> and <code>$.getJSON()</code>, an object in the second argument becomes the query string; for <code>$.post()</code> it becomes an <code>application/x-www-form-urlencoded</code> body. A callback in the last position still works for older code.</p>`,
  css: String.raw`
.team { display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:10px; margin-top:14px; }
.team .p { border:1px solid var(--line); border-radius:12px; padding:12px; background:var(--surface-2); }
.team .p b { display:block; } .team .p small { color:var(--muted); font-family:var(--mono); }`,
  demos: [{
    title: 'Team directory + quote of the day',
    html: String.raw`
<div class="row">
  <button type="button" id="fs-load">Load team ($.getJSON)</button>
  <button type="button" id="fs-sort">Sort by commits</button>
  <button type="button" id="fs-quote">New quote ($.get)</button>
</div>
<div class="team" id="fs-team" aria-live="polite"></div>
<p id="fs-q" style="margin-top:14px;min-height:1.6em" aria-live="polite"></p>`,
    js: String.raw`
let team = [];
const render = () => $('#fs-team').html(team.map(u =>
  '<div class="p"><b>' + $.escape(u.name) + '</b><small>' + $.escape(u.role) + ' · ' + u.commits + ' commits</small></div>').join(''));

$('#fs-load').on('click', async () => {
  team = await $.getJSON('/api/users.json');
  render();
  $.from('#fs-team .p', { y: 14, opacity: 0, duration: .3, stagger: .06 });
});

$('#fs-sort').on('click', () => {
  team.sort((a, b) => b.commits - a.commits);
  render();
});

$('#fs-quote').on('click', async () => {
  const n = 1 + Math.floor(Math.random() * 5);
  $('#fs-q').html(await $.get('/api/quotes/' + n + '.html'));
});`,
  }],
  examples: [
    { title: 'Shorthands', lang: 'js', code: String.raw`
const users = await $.getJSON('/api/users', { team: 'core' });   // ?team=core
const html  = await $.get('/partials/sidebar.html');
await $.post('/api/subscribe', { email });
$.get('/api/ping', data => console.log(data));                    // callback style` },
  ],
  api: ['$.get()', '$.post()', '$.getJSON()'],
  from: [{ lib: 'jQuery', note: 'Same signatures. <code>$.getScript()</code> is not included — use a dynamic <code>import()</code> or a script element.' }],
  related: ['ajax', 'load-fragments', 'forms-and-serialize'],
},
{
  slug: 'load-fragments', mod: 'core', title: 'Loading HTML fragments',
  seo: '.load(url #selector): Insert Part of a Remote HTML Page',
  desc: 'Fetch a page and insert only the fragment you need with $(el).load("/page.html #section") — the classic jQuery partial-loading pattern on fetch.',
  lede: '<code>$(\'#panel\').load(\'/news.html #headlines\')</code> fetches a whole page but inserts only the part you asked for.',
  body: String.raw`
<p>Pass a URL, optionally followed by a space and a selector. Without a selector, the entire response replaces the element's content. With one, jsKjs parses the response in an inert <code>&lt;template&gt;</code> and inserts just the matching nodes — scripts in the response are not executed. The optional callback receives the response text and a status of <code>'success'</code> or <code>'error'</code>.</p>`,
  demos: [{
    title: 'Fragment vs full page',
    html: String.raw`
<div class="row">
  <button type="button" id="lf-frag">.load('/api/news.html #headlines')</button>
  <button type="button" id="lf-full">.load('/api/news.html')</button>
</div>
<div class="grid g2" style="margin-top:14px">
  <div><h4 style="margin:0 0 6px">Fragment only</h4><div id="lf-a" class="out" style="min-height:120px" aria-live="polite"></div></div>
  <div><h4 style="margin:0 0 6px">Whole page</h4><div id="lf-b" class="out" style="min-height:120px" aria-live="polite"></div></div>
</div>`,
    js: String.raw`
$('#lf-frag').on('click', () => $('#lf-a').load('/api/news.html #headlines'));
$('#lf-full').on('click', () => $('#lf-b').load('/api/news.html', function (text, status) {
  console.log('load finished with status', status);
}));`,
  }],
  examples: [
    { title: 'Refresh a sidebar from the real page', lang: 'js', code: String.raw`
$('#sidebar').load('/account #account-summary');
$('#results').load('/search?q=' + encodeURIComponent(q) + ' .result');` },
  ],
  api: ['.load()'],
  from: [{ lib: 'htmx', note: 'In attribute form, the same idea is <code>kj-get</code> + <code>kj-target</code>. Fragment selection from a response (htmx\'s <code>hx-select</code>) is only available through <code>.load()</code> in jsKjs.' }],
  related: ['fetch-shorthands', 'targets-and-swaps', 'declarative-requests'],
},
{
  slug: 'forms-and-serialize', mod: 'core', title: 'Forms & serialization',
  seo: 'Serialize Forms: serialize() and serializeObject() in jsKjs',
  desc: 'Turn forms into query strings or plain objects with serialize() and serializeObject(), then submit them with $.post — or declaratively with kj-post.',
  lede: '<code>.serialize()</code> gives you <code>name=Ada&amp;plan=pro</code>; <code>.serializeObject()</code> gives you <code>{ name: \'Ada\', plan: \'pro\' }</code>. Both read the browser\'s own <code>FormData</code>.',
  body: String.raw`
<p>Because serialization uses <code>FormData</code>, it follows the browser's rules exactly: disabled fields are skipped, unchecked checkboxes are omitted, and multi-selects contribute one entry per selected option (<code>.serializeObject()</code> keeps the last; use <code>new FormData(form).getAll(name)</code> for all of them).</p>
<p>Prefer HTML? <code>&lt;form kj-post="/api/save"&gt;</code> does the same thing with no JavaScript at all — see <a href="/features/declarative-requests/">declarative requests</a>.</p>`,
  demos: [{
    title: 'Live serialization + server echo',
    html: String.raw`
<form id="sf" class="grid g3" style="gap:12px">
  <div class="field"><label for="sf-name">Name</label><input id="sf-name" name="name" type="text" value="Ada"></div>
  <div class="field"><label for="sf-plan">Plan</label><select id="sf-plan" name="plan"><option>free</option><option selected>pro</option><option>team</option></select></div>
  <label style="align-self:end;padding-bottom:10px"><input type="checkbox" name="newsletter" value="yes" checked> Newsletter</label>
  <div style="grid-column:1/-1"><button type="submit">Submit with $.post</button></div>
</form>
<pre class="out" id="sf-live" aria-live="off"></pre>
<div id="sf-server" aria-live="polite"></div>`,
    js: String.raw`
const show = () => $('#sf-live').text(
  '.serialize()       → "' + $('#sf').serialize() + '"\n' +
  '.serializeObject() → ' + JSON.stringify($('#sf').serializeObject()));

$('#sf').on('input change', show);

$('#sf').on('submit', async e => {
  e.preventDefault();
  $('#sf-server').html(await $.post('/api/echo.php', $('#sf').serializeObject()));
});

show();`,
  }],
  examples: [
    { title: 'Send as JSON instead', lang: 'js', code: String.raw`
await $.ajax({ url: '/api/profile', method: 'PUT', data: $('#profile').serializeObject(), json: true });` },
  ],
  api: ['.serialize()', '.serializeObject()', '.val()', '$.post()'],
  from: [{ lib: 'jQuery', note: '<code>.serializeArray()</code> is not included; <code>.serializeObject()</code> (a jsKjs extra) covers the common case.' }],
  related: ['declarative-requests', 'include-and-vals', 'two-way-binding'],
},
{
  slug: 'timeouts-and-errors', mod: 'core', title: 'Timeouts, aborts & retries',
  seo: 'AJAX Error Handling: Timeouts, Abort and Retry with Backoff',
  desc: 'Handle real-world network failure: HTTP errors with status codes, automatic timeouts, manual abort(), and a retry-with-backoff helper — demonstrated against live endpoints.',
  lede: 'Networks fail. jsKjs gives you real status codes, automatic timeouts that abort the request, a manual <code>.abort()</code>, and everything you need to retry politely.',
  body: String.raw`
<p>Any non-2xx response rejects with an <code>Error</code> that carries <code>.status</code> and the parsed body as <code>.data</code>. A <code>timeout</code> option aborts the underlying <code>fetch</code> through an <code>AbortController</code>, and the rejection's <code>name</code> is <code>'AbortError'</code>. Call <code>.abort()</code> on the returned promise to cancel yourself — useful when a newer search makes an older one irrelevant.</p>
<p>The flaky endpoint below fails about 60% of the time at random, on the server, so the retry demo is honest: sometimes it succeeds first try, sometimes it needs three.</p>`,
  demos: [{
    title: 'Failure lab',
    html: String.raw`
<div class="row">
  <button type="button" id="te-404">GET a 404</button>
  <button type="button" id="te-500">GET a 500</button>
  <button type="button" id="te-timeout">Timeout 800 ms vs 3 s server</button>
  <button type="button" id="te-abort">Abort after 400 ms</button>
  <button type="button" id="te-retry">Retry with backoff</button>
</div>
<pre class="out" id="te-out" aria-live="polite">Pick a failure.</pre>`,
    js: String.raw`
const out = msg => $('#te-out').text(msg);

$('#te-404').on('click', () =>
  $.ajax('/api/fail.php?code=404').fail(err => out('.fail() → status ' + err.status + ': ' + err.data)));

$('#te-500').on('click', async () => {
  try { await $.get('/api/fail.php?code=500'); }
  catch (err) { out('try/catch → status ' + err.status); }
});

$('#te-timeout').on('click', () => {
  out('Waiting up to 800 ms…');
  $.ajax({ url: '/api/slow.php?ms=3000', timeout: 800 })
    .fail(err => out(err.name + ' — gave up after 800 ms; the server needed 3 s.'));
});

$('#te-abort').on('click', () => {
  out('Started; aborting in 400 ms…');
  const req = $.ajax('/api/slow.php?ms=3000');
  req.fail(err => out('.abort() → ' + err.name));
  setTimeout(() => req.abort(), 400);
});

async function withRetry(url, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    try { return { data: await $.get(url), attempt: i }; }
    catch (err) {
      out('Attempt ' + i + ' → ' + err.status + (i < tries ? ', retrying in ' + 200 * 2 ** i + ' ms…' : ''));
      if (i === tries) throw err;
      await new Promise(r => setTimeout(r, 200 * 2 ** i));
    }
  }
}

$('#te-retry').on('click', async () => {
  try {
    const { data, attempt } = await withRetry('/api/flaky.php');
    out('Succeeded on attempt ' + attempt + ': ' + data);
  } catch (err) { out('Gave up after 4 attempts.'); }
});`,
  }],
  examples: [
    { title: 'Cancel stale searches', lang: 'js', code: String.raw`
let pending;
$('#q').on('input', $.debounce(async function () {
  pending?.abort();                       // cancel the previous request
  pending = $.get('/api/search', { q: this.value });
  try { $('#results').html(await pending); } catch (e) { /* aborted or failed */ }
}, 200));` },
  ],
  api: ['$.ajax()'],
  related: ['ajax', 'lifecycle-events', 'debounce-and-throttle'],
},
];
