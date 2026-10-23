/* Motion (GSAP-style) and Utilities. Demo code: no backticks, no ${. */
module.exports = [
/* ============================ MOTION ============================ */
{
  slug: 'tweens', mod: 'motion', title: 'Tweens',
  seo: '$.to(): GSAP-style Tweens with Transforms, Easing and Promises',
  desc: 'Animate any numeric CSS property and transforms (x, y, rotate, scale) with $.to(). Duration in seconds, professional easings, and a Promise you can await. Interactive demo.',
  lede: '<code>$.to(target, { x: 200, rotate: 15, duration: .6, ease: \'back.out\' })</code>. Seconds, not milliseconds; transforms, not left/top; a Promise you can <code>await</code>.',
  body: String.raw`
<h2>The tween engine</h2>
<p>Every frame runs on <code>requestAnimationFrame</code>. Transform shorthands — <code>x</code>, <code>y</code>, <code>rotate</code>, <code>scale</code>, <code>scaleX</code>, <code>scaleY</code>, <code>skewX</code>, <code>skewY</code> — are tracked per element and composed into a single <code>transform</code> write per frame, so animating <code>x</code> never clobbers a <code>rotate</code> set earlier.</p>
<p>Any other numeric CSS property (<code>opacity</code>, <code>width</code>, <code>margin-left</code>, <code>stroke-dashoffset</code>) tweens from its computed value. Options: <code>duration</code> (seconds, default 0.4), <code>delay</code>, <code>ease</code>, <code>stagger</code> and <code>onComplete</code>.</p>
<p>Respect <code>prefers-reduced-motion</code>: check <code>matchMedia('(prefers-reduced-motion: reduce)')</code> and skip or shorten decorative tweens.</p>`,
  css: String.raw`
.arena { position:relative; height:280px; border-radius:14px; background:
  radial-gradient(circle, var(--line) 1.2px, transparent 1.5px) 0 0 / 22px 22px, var(--surface-2); overflow:hidden; cursor:crosshair; margin-top:14px; }
.ball { position:absolute; top:0; left:0; width:44px; height:44px; border-radius:50%; background:var(--motion); box-shadow:0 10px 24px -8px rgba(255,178,36,.8); }`,
  demos: [{
    title: 'Click anywhere — the ball tweens there',
    html: String.raw`
<div class="row">
  <div class="field" style="min-width:180px"><label for="tw-ease">Ease</label><select id="tw-ease"></select></div>
  <div class="field" style="min-width:200px"><label for="tw-dur">Duration: <span id="tw-dur-v">0.7</span>s</label><input id="tw-dur" type="range" min="0.2" max="2" step="0.1" value="0.7"></div>
</div>
<div id="tw-arena" class="arena" aria-label="Animation area. Click to move the ball, or use the corner buttons."><div id="tw-ball" class="ball"></div></div>
<div class="row" style="margin-top:10px" aria-label="Move to a corner">
  <button type="button" data-corner="tl">↖ Top left</button><button type="button" data-corner="tr">↗ Top right</button>
  <button type="button" data-corner="bl">↙ Bottom left</button><button type="button" data-corner="br">↘ Bottom right</button>
</div>
<pre class="out" id="tw-out"></pre>`,
    js: String.raw`
const SIZE = 44;
$.each($.easings, name => $('<option>').text(name).appendTo('#tw-ease'));   // every built-in easing
$('#tw-ease').val('back.out');
$('#tw-dur').on('input', function () { $('#tw-dur-v').text(this.value); });

async function moveTo(x, y) {
  const ease = $('#tw-ease').val(), duration = +$('#tw-dur').val();
  $('#tw-out').text("await $.to('#tw-ball', { x: " + Math.round(x) + ', y: ' + Math.round(y) +
    ', duration: ' + duration + ", ease: '" + ease + "' })");
  await $.to('#tw-ball', { x, y, duration, ease });
  $.fromTo('#tw-ball', { scale: 1.3 }, { scale: 1, duration: .3, ease: 'elastic.out' });   // land with a wobble
}

$('#tw-arena').on('click', function (e) {
  const r = this.getBoundingClientRect();
  moveTo(Math.min(Math.max(e.clientX - r.left - SIZE / 2, 0), r.width - SIZE),
         Math.min(Math.max(e.clientY - r.top - SIZE / 2, 0), r.height - SIZE));
});

$('[data-corner]').on('click', function () {
  const r = $('#tw-arena')[0].getBoundingClientRect(), c = this.dataset.corner;
  moveTo(c.includes('r') ? r.width - SIZE : 0, c.includes('b') ? r.height - SIZE : 0);
});`,
  }],
  examples: [
    { title: 'Everyday tweens', lang: 'js', code: String.raw`
$.to('.card', { y: -6, scale: 1.02, duration: .2 });
await $.to('#modal', { opacity: 0, y: 20, duration: .25 });
$('#modal').hide();
$('.badge').to({ rotate: 360, duration: 1, ease: 'elastic.out' });   // chainable form` },
  ],
  api: ['$.to()', 'Easings'],
  from: [{ lib: 'GSAP', note: '<code>gsap.to()</code> → <code>$.to()</code>, same property names and seconds. Not included: <code>repeat</code>/<code>yoyo</code>, playback control on single tweens, colour and SVG-attribute tweening, <code>onUpdate</code>, and automatic overwriting of competing tweens.' }],
  related: ['from-and-fromto', 'transforms', 'easings'],
},
{
  slug: 'from-and-fromto', mod: 'motion', title: 'From & fromTo',
  seo: '$.from() and $.fromTo(): Entrance Animations and Split Text',
  desc: 'Animate elements in from a starting state with $.from(), or define both ends with $.fromTo(). Live demo: split-text headline, dealt cards and an elastic badge pop.',
  lede: '<code>$.from()</code> starts from the values you give and animates back to where the element already is — the perfect entrance. <code>$.fromTo()</code> spells out both ends.',
  body: String.raw`
<p>Entrances are easier to reason about as "where it comes <em>from</em>": the layout stays in your CSS, and the animation describes only the journey. <code>$.fromTo()</code> is the right choice when the start state isn't the element's resting state — a pop from <code>scale: 0</code>, or a replayable effect.</p>
<p>The headline below is split into one span per character with <code>$.map()</code>, then each letter is staggered in — the effect GSAP's SplitText plugin popularised, in a few lines. The heading keeps an <code>aria-label</code> so screen readers hear words, not letters.</p>`,
  css: String.raw`
#ft-title span { display:inline-block; }
.ft-cards { display:flex; gap:12px; flex-wrap:wrap; margin-top:14px; }
.ft-card { width:110px; height:140px; border-radius:12px; display:grid; place-items:center; font:800 15px var(--display); font-stretch:115%; color:#13152B; }
.ft-card:nth-child(1) { background:var(--core); } .ft-card:nth-child(2) { background:var(--hyper); }
.ft-card:nth-child(3) { background:var(--pulse); } .ft-card:nth-child(4) { background:var(--motion); }`,
  demos: [{
    title: 'Split text, dealt cards, elastic pop',
    html: String.raw`
<h2 id="ft-title" style="margin:0;font-size:clamp(1.8rem,5vw,3.1rem)">Animate everything.</h2>
<div class="row" style="margin:16px 0">
  <button type="button" id="ft-split">Replay headline</button>
  <button type="button" id="ft-deal">Deal cards ($.from)</button>
  <button type="button" id="ft-pop">Pop badge ($.fromTo)</button>
  <span class="chip" id="ft-badge">NEW</span>
</div>
<div class="ft-cards" aria-hidden="true"><div class="ft-card">CORE</div><div class="ft-card">HYPER</div><div class="ft-card">PULSE</div><div class="ft-card">MOTION</div></div>`,
    js: String.raw`
const $title = $('#ft-title');
const text = $title.text();
$title.attr('aria-label', text).html($.map(text.split(''), c =>
  '<span aria-hidden="true">' + (c === ' ' ? '&nbsp;' : $.escape(c)) + '</span>').join(''));

const split = () => $.fromTo('#ft-title span',
  { y: 30, opacity: 0, rotate: 12 },
  { y: 0, opacity: 1, rotate: 0, duration: .5, stagger: .03, ease: 'back.out' });

$('#ft-split').on('click', split);

$('#ft-deal').on('click', async function () {
  $(this).prop('disabled', true);
  await $.from('.ft-card', { x: -80, rotate: -14, opacity: 0, duration: .45, stagger: .08, ease: 'power2.out' });
  $(this).prop('disabled', false);
});

$('#ft-pop').on('click', () =>
  $.fromTo('#ft-badge', { scale: 0, rotate: -30 }, { scale: 1, rotate: 0, duration: .8, ease: 'elastic.out' }));

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) split();`,
  }],
  examples: [
    { title: 'Entrances', lang: 'js', code: String.raw`
$.from('.hero h1', { y: 40, opacity: 0, duration: .8, ease: 'power2.out' });
$.from('.feature', { y: 24, opacity: 0, duration: .5, stagger: .08 });
$.fromTo('.toast', { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: .3 });` },
  ],
  api: ['$.from()', '$.fromTo()'],
  from: [{ lib: 'GSAP', note: '<code>gsap.from()</code>/<code>gsap.fromTo()</code> → <code>$.from()</code>/<code>$.fromTo()</code>. <code>gsap.set()</code> has no separate equivalent — use <code>.css()</code> for styles, or a zero-duration <code>$.to()</code> for transforms.' }],
  related: ['tweens', 'stagger', 'timelines'],
},
{
  slug: 'timelines', mod: 'motion', title: 'Timelines',
  seo: '$.timeline(): Sequence Animations with Overlaps and Gaps',
  desc: 'Sequence animations with $.timeline(): steps run in order, "<" runs a step alongside the previous one, "+=0.3" adds a gap, and await tl.play() tells you when it\'s done.',
  lede: 'Choreography without callback pyramids. Steps run in order; <code>\'&lt;\'</code> starts a step together with the previous one; <code>\'+=0.3\'</code> waits a beat first.',
  body: String.raw`
<div class="table-wrap"><table>
<thead><tr><th scope="col">Position</th><th scope="col">Meaning</th></tr></thead>
<tbody>
<tr><td><em>(none)</em></td><td>Start after everything before it has finished</td></tr>
<tr><td><code>'&lt;'</code></td><td>Start at the same time as the previous step</td></tr>
<tr><td><code>'+=0.3'</code></td><td>Start 0.3 s after the previous step finishes</td></tr>
</tbody></table></div>
<p>Defaults passed to <code>$.timeline({ ease, duration })</code> apply to every step. Timelines auto-play; pass <code>paused: true</code> and call <code>await tl.play()</code> when you want to control the start and know when it ended. <code>.add(fn)</code> runs any function as a step — and if it returns a Promise, the timeline waits for it.</p>`,
  css: String.raw`
.launch { position:relative; height:320px; border-radius:14px; background:linear-gradient(var(--rack), #262a55); overflow:hidden; }
.launch .pad { position:absolute; left:0; right:0; bottom:0; height:30px; background:var(--rack-2); border-top:2px solid var(--rack-line); }
#rk { position:absolute; left:50%; bottom:30px; margin-left:-24px; font-size:48px; line-height:1; }
#rk span { display:inline-block; transform:rotate(-45deg); }
#rk-flame { position:absolute; left:50%; bottom:6px; margin-left:-9px; width:18px; height:32px; border-radius:50% 50% 50% 50% / 30% 30% 70% 70%; background:linear-gradient(var(--motion), var(--hyper)); opacity:0; transform-origin:top center; }
#rk-count { position:absolute; inset:0; display:grid; place-items:center; font:850 96px/1 var(--display); color:var(--motion); pointer-events:none; }
#rk-msg { position:absolute; top:24px; left:0; right:0; text-align:center; font:700 18px var(--display); color:var(--rack-ink); opacity:0; }`,
  demos: [{
    title: 'Launch sequence',
    html: String.raw`
<div class="launch" aria-hidden="true">
  <div class="pad"></div>
  <div id="rk-flame"></div>
  <div id="rk"><span>🚀</span></div>
  <div id="rk-count"></div>
  <div id="rk-msg">Liftoff ✓</div>
</div>
<div class="row" style="margin-top:12px">
  <button type="button" id="rk-go">Launch</button>
  <button type="button" id="rk-reset">Reset</button>
</div>
<pre class="out" id="rk-log" aria-live="polite"></pre>`,
    js: String.raw`
const log = s => $('#rk-log').text(($('#rk-log').text() + '\n' + s).trim());
const count = n => () => { $('#rk-count').text(n); log('T-' + n); };
const beat = { scale: 1, opacity: 1, duration: .55 };

$('#rk-go').on('click', async function () {
  $(this).prop('disabled', true);
  $('#rk-log').text('');
  const tl = $.timeline({ paused: true, ease: 'power2.out' })
    .add(count(3)).fromTo('#rk-count', { scale: 1.7, opacity: 0 }, beat)
    .add(count(2)).fromTo('#rk-count', { scale: 1.7, opacity: 0 }, beat)
    .add(count(1)).fromTo('#rk-count', { scale: 1.7, opacity: 0 }, beat)
    .to('#rk-count', { opacity: 0, duration: .15 })
    .to('#rk', { x: -4, duration: .05 }).to('#rk', { x: 4, duration: .05 }).to('#rk', { x: 0, duration: .05 })
    .to('#rk-flame', { opacity: 1, scaleY: 1.7, duration: .25 })
    .to('#rk', { y: -250, duration: 1.4, ease: 'power2.in' })
    .to('#rk-flame', { y: -250, duration: 1.4, ease: 'power2.in' }, '<')    // flame rides along
    .add(() => log('Liftoff ✓'), '+=0.1')
    .fromTo('#rk-msg', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .4 });
  await tl.play();                                                          // resolves when every step is done
  $(this).prop('disabled', false);
});

$('#rk-reset').on('click', () => {
  $.to('#rk, #rk-flame', { x: 0, y: 0, scaleY: 1, duration: .3 });
  $('#rk-flame, #rk-msg').css('opacity', 0);
  $('#rk-count').text('');
  $('#rk-log').text('');
});`,
  }],
  examples: [
    { title: 'A hero intro', lang: 'js', code: String.raw`
$.timeline({ duration: .5, ease: 'power2.out' })
  .from('.hero', { opacity: 0 })
  .from('.hero h1', { y: 30 })
  .from('.hero p', { y: 30 }, '<')        // together with the h1
  .from('.cta', { scale: .8 }, '+=0.2');  // a beat later` },
  ],
  api: ['$.timeline()'],
  from: [{ lib: 'GSAP', note: 'Supports sequencing, <code>\'&lt;\'</code>, <code>\'+=N\'</code>, defaults, <code>paused</code>, <code>play()</code> and <code>onComplete</code>. Not included: labels, absolute positions, <code>\'-=N\'</code> overlaps, <code>pause()</code>/<code>reverse()</code>/<code>seek()</code>/<code>progress()</code>, nesting and <code>repeat</code>.' }],
  related: ['tweens', 'from-and-fromto', 'stagger'],
},
{
  slug: 'stagger', mod: 'motion', title: 'Stagger',
  seo: 'Staggered Animations: Cascades, Ripples and Grid Waves',
  desc: 'Offset each element\'s start with the stagger option for cascades, or compute per-element delays for ripple and grid waves from any point. Interactive dot-grid demo.',
  lede: '<code>stagger: .03</code> starts each element 30 ms after the last. Order the elements — by index, randomly, or by distance from a point — and you control the shape of the wave.',
  body: String.raw`
<p>Stagger follows the order of the collection you pass in. Because a jsKjs collection is an array, you can sort it first: shuffle for sparkle, or sort by distance from a click for a ripple.</p>
<p>For a true radial wave, give each element its own <code>delay</code> proportional to its distance from the origin — the "ripple" button shows how in six lines. That is the effect GSAP calls <code>stagger: { from: 'center', grid }</code>, built from primitives.</p>`,
  css: String.raw`
.dots { display:grid; grid-template-columns:repeat(14,1fr); gap:10px; padding:18px; background:var(--rack); border-radius:14px; cursor:pointer; }
.dot { aspect-ratio:1; border-radius:50%; background:var(--motion); opacity:.35; }`,
  demos: [{
    title: 'Dot grid — click a dot to ripple from it',
    html: String.raw`
<div class="dots" id="dots" aria-hidden="true"></div>
<div class="row" style="margin-top:12px">
  <button type="button" id="st-cascade">Cascade (index order)</button>
  <button type="button" id="st-random">Sparkle (random order)</button>
  <button type="button" id="st-center">Ripple from centre</button>
</div>`,
    js: String.raw`
const COLS = 14, ROWS = 6;
for (let i = 0; i < COLS * ROWS; i++) $('<div class="dot">').attr('data-i', i).appendTo('#dots');
const $dots = $('#dots .dot');
const pulse = { scale: 1.8, opacity: 1, duration: .22, ease: 'power2.out' };
const rest = { scale: 1, opacity: .35, duration: .4, ease: 'back.out' };

$('#st-cascade').on('click', async () => {
  await $.to($dots, { ...pulse, stagger: .012 });
  $.to($dots, { ...rest, stagger: .012 });
});

$('#st-random').on('click', async () => {
  const shuffled = [...$dots].sort(() => Math.random() - .5);
  await $.to(shuffled, { ...pulse, stagger: .01 });
  $.to(shuffled, { ...rest, stagger: .01 });
});

function ripple(origin) {
  const ox = origin % COLS, oy = Math.floor(origin / COLS);
  $dots.each((i, el) => {
    const d = Math.hypot(i % COLS - ox, Math.floor(i / COLS) - oy);   // distance in cells
    $.to(el, { ...pulse, delay: d * .05 }).then(() => $.to(el, rest));
  });
}

$('#dots').on('click', '.dot', function () { ripple(+this.dataset.i); });
$('#st-center').on('click', () => ripple(Math.floor(ROWS / 2) * COLS + COLS / 2));`,
  }],
  examples: [
    { title: 'Stagger a list on load', lang: 'js', code: String.raw`
$.from('.menu li', { x: -12, opacity: 0, duration: .3, stagger: .04 });` },
  ],
  api: ['stagger', '$.to()'],
  from: [{ lib: 'GSAP', note: 'A number works like GSAP\'s <code>stagger: 0.05</code>. Stagger objects (<code>{ each, from, grid, amount }</code>) are not included — sort the collection or compute delays, as above.' }],
  related: ['tweens', 'timelines', 'easings'],
},
{
  slug: 'easings', mod: 'motion', title: 'Easings',
  seo: 'Easing Functions: power2, back, elastic, bounce — Visualized',
  desc: 'Ten built-in easings — linear, ease-in/out, power2, back.out, elastic.out, bounce.out — plotted as curves and playable live. Or pass any function of t.',
  lede: 'Easing is the personality of motion. Here is every built-in curve, plotted from the real functions in <code>$.easings</code> — click one to feel it.',
  body: String.raw`
<p>An easing maps progress <code>t</code> (0 → 1) to output (usually 0 → 1). <code>back.out</code> overshoots then settles; <code>elastic.out</code> wobbles; <code>bounce.out</code> bounces; the <code>power2</code> family accelerates or decelerates smoothly. Pass a name, or any function: <code>ease: t =&gt; t * t * (3 - 2 * t)</code>.</p>
<p>Rules of thumb: use <code>…out</code> curves for things entering (they arrive gently), <code>…in</code> for things leaving, and save <code>elastic</code> and <code>bounce</code> for moments of delight, not navigation.</p>`,
  css: String.raw`
.eg { display:grid; grid-template-columns:repeat(auto-fill,minmax(132px,1fr)); gap:10px; }
.stage .eg-card { display:grid; gap:6px; padding:10px; border-width:1px; text-align:left; font:600 12.5px var(--mono); }
.eg-card svg { width:100%; height:66px; overflow:visible; }
.eg-card polyline { fill:none; stroke:var(--motion-ink); stroke-width:2.5; stroke-linejoin:round; }
.eg-card .base { stroke:var(--line); stroke-width:1; }
.stage .eg-card:hover polyline { stroke:var(--bg); }
.track { position:relative; height:46px; margin:16px 0 4px; border:1px dashed var(--line); border-radius:10px; }
#eg-runner { position:absolute; top:6px; left:6px; width:32px; height:32px; border-radius:9px; background:var(--motion); }`,
  demos: [{
    title: 'Easing gallery',
    html: String.raw`
<div class="track" aria-hidden="true"><div id="eg-runner"></div></div>
<p class="muted" id="eg-now" aria-live="polite" style="margin:0 0 12px;font-size:14px">Choose an easing.</p>
<div class="eg" id="eg"></div>`,
    js: String.raw`
const W = 120, H = 66;
const curve = fn => {
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    pts.push((t * W).toFixed(1) + ',' + (H - 10 - fn(t) * (H - 22)).toFixed(1));
  }
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><line class="base" x1="0" y1="' + (H - 10) + '" x2="' + W + '" y2="' + (H - 10) + '"/><polyline points="' + pts.join(' ') + '"/></svg>';
};

async function play(name, ease) {
  $('#eg-now').text('Playing ' + name);
  const distance = $('.track').width() - 46;
  await $.to('#eg-runner', { x: distance, duration: .9, ease });
  await $.to('#eg-runner', { x: 0, duration: .45, ease: 'power2.inOut' });
}

$.each($.easings, (name, fn) => {
  $('<button type="button" class="eg-card">').html(curve(fn) + '<span>' + name + '</span>')
    .on('click', () => play(name, name)).appendTo('#eg');
});

const smoothstep = t => t * t * (3 - 2 * t);           // any function works
$('<button type="button" class="eg-card">').html(curve(smoothstep) + '<span>custom: smoothstep</span>')
  .on('click', () => play('custom smoothstep', smoothstep)).appendTo('#eg');`,
  }],
  examples: [
    { title: 'Named or custom', lang: 'js', code: String.raw`
$.to('.drawer', { x: 0, ease: 'power2.out' });
$.to('.ball', { y: 300, ease: 'bounce.out', duration: 1 });
$.to('.dot', { x: 100, ease: t => 1 - Math.cos(t * Math.PI / 2) });   // sine.in
$.easings['back.out'](0.5);                                             // use them anywhere` },
  ],
  api: ['Easings'],
  from: [{ lib: 'GSAP', note: 'Names follow GSAP\'s style. Included: <code>power2</code> in/out/inOut, <code>back.out</code>, <code>elastic.out</code>, <code>bounce.out</code>, plus CSS-style names. Other families (<code>sine</code>, <code>expo</code>, <code>circ</code>, <code>steps()</code>, CustomEase) can be passed as functions.' }],
  related: ['tweens', 'stagger', 'transforms'],
},
{
  slug: 'transforms', mod: 'motion', title: 'Transforms',
  seo: 'Animate x, y, rotate, scale and skew without Clobbering Transforms',
  desc: 'Animate x, y, rotate, scale, scaleX, scaleY, skewX and skewY independently — jsKjs composes them into one transform per frame. Interactive transform playground.',
  lede: 'Move with <code>x</code>/<code>y</code>, spin with <code>rotate</code>, grow with <code>scale</code>, lean with <code>skewX</code> — each independently, composed into one GPU-friendly transform.',
  body: String.raw`
<p>Writing <code>style.transform</code> by hand means every animation must know every other: set a rotation and you lose the translation. jsKjs keeps each component per element and rebuilds <code>translate() rotate() scale() skew()</code> on every frame, so you can tween <code>y</code> on hover while a separate tween spins the same element.</p>
<p>Transforms don't trigger layout, which is why they stay smooth on phones. Prefer them to <code>left</code>, <code>top</code>, <code>width</code> and <code>height</code> whenever you can.</p>`,
  css: String.raw`
.tf-grid { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:20px; align-items:center; }
.tf-stage { height:260px; border-radius:14px; background:var(--surface-2); display:grid; place-items:center; overflow:hidden; }
#tf-card { width:120px; height:80px; border-radius:14px; background:var(--motion); display:grid; place-items:center; font:800 16px var(--display); font-stretch:115%; color:#13152B; }
.tf-ctrls { display:grid; gap:8px; }
@media (max-width:700px) { .tf-grid { grid-template-columns:1fr; } }`,
  demos: [{
    title: 'Transform playground',
    html: String.raw`
<div class="tf-grid">
  <div class="tf-stage" aria-hidden="true"><div id="tf-card">$jsKjs</div></div>
  <div class="tf-ctrls" id="tf-ctrls">
    <div class="field"><label for="tf-x">x: <span>0</span></label><input id="tf-x" data-prop="x" type="range" min="-140" max="140" value="0"></div>
    <div class="field"><label for="tf-y">y: <span>0</span></label><input id="tf-y" data-prop="y" type="range" min="-80" max="80" value="0"></div>
    <div class="field"><label for="tf-rotate">rotate: <span>0</span></label><input id="tf-rotate" data-prop="rotate" type="range" min="-180" max="180" value="0"></div>
    <div class="field"><label for="tf-scale">scale: <span>1</span></label><input id="tf-scale" data-prop="scale" type="range" min="0.4" max="1.8" step="0.05" value="1"></div>
    <div class="field"><label for="tf-skewX">skewX: <span>0</span></label><input id="tf-skewX" data-prop="skewX" type="range" min="-30" max="30" value="0"></div>
    <div class="row"><button type="button" id="tf-spin">Spin 360° (keeps the rest)</button><button type="button" id="tf-reset">Reset</button></div>
  </div>
</div>
<pre class="out" id="tf-out"></pre>`,
    js: String.raw`
const state = { x: 0, y: 0, rotate: 0, scale: 1, skewX: 0 };
const show = () => $('#tf-out').text("style.transform → '" + $('#tf-card')[0].style.transform + "'");

$('#tf-ctrls').on('input', 'input[type=range]', async function () {
  state[this.dataset.prop] = +this.value;
  $(this).prev().find('span').text(this.value);
  await $.to('#tf-card', { ...state, duration: .25, ease: 'power2.out' });
  show();
});

$('#tf-spin').on('click', async () => {
  await $.to('#tf-card', { rotate: state.rotate + 360, duration: .8, ease: 'power2.inOut' });   // only rotate changes
  $.to('#tf-card', { rotate: state.rotate, duration: 0 });
  show();
});

$('#tf-reset').on('click', async () => {
  Object.assign(state, { x: 0, y: 0, rotate: 0, scale: 1, skewX: 0 });
  $('#tf-ctrls input[type=range]').each(function () {
    $(this).val(state[this.dataset.prop]).prev().find('span').text(state[this.dataset.prop]);
  });
  await $.to('#tf-card', { ...state, duration: .5, ease: 'back.out' });
  show();
});
show();`,
  }],
  examples: [
    { title: 'Hover lift that does not fight a spin', lang: 'js', code: String.raw`
$('.card').hover(
  function () { $(this).to({ y: -6, scale: 1.03, duration: .15 }); },
  function () { $(this).to({ y: 0, scale: 1, duration: .2 }); });
$.to('.card .icon', { rotate: 360, duration: 2, ease: 'linear' });` },
  ],
  api: ['$.to()', '$.fromTo()'],
  from: [{ lib: 'GSAP', note: 'Same shorthand names (<code>rotation</code> is accepted as an alias of <code>rotate</code>). <code>xPercent</code>, <code>yPercent</code>, <code>z</code>, 3D rotations and <code>transformOrigin</code> are not included — set <code>transform-origin</code> in CSS.' }],
  related: ['tweens', 'classes-and-css', 'easings'],
},
{
  slug: 'classic-effects', mod: 'motion', title: 'Classic effects',
  seo: 'fadeIn, slideToggle and animate(): jQuery Effects on a Modern Engine',
  desc: 'jQuery\'s fadeIn, fadeOut, fadeToggle, slideDown, slideUp, slideToggle and animate() — same names, milliseconds and callbacks — rebuilt on the jsKjs Motion engine.',
  lede: 'Your old <code>.fadeIn(400)</code> and <code>.slideToggle()</code> calls keep working — same names, same milliseconds, same callbacks — running on the Motion engine.',
  body: String.raw`
<p>These shims exist so jQuery code migrates without edits. They use <strong>milliseconds</strong> (jQuery's unit), accept a completion callback with <code>this</code> bound to each element, and return the collection for chaining. <code>.slideDown()</code> measures the element's natural height, so it works with dynamic content.</p>
<p>For new code, prefer <code>$.to()</code> and <code>await</code> — they are more flexible and composable.</p>`,
  css: String.raw`
.fx-q { border-bottom:1px solid var(--line); }
.stage .fx-q > button { width:100%; text-align:left; border:0; border-radius:0; padding:14px 4px; background:transparent; display:flex; justify-content:space-between; }
.stage .fx-q > button:hover { background:var(--surface-2); color:var(--ink); }
.fx-a { padding:0 4px 14px; color:var(--muted); }
.fx-track { height:12px; background:var(--surface-2); border-radius:8px; overflow:hidden; margin-top:12px; }
#fx-bar { height:100%; width:0; background:var(--motion); border-radius:8px; }`,
  demos: [{
    title: 'Accordion, notice and progress',
    html: String.raw`
<div id="fx-faq">
  <div class="fx-q"><button type="button" aria-expanded="false" aria-controls="fx-a1">Does .fadeIn() still take milliseconds? <span aria-hidden="true">＋</span></button>
    <div class="fx-a" id="fx-a1" style="display:none">Yes. The classic effects keep jQuery's units and callbacks.</div></div>
  <div class="fx-q"><button type="button" aria-expanded="false" aria-controls="fx-a2">Can I chain them? <span aria-hidden="true">＋</span></button>
    <div class="fx-a" id="fx-a2" style="display:none">They return the collection, so <code>.slideUp(200).addClass('closed')</code> works.</div></div>
  <div class="fx-q"><button type="button" aria-expanded="false" aria-controls="fx-a3">What about .stop() and queues? <span aria-hidden="true">＋</span></button>
    <div class="fx-a" id="fx-a3" style="display:none">Not included. Use await or a timeline to sequence effects.</div></div>
</div>
<div class="row" style="margin-top:16px">
  <button type="button" id="fx-show">Save settings (fadeIn)</button>
  <button type="button" id="fx-upload">Upload (animate)</button>
</div>
<div id="fx-notice" class="note" role="status" style="display:none" data-mod="pulse"><strong>Saved</strong>Your settings were saved. <button type="button" id="fx-dismiss">Dismiss (fadeOut)</button></div>
<div class="fx-track" aria-hidden="true"><div id="fx-bar"></div></div>
<p class="muted" id="fx-status" aria-live="polite" style="font-size:14px"></p>`,
    js: String.raw`
// Accordion: one open at a time
$('#fx-faq').on('click', '.fx-q > button', function () {
  const open = $(this).attr('aria-expanded') === 'true';
  $('#fx-faq .fx-q > button').not(this).attr('aria-expanded', 'false').next().slideUp(200);
  $(this).attr('aria-expanded', String(!open)).next().slideToggle(200);
});

$('#fx-show').on('click', () => $('#fx-notice').fadeIn(300));
$('#fx-dismiss').on('click', () => $('#fx-notice').fadeOut(300));

$('#fx-upload').on('click', function () {
  const full = $('.fx-track').width();
  $(this).prop('disabled', true);
  $('#fx-status').text('Uploading…');
  $('#fx-bar').css('width', 0).animate({ width: full }, 1200, 'power2.inOut', () => {
    $('#fx-status').text('Upload complete ✓');
    $(this).prop('disabled', false);
  });
});`,
  }],
  examples: [
    { title: 'Unchanged jQuery code', lang: 'js', code: String.raw`
$('.toast').fadeIn(200);
$('#details').slideToggle(300);
$('.panel').animate({ marginLeft: 40, opacity: .6 }, 400, function () { $(this).addClass('moved'); });` },
  ],
  api: ['.fadeIn() / .fadeOut() / .fadeToggle()', '.slideDown() / .slideUp() / .slideToggle()', '.animate()'],
  from: [{ lib: 'jQuery', note: 'Same names, units and callbacks. Not included: <code>.stop()</code>, <code>.finish()</code>, <code>.delay()</code>, <code>.queue()</code>, <code>.fadeTo()</code> and <code>$.fx</code> settings.' }],
  related: ['tweens', 'geometry-and-scroll', 'conditional-display'],
},

/* ============================ UTILITIES ============================ */
{
  slug: 'debounce-and-throttle', mod: 'util', title: 'Debounce & throttle',
  seo: 'Debounce vs Throttle in JavaScript — Visualized Live',
  desc: 'See the difference between debounce and throttle in real time: raw, throttled and debounced event lanes driven by your pointer. Built-in $.debounce() and $.throttle().',
  lede: 'Move your pointer over the pad. Raw events flood in; <code>$.throttle()</code> lets one through every 200 ms; <code>$.debounce()</code> waits until you stop.',
  body: String.raw`
<ul>
<li><strong>Throttle</strong> — run at most once per interval while events keep coming. Use for scroll and resize handlers, drag, progress bars.</li>
<li><strong>Debounce</strong> — run once, after events stop for the interval. Use for search-as-you-type, autosave, validation.</li>
</ul>
<p>Both return a new function that preserves <code>this</code> and arguments, so they drop straight into <code>.on()</code>. For declarative requests, <code>kj-trigger="keyup delay:300ms"</code> debounces without any JavaScript.</p>`,
  css: String.raw`
.dt-pad { height:140px; border-radius:14px; background:var(--rack); color:var(--rack-muted); display:grid; place-items:center; font:600 13px var(--mono); text-align:center; padding:12px; touch-action:none; }
.dt-lanes { display:grid; gap:8px; margin-top:14px; }
.dt-lane { display:grid; grid-template-columns:130px 1fr 52px; gap:10px; align-items:center; font:600 12.5px var(--mono); }
.dt-lane > div { position:relative; height:28px; background:var(--surface-2); border-radius:7px; overflow:hidden; }
.dt-lane i { position:absolute; top:5px; bottom:5px; width:2px; border-radius:2px; background:var(--util-ink); }
.dt-lane:nth-child(2) i { background:var(--core-ink); } .dt-lane:nth-child(3) i { background:var(--motion-ink); }
.dt-lane b { text-align:right; }
@media (max-width:560px) { .dt-lane { grid-template-columns:1fr 46px; } .dt-lane > div { grid-column:1/-1; grid-row:2; } }`,
  demos: [{
    title: 'Event lanes (4-second window)',
    html: String.raw`
<div id="dt-pad" class="dt-pad" tabindex="0" aria-label="Event pad: move the pointer here, or focus it and hold any key">Move your pointer here — or focus and hold a key</div>
<div class="dt-lanes">
  <div class="dt-lane"><span>raw events</span><div id="lane-raw"></div><b id="n-raw">0</b></div>
  <div class="dt-lane"><span>throttle 200ms</span><div id="lane-thr"></div><b id="n-thr">0</b></div>
  <div class="dt-lane"><span>debounce 300ms</span><div id="lane-deb"></div><b id="n-deb">0</b></div>
</div>`,
    js: String.raw`
const WINDOW = 4000;
let t0 = performance.now();
const counts = { raw: 0, thr: 0, deb: 0 };

function tick(lane) {
  const now = performance.now();
  if (now - t0 > WINDOW) { t0 = now; $('.dt-lane > div').empty(); }   // start a new 4 s window
  counts[lane]++;
  $('#n-' + lane).text(counts[lane]);
  $('<i>').css('left', ((now - t0) / WINDOW * 100).toFixed(2) + '%').appendTo('#lane-' + lane);
}

const throttled = $.throttle(() => tick('thr'), 200);
const debounced = $.debounce(() => tick('deb'), 300);

$('#dt-pad').on('pointermove keydown', () => { tick('raw'); throttled(); debounced(); });`,
  }],
  examples: [
    { title: 'Typical uses', lang: 'js', code: String.raw`
$(window).on('scroll', $.throttle(updateProgressBar, 50));
$('#search').on('input', $.debounce(function () { search(this.value); }, 300));
$(window).on('resize', $.debounce(relayout, 150));` },
  ],
  api: ['$.debounce()', '$.throttle()'],
  related: ['triggers', 'geometry-and-scroll', 'utilities'],
},
{
  slug: 'utilities', mod: 'util', title: 'Utilities',
  seo: '$.each, $.extend, $.escape, $.uuid and More jQuery-style Utilities',
  desc: 'The $ helper belt: $.each, $.map, $.extend (deep, prototype-pollution safe), $.param, $.parseHTML, $.escape, $.uuid, type checks and $.noConflict — run them live.',
  lede: 'The small helpers that make everyday code shorter — all executed live below, so you can see exactly what they return.',
  body: String.raw`
<p>Most of these are jQuery classics kept for compatibility (<code>$.each</code>, <code>$.extend</code>, <code>$.param</code>, <code>$.trim</code>, the <code>$.is*</code> checks). jsKjs adds a few modern essentials: <code>$.escape()</code> for safe HTML strings, <code>$.uuid()</code> backed by <code>crypto.randomUUID()</code>, and <code>$.easings</code>.</p>
<p><code>$.extend(true, …)</code> deep-merges <em>and</em> refuses <code>__proto__</code>, <code>constructor</code> and <code>prototype</code> keys, so merging untrusted JSON can't pollute <code>Object.prototype</code> — the class of bug behind jQuery's CVE-2019-11358.</p>`,
  css: String.raw`
#util-console .k { color:#FFC977; }`,
  demos: [{
    title: 'Utilities console',
    html: String.raw`
<div class="row"><button type="button" id="run-utils">Run every utility</button></div>
<pre class="out" id="util-console" aria-live="polite">Click the button — each line is real output.</pre>`,
    js: String.raw`
$('#run-utils').on('click', () => {
  const lines = [];
  const p = (call, value) => lines.push('<span class="k">' + $.escape(call) + '</span>\n  → ' + $.escape(String(value)));
  p('$.version', $.version);
  p("$.param({ a: 1, b: 'x y' })", $.param({ a: 1, b: 'x y' }));
  p("$.escape('<img onerror=alert(1)>')", $.escape('<img onerror=alert(1)>'));
  p('$.uuid()', $.uuid());
  p("$.trim('  padded  ')", "'" + $.trim('  padded  ') + "'");
  p('$.isArray([]) · $.isFunction($) · $.isPlainObject({})', [$.isArray([]), $.isFunction($), $.isPlainObject({})].join(' · '));
  p('$.map([1, 2], n => [n, n * 10])', JSON.stringify($.map([1, 2], n => [n, n * 10])));
  const seen = []; $.each({ a: 1, b: 2 }, (k, v) => seen.push(k + '=' + v));
  p('$.each({ a: 1, b: 2 }, fn)', seen.join(', '));
  p('$.extend(true, { a: { b: 1 } }, { a: { c: 2 } })', JSON.stringify($.extend(true, { a: { b: 1 } }, { a: { c: 2 } })));
  $.extend(true, {}, JSON.parse('{"__proto__": {"hacked": true}}'));
  p('prototype pollution attempt → ({}).hacked', ({}).hacked);
  p("$.parseHTML('<li>Hi</li>')[0].tagName", $.parseHTML('<li>Hi</li>')[0].tagName);
  p("Object.keys($.easings).length", Object.keys($.easings).length);
  $('#util-console').html(lines.join('\n'));
});`,
  }],
  examples: [
    { title: 'noConflict', lang: 'js', code: String.raw`
// Another library owns $? Keep both.
const kj = $.noConflict();      // window.$ goes back to the old value
kj('#app').addClass('ready');   // jsKjs is also always available as window.kj and window.jsKjs` },
  ],
  api: ['$.each()', '$.map()', '$.extend()', '$.param()', '$.parseHTML()', '$.escape()', '$.uuid()', 'Type checks', '$.noConflict()', '$.version'],
  from: [{ lib: 'jQuery', note: 'jQuery 4 removed <code>$.trim</code>, <code>$.isArray</code> and <code>$.isFunction</code>; jsKjs keeps them so older code runs. <code>$.Deferred</code>, <code>$.Callbacks</code>, <code>$.when</code> and <code>$.grep</code> are not included — use Promises and <code>Array.prototype.filter</code>.' }],
  related: ['debounce-and-throttle', 'attributes-and-data', 'selectors'],
},
];
