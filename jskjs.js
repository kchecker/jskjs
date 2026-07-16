/*!
 * jsKjs v1.0.0 — July 2026
 * The jQuery you remember, the superpowers you wished for.
 * jQuery-compatible core + htmx-style declarative AJAX +
 * Alpine-style reactivity + GSAP-style animation engine.
 *
 * Zero dependencies. Modern browsers only (ES2020+):
 * Chrome 90+, Firefox 90+, Safari 15+, Edge 90+.
 * MIT License.
 */
(function (global, factory) {
  typeof module === 'object' && module.exports
    ? (module.exports = factory(global))
    : factory(global);
})(typeof window !== 'undefined' ? window : this, function (window) {
  'use strict';

  const document = window.document;
  const VERSION = '1.0.0';

  // Local aliases (keeps the library working in jsdom/tests and after minification)
  const getComputedStyle = window.getComputedStyle.bind(window);
  const requestAnimationFrame = (window.requestAnimationFrame || (cb => setTimeout(() => cb(Date.now()), 16))).bind(window);
  const CustomEvent = window.CustomEvent;
  const FormData = window.FormData;
  const URLSearchParams = window.URLSearchParams;
  const MutationObserver = window.MutationObserver;
  const IntersectionObserver = window.IntersectionObserver;
  const fetch = (...args) => window.fetch(...args);   // resolved at call time (supports mocks/instrumentation)
  const history = window.history;
  const crypto = window.crypto;

  /* ============================================================
   * CORE — the KJ collection (array-like, chainable)
   * ============================================================ */

  class KJ extends Array {
    constructor(selector, context) {
      super();
      if (!selector) return;

      // Numeric constructor call (from internal Array machinery) → preallocate
      if (typeof selector === 'number') { this.length = selector; return; }

      // KJ instance passed in → clone it
      if (selector instanceof KJ) { this.push(...selector); return; }

      // DOM node / window / document
      if (selector.nodeType || selector === window) { this.push(selector); return; }

      // Array-like of nodes (NodeList, HTMLCollection, Array)
      if (typeof selector !== 'string' && typeof selector !== 'function' &&
          typeof selector[Symbol.iterator] === 'function') {
        this.push(...selector); return;
      }

      // Function → document ready
      if (typeof selector === 'function') {
        if (document.readyState !== 'loading') queueMicrotask(() => selector($));
        else document.addEventListener('DOMContentLoaded', () => selector($), { once: true });
        return;
      }

      // HTML string → create nodes (whitespace-tolerant, like jQuery)
      const trimmed = selector.trim();
      if (trimmed[0] === '<' && trimmed[trimmed.length - 1] === '>') {
        const tpl = document.createElement('template');
        tpl.innerHTML = trimmed;
        this.push(...tpl.content.childNodes);
        return;
      }

      // CSS selector
      let root = document;
      if (context) {
        root = typeof context === 'string' ? document.querySelector(context)
             : context instanceof KJ ? context[0] : context;
      }
      if (root) this.push(...root.querySelectorAll(selector));
    }

    // Native array methods (map/slice/flatMap) return plain Arrays;
    // jsKjs methods explicitly wrap results in $() where chaining matters.
    static get [Symbol.species]() { return Array; }
  }

  function $(selector, context) { return new KJ(selector, context); }
  $.fn = KJ.prototype;
  $.version = VERSION;

  /* ------------------------------------------------------------
   * Internal helpers
   * ------------------------------------------------------------ */
  const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const kebab = s => s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
  const isObj = v => v !== null && typeof v === 'object';
  const cssNumber = new Set(['opacity', 'zIndex', 'fontWeight', 'lineHeight', 'flexGrow', 'flexShrink', 'order', 'scale']);
  const dataStore = new WeakMap();
  const nodeData = el => {
    if (!dataStore.has(el)) dataStore.set(el, {});
    return dataStore.get(el);
  };

  /* ============================================================
   * DOM — content, attributes, classes, styles
   * ============================================================ */
  Object.assign($.fn, {

    each(fn) { this.forEach((el, i) => fn.call(el, i, el)); return this; },

    get(i) { return i === undefined ? [...this] : this[i < 0 ? this.length + i : i]; },

    eq(i) { return $(this.get(i)); },
    first() { return this.eq(0); },
    last() { return this.eq(-1); },

    index(el) {
      if (el === undefined) {
        const node = this[0];
        return node ? [...node.parentNode.children].indexOf(node) : -1;
      }
      return this.indexOf(el instanceof KJ ? el[0] : el);
    },

    html(value) {
      if (value === undefined) return this[0]?.innerHTML;
      return this.each((_, el) => { el.innerHTML = value; });
    },

    text(value) {
      if (value === undefined) return this[0]?.textContent;
      return this.each((_, el) => { el.textContent = value; });
    },

    val(value) {
      if (value === undefined) {
        const el = this[0];
        if (!el) return undefined;
        if (el.type === 'checkbox') return el.checked;
        if (el.multiple) return [...el.selectedOptions].map(o => o.value);
        return el.value;
      }
      return this.each((_, el) => {
        if (el.type === 'checkbox') el.checked = !!value;
        else el.value = value;
      });
    },

    attr(name, value) {
      if (isObj(name)) {
        for (const k in name) this.attr(k, name[k]);
        return this;
      }
      if (value === undefined) return this[0]?.getAttribute(name) ?? undefined;
      return this.each((_, el) => el.setAttribute(name, value));
    },

    removeAttr(name) { return this.each((_, el) => el.removeAttribute(name)); },

    prop(name, value) {
      if (value === undefined) return this[0]?.[name];
      return this.each((_, el) => { el[name] = value; });
    },

    data(key, value) {
      if (key === undefined) {
        const el = this[0];
        return el ? { ...el.dataset, ...nodeData(el) } : undefined;
      }
      if (isObj(key)) {
        this.each((_, el) => Object.assign(nodeData(el), key));
        return this;
      }
      if (value === undefined) {
        const el = this[0];
        if (!el) return undefined;
        const stored = nodeData(el)[key];
        if (stored !== undefined) return stored;
        const raw = el.dataset[camel(key)];
        try { return JSON.parse(raw); } catch { return raw; }
      }
      return this.each((_, el) => { nodeData(el)[key] = value; });
    },

    removeData(key) { return this.each((_, el) => { delete nodeData(el)[key]; }); },

    css(name, value) {
      if (typeof name === 'string' && value === undefined) {
        const el = this[0];
        return el ? getComputedStyle(el)[camel(name)] : undefined;
      }
      const styles = isObj(name) ? name : { [name]: value };
      return this.each((_, el) => {
        for (const k in styles) {
          let v = styles[k];
          const prop = camel(k);
          if (typeof v === 'number' && !cssNumber.has(prop)) v += 'px';
          if (k.startsWith('--')) el.style.setProperty(k, v);
          else el.style[prop] = v;
        }
      });
    },

    addClass(names) { return this.each((_, el) => el.classList.add(...String(names).split(/\s+/).filter(Boolean))); },
    removeClass(names) {
      if (names === undefined) return this.attr('class', '');
      return this.each((_, el) => el.classList.remove(...String(names).split(/\s+/).filter(Boolean)));
    },
    toggleClass(names, state) {
      return this.each((_, el) =>
        String(names).split(/\s+/).filter(Boolean).forEach(n => el.classList.toggle(n, state)));
    },
    hasClass(name) { return this.some(el => el.classList.contains(name)); },

    show() { return this.each((_, el) => { el.style.display = nodeData(el)._display || ''; if (getComputedStyle(el).display === 'none') el.style.display = 'block'; }); },
    hide() { return this.each((_, el) => { const d = getComputedStyle(el).display; if (d !== 'none') nodeData(el)._display = d; el.style.display = 'none'; }); },
    toggle(state) {
      return this.each((_, el) => {
        const hidden = getComputedStyle(el).display === 'none';
        const show = state === undefined ? hidden : state;
        $(el)[show ? 'show' : 'hide']();
      });
    },

    /* ---- geometry ---- */
    width(v)  { if (v === undefined) return this[0] === window ? window.innerWidth  : this[0]?.getBoundingClientRect().width;  return this.css('width', v); },
    height(v) { if (v === undefined) return this[0] === window ? window.innerHeight : this[0]?.getBoundingClientRect().height; return this.css('height', v); },
    offset() {
      const el = this[0]; if (!el) return undefined;
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, left: r.left + window.scrollX };
    },
    position() {
      const el = this[0]; if (!el) return undefined;
      return { top: el.offsetTop, left: el.offsetLeft };
    },
    scrollTop(v)  { const el = this[0]; if (v === undefined) return el === window ? window.scrollY : el?.scrollTop; return this.each((_, e) => e === window ? window.scrollTo({ top: v }) : e.scrollTop = v); },
    scrollLeft(v) { const el = this[0]; if (v === undefined) return el === window ? window.scrollX : el?.scrollLeft; return this.each((_, e) => e === window ? window.scrollTo({ left: v }) : e.scrollLeft = v); },

    /* ---- insertion / removal ---- */
    _nodesFrom(content, clone) {
      if (content instanceof KJ) return clone ? content.map(n => n.cloneNode(true)) : [...content];
      if (content?.nodeType) return [clone ? content.cloneNode(true) : content];
      return [...$(String(content)[0] === '<' ? content : document.createTextNode(content) && content)];
    },

    append(...contents)  { return this._insert(contents, (el, n) => el.append(n)); },
    prepend(...contents) { return this._insert(contents, (el, n) => el.prepend(n)); },
    before(...contents)  { return this._insert(contents, (el, n) => el.before(n)); },
    after(...contents)   { return this._insert(contents, (el, n) => el.after(n)); },

    _insert(contents, op) {
      return this.each((i, el) => {
        for (const c of contents) {
          let nodes;
          if (c instanceof KJ) nodes = i === this.length - 1 ? [...c] : c.map(n => n.cloneNode(true));
          else if (c?.nodeType) nodes = [i === this.length - 1 ? c : c.cloneNode(true)];
          else if (typeof c === 'string' && c.trim()[0] === '<') nodes = [...$(c)];
          else nodes = [document.createTextNode(c)];
          nodes.forEach(n => op(el, n));
        }
      });
    },

    appendTo(target)  { $(target).append(this);  return this; },
    prependTo(target) { $(target).prepend(this); return this; },

    wrap(html) {
      return this.each((_, el) => {
        const wrapper = $(html)[0].cloneNode(true);
        el.before(wrapper);
        (wrapper.querySelector(':empty') || wrapper).append(el);
      });
    },

    remove() { return this.each((_, el) => el.remove()); },
    detach() { return this.remove(); },
    empty()  { return this.each((_, el) => { el.replaceChildren(); }); },
    clone(deep = true) { return $(this.map(el => el.cloneNode(deep))); },
    replaceWith(content) {
      return this.each((_, el) => el.replaceWith(...(content instanceof KJ ? content : $(content))));
    },

    /* ---- traversal ---- */
    find(sel)   { return $(this.flatMap(el => [...el.querySelectorAll(sel)])); },
    filter(sel) {
      const test = typeof sel === 'function' ? (el, i) => sel.call(el, i, el) : el => el.matches(sel);
      return $([...this].filter((el, i) => test(el, i)));
    },
    not(sel)    { return $([...this].filter(el => !el.matches(sel))); },
    is(sel)     { return this.some(el => typeof sel === 'string' ? el.matches(sel) : el === (sel instanceof KJ ? sel[0] : sel)); },
    closest(sel){ return $(unique(this.map(el => el.closest(sel)).filter(Boolean))); },
    parent()    { return $(unique(this.map(el => el.parentElement).filter(Boolean))); },
    parents(sel){
      const out = [];
      this.forEach(el => { let p = el.parentElement; while (p) { if (!sel || p.matches(sel)) out.push(p); p = p.parentElement; } });
      return $(unique(out));
    },
    children(sel) {
      const kids = this.flatMap(el => [...el.children]);
      return $(sel ? kids.filter(k => k.matches(sel)) : kids);
    },
    siblings(sel) {
      const sibs = this.flatMap(el => [...el.parentElement.children].filter(c => c !== el));
      return $(unique(sel ? sibs.filter(s => s.matches(sel)) : sibs));
    },
    next(sel) { return $(this.map(el => el.nextElementSibling).filter(el => el && (!sel || el.matches(sel)))); },
    prev(sel) { return $(this.map(el => el.previousElementSibling).filter(el => el && (!sel || el.matches(sel)))); },

    add(sel) { return $(unique([...this, ...$(sel)])); },
  });

  function unique(arr) { return [...new Set(arr)]; }

  /* ============================================================
   * EVENTS — on/off/one/trigger with delegation
   * ============================================================ */
  const handlerStore = new WeakMap();

  Object.assign($.fn, {
    on(types, selector, handler) {
      if (typeof selector === 'function') { handler = selector; selector = null; }
      return this.each((_, el) => {
        for (const type of types.split(/\s+/)) {
          const [event, ...ns] = type.split('.');
          const wrapped = selector
            ? function (e) {
                const match = e.target.closest(selector);
                if (match && el.contains(match)) handler.call(match, e, e.detail);
              }
            : function (e) { handler.call(el, e, e.detail); };
          if (!handlerStore.has(el)) handlerStore.set(el, []);
          handlerStore.get(el).push({ event, ns: ns.join('.'), handler, wrapped });
          el.addEventListener(event, wrapped);
        }
      });
    },

    one(types, selector, handler) {
      if (typeof selector === 'function') { handler = selector; selector = null; }
      const self = this;
      const onceHandler = function (e, d) {
        handler.call(this, e, d);
        self.off(types, onceHandler);
      };
      return this.on(types, selector, onceHandler);
    },

    off(types, handler) {
      return this.each((_, el) => {
        const records = handlerStore.get(el) || [];
        const keep = [];
        const wanted = types ? types.split(/\s+/).map(t => { const [event, ...ns] = t.split('.'); return { event, ns: ns.join('.') }; }) : null;
        for (const r of records) {
          const matches = !wanted || wanted.some(w =>
            (!w.event || w.event === r.event) && (!w.ns || w.ns === r.ns) &&
            (!handler || handler === r.handler));
          if (matches) el.removeEventListener(r.event, r.wrapped);
          else keep.push(r);
        }
        handlerStore.set(el, keep);
      });
    },

    trigger(type, detail) {
      return this.each((_, el) => {
        const event = new CustomEvent(type.split('.')[0], { bubbles: true, cancelable: true, detail });
        el.dispatchEvent(event);
      });
    },

    hover(enter, leave) { return this.on('mouseenter', enter).on('mouseleave', leave || enter); },
    focus(fn) { return fn ? this.on('focus', fn) : this.each((_, el) => el.focus()); },
    blur(fn)  { return fn ? this.on('blur', fn)  : this.each((_, el) => el.blur()); },
  });

  // Event shortcuts: $(el).click(fn) or $(el).click()
  for (const type of ['click', 'dblclick', 'change', 'input', 'submit', 'keydown', 'keyup', 'keypress',
                      'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave', 'scroll', 'resize',
                      'touchstart', 'touchend', 'contextmenu']) {
    $.fn[type] = function (handler) {
      return handler ? this.on(type, handler) : this.trigger(type);
    };
  }

  $.fn.ready = function (fn) { $(fn); return this; };

  /* ============================================================
   * AJAX — fetch-powered, jQuery-compatible surface
   * ============================================================ */
  $.ajax = function (url, options) {
    if (isObj(url)) { options = url; url = options.url; }
    const o = Object.assign({ method: 'GET', dataType: 'auto', headers: {} }, options);
    const method = (o.type || o.method || 'GET').toUpperCase();
    const headers = { 'X-Requested-With': 'jsKjs', ...o.headers };

    let body;
    if (o.data != null && method !== 'GET') {
      if (o.data instanceof FormData || typeof o.data === 'string') body = o.data;
      else if (o.contentType === 'application/json' || o.json) {
        body = JSON.stringify(o.data);
        headers['Content-Type'] = 'application/json';
      } else {
        body = new URLSearchParams(o.data).toString();
        headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
      }
    } else if (o.data != null && method === 'GET') {
      url += (url.includes('?') ? '&' : '?') + new URLSearchParams(o.data);
    }

    const controller = new AbortController();
    if (o.timeout) setTimeout(() => controller.abort(), o.timeout);

    const promise = fetch(url, { method, headers, body, signal: controller.signal, credentials: o.credentials || 'same-origin' })
      .then(async res => {
        const ct = res.headers.get('content-type') || '';
        const data = (o.dataType === 'json' || (o.dataType === 'auto' && ct.includes('json')))
          ? await res.json() : await res.text();
        if (!res.ok) { const err = new Error(res.statusText); err.status = res.status; err.data = data; throw err; }
        o.success?.(data, res.status, res);
        return data;
      })
      .catch(err => { o.error?.(err); throw err; })
      .finally(() => o.complete?.());

    promise.abort = () => controller.abort();
    // jQuery-style .done/.fail/.always
    promise.done = fn => (promise.then(fn), promise);
    promise.fail = fn => (promise.catch(fn), promise);
    promise.always = fn => (promise.finally(fn), promise);
    return promise;
  };

  $.get = (url, data, success) => {
    if (typeof data === 'function') { success = data; data = undefined; }
    return $.ajax({ url, data, success });
  };
  $.post = (url, data, success) => $.ajax({ url, method: 'POST', data, success });
  $.getJSON = (url, data, success) => {
    if (typeof data === 'function') { success = data; data = undefined; }
    return $.ajax({ url, data, success, dataType: 'json' });
  };

  $.fn.load = function (url, done) {
    const [u, sel] = url.split(' ');
    $.get(u).then(html => {
      if (sel) {
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        this.html('').append(...tpl.content.querySelectorAll(sel));
      } else this.html(html);
      done?.call(this[0], html);
    });
    return this;
  };

  $.fn.serialize = function () {
    const form = this[0];
    return form ? new URLSearchParams(new FormData(form)).toString() : '';
  };
  $.fn.serializeObject = function () {
    const form = this[0];
    return form ? Object.fromEntries(new FormData(form)) : {};
  };

  /* ============================================================
   * MOTION — GSAP-style animation engine ($.to / $.from / timelines)
   * ============================================================ */
  const Easings = {
    linear: t => t,
    'ease-in': t => t * t,
    'ease-out': t => t * (2 - t),
    'ease-in-out': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    'power2.in': t => t * t * t,
    'power2.out': t => 1 - Math.pow(1 - t, 3),
    'power2.inOut': t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    'back.out': t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    'elastic.out': t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
    'bounce.out': t => {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    },
  };

  const TRANSFORMS = new Set(['x', 'y', 'rotate', 'rotation', 'scale', 'scaleX', 'scaleY', 'skewX', 'skewY']);
  const UNITLESS = new Set(['opacity', 'scale', 'scaleX', 'scaleY']);

  function getTransformState(el) {
    let s = nodeData(el)._kjT;
    if (!s) {
      s = { x: 0, y: 0, rotate: 0, scale: 1, scaleX: null, scaleY: null, skewX: 0, skewY: 0 };
      nodeData(el)._kjT = s;
    }
    return s;
  }
  function applyTransform(el) {
    const t = getTransformState(el);
    const sx = t.scaleX ?? t.scale, sy = t.scaleY ?? t.scale;
    el.style.transform =
      `translate(${t.x}px, ${t.y}px) rotate(${t.rotate}deg) scale(${sx}, ${sy}) skew(${t.skewX}deg, ${t.skewY}deg)`;
  }

  function tween(el, props, opts = {}) {
    const duration = (opts.duration ?? 0.4) * 1000;
    const delay = (opts.delay ?? 0) * 1000;
    const ease = typeof opts.ease === 'function' ? opts.ease : (Easings[opts.ease] || Easings['power2.out']);
    const t = getTransformState(el);
    const jobs = [];

    for (const key in props) {
      const target = parseFloat(props[key]);
      if (TRANSFORMS.has(key)) {
        const k = key === 'rotation' ? 'rotate' : key;
        jobs.push({ kind: 't', key: k, from: t[k] ?? (k.startsWith('scale') ? 1 : 0), to: target });
      } else {
        const computed = parseFloat(getComputedStyle(el)[camel(key)]) || 0;
        const unit = String(props[key]).replace(/^[\d.\-]+/, '') || (UNITLESS.has(key) || cssNumber.has(camel(key)) ? '' : 'px');
        jobs.push({ kind: 'css', key: camel(key), from: computed, to: target, unit });
      }
    }

    return new Promise(resolve => {
      let start;
      function frame(now) {
        if (start === undefined) start = now + delay;
        const elapsed = now - start;
        if (elapsed < 0) return requestAnimationFrame(frame);
        const p = Math.min(elapsed / duration, 1);
        const v = ease(p);
        for (const j of jobs) {
          const val = j.from + (j.to - j.from) * v;
          if (j.kind === 't') { t[j.key] = val; }
          else el.style[j.key] = val + j.unit;
        }
        applyTransform(el);
        if (p < 1) requestAnimationFrame(frame);
        else { opts.onComplete?.(el); resolve(el); }
      }
      requestAnimationFrame(frame);
    });
  }

  // $.to(target, { x: 100, opacity: 0.5, duration: 0.6, ease: 'back.out', stagger: 0.1 })
  $.to = function (target, props) {
    const { duration, delay = 0, ease, stagger = 0, onComplete, ...values } = props;
    const els = $(target);
    const promises = els.map((el, i) =>
      tween(el, values, { duration, ease, delay: delay + i * stagger,
        onComplete: i === els.length - 1 ? onComplete : undefined }));
    return Promise.all(promises).then(() => els);
  };

  $.from = function (target, props) {
    const { duration, delay = 0, ease, stagger = 0, onComplete, ...values } = props;
    const els = $(target);
    els.forEach(el => {
      const t = getTransformState(el);
      const current = {};
      for (const k in values) {
        if (TRANSFORMS.has(k)) {
          const key = k === 'rotation' ? 'rotate' : k;
          current[k] = t[key] ?? (key.startsWith('scale') ? 1 : 0);
          t[key] = parseFloat(values[k]);
        } else {
          current[k] = getComputedStyle(el)[camel(k)];
          el.style[camel(k)] = values[k] + (typeof values[k] === 'number' && !UNITLESS.has(k) && !cssNumber.has(camel(k)) ? 'px' : '');
        }
      }
      applyTransform(el);
      nodeData(el)._kjFrom = current;
    });
    const back = {};
    els.forEach(el => Object.assign(back, nodeData(el)._kjFrom));
    return $.to(target, { ...back, duration, delay, ease, stagger, onComplete });
  };

  $.fromTo = function (target, fromProps, toProps) {
    $(target).forEach(el => {
      const t = getTransformState(el);
      for (const k in fromProps) {
        if (TRANSFORMS.has(k)) t[k === 'rotation' ? 'rotate' : k] = parseFloat(fromProps[k]);
        else $(el).css(k, fromProps[k]);
      }
      applyTransform(el);
    });
    return $.to(target, toProps);
  };

  // Timelines: sequence tweens with position control
  $.timeline = function (defaults = {}) {
    const queue = [];
    const tl = {
      to(target, props, position) { queue.push({ fn: () => $.to(target, { ...defaults, ...props }), position }); return tl; },
      from(target, props, position) { queue.push({ fn: () => $.from(target, { ...defaults, ...props }), position }); return tl; },
      add(fn, position) { queue.push({ fn, position }); return tl; },
      async play() {
        for (const step of queue) {
          if (step.position === '<') step.fn();       // start with previous
          else await step.fn();                        // sequential (default)
        }
        return tl;
      },
    };
    queueMicrotask(() => tl.play());
    return tl;
  };

  /* ---- jQuery-compatible effect shims (built on the tween engine) ---- */
  Object.assign($.fn, {
    animate(props, duration = 400, ease, complete) {
      if (typeof duration === 'function') { complete = duration; duration = 400; }
      if (typeof ease === 'function') { complete = ease; ease = undefined; }
      const p = $.to(this, { ...props, duration: duration / 1000, ease });
      if (complete) p.then(() => this.each((_, el) => complete.call(el)));
      return this;
    },
    fadeIn(duration = 400, complete) {
      this.css('opacity', 0).show();
      $.to(this, { opacity: 1, duration: duration / 1000 }).then(() => complete && this.each((_, el) => complete.call(el)));
      return this;
    },
    fadeOut(duration = 400, complete) {
      $.to(this, { opacity: 0, duration: duration / 1000 }).then(() => {
        this.hide().css('opacity', '');
        complete && this.each((_, el) => complete.call(el));
      });
      return this;
    },
    fadeToggle(duration) { return this.each((_, el) => getComputedStyle(el).display === 'none' ? $(el).fadeIn(duration) : $(el).fadeOut(duration)); },
    slideDown(duration = 400, complete) {
      return this.each((_, el) => {
        const $el = $(el).show();
        const h = el.scrollHeight;
        el.style.overflow = 'hidden'; el.style.height = '0px';
        $.to(el, { height: h, duration: duration / 1000 }).then(() => {
          el.style.height = ''; el.style.overflow = '';
          complete?.call(el);
        });
      });
    },
    slideUp(duration = 400, complete) {
      return this.each((_, el) => {
        el.style.overflow = 'hidden';
        $.to(el, { height: 0, duration: duration / 1000 }).then(() => {
          $(el).hide(); el.style.height = ''; el.style.overflow = '';
          complete?.call(el);
        });
      });
    },
    slideToggle(duration) { return this.each((_, el) => getComputedStyle(el).display === 'none' ? $(el).slideDown(duration) : $(el).slideUp(duration)); },
    // Direct GSAP-style chaining on collections
    to(props)   { $.to(this, props);   return this; },
    fromAnim(props) { $.from(this, props); return this; },
  });

  /* ============================================================
   * HYPER — htmx-style declarative AJAX via kj-* attributes
   *
   *   <button kj-get="/api/quote" kj-target="#quote" kj-swap="innerHTML">
   *   <form kj-post="/api/save" kj-target="#result">
   * ============================================================ */
  const HYPER_VERBS = ['get', 'post', 'put', 'patch', 'delete'];

  function hyperDefaultTrigger(el) {
    if (el.tagName === 'FORM') return 'submit';
    if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') return 'change';
    return 'click';
  }

  function hyperSwap(target, html, mode) {
    switch (mode) {
      case 'outerHTML': target.outerHTML = html; break;
      case 'beforebegin': case 'afterbegin': case 'beforeend': case 'afterend':
        target.insertAdjacentHTML(mode, html); break;
      case 'textContent': target.textContent = html; break;
      case 'none': break;
      default: target.innerHTML = html;
    }
  }

  async function hyperRequest(el, verb, url) {
    const $el = $(el);
    const confirmMsg = el.getAttribute('kj-confirm');
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    const targetSel = el.getAttribute('kj-target');
    const target = targetSel ? document.querySelector(targetSel) : el;
    const swap = el.getAttribute('kj-swap') || 'innerHTML';
    const indicator = el.getAttribute('kj-indicator');

    let data;
    if (el.tagName === 'FORM') data = new FormData(el);
    else {
      if (el.name && 'value' in el) {            // named input/select/textarea sends its own value
        data = new FormData();
        data.append(el.name, el.type === 'checkbox' ? el.checked : el.value);
      }
      const include = el.getAttribute('kj-include');
      if (include) {
        data = data || new FormData();
        for (const [k, v] of new FormData(document.querySelector(include))) data.append(k, v);
      }
      const vals = el.getAttribute('kj-vals');
      if (vals) {
        data = data || new FormData();
        const parsed = JSON.parse(vals);
        for (const k in parsed) data.append(k, parsed[k]);
      }
    }

    if (indicator) $(indicator).show();
    el.setAttribute('aria-busy', 'true');
    $el.trigger('kj:before', { url, verb });

    try {
      const html = await $.ajax({
        url, method: verb.toUpperCase(),
        data: verb === 'get' && data ? Object.fromEntries(data) : data,
      });
      if (target) hyperSwap(target, html, swap);
      $el.trigger('kj:after', { url, verb, html });
      if (target) {
        bindReactive(target.parentElement || document.body); // re-scan swapped content
        $(target).trigger('kj:load');
      }
      const pushUrl = el.getAttribute('kj-push-url');
      if (pushUrl) history.pushState({}, '', pushUrl === 'true' ? url : pushUrl);
    } catch (err) {
      $el.trigger('kj:error', { url, verb, error: err });
    } finally {
      if (indicator) $(indicator).hide();
      el.removeAttribute('aria-busy');
    }
  }

  function bindHyper(root = document) {
    for (const verb of HYPER_VERBS) {
      root.querySelectorAll(`[kj-${verb}]:not([data-kj-bound])`).forEach(el => {
        el.setAttribute('data-kj-bound', '');
        const url = el.getAttribute(`kj-${verb}`);
        const trigger = el.getAttribute('kj-trigger') || hyperDefaultTrigger(el);

        // "load" trigger fires immediately; "revealed" uses IntersectionObserver;
        // supports modifiers: "keyup delay:300ms", "every 5s"
        if (trigger === 'load') { hyperRequest(el, verb, url); return; }
        if (trigger === 'revealed') {
          if (!IntersectionObserver) { hyperRequest(el, verb, url); return; }
          new IntersectionObserver((entries, obs) => {
            entries.forEach(e => { if (e.isIntersecting) { hyperRequest(el, verb, url); obs.disconnect(); } });
          }).observe(el);
          return;
        }
        const every = trigger.match(/^every\s+([\d.]+)s$/);
        if (every) { setInterval(() => hyperRequest(el, verb, url), parseFloat(every[1]) * 1000); return; }

        const [eventName, ...mods] = trigger.split(/\s+/);
        let handler = e => {
          if (eventName === 'submit' || el.tagName === 'FORM') e.preventDefault();
          if (el.tagName === 'A') e.preventDefault();
          hyperRequest(el, verb, url);
        };
        const delayMod = mods.find(m => m.startsWith('delay:'));
        if (delayMod) handler = $.debounce(handler, parseFloat(delayMod.slice(6)) || 300);
        el.addEventListener(eventName, handler);
      });
    }
  }

  /* ============================================================
   * PULSE — Alpine-style reactivity via kj-* attributes
   *
   *   <div kj-data="{ count: 0, open: false }">
   *     <button kj-on:click="count++">+1</button>  (or @click="count++")
   *     <span kj-text="count"></span>
   *     <p kj-show="open">Hello</p>
   *     <input kj-model="name">
   *     <span kj-bind:class="open ? 'active' : ''"></span>
   *   </div>
   * ============================================================ */
  function reactive(obj, onChange) {
    return new Proxy(obj, {
      get(t, k) {
        const v = Reflect.get(t, k);
        return isObj(v) ? reactive(v, onChange) : v;
      },
      set(t, k, v) { const ok = Reflect.set(t, k, v); onChange(); return ok; },
      deleteProperty(t, k) { const ok = Reflect.deleteProperty(t, k); onChange(); return ok; },
    });
  }

  function evalIn(expr, scope, el, extra = {}) {
    try {
      return new Function('$data', '$el', '$event',
        `with($data){ return (${expr}) }`)(scope, el, extra.$event);
    } catch (err) {
      console.warn(`jsKjs: error in expression "${expr}"`, err);
    }
  }
  function execIn(expr, scope, el, extra = {}) {
    try {
      new Function('$data', '$el', '$event',
        `with($data){ ${expr} }`)(scope, el, extra.$event);
    } catch (err) {
      console.warn(`jsKjs: error in expression "${expr}"`, err);
    }
  }

  const componentScopes = new WeakMap();

  function findScope(el) {
    let node = el;
    while (node) {
      if (componentScopes.has(node)) return componentScopes.get(node);
      node = node.parentElement;
    }
    return null;
  }

  function bindReactive(root = document) {
    // 1. Initialize components
    root.querySelectorAll('[kj-data]:not([data-kj-init])').forEach(el => {
      el.setAttribute('data-kj-init', '');
      const raw = el.getAttribute('kj-data');
      let state;
      if ($.components?.[raw]) state = $.components[raw]();       // registered component
      else state = evalIn(raw || '{}', {}, el) || {};
      const render = () => renderComponent(el);
      const scope = reactive(state, render);
      componentScopes.set(el, scope);
      if (typeof scope.init === 'function') scope.init.call(scope);
      renderComponent(el);
    });

    // 2. Bind event directives (kj-on:click / @click)
    const all = [root, ...root.querySelectorAll('*')];
    for (const el of all) {
      if (!el.attributes || el.hasAttribute('data-kj-events')) continue;
      let bound = false;
      for (const attr of [...el.attributes]) {
        const m = attr.name.match(/^(?:kj-on:|@)(\w+)(?:\.(\w+))?$/);
        if (!m) continue;
        bound = true;
        const [, event, modifier] = m;
        const expr = attr.value;
        el.addEventListener(event, e => {
          if (modifier === 'prevent') e.preventDefault();
          if (modifier === 'stop') e.stopPropagation();
          if (modifier === 'enter' && e.key !== 'Enter') return;
          if (modifier === 'escape' && e.key !== 'Escape') return;
          const scope = findScope(el);
          if (scope) execIn(expr, scope, el, { $event: e });
        });
      }
      // kj-model two-way binding
      const model = el.getAttribute?.('kj-model');
      if (model) {
        bound = true;
        el.addEventListener('input', () => {
          const scope = findScope(el);
          if (scope) execIn(`${model} = $el.type === 'checkbox' ? $el.checked : $el.value`, scope, el);
        });
      }
      if (bound) el.setAttribute('data-kj-events', '');
    }
  }

  function renderComponent(componentEl) {
    const scope = componentScopes.get(componentEl);
    if (!scope) return;
    const walk = [componentEl, ...componentEl.querySelectorAll('*')];
    for (const el of walk) {
      // skip nodes belonging to nested components
      if (el !== componentEl && el.closest('[kj-data]') !== componentEl) continue;

      const text = el.getAttribute('kj-text');
      if (text != null) el.textContent = evalIn(text, scope, el) ?? '';

      const htmlExpr = el.getAttribute('kj-html');
      if (htmlExpr != null) el.innerHTML = evalIn(htmlExpr, scope, el) ?? '';

      const show = el.getAttribute('kj-show');
      if (show != null) el.style.display = evalIn(show, scope, el) ? '' : 'none';

      const model = el.getAttribute('kj-model');
      if (model != null) {
        const v = evalIn(model, scope, el);
        if (el.type === 'checkbox') el.checked = !!v;
        else if (document.activeElement !== el) el.value = v ?? '';
      }

      for (const attr of [...el.attributes]) {
        const m = attr.name.match(/^(?:kj-bind:|:)([\w-]+)$/);
        if (!m) continue;
        const val = evalIn(attr.value, scope, el);
        const name = m[1];
        if (name === 'class') {
          const base = el.getAttribute('data-kj-class') ?? el.className;
          el.setAttribute('data-kj-class', base);
          el.className = (base + ' ' + (val || '')).trim();
        } else if (val === false || val == null) el.removeAttribute(name);
        else el.setAttribute(name, val === true ? '' : val);
      }
    }
  }

  // Register reusable components: $.component('counter', () => ({ count: 0 }))
  $.components = {};
  $.component = (name, factory) => { $.components[name] = factory; };

  // Global reactive stores: const cart = $.store('cart', { items: [] })
  const stores = {};
  $.store = (name, initial) => {
    if (initial !== undefined || !stores[name]) {
      stores[name] = reactive(initial || {}, () =>
        document.querySelectorAll('[kj-data]').forEach(el => renderComponent(el)));
    }
    return stores[name];
  };
  $.reactive = obj => reactive(obj, () => {});

  /* ============================================================
   * UTILITIES
   * ============================================================ */
  $.each = (collection, fn) => {
    if (Array.isArray(collection) || collection?.length !== undefined)
      Array.prototype.forEach.call(collection, (v, i) => fn.call(v, i, v));
    else for (const k in collection) fn.call(collection[k], k, collection[k]);
    return collection;
  };
  $.map = (collection, fn) => Array.prototype.map.call(collection, (v, i) => fn(v, i)).flat();
  $.extend = (deep, target, ...sources) => {
    if (deep !== true) return Object.assign(deep, target, ...sources);
    for (const src of sources) for (const k in src) {
      if (isObj(src[k]) && isObj(target[k])) $.extend(true, target[k], src[k]);
      else target[k] = src[k];
    }
    return target;
  };
  $.debounce = (fn, wait = 300) => {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
  };
  $.throttle = (fn, wait = 300) => {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= wait) { last = now; fn.apply(this, args); }
    };
  };
  $.param = obj => new URLSearchParams(obj).toString();
  $.parseHTML = html => [...$(html)];
  $.trim = s => String(s).trim();
  $.isArray = Array.isArray;
  $.isFunction = f => typeof f === 'function';
  $.isPlainObject = o => isObj(o) && Object.getPrototypeOf(o) === Object.prototype;
  $.uuid = () => crypto.randomUUID();
  $.noConflict = () => (window.$ = _prev$, $);
  $.escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ============================================================
   * BOOT
   * ============================================================ */
  function boot() {
    bindHyper(document);
    bindReactive(document);
    // Watch DOM for new kj-* nodes so dynamically added content Just Works
    if (MutationObserver) new MutationObserver(muts => {
      for (const m of muts) for (const node of m.addedNodes) {
        if (node.nodeType === 1) { bindHyper(node.parentElement || document); bindReactive(node.parentElement || document); }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState !== 'loading') queueMicrotask(boot);
  else document.addEventListener('DOMContentLoaded', boot, { once: true });

  const _prev$ = window.$;
  window.$ = window.kj = window.jsKjs = $;
  window.jQuery = window.jQuery || $;   // drop-in aliasing
  return $;
});
