/* Hyper (htmx-style) and Pulse (Alpine-style) modules. Demo code: no backticks, no ${. */
module.exports = [
/* ============================ HYPER ============================ */
{
  slug: 'declarative-requests', mod: 'hyper', title: 'Declarative requests',
  seo: 'kj-get, kj-post, kj-put, kj-delete: AJAX in HTML Attributes',
  desc: 'Make GET, POST, PUT, PATCH and DELETE requests straight from HTML with kj-get, kj-post and friends — htmx-style hypermedia with zero JavaScript. Live PHP-backed demos.',
  lede: 'Put the request in the markup: <code>&lt;form kj-post="/api/notes.php" kj-target="#notes"&gt;</code>. The server returns HTML, jsKjs puts it where you said. No handler code.',
  body: String.raw`
<h2>Hypermedia, the short version</h2>
<p>Instead of fetching JSON and rendering it in JavaScript, let the server send back the finished HTML fragment. jsKjs reads five attributes — <code>kj-get</code>, <code>kj-post</code>, <code>kj-put</code>, <code>kj-patch</code>, <code>kj-delete</code> — and wires the request for you.</p>
<p>Smart defaults keep markup short: forms fire on <code>submit</code> and send their fields; inputs and selects fire on <code>change</code> and send their own <code>name=value</code>; everything else fires on <code>click</code>. Bodies are URL-encoded (forms with file inputs switch to multipart automatically), exactly what PHP, Rails, Django and Laravel expect.</p>
<p>Content added later — including content returned by the server, like the delete buttons in the notes below — is wired automatically by a <code>MutationObserver</code>.</p>`,
  css: String.raw`
.note-row { display:flex; justify-content:space-between; align-items:center; gap:10px; }
.stage .note-row button { padding:5px 9px; font-size:12.5px; border-width:1px; }`,
  demos: [{
    title: 'Notes app with no JavaScript',
    html: String.raw`
<form id="note-form" class="row" kj-post="/api/notes.php" kj-target="#notes" kj-swap="afterbegin">
  <label for="note-text" class="sr-only">New note</label>
  <input id="note-text" name="text" type="text" maxlength="140" required placeholder="Write a note, press Enter" style="flex:1;min-width:200px">
  <button type="submit">Add note</button>
</form>
<ul id="notes" class="list-plain" aria-live="polite" style="margin-top:12px">
  <li id="note-seed" class="note-row"><span>The server renders each note — and its delete button.</span>
    <button type="button" kj-delete="/api/notes.php?id=seed" kj-target="#note-seed" kj-swap="outerHTML" aria-label="Delete note">✕</button></li>
</ul>`,
    js: String.raw`
// The only JavaScript on this demo: clear the field once the server has answered
$('#note-form').on('kj:after', function () { this.reset(); });`,
    note: 'Endpoint: <code>/api/notes.php</code> renders the note with PHP and escapes it. Nothing is stored — refresh and the list resets.',
  }, {
    title: 'All five verbs, one echo server',
    html: String.raw`
<div class="row">
  <button type="button" kj-get="/api/echo.php" kj-vals='{"q":"jskjs"}' kj-target="#verbs-out">kj-get</button>
  <button type="button" kj-post="/api/echo.php" kj-vals='{"title":"New"}' kj-target="#verbs-out">kj-post</button>
  <button type="button" kj-put="/api/echo.php" kj-vals='{"title":"Replaced"}' kj-target="#verbs-out">kj-put</button>
  <button type="button" kj-patch="/api/echo.php" kj-vals='{"title":"Tweaked"}' kj-target="#verbs-out">kj-patch</button>
  <button type="button" kj-delete="/api/echo.php?id=7" kj-target="#verbs-out">kj-delete</button>
</div>
<div id="verbs-out" aria-live="polite" style="margin-top:12px"><p class="muted">The server's view of your request appears here.</p></div>`,
  }],
  examples: [
    { title: 'Typical hypermedia markup', lang: 'html', code: String.raw`
<!-- Load a partial when clicked -->
<button kj-get="/partials/stats.html" kj-target="#stats">Refresh stats</button>

<!-- Inline edit: PATCH and replace the row with the server's version -->
<form kj-patch="/api/rows/7" kj-target="#row-7" kj-swap="outerHTML">…</form>

<!-- A checkbox that saves itself on change -->
<input type="checkbox" name="done" kj-put="/api/tasks/3/done">` },
    { title: 'What the server returns (PHP)', lang: 'php', code: String.raw`
<?php // /api/notes.php — return HTML, escape everything
$text = htmlspecialchars($_POST['text'] ?? '', ENT_QUOTES, 'UTF-8');
$id = bin2hex(random_bytes(4));
echo "<li id='note-$id'>$text <button kj-delete='/api/notes.php?id=$id'
      kj-target='#note-$id' kj-swap='outerHTML'>✕</button></li>";` },
  ],
  api: ['kj-get / kj-post / kj-put / kj-patch / kj-delete', 'kj-target'],
  from: [{ lib: 'htmx', note: 'Rename <code>hx-</code> to <code>kj-</code>: <code>hx-get</code> → <code>kj-get</code>, <code>hx-target</code> → <code>kj-target</code>. Requests carry <code>X-Requested-With: jsKjs</code> instead of htmx\'s <code>HX-Request</code> header.' }],
  related: ['targets-and-swaps', 'triggers', 'forms-and-serialize'],
},
{
  slug: 'targets-and-swaps', mod: 'hyper', title: 'Targets & swaps',
  seo: 'kj-target and kj-swap: innerHTML, outerHTML, beforeend and more',
  desc: 'Control exactly where server HTML lands with kj-target and how it is inserted with kj-swap — innerHTML, outerHTML, beforebegin, afterbegin, beforeend, afterend, textContent or none.',
  lede: '<code>kj-target</code> says <em>where</em>; <code>kj-swap</code> says <em>how</em>. Watch all eight strategies land around the same element.',
  body: String.raw`
<p><code>kj-target</code> takes any CSS selector (default: the element itself). <code>kj-swap</code> picks the insertion strategy:</p>
<div class="table-wrap"><table>
<thead><tr><th scope="col">kj-swap</th><th scope="col">Effect</th><th scope="col">Typical use</th></tr></thead>
<tbody>
<tr><td><code>innerHTML</code></td><td>Replace the target's content (default)</td><td>Panels, results</td></tr>
<tr><td><code>outerHTML</code></td><td>Replace the target itself</td><td>Edit-in-place rows, delete (empty response)</td></tr>
<tr><td><code>beforeend</code></td><td>Append inside</td><td>Feeds, chat, "load more"</td></tr>
<tr><td><code>afterbegin</code></td><td>Prepend inside</td><td>Newest-first lists</td></tr>
<tr><td><code>beforebegin</code> / <code>afterend</code></td><td>Insert as a sibling</td><td>Inline forms, notices</td></tr>
<tr><td><code>textContent</code></td><td>Insert as plain text</td><td>Counters, untrusted text</td></tr>
<tr><td><code>none</code></td><td>Make the request, change nothing</td><td>Fire-and-forget, analytics</td></tr>
</tbody></table></div>`,
  demos: [{
    title: 'Swap-strategy visualizer',
    html: String.raw`
<div class="row">
  <button type="button" kj-get="/api/swaps/innerHTML.html" kj-target="#swap-anchor" kj-swap="innerHTML">innerHTML</button>
  <button type="button" kj-get="/api/swaps/beforebegin.html" kj-target="#swap-anchor" kj-swap="beforebegin">beforebegin</button>
  <button type="button" kj-get="/api/swaps/afterbegin.html" kj-target="#swap-anchor" kj-swap="afterbegin">afterbegin</button>
  <button type="button" kj-get="/api/swaps/beforeend.html" kj-target="#swap-anchor" kj-swap="beforeend">beforeend</button>
  <button type="button" kj-get="/api/swaps/afterend.html" kj-target="#swap-anchor" kj-swap="afterend">afterend</button>
  <button type="button" kj-get="/api/swaps/innerHTML.html" kj-target="#swap-anchor" kj-swap="textContent">textContent</button>
  <button type="button" kj-get="/api/swaps/outerHTML.html" kj-target="#swap-anchor" kj-swap="outerHTML">outerHTML</button>
  <button type="button" id="swap-reset">Reset</button>
</div>
<div id="swap-zone" aria-live="polite" style="margin-top:14px">
  <div class="sb" id="swap-anchor">■ target — watch where each response lands</div>
</div>`,
    js: String.raw`
$('#swap-reset').on('click', () =>
  $('#swap-zone').html('<div class="sb" id="swap-anchor">■ target — watch where each response lands</div>'));`,
  }],
  examples: [
    { title: 'Patterns', lang: 'html', code: String.raw`
<!-- Chat: append each new message -->
<form kj-post="/chat/send" kj-target="#messages" kj-swap="beforeend">…</form>

<!-- Delete a row: server returns an empty body, the row disappears -->
<button kj-delete="/rows/9" kj-target="#row-9" kj-swap="outerHTML">Delete</button>

<!-- Track a click without touching the page -->
<a href="/pricing" kj-post="/track?e=pricing" kj-swap="none">Pricing</a>` },
  ],
  api: ['kj-target', 'kj-swap'],
  from: [{ lib: 'htmx', note: 'Same swap names. htmx swap <em>modifiers</em> (<code>swap:1s</code>, <code>settle</code>, <code>scroll:top</code>, <code>show</code>), <code>hx-select</code> and out-of-band swaps (<code>hx-swap-oob</code>) are not included.' }],
  related: ['declarative-requests', 'lazy-loading', 'load-fragments'],
},
{
  slug: 'triggers', mod: 'hyper', title: 'Triggers & debouncing',
  seo: 'kj-trigger: Live Search and Inline Validation with delay',
  desc: 'Choose when requests fire with kj-trigger: any DOM event plus a debounce like keyup delay:400ms — live search and server-side inline validation without JavaScript.',
  lede: 'Fire on any event, and debounce it in the attribute: <code>kj-trigger="keyup delay:400ms"</code> turns an input into live, server-validated UI.',
  body: String.raw`
<p>Without <code>kj-trigger</code>, elements use the natural event: <code>submit</code> for forms, <code>change</code> for inputs and selects, <code>click</code> for everything else. Name any DOM event to override it, and add <code>delay:Nms</code> to wait until the user pauses — one request per pause instead of one per keystroke.</p>
<p>Three special triggers handle timing rather than events: <code>load</code> (immediately), <code>revealed</code> (when scrolled into view) and <code>every Ns</code> (polling). They have their own pages: <a href="/features/lazy-loading/">lazy loading</a> and <a href="/features/polling/">polling</a>.</p>`,
  demos: [{
    title: 'Validation, search and select — all server-driven',
    html: String.raw`
<div class="grid g2">
  <div class="field">
    <label for="tr-user">Username <small class="muted">· keyup delay:400ms</small></label>
    <input id="tr-user" name="username" type="text" autocomplete="off" spellcheck="false"
           kj-get="/api/validate.php" kj-trigger="keyup delay:400ms" kj-target="#tr-user-msg"
           aria-describedby="tr-user-msg">
    <p id="tr-user-msg" aria-live="polite" style="margin:4px 0 0;font-size:14.5px">Try “admin”, “ab”, or your name.</p>
  </div>
  <div class="field">
    <label for="tr-q">Package search <small class="muted">· keyup delay:250ms</small></label>
    <input id="tr-q" name="q" type="search" autocomplete="off"
           kj-get="/api/search.php" kj-trigger="keyup delay:250ms" kj-target="#tr-results">
    <ul id="tr-results" class="list-plain" aria-live="polite" style="font-family:var(--mono);font-size:14px"></ul>
  </div>
  <div class="field">
    <label for="tr-tab">Module <small class="muted">· default trigger: change</small></label>
    <select id="tr-tab" name="tab" kj-get="/api/tab.php" kj-target="#tr-tab-out">
      <option value="core">Core</option><option value="hyper">Hyper</option><option value="pulse">Pulse</option><option value="motion">Motion</option>
    </select>
    <div id="tr-tab-out" aria-live="polite" style="margin-top:8px"></div>
  </div>
</div>`,
    note: 'All three call PHP: <code>validate.php</code>, <code>search.php</code>, <code>tab.php</code>. Zero lines of JavaScript.',
  }],
  examples: [
    { title: 'Trigger cheatsheet', lang: 'html', code: String.raw`
<input name="q" kj-get="/search" kj-trigger="keyup delay:300ms" kj-target="#hits">
<div kj-get="/preview" kj-trigger="mouseenter" kj-target="#card">Hover</div>
<form kj-post="/save" kj-trigger="change">…autosave on any field change…</form>
<div kj-get="/widgets/weather" kj-trigger="load"></div>
<div kj-get="/comments" kj-trigger="revealed"></div>
<span kj-get="/price" kj-trigger="every 5s"></span>` },
  ],
  api: ['kj-trigger'],
  from: [{ lib: 'htmx', note: 'Supported: an event name, <code>delay:</code>, <code>load</code>, <code>revealed</code>, <code>every Ns</code>. Not included: multiple events in one trigger, <code>changed</code>, <code>once</code>, <code>throttle:</code>, <code>from:</code>, <code>intersect</code> options and <code>[filter]</code> expressions.' }],
  related: ['polling', 'lazy-loading', 'debounce-and-throttle'],
},
{
  slug: 'polling', mod: 'hyper', title: 'Polling',
  seo: 'Polling with kj-trigger="every 2s" — Live Data without WebSockets',
  desc: 'Keep a panel fresh with kj-trigger="every Ns". Polling stops automatically when the element leaves the page. Live demo: a PHP price ticker and server clock.',
  lede: 'Live-ish data with one attribute: <code>kj-trigger="every 2s"</code>. Remove the element and polling stops by itself.',
  body: String.raw`
<p>Polling is the simplest real-time technique there is, and for dashboards, build status and prices it is often all you need. Each tick is an ordinary request, so caching, auth and error handling work as usual.</p>
<p>jsKjs stops polling when the element is removed from the document, so swapping a panel out never leaves a timer running in the background. To pause, remove the element; to resume, insert fresh markup — it is wired automatically.</p>`,
  css: String.raw`
.poll-card { border:1px solid var(--line); border-radius:12px; padding:16px; background:var(--surface-2); }`,
  demos: [{
    title: 'Price ticker + server clock',
    html: String.raw`
<div class="grid g2">
  <div class="poll-card">
    <p class="label" style="margin:0 0 10px">KJS / USD · every 2s</p>
    <div id="tick-slot"><div id="ticker" kj-get="/api/ticker.php" kj-trigger="every 2s">Waiting for the first tick…</div></div>
    <p class="muted" id="tick-meta" style="margin:8px 0 0;font-size:13.5px">kj:after fired 0 times</p>
  </div>
  <div class="poll-card">
    <p class="label" style="margin:0 0 10px">Server clock · every 1s</p>
    <div kj-get="/api/time.php" kj-trigger="every 1s">…</div>
  </div>
</div>
<div class="row" style="margin-top:12px"><button type="button" id="tick-pause" aria-pressed="false">Pause ticker</button></div>`,
    js: String.raw`
let polls = 0;
// Delegated: keeps working after the ticker element is replaced
$(document).on('kj:after', '#ticker', () => $('#tick-meta').text('kj:after fired ' + (++polls) + ' times'));

$('#tick-pause').on('click', function () {
  const pause = $(this).attr('aria-pressed') !== 'true';
  if (pause) $('#ticker').remove();     // removed → its polling stops by itself
  else $('#tick-slot').html('<div id="ticker" kj-get="/api/ticker.php" kj-trigger="every 2s">Resuming…</div>');  // auto-wired
  $(this).attr('aria-pressed', String(pause)).text(pause ? 'Resume ticker' : 'Pause ticker');
});`,
    note: '<code>ticker.php</code> derives the price from the current time, so it moves without storing anything.',
  }],
  examples: [
    { title: 'Build status', lang: 'html', code: String.raw`
<section kj-get="/builds/42/status" kj-trigger="every 5s">
  Building… (the server returns the finished badge when it's done)
</section>` },
  ],
  api: ['kj-trigger', 'Lifecycle events'],
  from: [{ lib: 'htmx', note: 'Same syntax as <code>hx-trigger="every 2s"</code>. htmx\'s <code>286</code> stop-polling status code is not supported — remove the element instead.' }],
  related: ['triggers', 'lifecycle-events', 'lazy-loading'],
},
{
  slug: 'lazy-loading', mod: 'hyper', title: 'Lazy loading & infinite scroll',
  seo: 'Infinite Scroll and Lazy Loading with kj-trigger="revealed"',
  desc: 'Load content when it scrolls into view with kj-trigger="revealed", or immediately with kj-trigger="load". Build infinite scroll with zero JavaScript — live PHP demo.',
  lede: '<code>kj-trigger="revealed"</code> waits until an element scrolls into view. Make the last item of each page load the next one and you have infinite scroll — in HTML.',
  body: String.raw`
<h2>How the infinite feed works</h2>
<p>Each page the server returns ends with a <em>sentinel</em>: a list item carrying <code>kj-get="/api/page.php?p=N+1"</code>, <code>kj-trigger="revealed"</code> and <code>kj-swap="outerHTML"</code>. When it scrolls into view, it replaces itself with the next page — which ends with the next sentinel. The last page simply doesn't include one.</p>
<p><code>revealed</code> uses an <code>IntersectionObserver</code>, fires once, and works inside scrollable containers. Use <code>kj-trigger="load"</code> for content that should arrive right after the page renders, such as a slow widget you don't want to block the page on.</p>`,
  css: String.raw`
.feed-box { height:260px; overflow:auto; border:1px solid var(--line); border-radius:12px; padding:4px 16px; }`,
  demos: [{
    title: 'Infinite feed (scroll inside the box)',
    html: String.raw`
<div class="feed-box" tabindex="0" role="region" aria-label="Infinite feed, scroll to load more">
  <ul class="list-plain" id="feed">
    <li kj-get="/api/page.php?p=1" kj-trigger="revealed" kj-swap="outerHTML">Loading…</li>
  </ul>
</div>
<h4 style="margin:22px 0 8px">Comments with <code>kj-trigger="load"</code></h4>
<ul class="list-plain" kj-get="/api/comments.html" kj-trigger="load"><li>Loading comments…</li></ul>`,
    note: 'Zero JavaScript. <code>page.php</code> renders six pages of four posts; each page ends with the sentinel for the next.',
  }],
  examples: [
    { title: 'The sentinel the server appends', lang: 'html', code: String.raw`
<li kj-get="/api/page.php?p=3" kj-trigger="revealed" kj-swap="outerHTML">
  Loading page 3…
</li>` },
  ],
  api: ['kj-trigger', 'kj-swap'],
  from: [{ lib: 'htmx', note: 'Identical to the classic htmx infinite-scroll pattern with <code>hx-trigger="revealed"</code>.' }],
  related: ['targets-and-swaps', 'polling', 'triggers'],
},
{
  slug: 'confirm-and-indicators', mod: 'hyper', title: 'Confirmations & loading indicators',
  seo: 'kj-confirm and kj-indicator: Safe Deletes and Loading Spinners',
  desc: 'Ask before destructive requests with kj-confirm and show progress with kj-indicator. Busy elements get aria-busy="true" automatically for accessible loading states.',
  lede: 'One attribute asks "Are you sure?"; another shows a spinner while the request runs. The requesting element gets <code>aria-busy="true"</code> for free.',
  body: String.raw`
<p><code>kj-confirm="Delete invoice #1001?"</code> shows the browser's native confirm dialog and cancels the request if the user declines. <code>kj-indicator="#spinner"</code> shows the named element for the duration of the request and hides it afterwards.</p>
<p>While a request is in flight the element carries <code>aria-busy="true"</code>, which assistive technology understands and which you can style: <code>[aria-busy="true"] { opacity: .6; cursor: progress; }</code>.</p>`,
  css: String.raw`
.inv td button { padding:5px 9px; font-size:12.5px; }
.stage [aria-busy="true"] { opacity:.55; cursor:progress; }
.spin { display:none; align-items:center; gap:8px; color:var(--muted); font:600 13px var(--mono); }
.spin::before { content:""; width:14px; height:14px; border:2px solid var(--line); border-top-color:var(--hyper); border-radius:50%; animation:kjspin .7s linear infinite; }
@keyframes kjspin { to { transform:rotate(1turn); } }
@media (prefers-reduced-motion: reduce) { .spin::before { animation:none; } }`,
  demos: [{
    title: 'Safe deletes and a slow report',
    html: String.raw`
<div class="table-wrap" style="margin-top:0"><table class="inv">
  <thead><tr><th scope="col">Invoice</th><th scope="col">Amount</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
  <tbody>
    <tr id="inv-1"><td>#1001</td><td>$420</td><td><button type="button" kj-delete="/api/items.php?id=1" kj-target="#inv-1" kj-swap="outerHTML" kj-confirm="Delete invoice #1001?">Delete</button></td></tr>
    <tr id="inv-2"><td>#1002</td><td>$1,280</td><td><button type="button" kj-delete="/api/items.php?id=2" kj-target="#inv-2" kj-swap="outerHTML" kj-confirm="Delete invoice #1002?">Delete</button></td></tr>
    <tr id="inv-3"><td>#1003</td><td>$96</td><td><button type="button" kj-delete="/api/items.php?id=3" kj-target="#inv-3" kj-swap="outerHTML" kj-confirm="Delete invoice #1003?">Delete</button></td></tr>
  </tbody>
</table></div>
<div class="row" style="margin-top:14px">
  <button type="button" kj-get="/api/slow.php?ms=1600" kj-target="#report" kj-indicator="#report-spin">Run report (1.6 s)</button>
  <div class="spin" id="report-spin" role="status">Working…</div>
</div>
<div id="report" aria-live="polite" style="margin-top:10px"></div>`,
    note: 'Zero JavaScript. <code>items.php</code> answers DELETE with an empty body, so <code>outerHTML</code> removes the row.',
  }],
  examples: [
    { title: 'Markup', lang: 'html', code: String.raw`
<button kj-delete="/api/account" kj-confirm="This cannot be undone. Continue?">Delete account</button>
<button kj-post="/export" kj-indicator="#export-spin">Export CSV</button>
<span id="export-spin" hidden>Preparing…</span>` },
  ],
  api: ['kj-confirm', 'kj-indicator'],
  from: [{ lib: 'htmx', note: '<code>hx-confirm</code> → <code>kj-confirm</code>. jsKjs shows/hides the indicator element itself rather than toggling an <code>htmx-request</code> class; <code>hx-disabled-elt</code> is not included.' }],
  related: ['declarative-requests', 'lifecycle-events', 'targets-and-swaps'],
},
{
  slug: 'include-and-vals', mod: 'hyper', title: 'Sending extra data',
  seo: 'kj-include and kj-vals: Add Form Fields and JSON Values to Requests',
  desc: 'Send more than the element itself: kj-include adds another form\'s fields, kj-vals adds literal JSON values. Includes a stateless like-button round-trip demo in PHP.',
  lede: '<code>kj-include="#filters"</code> sends another form\'s fields along; <code>kj-vals=\'{"page":2}\'</code> adds literal values. Combine them freely.',
  body: String.raw`
<p>A button outside a form can still submit that form's data: point <code>kj-include</code> at it. <code>kj-vals</code> takes a JSON object and adds each key as a parameter — ideal for IDs, page numbers and flags that don't belong in a visible field.</p>
<p>Because the server can return new markup with new <code>kj-vals</code>, you can build small stateful interactions with a stateless backend — like the like-button below, which carries its own count.</p>`,
  css: String.raw`
#like-slot button { font-size:16px; }`,
  demos: [{
    title: 'Filters from another form + a stateless like button',
    html: String.raw`
<form id="flt" class="grid g3" style="gap:12px">
  <div class="field"><label for="flt-cat">Category</label><input id="flt-cat" name="category" type="text" value="cables"></div>
  <div class="field"><label for="flt-sort">Sort</label><select id="flt-sort" name="sort"><option>newest</option><option>popular</option><option>price</option></select></div>
  <label style="align-self:end;padding-bottom:10px"><input type="checkbox" name="in_stock" value="1" checked> In stock only</label>
</form>
<div class="row" style="margin-top:12px">
  <button type="button" kj-post="/api/echo.php" kj-include="#flt" kj-vals='{"page": 2, "source": "demo"}' kj-target="#flt-out">Apply filters (page 2)</button>
  <span id="like-slot"><button type="button" kj-post="/api/like.php" kj-vals='{"count": 41}' kj-swap="outerHTML" aria-label="Like (41 likes)">♥ 41</button></span>
</div>
<div id="flt-out" aria-live="polite" style="margin-top:12px"></div>`,
    js: String.raw`
// Enter in the text field shouldn't submit the form the normal way
$('#flt').on('submit', e => e.preventDefault());`,
    note: 'The like button posts its count; <code>like.php</code> returns a new button carrying <code>count + 1</code>. No database, no JavaScript.',
  }],
  examples: [
    { title: 'Markup', lang: 'html', code: String.raw`
<form id="search-filters">…</form>
<button kj-get="/products" kj-include="#search-filters" kj-vals='{"page": 3}' kj-target="#grid">Page 3</button>` },
  ],
  api: ['kj-include / kj-vals'],
  from: [{ lib: 'htmx', note: 'Same idea as <code>hx-include</code> and <code>hx-vals</code>. <code>hx-vals="js:…"</code> (computed values) and <code>hx-params</code> filtering are not included.' }],
  related: ['declarative-requests', 'forms-and-serialize', 'targets-and-swaps'],
},
{
  slug: 'push-url', mod: 'hyper', title: 'History & deep links',
  seo: 'kj-push-url: Update the Browser URL after AJAX Requests',
  desc: 'Keep the address bar in sync with AJAX navigation using kj-push-url, and restore state on back/forward with a three-line popstate handler. Deep links work too.',
  lede: '<code>kj-push-url</code> updates the address bar after a successful swap, so tabs and filters become shareable links. A tiny <code>popstate</code> handler makes Back work.',
  body: String.raw`
<p>Set <code>kj-push-url="true"</code> to push the request URL, or give it a specific path or query such as <code>?tab=motion</code>. jsKjs calls <code>history.pushState</code> after the swap succeeds.</p>
<p>Restoring state on Back/Forward is deliberately left to you — it is a few lines, and you know best what "state" means for your page. The demo below also reads the URL on load, so <a href="?tab=motion">this link</a> opens the Motion tab directly.</p>`,
  demos: [{
    title: 'Tabs with shareable URLs',
    html: String.raw`
<div class="row" id="pu-tabs" aria-label="Modules">
  <button type="button" data-tab="core" aria-pressed="false" kj-get="/api/tab.php?tab=core" kj-target="#pu-panel" kj-push-url="?tab=core">Core</button>
  <button type="button" data-tab="hyper" aria-pressed="false" kj-get="/api/tab.php?tab=hyper" kj-target="#pu-panel" kj-push-url="?tab=hyper">Hyper</button>
  <button type="button" data-tab="pulse" aria-pressed="false" kj-get="/api/tab.php?tab=pulse" kj-target="#pu-panel" kj-push-url="?tab=pulse">Pulse</button>
  <button type="button" data-tab="motion" aria-pressed="false" kj-get="/api/tab.php?tab=motion" kj-target="#pu-panel" kj-push-url="?tab=motion">Motion</button>
</div>
<div id="pu-panel" class="plate" aria-live="polite" style="box-shadow:none;margin-top:12px">Choose a tab — then look at the address bar, and try your Back button.</div>`,
    js: String.raw`
const mark = tab => $('#pu-tabs button').each(function () {
  $(this).attr('aria-pressed', String(this.dataset.tab === tab));
});
const tabFromUrl = () => new URLSearchParams(location.search).get('tab');

$('#pu-tabs').on('click', 'button', function () { mark(this.dataset.tab); });

// Back / Forward: reload whatever the URL says
$(window).on('popstate', () => {
  const tab = tabFromUrl() || 'core';
  mark(tab);
  $('#pu-panel').load('/api/tab.php?tab=' + encodeURIComponent(tab));
});

// Deep link: ?tab=motion opens Motion straight away
if (tabFromUrl()) $(window).trigger('popstate');`,
  }],
  examples: [
    { title: 'Push the request URL itself', lang: 'html', code: String.raw`
<a href="/products?page=2" kj-get="/products?page=2" kj-target="#grid" kj-push-url="true">Page 2</a>` },
  ],
  api: ['kj-push-url'],
  from: [{ lib: 'htmx', note: 'Like <code>hx-push-url</code>, minus htmx\'s history cache and automatic restore. <code>hx-replace-url</code> and <code>hx-boost</code> are not included.' }],
  related: ['declarative-requests', 'load-fragments', 'lifecycle-events'],
},
{
  slug: 'lifecycle-events', mod: 'hyper', title: 'Request lifecycle events',
  seo: 'kj:before, kj:after, kj:error, kj:load — Hook into Every Request',
  desc: 'Every declarative request emits bubbling lifecycle events — kj:before, kj:after, kj:error and kj:load — so one document-level listener can drive a page-wide progress bar or error toast.',
  lede: 'Every Hyper request announces itself: <code>kj:before</code>, <code>kj:after</code>, <code>kj:error</code>, then <code>kj:load</code> once new content is in place. They bubble, so one listener on <code>document</code> sees them all.',
  body: String.raw`
<div class="table-wrap"><table>
<thead><tr><th scope="col">Event</th><th scope="col">Fires on</th><th scope="col">When</th><th scope="col">detail</th></tr></thead>
<tbody>
<tr><td><code>kj:before</code></td><td>requesting element</td><td>before the request</td><td><code>{ url, verb }</code></td></tr>
<tr><td><code>kj:after</code></td><td>requesting element</td><td>response received, before the swap</td><td><code>{ url, verb, html }</code></td></tr>
<tr><td><code>kj:error</code></td><td>requesting element</td><td>network error or non-2xx status</td><td><code>{ url, verb, error }</code> (<code>error.status</code>)</td></tr>
<tr><td><code>kj:load</code></td><td>target (or its parent, if <code>outerHTML</code> replaced it)</td><td>after the swap</td><td><code>{ url, verb }</code></td></tr>
</tbody></table></div>`,
  css: String.raw`
.lc-bar { position:relative; height:4px; background:var(--surface-2); border-radius:4px; overflow:hidden; margin-bottom:14px; }
#lc-progress { position:absolute; inset:0 auto 0 0; width:0; background:var(--hyper); transition:width .35s ease, opacity .3s; }`,
  demos: [{
    title: 'A page-wide progress bar from one listener',
    html: String.raw`
<div class="lc-bar" aria-hidden="true"><div id="lc-progress"></div></div>
<div class="row">
  <button type="button" kj-get="/api/quote.html" kj-target="#lc-target">Succeeds</button>
  <button type="button" kj-get="/api/slow.php?ms=1400" kj-target="#lc-target">Slow (1.4 s)</button>
  <button type="button" kj-get="/api/fail.php?code=500" kj-target="#lc-target">Fails (500)</button>
</div>
<div id="lc-target" class="plate" aria-live="polite" style="box-shadow:none;margin-top:12px;min-height:3.2em">Responses land here.</div>
<pre class="out" id="lc-log"></pre>`,
    js: String.raw`
const t0 = performance.now();
const log = (name, text) => $('#lc-log').text(
  ('+' + Math.round(performance.now() - t0) + 'ms  ' + name.padEnd(10) + text + '\n' + $('#lc-log').text()).split('\n').slice(0, 9).join('\n'));
let inflight = 0;

$(document).on('kj:before', (e, d) => {
  inflight++;
  $('#lc-progress').css({ opacity: 1, width: '70%' });
  log('kj:before', d.verb.toUpperCase() + ' ' + d.url);
});
$(document).on('kj:after', (e, d) => log('kj:after', d.url + ' (' + d.html.length + ' bytes)'));
$(document).on('kj:error', (e, d) => {
  log('kj:error', d.url + ' → HTTP ' + d.error.status);
  $('#lc-target').text('Something went wrong (HTTP ' + d.error.status + '). Try again.');
});
$(document).on('kj:load', e => log('kj:load', '#' + e.target.id + ' updated'));

$(document).on('kj:after kj:error', () => {
  if (--inflight > 0) return;
  $('#lc-progress').css('width', '100%');
  setTimeout(() => $('#lc-progress').css({ opacity: 0, width: '0%' }), 450);
});`,
  }],
  examples: [
    { title: 'Global error toast', lang: 'js', code: String.raw`
$(document).on('kj:error', (e, { url, error }) => {
  showToast(error.status === 401 ? 'Please sign in again' : 'Request to ' + url + ' failed');
});` },
  ],
  api: ['Lifecycle events'],
  from: [{ lib: 'htmx', note: 'Rough equivalents: <code>htmx:beforeRequest</code> → <code>kj:before</code>, <code>htmx:afterRequest</code> → <code>kj:after</code>, <code>htmx:responseError</code> → <code>kj:error</code>, <code>htmx:afterSwap</code> → <code>kj:load</code>. Events are not cancelable.' }],
  related: ['custom-events', 'confirm-and-indicators', 'polling'],
},

/* ============================ PULSE ============================ */
{
  slug: 'reactive-state', mod: 'pulse', title: 'Reactive state',
  seo: 'kj-data: Alpine-style Reactive State Declared in HTML',
  desc: 'Declare state on an element with kj-data and every binding inside updates when it changes. Methods, computed values and init() included — no build step, no virtual DOM.',
  lede: 'Put state on an element with <code>kj-data</code>. Everything inside can read it, change it, and re-render when it changes. The tip calculator below has zero lines of JavaScript.',
  body: String.raw`
<h2>How it works</h2>
<p>The <code>kj-data</code> object is wrapped in a <code>Proxy</code>. When a property changes, the component re-evaluates its bindings (<code>kj-text</code>, <code>kj-show</code>, <code>:attr</code>, <code>kj-model</code>). Methods defined on the object can be called from any expression, and <code>this</code> refers to the state.</p>
<p>Nested components get their own scope; an element binds to its nearest <code>kj-data</code> ancestor. If the object has an <code>init()</code> method, it runs once when the component mounts and receives the root element.</p>
<p>Expressions are evaluated with <code>new Function</code>, like Alpine's standard build, so pages using Pulse need <code>'unsafe-eval'</code> if you run a strict Content-Security-Policy.</p>`,
  css: String.raw`
.tipcalc { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); align-items:end; }
.tc-result { grid-column:1/-1; display:flex; align-items:baseline; gap:14px; flex-wrap:wrap; padding:18px; background:var(--rack); color:var(--rack-ink); border-radius:14px; }
.tc-result strong { font:850 clamp(2rem,6vw,3rem)/1 var(--display); font-stretch:115%; color:var(--pulse); }
.tc-result small { color:var(--rack-muted); font-family:var(--mono); }
output { font:800 22px var(--mono); min-width:2ch; text-align:center; }`,
  demos: [{
    title: 'Tip calculator — zero JavaScript',
    html: String.raw`
<div class="tipcalc" kj-data="{
    bill: 84, tip: 18, people: 3,
    total() { return +this.bill * (1 + this.tip / 100); },
    each()  { return this.total() / Math.max(1, +this.people); }
  }">
  <div class="field"><label for="tc-bill">Bill ($)</label><input id="tc-bill" type="number" min="0" step="0.01" kj-model="bill"></div>
  <div class="field"><label for="tc-tip">Tip: <span kj-text="tip + '%'"></span></label><input id="tc-tip" type="range" min="0" max="30" kj-model="tip"></div>
  <div class="field"><span style="font-weight:600;font-size:14.5px">People</span>
    <div class="row">
      <button type="button" @click="people = Math.max(1, +people - 1)" aria-label="Fewer people">−</button>
      <output kj-text="people" aria-live="polite"></output>
      <button type="button" @click="people = +people + 1" aria-label="More people">+</button>
    </div></div>
  <div class="tc-result" aria-live="polite"><span>Each pays</span><strong kj-text="'$' + each().toFixed(2)"></strong><small kj-text="'Total $' + total().toFixed(2) + ' incl. tip'"></small></div>
</div>`,
  }],
  examples: [
    { title: 'State, methods and init()', lang: 'html', code: String.raw`
<div kj-data="{ open: false, items: [], async init() { this.items = await $.getJSON('/api/items'); } }">
  <button @click="open = !open" :aria-expanded="open">Menu</button>
  <ul kj-show="open" kj-html="items.map(i => '<li>' + $.escape(i.name) + '</li>').join('')"></ul>
</div>` },
  ],
  api: ['kj-data', '$.reactive()'],
  from: [{ lib: 'Alpine.js', note: '<code>x-data</code> → <code>kj-data</code>, same object syntax and <code>init()</code>. Alpine\'s magic properties (<code>$watch</code>, <code>$dispatch</code>, <code>$refs</code>, <code>$nextTick</code>) are not included; <code>$el</code> and <code>$event</code> are.' }],
  related: ['two-way-binding', 'text-and-html-binding', 'components'],
},
{
  slug: 'text-and-html-binding', mod: 'pulse', title: 'Text & HTML binding',
  seo: 'kj-text and kj-html: Bind Content to Reactive State Safely',
  desc: 'Bind element content to state with kj-text (always safe) and kj-html (for markup you control). Live demo: a post composer with a character counter and formatted preview.',
  lede: '<code>kj-text</code> writes text — it can never inject markup. <code>kj-html</code> writes HTML for the cases where you built the markup yourself.',
  body: String.raw`
<p>Any JavaScript expression works inside the attribute: arithmetic, ternaries, method calls, template-free string concatenation. The binding re-runs whenever the component's state changes.</p>
<p>The safe pattern for rich previews is <strong>escape first, then decorate</strong>: run user text through <code>$.escape()</code>, then add your own tags for hashtags or mentions. That way the only HTML that reaches the page is HTML you wrote.</p>`,
  css: String.raw`
.cp-preview { border:1px dashed var(--line); border-radius:12px; padding:14px; min-height:3em; overflow-wrap:anywhere; }
.cp-preview mark { background:color-mix(in srgb, var(--pulse) 30%, transparent); color:inherit; border-radius:4px; padding:0 2px; }`,
  demos: [{
    title: 'Post composer',
    html: String.raw`
<div kj-data="composer">
  <label for="cp-msg">Your post</label>
  <textarea id="cp-msg" rows="3" kj-model="msg" maxlength="400" style="margin-top:6px"></textarea>
  <p class="row" style="justify-content:space-between;margin:8px 0 16px">
    <span class="muted" kj-text="words() + ' words'"></span>
    <span :class="left() < 0 ? 'no' : left() < 20 ? 'partial' : 'muted'" kj-text="left() + ' characters left'" aria-live="polite"></span>
  </p>
  <h4 style="margin:0 0 8px">Preview <small class="muted">(kj-html)</small></h4>
  <div class="cp-preview" kj-html="preview()"></div>
</div>`,
    js: String.raw`
$.component('composer', () => ({
  msg: 'Shipping #jskjs today — one script, four superpowers. Thanks @kchecker! <b>This tag stays text.</b>',
  left()  { return 140 - this.msg.length; },
  words() { return this.msg.trim() ? this.msg.trim().split(/\s+/).length : 0; },
  preview() {
    return $.escape(this.msg)                       // 1. escape everything the user typed
      .replace(/#(\w+)/g, '<mark>#$1</mark>')       // 2. then add markup we control
      .replace(/@(\w+)/g, '<a href="https://github.com/$1" rel="noopener">@$1</a>');
  },
}));`,
  }],
  examples: [
    { title: 'Common bindings', lang: 'html', code: String.raw`
<span kj-text="count"></span>
<p kj-text="user ? 'Hi ' + user.name : 'Please sign in'"></p>
<ul kj-html="items.map(i => '<li>' + $.escape(i) + '</li>').join('')"></ul>` },
  ],
  api: ['kj-text / kj-html'],
  from: [{ lib: 'Alpine.js', note: '<code>x-text</code> → <code>kj-text</code>, <code>x-html</code> → <code>kj-html</code>.' }],
  related: ['reactive-state', 'two-way-binding', 'attribute-binding'],
},
{
  slug: 'conditional-display', mod: 'pulse', title: 'Conditional display',
  seo: 'kj-show: Build a Multi-step Form Wizard without a Framework',
  desc: 'Show and hide parts of the page from state with kj-show. Live demo: an accessible three-step signup wizard with validation and focus management.',
  lede: '<code>kj-show="step === 2"</code> shows an element only while the expression is true. Build wizards, tabs and empty states from one piece of state.',
  body: String.raw`
<p><code>kj-show</code> toggles <code>display</code>; the element stays in the DOM, keeping any input the user typed. Because the whole wizard is driven by a single <code>step</code> value, there is no chance of two steps showing at once.</p>
<p>Accessibility matters most at the moment content changes. The <code>go()</code> method below moves keyboard focus to the new step's heading, so screen-reader and keyboard users land where the new content starts.</p>`,
  css: String.raw`
.wz-steps { display:flex; gap:8px; list-style:none; padding:0; margin:0 0 18px; counter-reset:s; flex-wrap:wrap; }
.wz-steps li { counter-increment:s; font:600 12.5px var(--mono); padding:7px 11px; border-radius:99px; background:var(--surface-2); color:var(--muted); }
.wz-steps li::before { content:counter(s) " · "; }
.wz-steps li[aria-current="step"] { background:var(--pulse); color:#13152B; }
.wz section { display:grid; gap:12px; max-width:480px; }
.wz h4 { margin:0; font-size:1.15rem; }
.wz h4:focus { outline:none; }`,
  demos: [{
    title: 'Three-step signup wizard',
    html: String.raw`
<div kj-data="wizard" class="wz">
  <ol class="wz-steps" aria-label="Progress">
    <li :aria-current="step === 1 ? 'step' : false">Account</li>
    <li :aria-current="step === 2 ? 'step' : false">Plan</li>
    <li :aria-current="step === 3 ? 'step' : false">Confirm</li>
  </ol>
  <section kj-show="step === 1">
    <h4 id="wz-h1" tabindex="-1">What should we call you?</h4>
    <div class="field"><label for="wz-name">Name</label><input id="wz-name" type="text" kj-model="name" autocomplete="name"></div>
    <div class="row"><button type="button" @click="go(2)" :disabled="!name.trim()">Next</button></div>
  </section>
  <section kj-show="step === 2">
    <h4 id="wz-h2" tabindex="-1">Pick a plan</h4>
    <fieldset style="border:0;padding:0;display:grid;gap:8px"><legend class="sr-only">Plan</legend>
      <label><input type="radio" name="wz-plan" value="free" kj-model="plan"> Free — one site</label>
      <label><input type="radio" name="wz-plan" value="pro" kj-model="plan"> Pro — unlimited sites</label>
      <label><input type="radio" name="wz-plan" value="team" kj-model="plan"> Team — shared stores</label>
    </fieldset>
    <label><input type="checkbox" kj-model="emails"> Send me release notes</label>
    <div class="row"><button type="button" @click="go(1)">Back</button><button type="button" @click="go(3)">Next</button></div>
  </section>
  <section kj-show="step === 3">
    <h4 id="wz-h3" tabindex="-1">Confirm</h4>
    <p kj-text="'Name: ' + name + ' · Plan: ' + plan + ' · Release notes: ' + (emails ? 'yes' : 'no')"></p>
    <div class="row"><button type="button" @click="go(2)">Back</button><button type="button" @click="go(4)">Create account</button></div>
  </section>
  <section kj-show="step === 4">
    <h4 id="wz-h4" tabindex="-1" kj-text="'Welcome aboard, ' + name + ' ✓'"></h4>
    <div class="row"><button type="button" @click="name = ''; go(1)">Start over</button></div>
  </section>
</div>`,
    js: String.raw`
$.component('wizard', () => ({
  step: 1, name: '', plan: 'pro', emails: true,
  go(n) {
    this.step = n;
    setTimeout(() => $('#wz-h' + n).focus(), 0);   // move focus to the new step for keyboard & screen-reader users
  },
}));`,
  }],
  examples: [
    { title: 'Empty states', lang: 'html', code: String.raw`
<div kj-data="{ items: [] }">
  <p kj-show="!items.length">Nothing here yet — add your first item.</p>
  <ul kj-show="items.length" kj-html="…"></ul>
</div>` },
  ],
  api: ['kj-show'],
  from: [{ lib: 'Alpine.js', note: '<code>x-show</code> → <code>kj-show</code>. <code>x-if</code> (adding/removing from the DOM) and <code>x-transition</code> are not included; combine <code>kj-show</code> with Motion for animated reveals.' }],
  related: ['reactive-state', 'event-directives', 'two-way-binding'],
},
{
  slug: 'two-way-binding', mod: 'pulse', title: 'Two-way binding',
  seo: 'kj-model: Two-way Form Binding for Inputs, Sliders, Radios, Checkboxes',
  desc: 'Bind form controls to state in both directions with kj-model — text, number, range, checkbox, radio and select. Live demo: an RGB colour mixer with a WCAG contrast check.',
  lede: '<code>kj-model="r"</code> keeps a control and a state property in sync — both ways. Move a slider and the state changes; change the state and the slider moves.',
  body: String.raw`
<p><code>kj-model</code> works with text, number, range, textarea, select, checkbox (booleans) and radio buttons (the checked radio's <code>value</code>). It never rewrites the field you are typing in, but programmatic changes — a preset button, a reset — update it immediately.</p>
<p>The mixer below binds the hex field to a getter/setter pair: reading <code>hex</code> computes it from the three channels, writing a valid hex parses it back into them. That is all two-way binding needs.</p>`,
  css: String.raw`
.mx { display:grid; gap:18px; grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
.mx-swatch { border-radius:16px; min-height:170px; display:grid; place-items:center; font:800 26px var(--mono); }
.mx-ctrls { display:grid; gap:10px; }
.mx-presets button { width:34px; height:34px; border-radius:50% !important; padding:0 !important; }
@media (max-width:640px) { .mx { grid-template-columns:1fr; } }`,
  demos: [{
    title: 'Colour mixer with contrast check',
    html: String.raw`
<div kj-data="mixer" class="mx">
  <div class="mx-swatch" :style="'background:' + rgb() + ';color:' + ink()" role="img" :aria-label="'Colour ' + hex">
    <span kj-text="hex"></span>
  </div>
  <div class="mx-ctrls">
    <div class="field"><label for="mx-r">Red <span kj-text="r"></span></label><input id="mx-r" type="range" min="0" max="255" kj-model="r"></div>
    <div class="field"><label for="mx-g">Green <span kj-text="g"></span></label><input id="mx-g" type="range" min="0" max="255" kj-model="g"></div>
    <div class="field"><label for="mx-b">Blue <span kj-text="b"></span></label><input id="mx-b" type="range" min="0" max="255" kj-model="b"></div>
    <div class="field"><label for="mx-hex">Hex (type a value)</label><input id="mx-hex" type="text" kj-model="hex" spellcheck="false" style="font-family:var(--mono)"></div>
    <div class="row mx-presets" aria-label="Presets">
      <button type="button" @click="hex = '#4D7CFF'" style="background:#4D7CFF" aria-label="Core blue"></button>
      <button type="button" @click="hex = '#FF4F8B'" style="background:#FF4F8B" aria-label="Hyper pink"></button>
      <button type="button" @click="hex = '#22CFA2'" style="background:#22CFA2" aria-label="Pulse mint"></button>
      <button type="button" @click="hex = '#FFB224'" style="background:#FFB224" aria-label="Motion amber"></button>
    </div>
    <p aria-live="polite" style="margin:0" kj-text="'White text contrast: ' + contrast() + ':1 ' + (contrast() >= 4.5 ? '✓ passes AA' : '✗ below AA')"></p>
  </div>
</div>`,
    js: String.raw`
$.component('mixer', () => ({
  r: 108, g: 92, b: 231,
  get hex() {
    return '#' + [this.r, this.g, this.b].map(n => (+n).toString(16).padStart(2, '0')).join('').toUpperCase();
  },
  set hex(value) {                                       // typing a valid hex updates all three sliders
    const m = /^#?([0-9a-f]{6})$/i.exec(String(value).trim());
    if (m) [this.r, this.g, this.b] = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
  },
  rgb() { return 'rgb(' + this.r + ', ' + this.g + ', ' + this.b + ')'; },
  luminance() {
    return [this.r, this.g, this.b]
      .map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); })
      .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  },
  contrast() { return +(1.05 / (this.luminance() + .05)).toFixed(2); },
  ink() { return this.contrast() >= 4.5 ? '#FFFFFF' : '#13152B'; },
}));`,
  }],
  examples: [
    { title: 'Every control type', lang: 'html', code: String.raw`
<input kj-model="email" type="email">
<input kj-model="qty" type="number">          <!-- string: use +qty for maths -->
<input kj-model="agree" type="checkbox">      <!-- boolean -->
<input kj-model="size" type="radio" value="m"> <input kj-model="size" type="radio" value="l">
<select kj-model="country">…</select>` },
  ],
  api: ['kj-model'],
  from: [{ lib: 'Alpine.js', note: '<code>x-model</code> → <code>kj-model</code>. Values arrive as strings (use <code>+value</code>); Alpine\'s <code>.number</code>, <code>.lazy</code> and <code>.debounce</code> modifiers are not included.' }],
  related: ['reactive-state', 'attribute-binding', 'forms-and-serialize'],
},
{
  slug: 'event-directives', mod: 'pulse', title: 'Event directives',
  seo: '@click, @submit.prevent, @keyup.enter: Inline Event Directives',
  desc: 'Handle events right in your markup with @click and kj-on:, including the .prevent, .stop, .enter and .escape modifiers. Live demo: a keyboard-friendly to-do list.',
  lede: '<code>@click="count++"</code> runs an expression when the event fires. Modifiers handle the boilerplate: <code>.prevent</code>, <code>.stop</code>, <code>.enter</code>, <code>.escape</code>.',
  body: String.raw`
<p>Write <code>@event</code> or the long form <code>kj-on:event</code>. Inside the expression you can use the component's state and methods, plus <code>$event</code> (the native event) and <code>$el</code> (the element).</p>
<div class="table-wrap"><table>
<thead><tr><th scope="col">Modifier</th><th scope="col">Does</th></tr></thead>
<tbody>
<tr><td><code>.prevent</code></td><td><code>event.preventDefault()</code> — e.g. <code>@submit.prevent</code></td></tr>
<tr><td><code>.stop</code></td><td><code>event.stopPropagation()</code> — parent handlers don't see it</td></tr>
<tr><td><code>.enter</code></td><td>Only when the key is Enter</td></tr>
<tr><td><code>.escape</code></td><td>Only when the key is Escape</td></tr>
</tbody></table></div>
<p>Directives inside markup produced by <code>kj-html</code> are wired automatically, so rendered list items can carry their own <code>@click</code>.</p>`,
  css: String.raw`
.td-card { margin-top:14px; padding:14px; border:1px dashed var(--line); border-radius:12px; cursor:pointer; }`,
  demos: [{
    title: 'Keyboard-friendly to-do list',
    html: String.raw`
<div kj-data="todos">
  <form class="row" @submit.prevent="add()">
    <label for="td-in" class="sr-only">New task</label>
    <input id="td-in" type="text" kj-model="draft" @keyup.escape="draft = ''" placeholder="Enter adds · Esc clears" style="flex:1;min-width:200px">
    <button type="submit">Add</button>
  </form>
  <ul class="list-plain" kj-html="list()" aria-live="polite" style="margin-top:8px"></ul>
  <div class="td-card" @click="clicks++">
    Clicking this card counts: <b kj-text="clicks"></b> clicks.
    <button type="button" @click.stop="items = []">Clear all (.stop — the card doesn't count it)</button>
  </div>
</div>`,
    js: String.raw`
$.component('todos', () => ({
  draft: '', clicks: 0,
  items: ['Try Esc in the field', 'Press Enter to add a task'],
  add() {
    if (!this.draft.trim()) return;
    this.items.push(this.draft.trim());
    this.draft = '';                        // the focused field clears too
  },
  remove(i) { this.items.splice(i, 1); },
  list() {
    return this.items.map((t, i) =>
      '<li class="row" style="justify-content:space-between">' + $.escape(t) +
      ' <button type="button" @click="remove(' + i + ')" aria-label="Remove ' + $.escape(t) + '">✕</button></li>').join('');
  },
}));`,
  }],
  examples: [
    { title: 'Directive forms', lang: 'html', code: String.raw`
<button @click="open = !open">Toggle</button>
<form @submit.prevent="save()">…</form>
<input @keyup.enter="search($el.value)" @keyup.escape="$el.value = ''">
<div kj-on:mouseenter="hovered = true" kj-on:mouseleave="hovered = false"></div>` },
  ],
  api: ['@event / kj-on:event'],
  from: [{ lib: 'Alpine.js', note: '<code>x-on:</code>/<code>@</code> work the same. One modifier per directive; <code>.outside</code>, <code>.window</code>, <code>.document</code>, <code>.once</code>, <code>.debounce</code> and other key names are not included — use <code>$event.key</code>.' }],
  related: ['reactive-state', 'events', 'text-and-html-binding'],
},
{
  slug: 'attribute-binding', mod: 'pulse', title: 'Attribute binding',
  seo: ':src, :class, :disabled — Bind Any Attribute to Reactive State',
  desc: 'Bind any attribute to state with :attr or kj-bind:attr — src, alt, aria-*, disabled, style. :class merges with static classes and false removes an attribute. Live gallery demo.',
  lede: '<code>:disabled="current === 0"</code>, <code>:src="art(current)"</code>, <code>:aria-current="…"</code> — any attribute can follow state.',
  body: String.raw`
<p>The value of a bound attribute is a JavaScript expression. Three rules cover every case:</p>
<ul>
<li><code>false</code>, <code>null</code> or <code>undefined</code> remove the attribute — exactly what <code>disabled</code> and <code>aria-current</code> need.</li>
<li><code>true</code> sets an empty attribute (<code>disabled=""</code>).</li>
<li><code>:class</code> is <em>added to</em> the element's static classes instead of replacing them.</li>
</ul>
<p>Binding ARIA attributes this way keeps what assistive technology hears in lockstep with what sighted users see.</p>`,
  css: String.raw`
.gal-main { margin:0; }
.gal-main img { width:100%; height:auto; border-radius:14px; display:block; background:var(--rack); }
.gal-main figcaption { font:600 13.5px var(--mono); color:var(--muted); margin-top:8px; }
.stage .thumb { padding:3px; border-radius:9px; border:2px solid transparent; background:transparent; }
.stage .thumb.on { border-color:var(--pulse-ink); background:transparent; }
.stage .thumb:hover { background:var(--surface-2); }
.thumb img { display:block; border-radius:6px; }`,
  demos: [{
    title: 'Gallery — keyboard arrows work too',
    html: String.raw`
<div kj-data="gallery" tabindex="0" @keydown="key($event)" aria-label="Gallery. Use the left and right arrow keys." role="group">
  <figure class="gal-main">
    <img :src="art(current)" :alt="titles[current]" width="640" height="360">
    <figcaption kj-text="(current + 1) + ' / ' + titles.length + ' — ' + titles[current]" aria-live="polite"></figcaption>
  </figure>
  <div class="row" style="margin-top:12px">
    <button type="button" @click="current--" :disabled="current === 0" aria-label="Previous">←</button>
    <button type="button" class="thumb" @click="current = 0" :class="current === 0 ? 'on' : ''" :aria-current="current === 0 ? 'true' : false" aria-label="Artwork 1"><img :src="art(0)" alt="" width="64" height="36"></button>
    <button type="button" class="thumb" @click="current = 1" :class="current === 1 ? 'on' : ''" :aria-current="current === 1 ? 'true' : false" aria-label="Artwork 2"><img :src="art(1)" alt="" width="64" height="36"></button>
    <button type="button" class="thumb" @click="current = 2" :class="current === 2 ? 'on' : ''" :aria-current="current === 2 ? 'true' : false" aria-label="Artwork 3"><img :src="art(2)" alt="" width="64" height="36"></button>
    <button type="button" class="thumb" @click="current = 3" :class="current === 3 ? 'on' : ''" :aria-current="current === 3 ? 'true' : false" aria-label="Artwork 4"><img :src="art(3)" alt="" width="64" height="36"></button>
    <button type="button" @click="current++" :disabled="current === titles.length - 1" aria-label="Next">→</button>
  </div>
</div>`,
    js: String.raw`
$.component('gallery', () => ({
  current: 0,
  titles: ['Signal, blue hour', 'Hypermedia at dusk', 'Mint pulse', 'Amber motion'],
  colors: ['#4D7CFF', '#FF4F8B', '#22CFA2', '#FFB224'],
  art(i) {                                           // a generated SVG "photo" per slide
    const c = this.colors[i];
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="#13152B"/>' +
      '<circle cx="' + (170 + i * 100) + '" cy="170" r="' + (80 + i * 14) + '" fill="' + c + '" opacity=".9"/>' +
      '<path d="M0 ' + (300 - i * 25) + ' C 210 ' + (110 + i * 35) + ', 430 380, 640 ' + (130 + i * 30) + '" stroke="' + c + '" stroke-width="12" fill="none" opacity=".55"/></svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  },
  key(e) {
    if (e.key === 'ArrowRight' && this.current < this.titles.length - 1) this.current++;
    if (e.key === 'ArrowLeft' && this.current > 0) this.current--;
  },
}));`,
  }],
  examples: [
    { title: 'Bindings', lang: 'html', code: String.raw`
<a :href="'/users/' + user.id" kj-text="user.name"></a>
<button :disabled="saving" :aria-busy="saving">Save</button>
<li class="tab" :class="active ? 'is-active' : ''">…</li>
<div :style="'width:' + progress + '%'"></div>` },
  ],
  api: [':attr / kj-bind:attr'],
  from: [{ lib: 'Alpine.js', note: '<code>x-bind:</code>/<code>:</code> work the same for strings. Alpine\'s object syntax for <code>:class="{ active: on }"</code> and <code>:style="{ … }"</code> is not included — use a string expression.' }],
  related: ['reactive-state', 'two-way-binding', 'components'],
},
{
  slug: 'components', mod: 'pulse', title: 'Reusable components',
  seo: '$.component(): Reusable Components with Arguments, No Build Step',
  desc: 'Register a component once with $.component(name, factory) and reuse it anywhere with kj-data="name(args)". Live demo: three independent star-rating widgets.',
  lede: 'Register once, use anywhere: <code>$.component(\'rating\', (initial, label) =&gt; ({ … }))</code>, then <code>&lt;div kj-data="rating(4, \'Docs\')"&gt;</code>.',
  body: String.raw`
<p>A component is a factory that returns a fresh state object. Each element using it gets its own instance, so three ratings on a page never interfere. Arguments in <code>kj-data="rating(4, 'Docs')"</code> are passed to the factory, and an <code>init(el)</code> method receives the root element if you need it.</p>
<p>Register components in a script that runs before the DOM is ready — placing it right after the jsKjs script tag is enough.</p>`,
  css: String.raw`
.rate { display:flex; align-items:center; gap:14px; flex-wrap:wrap; padding:10px 0; border-bottom:1px dashed var(--line); }
.rate-label { font-weight:700; min-width:120px; }
.stars { display:flex; gap:2px; }
.stage .stars button { border:0; background:transparent; color:var(--line); font-size:26px; line-height:1; padding:4px; }
.stage .stars button[aria-pressed="true"] { color:var(--motion); background:transparent; }
.stage .stars button:hover { background:var(--surface-2); color:var(--motion-ink); }`,
  demos: [{
    title: 'Three independent ratings, one component',
    html: String.raw`
<div kj-data="rating(4, 'Docs')" class="rate"></div>
<div kj-data="rating(2, 'Demos')" class="rate"></div>
<div kj-data="rating(0, 'Release notes')" class="rate"></div>`,
    js: String.raw`
$.component('rating', (initial = 0, label = 'Rating') => ({
  value: initial, label,
  init(el) {                                         // build the widget's markup once
    el.innerHTML =
      '<span class="rate-label" kj-text="label"></span>' +
      '<div class="stars" role="group" aria-label="' + label + ' rating">' +
      [1, 2, 3, 4, 5].map(n => '<button type="button" @click="rate(' + n + ')" :aria-pressed="value >= ' + n +
        ' ? \'true\' : \'false\'" aria-label="' + n + ' star' + (n > 1 ? 's' : '') + '">★</button>').join('') +
      '</div><span class="muted" kj-text="value ? value + \' of 5\' : \'Not rated\'" aria-live="polite"></span>';
  },
  rate(n) { this.value = this.value === n ? 0 : n; },  // click the same star again to clear
}));`,
  }],
  examples: [
    { title: 'A dropdown component', lang: 'js', code: String.raw`
$.component('dropdown', (open = false) => ({
  open,
  toggle() { this.open = !this.open; },
}));
// <div kj-data="dropdown(true)"> <button @click="toggle()">Menu</button> <ul kj-show="open">…</ul> </div>` },
  ],
  api: ['$.component()', 'kj-data'],
  from: [{ lib: 'Alpine.js', note: '<code>Alpine.data(\'rating\', …)</code> → <code>$.component(\'rating\', …)</code>, including arguments: <code>x-data="rating(4)"</code> → <code>kj-data="rating(4)"</code>.' }],
  related: ['reactive-state', 'global-store', 'attribute-binding'],
},
{
  slug: 'global-store', mod: 'pulse', title: 'Global stores',
  seo: '$.store(): Shared Reactive State across Components',
  desc: 'Share state between components with $.store(name, data). Every component that reads the store re-renders when it changes. Live demo: a cart that survives a page refresh.',
  lede: 'One source of truth for the whole page: <code>$.store(\'cart\', { items: [] })</code>. Any component that reads it updates when it changes.',
  body: String.raw`
<p>Create a store with an initial object; read it anywhere with <code>$.store('cart')</code>, in expressions or in JavaScript. Getters work as computed values. Mutating the store re-renders every component on the page.</p>
<p>Persistence is a few lines: load the initial value from <code>localStorage</code>, and save on <code>pagehide</code>. The cart below survives a refresh.</p>`,
  css: String.raw`
.gs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; margin-top:12px; }
.gs-line { display:flex; justify-content:space-between; align-items:center; gap:10px; }`,
  demos: [{
    title: 'Shop, badge and mini-cart sharing one store',
    html: String.raw`
<div class="row" style="justify-content:space-between">
  <strong>Rack Shop</strong>
  <span kj-data="{}" class="chip" aria-live="polite" kj-text="'🛒 ' + $.store('cart').count + ' items · $' + $.store('cart').total"></span>
</div>
<div kj-data="shop" class="gs-grid">
  <button type="button" @click="add('Patch cable', 9)">Patch cable · $9</button>
  <button type="button" @click="add('Easing mug', 18)">Easing mug · $18</button>
  <button type="button" @click="add('Tween tee', 24)">Tween tee · $24</button>
</div>
<div kj-data="minicart" class="plate" style="box-shadow:none;margin-top:14px">
  <h4 style="margin:0 0 6px">Mini cart</h4>
  <ul class="list-plain" kj-html="list()"></ul>
  <button type="button" @click="$.store('cart').items = []" :disabled="!$.store('cart').count" style="margin-top:10px">Empty cart</button>
</div>`,
    js: String.raw`
let saved = [];
try { saved = JSON.parse(localStorage.getItem('kj-demo-cart')) || []; } catch (e) {}

$.store('cart', {
  items: saved,
  get count() { return this.items.length; },
  get total() { return this.items.reduce((sum, i) => sum + i.price, 0); },
});

$.component('shop', () => ({
  add(name, price) { $.store('cart').items.push({ name, price }); },
}));

$.component('minicart', () => ({
  remove(i) { $.store('cart').items.splice(i, 1); },
  list() {
    const items = $.store('cart').items;
    if (!items.length) return '<li class="muted">Your cart is empty.</li>';
    return items.map((it, i) => '<li class="gs-line">' + $.escape(it.name) + ' <span>$' + it.price +
      ' <button type="button" @click="remove(' + i + ')" aria-label="Remove ' + $.escape(it.name) + '">✕</button></span></li>').join('');
  },
}));

$(window).on('pagehide', () => {
  try { localStorage.setItem('kj-demo-cart', JSON.stringify($.store('cart').items)); } catch (e) {}
});`,
  }],
  examples: [
    { title: 'Use a store from plain JavaScript', lang: 'js', code: String.raw`
const prefs = $.store('prefs', { theme: 'dark', compact: false });
$('#compact').on('change', function () { prefs.compact = this.checked; });   // every component updates` },
  ],
  api: ['$.store()', '$.reactive()'],
  from: [{ lib: 'Alpine.js', note: '<code>Alpine.store(\'cart\', …)</code> → <code>$.store(\'cart\', …)</code>; read it as <code>$.store(\'cart\')</code> instead of <code>$store.cart</code>.' }],
  related: ['components', 'custom-events', 'reactive-state'],
},
];
