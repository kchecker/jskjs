/* Honest, line-by-line comparisons. status: yes | partial | no. {{TOKENS}} are filled in at build time. */
module.exports = [
{
  slug: 'jquery', lib: 'jQuery', ver: '3.7.1 / 4.0.0', mod: 'core',
  seo: 'jsKjs vs jQuery: Measured Compatibility, Size and Differences',
  desc: 'jsKjs vs jQuery 3.7 and 4.0: jsKjs passes {{JQ_PASS_PCT}} of jQuery\'s own test suite. Every public jQuery function exists; here is exactly where behaviour differs and when to keep jQuery.',
  lede: 'jsKjs implements the whole public jQuery 3.7 API. We measure it with jQuery\'s own QUnit suite: <strong>{{JQ_PASS}}</strong> of the tests that pass with real jQuery also pass with jsKjs ({{JQ_ASSERT_PCT}} of assertions). Here is what is the same, what differs and why.',
  chooseThem: ['You must support Internet Explorer 11 or browsers older than 2021.', 'You run XML-heavy code that relies on Sizzle quirks (namespaced selectors in XML documents).', 'You need jQuery\'s exact expando-on-the-node data storage (some debugging tools read it).'],
  chooseUs: ['You target evergreen browsers and want the jQuery API you know, on native selectors and modern DOM.', 'You also want declarative requests, reactive state and real animation — without three more libraries.', 'You want one file with a measured, published compatibility score.'],
  rows: [
    ['$() — selectors, context, HTML creation, $(fn), $(element), $(window)', 'yes', 'Native querySelectorAll first; jQuery\'s extensions (:visible, :contains(), :first, :eq(), :input, [a!=b], leading > + ~, custom $.expr.pseudos) through a small engine.'],
    ['Collection API (.each .map .get .eq .slice .end .addBack .index .add .uniqueSort…)', 'yes', 'Collections are a real Array subclass, so for…of, spread and native Array methods also work.'],
    ['Attributes: .attr .prop .val .removeAttr .removeProp + attr/prop/val hooks', 'yes', 'Same hooks objects: $.attrHooks, $.propHooks, $.valHooks.'],
    ['Classes and CSS: .addClass … .css, $.css, $.style, $.cssHooks, $.cssNumber', 'yes', 'Relative values (+=10), custom properties, array getters.'],
    ['Data: .data .removeData $.data $.hasData $._data', 'yes', 'Stored in WeakMaps — nothing is written onto your elements.'],
    ['Dimensions & offsets: .width/.height/.innerWidth/.outerWidth(true), .offset() get/set, .position, .scrollTop', 'yes', ''],
    ['Manipulation: .append … .wrapAll .wrapInner .unwrap .replaceAll .detach .clone(true, true)', 'yes', 'Scripts in inserted HTML execute, as in jQuery.'],
    ['Traversal: .find .filter .not .is .has .closest .parentsUntil .nextUntil .contents …', 'yes', 'Positional selectors follow Sizzle\'s semantics.'],
    ['Events: .on .off .one .trigger .triggerHandler, delegation, namespaces, $.Event, $.event.special', 'yes', 'jQuery\'s dispatcher: one native listener per element and type, jQuery.Event objects.'],
    ['Deprecated event API: .bind .unbind .delegate .undelegate .hover + shortcuts', 'yes', '.live() and .die() were removed in jQuery 1.9 and are not included.'],
    ['$.ajax, jqXHR, $.get/$.post/$.getJSON/$.getScript, .load(), $.ajaxSetup, prefilters, transports, converters, JSONP', 'yes', 'XMLHttpRequest underneath, like jQuery; sync requests work. Hyper uses fetch.'],
    ['$.Deferred, $.Callbacks, $.when, .promise()', 'yes', 'Promises/A+ .then plus .done/.fail/.progress/.pipe.'],
    ['Effects: .animate, .stop, .finish, .delay, .queue, fades, slides, $.fx, $.Tween, $.Animation, $.easing', 'yes', 'jQuery\'s engine; easing names also accept GSAP and CSS eases.'],
    ['Utilities: $.each $.map $.extend $.grep $.merge $.param $.parseHTML $.parseXML … plus jQuery 3\'s deprecated ones', 'yes', '$.trim, $.isArray, $.type, $.proxy, $.holdReady… kept so older plugins run.'],
    ['$.fn plugins', 'yes', '$.fn.jquery reports "3.7.1", so plugins that check the version accept jsKjs.'],
    ['Browser support', 'partial', 'jsKjs: evergreen browsers (2022+). jQuery 3: IE9+.'],
  ],
  examples: [
    { title: 'Writing a tiny plugin still works', lang: 'js', code: String.raw`
$.fn.highlight = function (color = 'yellow') {
  return this.css('background', color);   // return this to stay chainable
};
$('.match').highlight();` },
    { title: 'Run jQuery\'s own test suite against jsKjs', lang: 'bash', code: String.raw`
git clone --branch 3.7.1 https://github.com/jquery/jquery.git
# serve jquery/ with jsKjs as dist/jquery.js — see test/jquery-suite/ in the jsKjs repo
node test/jquery-suite/run.js` },
  ],
},
{
  slug: 'htmx', lib: 'htmx', ver: '2.0', mod: 'hyper',
  seo: 'jsKjs vs htmx 2: Attribute Mapping and Feature Coverage',
  desc: 'jsKjs Hyper vs htmx 2: every hx- attribute has a kj- equivalent (hx-* also works), with swaps, triggers, out-of-band swaps, boost, history, sync and HX-* headers. Here is what differs.',
  lede: 'Hyper implements htmx\'s model and attributes: write <code>kj-get</code> (or keep <code>hx-get</code> — both work), swap HTML from the server, and drive behaviour with the same response headers.',
  chooseThem: ['You rely on htmx extensions beyond SSE and WebSockets (idiomorph, preload, response-targets…).', 'You want htmx\'s exact event names (<code>htmx:afterSwap</code>) — jsKjs fires <code>kj:afterSwap</code>.'],
  chooseUs: ['You want htmx-style hypermedia plus a jQuery API, client state and animation in one file.', 'You are migrating gradually: <code>hx-*</code> attributes keep working while you rename.'],
  rows: [
    ['hx-get / post / put / patch / delete', 'yes', 'kj-get … (hx-* accepted). Form values for non-GET; params in the query for GET and DELETE.'],
    ['hx-target with extended selectors (this, closest, find, next, previous)', 'yes', ''],
    ['hx-swap styles incl. delete and none, plus textContent', 'yes', ''],
    ['hx-swap modifiers: swap:, settle:, scroll:, show:, focus-scroll:, transition:, ignoreTitle:', 'yes', 'transition:true uses the View Transitions API.'],
    ['hx-trigger: multiple events, [filters], once, changed, delay:, throttle:, from:, target:, consume, queue:, load, revealed, intersect, every', 'yes', ''],
    ['hx-select, hx-select-oob, hx-swap-oob, hx-preserve', 'yes', ''],
    ['hx-boost, hx-push-url, hx-replace-url, history cache, hx-history-elt, hx-history="false"', 'yes', 'Snapshots cached in sessionStorage; misses re-fetch with HX-History-Restore-Request.'],
    ['hx-confirm, hx-prompt, hx-indicator, hx-disabled-elt, hx-sync, hx-include, hx-vals (incl. js:), hx-headers, hx-params, hx-encoding, hx-request, hx-validate, hx-disinherit', 'yes', 'Attribute inheritance works as in htmx.'],
    ['Request headers (HX-Request, HX-Trigger, HX-Target, HX-Current-URL, HX-Boosted, HX-Prompt)', 'yes', ''],
    ['Response headers (HX-Redirect, HX-Location, HX-Refresh, HX-Retarget, HX-Reswap, HX-Reselect, HX-Trigger*, HX-Push-Url, HX-Replace-Url), 204 and 286', 'yes', 'KJ-* names are accepted too.'],
    ['Events (configRequest, beforeRequest, afterRequest, beforeSwap, afterSwap, afterSettle, load, confirm…)', 'yes', 'Named kj:config, kj:before, kj:after, kj:beforeSwap… — cancelable where htmx\'s are.'],
    ['hx-on', 'yes', 'kj-on:event / @event, and hx-on:event.'],
    ['SSE and WebSockets extensions', 'yes', 'Add-on: jskjs.live.js (kj-sse-connect, kj-sse-swap, kj-ws-connect, kj-ws-send).'],
    ['Other extensions (idiomorph, preload, response-targets…), hx-ext', 'no', 'Custom swap styles: $.hyper.defineSwap(name, fn).'],
  ],
  examples: [
    { title: 'The same htmx page in jsKjs', lang: 'html', code: String.raw`
<!-- htmx -->
<input name="q" hx-get="/search" hx-trigger="input changed delay:300ms" hx-target="#results">
<!-- jsKjs (hx-get also works unchanged) -->
<input name="q" kj-get="/search" kj-trigger="input changed delay:300ms" kj-target="#results">` },
  ],
},
{
  slug: 'alpine', lib: 'Alpine.js', ver: '3.x', mod: 'pulse',
  seo: 'jsKjs vs Alpine.js 3: Directive Mapping and Feature Coverage',
  desc: 'jsKjs Pulse vs Alpine.js 3: every core directive and magic (x-for, x-if, x-transition, $watch, $refs, $store…) plus persist, intersect, focus, collapse, mask and resize. x-* attributes work as-is.',
  lede: 'Pulse brings Alpine\'s "state in the markup" model with fine-grained reactivity. Use <code>kj-*</code> attributes or keep Alpine\'s <code>x-*</code> ones — both are read.',
  chooseThem: ['You need Alpine\'s CSP build (Pulse evaluates expressions with <code>new Function</code>, so strict CSP needs <code>unsafe-eval</code>).', 'You use x-modelable, Morph, Anchor or Sort.'],
  chooseUs: ['You want reactive components plus a jQuery API, hypermedia and animation in one file.', 'You already write Alpine markup: it runs unchanged.'],
  rows: [
    ['x-data (objects, Alpine.data components with arguments, init(), destroy())', 'yes', 'kj-data; $.component(name, factory).'],
    ['x-text, x-html, x-show (+ .important), x-bind / : (object syntax for class and style), x-on / @', 'yes', ''],
    ['x-model with .lazy .number .trim .boolean .debounce .throttle .fill; checkbox arrays, radios, multi-select', 'yes', ''],
    ['@ modifiers: .prevent .stop .self .once .outside .window .document .passive .capture .debounce .throttle .camel .dot + key and system-key modifiers', 'yes', ''],
    ['x-for (keyed, objects, ranges, destructuring), x-if, x-teleport', 'yes', ''],
    ['x-init, x-effect, x-ref, x-cloak, x-ignore, x-id', 'yes', ''],
    ['x-transition (modifier and class syntax)', 'yes', ''],
    ['Magics: $el $refs $root $data $store $dispatch $watch $nextTick $id', 'yes', ''],
    ['Alpine.store, Alpine.reactive, Alpine.effect, Alpine.directive, Alpine.magic', 'yes', '$.store, $.reactive, $.effect, $.directive, $.magic.'],
    ['Plugins: Persist, Intersect, Focus, Collapse, Mask, Resize', 'yes', 'Add-on: jskjs.ui.js ($persist, kj-intersect, kj-trap + $focus, kj-collapse, kj-mask + $money, kj-resize).'],
    ['x-modelable, Morph, Anchor, Sort', 'no', ''],
    ['CSP build', 'no', ''],
  ],
  examples: [
    { title: 'The same Alpine component in jsKjs', lang: 'html', code: String.raw`
<!-- Alpine -->
<div x-data="{ open: false }"><button @click="open = !open">Menu</button><ul x-show="open" x-transition>…</ul></div>
<!-- jsKjs (the Alpine version above also works unchanged) -->
<div kj-data="{ open: false }"><button @click="open = !open">Menu</button><ul kj-show="open" kj-transition>…</ul></div>` },
  ],
},
{
  slug: 'gsap', lib: 'GSAP', ver: '3.x', mod: 'motion',
  seo: 'jsKjs vs GSAP 3: Tweens, Timelines, Plugins and Coverage',
  desc: 'jsKjs Motion vs GSAP 3: tweens, timelines with labels and nesting, playback control, repeat/yoyo, every ease family, grid staggers, keyframes, quickTo — plus ScrollTrigger, Flip, Draggable and SplitText-style add-ons.',
  lede: 'Motion implements GSAP\'s core API: controllable tweens and timelines, the full ease families, colours, CSS variables, SVG attributes and grid staggers. Scroll, Flip, Drag and Split ship as optional add-ons.',
  chooseThem: ['You need MorphSVG, MotionPath, DrawSVG, Physics2D, Inertia, ScrollSmoother or Observer — GSAP and all its plugins are free.', 'You animate thousands of concurrent tweens and want GSAP\'s battle-tested performance.'],
  chooseUs: ['Your motion is product UI: entrances, sequences, scroll stories, drag, layout changes.', 'You want it in the same file as your DOM, requests and state.'],
  rows: [
    ['gsap.to / from / fromTo / set, returning controllable, awaitable tweens', 'yes', '$.to, $.from, $.fromTo, $.set.'],
    ['Transforms incl. xPercent/yPercent, z, rotationX/Y, transformPerspective; autoAlpha', 'yes', ''],
    ['Colours, CSS variables, SVG attributes (attr:{}), strings with numbers, plain objects', 'yes', ''],
    ['Relative values (+=, -=), function-based and random() values, snap', 'yes', ''],
    ['Callbacks: onStart, onUpdate, onComplete, onRepeat, onReverseComplete (+ Params)', 'yes', ''],
    ['repeat, yoyo, repeatDelay; pause, resume, reverse, restart, seek, progress, timeScale, kill', 'yes', ''],
    ['Every ease family (power0-4, sine, expo, circ, back, elastic, bounce, steps, cubic-bezier)', 'yes', 'Configurable: back.out(2), elastic.out(1, .3).'],
    ['stagger number or object (each, amount, from, grid, axis, ease)', 'yes', ''],
    ['Timelines: labels, "<" ">" "+=" "-=" positions, nesting, call, addPause, tweenTo, defaults', 'yes', ''],
    ['keyframes (array and object form), overwrite: "auto"', 'yes', ''],
    ['gsap.quickTo, quickSetter, getProperty, killTweensOf, isTweening, delayedCall, ticker, utils', 'yes', ''],
    ['ScrollTrigger (scrub, pin, snap, toggleActions, markers) and scrollTo', 'yes', 'Add-on: jskjs.scroll.js.'],
    ['Flip, Draggable (bounds, inertia, snap, keyboard), SplitText (lines/words/chars, masks)', 'yes', 'Add-ons: jskjs.flip.js, jskjs.drag.js, jskjs.split.js.'],
    ['MorphSVG, MotionPath, DrawSVG, Physics, ScrollSmoother, Observer, matchMedia', 'no', 'Use GSAP for these.'],
  ],
  examples: [
    { title: 'The same GSAP intro in jsKjs', lang: 'js', code: String.raw`
// GSAP
gsap.timeline({ defaults: { duration: .5 } }).from('.hero h1', { y: 30 }).from('.hero p', { y: 30 }, '<');
// jsKjs
$.timeline({ defaults: { duration: .5 } }).from('.hero h1', { y: 30 }).from('.hero p', { y: 30 }, '<');` },
  ],
},
];
