/* Honest, line-by-line comparisons. status: yes | partial | no */
module.exports = [
{
  slug: 'jquery', lib: 'jQuery', ver: '4.0.0', mod: 'core',
  seo: 'jsKjs vs jQuery 4: API Compatibility, Size and Differences',
  desc: 'jsKjs vs jQuery 4.0: which jQuery APIs are supported, which behave differently, which are missing, and when you should keep using jQuery. Measured sizes and migration notes.',
  lede: 'jsKjs implements the jQuery API most code actually uses — on native browser features — and adds three more modules. Here is exactly where it matches, differs and stops.',
  chooseThem: ['You must support Internet Explorer 11 or other pre-2021 browsers.', 'You depend on jQuery plugins that use internals (<code>$.fx</code>, <code>$.Deferred</code>, ajax prefilters/transports).', 'You rely heavily on the fx queue (<code>.stop()</code>, <code>.delay()</code>, <code>.queue()</code>).'],
  chooseUs: ['You target evergreen browsers and want the jQuery API without the legacy weight.', 'You also need declarative requests, reactive state or real animation — without three more libraries.', 'You want native Promises, <code>fetch</code> and WeakMap-based data by default.'],
  rows: [
    ['$() selectors, context, HTML creation, DOM ready', 'yes', 'Native querySelectorAll; jQuery-only pseudos (:visible, :first) are not CSS.'],
    ['Collection basics: .each .get .eq .first .last .index .add', 'yes', 'Collections are real Arrays; native .map/.slice return plain arrays.'],
    ['.html .text .val', 'yes', '.val() on a checkbox returns a boolean.'],
    ['.attr .removeAttr .prop .data .removeData', 'yes', '.data() parses data-* JSON; storage is a WeakMap.'],
    ['.addClass .removeClass .toggleClass .hasClass .css', 'yes', '.css() also reads and writes custom properties.'],
    ['.width .height .offset .position .scrollTop .scrollLeft', 'partial', 'No .innerWidth/.outerWidth or .offset() setter.'],
    ['.show .hide .toggle', 'yes', ''],
    ['.append .prepend .before .after .appendTo .prependTo .wrap .remove .detach .empty .clone .replaceWith', 'yes', ''],
    ['.wrapAll .wrapInner .unwrap', 'no', ''],
    ['.find .filter .not .is .closest .parent .parents .children .siblings .next .prev', 'yes', '.filter/.not/.is accept selectors, elements or functions.'],
    ['.nextAll .prevAll .nextUntil .prevUntil .parentsUntil .has .contents .end .addBack .slice', 'no', ''],
    ['.on .off .one .trigger, delegation, namespaces, shortcuts, .hover', 'yes', 'Handlers receive the native Event; .trigger takes one payload object.'],
    ['.bind .unbind .live .delegate .die', 'no', 'Removed from modern jQuery too — use .on().'],
    ['$.ajax $.get $.post $.getJSON .load .serialize', 'partial', 'Promise-based (fetch), not jqXHR; callbacks and .done/.fail/.always still work.'],
    ['$.ajaxSetup, prefilters, transports, JSONP, $.getScript, .serializeArray', 'no', ''],
    ['.fadeIn .fadeOut .fadeToggle .slideDown .slideUp .slideToggle .animate', 'yes', 'Same names, milliseconds and callbacks; runs on the Motion engine.'],
    ['.stop .finish .delay .queue .dequeue .fadeTo, $.fx', 'no', 'Use await, timelines or setTimeout.'],
    ['$.Deferred $.Callbacks $.when', 'no', 'Use native Promises.'],
    ['$.each $.map $.extend $.param $.parseHTML $.trim $.isArray $.isFunction $.isPlainObject $.noConflict', 'yes', 'Deep $.extend is prototype-pollution safe.'],
    ['$.grep $.inArray $.merge $.makeArray $.type $.now', 'no', 'Use Array methods and Date.now().'],
    ['$.fn plugins', 'partial', '$.fn is the collection prototype, so plugins built on supported APIs work.'],
    ['Browser support', 'partial', 'jsKjs: evergreen only. jQuery 4: also IE11 and older Safari/Firefox.'],
  ],
  examples: [
    { title: 'Writing a tiny plugin still works', lang: 'js', code: String.raw`
$.fn.highlight = function (color = 'yellow') {
  return this.css('background', color);   // return this to stay chainable
};
$('.match').highlight();` },
  ],
},
{
  slug: 'htmx', lib: 'htmx', ver: '2.0.11', mod: 'hyper',
  seo: 'jsKjs vs htmx: Declarative Requests, Attributes and What Is Missing',
  desc: 'jsKjs Hyper vs htmx 2: attribute-by-attribute mapping (hx-get → kj-get, hx-target → kj-target…), which htmx features are supported, which are not, and when htmx is the better choice.',
  lede: 'Hyper borrows htmx\'s best idea — let HTML describe requests and let the server return HTML — and implements the attributes most pages use. Rename <code>hx-</code> to <code>kj-</code> for the basics.',
  chooseThem: ['You need out-of-band swaps, <code>hx-select</code>, <code>hx-boost</code> or response headers like <code>HX-Trigger</code>/<code>HX-Redirect</code>.', 'You use extensions: SSE, WebSockets, idiomorph, preload.', 'You need request coordination (<code>hx-sync</code>) or rich trigger modifiers.'],
  chooseUs: ['Your hypermedia needs are the common ones: load, submit, search, poll, lazy-load, delete.', 'You also want a jQuery API, client-side state and animation in the same tiny file.'],
  rows: [
    ['hx-get / hx-post / hx-put / hx-patch / hx-delete', 'yes', 'kj-get … kj-delete. Urlencoded bodies; multipart when a form has file inputs.'],
    ['hx-target (CSS selector)', 'yes', 'kj-target. Extended targets (this, closest, next, previous, find) are not supported.'],
    ['hx-swap: innerHTML, outerHTML, beforebegin, afterbegin, beforeend, afterend, none', 'yes', 'kj-swap, plus textContent. No delete swap.'],
    ['hx-swap modifiers (swap:, settle:, scroll:, show:, transition:)', 'no', ''],
    ['hx-trigger: events, delay:, load, revealed, every Ns', 'yes', 'kj-trigger.'],
    ['hx-trigger: multiple events, changed, once, throttle:, from:, intersect, filters', 'no', ''],
    ['hx-confirm', 'yes', 'kj-confirm (native confirm dialog).'],
    ['hx-indicator', 'partial', 'kj-indicator shows/hides the element; no htmx-request class. aria-busy is set automatically.'],
    ['hx-include / hx-vals', 'partial', 'kj-include (selector) and kj-vals (JSON). No js: values.'],
    ['hx-push-url', 'partial', 'kj-push-url; no history cache or automatic restore.'],
    ['Lifecycle events', 'partial', 'kj:before, kj:after, kj:error, kj:load — not cancelable.'],
    ['hx-select, hx-select-oob, hx-swap-oob', 'no', 'Use .load("url #fragment") for fragment selection.'],
    ['hx-boost, hx-replace-url, hx-history, hx-history-elt', 'no', ''],
    ['hx-headers, hx-params, hx-encoding, hx-request, hx-sync, hx-disabled-elt, hx-prompt, hx-preserve, hx-on, hx-ext', 'no', ''],
    ['Request header', 'partial', 'Sends X-Requested-With: jsKjs (not HX-Request / HX-Target).'],
    ['Response headers (HX-Trigger, HX-Redirect, HX-Retarget, HX-Reswap…)', 'no', ''],
    ['Extensions: SSE, WebSockets, morphing, preload', 'no', ''],
    ['Auto-wiring of new content', 'yes', 'MutationObserver; polling stops when its element is removed.'],
  ],
  examples: [
    { title: 'Same page, renamed', lang: 'html', code: String.raw`
<!-- htmx -->
<input name="q" hx-get="/search" hx-trigger="keyup delay:300ms" hx-target="#results">
<!-- jsKjs -->
<input name="q" kj-get="/search" kj-trigger="keyup delay:300ms" kj-target="#results">` },
  ],
},
{
  slug: 'alpine', lib: 'Alpine.js', ver: '3.17.5', mod: 'pulse',
  seo: 'jsKjs vs Alpine.js: kj-data vs x-data, Supported Directives and Gaps',
  desc: 'jsKjs Pulse vs Alpine.js 3: directive mapping (x-data → kj-data, x-model → kj-model…), components and stores, what is missing (x-for, x-if, $watch…), and when Alpine is the better pick.',
  lede: 'Pulse brings Alpine\'s "state in the markup" model to jsKjs: <code>kj-data</code>, <code>kj-text</code>, <code>kj-show</code>, <code>kj-model</code>, <code>@event</code>, <code>:attr</code>, components and stores. It is deliberately smaller than Alpine.',
  chooseThem: ['You need <code>x-for</code> keyed list rendering or <code>x-if</code> templates.', 'You rely on magics (<code>$watch</code>, <code>$dispatch</code>, <code>$refs</code>, <code>$nextTick</code>) or plugins (persist, focus, intersect, collapse).', 'You want <code>x-transition</code> or a CSP-safe build.'],
  chooseUs: ['Your components are toggles, forms, wizards, counters, tabs and carts.', 'You want reactivity plus a jQuery API, hypermedia and animation in one file.'],
  rows: [
    ['x-data (object, init())', 'yes', 'kj-data; init(el) receives the root element.'],
    ['Alpine.data with arguments', 'yes', '$.component(name, factory) + kj-data="name(args)".'],
    ['Alpine.store / $store', 'partial', '$.store(name, data); read as $.store("name") — no $store magic.'],
    ['Alpine.reactive', 'yes', '$.reactive(obj).'],
    ['x-text / x-html', 'yes', 'kj-text / kj-html.'],
    ['x-show', 'yes', 'kj-show.'],
    ['x-model', 'partial', 'kj-model for text, number, range, textarea, select, checkbox, radio. No .number/.lazy/.debounce modifiers.'],
    ['x-on / @ with .prevent .stop and key modifiers', 'partial', '@event / kj-on:event with one modifier: .prevent, .stop, .enter, .escape.'],
    ['@ modifiers .outside .window .document .once .debounce .throttle .self', 'no', ''],
    ['x-bind / : (string values)', 'yes', ':class merges with static classes; false/null removes the attribute.'],
    ['x-bind object syntax for :class / :style', 'no', 'Use string expressions.'],
    ['$el, $event', 'yes', ''],
    ['x-for, x-if', 'no', 'Render lists with kj-html + .map().join("") and $.escape().'],
    ['x-init, x-effect, x-ref / $refs, x-cloak, x-ignore, x-teleport, x-id, x-modelable', 'no', ''],
    ['x-transition', 'no', 'Animate with Motion ($.to / $.from).'],
    ['$watch, $dispatch, $nextTick, $root, $data, $id', 'no', 'Use custom events (.trigger) and setTimeout.'],
    ['Plugins (persist, intersect, focus, collapse, mask, morph, anchor)', 'no', ''],
    ['CSP build', 'no', 'Pulse uses new Function; strict CSP needs unsafe-eval.'],
  ],
  examples: [
    { title: 'Same component, renamed', lang: 'html', code: String.raw`
<!-- Alpine -->
<div x-data="{ open: false }"><button @click="open = !open">Menu</button><ul x-show="open">…</ul></div>
<!-- jsKjs -->
<div kj-data="{ open: false }"><button @click="open = !open">Menu</button><ul kj-show="open">…</ul></div>` },
  ],
},
{
  slug: 'gsap', lib: 'GSAP', ver: '3.15.0', mod: 'motion',
  seo: 'jsKjs vs GSAP: Tweens, Timelines, Easing and When You Need GSAP',
  desc: 'jsKjs Motion vs GSAP 3: what maps across (to, from, fromTo, timelines, stagger, transforms), what does not (repeat, playback control, plugins like ScrollTrigger), and when to choose GSAP.',
  lede: 'Motion gives you the GSAP-style API for everyday UI animation — tweens, transforms, easing, stagger, timelines — in a fraction of the size. GSAP remains the tool for animation-heavy work, and it is now free.',
  chooseThem: ['You need ScrollTrigger, Flip, Draggable, SplitText, MorphSVG or any other plugin (GSAP and all its plugins are free since Webflow\'s 2025 change).', 'You need playback control: pause, reverse, seek, progress, timeScale, repeat and yoyo.', 'You animate colours, SVG attributes, 3D transforms or hundreds of concurrent tweens.'],
  chooseUs: ['Your motion is UI feedback: entrances, hovers, toasts, modals, staggered lists, small sequences.', 'You want it in the same 8.1 KB file as your DOM, requests and state.'],
  rows: [
    ['gsap.to / from / fromTo', 'yes', '$.to / $.from / $.fromTo — return Promises.'],
    ['x, y, rotation/rotate, scale, scaleX, scaleY, skewX, skewY', 'yes', 'Composed into one transform per frame.'],
    ['xPercent, yPercent, z, rotationX/Y, transformOrigin', 'no', 'Set transform-origin in CSS.'],
    ['Numeric CSS properties (opacity, width, margin…)', 'yes', 'Tweens from the computed value; keep units consistent.'],
    ['Colours, SVG attributes, CSS variables', 'no', ''],
    ['duration (s), delay, onComplete', 'yes', ''],
    ['onStart, onUpdate, onRepeat, callbacks with params', 'no', ''],
    ['Eases', 'partial', '10 built-in (power2 family, back.out, elastic.out, bounce.out, CSS-style) + any function.'],
    ['stagger (number)', 'yes', ''],
    ['stagger object (each, amount, from, grid)', 'no', 'Sort the collection or compute per-element delays.'],
    ['gsap.timeline with sequencing, "<" and "+=N"', 'yes', '$.timeline with defaults, paused, play(), onComplete, .add(fn).'],
    ['Labels, absolute positions, "-=N", nesting', 'no', ''],
    ['repeat, yoyo, repeatDelay', 'no', ''],
    ['pause, resume, reverse, seek, progress, timeScale, kill', 'no', ''],
    ['gsap.set, quickTo, utils, matchMedia', 'no', 'Use .css() for set.'],
    ['Overwrite management', 'no', 'Competing tweens on the same property are not cancelled automatically.'],
    ['Plugins (ScrollTrigger, Flip, Draggable, SplitText, MorphSVG, MotionPath, Observer…)', 'no', ''],
  ],
  examples: [
    { title: 'Same intro, renamed', lang: 'js', code: String.raw`
// GSAP
gsap.timeline({ defaults: { duration: .5 } }).from('.hero h1', { y: 30 }).from('.hero p', { y: 30 }, '<');
// jsKjs
$.timeline({ duration: .5 }).from('.hero h1', { y: 30 }).from('.hero p', { y: 30 }, '<');` },
  ],
},
];
