/* "What aged in jQuery" — a fair, sourced series. */
const SRC = {
  jq4: ['jQuery 4.0.0 release notes (blog.jquery.com, January 2026)', 'https://blog.jquery.com/?p=5047'],
  cve2019: ['NVD — CVE-2019-11358 (prototype pollution in jQuery.extend, fixed in 3.4.0)', 'https://nvd.nist.gov/vuln/detail/CVE-2019-11358'],
  cve2020a: ['NVD — CVE-2020-11022 (untrusted HTML in DOM manipulation methods, fixed in 3.5.0)', 'https://nvd.nist.gov/vuln/detail/CVE-2020-11022'],
  cve2020b: ['NVD — CVE-2020-11023 (untrusted HTML containing <option>, fixed in 3.5.0)', 'https://nvd.nist.gov/vuln/detail/CVE-2020-11023'],
  htmx: ['htmx — "hypermedia on whatever you\'d like"', 'https://htmx.org/'],
  mdnqsa: ['MDN — Document.querySelectorAll()', 'https://developer.mozilla.org/docs/Web/API/Document/querySelectorAll'],
  mdnweak: ['MDN — WeakMap', 'https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/WeakMap'],
  mdnfetch: ['MDN — Fetch API', 'https://developer.mozilla.org/docs/Web/API/Fetch_API'],
};

module.exports = {
  hub: {
    title: 'What aged in jQuery',
    seo: 'What Aged in jQuery (and How jsKjs Fixes It) — a Fair 2026 Review',
    desc: 'jQuery changed the web. Eight honest essays on what aged — weight, selector engine, promises, memory, state, animation, AJAX boilerplate and security — and how jsKjs answers each.',
    lede: 'jQuery taught a generation to write for the web, and jQuery 4.0 is a serious modernisation. But the web it was built to tame has changed. Here is what aged — measured, sourced and fair — and what jsKjs does instead.',
    intro: String.raw`
<p>This series isn't a takedown. jQuery solved real problems — inconsistent DOM APIs, broken event models, painful XHR — so well that browsers adopted its ideas: <code>querySelectorAll</code>, <code>classList</code>, <code>fetch</code>, <code>closest()</code>. jQuery 4.0.0 (January 2026) removed a decade of deprecated APIs and dropped very old browsers.</p>
<p>Some of its foundations, though, were designed for constraints that no longer exist, and some problems it never tried to solve — state, declarative requests, modern motion — became the reason people now load three more libraries next to it. Each essay below names one, explains why it made sense at the time, and shows the jsKjs alternative in code.</p>`,
  },
  items: [
  {
    slug: 'weight', n: 1, title: 'The weight of compatibility',
    seo: 'jQuery 4 File Size in 2026 — and What You Are Paying For',
    desc: 'jQuery 4.0.0 is 26.8 KB gzipped and still supports IE11. Add htmx, Alpine and GSAP and a typical interactive page ships ~90 KB. jsKjs covers the common core of all four in 8.1 KB.',
    lede: 'jQuery 4.0.0 weighs 26.8 KB gzipped — and most interactive sites add three more libraries beside it. Much of that weight pays for problems evergreen browsers already solved.',
    then: 'In 2006 every browser disagreed about events, styles, AJAX and the DOM. A layer that normalised them all was worth almost any size, and jQuery\'s was small for what it did.',
    now: String.raw`<p>jQuery 4.0.0 still supports Internet Explorer 11 — the team has said IE11 support goes in jQuery 5 — so code paths for browsers outside most support matrices still ship to every visitor. And jQuery alone no longer covers what sites need: we measured the official minified builds (gzip -9, npm, October 2026):</p>`,
    sizes: true,
    fix: String.raw`<p>jsKjs targets evergreen browsers only (Chrome/Edge/Firefox 90+, Safari 15+) and leans on what they already do natively: <code>querySelectorAll</code>, <code>classList</code>, <code>fetch</code>, <code>Proxy</code>, <code>WeakMap</code>, <code>requestAnimationFrame</code>. That lets one ~8 KB file carry a jQuery-compatible core <em>and</em> focused versions of the other three.</p>
<p>Honest caveat: jsKjs ports the commonly-used subset of each library, not all of it. The <a href="/compare/">comparison pages</a> list exactly what is and isn't included.</p>`,
    before: { lang: 'html', code: String.raw`<script src="jquery.min.js"></script>        <!-- 26.8 KB -->
<script src="htmx.min.js"></script>          <!-- 16.4 KB -->
<script src="alpine.min.js" defer></script>  <!-- 19.4 KB -->
<script src="gsap.min.js"></script>          <!-- 27.6 KB -->` },
    after: { lang: 'html', code: String.raw`<script src="https://jskjs.org/cdn/1.0.0/jskjs.min.js"></script>  <!-- ~8 KB -->` },
    sources: ['jq4'],
  },
  {
    slug: 'selector-engine', n: 2, title: 'A selector engine the browser already has',
    seo: 'Sizzle vs querySelectorAll: Why Native Selectors Win in 2026',
    desc: 'jQuery 4 inlines its Sizzle-derived selector engine for custom pseudos like :visible. Every modern browser ships a faster, standards-complete engine: querySelectorAll. jsKjs uses it exclusively.',
    lede: 'jQuery shipped its own CSS selector engine because browsers couldn\'t be trusted to have one. Today they all do — and theirs supports <code>:has()</code>.',
    then: 'Before querySelectorAll was universal, jQuery\'s Sizzle engine was the only portable way to select by CSS, and it added handy extensions like :visible, :first and :eq() along the way.',
    now: String.raw`<p>jQuery 4.0 inlined Sizzle into its selector module, dropped legacy pseudos and introduced <code>.even()</code> and <code>.odd()</code> to replace <code>:even</code>/<code>:odd</code>. Custom extensions that remain, such as <code>:visible</code>, still aren't CSS, so selectors using them can't be handed to the browser and fall back to JavaScript matching. Code written against those extensions also doesn't transfer to <code>querySelector</code>, CSS or other tools.</p>`,
    fix: String.raw`<p>jsKjs passes every selector straight to <code>querySelectorAll</code>. No engine is downloaded, every selector your browser supports works — including <code>:has()</code> and <code>:is()</code> — and an invalid selector throws a clear <code>SyntaxError</code> rather than silently matching nothing. Positional needs are methods: <code>.first()</code>, <code>.eq(2)</code>, <code>.filter(fn)</code>.</p>`,
    before: { lang: 'js', code: String.raw`$('li:visible:first');          // jQuery-only syntax
$('tr:even').addClass('zebra');` },
    after: { lang: 'js', code: String.raw`$('li').filter((i, el) => el.offsetParent).first();
$('tr:nth-child(odd)').addClass('zebra');     // real CSS — also works in your stylesheet
$('.card:has(img)').addClass('with-media');   // native :has()` },
    sources: ['jq4', 'mdnqsa'],
  },
  {
    slug: 'promises', n: 3, title: 'jqXHR and the almost-promise',
    seo: 'jqXHR, $.Deferred and Native Promises: Moving jQuery AJAX to fetch',
    desc: 'jQuery AJAX predates native Promises: jqXHR and $.Deferred became Promises/A+ compliant only in 3.0, and jQuery 4\'s slim build removes Deferred entirely. jsKjs $.ajax is fetch with real Promises.',
    lede: 'jQuery invented its own promise before JavaScript had one. Native Promises, <code>fetch</code> and <code>async/await</code> have long since replaced it.',
    then: 'jQuery\'s Deferred (2011) introduced many developers to promises at all, and jqXHR wrapped XMLHttpRequest so callbacks and chaining felt natural years before fetch existed.',
    now: String.raw`<p>Deferreds only became Promises/A+ compliant in jQuery 3.0, and the 4.0 slim build drops Deferreds and Callbacks entirely, noting that native Promises cover most uses. jqXHR is still built on <code>XMLHttpRequest</code>, so cancellation, streaming and the <code>Request</code>/<code>Response</code> objects that the rest of the platform — service workers, the Cache API — speaks are all outside its model.</p>`,
    fix: String.raw`<p>jsKjs's <code>$.ajax</code> is <code>fetch</code> underneath and returns a native Promise. <code>await</code> and <code>try/catch</code> just work; timeouts use <code>AbortController</code>; errors carry <code>.status</code> and the parsed body. For migration, <code>success</code>/<code>error</code> callbacks and <code>.done()</code>/<code>.fail()</code>/<code>.always()</code> are still accepted — without the "unhandled rejection" noise.</p>`,
    before: { lang: 'js', code: String.raw`$.ajax({ url: '/api/user', dataType: 'json' })
  .done(function (user) { render(user); })
  .fail(function (xhr) { alert(xhr.status); });` },
    after: { lang: 'js', code: String.raw`try {
  render(await $.getJSON('/api/user'));
} catch (err) {
  alert(err.status);
}` },
    sources: ['jq4', 'mdnfetch'],
  },
  {
    slug: 'memory', n: 4, title: 'Data in the wrong place',
    seo: 'jQuery .data() Memory Leaks vs WeakMap Storage',
    desc: 'Older jQuery kept element data and handlers in a central cache that could leak when nodes were removed outside jQuery. Modern jQuery improved this; jsKjs uses WeakMap so cleanup is a language guarantee.',
    lede: 'Where you keep data about elements decides whether it leaks. jQuery\'s answer improved over the years; JavaScript now has a built-in one.',
    then: 'With no way to attach arbitrary data to DOM nodes safely, early jQuery kept a central cache keyed by an ID stamped on each element. It worked — as long as every removal went through jQuery.',
    now: String.raw`<p>In older versions, removing nodes with native APIs (or another library) could leave their entries — data and event handlers — behind in that cache. Modern jQuery keeps data on a property of the element itself, which fixed most leaks, but it still writes an expando property onto your nodes, and teardown habits such as "always call <code>.remove()</code>" linger in codebases.</p>`,
    fix: String.raw`<p>jsKjs stores per-element data and handler records in <code>WeakMap</code>s keyed by the element. A <code>WeakMap</code> entry cannot keep its key alive, so when an element is gone — however it was removed — its data goes too. Nothing is written onto your DOM nodes.</p>`,
    before: { lang: 'js', code: String.raw`$('#chart').data('series', hugeArray);
document.getElementById('chart').remove();   // older jQuery: the cache entry could outlive the node` },
    after: { lang: 'js', code: String.raw`$('#chart').data('series', hugeArray);        // stored in a WeakMap
document.getElementById('chart').remove();   // node and data are collected together` },
    sources: ['mdnweak'],
  },
  {
    slug: 'state', n: 5, title: 'No model, only the DOM',
    seo: 'Why jQuery Apps Turn into Spaghetti — and Reactive State Instead',
    desc: 'jQuery has no concept of state: the DOM is the model, and every change is manual synchronisation. jsKjs adds Alpine-style reactivity with kj-data, so the UI follows the data.',
    lede: 'jQuery manipulates the page. It never had a place to keep what the page <em>means</em> — so the meaning ends up scattered across classes, attributes and text.',
    then: 'Pages in 2006 were documents with a little behaviour. Reading state back out of the DOM ("is the menu open? check the class") was perfectly reasonable at that scale.',
    now: String.raw`<p>Modern interfaces have many pieces of state that affect many parts of the page. With only imperative DOM edits, every change must update every dependent element by hand, in the right order — miss one and the UI lies. This is the bug class that pushed teams towards frameworks, often for pages that didn't need a single-page app.</p>`,
    fix: String.raw`<p>Pulse puts state where it is used — <code>kj-data="{ open: false }"</code> — and binds the page to it. Change the value and every <code>kj-text</code>, <code>kj-show</code>, <code>:attr</code> and <code>kj-model</code> that depends on it updates. No build step, no virtual DOM, and the jQuery API is still there for everything else.</p>`,
    before: { lang: 'js', code: String.raw`$('#toggle').on('click', function () {
  const open = !$('#menu').hasClass('open');
  $('#menu').toggleClass('open', open);
  $(this).attr('aria-expanded', open).text(open ? 'Close' : 'Menu');
  $('#overlay').toggle(open);                 // …and every other dependent element
});` },
    after: { lang: 'html', code: String.raw`<div kj-data="{ open: false }">
  <button @click="open = !open" :aria-expanded="open ? 'true' : 'false'" kj-text="open ? 'Close' : 'Menu'"></button>
  <nav id="menu" kj-show="open">…</nav>
  <div id="overlay" kj-show="open"></div>
</div>` },
    sources: [],
  },
  {
    slug: 'animation', n: 6, title: '.animate() stopped at numbers',
    seo: 'jQuery .animate() Limitations: Transforms, Colours, Easing, Sequencing',
    desc: 'jQuery .animate() tweens numeric CSS only — no transforms or colours without plugins, two easings without jQuery UI, and a queue model for sequencing. jsKjs Motion adds transforms, 10 easings, stagger and timelines.',
    lede: '<code>.animate()</code> moves numbers. Modern interfaces move with transforms, rich easing and choreography — which is why GSAP sits on so many jQuery pages.',
    then: 'Before CSS transitions existed, tweening left, top, width and opacity in JavaScript was the only cross-browser animation there was — and jQuery made it one line.',
    now: String.raw`<p><code>.animate()</code> handles single numeric CSS values. Animating <code>transform</code> needs step-function workarounds; colours need the jQuery Color plugin; only <code>swing</code> and <code>linear</code> easing ship without jQuery UI. Sequencing runs through the fx queue (<code>.queue()</code>, <code>.delay()</code>, <code>.stop()</code>), which is hard to reason about once several elements are involved.</p>`,
    fix: String.raw`<p>Motion animates <code>x</code>, <code>y</code>, <code>rotate</code>, <code>scale</code> and <code>skew</code> independently and composes them into one transform per frame, ships ten easings (or takes any function), staggers across collections, sequences with <code>$.timeline()</code>, and returns Promises. The classic <code>.fadeIn()</code>/<code>.slideToggle()</code>/<code>.animate()</code> calls still work, running on the new engine.</p>`,
    before: { lang: 'js', code: String.raw`$('.card').each(function (i) {
  $(this).delay(i * 80).animate({ opacity: 1, top: 0 }, 400, 'swing');
});` },
    after: { lang: 'js', code: String.raw`$.from('.card', { y: 24, opacity: 0, duration: .4, stagger: .08, ease: 'back.out' });` },
    sources: [],
  },
  {
    slug: 'ajax-boilerplate', n: 7, title: 'A handler for every endpoint',
    seo: 'jQuery AJAX Boilerplate vs Declarative HTML Requests (htmx-style)',
    desc: 'Every jQuery AJAX interaction needs JavaScript: bind, serialize, request, parse, render, handle errors. jsKjs Hyper moves the common cases into HTML attributes, htmx-style.',
    lede: 'Ten interactive elements, ten handlers that bind, serialize, request, render and recover. The pattern is so regular it belongs in the markup.',
    then: 'jQuery made AJAX approachable, and wiring each request by hand was the natural way to use it when a page had one or two.',
    now: String.raw`<p>On a page with dozens of interactions, the wiring dwarfs the logic, lives far from the HTML it affects, and is where bugs hide: a forgotten <code>preventDefault</code>, a stale selector after a redesign, an unescaped string. The htmx project popularised the alternative: let HTML describe the request and let the server return HTML.</p>`,
    fix: String.raw`<p>Hyper reads <code>kj-get</code>/<code>kj-post</code>/<code>kj-put</code>/<code>kj-patch</code>/<code>kj-delete</code>, <code>kj-target</code>, <code>kj-swap</code> and <code>kj-trigger</code> and does the wiring for you, including content added later. You keep <code>$.ajax</code> for the cases that genuinely need code.</p>`,
    before: { lang: 'js', code: String.raw`$('#subscribe').on('submit', function (e) {
  e.preventDefault();
  $.post('/subscribe', $(this).serialize())
    .done(function (html) { $('#msg').html(html); })
    .fail(function () { $('#msg').text('Something went wrong'); });
});` },
    after: { lang: 'html', code: String.raw`<form kj-post="/subscribe" kj-target="#msg">…</form>
<p id="msg" aria-live="polite"></p>` },
    sources: ['htmx'],
  },
  {
    slug: 'security', n: 8, title: 'Footguns: HTML strings and deep merges',
    seo: 'jQuery Security Pitfalls: XSS via .html() and Prototype Pollution',
    desc: 'jQuery\'s HTML-string APIs and deep $.extend led to CVE-2020-11022/11023 (XSS) and CVE-2019-11358 (prototype pollution). How jsKjs makes the safe path the short path — and a bug we caught in our own pre-release.',
    lede: 'Two of jQuery\'s most convenient features — "pass me HTML" and "deep-merge these objects" — have been the root of its best-known security advisories.',
    then: 'Accepting HTML strings everywhere made jQuery delightfully terse, and deep $.extend was the obvious way to merge plugin options with user settings.',
    now: String.raw`<p>CVE-2020-11022 and CVE-2020-11023 showed that passing untrusted HTML to methods like <code>.html()</code> and <code>.append()</code> could execute script even after sanitising (fixed in 3.5.0). CVE-2019-11358 showed that <code>$.extend(true, {}, untrustedJson)</code> could modify <code>Object.prototype</code> (fixed in 3.4.0). The fixes are years old, but sites that pinned older versions still ship the vulnerable code, and the underlying habit — building HTML from strings — remains.</p>`,
    fix: String.raw`<p>jsKjs makes the safe option the short one: <code>.text()</code> and <code>kj-text</code> for user content, <code>$.escape()</code> when you must build HTML, and server-rendered fragments for Hyper. Deep <code>$.extend</code> skips <code>__proto__</code>, <code>constructor</code> and <code>prototype</code> keys.</p>
<p><strong>Full disclosure:</strong> our own pre-release <code>$.extend</code> had exactly this prototype-pollution bug. We found it in review before launch, fixed it, and added a regression test. One more caveat: Pulse evaluates expressions with <code>new Function</code>, so strict Content-Security-Policies need <code>'unsafe-eval'</code> on pages that use <code>kj-data</code> — the same trade-off as Alpine's standard build.</p>`,
    before: { lang: 'js', code: String.raw`$('#greeting').html('Hello ' + params.get('name'));    // XSS
$.extend(true, settings, JSON.parse(userJson));         // pre-3.4: prototype pollution` },
    after: { lang: 'js', code: String.raw`$('#greeting').text('Hello ' + params.get('name'));    // always text
$('#card').html('<b>' + $.escape(name) + '</b>');      // escaped when building HTML
$.extend(true, settings, JSON.parse(userJson));         // __proto__ keys are ignored` },
    sources: ['cve2020a', 'cve2020b', 'cve2019'],
  },
  ],
  SRC,
};
