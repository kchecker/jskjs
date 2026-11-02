/* docs-data.js — the jsKjs API reference. Names used in feature pages' `api` lists must match `n` here. */
module.exports = [
{ id: 'core', title: 'Core & selectors', tag: 'ink', intro: 'Everything starts with <code>$()</code>. jsKjs implements jQuery 3.7\'s API; a collection is also a real <code>Array</code> subclass, so <code>for…of</code>, spread and native array methods work. <code>$.fn.jquery</code> reports <code>"3.7.1"</code> so jQuery plugins accept it.', fns: [
  { n: '$()', s: '$(selector [, context]) · $(element | elements) · $(html [, attrs]) · $(fn)', d: 'Select with any CSS selector (native <code>querySelectorAll</code>) or jQuery\'s extensions (<code>:visible</code>, <code>:hidden</code>, <code>:contains()</code>, <code>:first</code>, <code>:last</code>, <code>:eq(n)</code>, <code>:even</code>, <code>:odd</code>, <code>:lt()</code>, <code>:gt()</code>, <code>:input</code>, <code>:checkbox</code>…, <code>[a!=b]</code>, leading <code>&gt; + ~</code>). Also wraps nodes, creates elements from HTML and runs a function on DOM ready.', e: `$('.card')                    // CSS
$('li:visible:first', '#menu') // jQuery extensions + context
$('<a>', { href: '/x', text: 'Go' })
$(() => console.log('ready'));` },
  { n: '.each()', s: '.each((index, element) => {}) → self', d: 'Iterate the collection. <code>this</code> is the element; return <code>false</code> to stop.', e: `$('.item').each(function (i, el) { console.log(i, this === el); });` },
  { n: '.map()', s: '.map((index, element) => value) → collection', d: 'jQuery\'s map: returns a new collection (arrays are flattened, <code>null</code> dropped). Call <code>.get()</code> for a plain array.', e: `const ids = $('[data-id]').map((i, el) => el.dataset.id).get();` },
  { n: '.get()', s: '.get([index]) → element | element[]', d: 'A plain array of the elements, or one element (negative indexes count from the end).', e: `$('.item').get(-1);` },
  { n: '.eq()', s: '.eq(index) → collection', d: 'The element at an index as a new collection.', e: `$('li').eq(1).addClass('second');` },
  { n: '.first() / .last()', s: '.first() · .last() · .even() · .odd() · .slice(start, end)', d: 'Narrow the collection by position.', e: `$('tr').odd().addClass('zebra');` },
  { n: '.index()', s: '.index([selector | element]) → number', d: 'Position among siblings, or of an element within the collection.', e: `$('.active').index();` },
  { n: '.add()', s: '.add(selector | elements | html [, context]) · .addBack([selector]) · .end()', d: 'Grow the collection (in document order), add the previous set back, or return to it.', e: `$('ul').find('li').addClass('a').end().addClass('list');` },
  { n: '$.fn plugins', s: '$.fn.name = function () { return this; } · $.fn.extend({ … })', d: 'Plugins attach to <code>$.fn</code> exactly as with jQuery; <code>window.jQuery</code> points at jsKjs.', e: `$.fn.highlight = function (c = 'yellow') { return this.css('background', c); };` },
]},

{ id: 'content', title: 'Content & values', tag: 'ink', intro: 'Read and write markup, text and form values.', fns: [
  { n: '.html()', s: '.html([html | fn(i, old)]) → string | self', d: 'Get the first element\'s <code>innerHTML</code> or set it on all (data and events of replaced elements are cleaned up).', e: `$('#box').html('<b>New</b>');` },
  { n: '.text()', s: '.text([text | fn(i, old)]) → string | self', d: 'Combined text of all elements, or set <code>textContent</code> (always escaped).', e: `$('#title').text('Safe & sound');` },
  { n: '.val()', s: '.val([value | array | fn(i, old)]) → string | string[] | self', d: 'jQuery semantics: selects return the value (an array for <code>multiple</code>); setting an array checks matching checkboxes/radios and selects matching options. Use <code>.prop(\'checked\')</code> for a checkbox\'s state.', e: `$('#tags').val(['js', 'css']);
$('#agree').prop('checked');` },
]},

{ id: 'attrs', title: 'Attributes, properties & data', tag: 'ink', intro: 'Attributes, DOM properties and per-element data. Data lives in WeakMaps, so nothing is written onto your elements and removed nodes are garbage-collected.', fns: [
  { n: '.attr()', s: '.attr(name) · .attr(name, value | fn | null) · .attr({ … })', d: 'Get or set attributes. <code>null</code> removes; boolean attributes read back as their name. Customise with <code>$.attrHooks</code>.', e: `$('a').attr('href');
$('img').attr({ alt: 'Logo', width: 120 });` },
  { n: '.removeAttr()', s: '.removeAttr("a b c")', d: 'Remove one or more space-separated attributes.', e: `$('input').removeAttr('disabled readonly');` },
  { n: '.prop()', s: '.prop(name [, value]) · .removeProp(name)', d: 'Live DOM properties (<code>checked</code>, <code>disabled</code>, <code>selectedIndex</code>…).', e: `$('#agree').prop('checked', true);` },
  { n: '.data()', s: '.data() · .data(key) · .data(key, value) · .data({ … })', d: 'Per-element data. Reads <code>data-*</code> attributes once, converting JSON, numbers, booleans and null; keys are camelCased.', e: `// <div id="u" data-user='{"id":7}'>
$('#u').data('user').id;  // 7` },
  { n: '.removeData()', s: '.removeData([key | keys]) · $.data(el, k, v) · $.removeData · $.hasData', d: 'Remove stored data; static forms work on any element or object.', e: `$('#u').removeData('user');` },
]},

{ id: 'classes', title: 'Classes & CSS', tag: 'ink', intro: 'Classes accept space-separated strings, arrays or functions. <code>.css()</code> handles units, relative values, custom properties and <code>$.cssHooks</code>.', fns: [
  { n: '.addClass()', s: '.addClass(names | array | fn(i, current))', d: 'Add classes.', e: `$('.card').addClass('is-active pulse');` },
  { n: '.removeClass()', s: '.removeClass([names | array | fn])', d: 'Remove classes (all of them with no argument).', e: `$('.card').removeClass('is-active');` },
  { n: '.toggleClass()', s: '.toggleClass(names [, state]) · .toggleClass(fn)', d: 'Toggle, or force with a boolean.', e: `$('#menu').toggleClass('open', isOpen);` },
  { n: '.hasClass()', s: '.hasClass(name) → boolean', d: 'True if any element has the class.', e: `if ($('body').hasClass('dark')) …` },
  { n: '.css()', s: '.css(name | names[]) · .css(name, value | fn) · .css({ … })', d: 'Computed styles, or set styles. Numbers get <code>px</code> except unitless properties; <code>"+=10"</code> is relative; <code>--custom</code> properties are read and written as-is.', e: `$('.card').css({ marginTop: 20, opacity: .5, '--accent': 'tomato' });
$('.bar').css('width', '+=10');` },
]},

{ id: 'css', title: 'Dimensions, offsets & visibility', tag: 'ink', intro: 'Measurements follow jQuery exactly (box-sizing aware), including setters.', fns: [
  { n: '.width() / .height()', s: '.width([value]) · .innerWidth() · .outerWidth([includeMargin]) (and the height forms)', d: 'Content, padding and border box sizes; all can also set. Works on <code>window</code> and <code>document</code>.', e: `$('.panel').outerHeight(true);
$('.panel').width(320);` },
  { n: '.offset()', s: '.offset() → { top, left } · .offset({ top, left } | fn)', d: 'Position relative to the document; the setter positions the element.', e: `$('#tip').offset({ top: 100, left: 40 });` },
  { n: '.position()', s: '.position() → { top, left } · .offsetParent()', d: 'Position relative to the offset parent.', e: `const { top } = $('.item').position();` },
  { n: '.scrollTop() / .scrollLeft()', s: '.scrollTop([value]) · .scrollLeft([value])', d: 'Read or set scroll position of an element, the document or window.', e: `$(window).scrollTop(0);` },
  { n: '.show() / .hide() / .toggle()', s: '.show() · .hide() · .toggle([state]) — or with a duration to animate', d: 'Instant forms remember the original <code>display</code>; pass a speed for the animated jQuery effects.', e: `$('.tip').toggle();
$('.panel').hide('fast');` },
]},

{ id: 'insert', title: 'Manipulation', tag: 'ink', intro: 'Insert HTML strings, elements, collections or arrays — several at once. Scripts in inserted HTML run, as in jQuery.', fns: [
  { n: '.append() / .prepend()', s: '.append(content…) · .prepend(content…) · fn(i, html) form', d: 'Insert inside each element, at the end or start. With several targets, content is cloned for all but the last.', e: `$('#list').append('<li>New</li>', $('#template').clone());` },
  { n: '.before() / .after()', s: '.before(content…) · .after(content…)', d: 'Insert next to each element.', e: `$('.item').first().before('<h3>Top</h3>');` },
  { n: '.appendTo() / .prependTo()', s: '.appendTo(target) · .prependTo · .insertBefore · .insertAfter · .replaceAll', d: 'The same insertions, with the content first.', e: `$('<li>Hi</li>').appendTo('#list');` },
  { n: '.replaceWith()', s: '.replaceWith(content | fn)', d: 'Replace each element.', e: `$('.old').replaceWith('<p class="new">Updated</p>');` },
  { n: '.wrap()', s: '.wrap(html) · .wrapAll(html) · .wrapInner(html) · .unwrap([selector])', d: 'Wrap each element, all together, or their contents; or remove the parent.', e: `$('img').wrap('<figure></figure>');` },
  { n: '.remove()', s: '.remove([selector]) · .detach([selector])', d: '<code>.remove()</code> cleans data, events and jsKjs state; <code>.detach()</code> keeps them for re-insertion.', e: `const $row = $('#row').detach();
$('#table').append($row);` },
  { n: '.empty()', s: '.empty()', d: 'Remove all children (with cleanup).', e: `$('#results').empty();` },
  { n: '.clone()', s: '.clone([withDataAndEvents [, deep]])', d: 'Deep copy; optionally with data and handlers.', e: `$('#template').clone(true).appendTo('#list');` },
]},

{ id: 'traversal', title: 'Traversal & filtering', tag: 'ink', intro: 'Walk the tree; every method returns a new, de-duplicated collection in document order.', fns: [
  { n: '.find()', s: '.find(selector | element | collection)', d: 'Descendants. Selectors are scoped to each element, including leading combinators: <code>.find("&gt; li")</code>.', e: `$('#nav').find('> li > a');` },
  { n: '.filter()', s: '.filter(selector | fn(i, el) | element | collection)', d: 'Keep matches. Positional selectors count within the collection.', e: `$('input').filter((i, el) => !el.value);` },
  { n: '.not()', s: '.not(selector | fn | element | collection)', d: 'Drop matches.', e: `$('.item').not('.sold-out').show();` },
  { n: '.is()', s: '.is(selector | fn | element | collection) → boolean', d: 'Does anything match?', e: `if ($(e.target).is('button:disabled')) return;` },
  { n: '.has()', s: '.has(selector | element)', d: 'Keep elements that contain a match.', e: `$('li').has('ul').addClass('has-sub');` },
  { n: '.closest()', s: '.closest(selector [, context])', d: 'Nearest ancestor-or-self that matches.', e: `$(e.target).closest('.card');` },
  { n: '.parent() / .parents()', s: '.parent([sel]) · .parents([sel]) · .parentsUntil(stop [, sel])', d: 'Up the tree.', e: `$('a').parents('section');` },
  { n: '.children()', s: '.children([sel]) · .contents()', d: 'Element children, or all child nodes (and an iframe\'s document).', e: `$('ul').children('.active');` },
  { n: '.siblings()', s: '.siblings([sel])', d: 'Other children of the same parent.', e: `$(this).addClass('on').siblings().removeClass('on');` },
  { n: '.next() / .prev()', s: '.next / .prev / .nextAll / .prevAll / .nextUntil / .prevUntil ([sel])', d: 'Sideways.', e: `$('h2').nextUntil('h2', 'p');` },
]},

{ id: 'events', title: 'Events', tag: 'ink', intro: 'jQuery\'s event system: handlers receive a <code>jQuery.Event</code> (with <code>originalEvent</code>), namespaces, delegation, <code>$.event.special</code> and <code>return false</code>. Native <code>CustomEvent</code>s (like Hyper\'s) pass their <code>detail</code> as the second argument.', fns: [
  { n: '.on()', s: '.on(events [, selector] [, data], handler) · .on({ event: fn })', d: 'Bind, optionally delegated and namespaced (<code>click.menu</code>).', e: `$('#list').on('click.app', 'li', function (e) { $(this).toggleClass('done'); });` },
  { n: '.off()', s: '.off([events] [, selector] [, handler])', d: 'Unbind by type, namespace, selector or handler; <code>.off()</code> removes all.', e: `$('#list').off('.app');` },
  { n: '.one()', s: '.one(events [, selector] [, data], handler)', d: 'Run once per element and type.', e: `$('#dialog').one('close', () => save());` },
  { n: '.trigger()', s: '.trigger(type | $.Event [, args]) · .triggerHandler(type [, args])', d: 'Fire handlers (and native behaviour like <code>click()</code>/<code>focus()</code>); extra arguments arrive after the event.', e: `$('#cart').trigger('cart:add', [{ id: 7 }]);
$('#cart').on('cart:add', (e, item) => console.log(item.id));` },
  { n: '.hover()', s: '.hover(enter [, leave]) · .bind / .unbind / .delegate / .undelegate', d: 'Convenience and legacy binders.', e: `$('.tile').hover(function () { $(this).addClass('lift'); }, function () { $(this).removeClass('lift'); });` },
  { n: 'Shortcuts', s: '.click([fn]) .dblclick .focus .blur .focusin .focusout .change .submit .select .keydown .keyup .keypress .mouse… .resize .scroll .contextmenu', d: 'With a handler they bind; without one they trigger.', e: `$('#save').click(save);
$('#save').click();` },
  { n: '.focus() / .blur()', s: '.focus([fn]) · .blur([fn])', d: 'Bind or trigger focus — triggering also moves real focus.', e: `$('#email').focus();` },
  { n: '$.Event', s: '$.Event(type [, props]) · $.event.special[type] = { setup, teardown, add, remove, handle, delegateType, bindType }', d: 'Create events to trigger, or define custom event types the way jQuery plugins do.', e: `const e = $.Event('keydown', { key: 'Escape' });
$(document).trigger(e);` },
]},

{ id: 'ajax', title: 'AJAX', tag: 'violet', intro: 'jQuery\'s <code>$.ajax</code>: a jqXHR with <code>.done/.fail/.always/.then</code>, every option, global events, <code>$.ajaxSetup</code>, prefilters, transports, converters and JSONP. It is a thenable, so <code>await</code> works: it resolves with the data and a failure throws the jqXHR.', fns: [
  { n: '$.ajax()', s: '$.ajax(url [, options]) · $.ajax(options) → jqXHR', d: 'All jQuery options (<code>type</code>/<code>method</code>, <code>data</code>, <code>dataType</code>, <code>headers</code>, <code>timeout</code>, <code>cache</code>, <code>contentType</code>, <code>processData</code>, <code>beforeSend</code>, <code>statusCode</code>, <code>xhrFields</code>…). jsKjs extra: <code>json: true</code> sends <code>data</code> as JSON.', e: `try {
  const user = await $.ajax({ url: '/api/user', dataType: 'json', timeout: 5000 });
} catch (xhr) { console.log(xhr.status, xhr.statusText); }` },
  { n: '$.get()', s: '$.get(url [, data] [, success] [, dataType]) · $.post(…)', d: 'Shorthands.', e: `$.post('/api/notes', { text: 'Hi' }).done(html => $('#notes').append(html));` },
  { n: '$.post()', s: '$.post(url [, data] [, success] [, dataType])', d: 'POST shorthand (form-encoded unless you pass a string or <code>json: true</code> via <code>$.ajax</code>).', e: `await $.post('/api/save', $('#form').serialize());` },
  { n: '$.getJSON()', s: '$.getJSON(url [, data] [, success]) · $.getScript(url [, success])', d: 'JSON and script shorthands. A <code>?callback=?</code> URL makes it JSONP.', e: `const rows = await $.getJSON('/api/rows.json');` },
  { n: '$.ajaxSetup()', s: '$.ajaxSetup(options) · $.ajaxPrefilter([types,] fn) · $.ajaxTransport([types,] fn)', d: 'Defaults for every request, and jQuery\'s extension points.', e: `$.ajaxSetup({ headers: { 'X-CSRF-Token': token } });` },
  { n: '.load()', s: '.load(url[" selector"] [, data] [, complete])', d: 'Fetch HTML into elements, optionally just a fragment of the response.', e: `$('#news').load('/news.html #headlines');` },
  { n: '.serialize()', s: '.serialize() · .serializeArray() · .serializeObject() · $.param(obj [, traditional])', d: 'Form values in jQuery\'s formats; <code>.serializeObject()</code> is a jsKjs extra.', e: `$('#signup').serializeObject();  // { email: '…', plan: 'pro' }` },
  { n: '.serializeObject()', s: '.serializeObject() → { name: value | value[] }', d: 'A plain object of successful form controls (repeated names and <code>name[]</code> become arrays).', e: `const body = $('#form').serializeObject();` },
  { n: 'Global AJAX events', s: 'ajaxStart ajaxSend ajaxSuccess ajaxError ajaxComplete ajaxStop', d: 'Fired on <code>document</code> (or the <code>context</code> element) unless <code>global: false</code>.', e: `$(document).on('ajaxStart', () => $('#spinner').show()).on('ajaxStop', () => $('#spinner').hide());` },
]},

{ id: 'deferred', title: 'Deferred, Callbacks & queues', tag: 'ink', intro: 'jQuery\'s async primitives, with Promises/A+ <code>.then()</code>.', fns: [
  { n: '$.Deferred()', s: '$.Deferred([fn]) → resolve/reject/notify(+With), done/fail/progress/always/then/catch/pipe/promise/state', d: 'jQuery\'s deferreds; awaitable.', e: `const d = $.Deferred();
d.done(v => console.log(v));
d.resolve(42);` },
  { n: '$.when()', s: '$.when(...thenables | values) → promise', d: 'Resolve when all resolve; each result is passed as its own argument.', e: `$.when($.get('/a'), $.get('/b')).then((a, b) => …);` },
  { n: '$.Callbacks()', s: '$.Callbacks("once memory unique stopOnFalse")', d: 'A callback list with jQuery\'s flags.', e: `const cb = $.Callbacks('memory'); cb.add(fn); cb.fire(1);` },
  { n: '.queue()', s: '.queue([name] [, fn | array]) · .dequeue · .clearQueue · .delay(ms) · .promise([name])', d: 'Named function queues; <code>fx</code> is the animation queue.', e: `$('#box').fadeOut().delay(500).fadeIn();
await $('#box').promise();` },
]},

{ id: 'effects', title: 'jQuery effects', tag: 'amber', intro: 'jQuery\'s own effects engine — <strong>durations in milliseconds</strong>, the <code>fx</code> queue, <code>step</code>/<code>progress</code> callbacks, <code>$.fx</code> settings and easing plugins. Easing names also accept GSAP and CSS eases (<code>"power2.out"</code>, <code>"ease-in-out"</code>).', fns: [
  { n: '.fadeIn() / .fadeOut() / .fadeToggle()', s: '.fadeIn([ms | "slow" | "fast"] [, easing] [, done]) · .fadeTo(ms, opacity)', d: 'Fade with display handling.', e: `$('.toast').fadeIn(200).delay(2000).fadeOut();` },
  { n: '.slideDown() / .slideUp() / .slideToggle()', s: '.slideDown([duration] [, easing] [, done])', d: 'Height-based reveal.', e: `$('.panel').slideToggle('fast');` },
  { n: '.animate()', s: '.animate(props, [duration] [, easing] [, done]) · .animate(props, options)', d: 'Numeric CSS (with units and <code>+=</code>), scroll positions and <code>"show"</code>/<code>"hide"</code>/<code>"toggle"</code>. Options: <code>duration</code>, <code>easing</code>, <code>queue</code>, <code>specialEasing</code>, <code>step</code>, <code>progress</code>, <code>start</code>, <code>complete</code>, <code>done</code>, <code>fail</code>, <code>always</code>.', e: `$('#box').animate({ left: '+=50', opacity: .5 }, 400, 'power2.out');` },
  { n: '.stop()', s: '.stop([queue] [, clearQueue] [, jumpToEnd]) · .finish([queue])', d: 'Stop the running animation; <code>.finish()</code> completes everything queued.', e: `$('#box').stop(true, true);` },
  { n: '$.fx', s: '$.fx.off · $.fx.speeds · $.fx.interval · $.easing · $.Tween · $.Animation', d: 'Global settings and jQuery\'s extension points.', e: `$.fx.off = matchMedia('(prefers-reduced-motion: reduce)').matches;` },
]},

{ id: 'utilities', title: 'Utilities', tag: 'ink', intro: 'jQuery\'s statics — including jQuery 3\'s deprecated ones, kept for older plugins — plus a few jsKjs extras.', fns: [
  { n: '$.each()', s: '$.each(arrayOrObject, (key, value) => {})', d: 'Iterate arrays, array-likes and objects; return <code>false</code> to stop.', e: `$.each({ a: 1 }, (k, v) => console.log(k, v));` },
  { n: '$.map()', s: '$.map(arrayOrObject, (value, key) => result)', d: 'Map and flatten; <code>null</code> results are dropped.', e: `$.map([1, 2, 3], n => n > 1 ? n * 2 : null); // [4, 6]` },
  { n: '$.extend()', s: '$.extend([deep], target, ...sources)', d: 'Shallow or deep merge (no prototype pollution). With one argument, extends <code>$</code>.', e: `const opts = $.extend(true, {}, defaults, user);` },
  { n: '$.param()', s: '$.param(obj [, traditional])', d: 'URL-encode an object the way jQuery does (<code>a[]=1&amp;b[c]=2</code>).', e: `$.param({ q: 'kj', tags: ['a', 'b'] });` },
  { n: '$.parseHTML()', s: '$.parseHTML(html [, context] [, keepScripts]) · $.parseXML(xml)', d: 'Parse markup into nodes (scripts dropped unless asked).', e: `$('#out').append($.parseHTML(serverHtml));` },
  { n: 'Type checks', s: '$.isPlainObject · $.isEmptyObject · $.isArray · $.isFunction · $.isNumeric · $.isWindow · $.type · $.isXMLDoc · $.contains', d: 'Classic checks.', e: `$.isPlainObject({});  // true` },
  { n: 'Array helpers', s: '$.grep · $.inArray · $.merge · $.makeArray · $.uniqueSort · $.trim · $.proxy · $.now · $.noop', d: 'jQuery\'s helpers.', e: `$.grep([1, 2, 3], n => n > 1);  // [2, 3]` },
  { n: '$.debounce()', s: '$.debounce(fn, ms = 300, { leading, trailing }) → fn (.cancel, .flush)', d: 'jsKjs extra: run after calls stop for <code>ms</code>.', e: `$('#q').on('input', $.debounce(search, 250));` },
  { n: '$.throttle()', s: '$.throttle(fn, ms = 300) → fn (.cancel)', d: 'jsKjs extra: at most once per <code>ms</code>.', e: `$(window).on('scroll', $.throttle(updateHeader, 100));` },
  { n: '$.escape()', s: '$.escape(text) → html-safe text', d: 'jsKjs extra: escape <code>&amp; &lt; &gt; " \'</code>.', e: `$('#out').html('<b>' + $.escape(name) + '</b>');` },
  { n: '$.uuid()', s: '$.uuid() → string', d: 'jsKjs extra: a random UUID v4.', e: `const id = $.uuid();` },
  { n: '$.noConflict()', s: '$.noConflict([removeAll]) → $', d: 'Give back <code>window.$</code> (and <code>window.jQuery</code> with <code>true</code>). <code>window.kj</code> and <code>window.jsKjs</code> stay.', e: `const kj = $.noConflict();` },
  { n: '$.version', s: '$.version · $.fn.jskjs · $.fn.jquery', d: 'jsKjs version, and the jQuery API level (<code>"3.7.1"</code>).', e: `console.log($.version);` },
]},

{ id: 'hyper', title: 'Hyper — htmx-style requests', tag: 'violet', intro: 'Describe requests in HTML. <code>kj-*</code> attributes (or htmx\'s <code>hx-*</code>), inherited from ancestors like htmx. New content is processed automatically.', fns: [
  { n: 'kj-get / kj-post / kj-put / kj-patch / kj-delete', s: '<el kj-get="/url">', d: 'Issue a request. Forms send their fields; inside a form, non-GET requests include it. GET and DELETE put values in the query string. Default trigger: forms <code>submit</code>, inputs <code>change</code>, else <code>click</code>.', e: `<button kj-post="/api/like" kj-target="#likes">Like</button>` },
  { n: 'kj-target', s: 'kj-target="css | this | closest X | find X | next [X] | previous [X]"', d: 'Where the response goes.', e: `<button kj-delete="/row/7" kj-target="closest tr" kj-swap="outerHTML">✕</button>` },
  { n: 'kj-swap', s: 'kj-swap="innerHTML | outerHTML | beforebegin | afterbegin | beforeend | afterend | delete | none | textContent [swap:Ns settle:Ns scroll:top show:… focus-scroll:true transition:true ignoreTitle:true]"', d: 'How it goes in, with htmx\'s modifiers (View Transitions for <code>transition:true</code>).', e: `<div kj-get="/feed" kj-swap="beforeend scroll:bottom"></div>` },
  { n: 'kj-trigger', s: 'kj-trigger="event[filter] once changed delay:… throttle:… from:… target:… consume queue:…, load, revealed, intersect, every 2s"', d: 'What starts the request.', e: `<input name="q" kj-get="/search" kj-trigger="input changed delay:300ms" kj-target="#hits">` },
  { n: 'kj-select', s: 'kj-select="css" · kj-select-oob="#a, #b:innerHTML" · kj-swap-oob="true | swap:css" · kj-preserve', d: 'Pick part of the response; swap extra pieces elsewhere; keep live elements.', e: `<span id="count" kj-swap-oob="true">3</span>` },
  { n: 'kj-confirm', s: 'kj-confirm="Sure?" · kj-prompt="Name?"', d: 'Ask first (listen for <code>kj:confirm</code> to use your own dialog). The prompt answer is sent as <code>HX-Prompt</code>.', e: `<button kj-delete="/note/3" kj-confirm="Delete this note?">Delete</button>` },
  { n: 'kj-indicator', s: 'kj-indicator="css" · kj-disabled-elt="css | this"', d: 'Elements get the <code>kj-request</code> class during the request (<code>.kj-indicator</code> fades in); disabled elements are re-enabled after.', e: `<button kj-post="/save" kj-indicator="#spin" kj-disabled-elt="this">Save</button>` },
  { n: 'kj-include / kj-vals', s: 'kj-include="css" · kj-vals=\'{"a":1}\' | "js:{ … }" · kj-headers · kj-params="* | none | a,b | not a" · kj-encoding · kj-request=\'{"timeout":5000}\'', d: 'Shape what is sent.', e: `<button kj-post="/cart" kj-vals='{"qty": 1}' kj-include="#size">Add</button>` },
  { n: 'kj-push-url', s: 'kj-push-url="true | url" · kj-replace-url · kj-boost="true" · kj-history-elt · kj-history="false"', d: 'History. Boosted links and forms become AJAX navigation with snapshots restored on Back.', e: `<body kj-boost="true">` },
  { n: 'kj-sync', s: 'kj-sync="closest form:abort | this:drop | replace | queue last"', d: 'Coordinate requests between elements.', e: `<input kj-get="/validate" kj-sync="closest form:abort">` },
  { n: 'Lifecycle events', s: 'kj:config · kj:before · kj:after · kj:beforeSwap · kj:afterSwap · kj:afterSettle · kj:load · kj:error · kj:confirm · kj:historyRestore …', d: 'Native CustomEvents with a <code>detail</code>; <code>kj:config</code>, <code>kj:before</code> and <code>kj:beforeSwap</code> are cancelable and editable.', e: `$(document).on('kj:config', (e, d) => { d.headers['X-CSRF'] = token; });` },
  { n: 'HX headers', s: 'Request: HX-Request, HX-Trigger, HX-Target, HX-Current-URL… · Response: HX-Redirect, HX-Location, HX-Refresh, HX-Retarget, HX-Reswap, HX-Reselect, HX-Trigger(-After-Swap/-Settle), HX-Push-Url, HX-Replace-Url; status 204 and 286', d: 'Server code written for htmx works unchanged (<code>KJ-*</code> response names too).', e: `header('HX-Trigger: {"saved": {"id": 7}}');` },
  { n: '$.hyper', s: '$.hyper.ajax(verb, url, target | { target, swap, values, headers, select }) · $.hyper.swap · $.hyper.config · $.hyper.defineSwap · $.process(el)', d: 'Programmatic access.', e: `$.hyper.ajax('get', '/sidebar', '#side');` },
]},

{ id: 'pulse', title: 'Pulse — Alpine-style reactivity', tag: 'teal', intro: 'State declared in markup with fine-grained reactivity. <code>kj-*</code> directives (Alpine\'s <code>x-*</code> also work). Updates are batched in a microtask; <code>await $.nextTick()</code> to read the DOM after a change.', fns: [
  { n: 'kj-data', s: 'kj-data="{ … }" · kj-data="component(args)" · init() · destroy()', d: 'Declare a component. Nested components see their parents.', e: `<div kj-data="{ open: false, toggle() { this.open = !this.open } }">` },
  { n: 'kj-text / kj-html', s: 'kj-text="expr" · kj-html="expr"', d: 'Set text (escaped) or HTML (directives inside are processed).', e: `<span kj-text="items.length + ' items'"></span>` },
  { n: 'kj-show', s: 'kj-show="expr" (.important) · kj-transition[.duration.300ms.opacity.scale.90] · kj-transition:enter="…" …', d: 'Toggle display, optionally with transitions.', e: `<div kj-show="open" kj-transition>…</div>` },
  { n: 'kj-if / kj-for', s: '<template kj-if="expr"> · <template kj-for="(item, i) in items" :key="item.id">', d: 'Add/remove DOM; keyed lists over arrays, objects or ranges.', e: `<template kj-for="todo in todos" :key="todo.id"><li kj-text="todo.title"></li></template>` },
  { n: 'kj-model', s: 'kj-model[.lazy .number .trim .boolean .debounce.500ms .throttle .fill]="path"', d: 'Two-way binding for inputs, checkboxes (booleans or arrays), radios and selects.', e: `<input kj-model.number="qty" type="number">` },
  { n: '@event / kj-on:event', s: '@click.prevent.stop.self.once.outside.window.document.passive.capture.debounce.throttle · @keydown.enter.shift', d: 'Event handlers; the expression may call a method by name. <code>@kj:after-swap</code> listens to Hyper events.', e: `<form @submit.prevent="save()"><input @keydown.escape="cancel()"></form>` },
  { n: ':attr / kj-bind:attr', s: ':attr="expr" · :class="{ on: x }" · :style="{ color }" · kj-bind="{ … }"', d: 'Bind attributes; object syntax for class and style; <code>false</code>/<code>null</code> removes, <code>aria-*</code> gets "true"/"false".', e: `<button :class="{ active: tab === 1 }" :aria-pressed="tab === 1">One</button>` },
  { n: 'kj-init / kj-effect', s: 'kj-init="expr" · kj-effect="expr" · kj-ref="name" · kj-cloak · kj-ignore · kj-id="[\'name\']" · <template kj-teleport="body">', d: 'The rest of Alpine\'s directives.', e: `<div kj-init="load()" kj-cloak>…</div>` },
  { n: 'Magics', s: '$el · $refs · $root · $data · $store · $dispatch(name, detail) · $watch(expr, cb) · $nextTick() · $id(name) · $event', d: 'Available inside every expression.', e: `<div kj-init="$watch('q', v => search(v))">` },
  { n: '$.component()', s: '$.component(name, (...args) => state)', d: 'Register a reusable component (Alpine.data).', e: `$.component('counter', (n = 0) => ({ n, inc() { this.n++; } }));` },
  { n: '$.store()', s: '$.store(name, value) · $.store(name)', d: 'Global reactive stores, read in markup as <code>$store.name</code>.', e: `$.store('cart', { items: [], get total() { return this.items.length; } });` },
  { n: '$.reactive()', s: '$.reactive(obj) · $.effect(fn) → stop · $.watch(getter, cb) · $.nextTick() · $.$data(el)', d: 'The reactivity primitives.', e: `const s = $.reactive({ n: 0 });
$.effect(() => console.log(s.n));` },
  { n: '$.directive()', s: '$.directive(name, (el, { value, modifiers, expression }, { effect, evaluate, cleanup }) => {}) · $.magic(name, el => value)', d: 'Extend Pulse like Alpine.directive / Alpine.magic.', e: `$.directive('upper', (el, { expression }, { effect, evaluate }) => effect(() => { el.textContent = String(evaluate(expression)).toUpperCase(); }));` },
]},

{ id: 'motion', title: 'Motion — GSAP-style animation', tag: 'amber', intro: 'A time-based engine with GSAP\'s API. <strong>Durations in seconds.</strong> Tweens and timelines are controllable and awaitable.', fns: [
  { n: '$.to()', s: '$.to(targets, { …props, duration, delay, ease, stagger, repeat, yoyo, repeatDelay, onStart, onUpdate, onComplete, paused, overwrite, keyframes }) → tween', d: 'Animate to values: transforms (<code>x y xPercent rotate scale skewX z rotationX…</code>), any CSS (colours, units), CSS variables, <code>attr: {}</code> for SVG, <code>autoAlpha</code>, scroll positions, plain object properties. Relative (<code>"+=50"</code>), function and <code>"random(0, 100)"</code> values.', e: `await $.to('.card', { y: -8, rotate: 2, duration: .4, ease: 'back.out(2)', stagger: .05 });` },
  { n: '$.from()', s: '$.from(targets, vars) → tween', d: 'Animate from the given values to the current ones.', e: `$.from('.hero h1', { y: 30, opacity: 0 });` },
  { n: '$.fromTo()', s: '$.fromTo(targets, fromVars, toVars) → tween · $.set(targets, vars)', d: 'Explicit start and end; <code>$.set</code> applies instantly.', e: `$.fromTo('#bar', { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left' });` },
  { n: 'Tween control', s: '.play() .pause() .resume() .reverse() .restart() .seek(t) .progress(p) .time() .timeScale(s) .kill() .then() .duration() .isActive()', d: 'Every tween and timeline.', e: `const t = $.to('#ring', { rotate: 360, duration: 2, repeat: -1, ease: 'none' });
t.timeScale(.5);` },
  { n: '$.timeline()', s: '$.timeline({ defaults, paused, repeat, yoyo, onComplete… }) → .to .from .fromTo .set .add .call .addLabel .addPause .tweenTo', d: 'Sequence with positions: number, <code>"label"</code>, <code>"&lt;"</code>, <code>"&gt;"</code>, <code>"+=0.2"</code>, <code>"-=0.2"</code>, <code>"label+=1"</code>; nest timelines.', e: `const tl = $.timeline({ defaults: { duration: .5, ease: 'power2.out' } })
  .from('.hero h1', { y: 30 })
  .from('.hero p', { y: 30 }, '<.1')
  .addLabel('cta')
  .from('.cta', { scale: .8 }, 'cta');` },
  { n: 'stagger', s: 'stagger: 0.1 · { each | amount, from: "center" | "end" | "edges" | "random" | index | [x, y], grid: [rows, cols] | "auto", axis, ease }', d: 'Offset each target\'s start.', e: `$.from('.cell', { scale: 0, stagger: { grid: 'auto', from: 'center', amount: .6 } });` },
  { n: 'Easings', s: 'power0-4 · sine · expo · circ · back(overshoot) · elastic(amp, period) · bounce, each .in .out .inOut · steps(n) · cubic-bezier() · CSS names · jQuery UI names · functions', d: 'All exposed as <code>$.easings</code>; parse any with <code>$.parseEase()</code>.', e: `$.to('.dot', { y: 100, ease: 'elastic.out(1, .4)' });` },
  { n: 'Motion utilities', s: '$.quickTo · $.quickSetter · $.getProperty · $.killTweensOf · $.isTweening · $.getTweensOf · $.delayedCall · $.ticker · $.defaults · $.utils (clamp, mapRange, normalize, interpolate, random, snap, wrap, wrapYoyo, distribute, pipe, splitColor)', d: 'GSAP\'s helpers.', e: `const followX = $.quickTo('#cursor', 'x', { duration: .3 });
$(document).on('pointermove', e => followX(e.clientX));` },
  { n: '.to()', s: '$(sel).to(vars) → collection', d: 'Chainable shortcut for <code>$.to(this, vars)</code>.', e: `$('.badge').to({ scale: 1.2, yoyo: true, repeat: 1 });` },
]},

{ id: 'addons', title: 'Add-ons (optional files)', tag: 'amber', intro: 'Load after <code>jskjs.js</code> when you need them — each is a separate file on the CDN.', fns: [
  { n: 'jskjs.scroll.js', s: 'scrollTrigger: { trigger, start, end, scrub, pin, snap, toggleActions, toggleClass, markers, once, onEnter… } · $.scrollTrigger(vars) · $.scrollTo(target, { duration, offset })', d: 'ScrollTrigger-style scroll-linked animation and smooth scrolling.', e: `$.to('.bar', { scaleX: 1, scrollTrigger: { trigger: '.story', start: 'top top', end: '+=800', scrub: true, pin: true } });` },
  { n: 'jskjs.flip.js', s: '$.Flip.getState(targets) · $.Flip.from(state, { duration, ease, stagger, absolute, scale, onEnter, onLeave }) · $(sel).flip(changeFn, vars)', d: 'Animate any layout change.', e: `$('.card').flip(() => $('#grid').toggleClass('list'), { duration: .5 });` },
  { n: 'jskjs.drag.js', s: '$.Draggable.create(target, { type, bounds, inertia, snap, liveSnap, edgeResistance, lockAxis, onDrag… }) · $(sel).draggable(vars) · $.Draggable.hitTest(a, b)', d: 'Pointer, touch and keyboard dragging.', e: `$.Draggable.create('#knob', { type: 'x', bounds: '#track', snap: { x: v => Math.round(v / 20) * 20 } });` },
  { n: 'jskjs.split.js', s: '$.splitText(target, { type: "lines,words,chars", mask, aria, autoSplit, onSplit }) → { lines, words, chars, revert() }', d: 'Split text for animation, accessibly.', e: `const s = $.splitText('h1', { type: 'chars', mask: 'chars' });
$.from(s.chars, { y: '100%', stagger: .02 });` },
  { n: 'jskjs.ui.js', s: '$persist(v).as(key) · kj-intersect[.once.half] · kj-trap[.inert.noscroll] + $focus · kj-collapse[.duration.min] · kj-mask="99/99/9999" + $money · kj-resize', d: 'Alpine\'s official plugins, as Pulse directives.', e: `<div kj-data="{ open: $persist(false) }"><div kj-show="open" kj-collapse>…</div></div>` },
  { n: 'jskjs.live.js', s: 'kj-sse-connect="/stream" · kj-sse-swap="event" · kj-trigger="sse:event" · kj-ws-connect="/ws" · kj-ws-send', d: 'Server-Sent Events and WebSockets for Hyper.', e: `<ul kj-sse-connect="/updates" kj-sse-swap="message" kj-swap="beforeend"></ul>` },
]},
];
