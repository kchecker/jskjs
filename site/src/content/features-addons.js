/* Feature pages for the add-ons (scroll, flip, drag, split, ui, live) and the newer parity features
   (list rendering, transitions, boost + out-of-band swaps, playback control).
   Demo code must not contain backticks or "${". Pages that need an add-on list it in `plugins`. */
module.exports = [

/* ------------------------------------------------------------------ MOTION */
{
  slug: 'scroll-trigger', mod: 'motion', plugins: ['scroll'], title: 'Scroll-linked animation',
  seo: 'ScrollTrigger-style Scroll Animation: Scrub, Pin, Snap and Callbacks',
  desc: 'Tie any tween or timeline to the scroll position with the jskjs.scroll.js add-on: scrub, pin, toggle classes, enter and leave callbacks, and smooth $.scrollTo(). Live demo.',
  lede: 'Add <code>scrollTrigger: { … }</code> to any tween and the scroll position drives it. The same option names as GSAP\'s ScrollTrigger: <code>start</code>, <code>end</code>, <code>scrub</code>, <code>pin</code>, <code>toggleClass</code>.',
  body: `
<h2>How it works</h2>
<p>Load <code>jskjs.scroll.js</code> after jsKjs. Any <code>$.to()</code>, <code>$.from()</code> or <code>$.timeline()</code> then accepts a <code>scrollTrigger</code> option. With <code>scrub: true</code> the tween's progress follows the scrollbar; without it, the tween plays when the trigger enters the viewport.</p>
<p><code>start</code> and <code>end</code> read as "<em>trigger edge</em> <em>viewport edge</em>": <code>'top 80%'</code> means "when the top of the trigger reaches 80% down the viewport". Use <code>'+=600'</code> for a distance in pixels.</p>
<p>The add-on uses one passive scroll listener and recalculates on resize. Pinning wraps the element in a spacer so the content below doesn't jump.</p>`,
  css: `
.st-zone { position:relative; height:220px; border-radius:14px; background:var(--surface-2); overflow:hidden; display:grid; place-items:center; }
.st-box { width:72px; height:72px; border-radius:16px; background:var(--motion); }
.st-bar { height:8px; border-radius:99px; background:var(--line); overflow:hidden; margin-top:14px; }
.st-bar span { display:block; height:100%; width:100%; transform-origin:left; transform:scaleX(0); background:var(--motion); }
.st-zone.is-active { outline:3px solid var(--motion); outline-offset:3px; }`,
  demos: [{
    title: 'Scroll the page — the square follows',
    html: `
<div id="st-zone" class="st-zone" aria-label="Scroll-linked animation area"><div id="st-box" class="st-box"></div></div>
<div class="st-bar" aria-hidden="true"><span id="st-bar"></span></div>
<p class="muted" style="margin-top:10px">Progress: <b id="st-out">0%</b> · <span id="st-state">waiting</span></p>
<div class="row"><button type="button" id="st-jump">$.scrollTo() the next section</button></div>`,
    js: `
$.timeline({
  scrollTrigger: {
    trigger: '#st-zone', start: 'top bottom', end: 'bottom top', scrub: true,
    toggleClass: 'is-active',
    onUpdate: st => $('#st-out').text(Math.round(st.progress * 100) + '%'),
    onEnter: () => $('#st-state').text('entered'),
    onLeave: () => $('#st-state').text('left (scrolled past)'),
    onEnterBack: () => $('#st-state').text('entered again'),
    onLeaveBack: () => $('#st-state').text('left (scrolled above)')
  }
})
  .to('#st-box', { x: -140, rotate: -90, ease: 'none' })
  .to('#st-box', { x: 140, rotate: 180, borderRadius: '50%', ease: 'none' })
  .to('#st-bar', { scaleX: 1, ease: 'none' }, 0);

$('#st-jump').on('click', () => $.scrollTo('.pager', { duration: 0.8, offset: 80 }));`,
  }],
  examples: [
    { title: 'Reveal on enter, pin a hero, snap to sections', lang: 'js', code: `
$('.reveal').each(function () {
  $.from(this, { y: 40, opacity: 0, duration: .6, scrollTrigger: { trigger: this, start: 'top 85%' } });
});
$.scrollTrigger({ trigger: '#hero', pin: true, start: 'top top', end: '+=600' });
$.to('.panels', { xPercent: -300, ease: 'none',
  scrollTrigger: { trigger: '.panels', pin: true, scrub: 1, snap: 1 / 3, end: '+=2400' } });` },
    { title: 'Load the add-on', lang: 'html', code: `
<script src="https://jskjs.org/cdn/{{VERSION}}/jskjs.min.js"></script>
<script src="https://jskjs.org/cdn/{{VERSION}}/plugins/jskjs.scroll.js"></script>` },
  ],
  api: ['jskjs.scroll.js', '$.timeline()'],
  from: [{ lib: 'GSAP', note: '<code>gsap.registerPlugin(ScrollTrigger)</code> is replaced by loading the add-on. <code>ScrollTrigger.create()</code> → <code>$.scrollTrigger()</code>, <code>ScrollTrigger.refresh()</code> → <code>$.ScrollTrigger.refresh()</code>; the options and callbacks keep their names.' }],
  related: ['timelines', 'playback-control', 'split-text'],
},

{
  slug: 'flip', mod: 'motion', plugins: ['flip'], title: 'Flip layout animation',
  seo: 'Flip Animations: Animate Layout Changes (First, Last, Invert, Play)',
  desc: 'Animate any layout change — reordering, filtering, grid to list — with the jskjs.flip.js add-on. Record positions, change the DOM, and elements glide to their new places. Live demo.',
  lede: 'Change the layout however you like — toggle a class, reorder nodes, filter items — and <code>.flip()</code> animates every element from where it was to where it is now.',
  body: `
<h2>First, Last, Invert, Play</h2>
<p>Flip records each element's position and size (<em>first</em>), runs your change, measures again (<em>last</em>), applies the inverse transform so nothing seems to move, then tweens the transform back to zero (<em>play</em>). The browser only animates <code>transform</code>, so it stays smooth even for large lists.</p>
<p>Use the one-call form <code>$('.card').flip(change, options)</code>, or the two-step GSAP form <code>$.Flip.getState()</code> … <code>$.Flip.from(state, options)</code> when the change happens somewhere else. It returns a timeline you can <code>await</code>.</p>`,
  css: `
.fl-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:10px; }
.fl-grid.list { grid-template-columns:1fr; }
.fl-tile { padding:18px 14px; border-radius:12px; background:var(--surface-2); border:1px solid var(--line); font-weight:700; }
.fl-tile[hidden] { display:none; }
.fl-grid .fl-tile:nth-child(3n+1) { border-left:6px solid var(--motion); }
.fl-grid .fl-tile:nth-child(3n+2) { border-left:6px solid var(--pulse); }
.fl-grid .fl-tile:nth-child(3n) { border-left:6px solid var(--hyper); }
@media (max-width:640px) { .fl-grid { grid-template-columns:repeat(2, 1fr); } }`,
  demos: [{
    title: 'Shuffle, filter and switch layout',
    html: `
<div class="row">
  <button type="button" id="fl-shuffle">Shuffle</button>
  <button type="button" id="fl-layout" aria-pressed="false">List view</button>
  <button type="button" id="fl-odd" aria-pressed="false">Hide odd tiles</button>
</div>
<div id="fl-grid" class="fl-grid" style="margin-top:14px">
  <div class="fl-tile">1 · Mug</div><div class="fl-tile">2 · Tee</div><div class="fl-tile">3 · Cap</div><div class="fl-tile">4 · Bag</div>
  <div class="fl-tile">5 · Pin</div><div class="fl-tile">6 · Pen</div><div class="fl-tile">7 · Hat</div><div class="fl-tile">8 · Mat</div>
</div>`,
    js: `
const flip = change => $('#fl-grid .fl-tile').flip(change, { duration: 0.6, ease: 'power2.inOut', stagger: 0.02 });

$('#fl-shuffle').on('click', () => flip(() => {
  const tiles = $('#fl-grid .fl-tile').get().sort(() => Math.random() - 0.5);
  $('#fl-grid').append(tiles);
}));
$('#fl-layout').on('click', function () {
  const on = this.getAttribute('aria-pressed') !== 'true';
  $(this).attr('aria-pressed', on);
  flip(() => $('#fl-grid').toggleClass('list', on));
});
$('#fl-odd').on('click', function () {
  const on = this.getAttribute('aria-pressed') !== 'true';
  $(this).attr('aria-pressed', on);
  flip(() => $('#fl-grid .fl-tile').each(function () {
    this.hidden = on && parseInt(this.textContent, 10) % 2 === 1;
  }));
});`,
  }],
  examples: [{ title: 'Two-step form', lang: 'js', code: `
const state = $.Flip.getState('.card');
$('#grid').toggleClass('list');                 // any DOM change
await $.Flip.from(state, { duration: .6, ease: 'power2.inOut', stagger: .03 });` }],
  api: ['jskjs.flip.js'],
  from: [{ lib: 'GSAP', note: '<code>Flip.getState()</code> / <code>Flip.from()</code> keep their names under <code>$.Flip</code>. The extra <code>.flip(change)</code> shorthand records, changes and plays in one call.' }],
  related: ['scroll-trigger', 'stagger', 'list-rendering'],
},

{
  slug: 'draggable', mod: 'motion', plugins: ['drag'], title: 'Draggable',
  seo: 'Draggable Elements: Pointer, Touch and Keyboard Dragging with Bounds and Snap',
  desc: 'Make elements draggable with mouse, touch and keyboard using the jskjs.drag.js add-on. Axis locking, bounds, snapping, inertia, hit testing and callbacks. Live demo.',
  lede: '<code>$(\'.card\').draggable({ bounds: \'#board\', inertia: true })</code>. Works with mouse, touch and pen, and with the arrow keys for keyboard users.',
  body: `
<h2>Pointer events, transforms, keyboard</h2>
<p>The add-on listens to Pointer Events, so one code path covers mouse, touch and pen. Elements move with <code>transform</code> (or <code>left/top</code> with <code>type: 'left,top'</code>), constrained by <code>bounds</code> — an element, a selector or a <code>{ minX, maxX, minY, maxY }</code> box.</p>
<p>Focusable draggables respond to the arrow keys (Shift for bigger steps), so the same control works without a pointer. <code>snap</code> takes a step size, an array of values or a function. <code>$.Draggable.hitTest(a, b)</code> tells you when two elements overlap.</p>`,
  css: `
.dr-track { position:relative; height:44px; border-radius:99px; background:var(--surface-2); border:1px solid var(--line); max-width:440px; }
.dr-knob { position:absolute; top:2px; left:2px; width:38px; height:38px; border-radius:50%; background:var(--motion); cursor:grab; touch-action:none; }
.dr-board { position:relative; height:220px; border-radius:14px; background:var(--surface-2); border:1px dashed var(--line); margin-top:16px; }
.dr-card { position:absolute; left:16px; top:16px; padding:12px 16px; border-radius:12px; background:var(--surface); border:1px solid var(--line); box-shadow:var(--shadow); cursor:grab; touch-action:none; font-weight:700; }
.dr-bin { position:absolute; right:16px; bottom:16px; padding:18px; border-radius:12px; border:2px dashed var(--line); color:var(--muted); }
.dr-bin.hot { border-color:var(--motion); color:var(--text); }`,
  demos: [{
    title: 'A snapping slider and a card with a drop target',
    html: `
<label id="dr-label" for="dr-knob">Volume: <b id="dr-val">0</b></label>
<div id="dr-track" class="dr-track" style="margin-top:8px"><div id="dr-knob" class="dr-knob" tabindex="0" role="slider" aria-labelledby="dr-label" aria-valuemin="0" aria-valuemax="10" aria-valuenow="0"></div></div>
<div id="dr-board" class="dr-board">
  <div id="dr-card" class="dr-card" tabindex="0">Drag me (or use arrow keys)</div>
  <div id="dr-bin" class="dr-bin">Drop zone</div>
</div>`,
    js: `
const track = $('#dr-track')[0];
$.Draggable.create('#dr-knob', {
  type: 'x', bounds: '#dr-track',
  snap: v => Math.round(v / ((track.clientWidth - 42) / 10)) * ((track.clientWidth - 42) / 10),
  onDrag() { show(this.x); }, onDragEnd() { show(this.x); }
});
function show(x) {
  const v = Math.round(x / ((track.clientWidth - 42) / 10));
  $('#dr-val').text(v);
  $('#dr-knob').attr('aria-valuenow', v);
}

$('#dr-card').draggable({
  bounds: '#dr-board', inertia: true,
  onDrag() { $('#dr-bin').toggleClass('hot', $.Draggable.hitTest('#dr-card', '#dr-bin')); },
  onDragEnd() {
    const hit = $.Draggable.hitTest('#dr-card', '#dr-bin');
    $('#dr-bin').toggleClass('hot', hit).text(hit ? 'Dropped ✓' : 'Drop zone');
  }
});`,
  }],
  examples: [{ title: 'Options at a glance', lang: 'js', code: `
$.Draggable.create('.knob', {
  type: 'x',                      // 'x', 'y', 'x,y' (default) or 'left,top'
  bounds: '.track',               // element, selector or { minX, maxX, minY, maxY }
  snap: 20,                       // step, array of values, or function
  inertia: true,                  // glide after release
  onPress() {}, onDrag() {}, onDragEnd() {}, onRelease() {}
});` }],
  api: ['jskjs.drag.js'],
  from: [{ lib: 'GSAP', note: '<code>Draggable.create()</code> → <code>$.Draggable.create()</code>, same options and callbacks (<code>this.x</code>, <code>this.y</code> inside them). <code>inertia</code> doesn\'t need a separate InertiaPlugin.' }, { lib: 'jQuery UI', note: '<code>.draggable({ containment })</code> → <code>.draggable({ bounds })</code>.' }],
  related: ['flip', 'transforms', 'ui-directives'],
},

{
  slug: 'split-text', mod: 'motion', plugins: ['split'], title: 'Split text',
  seo: 'SplitText-style Text Animation: Split into Lines, Words and Characters',
  desc: 'Split headings into lines, words and characters for staggered text animation with the jskjs.split.js add-on. Masks, nested markup and screen-reader-friendly output. Live demo.',
  lede: '<code>$.splitText(\'h1\', { type: \'words,chars\' })</code> wraps every word and letter so you can stagger them — and <code>revert()</code> puts the original markup back.',
  body: `
<h2>Accessible by default</h2>
<p>Splitting text into hundreds of spans would make a screen reader spell words out letter by letter. The add-on sets <code>aria-label</code> on the element to the original text and hides the pieces with <code>aria-hidden</code>, so assistive technology still reads one sentence.</p>
<p><code>type</code> is any of <code>lines</code>, <code>words</code>, <code>chars</code>. <code>mask: 'lines'</code> (or <code>'words'</code>) wraps each piece in an overflow-clipped box, so text can slide up from behind an invisible edge. Nested markup like <code>&lt;b&gt;</code> and links is preserved.</p>`,
  css: `
.sp-head { font:800 clamp(28px, 5vw, 46px)/1.1 var(--display, inherit); letter-spacing:-0.02em; margin:0 0 14px; }
.sp-head em { color:var(--motion); font-style:normal; }`,
  demos: [{
    title: 'Animate a headline by characters, words or lines',
    html: `
<p id="sp-head" class="sp-head">Write less, <em>ship more</em>, keep the web fast.</p>
<div class="row">
  <button type="button" data-split="chars">By characters</button>
  <button type="button" data-split="words">By words</button>
  <button type="button" data-split="lines">By lines</button>
</div>
<pre class="out" id="sp-out"></pre>`,
    js: `
let split = null;
$('[data-split]').on('click', async function () {
  const type = this.dataset.split;
  if (split) split.revert();
  split = $.splitText('#sp-head', { type: type === 'chars' ? 'words,chars' : type, mask: type === 'chars' ? 'words' : type });
  const parts = split[type];
  $('#sp-out').text(parts.length + ' ' + type + " — $.from(split." + type + ", { yPercent: 110, stagger: " + (type === 'chars' ? 0.02 : 0.08) + ' })');
  await $.from(parts, { yPercent: 110, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: type === 'chars' ? 0.02 : 0.08 });
});`,
  }],
  examples: [{ title: 'Scroll-triggered heading reveal (with the scroll add-on)', lang: 'js', code: `
$('h2.reveal').each(function () {
  const split = $.splitText(this, { type: 'lines', mask: 'lines' });
  $.from(split.lines, { yPercent: 100, stagger: .1, duration: .7, ease: 'power3.out',
    scrollTrigger: { trigger: this, start: 'top 85%' } });
});` }],
  api: ['jskjs.split.js', 'stagger'],
  from: [{ lib: 'GSAP', note: '<code>new SplitText(el, { type })</code> → <code>$.splitText(el, { type })</code>, with the same <code>chars</code>, <code>words</code>, <code>lines</code> arrays and <code>revert()</code>.' }],
  related: ['stagger', 'scroll-trigger', 'easings'],
},

{
  slug: 'playback-control', mod: 'motion', title: 'Playback control',
  seo: 'Control Tweens and Timelines: pause, reverse, seek, progress, timeScale, repeat and yoyo',
  desc: 'Every jsKjs tween and timeline is a controllable object: play, pause, reverse, seek to a label, scrub progress, change speed, repeat and yoyo. Interactive demo with a scrubber.',
  lede: 'A tween isn\'t fire-and-forget. Keep the object and you can <code>pause()</code>, <code>reverse()</code>, <code>seek(\'label\')</code>, drag its <code>progress()</code> or slow it down with <code>timeScale(0.25)</code>.',
  body: `
<h2>One control surface for tweens and timelines</h2>
<p><code>$.to()</code>, <code>$.from()</code>, <code>$.fromTo()</code> and <code>$.timeline()</code> all return an object with the same methods: <code>play</code>, <code>pause</code>, <code>resume</code>, <code>reverse</code>, <code>restart</code>, <code>seek</code>, <code>progress</code>, <code>time</code>, <code>duration</code>, <code>timeScale</code>, <code>repeat</code>, <code>yoyo</code> and <code>kill</code>. Each is a getter when called without arguments.</p>
<p>They are also thenables, so <code>await tl</code> waits for the end. <code>$.killTweensOf(el)</code> stops everything on an element, and jsKjs does that for you when the element is removed.</p>`,
  css: `
.pc-lane { position:relative; height:64px; border-radius:12px; background:var(--surface-2); margin-top:14px; overflow:hidden; }
.pc-dot { position:absolute; top:12px; left:12px; width:40px; height:40px; border-radius:10px; background:var(--motion); }`,
  demos: [{
    title: 'Drive a timeline by hand',
    html: `
<div class="row">
  <button type="button" data-pc="play">Play</button><button type="button" data-pc="pause">Pause</button>
  <button type="button" data-pc="reverse">Reverse</button><button type="button" data-pc="restart">Restart</button>
  <button type="button" data-pc="seek">Seek to "spin"</button>
</div>
<div class="row" style="margin-top:10px">
  <div class="field" style="min-width:220px"><label for="pc-prog">Progress: <span id="pc-prog-v">0%</span></label><input id="pc-prog" type="range" min="0" max="1" step="0.001" value="0"></div>
  <div class="field" style="min-width:180px"><label for="pc-speed">Speed: <span id="pc-speed-v">1×</span></label><input id="pc-speed" type="range" min="0.25" max="3" step="0.25" value="1"></div>
  <label style="align-self:end"><input type="checkbox" id="pc-yoyo"> repeat + yoyo</label>
</div>
<div class="pc-lane"><div id="pc-dot" class="pc-dot"></div></div>`,
    js: `
const lane = () => $('#pc-dot').parent().width() - 64;
const tl = $.timeline({ paused: true, onUpdate() {
  $('#pc-prog').val(tl.progress());
  $('#pc-prog-v').text(Math.round(tl.progress() * 100) + '%');
} })
  .to('#pc-dot', { x: () => lane() / 2, duration: 1, ease: 'power2.out' })
  .addLabel('spin')
  .to('#pc-dot', { rotate: 360, borderRadius: '50%', duration: .8, ease: 'back.inOut' })
  .to('#pc-dot', { x: lane, duration: 1, ease: 'power2.in' });

$('[data-pc]').on('click', function () {
  const cmd = this.dataset.pc;
  if (cmd === 'seek') tl.seek('spin').play(); else tl[cmd]();
});
$('#pc-prog').on('input', function () { tl.pause().progress(+this.value); });
$('#pc-speed').on('input', function () { tl.timeScale(+this.value); $('#pc-speed-v').text(this.value + '×'); });
$('#pc-yoyo').on('change', function () { tl.repeat(this.checked ? -1 : 0).yoyo(this.checked); if (this.checked) tl.play(); });`,
  }],
  examples: [{ title: 'Hover animation that reverses cleanly', lang: 'js', code: `
$('.card').each(function () {
  const t = $.to(this, { y: -6, scale: 1.02, duration: .25, paused: true });
  $(this).on('mouseenter', () => t.play()).on('mouseleave', () => t.reverse());
});` }],
  api: ['Tween control', '$.timeline()'],
  from: [{ lib: 'GSAP', note: 'The control methods have the same names and getter/setter behaviour as GSAP 3 — <code>tl.progress(0.5)</code>, <code>tl.timeScale(2)</code>, <code>tl.seek(\'label\')</code>.' }],
  related: ['timelines', 'tweens', 'scroll-trigger'],
},

/* ------------------------------------------------------------------ PULSE */
{
  slug: 'list-rendering', mod: 'pulse', title: 'Lists, conditionals and teleport',
  seo: 'kj-for, kj-if and kj-teleport: Keyed List Rendering in HTML (Alpine-style)',
  desc: 'Render keyed lists with kj-for, add and remove whole elements with kj-if, and move a template elsewhere in the page with kj-teleport. Interactive to-do demo.',
  lede: '<code>&lt;template kj-for="todo in todos" :key="todo.id"&gt;</code> renders one element per item and, with a key, moves existing nodes instead of rebuilding them.',
  body: `
<h2>Keyed lists</h2>
<p><code>kj-for</code> goes on a <code>&lt;template&gt;</code> with exactly one root element. It accepts <code>item in items</code>, <code>(item, index) in items</code>, objects (<code>(value, key) in obj</code>) and ranges (<code>i in 5</code>). Add <code>:key</code> so reordering moves DOM nodes — inputs keep their focus and typed text.</p>
<h2>kj-if and kj-teleport</h2>
<p><code>kj-if</code> adds or removes its template's element entirely (unlike <code>kj-show</code>, which only hides it). <code>kj-teleport="body"</code> renders a template somewhere else — useful for modals that must escape an <code>overflow: hidden</code> parent — while keeping the component's state and event handlers.</p>`,
  css: `
.lr-list { list-style:none; padding:0; margin:12px 0 0; display:grid; gap:6px; }
.lr-list li { display:flex; gap:10px; align-items:center; padding:8px 12px; border:1px solid var(--line); border-radius:10px; background:var(--surface); }
.lr-list li.done span { text-decoration:line-through; color:var(--muted); }
.lr-list li button { margin-left:auto; }
.lr-modal { position:fixed; inset:0; display:grid; place-items:center; background:rgba(0,0,0,.45); z-index:200; }
.lr-modal > div { background:var(--surface); color:var(--text); padding:22px; border-radius:16px; max-width:360px; box-shadow:var(--shadow); }`,
  demos: [{
    title: 'Keyed to-do list with a teleported dialog',
    html: `
<div kj-data="{ next: 4, draft: '', confirm: false,
  todos: [{ id: 1, text: 'Read the docs', done: true }, { id: 2, text: 'Try a demo', done: false }, { id: 3, text: 'Ship it', done: false }] }">
  <form class="row" @submit.prevent="if (draft.trim()) { todos.push({ id: next++, text: draft.trim(), done: false }); draft = '' }">
    <div class="field" style="flex:1"><label for="lr-new">New item</label><input id="lr-new" kj-model="draft" placeholder="Something to do"></div>
    <button style="align-self:end">Add</button>
    <button type="button" style="align-self:end" @click="todos.reverse()">Reverse</button>
  </form>
  <ul class="lr-list">
    <template kj-for="todo in todos" :key="todo.id">
      <li :class="{ done: todo.done }">
        <input type="checkbox" kj-model="todo.done" :aria-label="'Done: ' + todo.text">
        <span kj-text="todo.text"></span>
        <button type="button" @click="todos = todos.filter(t => t !== todo)" :aria-label="'Remove ' + todo.text">✕</button>
      </li>
    </template>
  </ul>
  <template kj-if="todos.length === 0"><p class="muted">Nothing left — nice.</p></template>
  <p class="row" style="margin-top:12px"><span class="muted" kj-text="todos.filter(t => t.done).length + ' of ' + todos.length + ' done'"></span>
    <button type="button" @click="confirm = true" :disabled="!todos.some(t => t.done)">Clear done…</button></p>
  <template kj-teleport="body">
    <div class="lr-modal" kj-show="confirm" @keydown.escape.window="confirm = false" role="dialog" aria-modal="true" aria-label="Clear completed items">
      <div><p style="margin-top:0">Remove <b kj-text="todos.filter(t => t.done).length"></b> completed items?</p>
        <div class="row"><button type="button" @click="todos = todos.filter(t => !t.done); confirm = false">Remove</button>
        <button type="button" @click="confirm = false">Cancel</button></div></div>
    </div>
  </template>
</div>`,
  }],
  examples: [{ title: 'Index, objects and ranges', lang: 'html', code: `
<template kj-for="(user, i) in users" :key="user.id"><li kj-text="(i + 1) + '. ' + user.name"></li></template>
<template kj-for="(value, key) in settings"><dt kj-text="key"></dt></template>
<template kj-for="n in 5"><span>★</span></template>` }],
  api: ['kj-if / kj-for', 'kj-model', 'kj-data'],
  from: [{ lib: 'Alpine.js', note: '<code>x-for</code>, <code>x-if</code> and <code>x-teleport</code> work as <code>kj-for</code>, <code>kj-if</code> and <code>kj-teleport</code> — and the <code>x-</code> spellings are accepted too.' }],
  related: ['conditional-display', 'transitions', 'reactive-state'],
},

{
  slug: 'transitions', mod: 'pulse', title: 'Transitions',
  seo: 'kj-transition: Enter and Leave Transitions for kj-show and kj-if (Alpine-style)',
  desc: 'Fade, scale and slide elements in and out when kj-show or kj-if changes, using kj-transition modifiers or your own CSS classes. Live demo with both styles.',
  lede: 'Add <code>kj-transition</code> next to <code>kj-show</code> and the element fades and scales instead of popping. Want full control? Name the classes for each phase.',
  body: `
<h2>Modifiers or classes</h2>
<p>Bare <code>kj-transition</code> gives a short fade + scale. Tune it with modifiers: <code>.opacity</code>, <code>.scale.90</code>, <code>.duration.400ms</code>, <code>.delay.50ms</code>, <code>.origin.top</code>. Use <code>kj-transition:enter.duration.300ms</code> and <code>kj-transition:leave.duration.150ms</code> to make the two directions differ.</p>
<p>For full control, give classes for each phase — <code>kj-transition:enter</code>, <code>:enter-start</code>, <code>:enter-end</code> and the three <code>:leave</code> equivalents — exactly like Alpine, which also makes Tailwind transition classes work as-is. jsKjs waits for the CSS transition to finish before hiding the element.</p>`,
  css: `
.tr-panel { margin-top:12px; padding:16px; border-radius:12px; background:var(--surface-2); border:1px solid var(--line); }
.tr-enter, .tr-leave { transition: opacity .35s ease, transform .35s cubic-bezier(.2,.8,.2,1); }
.tr-from { opacity:0; transform: translateY(-12px) rotate(-2deg); }
.tr-to { opacity:1; transform: none; }`,
  demos: [{
    title: 'Modifier and class-based transitions',
    html: `
<div kj-data="{ a: true, b: true }" class="grid g2" style="gap:16px">
  <div>
    <button type="button" @click="a = !a" :aria-expanded="a">Toggle (modifiers)</button>
    <div class="tr-panel" kj-show="a" kj-transition.scale.90.origin.top.duration.250ms>
      <code>kj-transition.scale.90.origin.top.duration.250ms</code>
    </div>
  </div>
  <div>
    <button type="button" @click="b = !b" :aria-expanded="b">Toggle (classes)</button>
    <div class="tr-panel" kj-show="b"
      kj-transition:enter="tr-enter" kj-transition:enter-start="tr-from" kj-transition:enter-end="tr-to"
      kj-transition:leave="tr-leave" kj-transition:leave-start="tr-to" kj-transition:leave-end="tr-from">
      Six classes, one per phase — Tailwind classes work the same way.
    </div>
  </div>
</div>`,
  }],
  examples: [{ title: 'Tailwind dropdown', lang: 'html', code: `
<div kj-show="open"
     kj-transition:enter="transition ease-out duration-200" kj-transition:enter-start="opacity-0 -translate-y-1" kj-transition:enter-end="opacity-100 translate-y-0"
     kj-transition:leave="transition ease-in duration-150" kj-transition:leave-start="opacity-100" kj-transition:leave-end="opacity-0">…</div>` }],
  api: ['kj-show', 'kj-if / kj-for'],
  from: [{ lib: 'Alpine.js', note: '<code>x-transition</code> and all of its modifiers and phase classes carry over as <code>kj-transition</code>.' }],
  related: ['conditional-display', 'list-rendering', 'ui-directives'],
},

{
  slug: 'ui-directives', mod: 'pulse', plugins: ['ui'], title: 'UI directives',
  seo: 'Collapse, Persist, Focus Trap, Input Masks, Intersect and Resize Directives',
  desc: 'The jskjs.ui.js add-on brings the Alpine plugins to Pulse: kj-collapse, $persist, kj-trap, kj-mask, $money, kj-intersect and kj-resize. Live demos of each.',
  lede: 'Six small directives that cover the fiddly parts of UI work: height animation to <code>auto</code>, state saved in <code>localStorage</code>, focus trapping, input masks, and visibility and size observers.',
  body: `
<h2>What's in the add-on</h2>
<ul>
<li><code>kj-collapse</code> — animates height to and from <code>auto</code> alongside <code>kj-show</code>.</li>
<li><code>$persist(value)</code> — keeps a <code>kj-data</code> property in <code>localStorage</code> (or <code>.using(sessionStorage)</code>) across reloads.</li>
<li><code>kj-trap</code> — keeps keyboard focus inside an element while the expression is true, and restores it afterwards.</li>
<li><code>kj-mask</code> — formats input as it is typed (<code>9</code> digit, <code>a</code> letter, <code>*</code> anything); <code>kj-mask:dynamic</code> with <code>$money($input)</code> for currency.</li>
<li><code>kj-intersect</code> and <code>kj-resize</code> — run an expression when the element enters the viewport or changes size.</li>
</ul>`,
  css: `
.ui-box { padding:14px; border:1px solid var(--line); border-radius:12px; background:var(--surface-2); }
.ui-box h4 { margin:0 0 8px; font-size:15px; }`,
  demos: [{
    title: 'Collapse, persist, mask and focus trap',
    html: `
<div class="grid g2" style="gap:14px" kj-data="{ open: false, visits: $persist(0).as('kj-demo-visits'), phone: '', price: '', trap: false }" kj-init="visits++">
  <div class="ui-box"><h4>kj-collapse</h4>
    <button type="button" @click="open = !open" :aria-expanded="open">What is jsKjs?</button>
    <div kj-show="open" kj-collapse><p style="margin:10px 0 0">A jQuery-compatible library with htmx, Alpine and GSAP features built in. This panel's height animates to <code>auto</code>.</p></div>
  </div>
  <div class="ui-box"><h4>$persist</h4>
    <p style="margin:0">You've loaded this page <b kj-text="visits"></b> time(s). Reload — the count survives.</p>
    <button type="button" style="margin-top:8px" @click="visits = 0">Reset</button>
  </div>
  <div class="ui-box"><h4>kj-mask</h4>
    <div class="field"><label for="ui-phone">Phone</label><input id="ui-phone" kj-mask="(999) 999-9999" kj-model="phone" inputmode="numeric" placeholder="(555) 123-4567"></div>
    <div class="field"><label for="ui-price">Price</label><input id="ui-price" kj-mask:dynamic="$money($input)" kj-model="price" inputmode="decimal" placeholder="1,234.00"></div>
  </div>
  <div class="ui-box"><h4>kj-trap</h4>
    <button type="button" @click="trap = true">Open trapped panel</button>
    <div kj-show="trap" kj-trap="trap" @keydown.escape="trap = false" style="margin-top:10px" role="group" aria-label="Trapped panel">
      <p style="margin:0 0 6px">Tab cycles inside here. Escape or Close to leave.</p>
      <input aria-label="First field" placeholder="First"> <input aria-label="Second field" placeholder="Second">
      <button type="button" @click="trap = false">Close</button>
    </div>
  </div>
</div>`,
  }],
  examples: [{ title: 'Lazy work with kj-intersect, layout with kj-resize', lang: 'html', code: `
<img kj-intersect.once="$el.src = $el.dataset.src" data-src="/big.jpg" alt="…">
<div kj-data="{ w: 0 }" kj-resize="w = $width"><span kj-text="w > 600 ? 'wide' : 'narrow'"></span></div>` }],
  api: ['jskjs.ui.js', 'Magics'],
  from: [{ lib: 'Alpine.js', note: 'The Persist, Focus, Collapse, Mask, Intersect and Resize plugins are one add-on here. <code>x-collapse</code> → <code>kj-collapse</code>, <code>$persist</code> unchanged, <code>x-trap</code> → <code>kj-trap</code>.' }],
  related: ['transitions', 'reactive-state', 'two-way-binding'],
},

/* ------------------------------------------------------------------ HYPER */
{
  slug: 'server-sent-events', mod: 'hyper', plugins: ['live'], title: 'Server-Sent Events & WebSockets',
  seo: 'Server-Sent Events and WebSockets in HTML: kj-sse-connect, kj-sse-swap, kj-ws-send',
  desc: 'Stream server updates into the page with kj-sse-connect and kj-sse-swap, or talk both ways with kj-ws-connect and kj-ws-send, using the jskjs.live.js add-on. Live PHP demo.',
  lede: 'Point <code>kj-sse-connect</code> at an event stream and every named event can be swapped into the page — no JavaScript, with automatic reconnect.',
  body: `
<h2>Streams as triggers and swaps</h2>
<p>An element with <code>kj-sse-connect="/url"</code> opens an <code>EventSource</code>. Inside it, <code>kj-sse-swap="name"</code> swaps the data of each <code>name</code> event into that element using the usual <code>kj-swap</code> styles, and <code>kj-trigger="sse:name"</code> turns an event into a request trigger.</p>
<p>WebSockets work the same way: <code>kj-ws-connect</code> opens the socket, a form with <code>kj-ws-send</code> sends its fields as JSON, and HTML messages from the server are swapped in by id, like out-of-band swaps. Connections close when the element is removed and reconnect with backoff if they drop.</p>
<p>The demo endpoint below sends five events and then closes, because shared hosting doesn't keep PHP requests open for long. A real stream would keep going.</p>`,
  css: `
.sse-log { list-style:none; margin:10px 0 0; padding:0; display:grid; gap:4px; font:13px var(--mono); }
.sse-log li { padding:6px 10px; border-radius:8px; background:var(--surface-2); }`,
  demos: [{
    title: 'A live activity feed from /api/stream.php',
    html: `
<div class="row"><button type="button" id="sse-start">Connect</button><button type="button" id="sse-stop" disabled>Disconnect</button></div>
<div id="sse-box"></div>
<p class="muted" id="sse-status" aria-live="polite">Not connected.</p>`,
    js: `
$('#sse-start').on('click', () => {
  $('#sse-box').html(
    '<div kj-sse-connect="/api/stream.php" kj-sse-close="done">' +
    '  <p class="muted" style="margin:8px 0 0">Events: <b kj-sse-swap="count">0</b> · <span kj-sse-swap="done">streaming…</span></p>' +
    '  <ul class="sse-log" kj-sse-swap="message" kj-swap="afterbegin"></ul>' +
    '</div>');
  $.process('#sse-box');
  $('#sse-status').text('Connecting…');
  $('#sse-start').prop('disabled', true); $('#sse-stop').prop('disabled', false);
});
$('#sse-stop').on('click', () => {
  $('#sse-box').empty();                       // removing the element closes the stream
  $('#sse-status').text('Disconnected.');
  $('#sse-start').prop('disabled', false); $('#sse-stop').prop('disabled', true);
});
$(document).on('kj:sseOpen', () => $('#sse-status').text('Connected — one event a second.'));
$(document).on('kj:sseClose', () => { $('#sse-status').text('Stream finished.'); $('#sse-start').prop('disabled', false); $('#sse-stop').prop('disabled', true); });`,
  }],
  examples: [
    { title: 'SSE, declaratively', lang: 'html', code: `
<div kj-sse-connect="/events">
  <ul kj-sse-swap="message" kj-swap="beforeend"></ul>
  <div kj-get="/cart" kj-trigger="sse:cart-changed"></div>
</div>` },
    { title: 'A PHP event stream', lang: 'php', code: `
<?php
header('Content-Type: text/event-stream');
while (true) {
  echo "event: message\\n";
  echo "data: <li>" . date('H:i:s') . "</li>\\n\\n";
  flush(); sleep(1);
}` },
    { title: 'WebSocket chat', lang: 'html', code: `
<div kj-ws-connect="wss://example.com/chat">
  <div id="messages"></div>
  <form kj-ws-send><input name="text"><button>Send</button></form>
</div>` },
  ],
  api: ['jskjs.live.js', 'kj-swap', 'kj-trigger'],
  from: [{ lib: 'htmx', note: 'The <code>sse</code> and <code>ws</code> extensions: <code>sse-connect</code> / <code>sse-swap</code> / <code>ws-connect</code> / <code>ws-send</code> become <code>kj-sse-connect</code> / <code>kj-sse-swap</code> / <code>kj-ws-connect</code> / <code>kj-ws-send</code>. No <code>hx-ext</code> needed — loading the add-on enables them.' }],
  related: ['polling', 'targets-and-swaps', 'boost-and-oob'],
},

{
  slug: 'boost-and-oob', mod: 'hyper', title: 'Boost & out-of-band swaps',
  seo: 'kj-boost and kj-swap-oob: AJAX Links and Updating Several Places from One Response',
  desc: 'Turn ordinary links and forms into AJAX with kj-boost, and update several parts of the page from one response with kj-swap-oob. Live PHP demo of a cart with an out-of-band badge.',
  lede: 'One response, many updates: the main content goes to the target, and anything marked <code>kj-swap-oob</code> replaces the element with the same id elsewhere on the page.',
  body: `
<h2>kj-boost</h2>
<p>Put <code>kj-boost="true"</code> on a container and its links and forms become AJAX requests that swap into <code>body</code> (or the inherited <code>kj-target</code>) and push the URL to history. Without JavaScript they still work as normal links — progressive enhancement for free.</p>
<h2>Out-of-band swaps</h2>
<p>Any top-level element in a response with <code>kj-swap-oob="true"</code> is pulled out and swapped into the element with the same <code>id</code>. Use a swap style (<code>kj-swap-oob="beforeend:#log"</code>) to append instead of replace. <code>kj-select-oob</code> does the same from the requesting side, and <code>$.hyper.oob(html)</code> runs it from JavaScript.</p>`,
  css: `
.badge { display:inline-grid; place-items:center; min-width:26px; height:26px; padding:0 8px; border-radius:99px; background:var(--hyper); color:#fff; font:700 13px var(--mono); }
.oob-cart { list-style:none; padding:0; margin:10px 0 0; display:grid; gap:4px; }
.oob-cart li { padding:6px 10px; border-radius:8px; background:var(--surface-2); }
.bo-panel { margin-top:10px; padding:14px; border-radius:12px; border:1px solid var(--line); background:var(--surface-2); min-height:84px; }`,
  demos: [
    {
      title: 'Add to cart — the badge updates out of band',
      html: `
<div class="row">
  <button kj-post="/api/oob.php" kj-vals='js:{ item: "mug", n: +document.getElementById("oob-count").textContent }' kj-target="#oob-cart" kj-swap="beforeend">Add mug</button>
  <button kj-post="/api/oob.php" kj-vals='js:{ item: "tee", n: +document.getElementById("oob-count").textContent }' kj-target="#oob-cart" kj-swap="beforeend">Add tee</button>
  <button kj-post="/api/oob.php" kj-vals='js:{ item: "cap", n: +document.getElementById("oob-count").textContent }' kj-target="#oob-cart" kj-swap="beforeend">Add cap</button>
  <span>Cart <span id="oob-count" class="badge">0</span></span>
</div>
<ul id="oob-cart" class="oob-cart" aria-live="polite"></ul>
<p id="oob-status" class="muted">The response is one line item plus two out-of-band elements.</p>`,
    },
    {
      title: 'Boosted links (without history, for the demo)',
      html: `
<nav class="row" kj-boost="true" kj-target="#bo-panel" kj-push-url="false" aria-label="Boosted tabs">
  <a class="btn" href="/api/tab.php?tab=core">Core</a>
  <a class="btn" href="/api/tab.php?tab=hyper">Hyper</a>
  <a class="btn" href="/api/tab.php?tab=pulse">Pulse</a>
  <a class="btn" href="/api/tab.php?tab=motion">Motion</a>
</nav>
<div id="bo-panel" class="bo-panel" aria-live="polite"><p class="muted" style="margin:0">Plain links — boosted into AJAX. Without JavaScript they would simply navigate.</p></div>`,
    },
  ],
  examples: [{ title: 'Server response with OOB elements', lang: 'html', code: `
<!-- swapped into the request's target -->
<li>Mug — $12</li>
<!-- swapped by id, anywhere on the page -->
<span id="cart-count" kj-swap-oob="true">4</span>
<div kj-swap-oob="beforeend:#toasts"><p>Added to cart</p></div>` }],
  api: ['kj-swap', 'kj-select', '$.hyper'],
  from: [{ lib: 'htmx', note: '<code>hx-boost</code>, <code>hx-swap-oob</code> and <code>hx-select-oob</code> behave the same as <code>kj-boost</code>, <code>kj-swap-oob</code> and <code>kj-select-oob</code>; responses written for htmx (with <code>hx-swap-oob</code>) also work.' }],
  related: ['targets-and-swaps', 'push-url', 'server-sent-events'],
},
];
