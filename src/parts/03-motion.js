  /* ============================================================
   * MOTION — a time-based tween engine with GSAP's API:
   * tweens & timelines are controllable (pause/reverse/seek/progress/timeScale),
   * repeat/yoyo, labels, nesting, colours, CSS variables, SVG attributes,
   * grid staggers, keyframes, set/quickTo/utils — plus jQuery's fx queue.
   * ============================================================ */
  const PI = Math.PI;
  const clamp = (lo, hi, v) => v < lo ? lo : v > hi ? hi : v;

  /* ---------------- easing ---------------- */
  const easeTypes = fin => ({ in: fin, out: t => 1 - fin(1 - t), inOut: t => t < .5 ? fin(t * 2) / 2 : 1 - fin((1 - t) * 2) / 2 });
  const pow = p => t => Math.pow(t, p);
  function bounceOut(t) {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375;
    return n * (t -= 2.625 / d) * t + .984375;
  }
  const EASE_FAMILIES = {
    power0: () => easeTypes(t => t), linear: () => easeTypes(t => t), none: () => easeTypes(t => t),
    power1: () => easeTypes(pow(2)), quad: () => easeTypes(pow(2)),
    power2: () => easeTypes(pow(3)), cubic: () => easeTypes(pow(3)),
    power3: () => easeTypes(pow(4)), quart: () => easeTypes(pow(4)),
    power4: () => easeTypes(pow(5)), quint: () => easeTypes(pow(5)), strong: () => easeTypes(pow(5)),
    sine: () => easeTypes(t => 1 - Math.cos(t * PI / 2)),
    expo: () => easeTypes(t => t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
    circ: () => easeTypes(t => 1 - Math.sqrt(1 - t * t)),
    back: (s = 1.70158) => easeTypes(t => t * t * ((s + 1) * t - s)),
    elastic: (amp = 1, period = .3) => {
      const a = Math.max(1, amp), s = period / (2 * PI) * Math.asin(1 / a);
      return easeTypes(t => t === 0 || t === 1 ? t : -(a * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1 - s) * (2 * PI) / period)));
    },
    bounce: () => easeTypes(t => 1 - bounceOut(1 - t)),
  };
  function cubicBezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
    return x => {
      if (x <= 0) return 0; if (x >= 1) return 1;
      let t = x;
      for (let i = 0; i < 8; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; t -= e / d; }
      if (Math.abs(X(t) - x) > 1e-4) { let lo = 0, hi = 1; t = x; for (let i = 0; i < 40; i++) { X(t) < x ? (lo = t) : (hi = t); t = (lo + hi) / 2; } }
      return Y(t);
    };
  }
  const CSS_EASES = { ease: [.25, .1, .25, 1], 'ease-in': [.42, 0, 1, 1], 'ease-out': [0, 0, .58, 1], 'ease-in-out': [.42, 0, .58, 1] };
  const JQUI = { Quad: 'power1', Cubic: 'power2', Quart: 'power3', Quint: 'power4', Sine: 'sine', Expo: 'expo', Circ: 'circ', Back: 'back', Elastic: 'elastic', Bounce: 'bounce' };
  const easeCache = new Map();
  function parseEase(e) {
    if (isFn(e)) return e;
    if (e == null) return parseEase(motionDefaults.ease);
    const key = String(e).trim();
    if (easeCache.has(key)) return easeCache.get(key);
    let fn, m;
    if (key === 'swing') fn = t => .5 - Math.cos(t * PI) / 2;
    else if (CSS_EASES[key]) fn = cubicBezier(...CSS_EASES[key]);
    else if ((m = key.match(/^cubic-bezier\(([^)]+)\)$/))) fn = cubicBezier(...m[1].split(',').map(Number));
    else if ((m = key.match(/^steps\((\d+)\)$/))) { const n = +m[1]; fn = t => t >= 1 ? 1 : Math.floor(t * n) / n; }
    else if ((m = key.match(/^ease(In|Out|InOut)(Quad|Cubic|Quart|Quint|Sine|Expo|Circ|Back|Elastic|Bounce)$/))) fn = parseEase(JQUI[m[2]] + '.' + m[1][0].toLowerCase() + m[1].slice(1));
    else if ((m = key.match(/^([a-zA-Z]\w*)(?:\.(in|out|inOut))?(?:\(([^)]*)\))?$/)) && EASE_FAMILIES[m[1]]) {
      const args = m[3] ? m[3].split(',').map(Number) : [];
      fn = EASE_FAMILIES[m[1]](...args)[m[2] || 'out'];
    } else if ($.easing && isFn($.easing[key]) && !$.easing[key].kjFromParse) { const f = $.easing[key]; return f.length > 1 ? t => f(t, t, 0, 1, 1) : f; }
    else { warn('unknown ease "' + key + '", using linear'); fn = t => t; }
    easeCache.set(key, fn);
    return fn;
  }
  $.parseEase = parseEase;
  $.easings = {};
  ['linear'].concat(...['power1', 'power2', 'power3', 'power4', 'sine', 'expo', 'circ', 'back', 'elastic', 'bounce']
    .map(f => ['in', 'out', 'inOut'].map(t => f + '.' + t)), 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'swing', 'steps(5)')
    .forEach(n => { $.easings[n] = parseEase(n); });

  /* ---------------- colours & strings ---------------- */
  let colorCtx;
  function toRGBA(v) {
    if (!isStr(v)) return null;
    const s = v.trim().toLowerCase();
    if (s === 'transparent') return [0, 0, 0, 0];
    let m = s.match(/^rgba?\(([^)]+)\)$/);
    if (m) { const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(x => x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x)); return [p[0], p[1], p[2], p[3] ?? 1]; }
    if (/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/.test(s)) {
      let h = s.slice(1); if (h.length < 5) h = [...h].map(c => c + c).join('');
      return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).concat(h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1);
    }
    if (/^(?:hsla?|hwb|lab|lch|oklab|oklch|color)\(|^[a-z]+$/.test(s) && window.CSS && CSS.supports && CSS.supports('color', s)) {
      try {
        colorCtx = colorCtx || document.createElement('canvas').getContext('2d');
        if (!colorCtx) return null;
        colorCtx.fillStyle = '#000'; colorCtx.fillStyle = s;
        const out = colorCtx.fillStyle;
        return out !== s ? toRGBA(out) : null;
      } catch (e) { return null; }
    }
    return null;
  }
  const rgbaStr = c => 'rgba(' + c.slice(0, 3).map(Math.round).join(',') + ',' + +c[3].toFixed(4) + ')';
  const NUM_RE = /[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi;
  const COLOR_RE = /#(?:[\da-f]{3,4}){1,2}\b|(?:rgba?|hsla?)\([^)]*\)/gi;
  const normColors = s => String(s).replace(COLOR_RE, c => { const r = toRGBA(c); return r ? rgbaStr(r) : c; });
  function stringTween(a, b) {
    a = normColors(a); b = normColors(b);
    const na = a.match(NUM_RE) || [], nb = b.match(NUM_RE) || [];
    if (!nb.length || na.length !== nb.length) return null;
    const parts = b.split(NUM_RE), A = na.map(Number), B = nb.map(Number);
    return v => parts.reduce((s, p, i) => s + p + (i < B.length ? +(A[i] + (B[i] - A[i]) * v).toFixed(4) : ''), '');
  }

  /* ---------------- transforms ---------------- */
  const TRANSFORM_KEYS = new Set(['x', 'y', 'z', 'xPercent', 'yPercent', 'rotate', 'rotation', 'rotateX', 'rotationX', 'rotateY', 'rotationY',
    'scale', 'scaleX', 'scaleY', 'skewX', 'skewY', 'transformPerspective']);
  const TKEY = { rotation: 'rotate', rotationX: 'rotateX', rotationY: 'rotateY' };
  function getTransformState(el) {
    const d = nodeData(el);
    if (d.tf) return d.tf;
    const s = { x: 0, y: 0, z: 0, xPercent: 0, yPercent: 0, rotate: 0, rotateX: 0, rotateY: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0, transformPerspective: 0 };
    const m = isEl(el) && (getComputedStyle(el).transform || '').match(/^matrix\(([^)]+)\)$/);
    if (m) {                                             // respect transforms already set in CSS
      const [a, b, c, dd, e, f] = m[1].split(',').map(Number);
      const sx = Math.hypot(a, b), sy = sx ? (a * dd - b * c) / sx : 0;
      Object.assign(s, { x: e, y: f, rotate: Math.atan2(b, a) * 180 / PI, scaleX: sx, scaleY: sy,
        skewX: sx && sy ? Math.atan((a * c + b * dd) / (sx * sy)) * 180 / PI : 0 });
    }
    return (d.tf = s);
  }
  function applyTransform(el) {
    const t = getTransformState(el), r = n => +n.toFixed(5);
    let out = t.transformPerspective ? 'perspective(' + t.transformPerspective + 'px) ' : '';
    out += t.z ? 'translate3d(' + r(t.x) + 'px,' + r(t.y) + 'px,' + r(t.z) + 'px)' : 'translate(' + r(t.x) + 'px,' + r(t.y) + 'px)';
    if (t.xPercent || t.yPercent) out += ' translate(' + r(t.xPercent) + '%,' + r(t.yPercent) + '%)';
    if (t.rotate) out += ' rotate(' + r(t.rotate) + 'deg)';
    if (t.rotateX) out += ' rotateX(' + r(t.rotateX) + 'deg)';
    if (t.rotateY) out += ' rotateY(' + r(t.rotateY) + 'deg)';
    if (t.skewX || t.skewY) out += ' skew(' + r(t.skewX) + 'deg,' + r(t.skewY) + 'deg)';
    if (t.scaleX !== 1 || t.scaleY !== 1) out += ' scale(' + r(t.scaleX) + ',' + r(t.scaleY) + ')';
    el.style.transform = out;
  }
  const angle = v => { const n = parseFloat(v); const s = String(v); return s.endsWith('turn') ? n * 360 : s.endsWith('rad') ? n * 180 / PI : n; };

  /* ---------------- values ---------------- */
  const CURRENT = Symbol('current');
  function unitOf(v) { const m = String(v).match(/^\s*(?:[+\-*/]=)?\s*-?(?:\d*\.?\d+)(?:e[-+]?\d+)?([a-z%]*)\s*$/i); return m ? m[1] : null; }
  function applyRel(start, end) {
    if (isStr(end)) {
      const m = end.match(/^\s*([+\-*/])=\s*(-?[\d.]+(?:e[-+]?\d+)?)/i);
      if (m) { const n = parseFloat(m[2]); return m[1] === '+' ? start + n : m[1] === '-' ? start - n : m[1] === '*' ? start * n : start / n; }
    }
    return parseFloat(end);
  }
  function resolveValue(v, i, target, targets) {
    if (isFn(v)) v = v(i, target, targets);
    if (isStr(v)) {
      const m = v.match(/^random\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)(\w*)$/);
      if (m) return $.utils.random(+m[1], +m[2], m[3] ? +m[3] : 0) + m[4];
      const list = v.match(/^random\(\[(.*)\]\)$/);
      if (list) { const opts = list[1].split(',').map(x => x.trim()); return opts[Math.floor(Math.random() * opts.length)]; }
    }
    return v;
  }
  function toPxUnit(el, prop, pxv, unit) {
    if (!unit || unit === 'px') return pxv;
    const parent = el.parentElement || document.documentElement;
    const horiz = !/height|top|bottom/i.test(prop);
    switch (unit) {
      case '%': return pxv / ((horiz ? parent.clientWidth : parent.clientHeight) || 1) * 100;
      case 'em': return pxv / (parseFloat(getComputedStyle(el).fontSize) || 16);
      case 'rem': return pxv / (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
      case 'vw': return pxv / window.innerWidth * 100;
      case 'vh': return pxv / window.innerHeight * 100;
      case 'vmin': return pxv / Math.min(window.innerWidth, window.innerHeight) * 100;
      case 'vmax': return pxv / Math.max(window.innerWidth, window.innerHeight) * 100;
      default: return pxv;
    }
  }
  function readStyle(el, name) {
    if (name.startsWith('--')) return getComputedStyle(el).getPropertyValue(name).trim() || el.style.getPropertyValue(name).trim();
    let v = getComputedStyle(el)[name];
    if ((v === 'auto' || v === '') && (name === 'width' || name === 'height')) v = (name === 'width' ? el.offsetWidth : el.offsetHeight) + 'px';
    if (v === 'auto' || v === '' || v == null) v = el.style[name] || '0';
    return v;
  }
  const writeStyle = (el, name, v) => name.startsWith('--') ? el.style.setProperty(name, v) : (el.style[name] = v);

  // Build a setter (eased value 0→1) that tweens one value between start and end
  function makeValueTween(startRaw, endRaw, ctx) {
    const { el, name, unitless, snap } = ctx;
    const endC = endRaw !== CURRENT && !(typeof endRaw === 'number') && toRGBA(String(endRaw)), startC = toRGBA(String(startRaw));
    if (endC || (endRaw === CURRENT && startC)) {
      const s = startC || [0, 0, 0, 0], e = endC || toRGBA(String(ctx.current())) || s;
      return v => rgbaStr(s.map((x, i) => x + (e[i] - x) * v));
    }
    const endV = endRaw === CURRENT ? ctx.current() : endRaw;
    const numeric = x => typeof x === 'number' || unitOf(x) !== null;
    if (numeric(endV) && (numeric(startRaw) || startRaw === '' || startRaw == null || startRaw === 'none' || startRaw === 'normal')) {
      let unit = typeof endV === 'number' ? (unitless ? '' : (ctx.defaultUnit ?? 'px')) : unitOf(endV) || (unitless ? '' : (unitOf(startRaw) || ctx.defaultUnit || ''));
      let s = parseFloat(startRaw) || 0;
      const su = numeric(startRaw) ? unitOf(startRaw) : unit;
      if (el && su !== unit && s !== 0 && (su === 'px' || su === '')) s = toPxUnit(el, name, s, unit);
      const e = applyRel(s, endV);
      const round = !!el || name.startsWith('--');
      return v => { let n = s + (e - s) * v; if (snap) n = Math.round(n / snap) * snap; else if (round) n = Math.round(n * 1e5) / 1e5; return unit ? n + unit : n; };
    }
    const st = stringTween(startRaw, endV);
    if (st) return st;
    return v => v > 0 ? endV : startRaw;            // not tweenable: switch at the start
  }

  // One property on one target → { key, set(v) }
  const propPlugins = {};
  function buildProp(target, key, endRaw, startRaw, i, targets, tween) {
    const end = endRaw === CURRENT ? CURRENT : resolveValue(endRaw, i, target, targets);
    const start = startRaw === undefined ? undefined : resolveValue(startRaw, i, target, targets);
    const snap = tween.vars.snap && (isObj(tween.vars.snap) ? tween.vars.snap[key] : String(tween.vars.snap).split(',').includes(key) ? 1 : 0);
    if (propPlugins[key]) return propPlugins[key](target, end, start, tween, i);
    if (isEl(target)) {
      const el = target;
      if (TRANSFORM_KEYS.has(key)) {
        const st = getTransformState(el), k = TKEY[key] || key;
        const read = () => k === 'scale' ? st.scaleX : st[k];
        const conv = v => /rotate|skew/.test(k) ? angle(v) : (k === 'x' || k === 'y') && String(v).endsWith('%') ? NaN : parseFloat(v);
        const s = start === undefined ? read() : conv(start);
        const eRaw = end === CURRENT ? read() : end;
        const pctKey = (k === 'x' || k === 'y') && isStr(eRaw) && eRaw.trim().endsWith('%') && !/=/.test(eRaw) ? k + 'Percent' : null;
        if (pctKey) { const ps = st[pctKey], pe = parseFloat(eRaw); return { key, tf: true, set: v => { st[pctKey] = ps + (pe - ps) * v; } }; }
        const e = /rotate|skew/.test(k) && isStr(eRaw) && !/=/.test(eRaw) ? angle(eRaw) : applyRel(s, /rotate|skew/.test(k) && isStr(eRaw) ? eRaw.replace(/(turn|rad|deg)$/, '') : eRaw);
        return { key, tf: true, set: v => { const n = s + (e - s) * v; if (k === 'scale') st.scaleX = st.scaleY = n; else st[k] = n; } };
      }
      if (key === 'autoAlpha') {
        const s = start === undefined ? parseFloat(getComputedStyle(el).opacity) : parseFloat(start);
        const e = end === CURRENT ? parseFloat(getComputedStyle(el).opacity) : applyRel(s, end);
        return { key: 'opacity', set: v => { const n = s + (e - s) * v; el.style.opacity = n; el.style.visibility = n <= 0.0001 ? 'hidden' : 'inherit'; } };
      }
      if (key === 'scrollTop' || key === 'scrollLeft') {
        const s = start === undefined ? el[key] : parseFloat(start), e = end === CURRENT ? el[key] : applyRel(s, end);
        return { key, set: v => { el[key] = s + (e - s) * v; } };
      }
      if (key === 'attr') {
        const parts = Object.keys(end === CURRENT ? start : end).map(a => {
          const cur = () => el.getAttribute(a);
          const s = start && start[a] !== undefined ? resolveValue(start[a], i, el, targets) : cur();
          const e = end === CURRENT ? CURRENT : resolveValue(end[a], i, el, targets);
          const f = makeValueTween(s, e, { el: null, name: a, unitless: true, current: cur, defaultUnit: '' });
          return v => el.setAttribute(a, f(v));
        });
        return { key: 'attr', set: v => parts.forEach(p => p(v)) };
      }
      if (key === 'transformOrigin' || key === 'svgOrigin') { const val = end === CURRENT ? start : end; el.style.transformOrigin = val; return null; }
      const name = key.startsWith('--') ? key : camel(key);
      const current = () => readStyle(el, name);
      const s = start === undefined ? current() : start;
      const f = makeValueTween(s, end, { el, name, unitless: cssNumber.has(name), snap, current, defaultUnit: name.startsWith('--') ? (unitOf(s) || '') : 'px' });
      return { key: name, set: v => writeStyle(el, name, f(v)) };
    }
    // Plain objects (counters, timelines, anything): methods are called as getter/setters
    const isMethod = isFn(target[key]);
    const get = () => isMethod ? target[key]() : target[key];
    const s = start === undefined ? get() : start;
    const f = makeValueTween(s, end, { el: null, name: key, unitless: typeof s === 'number' || s === undefined, snap, current: get, defaultUnit: '' });
    return { key, set: v => { const n = f(v); isMethod ? target[key](n) : (target[key] = n); } };
  }

  /* ---------------- stagger ---------------- */
  function distribute(cfg) {
    return (i, target, targets) => staggerOffsets(targets, cfg)[i];
  }
  function staggerOffsets(targets, s) {
    const n = targets.length;
    if (!s) return new Array(n).fill(0);
    if (typeof s === 'number') return targets.map((_, i) => i * s);
    if (isFn(s)) return targets.map((t, i) => +s(i, t, targets) || 0);
    let { each, amount, from = 0, grid, axis, ease } = s;
    let cols = n, rows = 1;
    if (grid === 'auto' && n && isEl(targets[0])) {
      const top = targets[0].getBoundingClientRect().top;
      cols = targets.findIndex(t => Math.abs(t.getBoundingClientRect().top - top) > 1);
      if (cols < 1) cols = n; rows = Math.ceil(n / cols);
    } else if (Array.isArray(grid)) { rows = grid[0]; cols = grid[1]; }
    const pos = i => [i % cols, Math.floor(i / cols)];
    let fx, fy;
    if (from === 'center') { fx = (cols - 1) / 2; fy = (rows - 1) / 2; }
    else if (from === 'end') { fx = cols - 1; fy = rows - 1; }
    else if (Array.isArray(from)) { fx = (cols - 1) * from[0]; fy = (rows - 1) * from[1]; }
    else if (typeof from === 'number') [fx, fy] = pos(from);
    else { fx = 0; fy = 0; }
    let d = targets.map((_, i) => {
      const [x, y] = pos(i);
      if (from === 'edges') return Math.min(x, cols - 1 - x, ...(rows > 1 ? [y, rows - 1 - y] : []));
      const dx = Math.abs(x - fx), dy = Math.abs(y - fy);
      return axis === 'x' ? dx : axis === 'y' ? dy : Math.hypot(dx, dy);
    });
    if (from === 'random') d = targets.map((_, i) => i).sort(() => Math.random() - .5);
    const max = Math.max(...d) || 1;
    if (amount != null) each = amount / max;
    each = each ?? 0.1;
    const ez = ease ? parseEase(ease) : null;
    return d.map(x => (ez ? ez(x / max) * max : x) * each);
  }

  /* ---------------- ticker ---------------- */
  const roots = new Set();
  const tickFns = new Set();
  let ticking = false, lastTime = 0, lag = [500, 33];
  function tickLoop(t) {
    let dt = (t - lastTime) / 1000; lastTime = t;
    if (dt * 1000 > lag[0]) dt = lag[1] / 1000;
    if (dt < 0) dt = 0;
    for (const a of [...roots]) a._tick(dt);
    tickFns.forEach(fn => fn(t / 1000, dt));
    if (roots.size || tickFns.size) raf(tickLoop); else ticking = false;
  }
  function wake() { if (!ticking) { ticking = true; lastTime = now(); raf(tickLoop); } }
  $.ticker = { add(fn) { tickFns.add(fn); wake(); }, remove(fn) { tickFns.delete(fn); }, lagSmoothing(a = 500, b = 33) { lag = [a || 1e9, b]; } };

  const motionDefaults = { duration: 0.5, ease: 'power1.out', overwrite: 'auto' };
  $.defaults = v => Object.assign(motionDefaults, v);
  const SPECIAL = new Set(['duration', 'delay', 'ease', 'stagger', 'repeat', 'yoyo', 'repeatDelay', 'onStart', 'onUpdate',
    'onComplete', 'onRepeat', 'onReverseComplete', 'onStartParams', 'onUpdateParams', 'onCompleteParams', 'onRepeatParams',
    'onReverseCompleteParams', 'callbackScope', 'paused', 'immediateRender', 'overwrite', 'id', 'snap', 'keyframes',
    'scrollTrigger', 'defaults', 'data', 'inherit', 'lazy', 'runBackwards', 'yoyoEase', 'startAt', 'smoothChildTiming', 'autoRemoveChildren']);

  /* ---------------- Animation (shared by Tween & Timeline) ---------------- */
  const registry = new WeakMap();               // target → Set<Tween>
  const reg = (t, tw) => { if (!isObj(t) && !isFn(t)) return; let s = registry.get(t); if (!s) registry.set(t, s = new Set()); s.add(tw); };
  const unreg = (t, tw) => { const s = registry.get(t); if (s) s.delete(tw); };

  class MotionAnim {
    constructor(vars) {
      this.vars = vars;
      this._delay = +vars.delay || 0;
      this._repeat = vars.repeat || 0;
      this._yoyo = !!vars.yoyo;
      this._rDelay = vars.repeatDelay || 0;
      this._ts = 1; this._rev = false; this._paused = !!vars.paused;
      this._tTime = 0; this._time = 0; this._start = 0; this._wait = 0; this._dur = 0;
      this._done = false; this._waiters = []; this._parent = null; this._it = 0;
    }
    totalDuration() { return this._repeat < 0 ? 1e10 : (this._dur + this._rDelay) * (this._repeat + 1) - this._rDelay; }
    duration(v) { if (v === undefined) return this._dur; this._setDur(v); return this; }
    _setDur(v) { this._dur = v; if (this._parent) this._parent._recalc(); }
    _cb(type) {
      const f = this.vars[type]; if (!f) return;
      try { f.apply(this.vars.callbackScope || this, this.vars[type + 'Params'] || []); } catch (e) { warn(type, e); }
    }
    _render(tt, suppress) {
      const td = this.totalDuration(), prev = this._tTime;
      if (tt < 0) { if (prev !== 0 || this._time !== 0 || this._inited) { this._renderAt(-1e-9, true); } this._tTime = 0; this._time = 0; if (prev > 0 && !suppress) this._cb('onReverseComplete'); this._done = false; return; }
      tt = Math.min(tt, td);
      const cycle = this._dur + this._rDelay;
      let it = 0, t = tt;
      if (this._repeat && cycle > 0) {
        it = Math.floor(tt / cycle); t = tt - it * cycle;
        if (tt >= td && this._repeat >= 0) { it = this._repeat; t = this._dur; }
        else if (t > this._dur) t = this._dur;
        if (this._yoyo && it % 2) t = this._dur - t;
      } else t = Math.min(tt, this._dur);
      if (!suppress && prev === 0 && (tt > 0 || td === 0) && !this._startFired) { this._startFired = true; this._cb('onStart'); }
      this._renderAt(t, tt < prev);
      this._time = t; this._tTime = tt;
      if (!suppress && it !== this._it) this._cb('onRepeat');
      this._it = it;
      if (!suppress && tt !== prev) this._cb('onUpdate');
      if (tt >= td && (prev < td || td === 0) && !this._done) this._finish(suppress);
      else if (tt < td) this._done = false;
    }
    _finish(suppress) {
      this._done = true;
      if (!suppress) this._cb('onComplete');
      this._unreg && this._unreg();
      const w = this._waiters.splice(0);
      w.forEach(r => r());
    }
    _tick(dt) {
      if (this._paused) return;
      let d = dt * this._ts;
      if (this._wait > 0) { this._wait -= d; if (this._wait > 0) return; d = -this._wait; this._wait = 0; }
      this._render(this._tTime + (this._rev ? -d : d));
      if ((!this._rev && this._done) || (this._rev && this._tTime <= 0)) {
        roots.delete(this);
        if (this._rev && this._tTime <= 0) { this._cb('onReverseComplete'); const w = this._waiters.splice(0); w.forEach(r => r()); }
      }
    }
    _activate(withDelay) {
      if (this._parent) return this;
      if (withDelay) this._wait = this._delay;
      roots.add(this); wake();
      return this;
    }
    play(from) { if (from !== undefined) this.seek(from); this._rev = false; this._paused = false; if (!this._done) this._activate(); return this; }
    pause(at) { if (at !== undefined) this.seek(at); this._paused = true; return this; }
    resume() { this._paused = false; return this._activate(); }
    reverse(from) { if (from !== undefined) this.seek(from); this._rev = true; this._paused = false; this._done = false; return this._activate(); }
    restart(includeDelay) { this._rev = false; this._paused = false; this._startFired = false; this._render(-1, true); this._done = false; this._wait = includeDelay ? this._delay : 0; return this._activate(); }
    seek(time, suppress = true) { this._render(isStr(time) && this.labels ? this.labels[time] ?? 0 : time, suppress); return this; }
    totalTime(t) { if (t === undefined) return this._tTime; return this.seek(t, false); }
    time(t) { if (t === undefined) return this._time; return this.seek(t, false); }
    progress(p) { if (p === undefined) return this._dur ? this._time / this._dur : (this._done ? 1 : 0); return this.seek(clamp(0, 1, p) * this._dur, false); }
    totalProgress(p) { const td = this.totalDuration(); if (p === undefined) return td ? this._tTime / td : 1; return this.seek(clamp(0, 1, p) * td, false); }
    timeScale(s) { if (s === undefined) return this._ts; this._ts = s || 1e-8; if (this._parent) this._parent._recalc(); return this; }
    reversed(v) { if (v === undefined) return this._rev; this._rev = !!v; if (!this._paused) this._activate(); return this; }
    paused(v) { if (v === undefined) return this._paused; return v ? this.pause() : this.resume(); }
    isActive() { return !this._paused && !this._done && (roots.has(this) || (this._parent && this._parent.isActive())); }
    delay(v) { if (v === undefined) return this._delay; this._delay = v; return this; }
    repeat(v) { if (v === undefined) return this._repeat; this._repeat = v; if (this._parent) this._parent._recalc(); return this; }
    yoyo(v) { if (v === undefined) return this._yoyo; this._yoyo = !!v; return this; }
    iteration() { return this._it + 1; }
    eventCallback(type, fn, params) { if (fn === undefined) return this.vars[type]; this.vars[type] = fn; if (params) this.vars[type + 'Params'] = params; return this; }
    kill() { roots.delete(this); if (this._parent) this._parent.remove(this); this._killed = true; this._unreg && this._unreg(); return this; }
    then(ok, fail) {
      const result = this.targets ? $(this.targets) : undefined;
      return new Promise(r => { if (this._done && !this._rev) r(); else this._waiters.push(r); }).then(() => result).then(ok, fail);
    }
  }

  /* ---------------- Tween ---------------- */
  class MTween extends MotionAnim {
    constructor(targets, vars, mode, fromVars) {
      super(vars);
      this.targets = toTargets(targets);
      this._mode = mode; this._fromVars = fromVars;
      this._each = vars.duration != null ? +vars.duration : motionDefaults.duration;
      this._offsets = staggerOffsets(this.targets, vars.stagger);
      this._dur = this._each + Math.max(0, ...this._offsets);
      this._ease = parseEase(vars.ease ?? motionDefaults.ease);
      this._props = {};
      for (const k in vars) if (!SPECIAL.has(k)) this._props[k] = vars[k];
      if (mode === 'fromTo') for (const k in fromVars) if (!SPECIAL.has(k) && !(k in this._props)) this._props[k] = CURRENT;
      this.targets.forEach(t => reg(t, this));
      this._unreg = () => this.targets.forEach(t => unreg(t, this));
      const ow = vars.overwrite ?? motionDefaults.overwrite;
      if (ow === true) killTweensOf(this.targets, null, this);
      if (mode !== 'to' && vars.immediateRender !== false) { this._init(); this._renderAt(0); }
    }
    _init() {
      this._inited = true;
      const ow = this.vars.overwrite ?? motionDefaults.overwrite;
      this._pts = this.targets.map((t, i) => {
        const list = [];
        for (const k in this._props) {
          let end = this._props[k], start;
          if (this._mode === 'from') { start = end; end = CURRENT; }
          else if (this._mode === 'fromTo') start = this._fromVars[k];
          const pt = buildProp(t, k, end, start, i, this.targets, this);
          if (pt) list.push(pt);
        }
        if (ow === 'auto') {
          const keys = new Set(list.map(p => p.key));
          (registry.get(t) || []).forEach(o => { if (o !== this && o._inited && !o._done && o._ptsKill) o._ptsKill(t, keys); });
        }
        return list;
      });
    }
    _ptsKill(target, keys) {
      const i = this.targets.indexOf(target);
      if (i >= 0 && this._pts) this._pts[i] = this._pts[i].filter(p => !keys.has(p.key));
    }
    invalidate() { this._inited = false; this._pts = null; return this; }
    _renderAt(t) {
      if (!this._inited) { if (t < 0) return; this._init(); }
      const each = this._each;
      for (let i = 0; i < this.targets.length; i++) {
        const local = t - this._offsets[i];
        const p = each > 0 ? clamp(0, 1, local / each) : (local >= 0 ? 1 : 0);
        const v = p === 0 || p === 1 ? p : this._ease(p);
        let tf = false;
        for (const pt of this._pts[i]) { pt.set(v); if (pt.tf) tf = true; }
        if (tf) applyTransform(this.targets[i]);
      }
    }
  }
  function toTargets(t) {
    if (t == null) return [];
    if (isStr(t)) return [...$(t)];
    if (t instanceof KJ || Array.isArray(t) || (typeof t.length === 'number' && !isNode(t) && !isFn(t) && !(t instanceof MotionAnim))) return Array.from(t).flatMap(x => isStr(x) ? [...$(x)] : [x]);
    return [t];
  }
  function killTweensOf(targets, props, except) {
    const keys = props ? new Set((isStr(props) ? props.split(',') : Object.keys(props)).map(s => s.trim())) : null;
    toTargets(targets).forEach(t => [...(registry.get(t) || [])].forEach(tw => {
      if (tw === except) return;
      if (keys && tw._inited) tw._ptsKill(t, keys); else if (!keys) tw.kill();
    }));
  }

  /* ---------------- Callback (zero-length timeline child / delayedCall) ---------------- */
  class Callback extends MotionAnim {
    constructor(fn, params, scope) { super({}); this.fn = fn; this.params = params || []; this.scope = scope; }
    fire() { try { this.fn.apply(this.scope || this, this.params); } catch (e) { warn('callback', e); } }
    _renderAt() {}
    _tick(dt) { if (this._paused) return; this._wait -= dt * this._ts; if (this._wait <= 0) { roots.delete(this); this.fire(); this._finish(); } }
  }

  /* ---------------- Timeline ---------------- */
  class Timeline extends MotionAnim {
    constructor(vars = {}) {
      super(vars);
      this._defaults = Object.assign({}, vars.defaults);
      for (const k of ['duration', 'ease', 'stagger', 'overwrite']) if (vars[k] !== undefined && !vars.defaults) this._defaults[k] = vars[k];
      this.children = []; this.labels = {}; this._last = null; this._prevT = -1e-9;
      this._dur = 0;
    }
    _end() { return this.children.reduce((m, c) => Math.max(m, c._start + c.totalDuration() / c._ts), 0); }
    _pos(pos) {
      const end = this._end(), last = this._last;
      const ps = last ? last._start - last._delay : 0, pe = last ? last._start + last.totalDuration() / last._ts : end;
      if (pos == null) return end;
      if (typeof pos === 'number') return pos;
      let m = String(pos).match(/^([<>])([+-]=)?(-?[\d.]+)?$/);
      if (m) { const base = m[1] === '<' ? ps : pe; const n = parseFloat(m[3] || 0); return base + (m[2] === '-=' ? -n : n); }
      if ((m = String(pos).match(/^([+-])=(-?[\d.]+)$/))) return end + (m[1] === '-' ? -1 : 1) * parseFloat(m[2]);
      if ((m = String(pos).match(/^([^+\-<>]+?)(?:([+-])=(-?[\d.]+))?$/))) {
        if (!(m[1] in this.labels)) this.labels[m[1]] = end;
        return this.labels[m[1]] + (m[2] ? (m[2] === '-' ? -1 : 1) * parseFloat(m[3]) : 0);
      }
      return end;
    }
    add(child, pos) {
      if (isStr(child)) return this.addLabel(child, pos);
      if (Array.isArray(child)) { const at = this._pos(pos); child.forEach(c => this.add(c, at)); return this; }
      if (isFn(child)) child = new Callback(child);
      const at = Math.max(0, this._pos(pos));
      roots.delete(child);
      if (child._parent && child._parent !== this) child._parent.remove(child);
      child._parent = this; child._start = at + child._delay; child._wait = 0;
      this.children.push(child);
      this.children.sort((a, b) => a._start - b._start);
      this._last = child;
      this._recalc();
      return this;
    }
    remove(child) { const i = this.children.indexOf(child); if (i >= 0) { this.children.splice(i, 1); child._parent = null; this._recalc(); } return this; }
    _recalc() { this._dur = this._end(); if (this._parent) this._parent._recalc(); }
    to(t, v, pos) { return this.add(new MTween(t, Object.assign({}, this._defaults, v), 'to'), pos); }
    from(t, v, pos) { return this.add(new MTween(t, Object.assign({}, this._defaults, v), 'from'), pos); }
    fromTo(t, f, v, pos) { return this.add(new MTween(t, Object.assign({}, this._defaults, v), 'fromTo', f), pos); }
    set(t, v, pos) { return this.add(new MTween(t, Object.assign({}, v, { duration: 0 }), 'to'), pos); }
    call(fn, params, pos) { return this.add(new Callback(fn, params), pos); }
    addLabel(name, pos) { this.labels[name] = this._pos(pos); return this; }
    removeLabel(name) { delete this.labels[name]; return this; }
    addPause(pos, fn, params) { return this.add(new Callback(() => { this.pause(); fn && fn(...(params || [])); }), pos); }
    getChildren() { return [...this.children]; }
    clear() { this.children.forEach(c => { c._parent = null; }); this.children = []; this.labels = {}; this._recalc(); return this; }
    tweenTo(pos, vars = {}) {
      const to = isStr(pos) ? this._pos(pos) : pos;
      this.pause();
      return $.to(this, Object.assign({ time: to, duration: Math.abs(to - this._time) / this._ts || 0.001, ease: 'none', overwrite: true }, vars));
    }
    tweenFromTo(a, b, vars) { this.seek(a); return this.tweenTo(b, vars); }
    nextLabel(t = this._time) { return Object.keys(this.labels).filter(k => this.labels[k] > t + 1e-6).sort((a, b) => this.labels[a] - this.labels[b])[0]; }
    previousLabel(t = this._time) { return Object.keys(this.labels).filter(k => this.labels[k] < t - 1e-6).sort((a, b) => this.labels[b] - this.labels[a])[0]; }
    currentLabel() { return Object.keys(this.labels).filter(k => this.labels[k] <= this._time + 1e-6).sort((a, b) => this.labels[b] - this.labels[a])[0]; }
    _renderAt(t, backwards) {
      const prev = this._prevT;
      const list = backwards ? [...this.children].reverse() : this.children;
      for (const c of list) {
        if (c instanceof Callback) {
          if ((prev < c._start && t >= c._start) || (backwards && prev >= c._start && t < c._start)) c.fire();
          continue;
        }
        const local = (t - c._start) * c._ts, ctd = c.totalDuration();
        if (local < 0) { if (c._inited || c._tTime > 0 || c.children) c._render(-1); }
        else if (local > ctd) { if (c._tTime < ctd || !c._done) c._render(ctd); }
        else c._render(local);
      }
      this._prevT = t;
    }
    restart(d) { this._prevT = -1e-9; return super.restart(d); }
  }

  /* ---------------- public API ---------------- */
  const motionHooks = [];
  function create(mode, targets, vars, fromVars) {
    vars = vars || {};
    if (vars.keyframes) return keyframes(targets, vars);
    const tw = new MTween(targets, vars, mode, fromVars);
    motionHooks.forEach(h => h(tw, vars));
    if (!tw._paused) tw._activate(true);
    return tw;
  }
  function keyframes(targets, vars) {
    const { keyframes: kf, ease, duration, ...rest } = vars;
    const tl = new Timeline(Object.assign({}, rest, { defaults: { ease: ease || motionDefaults.ease } }));
    if (Array.isArray(kf)) {
      const per = duration != null ? duration / kf.length : undefined;
      kf.forEach(step => tl.to(targets, Object.assign(per != null ? { duration: per } : {}, step)));
    } else {
      const props = Object.keys(kf).filter(k => Array.isArray(kf[k]));
      const steps = Math.max(...props.map(p => kf[p].length));
      const per = (duration ?? motionDefaults.duration) / Math.max(1, steps - 1);
      const first = {}; props.forEach(p => { first[p] = kf[p][0]; });
      tl.set(targets, first);
      for (let i = 1; i < steps; i++) { const v = { duration: per, ease: kf.easeEach || 'none' }; props.forEach(p => { if (kf[p][i] !== undefined) v[p] = kf[p][i]; }); tl.to(targets, v); }
    }
    motionHooks.forEach(h => h(tl, vars));
    if (!tl._paused) tl._activate(true);
    return tl;
  }
  $.to = (targets, vars) => create('to', targets, vars);
  $.from = (targets, vars) => create('from', targets, vars);
  $.fromTo = (targets, fromVars, vars) => create('fromTo', targets, vars, fromVars);
  $.set = (targets, vars) => {
    const tw = new MTween(targets, Object.assign({}, vars, { duration: 0, delay: 0 }), 'to');
    tw._render(0); return tw;
  };
  $.timeline = vars => { const tl = new Timeline(vars || {}); motionHooks.forEach(h => h(tl, vars || {})); if (!tl._paused) tl._activate(true); return tl; };
  $.delayedCall = (delay, fn, params, scope) => { const c = new Callback(fn, params, scope); c._wait = delay; roots.add(c); wake(); return c; };
  $.killTweensOf = (targets, props) => killTweensOf(targets, props);
  $.getTweensOf = targets => unique(toTargets(targets).flatMap(t => [...(registry.get(t) || [])]).filter(tw => !tw._done && !tw._killed));
  $.isTweening = target => $.getTweensOf(target).some(tw => tw.isActive());
  $.quickTo = (target, prop, vars = {}) => (value, start) => $.to(target, Object.assign({}, vars, { [prop]: value, overwrite: 'auto' }, start !== undefined ? {} : {}));
  $.quickSetter = (target, prop, unit) => v => $.set(target, { [prop]: unit ? v + unit : v });
  $.getProperty = (target, prop, unit) => {
    const el = toTargets(target)[0];
    if (!el) return undefined;
    if (TRANSFORM_KEYS.has(prop) && isEl(el)) { const st = getTransformState(el); const k = TKEY[prop] || prop; return k === 'scale' ? st.scaleX : st[k]; }
    const v = isEl(el) ? readStyle(el, prop.startsWith('--') ? prop : camel(prop)) : el[prop];
    return unit ? v : (unitOf(v) !== null ? parseFloat(v) : v);
  };
  $.motion = { Tween: MTween, Timeline, Animation: MotionAnim, prop(name, fn) { propPlugins[name] = fn; }, hooks: motionHooks, getTransformState, applyTransform, roots };
  $.utils = {
    clamp: (min, max, v) => v === undefined ? x => clamp(min, max, x) : clamp(min, max, v),
    mapRange: (a, b, c, d, v) => { const f = x => c + (x - a) / ((b - a) || 1) * (d - c); return v === undefined ? f : f(v); },
    normalize: (a, b, v) => { const f = x => (x - a) / ((b - a) || 1); return v === undefined ? f : f(v); },
    interpolate(a, b, p) {
      const f = x => typeof a === 'number' ? a + (b - a) * x : toRGBA(a) && toRGBA(b) ? rgbaStr(toRGBA(a).map((c, i) => c + (toRGBA(b)[i] - c) * x)) : (stringTween(a, b) || (() => x < 1 ? a : b))(x);
      return p === undefined ? f : f(p);
    },
    random(min, max, snap = 0, fnOnly) {
      if (Array.isArray(min)) { const arr = min; const f = () => arr[Math.floor(Math.random() * arr.length)]; return max === true ? f : f(); }
      const f = () => { let v = min + Math.random() * (max - min); if (snap) v = Math.round(v / snap) * snap; return v; };
      return fnOnly === true ? f : f();
    },
    snap(inc, v) {
      const f = Array.isArray(inc) ? x => inc.reduce((best, c) => Math.abs(c - x) < Math.abs(best - x) ? c : best, inc[0]) : x => Math.round(x / inc) * inc;
      return v === undefined ? f : f(v);
    },
    wrap(a, b, v) {
      if (Array.isArray(a)) { const arr = a; const f = i => arr[((i % arr.length) + arr.length) % arr.length]; return b === undefined ? f : f(b); }
      const f = x => { const r = b - a; return ((((x - a) % r) + r) % r) + a; }; return v === undefined ? f : f(v);
    },
    wrapYoyo(a, b, v) { const f = x => { const r = b - a, t = ((x - a) % (2 * r) + 2 * r) % (2 * r); return a + (t > r ? 2 * r - t : t); }; return v === undefined ? f : f(v); },
    toArray: t => toTargets(t),
    splitColor: c => { const r = toRGBA(c); return r ? r.slice(0, r[3] === 1 ? 3 : 4) : null; },
    distribute,
    pipe: (...fns) => v => fns.reduce((x, f) => f(x), v),
    unitize: (fn, unit) => v => fn(parseFloat(v)) + (unit ?? (unitOf(v) || '')),
  };

  // chainable GSAP-style tweens from a collection: $('.card').to({ y: -10 })
  $.fn.to = function (vars) { $.to(this, vars); return this; };
  $.fn.tweenFrom = function (vars) { $.from(this, vars); return this; };
  $.fn.fromAnim = $.fn.tweenFrom;
