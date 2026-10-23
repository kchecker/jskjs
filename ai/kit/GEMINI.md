# GEMINI.md — jsKjs project rules

This project uses **jsKjs** (https://jskjs.org) — one script (~8.1 KB gzipped, zero dependencies) that provides a jQuery-compatible `$`, htmx-style declarative requests (`kj-*` attributes), Alpine-style reactivity (`kj-data`) and GSAP-style animation (`$.to`). There is no build step.

## Golden rules

1. Load exactly one script: `<script src="https://jskjs.org/cdn/1.0.0/jskjs.min.js"></script>` (or the project's local copy). **Never** add jQuery, htmx, Alpine.js or GSAP next to it.
2. Prefer HTML attributes over JavaScript:
   - Talking to the server → `kj-get` / `kj-post` / `kj-put` / `kj-patch` / `kj-delete` + `kj-target` + `kj-swap`. The server returns HTML fragments.
   - Local UI state → `kj-data` + `kj-text` / `kj-show` / `kj-model` / `@click` / `:attr`.
   - Write `$()` JavaScript only for what attributes cannot express.
3. Units: `$.to`, `$.from`, `$.fromTo`, `$.timeline` use **seconds**. `.fadeIn`, `.fadeOut`, `.slideUp`, `.slideDown`, `.animate` use **milliseconds**.
4. `$.ajax`, `$.get`, `$.post`, `$.getJSON` return native Promises — use `async/await` with `try/catch`; errors carry `err.status` and `err.data`.
5. Use only the APIs listed below. Do not invent jQuery plugins or methods from the "Not available" list.
6. Security: put user text in the page with `.text()` or `kj-text`. When building HTML strings, wrap every user value in `$.escape()`. Server endpoints that answer `kj-*` requests must escape their output (e.g. PHP `htmlspecialchars`).
7. Accessibility: real `<button>` and `<label>` elements; keep ARIA in sync with `:aria-*` bindings; `aria-live="polite"` on regions that update; honour `prefers-reduced-motion` for decorative animation.
8. Register `$.component()` and `$.store()` in a script placed right after the jsKjs script tag (before the DOM is ready).
9. Pulse expressions use `new Function`: a strict Content-Security-Policy needs `'unsafe-eval'` on pages that use `kj-data`.

## Decision guide

| Need | Use |
|---|---|
| Load / refresh part of the page from the server | `kj-get` + `kj-target` (+ `kj-trigger="load"`, `"revealed"`, `"every 5s"`) |
| Submit a form without reloading | `<form kj-post="/save" kj-target="#msg">` |
| Search-as-you-type, inline validation | `kj-trigger="keyup delay:300ms"` |
| Delete a row | `kj-delete="/rows/7" kj-target="#row-7" kj-swap="outerHTML"` (server returns empty body) |
| Infinite scroll | last item: `kj-get="/page?p=N" kj-trigger="revealed" kj-swap="outerHTML"` |
| Toggles, tabs, wizards, counters, form-driven UI | `kj-data` with `@click`, `kj-show`, `kj-model`, `kj-text` |
| Reusable widget | `$.component('name', (args) => ({ … }))` + `kj-data="name(args)"` |
| State shared by several components | `$.store('name', { … })`, read as `$.store('name')` |
| Entrance / hover / feedback animation | `$.from()` / `$.to()` with `stagger` and an ease such as `'power2.out'` |
| Sequenced animation | `$.timeline({ paused: true })…` then `await tl.play()`; `'<'` = with previous, `'+=0.3'` = gap |
| Events, classes, traversal, DOM edits | the jQuery API — it behaves as expected |

## API (complete list)

**Core:** `$(selector[, context])`, `$(element)`, `$('<html>')`, `$(fn)` (DOM ready). Collections are real Arrays (native `map`/`filter`/spread return plain arrays). `.each((i, el) => {})`, `.get(i)`, `.eq(i)`, `.first()`, `.last()`, `.index()`, `.add(sel)`.
**Content:** `.html(v?)`, `.text(v?)`, `.val(v?)` (checkbox → boolean, multi-select → array).
**Attributes:** `.attr(name, v? | obj)`, `.removeAttr()`, `.prop(name, v?)`, `.data(key?, v? | obj)` (parses data-* JSON; WeakMap storage), `.removeData()`.
**Classes / CSS:** `.addClass()`, `.removeClass()`, `.toggleClass(names, force?)`, `.hasClass()`, `.css(name, v? | obj)` (numbers → px except unitless; `--custom` properties read/write without px).
**Geometry:** `.width(v?)`, `.height(v?)`, `.offset()`, `.position()`, `.scrollTop(v?)`, `.scrollLeft(v?)`, `.show()`, `.hide()`, `.toggle(state?)`.
**Insert / remove:** `.append(...)`, `.prepend(...)`, `.before(...)`, `.after(...)`, `.appendTo()`, `.prependTo()`, `.wrap(html)`, `.remove()`, `.detach()`, `.empty()`, `.clone()`, `.replaceWith()`.
**Traversal:** `.find()`, `.filter(sel | fn(i, el))`, `.not(sel | fn | el)`, `.is(sel | fn | el)`, `.closest()`, `.parent()`, `.parents(sel?)`, `.children(sel?)`, `.siblings(sel?)`, `.next(sel?)`, `.prev(sel?)`.
**Events:** `.on(types[, delegateSelector], handler)`, `.one(...)`, `.off(types?, handler?)` (namespaces: `'click.menu'`, `.off('.menu')`), `.trigger(type, detail)` → handler `(e, detail)`. Shortcuts: `.click .dblclick .change .input .submit .keydown .keyup .keypress .mousedown .mouseup .mousemove .mouseenter .mouseleave .scroll .resize .touchstart .touchend .contextmenu .focus .blur`, `.hover(in, out)`. Handlers receive the native Event.
**AJAX:** `$.ajax(url?, { url, method|type, data, json: true, dataType: 'json'|'auto', headers, timeout, credentials, success, error, complete })` → Promise (+ `.abort()`, `.done`, `.fail`, `.always`). `$.get(url, data?, cb?)`, `$.post(url, data?, cb?)`, `$.getJSON(url, data?, cb?)`, `$(el).load('/url [selector]', cb?)`, `$(form).serialize()`, `$(form).serializeObject()`.
**Hyper attributes:** `kj-get|post|put|patch|delete="/url"`, `kj-target="#sel"`, `kj-swap="innerHTML|outerHTML|textContent|beforebegin|afterbegin|beforeend|afterend|none"`, `kj-trigger="<event> [delay:Nms] | load | revealed | every Ns"`, `kj-confirm="msg"`, `kj-indicator="#sel"`, `kj-include="#form"`, `kj-vals='{"k":"v"}'`, `kj-push-url="true|/path"`. Defaults: form → submit (sends fields), input/select → change (sends its name=value), others → click. Bodies are urlencoded (multipart when a form has file inputs). Events: `kj:before`, `kj:after` (response received, before swap), `kj:error` (detail.error.status), `kj:load` (after swap). New `kj-*` content is wired automatically. Polling stops when its element is removed.
**Pulse directives:** `kj-data="{ … }"` or `kj-data="component(args)"` (optional `init(el)`), `kj-text`, `kj-html`, `kj-show`, `kj-model` (text, number, range, textarea, select, checkbox, radio), `@event` / `kj-on:event` with one modifier: `.prevent .stop .enter .escape`; `$event`, `$el` available. `:attr` / `kj-bind:attr` (false/null removes; `:class` merges with static classes). `$.component(name, factory)`, `$.store(name, initial?)`, `$.reactive(obj)`.
**Motion:** `$.to(target, { x, y, rotate|rotation, scale, scaleX, scaleY, skewX, skewY, opacity, <numeric css>, duration, delay, ease, stagger, onComplete })` → Promise. `$.from()`, `$.fromTo(target, from, to)`, `$(sel).to(props)`. `$.timeline({ paused?, onComplete?, ...defaults })` with `.to .from .fromTo .add(fn)` and positions `'<'` / `'+=N'`; `await tl.play()`. Eases (`$.easings`): linear, ease-in, ease-out, ease-in-out, power2.in, power2.out, power2.inOut, back.out, elastic.out, bounce.out, or a function `t => …`.
**Effects (ms):** `.fadeIn(ms?, cb?)`, `.fadeOut`, `.fadeToggle`, `.slideDown`, `.slideUp`, `.slideToggle`, `.animate(props, ms?, ease?, cb?)`.
**Utilities:** `$.each`, `$.map`, `$.extend(deep?, target, ...src)` (prototype-pollution safe), `$.debounce(fn, ms)`, `$.throttle(fn, ms)`, `$.param`, `$.parseHTML`, `$.trim`, `$.isArray`, `$.isFunction`, `$.isPlainObject`, `$.uuid()`, `$.escape()`, `$.noConflict()`, `$.version`. Aliases: `window.kj`, `window.jsKjs`.

## Not available — do not use

- jQuery: `.stop() .finish() .delay() .queue() .fadeTo()`, `$.Deferred $.Callbacks $.when $.grep`, `.live() .bind() .delegate()`, `$.ajaxSetup`, JSONP, `.nextAll() .prevAll() .nextUntil() .parentsUntil() .has() .contents() .end() .addBack()`, `.wrapAll() .wrapInner() .unwrap()`, `.innerWidth() .outerWidth()`, offset setter, `.serializeArray()`.
- htmx: `hx-select`, `hx-swap-oob`, `hx-boost`, `hx-headers`, `hx-params`, `hx-sync`, `hx-on`, `hx-ext`, swap modifiers (`swap:1s`, `settle`, `scroll`), extended targets (`closest tr`), trigger modifiers (`changed`, `once`, `throttle`, `from:`, filters), response headers (`HX-Redirect`…), SSE/WebSockets.
- Alpine: `x-for`, `x-if`, `x-init`, `x-effect`, `x-ref`/`$refs`, `x-cloak`, `x-transition`, `x-teleport`, `$watch`, `$dispatch`, `$nextTick`, `$store` magic (use `$.store('name')`), object syntax for `:class`/`:style`, model modifiers. For lists use `kj-html` with `.map(…).join('')` and `$.escape()`.
- GSAP: `repeat`/`yoyo`, `pause/reverse/seek/progress/timeScale`, labels and absolute/`-=` positions, stagger objects, colour/SVG-attribute tweens, `gsap.set` (use `.css()`), `quickTo`, plugins (ScrollTrigger, Flip, Draggable, SplitText, MorphSVG…). If a project truly needs these, say so instead of faking them.

## Canonical snippets

```html
<!-- Live search -->
<input name="q" kj-get="/search.php" kj-trigger="keyup delay:300ms" kj-target="#results">
<ul id="results" aria-live="polite"></ul>

<!-- Form without reload -->
<form kj-post="/subscribe.php" kj-target="#msg"><input name="email" type="email" required><button>Join</button></form>
<p id="msg" aria-live="polite"></p>

<!-- Reactive counter -->
<div kj-data="{ n: 0 }"><button @click="n++">+1</button> <span kj-text="n"></span></div>
```

```js
// Entrance animation (respects reduced motion)
if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
  $.from('.card', { y: 24, opacity: 0, duration: .5, stagger: .08, ease: 'power2.out' });

// Fetch + render safely
const items = await $.getJSON('/api/items.json');
$('#list').html(items.map(i => '<li>' + $.escape(i.name) + '</li>').join(''));

// Delegation survives DOM swaps
$('#list').on('click', '.remove', function () { $(this).closest('li').remove(); });
```

Full reference: https://jskjs.org/docs/ · Machine-readable: https://jskjs.org/llms-full.txt
