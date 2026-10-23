/* docs-data.js — every jsKjs function, documented */
module.exports = [
{ id: 'core', title: 'Core & Selectors', tag: 'ink', intro: 'Everything starts with <code>$()</code>. A jsKjs set is a real Array subclass, so native methods (<code>map</code>, spread, <code>for...of</code>) work alongside the chainable API.', fns: [
  { n: '$()', s: '$(selector [, context]) · $(element) · $(html) · $(fn)', d: 'The heart of the library. Accepts a CSS selector (optionally scoped to a context), a DOM node, window, a NodeList/array, an HTML string (creates elements), or a function (runs on DOM ready).', e: `$('.card')                    // CSS selector
$('li', '#menu')              // scoped to context
$(document.body)              // wrap a node
$('<div class="x">Hi</div>')  // create elements
$(() => console.log('DOM ready'));` },
  { n: '.each()', s: '.each((index, element) => {}) → self', d: 'Iterate the set jQuery-style. Inside the callback, <code>this</code> is the current element.', e: `$('.item').each(function (i, el) {
  console.log(i, el.id, this === el); // true
});` },
  { n: '.get()', s: '.get([index]) → element | element[]', d: 'Without arguments returns a plain array of all elements; with an index returns that raw element (negative indexes count from the end). Bracket access <code>$(x)[0]</code> also works.', e: `$('.item').get();    // [el, el, el]
$('.item').get(-1);  // last raw element` },
  { n: '.eq()', s: '.eq(index) → KJ', d: 'Reduce the set to the element at the given index, returned as a new chainable set. Negative indexes count from the end.', e: `$('.item').eq(1).addClass('second');
$('.item').eq(-1).text('last');` },
  { n: '.first() / .last()', s: '.first() → KJ · .last() → KJ', d: 'Shortcuts for <code>.eq(0)</code> and <code>.eq(-1)</code>.', e: `$('li').first().addClass('head');
$('li').last().addClass('tail');` },
  { n: '.index()', s: '.index([element]) → number', d: 'Without arguments, the position of the first element among its siblings. With an element, its position within this set.', e: `$('.active').index();  // e.g. 2` },
  { n: '.add()', s: '.add(selector | elements) → KJ', d: 'Merge more elements into the set (deduplicated).', e: `$('.card').add('.banner').addClass('highlight');` },
]},

{ id: 'content', title: 'Content', tag: 'ink', intro: 'Read and write element content and form values.', fns: [
  { n: '.html()', s: '.html([value]) → string | self', d: 'Get the first element\u2019s <code>innerHTML</code>, or set it on every element in the set.', e: `$('#box').html();               // read
$('#box').html('<b>New</b>');   // write` },
  { n: '.text()', s: '.text([value]) → string | self', d: 'Get or set <code>textContent</code>. Setting always escapes — it can never inject HTML.', e: `$('#title').text('Safe & sound');` },
  { n: '.val()', s: '.val([value]) → any | self', d: 'Get or set form values. Checkboxes read/write booleans; multi-selects read as arrays.', e: `$('#email').val();          // 'a@b.c'
$('#agree').val(true);      // checks the box
$('#tags').val();           // ['js', 'css'] for multi-select` },
]},

{ id: 'attrs', title: 'Attributes & Data', tag: 'ink', intro: 'HTML attributes, DOM properties, and per-element data storage (backed by a WeakMap, so removed elements are garbage-collected automatically).', fns: [
  { n: '.attr()', s: '.attr(name [, value]) · .attr(object) → string | self', d: 'Get an attribute from the first element, or set one or many on all elements.', e: `$('img').attr('src');
$('img').attr('alt', 'Logo');
$('a').attr({ href: '/', title: 'Home' });` },
  { n: '.removeAttr()', s: '.removeAttr(name) → self', d: 'Remove an attribute from every element in the set.', e: `$('input').removeAttr('disabled');` },
  { n: '.prop()', s: '.prop(name [, value]) → any | self', d: 'Get or set a DOM property (as opposed to an HTML attribute) — <code>checked</code>, <code>disabled</code>, <code>selectedIndex</code>, etc.', e: `$('#opt-in').prop('checked');       // true/false
$('button').prop('disabled', true);` },
  { n: '.data()', s: '.data([key [, value]]) · .data(object) → any | self', d: 'Read <code>data-*</code> attributes (JSON auto-parsed) or store arbitrary values against elements. Stored values live in a WeakMap — no memory leaks, no cleanup.', e: `<div id="u" data-config='{"admin":true}'></div>

$('#u').data('config').admin;       // true (parsed)
$('#u').data('profile', { id: 7 }); // store anything
$('#u').data();                     // all data merged` },
  { n: '.removeData()', s: '.removeData(key) → self', d: 'Delete a stored data value.', e: `$('#u').removeData('profile');` },
]},

{ id: 'classes', title: 'Classes', tag: 'ink', intro: 'Space-separated multi-class strings are supported everywhere.', fns: [
  { n: '.addClass()', s: '.addClass(names) → self', d: 'Add one or more classes.', e: `$('.card').addClass('active highlight');` },
  { n: '.removeClass()', s: '.removeClass([names]) → self', d: 'Remove classes; with no argument, removes all classes.', e: `$('.card').removeClass('active');
$('.card').removeClass(); // wipe class attribute` },
  { n: '.toggleClass()', s: '.toggleClass(names [, force]) → self', d: 'Toggle classes, optionally forcing on/off with a boolean.', e: `$('.menu').toggleClass('open');
$('.menu').toggleClass('open', isOpen);` },
  { n: '.hasClass()', s: '.hasClass(name) → boolean', d: 'True if any element in the set has the class.', e: `if ($('#panel').hasClass('open')) close();` },
]},

{ id: 'css', title: 'CSS & Geometry', tag: 'ink', intro: 'Styles, sizes, positions, scrolling, visibility. Numbers get <code>px</code> automatically (except unitless properties like <code>opacity</code>); CSS custom properties (<code>--vars</code>) are supported.', fns: [
  { n: '.css()', s: '.css(name [, value]) · .css(object) → string | self', d: 'Get a computed style from the first element, or set styles on all.', e: `$('.card').css('color');            // computed
$('.card').css('margin-top', 20);   // → '20px'
$('.card').css({ opacity: .5, '--accent': 'red' });` },
  { n: '.width() / .height()', s: '.width([value]) · .height([value]) → number | self', d: 'Measured size (from <code>getBoundingClientRect</code>) or set the CSS size. On <code>$(window)</code>, returns the viewport size.', e: `$('.card').width();     // 320
$('.card').height(200); // set
$(window).width();      // viewport` },
  { n: '.offset()', s: '.offset() → { top, left }', d: 'Position relative to the document, including scroll.', e: `const { top } = $('#hero').offset();` },
  { n: '.position()', s: '.position() → { top, left }', d: 'Position relative to the offset parent.', e: `const p = $('.tooltip').position();` },
  { n: '.scrollTop() / .scrollLeft()', s: '.scrollTop([value]) · .scrollLeft([value]) → number | self', d: 'Get or set scroll position. Works on elements and on <code>$(window)</code>.', e: `$(window).scrollTop();      // read page scroll
$('#panel').scrollTop(0);   // scroll to top` },
  { n: '.show() / .hide() / .toggle()', s: '.show() · .hide() · .toggle([state]) → self', d: 'Instant visibility via <code>display</code>. <code>.hide()</code> remembers the previous display value so <code>.show()</code> restores it correctly.', e: `$('.modal').show();
$('.hint').toggle();        // flip
$('.hint').toggle(isAdmin); // force` },
]},

{ id: 'insert', title: 'Insertion & Removal', tag: 'ink', intro: 'All insertion methods accept HTML strings, elements, jsKjs sets, or plain text — and multiple arguments at once.', fns: [
  { n: '.append() / .prepend()', s: '.append(...content) · .prepend(...content) → self', d: 'Insert content inside each element, at the end or the start.', e: `$('#list').append('<li>End</li>');
$('#list').prepend($('<li>Start</li>'));` },
  { n: '.before() / .after()', s: '.before(...content) · .after(...content) → self', d: 'Insert content outside each element, as a previous or next sibling.', e: `$('.section').before('<hr>');` },
  { n: '.appendTo() / .prependTo()', s: '.appendTo(target) · .prependTo(target) → self', d: 'Reversed form: insert this set into the target.', e: `$('<li>New</li>').appendTo('#list');` },
  { n: '.wrap()', s: '.wrap(html) → self', d: 'Wrap each element in the given structure.', e: `$('img').wrap('<figure class="frame">');` },
  { n: '.remove()', s: '.remove() → self', d: 'Remove elements from the DOM. Data cleanup is automatic (WeakMap).', e: `$('.toast').remove();` },
  { n: '.empty()', s: '.empty() → self', d: 'Remove all children of each element.', e: `$('#results').empty();` },
  { n: '.clone()', s: '.clone([deep = true]) → KJ', d: 'Deep-copy the elements.', e: `$('#template-row').clone().appendTo('#table');` },
  { n: '.replaceWith()', s: '.replaceWith(content) → self', d: 'Replace each element with new content.', e: `$('.old-banner').replaceWith('<div class="new">Hi</div>');` },
]},

{ id: 'traversal', title: 'Traversal', tag: 'ink', intro: 'Walk the tree. Every method returns a new chainable set; results are deduplicated.', fns: [
  { n: '.find()', s: '.find(selector) → KJ', d: 'All descendants matching a selector.', e: `$('#app').find('.btn').addClass('ready');` },
  { n: '.filter()', s: '.filter(selector | fn) → KJ', d: 'Keep only matching elements. Accepts a selector or a predicate <code>(i, el) => boolean</code>.', e: `$('.item').filter('.active');
$('.item').filter((i, el) => el.dataset.price > 100);` },
  { n: '.not()', s: '.not(selector) → KJ', d: 'Drop matching elements.', e: `$('.item').not('.sold-out').show();` },
  { n: '.is()', s: '.is(selector | element) → boolean', d: 'Test whether any element in the set matches.', e: `if ($(e.target).is('button')) { … }` },
  { n: '.closest()', s: '.closest(selector) → KJ', d: 'Nearest matching ancestor (including the element itself). The backbone of event delegation.', e: `$(e.target).closest('.card').addClass('selected');` },
  { n: '.parent() / .parents()', s: '.parent() · .parents([selector]) → KJ', d: 'Direct parent, or all ancestors (optionally filtered).', e: `$('.btn').parent();
$('.btn').parents('.section');` },
  { n: '.children()', s: '.children([selector]) → KJ', d: 'Direct children, optionally filtered.', e: `$('#list').children('li.active');` },
  { n: '.siblings()', s: '.siblings([selector]) → KJ', d: 'All siblings, optionally filtered.', e: `$('.tab.active').siblings().removeClass('active');` },
  { n: '.next() / .prev()', s: '.next([selector]) · .prev([selector]) → KJ', d: 'Adjacent siblings, optionally required to match a selector.', e: `$('.step.current').next().addClass('upcoming');` },
]},

{ id: 'events', title: 'Events', tag: 'ink', intro: 'Modern event handling with delegation, namespaces, once-only handlers, and custom events with payloads.', fns: [
  { n: '.on()', s: '.on(types [, delegateSelector], handler) → self', d: 'Attach handlers. Multiple space-separated events and <code>.namespace</code> suffixes are supported. With a delegate selector, the handler fires for matching descendants — including ones added later — and <code>this</code> is the matched element.', e: `$('.btn').on('click', e => save());
$('.btn').on('click.menu keydown.menu', handler);

// Delegation — survives DOM swaps
$('#list').on('click', '.item', function (e) {
  $(this).toggleClass('selected');
});` },
  { n: '.one()', s: '.one(types [, delegateSelector], handler) → self', d: 'Like <code>.on()</code> but the handler runs at most once.', e: `$('#intro').one('click', dismiss);` },
  { n: '.off()', s: '.off([types] [, handler]) → self', d: 'Remove handlers — all of them, by event type, by namespace, or by specific handler reference.', e: `$('.btn').off('click');
$('.btn').off('.menu');   // whole namespace
$('.btn').off();          // everything` },
  { n: '.trigger()', s: '.trigger(type [, detail]) → self', d: 'Dispatch an event (bubbling, cancelable). The optional payload arrives as the handler\u2019s second argument.', e: `$('#app').on('cart:add', (e, item) => render(item));
$('#app').trigger('cart:add', { sku: 'A-1' });` },
  { n: '.hover()', s: '.hover(enterFn [, leaveFn]) → self', d: 'Shorthand for mouseenter/mouseleave.', e: `$('.card').hover(
  function () { $(this).addClass('lift'); },
  function () { $(this).removeClass('lift'); });` },
  { n: 'Shortcuts', s: '.click([fn]) .change([fn]) .submit([fn]) … → self', d: 'With a handler: binds it. Without: triggers the event. Available for <code>click, dblclick, change, input, submit, keydown, keyup, keypress, mousedown, mouseup, mousemove, mouseenter, mouseleave, scroll, resize, touchstart, touchend, contextmenu</code>.', e: `$('#save').click(() => submit());
$('#save').click();     // programmatic click` },
  { n: '.focus() / .blur()', s: '.focus([fn]) · .blur([fn]) → self', d: 'Bind a handler, or move focus when called without one.', e: `$('#search').focus();          // focus the field
$('#search').focus(onFocus);   // bind` },
]},

{ id: 'ajax', title: 'AJAX', tag: 'violet', intro: 'Powered by <code>fetch</code>. Every call returns a native Promise (so <code>await</code> just works) with jQuery-style <code>.done/.fail/.always</code> shims attached.', fns: [
  { n: '$.ajax()', s: '$.ajax(url | options [, options]) → Promise', d: 'Full-control requests. Options: <code>url, method</code> (or jQuery\u2019s <code>type</code>), <code>data</code> (object → urlencoded or querystring; <code>FormData</code>; string), <code>json: true</code> (send JSON body), <code>dataType</code> (\u2019json\u2019 | \u2019auto\u2019), <code>headers</code>, <code>timeout</code> (ms, auto-aborts), <code>credentials</code>, and callbacks <code>success(data, status, res)</code>, <code>error(err)</code>, <code>complete()</code>. The promise also has <code>.abort()</code>.', e: `const p = $.ajax({
  url: '/api/items', method: 'POST',
  data: { title: 'Hello' }, json: true,
  headers: { 'X-Token': 'abc' }, timeout: 5000,
});
p.done(d => render(d)).fail(err => alert(err.status));
// or simply:  const d = await p;` },
  { n: '$.get()', s: '$.get(url [, data] [, success]) → Promise', d: 'GET shorthand; <code>data</code> becomes the query string.', e: `const html = await $.get('/partials/nav.html');
$.get('/api/search', { q: 'cats' }, render);` },
  { n: '$.post()', s: '$.post(url [, data] [, success]) → Promise', d: 'POST shorthand (urlencoded body by default).', e: `await $.post('/api/save', { name: 'Ada' });` },
  { n: '$.getJSON()', s: '$.getJSON(url [, data] [, success]) → Promise', d: 'GET with forced JSON parsing.', e: `const users = await $.getJSON('/api/users');` },
  { n: '.load()', s: '.load(url [ + \u2019 selector\u2019] [, done]) → self', d: 'Fetch HTML into the element. Add a space + selector to insert only a fragment of the response.', e: `$('#panel').load('/partials/news.html');
$('#panel').load('/page.html #main');` },
  { n: '.serialize()', s: '.serialize() → string', d: 'URL-encode a form\u2019s fields.', e: `$('#signup').serialize(); // "name=Ada&plan=pro"` },
  { n: '.serializeObject()', s: '.serializeObject() → object', d: 'A form\u2019s fields as a plain object (jsKjs extra).', e: `const { email } = $('#signup').serializeObject();` },
]},

{ id: 'hyper', title: 'Hyper — Declarative AJAX', tag: 'violet', intro: 'htmx-style: describe requests in HTML with <code>kj-*</code> attributes and never write the handler. A MutationObserver auto-binds content added later, including content swapped in by Hyper itself.', fns: [
  { n: 'kj-get / kj-post / kj-put / kj-patch / kj-delete', s: 'kj-<verb>="/url"', d: 'The URL to request with that HTTP verb. Forms auto-serialize their fields; named inputs, selects and textareas send their own value. Default triggers: forms → <code>submit</code>, inputs/selects → <code>change</code>, everything else → <code>click</code>.', e: `<button kj-get="/api/joke" kj-target="#out">Joke</button>

<form kj-post="/api/subscribe" kj-target="#msg">
  <input name="email" type="email">
  <button>Subscribe</button>
</form>` },
  { n: 'kj-target', s: 'kj-target="#selector"', d: 'Where the response HTML goes (default: the element itself).', e: `<button kj-get="/api/stats" kj-target="#stats">Refresh</button>` },
  { n: 'kj-swap', s: 'kj-swap="innerHTML | outerHTML | textContent | beforebegin | afterbegin | beforeend | afterend | none"', d: 'How the response is inserted into the target. <code>outerHTML</code> replaces the target entirely; the four position values insert adjacent to it; <code>none</code> makes the request without touching the DOM.', e: `<button kj-delete="/api/items/7" kj-target="#row-7"
        kj-swap="outerHTML">Delete</button>` },
  { n: 'kj-trigger', s: 'kj-trigger="event [delay:Nms] | load | revealed | every Ns"', d: 'When to fire: any DOM event (with optional debounce), <code>load</code> (immediately), <code>revealed</code> (when scrolled into view, via IntersectionObserver), or <code>every Ns</code> (polling).', e: `<input name="q" kj-get="/api/search"
       kj-trigger="keyup delay:300ms" kj-target="#results">

<div kj-get="/api/comments" kj-trigger="revealed">…</div>
<span kj-get="/api/price" kj-trigger="every 10s"></span>` },
  { n: 'kj-confirm', s: 'kj-confirm="message"', d: 'Show a native confirm dialog before requesting.', e: `<button kj-delete="/api/acct" kj-confirm="Really delete?">✕</button>` },
  { n: 'kj-indicator', s: 'kj-indicator="#selector"', d: 'Element to show while the request is in flight (the trigger also gets <code>aria-busy="true"</code>).', e: `<button kj-get="/slow" kj-indicator="#spinner">Go</button>
<span id="spinner" hidden>Loading…</span>` },
  { n: 'kj-include / kj-vals', s: 'kj-include="#form" · kj-vals=\u2019{"k":"v"}\u2019', d: 'Send extra data: the fields of another form, and/or literal JSON values.', e: `<button kj-post="/api/filter" kj-include="#filters"
        kj-vals='{"page": 2}' kj-target="#grid">Next</button>` },
  { n: 'kj-push-url', s: 'kj-push-url="true | /path"', d: 'Push the request URL (or a given path) into browser history after a successful swap.', e: `<a kj-get="/products?page=2" kj-target="#grid"
   kj-push-url="true">Page 2</a>` },
  { n: 'Lifecycle events', s: 'kj:before · kj:after · kj:error · kj:load', d: 'Fired on the triggering element (<code>kj:before/after/error</code>, with <code>{ url, verb, … }</code> detail) and on the target after a swap (<code>kj:load</code>).', e: `$('#btn').on('kj:error', (e, d) =>
  toast('Failed: ' + d.error.status));
$('#grid').on('kj:load', highlightNew);` },
]},

{ id: 'pulse', title: 'Pulse — Reactivity', tag: 'teal', intro: 'Alpine-style: declare state on an element with <code>kj-data</code>; bind it with directives. Mutating state re-renders the component. No virtual DOM, no build step. Inside expressions, <code>$el</code> is the element and <code>$event</code> the event.', fns: [
  { n: 'kj-data', s: 'kj-data="{ … }" | kj-data="componentName"', d: 'Declares a component and its reactive scope. An <code>init()</code> method, if present, runs on mount. Pass a registered component name to reuse logic.', e: `<div kj-data="{ count: 0, open: false }">…</div>
<div kj-data="dropdown">…</div>  <!-- registered -->` },
  { n: 'kj-text / kj-html', s: 'kj-text="expr" · kj-html="expr"', d: 'Bind <code>textContent</code> or <code>innerHTML</code> to an expression. Prefer <code>kj-text</code> for anything user-supplied.', e: `<span kj-text="count"></span>
<p kj-text="name ? 'Hi ' + name : 'Who?'"></p>` },
  { n: 'kj-show', s: 'kj-show="expr"', d: 'Show/hide via <code>display</code> based on a truthy expression.', e: `<ul kj-show="open">…</ul>` },
  { n: 'kj-model', s: 'kj-model="property"', d: 'Two-way binding for inputs, textareas, selects. Checkboxes bind booleans.', e: `<input kj-model="email">
<input type="checkbox" kj-model="agreed">` },
  { n: '@event / kj-on:event', s: '@click="expr" · kj-on:input="expr" · modifiers: .prevent .stop .enter .escape', d: 'Run an expression on an event. Modifiers call preventDefault/stopPropagation or filter keys.', e: `<button @click="count++">+1</button>
<form @submit.prevent="save()">…</form>
<input @keyup.enter="search($el.value)">` },
  { n: ':attr / kj-bind:attr', s: ':src="expr" · kj-bind:class="expr"', d: 'Bind any attribute to an expression. <code>:class</code> merges with the element\u2019s static classes; <code>false</code>/<code>null</code> removes the attribute.', e: `<img :src="user.avatar" :alt="user.name">
<button :disabled="saving">Save</button>
<div :class="open ? 'expanded' : ''">…</div>` },
  { n: '$.component()', s: '$.component(name, factory)', d: 'Register a reusable component factory, then reference it by name in <code>kj-data</code>.', e: `$.component('counter', () => ({
  count: 0,
  init() { console.log('mounted'); },
}));
// <div kj-data="counter">…</div>` },
  { n: '$.store()', s: '$.store(name [, initial]) → reactive object', d: 'Create or retrieve a global reactive store. Any component reading it re-renders when it changes. Getters work as computed values.', e: `const cart = $.store('cart', {
  items: [],
  get total() { return this.items.length; },
});
cart.items.push({ sku: 'A-1' }); // UI updates` },
  { n: '$.reactive()', s: '$.reactive(object) → proxy', d: 'A standalone reactive proxy without auto-rendering — for your own change-tracking logic.', e: `const state = $.reactive({ x: 1 });` },
]},

{ id: 'motion', title: 'Motion — Animation', tag: 'amber', intro: 'GSAP-style tweening on requestAnimationFrame. Transform shorthands (<code>x, y, rotate, scale…</code>) plus any numeric CSS property. <strong>Durations in seconds.</strong> All tweens return Promises.', fns: [
  { n: '$.to()', s: '$.to(target, { …props, duration, delay, ease, stagger, onComplete }) → Promise', d: 'Tween to a state. <code>stagger</code> offsets each element\u2019s start; <code>onComplete</code> fires after the last finishes. Also chainable on sets: <code>$(sel).to(props)</code>.', e: `$.to('.card', { x: 200, rotate: 10, opacity: .8,
                duration: .6, ease: 'back.out' });

await $.to('#modal', { opacity: 0, duration: .3 });
$('#modal').hide();` },
  { n: '$.from()', s: '$.from(target, props) → Promise', d: 'Jump to the given state, then tween back to the original — the classic entrance pattern.', e: `$.from('.hero h1', { y: 40, opacity: 0,
  duration: .8, ease: 'power2.out' });` },
  { n: '$.fromTo()', s: '$.fromTo(target, fromProps, toProps) → Promise', d: 'Explicit start and end states.', e: `$.fromTo('.badge', { scale: 0 },
  { scale: 1, duration: .5, ease: 'elastic.out' });` },
  { n: '$.timeline()', s: '$.timeline([defaults]) → timeline', d: 'Sequence tweens. Steps run one after another; pass position <code>\u2019<\u2019</code> to start a step together with the previous one. <code>.add(fn)</code> inserts arbitrary steps. Auto-plays.', e: `$.timeline({ duration: .5, ease: 'power2.out' })
  .from('.hero',    { opacity: 0 })
  .from('.hero h1', { y: 30 })
  .from('.hero p',  { y: 30 }, '<')   // together
  .to('.cta',       { scale: 1.1 });` },
  { n: 'stagger', s: 'stagger: seconds', d: 'Offset each element in a multi-element tween — the signature "cascade" effect.', e: `$.to('.item', { y: 0, opacity: 1,
  duration: .4, stagger: .08 });` },
  { n: 'Easings', s: 'ease: name | (t) => number', d: 'Built in: <code>linear, ease-in, ease-out, ease-in-out, power2.in, power2.out, power2.inOut, back.out, elastic.out, bounce.out</code> — or pass any function mapping 0→1 progress.', e: `$.to('.ball', { y: 200, ease: 'bounce.out', duration: 1 });
$.to('.dot',  { x: 100, ease: t => t * t });` },
]},

{ id: 'effects', title: 'jQuery Effect Shims', tag: 'amber', intro: 'The classics, rebuilt on the Motion engine. <strong>Durations in milliseconds</strong>, exactly as jQuery developers expect.', fns: [
  { n: '.fadeIn() / .fadeOut() / .fadeToggle()', s: '.fadeIn([ms = 400] [, complete]) → self', d: 'Fade elements in (from hidden) or out (hiding when done).', e: `$('.toast').fadeIn(300);
$('.toast').fadeOut(300, function () { $(this).remove(); });` },
  { n: '.slideDown() / .slideUp() / .slideToggle()', s: '.slideDown([ms = 400] [, complete]) → self', d: 'Animate height to reveal or collapse.', e: `$('#faq-answer').slideToggle(250);` },
  { n: '.animate()', s: '.animate(props [, ms = 400] [, ease] [, complete]) → self', d: 'jQuery-signature tween of numeric CSS properties.', e: `$('.box').animate({ marginLeft: 100, opacity: .5 }, 600);` },
]},

{ id: 'utilities', title: 'Utilities', tag: 'ink', intro: 'Small helpers on the <code>$</code> namespace.', fns: [
  { n: '$.each()', s: '$.each(arrayOrObject, (keyOrIndex, value) => {})', d: 'Iterate arrays, array-likes, or plain objects.', e: `$.each({ a: 1, b: 2 }, (k, v) => console.log(k, v));` },
  { n: '$.map()', s: '$.map(collection, fn) → array', d: 'Map + flatten one level.', e: `$.map([1, 2], n => [n, n * 10]); // [1,10,2,20]` },
  { n: '$.extend()', s: '$.extend([deep], target, …sources) → target', d: 'Merge objects; pass <code>true</code> first for deep merge.', e: `$.extend(defaults, options);
$.extend(true, config, { api: { retries: 3 } });` },
  { n: '$.debounce()', s: '$.debounce(fn [, wait = 300]) → fn', d: 'Returns a function that fires only after calls stop for <code>wait</code> ms.', e: `$('#q').on('input', $.debounce(search, 300));` },
  { n: '$.throttle()', s: '$.throttle(fn [, wait = 300]) → fn', d: 'Returns a function that fires at most once per <code>wait</code> ms.', e: `$(window).on('scroll', $.throttle(onScroll, 100));` },
  { n: '$.param()', s: '$.param(object) → string', d: 'Serialize an object to a query string.', e: `$.param({ a: 1, b: 'x y' }); // "a=1&b=x+y"` },
  { n: '$.parseHTML()', s: '$.parseHTML(html) → element[]', d: 'Parse an HTML string into an array of nodes.', e: `const [li] = $.parseHTML('<li>Hi</li>');` },
  { n: '$.escape()', s: '$.escape(string) → string', d: 'HTML-escape text — use it whenever you string-build HTML from user data.', e: `$('#out').html('<b>' + $.escape(userInput) + '</b>');` },
  { n: '$.uuid()', s: '$.uuid() → string', d: 'A cryptographically strong UUID (v4).', e: `const id = $.uuid();` },
  { n: 'Type checks', s: '$.isArray(x) · $.isFunction(x) · $.isPlainObject(x) · $.trim(s)', d: 'Small predicates and string trim, kept for jQuery compatibility.', e: `$.isPlainObject({});   // true
$.isArray('nope');     // false` },
  { n: '$.noConflict()', s: '$.noConflict() → $', d: 'Restore the previous <code>window.$</code> and return jsKjs (also always available as <code>kj</code> and <code>jsKjs</code>).', e: `const j = $.noConflict();
j('#app').addClass('ready');` },
  { n: '$.version', s: '$.version → string', d: 'The library version.', e: `console.log($.version); // "1.0.0"` },
]},
];
