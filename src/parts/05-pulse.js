  /* ============================================================
   * PULSE — Alpine's model with kj-* attributes (x-* also accepted)
   * Fine-grained reactivity: each binding is an effect that re-runs only
   * when the exact properties it read change. Updates batch in a microtask.
   * ============================================================ */

  /* ---------------- reactivity core ---------------- */
  const RAW = Symbol('raw'), ITER = Symbol('iterate');
  const targetMap = new WeakMap(), proxyMap = new WeakMap();
  let activeEffect = null, shouldTrack = true, effectUid = 0;
  const canReact = v => isObj(v) && !Object.isFrozen(v) && (Array.isArray(v) || (() => { const p = Object.getPrototypeOf(v); return p === Object.prototype || p === null; })());
  const toRaw = v => (v && v[RAW]) || v;
  function track(t, k) {
    if (!activeEffect || !shouldTrack) return;
    let deps = targetMap.get(t); if (!deps) targetMap.set(t, deps = new Map());
    let dep = deps.get(k); if (!dep) deps.set(k, dep = new Set());
    if (!dep.has(activeEffect)) { dep.add(activeEffect); activeEffect.deps.push(dep); }
  }
  function trigger(t, k, extraKeys) {
    const deps = targetMap.get(t); if (!deps) return;
    const run = new Set();
    const add = key => { const d = deps.get(key); if (d) d.forEach(e => e !== activeEffect && run.add(e)); };
    add(k); (extraKeys || []).forEach(add);
    run.forEach(e => e.scheduler ? e.scheduler(e) : e());
  }
  const ARRAY_MUTATORS = new Set(['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin']);
  function untracked(fn) { const prev = shouldTrack, pe = activeEffect; shouldTrack = false; activeEffect = null; try { return fn(); } finally { shouldTrack = prev; activeEffect = pe; } }
  const handlers = {
    get(t, k, recv) {
      if (k === RAW) return t;
      if (Array.isArray(t) && ARRAY_MUTATORS.has(k)) {
        return function (...a) { const prev = shouldTrack; shouldTrack = false; try { return Array.prototype[k].apply(recv, a); } finally { shouldTrack = prev; } };
      }
      const v = Reflect.get(t, k, recv);
      if (typeof k === 'symbol') return v;
      track(t, k);
      return canReact(v) ? reactive(v) : v;
    },
    set(t, k, v, recv) {
      const raw = toRaw(v), had = Object.prototype.hasOwnProperty.call(t, k), old = t[k];
      const oldLen = Array.isArray(t) ? t.length : 0;
      const ok = Reflect.set(t, k, raw, recv);
      if (!Object.is(old, raw) || !had) {
        const extra = [];
        if (!had) extra.push(ITER);
        if (Array.isArray(t)) {
          if (t.length !== oldLen) extra.push('length', ITER);
          if (k === 'length') for (let i = raw; i < oldLen; i++) extra.push(String(i));
        }
        trigger(t, k, extra);
      }
      return ok;
    },
    deleteProperty(t, k) { const had = Object.prototype.hasOwnProperty.call(t, k); const ok = Reflect.deleteProperty(t, k); if (had) trigger(t, k, [ITER]); return ok; },
    has(t, k) { const r = Reflect.has(t, k); if (typeof k !== 'symbol') track(t, k); return r; },
    ownKeys(t) { track(t, Array.isArray(t) ? 'length' : ITER); return Reflect.ownKeys(t); },
  };
  function reactive(obj) {
    if (!canReact(obj)) return obj;
    if (obj[RAW]) return obj;
    let p = proxyMap.get(obj);
    if (!p) proxyMap.set(obj, p = new Proxy(obj, handlers));
    return p;
  }

  // microtask scheduler: effects re-run once per tick, parents (older) first
  const jobQueue = new Set();
  let flushPromise = null;
  function queueJob(job) { jobQueue.add(job); if (!flushPromise) flushPromise = Promise.resolve().then(flushJobs); }
  function flushJobs() {
    let guard = 0;
    while (jobQueue.size) {
      const jobs = [...jobQueue].sort((a, b) => a.id - b.id); jobQueue.clear();
      for (const j of jobs) if (j.active) j();
      if (++guard > 100) { warn('possible infinite update loop'); jobQueue.clear(); }
    }
    flushPromise = null;
  }
  const nextTick = cb => (flushPromise || Promise.resolve()).then(() => cb && cb());

  function effect(fn, opts = {}) {
    const runner = () => {
      if (!runner.active) return;
      runner.deps.forEach(d => d.delete(runner)); runner.deps.length = 0;
      const pe = activeEffect, pt = shouldTrack;
      activeEffect = runner; shouldTrack = true;
      try { return fn(); } finally { activeEffect = pe; shouldTrack = pt; }
    };
    runner.id = ++effectUid; runner.deps = []; runner.active = true;
    runner.scheduler = opts.sync ? null : queueJob;
    runner.stop = () => { runner.active = false; runner.deps.forEach(d => d.delete(runner)); runner.deps.length = 0; };
    if (!opts.lazy) runner();
    return runner;
  }

  /* ---------------- scopes & evaluation ---------------- */
  const MERGED = Symbol('merged');
  function mergeProxies(objs) {
    const owner = k => objs.find(o => k in o);
    const proxy = new Proxy({}, {
      has: (_, k) => k !== Symbol.unscopables && objs.some(o => k in o),
      get: (_, k) => {
        if (k === MERGED) return objs;
        if (k === Symbol.unscopables) return undefined;
        const o = owner(k);
        return o ? Reflect.get(o, k, proxy) : undefined;
      },
      set: (_, k, v) => {
        const o = objs.find(x => !x[NOWRITE] && Object.prototype.hasOwnProperty.call(toRaw(x), k)) || owner(k);
        const tgt = o && !o[NOWRITE] ? o : objs.find(x => !x[NOWRITE]);
        if (!tgt) { window[k] = v; return true; }
        const desc = Object.getOwnPropertyDescriptor(toRaw(tgt), k);
        if (desc && desc.set) desc.set.call(proxy, v); else tgt[k] = v;
        return true;
      },
      ownKeys: () => unique(objs.flatMap(o => Reflect.ownKeys(o))),
      getOwnPropertyDescriptor: (_, k) => { const o = owner(k); return o ? { configurable: true, enumerable: true, value: o[k], writable: true } : undefined; },
    });
    return proxy;
  }
  const NOWRITE = Symbol('readonly-scope');
  const compiled = new Map();
  const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
  function compile(expr, mode) {
    const key = mode + '\u0000' + expr;
    let fn = compiled.get(key);
    if (fn) return fn;
    const C = /\bawait\b/.test(expr) ? AsyncFn : Function;
    if (mode === 'assign') fn = new C('__kj', '__v', 'with(__kj){ ' + expr + ' = __v }');
    else {
      try { fn = new C('__kj', 'with(__kj){ return (' + expr + '\n) }'); }
      catch (e) {
        try { fn = new C('__kj', 'with(__kj){ ' + expr + '\n }'); }
        catch (e2) { warn('cannot compile expression "' + expr + '"', e2.message); fn = () => undefined; }
      }
    }
    compiled.set(key, fn);
    return fn;
  }
  const magics = {};
  function magicsFor(el) {
    return new Proxy({ [NOWRITE]: true }, {
      has: (_, k) => isStr(k) && k[0] === '$' && k in magics,
      get: (_, k) => k === NOWRITE ? true : (isStr(k) && magics[k] ? magics[k](el, $) : undefined),
    });
  }
  function scopeFor(el, chain, extras) {
    const objs = [];
    if (extras) objs.push(Object.assign({ [NOWRITE]: true }, extras));
    objs.push(...chain, magicsFor(el));
    return mergeProxies(objs);
  }
  function evaluate(el, chain, expr, extras, callFns = true) {
    if (expr == null || String(expr).trim() === '') return undefined;
    const scope = scopeFor(el, chain, extras);
    try {
      let r = compile(String(expr), 'value').call(scope, scope);
      if (callFns && isFn(r)) r = r.apply(scope, extras && extras.$args ? extras.$args : (extras && '$event' in extras ? [extras.$event] : []));
      if (r && isFn(r.then) && isFn(r.catch) && !(r instanceof MotionAnim)) r.catch(e => warn('error in expression "' + expr + '"', e, el));
      return r;
    } catch (e) { warn('error in expression "' + expr + '"\n', e, el); return undefined; }
  }
  function assign(el, chain, expr, value) {
    const scope = scopeFor(el, chain, null);
    try { compile(String(expr), 'assign').call(scope, scope, value); } catch (e) { warn('cannot assign to "' + expr + '"', e, el); }
  }
  function chainFor(el) {
    for (let n = el; n; n = n.parentElement || (n.parentNode && n.parentNode.host)) {
      const d = dataStore.get(n);
      if (d && d.chain) return d.chain;
    }
    return [];
  }
  function rootFor(el) {
    for (let n = el; n; n = n.parentElement) { const d = dataStore.get(n); if (d && d.data) return n; }
    return null;
  }
  function addCleanup(el, fn) { const d = nodeData(el); (d.cleanups || (d.cleanups = [])).push(fn); }

  /* ---------------- stores, components, magics ---------------- */
  const stores = reactive({});
  const components = {};
  $.components = components;
  $.component = (name, factory) => { components[name] = factory; return factory; };
  $.store = (name, value) => {
    if (value !== undefined) {
      if (value && isFn(value._kjIntercept)) value = value._kjIntercept(name, stores, null);
      stores[name] = value; const s = stores[name];
      if (isObj(s)) for (const k of Object.keys(toRaw(s))) { const v = toRaw(s)[k]; if (v && isFn(v._kjIntercept)) toRaw(s)[k] = v._kjIntercept(k, s, null); }
      if (isObj(s) && isFn(s.init)) s.init();
      return s;
    }
    if (!(name in toRaw(stores))) stores[name] = {};
    return stores[name];
  };
  $.reactive = reactive;
  $.raw = toRaw;
  $.effect = fn => { const r = effect(fn); return r.stop; };
  $.nextTick = nextTick;
  $.magic = (name, fn) => { magics['$' + name.replace(/^\$/, '')] = fn; };
  const idCounters = {};
  Object.assign(magics, {
    $el: el => el,
    $refs: el => {
      const out = {};
      const roots = [];
      for (let n = el; n; n = n.parentElement) { const d = dataStore.get(n); if (d && d.refs) roots.push(d.refs); }
      roots.reverse().forEach(r => Object.assign(out, r));
      return out;
    },
    $root: el => rootFor(el),
    $data: el => mergeProxies(chainFor(el)),
    $store: () => stores,
    $dispatch: el => (name, detail) => el.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true, cancelable: true })),
    $nextTick: () => nextTick,
    $watch: el => (expr, cb) => watch(el, chainFor(el), expr, cb),
    $id: el => (name, key) => {
      let scopeEl = null;
      for (let n = el; n; n = n.parentElement) { const d = dataStore.get(n); if (d && d.idScope && d.idScope.names.includes(name)) { scopeEl = d.idScope; break; } }
      let id;
      if (scopeEl) id = scopeEl.ids[name] || (scopeEl.ids[name] = name + '-' + (idCounters[name] = (idCounters[name] || 0) + 1));
      else id = name + '-' + (idCounters[name] = (idCounters[name] || 0) + 1);
      return key != null ? id + '-' + key : id;
    },
  });
  function watch(el, chain, expr, cb) {
    let first = true, old, oldJson;
    const r = effect(() => {
      const v = isFn(expr) ? expr() : evaluate(el, chain, expr, null, false);
      let json; try { json = JSON.stringify(v); } catch (e) { json = undefined; }
      if (first) { first = false; old = isObj(v) && json ? JSON.parse(json) : v; oldJson = json; return; }
      if (json === oldJson && (isObj(v) || Object.is(v, old))) return;
      const prev = old; old = isObj(v) && json ? JSON.parse(json) : v; oldJson = json;
      untracked(() => cb(v, prev));
    });
    if (el) addCleanup(el, r.stop);
    return r.stop;
  }
  $.watch = (getter, cb) => watch(null, [], getter, cb);

  /* ---------------- transitions ---------------- */
  function parseDurationMs(s) { return Math.max(0, ...String(s || '0s').split(',').map(x => parseFloat(x) * (x.trim().endsWith('ms') ? 1 : 1000))); }
  function cssDuration(el) {
    const cs = getComputedStyle(el);
    return Math.max(parseDurationMs(cs.transitionDuration) + parseDurationMs(cs.transitionDelay), parseDurationMs(cs.animationDuration) + parseDurationMs(cs.animationDelay));
  }
  const modVal = (mods, key, dflt) => {
    const i = mods.indexOf(key); if (i < 0) return dflt;
    const v = mods[i + 1]; if (v == null) return dflt;
    if (key === 'duration' || key === 'delay') { const m = v.match(/^(\d+)(ms|s)?$/); return m ? +m[1] * (m[2] === 's' ? 1000 : 1) : dflt; }
    if (key === 'scale') return isNaN(+v) ? dflt : +v / 100;
    if (key === 'origin') return ['top', 'bottom', 'left', 'right', 'center'].includes(v) ? [v, mods[i + 2]].filter(x => ['top', 'bottom', 'left', 'right', 'center'].includes(x)).join(' ') : dflt;
    return v;
  };
  function runTransition(el, phase, done) {
    const d = nodeData(el), cfg = d.transition;
    if (d.trans) d.trans.cancel();
    if (!cfg) { done && done(); return; }
    let cancelled = false;
    const finish = () => { if (cancelled) return; d.trans = null; done && done(); };
    if (cfg.custom) { d.trans = cfg.custom(el, phase, finish) || null; if (d.trans && !d.trans.cancel) d.trans = null; return; }
    if (cfg.classes) {
      const c = cfg.classes, split = s => (s || '').split(/\s+/).filter(Boolean);
      const during = split(c[phase]), start = split(c[phase + '-start']), end = split(c[phase + '-end']);
      el.classList.add(...during, ...start);
      void el.offsetHeight;
      let timer;
      const id = raf(() => {
        el.classList.remove(...start); el.classList.add(...end);
        timer = setTimeout(() => { el.classList.remove(...during, ...end); finish(); }, cssDuration(el));
      });
      d.trans = { cancel() { cancelled = true; clearTimeout(timer); window.cancelAnimationFrame && cancelAnimationFrame(id); el.classList.remove(...during, ...start, ...end); } };
      return;
    }
    const mods = cfg[phase] || cfg.both || [];
    const explicit = mods.includes('opacity') || mods.includes('scale');
    const useOpacity = !explicit || mods.includes('opacity'), useScale = !explicit || mods.includes('scale');
    const base = modVal(mods, 'duration', null);
    const duration = phase === 'enter' ? (base ?? 150) : (cfg.leave && modVal(cfg.leave, 'duration', null)) ?? (base != null ? base / 2 : 75);
    const scale = modVal(mods, 'scale', 0.95), delay = modVal(mods, 'delay', 0), origin = modVal(mods, 'origin', 'center');
    const hidden = {}, shown = {};
    if (useOpacity) { hidden.opacity = 0; shown.opacity = 1; }
    if (useScale) { hidden.transform = 'scale(' + scale + ')'; shown.transform = 'scale(1)'; }
    if (!isFn(el.animate) || $.fx.off) { finish(); return; }
    el.style.transformOrigin = origin;
    const anim = el.animate(phase === 'enter' ? [hidden, shown] : [shown, hidden],
      { duration, delay, easing: phase === 'enter' ? 'cubic-bezier(0.4, 0, 0.2, 1)' : 'cubic-bezier(0.4, 0, 1, 1)', fill: 'both' });
    anim.onfinish = () => { anim.cancel(); finish(); };
    d.trans = { cancel() { cancelled = true; anim.cancel(); } };
  }
  function setShown(el, show, important) {
    const d = nodeData(el);
    if (show) { el.style.removeProperty('display'); if (d.origDisplay) el.style.display = d.origDisplay; if (isHidden(el) && important === 'force') el.style.display = defaultDisplay(el); d.shownAt = now(); }
    else el.style.setProperty('display', 'none', important ? 'important' : '');
    d.isShown = show;
  }
  $.pulse = $.pulse || {};
  $.pulse.transition = (el, phase) => new Promise(r => runTransition($(el)[0], phase, r));

  /* ---------------- directive parsing ---------------- */
  const PULSE_PREFIXES = ['kj-', 'x-', 'data-kj-'];
  const DIRECTIVE_ORDER = ['ignore', 'ref', 'data', 'id', 'bind', 'init', 'for', 'model', 'on', 'transition', 'show', 'if', 'text', 'html', 'effect', 'teleport', 'DEFAULT', 'cloak'];
  const directives = {};
  const HYPER_EVENTS = ['config', 'before', 'after', 'beforeSwap', 'afterSwap', 'afterSettle', 'error', 'load', 'confirm', 'abort', 'sendError',
    'oobBeforeSwap', 'oobAfterSwap', 'beforeHistorySave', 'historyRestore', 'pushedIntoHistory', 'replacedInHistory', 'validation:failed'];
  const HYPER_EVENT_MAP = Object.assign(Object.fromEntries(HYPER_EVENTS.flatMap(e => [[e.toLowerCase(), e], [kebab(e), e]])),
    { 'before-request': 'before', 'after-request': 'after', 'config-request': 'config', 'response-error': 'error', 'beforerequest': 'before', 'afterrequest': 'after', 'configrequest': 'config', 'responseerror': 'error' });
  function parseDirective(attr) {
    let name = attr.name, rest = null;
    if (name[0] === '@') rest = 'on:' + name.slice(1);
    else if (name[0] === ':') rest = 'bind:' + name.slice(1);
    else {
      for (const p of PULSE_PREFIXES) if (name.startsWith(p)) { rest = name.slice(p.length); break; }
      if (rest == null && name.startsWith('hx-on')) rest = 'on' + name.slice(5).replace(/^-/, ':');
      if (rest == null) return null;
    }
    const m = rest.match(/^([a-z][a-z0-9-]*)/); if (!m) return null;
    const type = m[1];
    if (!directives[type]) return null;
    let after = rest.slice(type.length), value = null, mods = [];
    if (after[0] === ':') {
      after = after.slice(1);
      if (after[0] === ':') { const end = after.indexOf('.', 1); value = end < 0 ? after : after.slice(0, end); after = end < 0 ? '' : after.slice(end); }
      else { const end = after.indexOf('.'); value = end < 0 ? after : after.slice(0, end); after = end < 0 ? '' : after.slice(end); }
    }
    if (after[0] === '.') mods = after.slice(1).split('.');
    return { type, value, modifiers: mods, expression: attr.value, raw: attr.name };
  }
  function directivesOf(el) {
    const list = [];
    for (const a of el.attributes) {
      const c = a.name.charCodeAt(0);
      if (c !== 64 && c !== 58 && c !== 107 && c !== 120 && c !== 100 && c !== 104) continue;   // @ : k x d h
      const d = parseDirective(a); if (d) list.push(d);
    }
    const rank = t => { const i = DIRECTIVE_ORDER.indexOf(t); return i < 0 ? DIRECTIVE_ORDER.indexOf('DEFAULT') : i; };
    return list.sort((a, b) => rank(a.type) - rank(b.type));
  }
  $.directive = (name, fn) => { directives[name] = fn; if (!DIRECTIVE_ORDER.includes(name)) { /* runs at DEFAULT priority */ } return { before(other) { const i = DIRECTIVE_ORDER.indexOf(other); if (i >= 0) DIRECTIVE_ORDER.splice(i, 0, name); } }; };

  /* ---------------- tree walking ---------------- */
  function makeCtx(el, chain) {
    return {
      el, chain, $,
      evaluate: (expr, extras, callFns) => evaluate(el, chain, expr, extras, callFns),
      evaluateLater: expr => (cb = () => {}, extras) => cb(evaluate(el, chain, expr, extras)),
      effect: fn => { const r = effect(fn); addCleanup(el, r.stop); return r; },
      cleanup: fn => addCleanup(el, fn),
      reactive, nextTick,
    };
  }
  function walk(el, chain) {
    if (!isEl(el)) return;
    const d = nodeData(el);
    if (d.pulsed) { if (d.pulseSkip) return; chain = d.chain || chain; }
    else {
      d.pulsed = true;
      const dirs = directivesOf(el);
      if (dirs.length) {
        for (const dir of dirs) {
          if (dir.type === 'ignore') { if (!dir.modifiers.includes('self')) { d.pulseSkip = true; return; } break; }
          if (el.tagName === 'TEMPLATE' && dir.type === 'bind' && dir.value === 'key') continue;
          const ctx = makeCtx(el, chain);
          let out;
          try { out = directives[dir.type](el, dir, ctx); } catch (e) { warn('directive ' + dir.raw + ' failed', e, el); }
          if (out && out.chain) { chain = out.chain; d.chain = chain; }
          if (out && out.stop) { d.pulseSkip = true; break; }
          if (isFn(out)) addCleanup(el, out);
        }
        for (const p of PULSE_PREFIXES) el.removeAttribute(p + 'cloak');
        if (d.pulseSkip) return;
      }
    }
    if (el.tagName === 'TEMPLATE') return;
    for (let c = el.firstElementChild; c; ) { const next = c.nextElementSibling; walk(c, chain); c = next; }
  }
  function processPulse(root, chain) {
    if (!root) return;
    if (root === document || root.nodeType === 9) root = document.documentElement;
    if (root.nodeType === 11) { [...root.children].forEach(c => processPulse(c, chain)); return; }
    if (!isEl(root)) return;
    for (let n = root.parentElement; n; n = n.parentElement) { const d = dataStore.get(n); if (d && d.pulseSkip) return; }
    untracked(() => walk(root, chain || chainFor(root.parentElement)));
  }
  function cloneTemplate(tpl, all) {
    const frag = document.importNode(tpl.content, true);
    if (all) return [...frag.childNodes];
    const els = [...frag.children];
    if (els.length !== 1) warn('<template> used with kj-for / kj-teleport should have exactly one root element', tpl);
    return els.slice(0, 1);
  }

  /* ---------------- directives ---------------- */
  directives.ignore = () => {};
  directives.cloak = () => {};
  directives.ref = (el, { expression }) => {
    const root = rootFor(el.parentElement) || document.documentElement;
    const d = nodeData(root); (d.refs || (d.refs = {}))[expression] = el;
    return () => { if (d.refs && d.refs[expression] === el) delete d.refs[expression]; };
  };
  directives.data = (el, { expression }, ctx) => {
    const raw = (expression || '').trim();
    let value;
    const bare = raw.match(/^([A-Za-z_$][\w$]*)$/);
    if (!raw) value = {};
    else if (bare && components[bare[1]]) value = components[bare[1]].call(null);
    else value = evaluate(el, ctx.chain, raw, Object.assign({}, components), true);
    if (!isObj(value)) value = {};
    const data = reactive(value);
    for (const k of Object.keys(value)) { const v = value[k]; if (v && isFn(v._kjIntercept)) toRaw(data)[k] = v._kjIntercept(k, data, el); }
    const d = nodeData(el);
    d.data = data;
    const chain = [data, ...ctx.chain];
    d.chain = chain;
    const scope = scopeFor(el, chain, null);
    const raw0 = toRaw(data);
    if (isFn(raw0.init)) { try { const r = raw0.init.call(scope, el); if (r && isFn(r.catch)) r.catch(e => warn('init()', e)); } catch (e) { warn('init() failed', e, el); } }
    addCleanup(el, () => { if (isFn(raw0.destroy)) { try { raw0.destroy.call(scope); } catch (e) { warn('destroy()', e); } } });
    return { chain };
  };
  directives.id = (el, { expression }, ctx) => { nodeData(el).idScope = { names: [].concat(ctx.evaluate(expression) || []), ids: {} }; };
  directives.init = (el, { expression }, ctx) => { if (expression) ctx.evaluate(expression); };
  directives.effect = (el, { expression }, ctx) => { ctx.effect(() => ctx.evaluate(expression)); };
  directives.text = (el, { expression }, ctx) => {
    ctx.effect(() => { const v = ctx.evaluate(expression); const t = v == null ? '' : String(v); if (el.textContent !== t) el.textContent = t; });
  };
  directives.html = (el, { expression }, ctx) => {
    let last;
    ctx.effect(() => {
      const h = String(ctx.evaluate(expression) ?? '');
      if (h === last) return; last = h;
      untracked(() => { [...el.children].forEach(destroyTree); el.innerHTML = h; [...el.children].forEach(c => walk(c, ctx.chain)); });
    });
  };
  directives.show = (el, { expression, modifiers }, ctx) => {
    const d = nodeData(el);
    d.origDisplay = el.style.display === 'none' ? '' : el.style.display;
    let first = true;
    ctx.effect(() => {
      const show = !!ctx.evaluate(expression);
      untracked(() => {
        if (first) { first = false; setShown(el, show, modifiers.includes('important')); return; }
        if (show === d.isShown) return;
        if (show) { setShown(el, true, modifiers.includes('important')); if (d.transition) runTransition(el, 'enter'); }
        else if (d.transition) { d.isShown = false; runTransition(el, 'leave', () => { if (!d.isShown && !(d.transition.custom && d.transition.custom.noHide)) setShown(el, false, modifiers.includes('important')); }); }
        else setShown(el, false, modifiers.includes('important'));
      });
    });
  };
  directives.transition = (el, { value, modifiers, expression }) => {
    const d = nodeData(el);
    const t = d.transition || (d.transition = {});
    if (value && expression) { (t.classes || (t.classes = {}))[value] = expression; return; }
    if (value === 'enter' || value === 'leave') t[value] = modifiers; else t.both = modifiers;
  };

  const KEY_ALIASES = { up: 'arrow-up', down: 'arrow-down', left: 'arrow-left', right: 'arrow-right', esc: 'escape', space: ' ', spacebar: ' ',
    slash: '/', period: '.', equal: '=', minus: '-', comma: ',', plus: '+', underscore: '_', 'page-up': 'page-up', 'page-down': 'page-down' };
  const NON_KEY_MODS = new Set(['prevent', 'stop', 'self', 'once', 'passive', 'capture', 'window', 'document', 'outside', 'away', 'debounce', 'throttle', 'camel', 'dot', 'stop-propagation', 'passive']);
  const SYS_MODS = { ctrl: 'ctrlKey', shift: 'shiftKey', alt: 'altKey', meta: 'metaKey', cmd: 'metaKey', super: 'metaKey' };
  function eventName(value, modifiers) {
    let name = value || '';
    if (name.startsWith(':')) name = 'kj:' + (HYPER_EVENT_MAP[name.slice(1)] || camel(name.slice(1)));
    else if (name.startsWith('kj:')) name = 'kj:' + (HYPER_EVENT_MAP[name.slice(3)] || name.slice(3));
    if (modifiers.includes('camel')) name = camel(name);
    if (modifiers.includes('dot')) name = name.replace(/-/g, '.');
    return name;
  }
  directives.on = (el, { value, modifiers: mods, expression }, ctx) => {
    let name = eventName(value, mods);
    if (name === 'away') name = 'click';
    const outside = mods.includes('outside') || mods.includes('away') || value === 'away';
    let listenOn = mods.includes('window') ? window : mods.includes('document') || outside ? document : el;
    const timeMod = k => { const i = mods.indexOf(k); if (i < 0) return null; const n = mods[i + 1]; const m = n && n.match(/^(\d+)(ms|s)?$/); return m ? +m[1] * (m[2] === 's' ? 1000 : 1) : 250; };
    const keyMods = mods.filter(m => !NON_KEY_MODS.has(m) && !/^\d+(ms|s)?$/.test(m));
    const isKeyEvt = /^key/.test(name);
    let handler = e => {
      if (outside) {
        if (el.contains(e.target) || !e.target.isConnected || isHidden(el) || nodeData(el).isShown === false) return;
        const shownAt = nodeData(el).shownAt; if (shownAt && e.timeStamp && e.timeStamp <= shownAt) return;
      }
      if (mods.includes('self') && e.target !== el) return;
      if (keyMods.length && (isKeyEvt || e instanceof MouseEvent)) {
        const sys = keyMods.filter(m => SYS_MODS[m]), keys = keyMods.filter(m => !SYS_MODS[m]);
        if (!sys.every(m => e[SYS_MODS[m]])) return;
        if (isKeyEvt && keys.length) {
          const k = kebab(String(e.key || '')).replace(/^-/, '').replace(/^ $/, ' ');
          if (!keys.some(m => (KEY_ALIASES[m] || m) === k || (KEY_ALIASES[m] || m) === String(e.key).toLowerCase())) return;
        }
      }
      if (mods.includes('prevent')) e.preventDefault();
      if (mods.includes('stop')) e.stopPropagation();
      if (mods.includes('once')) listenOn.removeEventListener(name, wrapped, opts);
      evaluate(el, ctx.chain, expression, { $event: e }, true);
    };
    const deb = timeMod('debounce'), thr = timeMod('throttle');
    if (deb != null) handler = $.debounce(handler, deb);
    if (thr != null) handler = $.throttle(handler, thr);
    const wrapped = e => handler(e);
    const opts = { passive: mods.includes('passive'), capture: mods.includes('capture') };
    if (!name) return;
    listenOn.addEventListener(name, wrapped, opts);
    return () => listenOn.removeEventListener(name, wrapped, opts);
  };

  function applyClass(el, d, v) {
    if (!d.staticClass) d.staticClass = new Set((el.getAttribute('class') || '').split(/\s+/).filter(Boolean));
    const want = new Set();
    const addTokens = x => { if (!x) return; if (isStr(x)) x.split(/\s+/).forEach(c => c && want.add(c)); else if (Array.isArray(x)) x.forEach(addTokens); else if (isObj(x)) for (const k in x) if (x[k]) addTokens(k); };
    addTokens(v);
    (d.dynClass || []).forEach(c => { if (!want.has(c) && !d.staticClass.has(c)) el.classList.remove(c); });
    want.forEach(c => el.classList.add(c));
    d.dynClass = [...want];
  }
  function applyStyle(el, d, v) {
    const want = {};
    if (isStr(v)) v.split(';').forEach(decl => { const i = decl.indexOf(':'); if (i > 0) want[decl.slice(0, i).trim()] = decl.slice(i + 1).trim(); });
    else if (isObj(v)) for (const k in v) want[k.startsWith('--') ? k : kebab(k)] = v[k];
    (d.dynStyle || []).forEach(k => { if (!(k in want)) el.style.removeProperty(k); });
    for (const k in want) { const val = want[k]; if (val == null || val === false) el.style.removeProperty(k); else { const imp = /!important$/.test(String(val)); el.style.setProperty(k, String(val).replace(/\s*!important$/, ''), imp ? 'important' : ''); } }
    d.dynStyle = Object.keys(want);
  }
  const PRESERVE_FALSY = n => /^(aria-|data-)/.test(n);
  function bindAttr(el, name, v, mods) {
    const d = nodeData(el);
    if (mods && mods.includes('camel')) name = camel(name);
    if (name === 'class') return applyClass(el, d, v);
    if (name === 'style') return applyStyle(el, d, v);
    if (mods && mods.includes('prop')) { el[camel(name)] = v; return; }
    if (name === 'value' && 'value' in el && el.tagName !== 'BUTTON' && el.tagName !== 'OPTION' && el.type !== 'checkbox' && el.type !== 'radio') { const s = v == null ? '' : String(v); if (el.value !== s) el.value = s; return; }
    if ((name === 'checked' || name === 'selected') && name in el) { el[name] = !!v; return; }
    if (BOOL_ATTRS.has(name)) { v ? el.setAttribute(name, '') : el.removeAttribute(name); if (name in el && typeof el[name] === 'boolean') el[name] = !!v; return; }
    if ((v === null || v === undefined || v === false) && !PRESERVE_FALSY(name)) { el.removeAttribute(name); return; }
    el.setAttribute(name, v === true && !PRESERVE_FALSY(name) ? 'true' : String(v));
  }
  directives.bind = (el, { value, modifiers, expression }, ctx) => {
    if (!value) {                                         // kj-bind="{ ':class': …, '@click': … }" object spread
      const obj = ctx.evaluate(expression, null, false) || {};
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        const call = (extras) => isFn(val) ? val.call(scopeFor(el, ctx.chain, extras), extras && extras.$event) : val;
        if (key[0] === '@' || key.startsWith('kj-on:') || key.startsWith('x-on:')) {
          const [ev, ...mods] = key.replace(/^(@|kj-on:|x-on:)/, '').split('.');
          const h = e => { if (mods.includes('prevent')) e.preventDefault(); if (mods.includes('stop')) e.stopPropagation(); call({ $event: e }); };
          el.addEventListener(ev, h); addCleanup(el, () => el.removeEventListener(ev, h));
        } else if (/^(kj-|x-)text$/.test(key)) ctx.effect(() => { el.textContent = String(call() ?? ''); });
        else if (/^(kj-|x-)html$/.test(key)) ctx.effect(() => { el.innerHTML = String(call() ?? ''); });
        else if (/^(kj-|x-)show$/.test(key)) ctx.effect(() => setShown(el, !!call()));
        else { const attr = key.replace(/^(:|kj-bind:|x-bind:)/, ''); ctx.effect(() => bindAttr(el, attr, call())); }
      }
      return;
    }
    ctx.effect(() => { const v = ctx.evaluate(expression, null, false); untracked(() => bindAttr(el, value, v, modifiers)); });
  };

  directives.model = (el, { modifiers: mods, expression }, ctx) => {
    const type = el.type, tag = el.tagName;
    const isCheck = type === 'checkbox', isRadio = type === 'radio', isSelect = tag === 'SELECT';
    const getState = () => evaluate(el, ctx.chain, expression, null, false);
    const castNum = v => { const n = parseFloat(v); return v === '' || isNaN(n) ? v : n; };
    const transform = raw => {
      let v = raw;
      if (mods.includes('trim') && isStr(v)) v = v.trim();
      if (mods.includes('number')) v = Array.isArray(v) ? v.map(castNum) : castNum(v);
      if (mods.includes('boolean')) v = Array.isArray(v) ? v.map(x => x === 'true' || x === true) : (v === 'true' || v === true);
      return v;
    };
    const readEl = () => {
      if (isCheck) {
        const cur = getState();
        if (Array.isArray(cur)) {
          const val = transform(el.value), raw = toRaw(cur).slice();
          const has = raw.some(x => String(x) === String(val));
          return el.checked ? (has ? raw : raw.concat([val])) : raw.filter(x => String(x) !== String(val));
        }
        return el.checked;
      }
      if (isRadio) return transform(el.value);
      if (isSelect && el.multiple) return transform([...el.selectedOptions].map(o => o.value));
      return transform(el.value);
    };
    const write = () => assign(el, ctx.chain, expression, readEl());
    if (mods.includes('fill')) {
      const init = untracked(getState);
      if ((init == null || init === '') && (!isRadio || el.checked) && (!isCheck || el.checked)) write();
    }
    const evName = mods.includes('lazy') || isCheck || isRadio || isSelect ? 'change' : 'input';
    let handler = () => write();
    const deb = mods.indexOf('debounce'), thr = mods.indexOf('throttle');
    if (deb >= 0) handler = $.debounce(handler, parseTime(mods[deb + 1], 250) || 250);
    if (thr >= 0) handler = $.throttle(handler, parseTime(mods[thr + 1], 250) || 250);
    el.addEventListener(evName, handler);
    ctx.cleanup(() => el.removeEventListener(evName, handler));
    if (el.form) {                               // native form.reset() does not fire input events
      const onReset = () => setTimeout(() => { if (el.isConnected) write(); }, 0);
      el.form.addEventListener('reset', onReset); ctx.cleanup(() => el.form && el.form.removeEventListener('reset', onReset));
    }
    const apply = v => {
      if (isCheck) el.checked = Array.isArray(v) ? v.some(x => String(x) === String(el.value)) : !!v;
      else if (isRadio) el.checked = v != null && String(v) === String(el.value);
      else if (isSelect && el.multiple) { const want = [].concat(v || []).map(String); [...el.options].forEach(o => { o.selected = want.includes(o.value); }); }
      else {
        const s = v == null ? '' : String(v);
        if (el.value === s) return;
        if (el === document.activeElement && Object.is(transform(el.value), v)) return;   // don't fight the caret mid-typing
        el.value = s;
      }
    };
    ctx.effect(() => {
      const v = getState();
      if (isObj(v)) JSON.stringify(v);                  // track array contents for checkbox groups / multi-selects
      untracked(() => { apply(v); if (isSelect) nextTick(() => apply(untracked(getState))); });
    });
    // let $dispatch('input') on custom components work: el._kjModel exposes get/set
    nodeData(el).model = { get: () => untracked(getState), set: v => assign(el, ctx.chain, expression, v) };
  };

  function parseFor(expr) {
    const m = String(expr).match(/^\s*([\s\S]+?)\s+(?:in|of)\s+([\s\S]+?)\s*$/);
    if (!m) { warn('bad kj-for expression', expr); return null; }
    let lhs = m[1].trim();
    if (lhs.startsWith('(') && lhs.endsWith(')')) lhs = lhs.slice(1, -1);
    const parts = splitTopLevel(lhs).map(s => s.trim());
    return { item: parts[0], index: parts[1], third: parts[2], items: m[2] };
  }
  function forScopeVals(p, item, index, key, isObjIter) {
    const vals = {};
    if (/^[\[{]/.test(p.item)) {
      const names = (p.item.match(/[A-Za-z_$][\w$]*(?=\s*[,}\]=:]|\s*$)/g) || []).filter((n, i, a) => a.indexOf(n) === i);
      try { Object.assign(vals, new Function('__v', 'const ' + p.item + ' = __v; return {' + names.join(',') + '}')(item)); } catch (e) { warn('kj-for destructuring', e); }
    } else vals[p.item] = item;
    if (p.index) vals[p.index] = isObjIter ? key : index;
    if (p.third) vals[p.third] = index;
    return vals;
  }
  directives.for = (tpl, { expression }, ctx) => {
    if (tpl.tagName !== 'TEMPLATE') { warn('kj-for must be on a <template>', tpl); return { stop: true }; }
    const p = parseFor(expression); if (!p) return { stop: true };
    const keyExpr = ['kj-bind:key', 'x-bind:key', ':key'].map(a => tpl.getAttribute(a)).find(v => v != null);
    let lookup = new Map();
    ctx.effect(() => {
      let items = ctx.evaluate(p.items, null, false);
      if (Array.isArray(items)) for (let i = 0; i < items.length; i++) items[i];
      else if (isObj(items)) Object.keys(items).forEach(k => items[k]);
      untracked(() => {
        let entries;
        if (typeof items === 'number') entries = Array.from({ length: Math.max(0, Math.floor(items)) }, (_, i) => [i + 1, i, i]);
        else if (Array.isArray(items)) entries = items.map((v, i) => [v, i, i]);
        else if (isObj(items)) entries = Object.keys(items).map((k, i) => [items[k], i, k]);
        else entries = [];
        const isObjIter = isObj(items) && !Array.isArray(items);
        const next = new Map(), order = [];
        entries.forEach(([item, i, k]) => {
          const vals = forScopeVals(p, item, i, k, isObjIter);
          let key = keyExpr ? evaluate(tpl, [Object.assign({ [NOWRITE]: true }, vals), ...ctx.chain], keyExpr, null, false) : (isObjIter ? k : i);
          if (next.has(key)) { warn('duplicate kj-for key', key, tpl); key = key + '\u0000' + i; }
          next.set(key, vals); order.push(key);
        });
        for (const [key, rec] of lookup) if (!next.has(key)) { destroyTree(rec.node); rec.node.remove(); lookup.delete(key); }
        let prev = tpl;
        const fresh = new Map();
        for (const key of order) {
          let rec = lookup.get(key);
          const vals = next.get(key);
          if (rec) Object.keys(vals).forEach(k => { if (!Object.is(toRaw(rec.scope)[k], toRaw(vals[k]))) rec.scope[k] = vals[k]; });
          else {
            const [node] = cloneTemplate(tpl);
            if (!node) continue;
            rec = { node, scope: reactive(vals) };
            nodeData(node).chain = [rec.scope, ...ctx.chain];
          }
          if (prev.nextSibling !== rec.node) prev.after(rec.node);
          if (!lookup.has(key)) walk(rec.node, nodeData(rec.node).chain);
          fresh.set(key, rec);
          prev = rec.node;
        }
        lookup = fresh;
      });
    });
    ctx.cleanup(() => { lookup.forEach(rec => { destroyTree(rec.node); rec.node.remove(); }); lookup.clear(); });
    return { stop: true };
  };
  directives.if = (tpl, { expression }, ctx) => {
    if (tpl.tagName !== 'TEMPLATE') { warn('kj-if must be on a <template>', tpl); return { stop: true }; }
    let nodes = null;
    const remove = () => { if (nodes) { nodes.forEach(n => { if (isEl(n)) destroyTree(n); n.remove(); }); nodes = null; } };
    ctx.effect(() => {
      const show = !!ctx.evaluate(expression);
      untracked(() => {
        if (show && !nodes) {
          nodes = cloneTemplate(tpl, true);
          nodes.forEach(n => { if (isEl(n)) nodeData(n).chain = ctx.chain; });
          tpl.after(...nodes);
          nodes.forEach(n => walk(n, ctx.chain));
        } else if (!show) remove();
      });
    });
    ctx.cleanup(remove);
    return { stop: true };
  };
  directives.teleport = (tpl, { expression, modifiers }, ctx) => {
    if (tpl.tagName !== 'TEMPLATE') { warn('kj-teleport must be on a <template>', tpl); return { stop: true }; }
    const target = document.querySelector(expression);
    if (!target) { warn('kj-teleport target not found', expression); return { stop: true }; }
    const [node] = cloneTemplate(tpl);
    if (!node) return { stop: true };
    nodeData(node).chain = ctx.chain;
    if (modifiers.includes('prepend')) target.before(node); else if (modifiers.includes('append')) target.after(node); else target.append(node);
    walk(node, ctx.chain);
    ctx.cleanup(() => { destroyTree(node); node.remove(); });
    return { stop: true };
  };
  $.pulse = Object.assign($.pulse, {
    reactive, effect: $.effect, raw: toRaw, nextTick, flush: flushJobs, directives, magics, evaluate: (el, expr, extras) => evaluate($(el)[0], chainFor($(el)[0]), expr, extras),
    data: $.component, store: $.store, process: el => processPulse($(el)[0]), prefixes: PULSE_PREFIXES,
    $data: el => mergeProxies(chainFor($(el)[0])),
    setShown: (el, show) => setShown($(el)[0], show), setTransition: (el, custom) => { nodeData($(el)[0]).transition = { custom }; }, isShown: el => nodeData($(el)[0]).isShown !== false,
  });
  $.$data = $.pulse.$data;
