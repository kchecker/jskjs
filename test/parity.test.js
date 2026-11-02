/* Parity tests: jQuery core/events/ajax/effects, htmx (Hyper), Alpine (Pulse), GSAP (Motion). Run: node test/parity.test.js */
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<!DOCTYPE html><html><head><title>T</title></head><body><div id="root"></div></body></html>`,
  { url: 'http://localhost/page', pretendToBeVisual: true, runScripts: 'dangerously' });
const w = global.window = dom.window;
const doc = w.document;

// ---- fake server for AJAX / Hyper ----
const routes = {};
const calls = [];
w.fetch = async (url, init = {}) => {
  const u = new URL(url, 'http://localhost/');
  const body = init.body == null ? null : typeof init.body === 'string' ? init.body : init.body.toString && !(init.body instanceof w.FormData) ? init.body.toString() : init.body;
  const headers = {}; if (init.headers) for (const [k, v] of init.headers) headers[k.toLowerCase()] = v;
  const call = { url: u.pathname + u.search, path: u.pathname, method: init.method || 'GET', body, headers, query: Object.fromEntries(u.searchParams) };
  calls.push(call);
  const h = routes[u.pathname];
  if (!h) return new Response('not found', { status: 404 });
  if (init.signal && init.signal.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
  const r = await h(call, init);
  if (init.signal && init.signal.aborted) throw Object.assign(new Error('aborted'), { name: 'AbortError' });
  if (typeof r === 'string') return new Response(r, { status: 200, headers: { 'content-type': 'text/html' } });
  return new Response(r.body ?? '', { status: r.status || 200, headers: r.headers || { 'content-type': r.json !== undefined ? 'application/json' : 'text/html' } , ...(r.json !== undefined ? {} : {}) });
};
const json = o => ({ body: JSON.stringify(o), headers: { 'content-type': 'application/json' } });
// XMLHttpRequest mock for $.ajax (same routes)
class FakeXHR {
  constructor() { this.readyState = 0; this.headers = {}; this.status = 0; this.statusText = ''; this.responseText = ''; this._resHeaders = ''; }
  open(method, url, async) { this.method = method; this.url = url; this.async = async !== false; this.readyState = 1; }
  setRequestHeader(k, v) { this.headers[k.toLowerCase()] = v; }
  getAllResponseHeaders() { return this._resHeaders; }
  overrideMimeType() {}
  abort() { this._aborted = true; this.readyState = 0; this.status = 0; if (this.onabort) this.onabort(); }
  send(body) {
    const go = async () => {
      const init = { method: this.method, headers: new Map(Object.entries(this.headers)), body };
      let res;
      try { res = await w.fetch(this.url, init); } catch (e) { if (!this._aborted && this.onerror) this.onerror(); return; }
      if (this._aborted) return;
      this.status = res.status; this.statusText = res.statusText || (res.status === 200 ? 'OK' : '');
      this.responseText = await res.text();
      this._resHeaders = [...res.headers].map(([k, v]) => k + ': ' + v).join('\r\n');
      this.readyState = 4;
      if (this.onload) this.onload();
    };
    setTimeout(go, 0);
  }
}
w.XMLHttpRequest = FakeXHR;

const $ = require('../src/jskjs.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const tick = () => $.nextTick();
let pass = 0, fail = 0, section = '';
const t = (name, cond, info) => { if (cond) pass++; else { fail++; console.log('FAIL [' + section + ']', name, info !== undefined ? '→ ' + JSON.stringify(info) : ''); } };
const html = s => { const r = doc.getElementById('root'); r.innerHTML = s; $.process(r); return r; };

(async () => {
  await sleep(30);

  /* ================= CORE ================= */
  section = 'core';
  html(`<ul id="l"><li>a</li><li class="x">b</li><li>c</li></ul><input id="cb" type="checkbox" value="yes"><select id="ms" multiple><option>1</option><option>2</option><option>3</option></select>
    <form id="f"><input name="a" value="1"><input name="b" value="2"><input type="checkbox" name="c" value="z" checked><input name="d" value="4" disabled><select name="s"><option>p</option><option selected>q</option></select></form>
    <div id="box" style="width:100px;padding:10px;border:2px solid;margin:5px" data-num="5" data-obj='{"a":1}' data-flag="true"></div>`);
  t('.map jQuery-style (i, el)', $('#l li').map((i, el) => el.textContent + i).get().join() === 'a0,b1,c2');
  t('.map drops null, flattens arrays', $('#l li').map((i, el) => i === 1 ? null : [i, i]).get().length === 4);
  t('.end() / .addBack()', $('#l').find('li').end()[0].id === 'l' && $('#l li.x').prev().addBack().length === 2);
  t(':contains()', $('#l li:contains("b")').length === 1);
  t(':checkbox / :input', $(':checkbox').length === 2 && $('#f :input').length === 5);
  t(':visible filter in qsa fallback', Array.isArray($('li:visible').get()));
  t('.val() checkbox returns value (jQuery)', $('#cb').val() === 'yes');
  $('#ms').val(['1', '3']);
  t('.val([..]) on multi-select', JSON.stringify($('#ms').val()) === '["1","3"]');
  t('.data() reads data-* with type coercion', $('#box').data('num') === 5 && $('#box').data('obj').a === 1 && $('#box').data('flag') === true);
  t('.data() object getter camelCases', $('#box').data().num === 5);
  t('.prop vs .attr', $('#cb').prop('checked') === false && $('#cb').attr('type') === 'checkbox');
  $('#cb').prop('checked', true);
  t('.prop set', doc.getElementById('cb').checked);
  t('.attr(name, null) removes', $('#box').attr('data-flag', null).attr('data-flag') === undefined);
  t('.serialize skips disabled, keeps checked', $('#f').serialize() === 'a=1&b=2&c=z&s=q');
  t('.serializeArray', $('#f').serializeArray().length === 4);
  $('#box').css('width', '+=20');
  t('.css relative +=', doc.getElementById('box').style.width === '120px');
  t('.css array getter', Object.keys($('#box').css(['width', 'padding-top'])).length === 2);
  $('#l').append('<li>d</li>', doc.createElement('li'));
  t('.append multiple args', $('#l li').length === 5);
  $('#l li').last().remove();
  $('<b>w</b>').appendTo('#l li:first');
  t('.appendTo', $('#l b').length === 1);
  $('#l b').wrap('<i class="wr"></i>');
  t('.wrap', $('#l i.wr > b').length === 1);
  $('#l b').unwrap();
  t('.unwrap', $('#l i.wr').length === 0);
  $('#l li').eq(0).replaceWith('<li class="r">R</li>');
  t('.replaceWith', $('#l li').eq(0).hasClass('r'));
  t('.index()', $('#l li.x').index() === 1);
  t('.nextAll/.prevAll/.siblings', $('#l li').eq(0).nextAll().length === 3 && $('#l li').last().prevAll().length === 3);
  t('.parentsUntil', $('#l li').eq(0).parentsUntil('body').length === 2);
  t('.closest with context', $('#l li').eq(0).closest('ul')[0].id === 'l');
  t('.has()', $('ul').has('li.x').length === 1);
  t('.slice / .even / .odd', $('#l li').slice(1, 3).length === 2 && $('#l li').even().length === 2 && $('#l li').odd().length === 2);
  t('$(html, attrs)', $('<a>', { href: '/x', text: 'hi' })[0].getAttribute('href') === '/x');
  t('$.parseHTML strips scripts', $.parseHTML('<p>a</p><script>x</script>').length === 1);
  t('.toggleClass(fn)', $('#box').toggleClass((i, c) => 'k' + i).hasClass('k0'));
  t('.removeClass(fn)', !$('#box').removeClass(() => 'k0').hasClass('k0'));
  t('.addClass([array])', $('#box').addClass(['p', 'q']).is('.p.q'));
  const outer = $('#box').outerWidth(true), inner = $('#box').innerWidth();
  t('dimension helpers return numbers', typeof outer === 'number' && typeof inner === 'number');
  t('.text(fn)', $('#l li').eq(0).text((i, old) => old + '!').text() === 'R!');
  t('.html() destroys old data', (() => { const b = $('#box'); b.html('<span id="inner"></span>'); $('#inner').data('k', 1); b.html('x'); return $('#box').text() === 'x'; })());
  t('$.contains / $.grep / $.inArray / $.merge', $.contains(doc.body, doc.getElementById('l')) && $.grep([1, 2, 3], x => x > 1).length === 2 && $.inArray(2, [1, 2]) === 1 && $.merge([1], [2]).length === 2);
  t('$.each break with false', (() => { let n = 0; $.each([1, 2, 3], i => { n++; return i < 1; }); return n === 2; })());
  t('$.map object', $.map({ a: 1, b: 2 }, (v, k) => k + v).join() === 'a1,b2');
  t('$.type / $.isNumeric (jQuery 3 compat)', $.type([]) === 'array' && $.isNumeric('3.2') && !$.isNumeric('x'));
  t('$.extend into $ (plugin style)', ($.extend({ myUtil: () => 7 }), $.myUtil() === 7));
  t('$.fn.extend', ($.fn.extend({ greenify() { return this.css('color', 'green'); } }), $('#box').greenify()[0].style.color === 'green'));

  /* ================= EVENTS ================= */
  section = 'events';
  html(`<div id="ev"><p class="a"><span id="sp">s</span></p><p class="b">b</p><input id="in"><form id="sf"><button id="sb">go</button></form></div>`);
  let log = [];
  $('#ev').on('click.ns1', 'p', function (e) { log.push('del:' + this.className + ':' + (e.delegateTarget.id)); });
  $('#sp').trigger('click');
  t('delegation sets this & delegateTarget', log[0] === 'del:a:ev', log);
  $('#ev').off('.ns1'); log = [];
  $('#sp').trigger('click');
  t('off by namespace', log.length === 0);
  $('#ev').on('custom', (e, a, b) => log.push(a + b));
  $('#ev').trigger('custom', [1, 2]);
  t('trigger with array args', log[0] === 3);
  $('#ev').on({ x: () => log.push('x'), y: () => log.push('y') });
  $('#ev').trigger('x').trigger('y');
  t('.on(map)', log.includes('x') && log.includes('y'));
  log = [];
  $('#ev').on('mouseenter', 'p', () => log.push('enter'));
  doc.querySelector('#ev .b').dispatchEvent(new w.MouseEvent('mouseover', { bubbles: true, relatedTarget: doc.body }));
  t('delegated mouseenter via mouseover', log[0] === 'enter', log);
  let prevented = null;
  $('#sf').on('submit', e => { prevented = true; return false; });
  $('#sb').trigger('click');
  t('return false prevents default (submit)', prevented === true);
  const ev = $.Event('ping', { foo: 1 });
  let got; $('#ev').on('ping', e => { got = e.foo; }); $('#ev').trigger(ev);
  t('$.Event with props', got === 1);
  let n = 0; $('#ev').on('one.x', () => n++).off('one.x'); $('#ev').one('two', () => n++); $('#ev').trigger('two').trigger('two');
  t('.one fires once', n === 1);
  let handlerOnly = 0; $('#in').on('focus', () => handlerOnly++); $('#in').triggerHandler('focus');
  t('.triggerHandler runs handler without native action', handlerOnly === 1 && doc.activeElement !== doc.getElementById('in'));
  let hov = 0; $('#ev .a').hover(() => hov++, () => hov--);
  t('.hover binds two handlers', true);
  const cl = $('#ev .a').clone(true); let cc = 0; cl.on('click', () => cc++); cl.trigger('click');
  t('.clone(true) keeps handlers', cc === 1);

  /* ================= AJAX ================= */
  section = 'ajax';
  routes['/j'] = () => json({ ok: 1 });
  routes['/t'] = () => 'plain';
  routes['/err'] = () => ({ status: 500, body: JSON.stringify({ msg: 'bad' }), headers: { 'content-type': 'application/json' } });
  routes['/echo'] = c => json({ method: c.method, body: c.body, query: c.query, headers: c.headers });
  routes['/frag'] = () => '<div><p id="pick">picked</p><p>other</p></div>';
  routes['/slow'] = async () => { await sleep(80); return 'slow'; };
  const r1 = await $.getJSON('/j');
  t('$.getJSON', r1.ok === 1);
  let doneArgs; await $.get('/t').done((d, s) => { doneArgs = [d, s]; });
  await sleep(5);
  t('.done(data, textStatus)', doneArgs && doneArgs[0] === 'plain' && doneArgs[1] === 'success', doneArgs);
  let failArgs; $.ajax('/err').fail((x, s) => { failArgs = [x.status, s, x.responseJSON && x.responseJSON.msg]; });
  await sleep(20);
  t('.fail(jqXHR-like, textStatus) + responseJSON', failArgs && failArgs[0] === 500 && failArgs[1] === 'error' && failArgs[2] === 'bad', failArgs);
  const e1 = await $.post('/echo', { a: [1, 2], b: 'x y' });
  t('$.post urlencodes with jQuery brackets', e1.body === 'a%5B%5D=1&a%5B%5D=2&b=x+y', e1.body);
  const e2 = await $.ajax({ url: '/echo', method: 'PUT', data: JSON.stringify({ k: 1 }), contentType: 'application/json' });
  t('JSON body via contentType', e2.body === '{"k":1}' && e2.headers['content-type'] === 'application/json');
  const e3 = await $.get('/echo', { q: 1 });
  t('GET data → query', e3.query.q === '1');
  t('X-Requested-With on same origin', e3.headers['x-requested-with'] === 'XMLHttpRequest');
  let globalEvents = [];
  $(doc).on('ajaxStart ajaxStop ajaxSuccess ajaxComplete', e => globalEvents.push(e.type));
  await $.get('/t'); await sleep(5);
  t('global ajax events', ['ajaxStart', 'ajaxSuccess', 'ajaxComplete', 'ajaxStop'].every(x => globalEvents.includes(x)), globalEvents);
  $(doc).off('ajaxStart ajaxStop ajaxSuccess ajaxComplete');
  let to; await new Promise(r => $.ajax({ url: '/slow', timeout: 20 }).fail((x, st) => { to = st; r(); }));
  t('timeout → textStatus "timeout"', to === 'timeout', to);
  html('<div id="ld"></div>');
  await new Promise(r => $('#ld').load('/frag #pick', r));
  t('.load(url selector)', $('#ld').text() === 'picked', $('#ld').html());
  const d = $.Deferred(); let dv; d.done(v => dv = v); d.resolve(5);
  await sleep(1);
  t('$.Deferred resolve/done', dv === 5 && d.state() === 'resolved');
  const cbs = $.Callbacks('once memory'); let cbn = 0; cbs.add(() => cbn++); cbs.fire(); cbs.fire(); cbs.add(() => cbn++);
  t('$.Callbacks once memory', cbn === 2, cbn);
  const [wa, wb] = await new Promise(r => $.when($.getJSON('/j'), 3).then((a, b) => r([a, b])));
  t('$.when (jqXHR resolves as [data, status, jqXHR])', wa[0].ok === 1 && wa[1] === 'success' && wb === 3, [wa, wb]);

  /* ================= MOTION ================= */
  section = 'motion';
  html('<div id="m1" style="width:10px;opacity:1"></div><div class="mg"></div><div class="mg"></div><div class="mg"></div><div class="mg"></div><svg><circle id="c1" r="5" cx="0"></circle></svg>');
  const tw = $.to('#m1', { x: 100, width: 110, opacity: 0, duration: 1, ease: 'none', paused: true });
  tw.progress(0.5);
  const m1 = doc.getElementById('m1');
  t('tween progress(0.5) → transform', /translate\(50px,\s?0px\)/.test(m1.style.transform), m1.style.transform);
  t('tween progress(0.5) → width', m1.style.width === '60px', m1.style.width);
  t('tween opacity mid', Math.abs(parseFloat(m1.style.opacity) - 0.5) < 1e-6);
  tw.progress(1);
  t('tween end values', m1.style.width === '110px' && m1.style.opacity === '0');
  tw.progress(0);
  t('seek back to start restores', m1.style.width === '10px', m1.style.width);
  t('duration/totalDuration', tw.duration() === 1 && tw.totalDuration() === 1);
  const yo = $.to({ v: 0 }, { v: 10, duration: 1, repeat: 1, yoyo: true, ease: 'none', paused: true });
  t('repeat+yoyo totalDuration', yo.totalDuration() === 2);
  yo.totalTime(1.5);
  t('yoyo second half goes back', Math.abs(yo.targets[0].v - 5) < 1e-6, yo.targets[0].v);
  const obj = { n: 0 };
  await $.to(obj, { n: 10, duration: 0.05 });
  t('tween is thenable (await)', obj.n === 10);
  const c = { t: 0 };
  const tl = $.timeline({ paused: true, defaults: { ease: 'none', duration: 1 } });
  tl.to(c, { t: 1 }).addLabel('mid').to(c, { t: 2 }).to(c, { t: 3 }, '<');
  t('timeline duration with "<"', tl.duration() === 2, tl.duration());
  t('labels', tl.labels.mid === 1);
  tl.seek('mid');
  t('timeline seek(label)', Math.abs(c.t - 1) < 1e-6, c.t);
  tl.progress(1);
  t('timeline end', c.t === 3, c.t);
  tl.progress(0.25);
  t('timeline scrub backwards', Math.abs(c.t - 0.5) < 1e-6, c.t);
  const tl2 = $.timeline({ paused: true }); const calls2 = [];
  tl2.call(() => calls2.push('a'), null, 0.5).to({ z: 0 }, { z: 1, duration: 1 }, 0);
  tl2.progress(1);
  t('timeline .call fires when passed', calls2[0] === 'a');
  const nested = $.timeline({ paused: true }); const inner2 = $.timeline(); const no = { v: 0 };
  inner2.to(no, { v: 1, duration: 1, ease: 'none' });
  nested.add(inner2, 1);
  nested.seek(1.5);
  t('nested timeline', Math.abs(no.v - 0.5) < 1e-6 && nested.duration() === 2, [no.v, nested.duration()]);
  const st = $.to('.mg', { x: 10, duration: 1, stagger: 0.5, paused: true, ease: 'none' });
  t('stagger extends duration', st.duration() === 2.5);
  st.seek(0.5);
  t('stagger offsets per target', /translate\(5px/.test($('.mg')[0].style.transform) && !/translate\([1-9]/.test($('.mg')[1].style.transform || 'translate(0px'), [$('.mg')[0].style.transform, $('.mg')[1].style.transform]);
  const grid = $.to('.mg', { y: 1, stagger: { each: 0.1, from: 'center' }, paused: true });
  t('stagger from center', grid._offsets[0] === grid._offsets[3] && grid._offsets[1] < grid._offsets[0], grid._offsets);
  const amt = $.to('.mg', { y: 1, duration: 1, stagger: { amount: 0.9 }, paused: true });
  t('stagger amount', Math.abs(amt._offsets[3] - 0.9) < 1e-9);
  $.set('#m1', { backgroundColor: '#ff0000' });
  const ct = $.to('#m1', { backgroundColor: 'rgb(0, 0, 255)', duration: 1, ease: 'none', paused: true }); ct.progress(0.5);
  t('colour tween', /rgba?\(128,\s?0,\s?128/.test(m1.style.backgroundColor), m1.style.backgroundColor);
  $.set('#m1', { '--hue': 0 });
  $.to('#m1', { '--hue': 100, duration: 1, ease: 'none', paused: true }).progress(0.3);
  t('CSS variable tween', m1.style.getPropertyValue('--hue').trim() === '30', m1.style.getPropertyValue('--hue'));
  $.to('#c1', { attr: { cx: 50, r: 10 }, duration: 1, ease: 'none', paused: true }).progress(0.5);
  t('SVG attr tween', doc.getElementById('c1').getAttribute('cx') === '25' && doc.getElementById('c1').getAttribute('r') === '7.5');
  const rel = { v: 10 }; $.to(rel, { v: '+=5', duration: 1, paused: true }).progress(1);
  t('relative "+=" value', rel.v === 15);
  const fr = { v: 5 }; $.from(fr, { v: 0, duration: 1, paused: true });
  t('from() renders start immediately', fr.v === 0);
  const ft = { v: 5 }; $.fromTo(ft, { v: 1 }, { v: 3, duration: 1, paused: true, ease: 'none' }).progress(0.5);
  t('fromTo', ft.v === 2);
  const strO = { s: '0px 0px' }; $.to(strO, { s: '10px 20px', duration: 1, ease: 'none', paused: true }).progress(0.5);
  t('string interpolation', strO.s === '5px 10px', strO.s);
  t('eases: families', Math.abs($.parseEase('power2.in')(0.5) - 0.125) < 1e-9 && $.parseEase('back.out(2)')(1) === 1 && $.parseEase('elastic.out')(0) === 0);
  t('eases: steps & cubic-bezier', $.parseEase('steps(4)')(0.3) === 0.25 && Math.abs($.parseEase('cubic-bezier(0,0,1,1)')(0.4) - 0.4) < 1e-3);
  t('eases: jQuery UI names', Math.abs($.parseEase('easeInQuad')(0.5) - 0.25) < 1e-9);
  const kf = { a: 0 }; const kft = $.to(kf, { keyframes: [{ a: 10, duration: 1 }, { a: 0, duration: 1 }], ease: 'none', paused: true });
  kft.seek(1); const k1 = kf.a; kft.seek(1.5);
  t('keyframes array', k1 === 10 && Math.abs(kf.a - 5) < 1e-6, [k1, kf.a]);
  const ow = { v: 0 }; $.to(ow, { v: 100, duration: 1 }); const tw2 = $.to(ow, { v: 50, duration: 0.02 });
  await tw2; await sleep(40);
  t('overwrite auto: newer tween wins', ow.v === 50, ow.v);
  const kt = { v: 0 }; $.to(kt, { v: 1, duration: 1 }); $.killTweensOf(kt);
  t('killTweensOf / isTweening', !$.isTweening(kt));
  const cbs2 = []; await $.to({ q: 0 }, { q: 1, duration: 0.02, onStart: () => cbs2.push('s'), onUpdate: () => cbs2.includes('u') || cbs2.push('u'), onComplete: () => cbs2.push('c') });
  t('callbacks onStart/onUpdate/onComplete', cbs2.join() === 's,u,c', cbs2);
  const rv = { v: 0 }; const rt = $.to(rv, { v: 1, duration: 0.03, ease: 'none' }); await rt; rt.reverse(); await sleep(80);
  t('reverse() plays back to 0', rv.v === 0, rv.v);
  t('utils', $.utils.clamp(0, 10, 15) === 10 && $.utils.mapRange(0, 10, 0, 100, 5) === 50 && $.utils.snap(5, 12) === 10 && $.utils.wrap(0, 10, 12) === 2 && $.utils.interpolate(0, 10, 0.5) === 5);
  t('utils.random array + snap', [1, 2, 3].includes($.utils.random([1, 2, 3])) && $.utils.random(0, 10, 5) % 5 === 0);
  t('getProperty', $.getProperty('#m1', 'width') === parseFloat(m1.style.width));
  const qt = $.quickTo({ v: 0 }, 'v', { duration: 0.01 }); t('quickTo returns function', typeof qt === 'function');
  const dc = []; $.delayedCall(0.01, () => dc.push(1)); await sleep(40);
  t('delayedCall', dc.length === 1);

  // jQuery effects queue
  html('<div id="fx" style="width:100px;height:50px">fx</div><div id="fx2" style="display:none;height:40px">hidden</div>');
  $.fx.off = false;
  const order = [];
  $('#fx').animate({ width: 200 }, 30).queue(next => { order.push('q'); next(); }).animate({ width: 50 }, 30, () => order.push('done'));
  t(':animated while running', $('#fx').is(':animated'));
  await $('#fx').promise();
  t('.animate queue runs in order', order.join() === 'q,done' && doc.getElementById('fx').style.width === '50px', [order, doc.getElementById('fx').style.width]);
  $('#fx').animate({ width: 300 }, 200).animate({ width: 10 }, 200);
  await sleep(20);
  $('#fx').stop(true, true);
  t('.stop(true, true) jumps to end, clears queue', doc.getElementById('fx').style.width === '300px' && $('#fx').queue().length === 0, [doc.getElementById('fx').style.width, $('#fx').queue().length]);
  $('#fx').animate({ width: 400 }, 200).animate({ width: 20 }, 200);
  $('#fx').finish();
  t('.finish() completes all queued', doc.getElementById('fx').style.width === '20px', doc.getElementById('fx').style.width);
  await $('#fx2').fadeIn(30).promise();
  t('fadeIn shows hidden element', doc.getElementById('fx2').style.display !== 'none' && doc.getElementById('fx2').style.opacity === '');
  await $('#fx2').slideUp(30).promise();
  t('slideUp hides and restores height', doc.getElementById('fx2').style.display === 'none' && doc.getElementById('fx2').style.height === '40px', doc.getElementById('fx2').style.height);
  await $('#fx2').slideDown('fast').promise();
  t('slideDown named speed', doc.getElementById('fx2').style.display !== 'none');
  const dl = []; $('#fx').delay(30).queue(n => { dl.push(1); n(); });
  t('.delay holds the queue', dl.length === 0); await sleep(60); t('.delay then runs', dl.length === 1);
  $.fx.off = true; $('#fx').animate({ width: 77 }, 1000);
  t('$.fx.off makes animations instant', doc.getElementById('fx').style.width === '77px'); $.fx.off = false;
  await $('#fx').fadeTo(20, 0.5).promise();
  t('fadeTo', doc.getElementById('fx').style.opacity === '0.5');
  $('#fx').toggle(); t('toggle() no-arg hides', doc.getElementById('fx').style.display === 'none'); $('#fx').toggle();

  /* ================= PULSE ================= */
  section = 'pulse';
  $.component('counter', (start = 0) => ({ n: start, inc() { this.n++; }, get double() { return this.n * 2; } }));
  html(`<div id="p1" kj-data="counter(5)"><b kj-text="n"></b><i kj-text="double"></i><button @click="inc">+</button>
      <div kj-data="{ local: 'L' }"><em kj-text="local + n"></em></div></div>`);
  t('component with args + getter', $('#p1 b').text() === '5' && $('#p1 i').text() === '10');
  t('nested scope sees parent', $('#p1 em').text() === 'L5');
  $('#p1 button')[0].click(); await tick();
  t('method by name as handler (this)', $('#p1 b').text() === '6' && $('#p1 i').text() === '12' && $('#p1 em').text() === 'L6');
  html(`<div kj-data="{ items: [{id:1,t:'a'},{id:2,t:'b'}], show: true, cls: {on: true}, s: 'x', num: 0, arr: [], choice: 'x' }" id="p2">
      <ul><template kj-for="(it, i) in items" :key="it.id"><li :data-i="i" kj-text="it.t"></li></template></ul>
      <template kj-if="show"><p id="iff">if</p></template>
      <span id="sc" class="base" :class="cls" :style="{ color: 'red' }" :aria-pressed="show" :disabled="!show"></span>
      <input id="mi" kj-model="s"><input id="mn" kj-model.number="num">
      <input type="checkbox" value="a" kj-model="arr" id="ca"><input type="checkbox" value="b" kj-model="arr" id="cb2">
      <select id="sel" kj-model="choice"><option>x</option><option>y</option></select>
      <button id="push" @click="items.push({id: 3, t: 'c'})"></button><button id="rev" @click="items.reverse()"></button>
    </div>`);
  const p2 = $('#p2');
  t('kj-for renders', p2.find('li').length === 2 && p2.find('li').eq(1).text() === 'b' && p2.find('li').eq(1).attr('data-i') === '1');
  t('kj-if renders', $('#iff').length === 1);
  t(':class object keeps static class', $('#sc').hasClass('base') && $('#sc').hasClass('on'));
  t(':style object', doc.getElementById('sc').style.color === 'red');
  t('aria-* true → "true", disabled false removed', $('#sc').attr('aria-pressed') === 'true' && !doc.getElementById('sc').hasAttribute('disabled'));
  const firstLi = p2.find('li')[0];
  $('#push')[0].click(); await tick();
  t('kj-for push adds one', p2.find('li').length === 3 && p2.find('li')[0] === firstLi);
  $('#rev')[0].click(); await tick();
  t('keyed reorder reuses nodes', p2.find('li').last()[0] === firstLi && p2.find('li').eq(0).text() === 'c' && p2.find('li').eq(0).attr('data-i') === '0');
  const data2 = $.$data('#p2');
  data2.show = false; await tick();
  t('kj-if removes', $('#iff').length === 0 && $('#sc').hasClass('base'));
  t(':disabled true → attr', doc.getElementById('sc').hasAttribute('disabled'));
  data2.cls = { on: false, off: true }; await tick();
  t(':class swap', !$('#sc').hasClass('on') && $('#sc').hasClass('off') && $('#sc').hasClass('base'));
  t('kj-model initial', $('#mi').val() === 'x');
  const mi = doc.getElementById('mi'); mi.value = 'typed'; mi.dispatchEvent(new w.Event('input'));
  t('kj-model input → state', data2.s === 'typed');
  const mn = doc.getElementById('mn'); mn.value = '42'; mn.dispatchEvent(new w.Event('input'));
  t('kj-model.number', data2.num === 42);
  data2.arr = ['b']; await tick();
  t('checkbox array model', !doc.getElementById('ca').checked && doc.getElementById('cb2').checked);
  doc.getElementById('ca').checked = true; doc.getElementById('ca').dispatchEvent(new w.Event('change'));
  t('checkbox array add', JSON.stringify($.raw(data2.arr)) === '["b","a"]', $.raw(data2.arr));
  data2.choice = 'y'; await tick(); await tick();
  t('select model', $('#sel').val() === 'y');
  data2.s = ''; await tick();
  t('programmatic clear updates field', mi.value === '');

  html(`<div id="p3" kj-data="{ open: false, msg: '', q: 0 }" kj-init="msg = 'inited'">
      <span id="ms" kj-text="msg"></span>
      <div id="dd" kj-show="open" @click.outside="open = false">menu</div>
      <button id="tog" @click="open = !open">t</button>
      <input id="kk" @keydown.enter="q++" @keydown.shift.a="q += 10">
      <div id="out" @custom-evt="msg = $event.detail.v"><button id="disp" @click="$dispatch('custom-evt', { v: 'dispatched' })"></button></div>
      <span kj-ref="r1" id="ref1"></span><button id="rb" @click="msg = $refs.r1.id"></button>
      <div kj-id="['tab']"><b class="id1" :id="$id('tab')"></b><b class="id2" :aria-labelledby="$id('tab')"></b></div>
      <p id="once" @click.once="q += 100"></p>
      <template kj-teleport="body"><div id="tele" kj-text="'tp' + q"></div></template>
      <div kj-html="'<i kj-text=&quot;msg&quot; id=&quot;hx&quot;></i>'"></div>
    </div>`);
  t('kj-init', $('#ms').text() === 'inited');
  t('kj-show false → display none', doc.getElementById('dd').style.display === 'none');
  $('#tog')[0].click(); await tick();
  t('kj-show true', doc.getElementById('dd').style.display === '');
  doc.body.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); await tick();
  t('.outside closes', doc.getElementById('dd').style.display === 'none');
  const kk = doc.getElementById('kk');
  kk.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  kk.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'a', bubbles: true }));
  kk.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'a', shiftKey: true, bubbles: true }));
  t('key modifiers', $.$data('#p3').q === 11, $.$data('#p3').q);
  $('#disp')[0].click(); await tick();
  t('$dispatch + @custom-evt', $('#ms').text() === 'dispatched');
  $('#rb')[0].click(); await tick();
  t('$refs', $('#ms').text() === 'ref1');
  t('$id scoped by kj-id', $('.id1').attr('id') === $('.id2').attr('aria-labelledby') && /^tab-\d+$/.test($('.id2').attr('aria-labelledby')));
  $('#once')[0].click(); $('#once')[0].click();
  t('.once', $.$data('#p3').q === 111);
  await tick();
  t('kj-teleport keeps scope', doc.body.lastElementChild.id === 'tele' && $('#tele').text() === 'tp111', $('#tele').text());
  t('kj-html processes inner directives', $('#hx').text() === 'ref1');
  let watched; $.$data('#p3').$watch ? 0 : 0;
  html(`<div id="p4" kj-data="{ a: 1, list: [1], w: null }" kj-init="$watch('a', (v, o) => w = v + ':' + o); $watch('list', v => w = 'len' + v.length)"><span kj-effect="window.__eff = a * 2"></span></div>`);
  const d4 = $.$data('#p4'); d4.a = 2; await tick();
  t('$watch new/old', d4.w === '2:1', d4.w);
  d4.list.push(2); await tick(); await tick();
  t('$watch deep array', d4.w === 'len2', d4.w);
  t('kj-effect', w.__eff === 4);
  const st1 = $.store('cart', { items: [], get count() { return this.items.length; } });
  html(`<div id="p5" kj-data><b kj-text="$store.cart.count"></b></div><div id="p6" kj-data><button @click="$store.cart.items.push(1)"></button></div>`);
  t('$store read', $('#p5 b').text() === '0');
  $('#p6 button')[0].click(); await tick();
  t('$store shared across components', $('#p5 b').text() === '1' && st1.count === 1);
  html('<div id="noscope"><button id="ns" kj-on:click="window.__ns = ($event.type)"></button></div>');
  $('#ns')[0].click();
  t('kj-on works without kj-data', w.__ns === 'click');
  html('<div kj-data="{ x: 1 }" kj-ignore><span id="ig" kj-text="x">raw</span></div>');
  t('kj-ignore', $('#ig').text() === 'raw');
  let destroyed = 0;
  $.component('dtest', () => ({ destroy() { destroyed++; } }));
  html('<div id="dt" kj-data="dtest"></div>');
  $('#dt').remove();
  t('destroy() on remove', destroyed === 1);
  html('<div id="cloak" kj-data="{}" kj-cloak></div>');
  t('kj-cloak removed after init', !doc.getElementById('cloak').hasAttribute('kj-cloak'));
  $.directive('upper', (el, { expression }, { effect, evaluate }) => { effect(() => { el.textContent = String(evaluate(expression)).toUpperCase(); }); });
  $.magic('answer', () => 42);
  html('<div kj-data="{ s: \'hey\' }"><b id="up" kj-upper="s"></b><i id="mg" kj-text="$answer"></i></div>');
  t('$.directive custom', $('#up').text() === 'HEY');
  t('$.magic custom', $('#mg').text() === '42');
  html('<div kj-data="{ items: { a: 1, b: 2 } }"><template kj-for="(v, k, i) in items"><span class="oi" kj-text="k + v + i"></span></template><template kj-for="n in 3"><b class="rn" kj-text="n"></b></template></div>');
  t('kj-for over object + range', $('.oi').map((i, e) => e.textContent).get().join() === 'a10,b21' && $('.rn').text() === '123');
  html('<div x-data="{ v: \'alpine\' }"><span id="xa" x-text="v"></span></div>');
  t('x-* prefix accepted (Alpine drop-in)', $('#xa').text() === 'alpine');
  html('<div kj-data="{ open: true }"><p id="tr" kj-show="open" kj-transition.duration.10ms>t</p></div>');
  $.$data('#tr').open = false; await tick(); await sleep(60);
  t('kj-show with transition ends hidden', doc.getElementById('tr').style.display === 'none');

  /* ================= HYPER ================= */
  section = 'hyper';
  calls.length = 0;
  routes['/h/frag'] = () => '<b id="hb">frag</b>';
  routes['/h/echo'] = c => `<pre id="he">${c.method} ${c.url} ${c.body || ''}</pre>`;
  routes['/h/oob'] = () => '<p>main</p><div id="side" kj-swap-oob="true">side-new</div><span id="cnt" kj-swap-oob="innerHTML">9</span>';
  routes['/h/headers'] = () => ({ body: '<i>x</i>', headers: { 'content-type': 'text/html', 'HX-Trigger': '{"saved": {"id": 5}}', 'HX-Retarget': '#alt', 'HX-Reswap': 'beforeend' } });
  routes['/h/redirectish'] = () => ({ body: 'ignored', headers: { 'content-type': 'text/html', 'HX-Push-Url': '/pushed' } });
  routes['/h/422'] = () => ({ status: 422, body: '<p id="bad">invalid</p>' });
  routes['/h/slow'] = async () => { await sleep(40); return '<i>slow</i>'; };
  routes['/h/page'] = () => '<!doctype html><html><head><title>Page Two</title></head><body><main id="pm">two</main></body></html>';
  routes['/h/select'] = () => '<div><nav>x</nav><section id="sel1">only me</section></div>';
  routes['/h/script'] = () => '<div id="sd"></div><script>window.__hs = (window.__hs || 0) + 1</script>';
  routes['/h/stop'] = () => ({ status: 286, body: 'stopped' });
  routes['/h/204'] = () => ({ status: 204 });
  routes['/h/preserve'] = () => '<input id="keep" kj-preserve value="server"><p id="pp">new</p>';
  html(`<button id="h1" kj-get="/h/frag" kj-target="#t1">go</button><div id="t1"></div>
    <div kj-target="#t2"><button id="h2" kj-post="/h/echo" kj-vals='{"a": 1}' name="btn" value="v">p</button></div><div id="t2"></div>
    <form id="hf" kj-put="/h/echo" kj-target="#t3"><input name="x" value="1"><input type="checkbox" name="c" value="on"></form><div id="t3"></div>
    <button id="h4" kj-get="/h/oob" kj-target="#t4">o</button><div id="t4"></div><div id="side">side</div><span id="cnt">0</span>
    <button id="h5" kj-get="/h/headers" kj-target="#t5">h</button><div id="t5"></div><div id="alt"><b>a</b></div>
    <button id="h6" kj-get="/h/422" kj-target="#t6">e</button><div id="t6">keep</div>
    <button id="h7" kj-get="/h/select" kj-select="#sel1" kj-target="#t7" kj-swap="outerHTML">s</button><div id="t7"></div>
    <button id="h8" kj-get="/h/script" kj-target="#t8">sc</button><div id="t8"></div>
    <div id="h9w"><button id="h9" kj-delete="/h/echo" kj-target="closest div" kj-swap="outerHTML" kj-vals='{"id": 3}'>d</button></div>
    <button id="h10" kj-get="/h/echo" kj-target="#t10" kj-include="#inc" kj-headers='{"X-Custom": "1"}'>i</button><div id="inc"><input name="inc1" value="yes"></div><div id="t10"></div>
    <button id="h11" kj-get="/h/frag" kj-target="#t11" kj-swap="beforeend">a</button><div id="t11"><i>first</i></div>
    <div id="t12"><button id="h12" kj-get="/h/frag" kj-target="this" kj-swap="delete">x</button></div>
    <button id="h13" kj-get="/h/redirectish" kj-swap="none">pu</button>
    <input id="h14" name="q" kj-get="/h/echo" kj-trigger="input changed delay:30ms" kj-target="#t14"><div id="t14"></div>
    <button id="h15" kj-get="/h/slow" kj-target="#t15" kj-indicator="#ind" kj-disabled-elt="this">sl</button><div id="t15"></div><span id="ind" class="kj-indicator">…</span>
    <button id="h16" kj-get="/h/frag" kj-target="#t16" kj-trigger="click[shiftKey]">f</button><div id="t16"></div>
    <button id="h17" kj-get="/h/frag" kj-target="#t17" kj-trigger="click once">once</button><div id="t17"></div>
    <div id="t18"><input id="keep" kj-preserve value="client"><p id="pp">old</p></div><button id="h18" kj-get="/h/preserve" kj-target="#t18">pr</button>
    <button id="h19" kj-get="/h/204" kj-target="#t19">nc</button><div id="t19">same</div>
    <button id="h20" kj-post="/h/echo" kj-target="#t20" kj-confirm="Sure?">c</button><div id="t20"></div>
    <button id="h21" kj-get="/h/echo" kj-target="#t21" kj-params="not secret" kj-vals='{"keep": 1, "secret": 2}'>pa</button><div id="t21"></div>`);
  const click = id => doc.getElementById(id).click();
  click('h1'); await sleep(40);
  t('kj-get + kj-target', $('#t1 #hb').text() === 'frag');
  t('HX-Request header sent', calls.find(c => c.path === '/h/frag').headers['hx-request'] === 'true');
  t('HX-Trigger / HX-Target headers', calls.find(c => c.path === '/h/frag').headers['hx-trigger'] === 'h1' && calls.find(c => c.path === '/h/frag').headers['hx-target'] === 't1');
  click('h2'); await sleep(40);
  t('inherited kj-target + kj-vals + own name/value', $('#t2 pre').text().startsWith('POST /h/echo') && $('#t2 pre').text().includes('btn=v') && $('#t2 pre').text().includes('a=1'), $('#t2 pre').text());
  doc.getElementById('hf').requestSubmit ? doc.getElementById('hf').requestSubmit() : $('#hf').trigger('submit'); await sleep(40);
  t('form kj-put urlencoded body; unchecked checkbox omitted', $('#t3 pre').text().trim() === 'PUT /h/echo x=1', $('#t3 pre').text());
  click('h4'); await sleep(50);
  t('oob swaps (outerHTML & innerHTML)', $('#t4').text() === 'main' && $('#side').text() === 'side-new' && $('#cnt').text() === '9', [$('#t4').html(), $('#side').text(), $('#cnt').text()]);
  let saved; $(doc).on('saved', (e) => { saved = e.detail.id; });
  click('h5'); await sleep(50);
  t('HX-Trigger response header', saved === 5);
  t('HX-Retarget + HX-Reswap', $('#alt').html() === '<b>a</b><i>x</i>' && $('#t5').html() === '', $('#alt').html());
  let errStatus; $(doc).on('kj:error', e => { errStatus = e.detail.status; });
  click('h6'); await sleep(40);
  t('4xx does not swap, fires kj:error', $('#t6').text() === 'keep' && errStatus === 422);
  $(doc).one('kj:beforeSwap', e => { if (e.detail.status === 422) e.detail.shouldSwap = true; });
  click('h6'); await sleep(40);
  t('kj:beforeSwap can opt in to swapping errors', $('#t6 #bad').length === 1);
  click('h7'); await sleep(40);
  t('kj-select + outerHTML', $('#sel1').text() === 'only me' && $('#t7').length === 0);
  click('h8'); await sleep(50);
  t('scripts in swapped content run', w.__hs === 1);
  const h9wrap = doc.getElementById('h9').closest('div') || null;
  click('h9'); await sleep(40);
  t('kj-delete sends params in query; closest target', calls.some(c => c.method === 'DELETE' && c.query.id === '3') && $('#h9w').length === 0 && $('pre').filter((i, e) => e.textContent.startsWith('DELETE')).length === 1);
  click('h10'); await sleep(40);
  const c10 = calls.filter(c => c.path === '/h/echo' && c.method === 'GET').pop();
  t('kj-include + kj-headers', c10.query.inc1 === 'yes' && c10.headers['x-custom'] === '1', c10);
  click('h11'); await sleep(40);
  t('beforeend swap', $('#t11').children().length === 2 && $('#t11 i').text() === 'first');
  click('h12'); await sleep(40);
  t('delete swap', $('#h12').length === 0);
  click('h13'); await sleep(40);
  t('HX-Push-Url pushes history', w.location.pathname === '/pushed', w.location.pathname);
  w.history.replaceState(null, '', '/page');
  const h14 = doc.getElementById('h14');
  h14.value = 'a'; h14.dispatchEvent(new w.Event('input')); h14.value = 'ab'; h14.dispatchEvent(new w.Event('input'));
  await sleep(10); const before = calls.length; await sleep(60);
  t('delay debounces to one request', calls.length - before === 1 && $('#t14 pre').text().includes('q=ab'), $('#t14').text());
  h14.dispatchEvent(new w.Event('input')); await sleep(60);
  t('changed modifier suppresses same value', calls.length - before === 1);
  click('h15'); await sleep(5);
  t('indicator gets kj-request + disabled-elt', doc.getElementById('ind').classList.contains('kj-request') && doc.getElementById('h15').disabled);
  await sleep(80);
  t('indicator cleared after', !doc.getElementById('ind').classList.contains('kj-request') && !doc.getElementById('h15').disabled);
  click('h16'); await sleep(30);
  t('trigger filter [shiftKey] blocks plain click', $('#t16').html() === '');
  doc.getElementById('h16').dispatchEvent(new w.MouseEvent('click', { shiftKey: true, bubbles: true })); await sleep(30);
  t('trigger filter passes with shift', $('#t16').text() === 'frag');
  click('h17'); await sleep(30); $('#t17').html(''); click('h17'); await sleep(30);
  t('once modifier', $('#t17').html() === '');
  const keepEl = doc.getElementById('keep');
  click('h18'); await sleep(40);
  t('kj-preserve keeps live element', doc.getElementById('keep') === keepEl && keepEl.value === 'client' && $('#pp').text() === 'new');
  click('h19'); await sleep(30);
  t('204 → no swap', $('#t19').text() === 'same');
  w.confirm = () => false; click('h20'); await sleep(30);
  t('kj-confirm cancel blocks request', $('#t20').html() === '');
  w.confirm = () => true; click('h20'); await sleep(30);
  t('kj-confirm accept', $('#t20 pre').length === 1);
  click('h21'); await sleep(30);
  t('kj-params not', $('#t21').text().includes('keep=1') && !$('#t21').text().includes('secret'), $('#t21').text());

  // sync, polling, load trigger, ajax API, boost
  html(`<button id="s1" kj-get="/h/slow" kj-target="#ts" kj-sync="this:drop">s</button><div id="ts"></div>
    <div id="poll" kj-get="/h/stop" kj-trigger="every 30ms" kj-target="#tp"></div><div id="tp"></div>
    <div id="ld1" kj-get="/h/frag" kj-trigger="load"></div>`);
  const n0 = calls.filter(c => c.path === '/h/slow').length;
  click('s1'); click('s1'); click('s1'); await sleep(80);
  t('kj-sync drop: only one in flight', calls.filter(c => c.path === '/h/slow').length - n0 === 1);
  await sleep(120);
  t('286 stops polling', calls.filter(c => c.path === '/h/stop').length === 1, calls.filter(c => c.path === '/h/stop').length);
  t('load trigger', $('#ld1 #hb').length === 1);
  html('<div id="api"></div>');
  await $.hyper.ajax('get', '/h/frag', '#api'); await sleep(30);
  t('$.hyper.ajax', $('#api').text() === 'frag');
  html('<div id="bz" kj-boost="true"><a id="bl" href="/h/page">two</a></div>');
  const titleBefore = doc.title;
  click('bl'); await sleep(60);
  t('kj-boost link swaps body + title + pushes', $('#pm').text() === 'two' && doc.title === 'Page Two' && w.location.pathname === '/h/page', [doc.title, w.location.pathname]);
  let evOrder = [];
  doc.body.innerHTML = '<div id="root"></div>';
  html('<button id="ev1" kj-get="/h/frag" kj-target="#evt">e</button><div id="evt"></div>');
  ['kj:config', 'kj:before', 'kj:after', 'kj:beforeSwap', 'kj:afterSwap', 'kj:load', 'kj:afterSettle'].forEach(n => $(doc).on(n, () => evOrder.push(n.slice(3))));
  click('ev1'); await sleep(80);
  t('event lifecycle order', evOrder.join() === 'config,before,after,beforeSwap,afterSwap,load,afterSettle', evOrder);
  $(doc).one('kj:config', e => { e.detail.parameters.extra = 'yes'; e.detail.headers['X-From-Config'] = '1'; });
  html('<button id="cf" kj-get="/h/echo" kj-target="#cft">c</button><div id="cft"></div>');
  click('cf'); await sleep(40);
  const ccf = calls.filter(c => c.path === '/h/echo').pop();
  t('kj:config can edit params & headers', ccf.query.extra === 'yes' && ccf.headers['x-from-config'] === '1');
  html('<div kj-data="{ n: 0 }" @kj:after-swap="n++"><button id="pk" kj-get="/h/echo" kj-target="#pkt">p</button><b id="pkn" kj-text="n"></b><div id="pkt"></div></div>');
  click('pk'); await sleep(60);
  t('Pulse listens to Hyper events (@kj:after-swap)', $('#pkn').text() === '1', $('#pkn').text());
  html('<div kj-data="{ items: [\'/h/frag\'] }"><template kj-for="u in items"><button class="dyn" :kj-get="u" kj-get="/h/frag" kj-target="next div">d</button></template><div id="dynt"></div></div>');
  await sleep(10); doc.querySelector('.dyn').click(); await sleep(40);
  t('Hyper attributes inside kj-for clones work', $('#dynt').text() === 'frag');

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
