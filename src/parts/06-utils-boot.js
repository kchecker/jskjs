  /* ============================================================
   * UTILITIES — jQuery 3's deprecated statics (kept for old plugins) + extras
   * ============================================================ */
  const rtrim = /^[\s﻿\xA0]+|([^\s﻿\xA0])[\s﻿\xA0]+$/g;
  $.proxy = function (fn, context, ...args) {
    if (typeof context === 'string') { const tmp = fn[context]; context = fn; fn = tmp; }
    if (!isFn(fn)) return undefined;
    const proxy = function (...a) { return fn.apply(context || this, args.concat(a)); };
    proxy.guid = fn.guid = fn.guid || $.guid++;
    return proxy;
  };
  $.isArray = Array.isArray;
  $.parseJSON = JSON.parse;
  $.nodeName = nodeName;
  $.isFunction = isFn;
  $.isWindow = isWindow;
  $.camelCase = camel;
  $.type = toType;
  $.now = Date.now;
  $.isNumeric = obj => { const type = toType(obj); return (type === 'number' || type === 'string') && !isNaN(obj - parseFloat(obj)); };
  $.trim = text => text == null ? '' : (text + '').replace(rtrim, '$1');

  // jsKjs extras
  $.uuid = () => crypto && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  $.escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  $.debounce = (fn, wait = 300, opts = {}) => {
    let t, lastArgs, lastThis;
    const d = function (...args) {
      lastArgs = args; lastThis = this;
      const callNow = opts.leading && !t;
      clearTimeout(t);
      t = setTimeout(() => { t = null; if (!opts.leading || opts.trailing) fn.apply(lastThis, lastArgs); }, wait);
      if (callNow) fn.apply(this, args);
    };
    d.cancel = () => { clearTimeout(t); t = null; };
    d.flush = () => { if (t) { clearTimeout(t); t = null; fn.apply(lastThis, lastArgs); } };
    return d;
  };
  $.throttle = (fn, wait = 300, opts = {}) => {
    let last = 0, t, lastArgs, lastThis;
    const th = function (...args) {
      const n = Date.now(); lastArgs = args; lastThis = this;
      const remaining = wait - (n - last);
      if (remaining <= 0) { clearTimeout(t); t = null; last = n; fn.apply(this, args); }
      else if (opts.trailing !== false && !t) t = setTimeout(() => { last = Date.now(); t = null; fn.apply(lastThis, lastArgs); }, remaining);
    };
    th.cancel = () => { clearTimeout(t); t = null; };
    return th;
  };
  $.sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ============================================================
   * LIFECYCLE — cleanup when nodes leave the DOM
   * ============================================================ */
  // natively removed nodes (innerHTML, Hyper swaps): run jsKjs cleanups, keep jQuery data like jQuery does
  function runCleanups(node) {
    if (!isEl(node)) return;
    for (const el of [node, ...node.querySelectorAll('*')]) {
      const d = dataStore.get(el);
      if (!d) continue;
      if (d.cleanups) { const c = d.cleanups.splice(0); c.reverse().forEach(f => { try { f(); } catch (e) { warn('cleanup', e); } }); }
      d.pulsed = d.pulseSkip = d.hyperBound = false;
      if (d.data) { d.data = null; d.chain = null; }
    }
  }
  // jQuery-style removal: cleanups, events and data
  function destroyTree(node) {
    if (!isEl(node)) return;
    const all = getAll(node);
    if ($.killTweensOf) all.forEach(el => { if (dataStore.get(el) || true) killTweensOf(el); });
    $.cleanData(all);
  }

  const processHooks = [];
  $.process = root => {
    const el = root ? $(root)[0] : document;
    if (!el) return;
    processPulse(el);
    processHyper(el);
    processHooks.forEach(h => { try { h(el); } catch (e) { warn('process hook', e); } });
  };
  // extension points for add-ons: run on every processed subtree; cleanup when an element leaves the DOM
  $.onProcess = fn => { processHooks.push(fn); if (booted) fn(document); };
  $.addCleanup = (el, fn) => addCleanup($(el)[0], fn);
  $.fn.process = function () { return this.each((_, el) => $.process(el)); };

  /* ============================================================
   * BOOT
   * ============================================================ */
  // constructable stylesheet: no inline <style>, so strict Content-Security-Policy pages stay happy
  function injectStyles() {
    if (!hyperConfig.includeIndicatorStyles || injectStyles.done) return;
    injectStyles.done = true;
    const css = '[kj-cloak],[x-cloak],[data-kj-cloak]{display:none!important}' +
      '.kj-indicator{opacity:0;visibility:hidden}.kj-request .kj-indicator,.kj-request.kj-indicator{opacity:1;visibility:visible;transition:opacity .2s ease-in}';
    try {
      const sheet = new window.CSSStyleSheet();
      sheet.replaceSync(css);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    } catch (e) {
      const s = document.createElement('style'); s.id = 'kj-styles'; s.textContent = css; (document.head || documentElement).appendChild(s);
    }
  }
  let booted = false;
  function boot() {
    if (booted) return; booted = true;
    injectStyles();
    $.process(document);
    if (MutationObserver) {
      const pendingRemoval = new Set();
      new MutationObserver(muts => {
        for (const m of muts) {
          for (const n of m.removedNodes) if (n.nodeType === 1) pendingRemoval.add(n);
          for (const n of m.addedNodes) if (n.nodeType === 1 && n.isConnected) $.process(n);
        }
        if (pendingRemoval.size) queueMicrotask(() => {
          pendingRemoval.forEach(n => { if (!n.isConnected) runCleanups(n); });
          pendingRemoval.clear();
        });
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
    triggerOn(document, 'kj:ready', { jsKjs: VERSION }, false);
  }
  if (document.readyState !== 'loading') queueMicrotask(boot);
  else document.addEventListener('DOMContentLoaded', boot, { once: true });
  $.boot = boot;

  const _prev$ = window.$, _prevJQ = window.jQuery;
  $.noConflict = deep => { if (window.$ === $) window.$ = _prev$; if (deep && window.jQuery === $) window.jQuery = _prevJQ; return $; };
  window.$ = window.kj = window.jsKjs = $;
  window.jQuery = $;                                 // drop-in: jQuery plugins see jsKjs (noConflict(true) restores)
  return $;
});
