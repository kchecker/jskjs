/*!
 * jsKjs UI add-on — the Alpine.js plugins, as Pulse directives:
 *   $persist · kj-intersect · kj-trap (+ $focus) · kj-collapse · kj-mask (+ $money) · kj-resize
 * https://jskjs.org/features/ui-directives/ · MIT · load after jskjs.js
 */
(function (factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else factory(window.jsKjs);
})(function ($) {
  'use strict';
  if (!$ || !$.directive) throw new Error('jskjs.ui.js needs jskjs.js loaded first');
  const modNum = (mods, key, dflt, unit) => {
    const i = mods.indexOf(key); if (i < 0) return dflt;
    const v = mods[i + 1]; if (v == null) return dflt;
    const n = parseFloat(v); if (isNaN(n)) return dflt;
    return unit === 'ms' ? (v.endsWith('s') && !v.endsWith('ms') ? n * 1000 : n) : n;
  };

  /* ---------- $persist: { count: $persist(0) } · $persist(0).as('key').using(sessionStorage) ---------- */
  function persist(initial) {
    let key = null, storage = null;
    const interceptor = {
      as(k) { key = k; return interceptor; },
      using(s) { storage = s; return interceptor; },
      _kjIntercept(prop, data) {
        const k = key || '_kj_' + prop, st = storage || (() => { try { return window.localStorage; } catch (e) { return null; } })();
        let value = initial;
        try { const raw = st && st.getItem(k); if (raw != null) value = JSON.parse(raw); } catch (e) { /* blocked or bad JSON */ }
        queueMicrotask(() => $.effect(() => {
          const v = data[prop];
          let json; try { json = JSON.stringify(v); } catch (e) { return; }
          try { st && st.setItem(k, json); } catch (e) { /* quota / private mode */ }
        }));
        return value;
      },
    };
    return interceptor;
  }
  $.magic('persist', () => persist);
  $.persist = persist;

  /* ---------- kj-intersect[:enter|:leave].once.half.full.threshold.50.margin.200px ---------- */
  $.directive('intersect', (el, { value, modifiers: m, expression }, { evaluate, cleanup }) => {
    if (!window.IntersectionObserver) return;
    const threshold = m.includes('full') ? 0.99 : m.includes('half') ? 0.5 : m.includes('threshold') ? modNum(m, 'threshold', 0) / 100 : 0;
    const mi = m.indexOf('margin'), margin = mi >= 0 ? m.slice(mi + 1).filter(x => /^-?\d+(px|%)$/.test(x)).join(' ') || '0px' : '0px';
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      const enter = e.isIntersecting && e.intersectionRatio >= threshold - 0.001;
      if ((value === 'leave' && enter) || (value !== 'leave' && !enter)) return;
      evaluate(expression, { $entry: e });
      if (m.includes('once')) io.disconnect();
    }), { threshold, rootMargin: margin });
    io.observe(el);
    cleanup(() => io.disconnect());
  });

  /* ---------- kj-trap="open" .inert .noscroll .noreturn .noautofocus  +  $focus ---------- */
  const FOCUSABLE = 'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),iframe,summary,[contenteditable],[tabindex]:not([tabindex="-1"])';
  const focusables = root => [...root.querySelectorAll(FOCUSABLE)].filter(e => e.offsetWidth || e.offsetHeight || e.getClientRects().length);
  $.directive('trap', (el, { modifiers: m, expression }, { effect, evaluate, cleanup }) => {
    let active = false, returnTo = null, undoInert = null, prevOverflow = null;
    const onKey = e => {
      if (e.key !== 'Tab') return;
      const f = focusables(el); if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const on = () => {
      active = true; returnTo = document.activeElement;
      document.addEventListener('keydown', onKey, true);
      if (m.includes('inert')) {
        const changed = [];
        for (let n = el; n && n !== document.body; n = n.parentElement) [...(n.parentElement ? n.parentElement.children : [])].forEach(s => { if (s !== n && !s.inert && s.tagName !== 'SCRIPT') { s.inert = true; changed.push(s); } });
        undoInert = () => changed.forEach(s => { s.inert = false; });
      }
      if (m.includes('noscroll')) { prevOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; }
      if (!m.includes('noautofocus')) $.nextTick(() => { const auto = el.querySelector('[autofocus]') || focusables(el)[0]; auto && auto.focus(); });
    };
    const off = () => {
      if (!active) return; active = false;
      document.removeEventListener('keydown', onKey, true);
      undoInert && undoInert(); undoInert = null;
      if (prevOverflow !== null) { document.documentElement.style.overflow = prevOverflow; prevOverflow = null; }
      if (!m.includes('noreturn') && returnTo && returnTo.focus) setTimeout(() => returnTo.focus(), 0);
    };
    effect(() => { evaluate(expression) ? (active || on()) : off(); });
    cleanup(off);
  });
  const focusApi = el => {
    const api = {
      focus(t) { t && t.focus && t.focus(); return api; },
      within(root) { scope = $(root)[0]; return api; },
      wrap() { wrap = true; return api; },
      all() { return focusables(scope); },
      first() { return api.focus(api.all()[0]); },
      last() { const a = api.all(); return api.focus(a[a.length - 1]); },
      next() { const a = api.all(), i = a.indexOf(document.activeElement); return api.focus(a[i + 1] || (wrap ? a[0] : null)); },
      previous() { const a = api.all(), i = a.indexOf(document.activeElement); return api.focus(a[i - 1] || (wrap ? a[a.length - 1] : null)); },
      getFirst: () => api.all()[0], getLast: () => api.all().slice(-1)[0],
    };
    let scope = document.body, wrap = false;
    return api;
  };
  $.magic('focus', el => focusApi(el));

  /* ---------- kj-collapse (with kj-show): animates height; .duration.400ms .min.40px ---------- */
  $.directive('collapse', (el, { modifiers: m }) => {
    const duration = modNum(m, 'duration', 250, 'ms') / 1000, min = modNum(m, 'min', 0);
    let tween = null;
    const custom = (node, phase, done) => {
      if (tween) tween.kill();
      const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      node.style.overflow = 'hidden';
      if (phase === 'enter') {
        const from = node.offsetHeight === 0 && !min ? 0 : node.offsetHeight;
        node.style.height = 'auto';
        const full = node.scrollHeight;
        node.style.height = from + 'px';
        tween = $.to(node, { height: full, duration: reduce ? 0 : duration, ease: 'power1.inOut', overwrite: true, onComplete: () => { node.style.height = ''; node.style.overflow = ''; tween = null; done(); } });
      } else {
        node.style.height = node.offsetHeight + 'px';
        tween = $.to(node, { height: min, duration: reduce ? 0 : duration, ease: 'power1.inOut', overwrite: true, onComplete: () => { tween = null; done(); } });
      }
      return { cancel() { if (tween) tween.kill(); tween = null; } };
    };
    custom.noHide = min > 0;
    $.pulse.setTransition(el, custom);
    // initial state once kj-show has rendered
    $.nextTick(() => {
      if (!$.pulse.isShown(el) || el.style.display === 'none') {
        if (min > 0) { el.style.removeProperty('display'); el.style.height = min + 'px'; el.style.overflow = 'hidden'; }
      }
    });
  }).before('show');

  /* ---------- kj-mask="99/99/9999" (9 digit, a letter, * any) · kj-mask:dynamic="expr" · $money ---------- */
  function applyMask(value, mask) {
    let out = '', vi = 0;
    const raw = String(value);
    for (let mi = 0; mi < mask.length && vi < raw.length; mi++) {
      const mc = mask[mi];
      const test = mc === '9' ? /\d/ : mc === 'a' ? /[a-zA-Z]/ : mc === '*' ? /./ : null;
      if (!test) { out += mc; if (raw[vi] === mc) vi++; continue; }
      while (vi < raw.length && !test.test(raw[vi])) vi++;
      if (vi < raw.length) out += raw[vi++];
    }
    return out;
  }
  function money(input, delimiter = '.', thousands, precision = 2) {
    thousands = thousands ?? (delimiter === ',' ? '.' : ',');
    const s = String(input);
    if (/^\D+$/.test(s)) return '9';
    const neg = s.trim().startsWith('-');
    const intPart = s.split(delimiter)[0].replace(/\D/g, '');
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
    const tmpl = grouped.replace(/\d/g, '9');
    const decimals = s.includes(delimiter) ? delimiter + '9'.repeat(precision) : '';
    return (neg ? '-' : '') + tmpl + decimals;
  }
  $.directive('mask', (el, { value, expression }, { evaluate, cleanup }) => {
    const getMask = input => value === 'dynamic' ? String(evaluate(expression, { $input: input, $money: money }) ?? '') : expression;
    const format = () => {
      const before = el.value, caret = el.selectionStart ?? before.length;
      const sig = before.slice(0, caret).replace(/[^\da-zA-Z]/g, '').length;
      const mask = getMask(before);
      let next = applyMask(before, mask);
      if (mask && mask.includes(',') && /^-/.test(before) && !next.startsWith('-')) next = '-' + next;
      if (next === before) return;
      el.value = next;
      let pos = 0, count = 0;
      while (pos < next.length && count < sig) { if (/[\da-zA-Z]/.test(next[pos])) count++; pos++; }
      try { el.setSelectionRange(pos, pos); } catch (e) { /* not focusable */ }
    };
    const onInput = () => { format(); };
    el.addEventListener('input', onInput);
    el.addEventListener('blur', format);
    if (el.value) format();
    cleanup(() => { el.removeEventListener('input', onInput); el.removeEventListener('blur', format); });
  });
  $.mask = applyMask; $.money = money;
  $.magic('money', () => money);

  /* ---------- kj-resize="w = $width; h = $height" (.document) ---------- */
  $.directive('resize', (el, { modifiers: m, expression }, { evaluate, cleanup }) => {
    if (!window.ResizeObserver) return;
    const target = m.includes('document') ? document.documentElement : el;
    const ro = new ResizeObserver(([e]) => { const b = e.contentBoxSize && e.contentBoxSize[0]; evaluate(expression, { $width: b ? b.inlineSize : e.contentRect.width, $height: b ? b.blockSize : e.contentRect.height }); });
    ro.observe(target);
    cleanup(() => ro.disconnect());
  });
  return $;
});
