/*!
 * jsKjs v1.0.0 — https://jskjs.org — github.com/kchecker/jskjs
 * The jQuery you remember, the superpowers you wished for.
 * jQuery 3.7 API · htmx-style Hyper · Alpine-style Pulse · GSAP-style Motion
 * Zero dependencies. Evergreen browsers (Chrome/Edge/Firefox 100+, Safari 15.4+). MIT License.
 *
 * The jQuery-compatible core is a modernised port of jQuery 3.7.1
 * (https://jquery.com — Copyright OpenJS Foundation and other contributors, MIT License),
 * with the legacy-browser code removed and Sizzle replaced by the native selector engine.
 */
(function (global, factory) {
  typeof module === 'object' && module.exports ? (module.exports = factory(global)) : factory(global);
})(typeof window !== 'undefined' ? window : this, function (window) {
  'use strict';

  const document = window.document;
  const VERSION = '1.0.0';
  const JQUERY_API = '3.7.1';
  const getComputedStyle = (el, pseudo) => (el.ownerDocument && el.ownerDocument.defaultView || window).getComputedStyle(el, pseudo);
  const raf = cb => (window.requestAnimationFrame ? window.requestAnimationFrame(cb) : window.setTimeout(() => cb(now()), 16));
  const CustomEvent = window.CustomEvent;
  const FormData = window.FormData;
  const URLSearchParams = window.URLSearchParams;
  const MutationObserver = window.MutationObserver;
  const IntersectionObserver = window.IntersectionObserver;
  const fetch = (...a) => window.fetch(...a);           // resolved at call time (mocks, instrumentation)
  const history = window.history;
  const location = window.location;
  const crypto = window.crypto;
  const G = typeof globalThis !== 'undefined' ? globalThis : window;
  const pick = n => window[n] || G[n];
  const Event = pick('Event'), MouseEvent = pick('MouseEvent') || Event;
  const Headers = pick('Headers'), AbortController = pick('AbortController'), Blob = pick('Blob'), DOMParser = pick('DOMParser');
  const sessionStorage = { getItem: k => window.sessionStorage.getItem(k), setItem: (k, v) => window.sessionStorage.setItem(k, v) };
  const now = () => (window.performance || Date).now();
  const documentElement = document.documentElement;

  /* ------------------------------------------------------------
   * Helpers
   * ------------------------------------------------------------ */
  const camel = s => s.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const kebab = s => s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
  const isObj = v => v !== null && typeof v === 'object';
  const isFn = v => typeof v === 'function' && typeof v.nodeType !== 'number' && typeof v.item !== 'function';
  const isStr = v => typeof v === 'string';
  const isWindow = o => o != null && o === o.window;
  const isNode = v => !!v && (!!v.nodeType || isWindow(v));
  const isEl = v => !!v && v.nodeType === 1;
  const unique = a => [...new Set(a)];
  const warn = (...a) => window.console && console.warn('jsKjs:', ...a);
  const rnothtmlwhite = /[^\x20\t\r\n\f]+/g;
  const nodeName = (elem, name) => !!elem && !!elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
  const class2type = {};
  'Boolean Number String Function Array Date RegExp Object Error Symbol'.split(' ').forEach(n => { class2type['[object ' + n + ']'] = n.toLowerCase(); });
  const toType = o => o == null ? o + '' : (typeof o === 'object' || typeof o === 'function') ? (o instanceof KJ ? 'object' : class2type[Object.prototype.toString.call(o)] || 'object') : typeof o;
  const fnToString = Function.prototype.toString, ObjectFunctionString = fnToString.call(Object);
  function isArrayLike(obj) {
    const length = !!obj && 'length' in obj && obj.length, type = toType(obj);
    if (typeof obj === 'function' || isWindow(obj)) return false;
    return type === 'array' || length === 0 || (typeof length === 'number' && length > 0 && (length - 1) in obj);
  }
  const BOOL_ATTRS = new Set(['checked', 'selected', 'disabled', 'readonly', 'required', 'hidden', 'open', 'multiple',
    'autofocus', 'novalidate', 'formnovalidate', 'inert', 'async', 'defer', 'autoplay', 'controls', 'loop', 'muted', 'reversed', 'allowfullscreen', 'default', 'ismap', 'itemscope', 'nomodule', 'playsinline']);

  /* ------------------------------------------------------------
   * Data: private (events, queues, Pulse/Hyper state) and user ($.data)
   * Stored in WeakMaps — nothing is written onto your nodes or objects.
   * ------------------------------------------------------------ */
  const acceptData = owner => owner.nodeType === 1 || owner.nodeType === 9 || !(+owner.nodeType);
  class Data {
    constructor() { this.map = new WeakMap(); }
    cache(owner) {
      if (!owner || (typeof owner !== 'object' && typeof owner !== 'function') || !acceptData(owner)) return {};
      let v = this.map.get(owner);
      if (!v) { v = {}; this.map.set(owner, v); }
      return v;
    }
    set(owner, data, value) {
      const cache = this.cache(owner);
      if (typeof data === 'string') cache[camel(data)] = value;
      else for (const prop in data) cache[camel(prop)] = data[prop];
      return cache;
    }
    get(owner, key) {
      if (key === undefined) return this.cache(owner);
      const c = owner && typeof owner === 'object' || typeof owner === 'function' ? this.map.get(owner) : undefined;
      return c && c[camel(key)];
    }
    access(owner, key, value) {
      if (key === undefined || (key && typeof key === 'string' && value === undefined)) return this.get(owner, key);
      this.set(owner, key, value);
      return value !== undefined ? value : key;
    }
    remove(owner, key) {
      const cache = owner && this.map.get(owner);
      if (cache === undefined) return;
      if (key !== undefined) {
        if (Array.isArray(key)) key = key.map(camel);
        else { key = camel(key); key = key in cache ? [key] : (key.match(rnothtmlwhite) || []); }
        let i = key.length;
        while (i--) delete cache[key[i]];
      }
      if (key === undefined || $.isEmptyObject(cache)) this.map.delete(owner);
    }
    hasData(owner) { const c = owner && (typeof owner === 'object' || typeof owner === 'function') ? this.map.get(owner) : undefined; return c !== undefined && !$.isEmptyObject(c); }
    discard(owner) { this.map.delete(owner); }
  }
  const dataPriv = new Data(), dataUser = new Data();
  const nodeData = el => dataPriv.cache(el);
  const dataStore = { get: el => el && (typeof el === 'object') ? dataPriv.map.get(el) : undefined };

  /* ============================================================
   * SELECTORS — native querySelectorAll, plus jQuery's extensions
   * (:visible :hidden :contains() :first :eq() :input :checkbox …, [a!=b],
   * leading combinators, custom $.expr.pseudos) via a small left-to-right engine.
   * ============================================================ */
  const whitespace = '[\\x20\\t\\r\\n\\f]';
  const rneedsContext = new RegExp('^' + whitespace + '*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(' + whitespace +
    '*((?:-\\d)?\\d*)' + whitespace + '*\\)|)(?=[^-]|$)', 'i');
  const rbool = /^(?:checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped)$/i;
  const runescape = new RegExp('\\\\[\\da-fA-F]{1,6}' + whitespace + '?|\\\\([^\\r\\n\\f])', 'g');
  const cssUnescape = str => str.replace(runescape, (escape, nonHex) => {
    if (nonHex) return nonHex;
    const high = parseInt(escape.slice(1), 16) - 0x10000;
    return high < 0 ? String.fromCharCode(high + 0x10000) : String.fromCharCode(high >> 10 | 0xD800, high & 0x3FF | 0xDC00);
  });
  const validCSS = sel => { try { document.createDocumentFragment().querySelector(sel); return true; } catch (e) { return false; } };
  // Sizzle accepted unquoted attribute values like [value=1]; CSS does not — quote them
  const quoteAttrs = sel => sel.replace(/\[\s*([^\s~|^$*!=\]]+)\s*([~|^$*!]?=)\s*([^\]'"\s][^\]]*?)\s*\]/g,
    (m, n, op, v) => /^(?:-?(?:\d*\.)?\d+|(?:[\w-]|\\.)+)$/.test(v) ? '[' + n + op + '"' + v.replace(/"/g, '\\"') + '"]' : m);
  const isVisible = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  const inputType = t => el => nodeName(el, 'input') && el.type === t;
  const buttonType = t => el => (nodeName(el, 'input') || nodeName(el, 'button')) && el.type === t;
  const BUILTIN_PSEUDOS = {
    visible: isVisible, hidden: el => !isVisible(el),
    animated: el => $.timers.some(t => t.elem === el) || !!($.isTweening && $.isTweening(el)),
    contains: (el, i, m) => ($.text(el) || '').indexOf(cssUnescape(m[3] || '')) > -1,
    header: el => /^h\d$/i.test(el.nodeName),
    input: el => /^(?:input|select|textarea|button)$/i.test(el.nodeName),
    button: el => (nodeName(el, 'input') && el.type === 'button') || nodeName(el, 'button'),
    text: el => nodeName(el, 'input') && el.type === 'text' && ((el.getAttribute('type')) == null || el.getAttribute('type').toLowerCase() === 'text'),
    radio: inputType('radio'), checkbox: inputType('checkbox'), file: inputType('file'), password: inputType('password'), image: inputType('image'),
    submit: buttonType('submit'), reset: buttonType('reset'),
    parent: el => { for (let n = el.firstChild; n; n = n.nextSibling) if (n.nodeType < 6) return true; return false; },
    selected: el => { if (el.parentNode) void el.parentNode.selectedIndex; return el.selected === true; },
  };
  const POSITIONAL = {
    first: a => a.slice(0, 1), last: a => a.slice(-1),
    even: a => a.filter((_, i) => i % 2 === 0), odd: a => a.filter((_, i) => i % 2 === 1),
    eq: (a, n) => { const e = a[n < 0 ? a.length + n : n]; return e ? [e] : []; }, nth: (a, n) => { const e = a[n]; return e ? [e] : []; },
    lt: (a, n) => a.slice(0, Math.max(0, n < 0 ? a.length + n : n)), gt: (a, n) => a.slice((n < 0 ? a.length + n : n) + 1),
  };
  const NATIVE_PSEUDOS = {};
  ['root', 'empty', 'checked', 'disabled', 'enabled', 'focus', 'target', 'link', 'first-child', 'last-child', 'only-child', 'first-of-type', 'last-of-type', 'only-of-type']
    .forEach(n => { NATIVE_PSEUDOS[n] = el => el.matches(':' + n); });
  const extNames = () => Object.keys(($.expr && $.expr.setFilters) || POSITIONAL).concat(Object.keys(($.expr && $.expr.pseudos) || BUILTIN_PSEUDOS)
    .filter(k => !(k in NATIVE_PSEUDOS) || $.expr.pseudos[k] !== NATIVE_PSEUDOS[k]));
  let rExtCache = null, rExtKey = '';
  function rExt() {
    const names = extNames().filter((n, i, a) => a.indexOf(n) === i);
    const key = names.join('|');
    if (key !== rExtKey) { rExtKey = key; rExtCache = new RegExp('(?:^|[^:]):(' + key + ')(?![\\w-])|!=|(?:^|,)\\s*[+~]', 'i'); }
    return rExtCache;
  }
  function splitTopLevel(sel, sep = ',') {
    const out = []; let depth = 0, cur = '', q = '';
    for (let i = 0; i < sel.length; i++) {
      const ch = sel[i];
      if (q) { cur += ch; if (ch === '\\') { cur += sel[++i] || ''; continue; } if (ch === q) q = ''; continue; }
      if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
      if (ch === '\\') { cur += ch + (sel[++i] || ''); continue; }
      if (ch === '(' || ch === '[') depth++;
      if (ch === ')' || ch === ']') depth--;
      if (ch === sep && !depth) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur); return out;
  }
  // "div.a > p:first span" → [{ comb: ' ', compound: 'div.a' }, { comb: '>', compound: 'p:first' }, …]
  function tokenizeGroup(group) {
    const parts = []; let depth = 0, cur = '', q = '', comb = ' ';
    const flush = () => { if (cur.trim()) { parts.push({ comb, compound: cur.trim() }); comb = ' '; } cur = ''; };
    const s = group.trim();
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) { cur += ch; if (ch === '\\') { cur += s[++i] || ''; continue; } if (ch === q) q = ''; continue; }
      if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
      if (ch === '\\') { cur += ch + (s[++i] || ''); continue; }
      if (ch === '(' || ch === '[') depth++;
      if (ch === ')' || ch === ']') depth--;
      if (!depth && (ch === '>' || ch === '+' || ch === '~')) { flush(); comb = ch; continue; }
      if (!depth && /\s/.test(ch)) { if (cur.trim()) { flush(); } continue; }
      cur += ch;
    }
    flush();
    if (!parts.length && comb !== ' ') parts.push({ comb, compound: '*' });
    return parts;
  }
  // split a compound into its CSS part plus jQuery filters (element filters and set filters)
  function compileCompound(compound) {
    const custom = ($.expr && $.expr.pseudos) || BUILTIN_PSEUDOS;
    let css = '', i = 0;
    const filters = [];
    while (i < compound.length) {
      const ch = compound[i];
      if (ch === '[') {
        let depth = 0, j = i, q = '';
        for (; j < compound.length; j++) {
          const c = compound[j];
          if (q) { if (c === '\\') { j++; continue; } if (c === q) q = ''; continue; }
          if (c === '"' || c === "'") { q = c; continue; }
          if (c === '[') depth++; else if (c === ']' && !--depth) break;
        }
        let attr = compound.slice(i, j + 1);
        const ne = attr.match(/^\[\s*([^\s!=\]]+)\s*!=\s*(.*?)\s*\]$/);
        if (ne) attr = ':not([' + ne[1] + '=' + ne[2] + '])';
        css += attr; i = j + 1; continue;
      }
      if (ch === ':' && compound[i + 1] !== ':') {
        const m = compound.slice(i).match(/^:([\w-]+)/);
        const rawName = m ? m[1] : '', name = rawName.toLowerCase();
        let j = i + 1 + rawName.length, arg;
        if (compound[j] === '(') {
          let depth = 0, k = j, q = '';
          for (; k < compound.length; k++) {
            const c = compound[k];
            if (q) { if (c === '\\') { k++; continue; } if (c === q) q = ''; continue; }
            if (c === '"' || c === "'") { q = c; continue; }
            if (c === '(') depth++; else if (c === ')' && !--depth) break;
          }
          arg = compound.slice(j + 1, k).trim().replace(/^(["'])(.*)\1$/, '$2');
          j = k + 1;
        }
        if (Object.prototype.hasOwnProperty.call(custom, name) && custom[name] && !(name in NATIVE_PSEUDOS && custom[name] === NATIVE_PSEUDOS[name])) {
          const f = custom[name];
          filters.push({ el: f.kjPseudo || f.sizzleFilter ? f(arg) : (el, idx) => f(el, idx, [':' + name + (arg != null ? '(' + arg + ')' : ''), name, undefined, arg]) });
        } else if ($.expr.setFilters[name]) {
          const sf = $.expr.setFilters[name];
          if (sf.kjPositional) filters.push({ set: a => POSITIONAL[sf.kjPositional](a, +arg || 0) });
          else {
            // Sizzle-style custom set filter: createPseudo(arg => createPseudo((seed, matches) => …))
            if (!sf.kjPseudo) filters.push({ set: a => [...(sf(a.slice(), arg) || [])] });          // old style: (elements, argument) → elements
            else {
              const inner = sf(arg);
              filters.push({ set: a => {
                if (!inner.kjPseudo) return a.filter(e => inner(e));
                const seed = a.slice(), matches = []; inner(seed, matches, null, null); return matches.filter(Boolean);
              } });
            }
          }
        } else if (name === 'not' && arg != null && hasPositional(arg)) {
          const inner = arg;
          filters.push({ set: a => { const ex = seedFilter(inner, a); return a.filter(e => !ex.includes(e)); } });
        } else if (name === 'not' && arg != null && (rExt().test(':' + arg.replace(/^:/, '')) || !validCSS(arg))) {
          const inner = arg;
          filters.push({ el: el => { try { return !matchesSel(el, inner); } catch (e) { return true; } } });
        } else if (name === 'has' && arg != null && (rExt().test(arg) || /:has\(/i.test(arg))) {
          const inner = arg;
          filters.push({ el: el => qsaContext(el, inner).length > 0 });
        } else css += compound.slice(i, j);
        i = j; continue;
      }
      css += ch; i++;
    }
    return { css: css || '*', filters };
  }
  const elementChildren = el => el.children ? [...el.children] : [...(el.childNodes || [])].filter(isEl);
  function engine(context, selector) {
    const out = [];
    for (const group of splitTopLevel(selector)) {
      if (!group.trim()) throw new Error('Syntax error, unrecognized expression: ' + selector);
      let set = null;
      for (const { comb, compound } of tokenizeGroup(group)) {
        const { css: rawCss, filters } = compileCompound(compound);
        const css = validCSS(rawCss) ? rawCss : quoteAttrs(rawCss);
        const roots = set === null ? [context] : set;
        let next = [];
        for (const r of roots) {
          if (comb === ' ') next.push(...(r.querySelectorAll ? r.querySelectorAll(css) : []));
          else if (comb === '>') next.push(...elementChildren(r).filter(c => c.matches(css)));
          else if (comb === '+') { const n = r.nextElementSibling; if (n && n.matches(css)) next.push(n); }
          else if (comb === '~') for (let n = r.nextElementSibling; n; n = n.nextElementSibling) if (n.matches(css)) next.push(n);
        }
        next = roots.length > 1 ? uniqueSort(unique(next)) : unique(next);
        for (const f of filters) next = f.set ? f.set(next) : next.filter((el, i) => f.el(el, i));
        set = next;
      }
      out.push(...(set || []));
    }
    return uniqueSort(unique(out));
  }
  const needsEngine = sel => rExt().test(sel);
  // jQuery semantics for element contexts: every part of the selector must sit inside the context
  function scoped(sel) { return splitTopLevel(sel).map(g => { const t = g.trim(); return /^[>+~]/.test(t) ? ':scope ' + t : ':scope ' + t; }).join(','); }
  const syntaxError = sel => new Error('Syntax error, unrecognized expression: ' + sel);
  function qsaContext(context, selector) {
    if (!selector.trim()) return [];
    const leadingChild = context.nodeType !== 1 && splitTopLevel(selector).some(g => /^\s*>/.test(g));
    if (!needsEngine(selector) && !leadingChild) {
      const native = context.nodeType === 1 ? scoped(selector) : selector;
      try { return [...context.querySelectorAll(native)]; } catch (e) { /* try jQuery's dialect below */ }
      const q = quoteAttrs(native);
      if (q !== native) { try { return [...context.querySelectorAll(q)]; } catch (e) { /* fall through */ } }
    }
    try { return engine(context, selector); } catch (e) { throw syntaxError(selector); }
  }
  const qsa = (root, sel) => qsaContext(root, sel);
  // Sizzle's seed semantics: positional pseudos count within the elements being filtered
  function seedFilter(selector, seed) {
    if (!hasPositional(selector)) return seed.filter(el => isEl(el) && matchesSel(el, selector));
    const out = [];
    for (const group of splitTopLevel(selector)) {
      const toks = tokenizeGroup(group);
      const last = toks[toks.length - 1];
      if (toks.slice(0, -1).some(t => hasPositional(t.compound))) {
        const all = engine(document, group); out.push(...seed.filter(e => all.includes(e))); continue;
      }
      const sets = [];
      const stripped = last.compound.replace(new RegExp(rPositional.source, 'gi'), m => { sets.push(m); return ''; }) || '*';
      const base = toks.slice(0, -1).map(t => t.comb + ' ' + t.compound).join(' ').replace(/^\s*\s/, '') ;
      const prefix = toks.length > 1 ? toks.slice(0, -1).map((t, k) => (k ? t.comb + ' ' : (t.comb !== ' ' ? t.comb + ' ' : '')) + t.compound).join(' ') + ' ' + last.comb + ' ' : '';
      void base;
      let list = seed.filter(el => isEl(el) && matchesSel(el, prefix + stripped));
      for (const p of sets) { const { filters } = compileCompound(p); for (const f of filters) list = f.set ? f.set(list) : list.filter(f.el); }
      out.push(...list);
    }
    return uniqueSort(unique(out));
  }
  const rPositional = /:(first|last|even|odd|eq|lt|gt|nth)(?![\w-])(?:\([^)]*\))?/i;
  const hasPositional = sel => rPositional.test(sel.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""').replace(/\[[^\]]*\]/g, '[]'));
  function matchesSel(el, sel) {
    if (!isEl(el)) return false;
    if (!sel.trim()) return false;
    if (!needsEngine(sel) && !/^\s*[>+~]/.test(sel)) {
      try { return el.matches(sel); } catch (e) {
        const q = quoteAttrs(sel);
        if (q !== sel) { try { return el.matches(q); } catch (e2) { /* engine */ } }
      }
    }
    if (hasPositional(sel)) return seedFilter(sel, [el]).length > 0;
    if (el.isConnected) return engine(el.ownerDocument || document, sel).includes(el);
    let top = el; while (top.parentNode) top = top.parentNode;
    // disconnected tree: search it as if it hung off a fragment
    const root = { nodeType: 11, querySelectorAll: s => [top, ...(top.querySelectorAll ? top.querySelectorAll(s) : [])].filter(e => isEl(e) && e.matches(s)) };
    return engine(root, sel).includes(el);
  }

  // jQuery.uniqueSort: document order, duplicates removed (disconnected nodes keep input order)
  let hasDuplicate = false;
  function sortOrder(a, b) {
    if (a === b) { hasDuplicate = true; return 0; }
    let compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
    if (compare) return compare;
    compare = (a.ownerDocument || a) === (b.ownerDocument || b) ? a.compareDocumentPosition(b) : 1;
    if (compare & 1) {
      if (a === document || (a.ownerDocument === document && $.contains(document, a))) return -1;
      if (b === document || (b.ownerDocument === document && $.contains(document, b))) return 1;
      return 0;
    }
    return compare & 4 ? -1 : 1;
  }
  function uniqueSort(results) {
    const duplicates = [];
    let elem, j = 0, i = 0;
    hasDuplicate = false;
    results.sort(sortOrder);
    if (hasDuplicate) {
      while ((elem = results[i++])) if (elem === results[i]) j = duplicates.push(i);
      while (j--) results.splice(duplicates[j], 1);
    }
    return results;
  }

  /* ============================================================
   * CORE — the collection is a real Array subclass with jQuery's API
   * ============================================================ */
  const rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/;
  const rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
  let rootjQuery;
  class KJ extends Array {
    constructor(selector, context, root) {
      super();
      if (!selector) return;
      root = root || rootjQuery;
      if (typeof selector === 'string') {
        let match;
        if (selector[0] === '<' && selector[selector.length - 1] === '>' && selector.length >= 3) match = [null, selector, null];
        else match = rquickExpr.exec(selector);
        if (match && (match[1] || !context)) {
          if (match[1]) {
            context = context instanceof KJ ? context[0] : context;
            $.merge(this, $.parseHTML(match[1], context && context.nodeType ? context.ownerDocument || context : document, true));
            if (rsingleTag.test(match[1]) && $.isPlainObject(context)) {
              for (const k in context) { if (isFn(this[k])) this[k](context[k]); else this.attr(k, context[k]); }
            }
            return;
          }
          const elem = document.getElementById(match[2]);
          if (elem) { this[0] = elem; }
          return;
        } else if (!context || context instanceof KJ) {
          return (context || root).find(selector);
        }
        return new KJ(context).find(selector);
      } else if (selector.nodeType) {
        this[0] = selector;
        return;
      } else if (isFn(selector)) {
        return root.ready !== undefined ? root.ready(selector) : selector($);
      }
      $.makeArray(selector, this);
    }
    static get [Symbol.species]() { return Array; }
  }

  function $(selector, context) { return new KJ(selector, context); }
  $.fn = $.prototype = KJ.prototype;
  Object.defineProperty($.fn, 'constructor', { value: $, writable: true, configurable: true, enumerable: false });
  $.fn.init = function (selector, context, root) { return new KJ(selector, context, root); };
  $.fn.init.prototype = $.fn;
  $.fn.jquery = JQUERY_API;                          // the jQuery API level jsKjs implements (plugins check this)
  $.fn.jskjs = VERSION;
  $.version = VERSION;

  Object.assign($.fn, {
    toArray() { return Array.prototype.slice.call(this); },
    get(num) { return num == null ? Array.prototype.slice.call(this) : num < 0 ? this[num + this.length] : this[num]; },
    pushStack(elems) { const ret = $.merge(new KJ(), elems); ret.prevObject = this; return ret; },
    each(callback) { return $.each(this, callback); },
    map(callback) { return this.pushStack($.map(this, (elem, i) => callback.call(elem, i, elem))); },
    slice(...a) { return this.pushStack(Array.prototype.slice.apply(this, a)); },
    first() { return this.eq(0); },
    last() { return this.eq(-1); },
    even() { return this.pushStack($.grep(this, (_e, i) => (i + 1) % 2)); },
    odd() { return this.pushStack($.grep(this, (_e, i) => i % 2)); },
    eq(i) { const len = this.length, j = +i + (i < 0 ? len : 0); return this.pushStack(j >= 0 && j < len ? [this[j]] : []); },
    end() { return this.prevObject || new KJ(); },
  });

  $.extend = $.fn.extend = function () {
    let options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, deep = false;
    const length = arguments.length;
    if (typeof target === 'boolean') { deep = target; target = arguments[i] || {}; i++; }
    if (typeof target !== 'object' && !isFn(target)) target = {};
    if (i === length) { target = this; i--; }
    for (; i < length; i++) {
      if ((options = arguments[i]) != null) {
        for (name in options) {
          copy = options[name];
          if (name === '__proto__' || target === copy) continue;       // no prototype pollution, no loops
          if (deep && copy && ($.isPlainObject(copy) || (copyIsArray = Array.isArray(copy) && !(copy instanceof KJ)))) {
            src = target[name];
            if (copyIsArray && !Array.isArray(src)) clone = [];
            else if (!copyIsArray && !$.isPlainObject(src)) clone = {};
            else clone = src;
            copyIsArray = false;
            target[name] = $.extend(deep, clone, copy);
          } else if (copy !== undefined) target[name] = copy;
        }
      }
    }
    return target;
  };

  const support = {};
  $.extend({
    expando: 'jQuery' + (JQUERY_API + Math.random()).replace(/\D/g, ''),
    isReady: false,
    error(msg) { throw new Error(msg); },
    noop() {},
    isPlainObject(obj) {
      if (!obj || Object.prototype.toString.call(obj) !== '[object Object]') return false;
      const proto = Object.getPrototypeOf(obj);
      if (!proto) return true;
      const Ctor = Object.prototype.hasOwnProperty.call(proto, 'constructor') && proto.constructor;
      return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
    },
    isEmptyObject(obj) { for (const _n in obj) return false; return true; },
    globalEval(code, options, doc) { DOMEval(code, { nonce: options && options.nonce }, doc); },
    each(obj, callback) {
      if (isArrayLike(obj)) { for (let i = 0, length = obj.length; i < length; i++) if (callback.call(obj[i], i, obj[i]) === false) break; }
      else for (const i in obj) if (callback.call(obj[i], i, obj[i]) === false) break;
      return obj;
    },
    text(elem) {
      let node, ret = '', i = 0;
      const nodeType = elem.nodeType;
      if (!nodeType) while ((node = elem[i++])) ret += $.text(node);
      if (nodeType === 1 || nodeType === 11) return elem.textContent;
      if (nodeType === 9) return elem.documentElement.textContent;
      if (nodeType === 3 || nodeType === 4) return elem.nodeValue;
      return ret;
    },
    makeArray(arr, results) {
      const ret = results || [];
      if (arr != null) {
        if (isArrayLike(Object(arr))) $.merge(ret, typeof arr === 'string' ? [arr] : arr);
        else Array.prototype.push.call(ret, arr);
      }
      return ret;
    },
    inArray(elem, arr, i) { return arr == null ? -1 : Array.prototype.indexOf.call(arr, elem, i); },
    isXMLDoc(elem) {
      const namespace = elem && elem.namespaceURI, docElem = elem && (elem.ownerDocument || elem).documentElement;
      return !/HTML$/i.test(namespace || (docElem && docElem.nodeName) || 'HTML');
    },
    merge(first, second) {
      const len = +second.length;
      let j = 0, i = first.length;
      for (; j < len; j++) first[i++] = second[j];
      first.length = i;
      return first;
    },
    grep(elems, callback, invert) {
      const matches = [], callbackExpect = !invert;
      for (let i = 0, length = elems.length; i < length; i++) if (!callback(elems[i], i) !== callbackExpect) matches.push(elems[i]);
      return matches;
    },
    map(elems, callback, arg) {
      let value;
      const ret = [];
      if (isArrayLike(elems)) { for (let i = 0, length = elems.length; i < length; i++) { value = callback(elems[i], i, arg); if (value != null) ret.push(value); } }
      else for (const i in elems) { value = callback(elems[i], i, arg); if (value != null) ret.push(value); }
      const flat = [];
      for (const v of ret) { if (Array.isArray(v) && !(v instanceof KJ)) for (let k = 0; k < v.length; k++) flat.push(v[k]); else flat.push(v); }
      return flat;
    },
    guid: 1,
    support,
    contains(a, b) {
      const bup = b && b.parentNode;
      return a === bup || !!(bup && bup.nodeType === 1 && (a.contains ? a.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
    },
    escapeSelector(sel) { return (sel + '').replace(/([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-￿\w-]/g, (ch, asCodePoint) => asCodePoint ? (ch === '\0' ? '�' : ch.slice(0, -1) + '\\' + ch.charCodeAt(ch.length - 1).toString(16) + ' ') : '\\' + ch); },
    uniqueSort, unique: uniqueSort,
    find(selector, context, results, seed) {
      results = results || [];
      context = context || document;
      if (!selector || typeof selector !== 'string') return results;
      const nodeType = context.nodeType;
      if (nodeType !== 1 && nodeType !== 9 && nodeType !== 11) return [];
      if (seed) {
        if (nodeType === 1 && context !== documentElement) {
          // rooted like Sizzle: every part of the selector must sit inside the context (used by delegation)
          let within = null;
          for (const el of seed) {
            if (!isEl(el) || !$.contains(context, el)) continue;
            if (hasPositional(selector) || needsEngine(selector) || matchesSel(el, selector)) {
              within = within || qsaContext(context, selector);
              if (within.includes(el)) results.push(el);
            }
          }
        } else results.push(...seedFilter(selector, [...seed]));
      }
      else $.merge(results, qsaContext(context, selector));
      return results;
    },
    expr: { attrHandle: {}, match: { bool: rbool, needsContext: rneedsContext }, pseudos: Object.assign({}, NATIVE_PSEUDOS, BUILTIN_PSEUDOS), createPseudo(fn) { fn.kjPseudo = true; return fn; },
      setFilters: Object.fromEntries(Object.keys(POSITIONAL).map(n => [n, Object.assign(() => {}, { kjPositional: n })])) },
  });
  $.expr[':'] = $.expr.filters = $.expr.pseudos;
  $.fn[Symbol.iterator] = Array.prototype[Symbol.iterator];
  Object.assign($.find, {
    matches: (expr, elements) => $.find(expr, null, null, elements),
    matchesSelector: (elem, expr) => matchesSel(elem, expr),
    attr(elem, name) {
      const fn = $.expr.attrHandle[name.toLowerCase()];
      const value = fn && Object.prototype.hasOwnProperty.call($.expr.attrHandle, name.toLowerCase()) ? fn(elem, name, $.isXMLDoc(elem)) : undefined;
      return value !== undefined ? value : elem.getAttribute(name);
    },
    contains: (a, b) => $.contains(a, b),
    uniqueSort,
  });
  $.fn.uniqueSort = function () { return this.pushStack($.uniqueSort(Array.prototype.slice.apply(this))); };
  const isAttached = elem => $.contains(elem.ownerDocument, elem) || (elem.getRootNode && elem.getRootNode({ composed: true }) === elem.ownerDocument);

  const preservedScriptAttributes = { type: true, src: true, nonce: true, noModule: true };
  function DOMEval(code, node, doc) {
    doc = doc || document;
    const script = doc.createElement('script');
    script.text = code;
    if (node) for (const i in preservedScriptAttributes) { const val = node[i] || (node.getAttribute && node.getAttribute(i)); if (val) script.setAttribute(i, val); }
    doc.head.appendChild(script).parentNode.removeChild(script);
  }

  // jQuery's multi-purpose getter/setter helper
  function access(elems, fn, key, value, chainable, emptyGet, raw) {
    let i = 0, bulk = key == null;
    const len = elems.length;
    if (toType(key) === 'object') {
      chainable = true;
      for (i in key) access(elems, fn, i, key[i], true, emptyGet, raw);
    } else if (value !== undefined) {
      chainable = true;
      if (!isFn(value)) raw = true;
      if (bulk) {
        if (raw) { fn.call(elems, value); fn = null; }
        else { bulk = fn; fn = (elem, _key, v) => bulk.call($(elem), v); }
      }
      if (fn) for (; i < len; i++) fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
    }
    if (chainable) return elems;
    if (bulk) return fn.call(elems);
    return len ? fn(elems[0], key) : emptyGet;
  }

  /* ---------------- data ---------------- */
  const rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/, rmultiDash = /[A-Z]/g;
  function getData(data) {
    if (data === 'true') return true;
    if (data === 'false') return false;
    if (data === 'null') return null;
    if (data === +data + '') return +data;
    if (rbrace.test(data)) return JSON.parse(data);
    return data;
  }
  function dataAttr(elem, key, data) {
    if (data === undefined && elem.nodeType === 1) {
      const name = 'data-' + key.replace(rmultiDash, '-$&').toLowerCase();
      data = elem.getAttribute(name);
      if (typeof data === 'string') {
        try { data = getData(data); } catch (e) { /* keep the string */ }
        dataUser.set(elem, key, data);
      } else data = undefined;
    }
    return data;
  }
  $.extend({
    hasData: elem => dataUser.hasData(elem) || dataPriv.hasData(elem),
    data: (elem, name, data) => dataUser.access(elem, name, data),
    removeData: (elem, name) => { dataUser.remove(elem, name); },
    _data: (elem, name, data) => dataPriv.access(elem, name, data),
    _removeData: (elem, name) => { dataPriv.remove(elem, name); },
  });
  $.fn.extend({
    data(key, value) {
      const elem = this[0], attrs = elem && elem.attributes;
      if (key === undefined) {
        let data;
        if (this.length) {
          data = dataUser.get(elem);
          if (elem.nodeType === 1 && !dataPriv.get(elem, 'hasDataAttrs')) {
            let i = attrs.length;
            while (i--) {
              if (attrs[i]) { let name = attrs[i].name; if (name.indexOf('data-') === 0) { name = camel(name.slice(5)); dataAttr(elem, name, data[name]); } }
            }
            dataPriv.set(elem, 'hasDataAttrs', true);
          }
        }
        return data;
      }
      if (typeof key === 'object') return this.each(function () { dataUser.set(this, key); });
      return access(this, function (v) {
        if (elem && v === undefined) {
          let data = dataUser.get(elem, key);
          if (data !== undefined) return data;
          data = dataAttr(elem, key);
          if (data !== undefined) return data;
          return;
        }
        this.each(function () { dataUser.set(this, key, v); });
      }, null, value, arguments.length > 1, null, true);
    },
    removeData(key) { return this.each(function () { dataUser.remove(this, key); }); },
  });

  /* ---------------- ready ---------------- */
  let readyList = null;               // a Deferred, created once Deferred exists (see READY below)
  const pendingReady = [];
  function ready(fn) { if (readyList) readyList.then(fn).catch(e => $.readyException(e)); else pendingReady.push(fn); }
  $.fn.ready = function (fn) { ready(fn); return this; };
  $.readyException = error => { window.setTimeout(() => { throw error; }); };
  $.readyWait = 1;
  $.ready = function (wait) {
    if (wait === true ? --$.readyWait : $.isReady) return;
    $.isReady = true;
    if (wait !== true && --$.readyWait > 0) return;
    if (readyList) readyList.resolveWith(document, [$]);
  };
  $.holdReady = hold => { if (hold) $.readyWait++; else $.ready(true); };

  /* ============================================================
   * ATTRIBUTES, PROPERTIES, CLASSES, VALUES
   * ============================================================ */
  const support_ = (() => {
    const input = document.createElement('input'), select = document.createElement('select');
    const opt = select.appendChild(document.createElement('option'));
    input.type = 'checkbox';
    const r = { checkOn: input.value !== '', optSelected: opt.selected, ajax: true, cors: true, scope: true, sortStable: true, sortDetached: true,
      getById: true, disconnectedMatch: true, cssHas: (() => { try { document.querySelector(':has(*,:jqfake)'); return false; } catch (e) { return true; } })() };
    const radio = document.createElement('input'); radio.value = 't'; radio.type = 'radio';
    r.radioValue = radio.value === 't';
    const frag = document.createDocumentFragment(), div = frag.appendChild(document.createElement('div')), inp = document.createElement('input');
    inp.setAttribute('type', 'radio'); inp.setAttribute('checked', 'checked'); inp.setAttribute('name', 't');
    div.appendChild(inp);
    r.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked;
    div.innerHTML = '<textarea>x</textarea>';
    r.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue;
    div.innerHTML = '<option></option>';
    r.option = !!div.lastChild;
    const body = document.implementation.createHTMLDocument('').body;
    body.innerHTML = '<form></form><form></form>';
    r.createHTMLDocument = body.childNodes.length === 2;
    return r;
  })();
  Object.assign(support, support_);

  const attrHandle = $.expr.attrHandle;
  const boolHook = {
    set(elem, value, name) {
      if (value === false) $.removeAttr(elem, name);
      else elem.setAttribute(name, name);
      return name;
    },
  };
  $.fn.extend({
    attr(name, value) { return access(this, $.attr, name, value, arguments.length > 1); },
    removeAttr(name) { return this.each(function () { $.removeAttr(this, name); }); },
    prop(name, value) { return access(this, $.prop, name, value, arguments.length > 1); },
    removeProp(name) { return this.each(function () { delete this[$.propFix[name] || name]; }); },
  });
  $.extend({
    attr(elem, name, value) {
      let ret, hooks;
      const nType = elem.nodeType;
      if (nType === 3 || nType === 8 || nType === 2) return;
      if (typeof elem.getAttribute === 'undefined') return $.prop(elem, name, value);
      if (nType !== 1 || !$.isXMLDoc(elem)) hooks = $.attrHooks[name.toLowerCase()] || ($.expr.match.bool.test(name) ? boolHook : undefined);
      if (value !== undefined) {
        if (value === null) { $.removeAttr(elem, name); return; }
        if (hooks && 'set' in hooks && (ret = hooks.set(elem, value, name)) !== undefined) return ret;
        elem.setAttribute(name, value + '');
        return value;
      }
      if (hooks && 'get' in hooks && (ret = hooks.get(elem, name)) !== null) return ret;
      ret = $.find.attr(elem, name);
      return ret == null ? undefined : ret;
    },
    attrHooks: {
      type: {
        set(elem, value) {
          if (!support.radioValue && value === 'radio' && nodeName(elem, 'input')) {
            const val = elem.value; elem.setAttribute('type', value); if (val) elem.value = val; return value;
          }
        },
      },
    },
    removeAttr(elem, value) {
      const attrNames = value && value.match(rnothtmlwhite);
      if (attrNames && elem.nodeType === 1) for (const name of attrNames) elem.removeAttribute(name);
    },
    prop(elem, name, value) {
      let ret, hooks;
      const nType = elem.nodeType;
      if (nType === 3 || nType === 8 || nType === 2) return;
      if (nType !== 1 || !$.isXMLDoc(elem)) { name = $.propFix[name] || name; hooks = $.propHooks[name]; }
      if (value !== undefined) {
        if (hooks && 'set' in hooks && (ret = hooks.set(elem, value, name)) !== undefined) return ret;
        return (elem[name] = value);
      }
      if (hooks && 'get' in hooks && (ret = hooks.get(elem, name)) !== null) return ret;
      return elem[name];
    },
    propHooks: {
      tabIndex: {
        get(elem) {
          const tabindex = $.find.attr(elem, 'tabindex');
          if (tabindex) return parseInt(tabindex, 10);
          if (/^(?:input|select|textarea|button)$/i.test(elem.nodeName) || (/^(?:a|area)$/i.test(elem.nodeName) && elem.href)) return 0;
          return -1;
        },
      },
    },
    propFix: { for: 'htmlFor', class: 'className' },
  });
  // boolean attributes read back as their own name ("checked") or undefined
  for (const name of $.expr.match.bool.source.match(/\w+/g)) {
    const getter = attrHandle[name] || $.find.attr;
    attrHandle[name] = function (elem, nm, isXML) {
      let ret;
      const lower = nm.toLowerCase();
      if (!isXML) {
        const handle = attrHandle[lower];
        attrHandle[lower] = ret;
        ret = getter(elem, nm, isXML) != null ? lower : null;
        attrHandle[lower] = handle;
      }
      return ret;
    };
  }
  if (!support.optSelected) {
    $.propHooks.selected = {
      get(elem) { const p = elem.parentNode; if (p && p.parentNode) void p.parentNode.selectedIndex; return null; },
      set(elem) { const p = elem.parentNode; if (p) { void p.selectedIndex; if (p.parentNode) void p.parentNode.selectedIndex; } },
    };
  }
  ['tabIndex', 'readOnly', 'maxLength', 'cellSpacing', 'cellPadding', 'rowSpan', 'colSpan', 'useMap', 'frameBorder', 'contentEditable']
    .forEach(n => { $.propFix[n.toLowerCase()] = n; });

  const stripAndCollapse = value => (value.match(rnothtmlwhite) || []).join(' ');
  const getClass = elem => (elem.getAttribute && elem.getAttribute('class')) || '';
  const classesToArray = value => Array.isArray(value) ? value : typeof value === 'string' ? value.match(rnothtmlwhite) || [] : [];
  $.fn.extend({
    addClass(value) {
      if (isFn(value)) return this.each(function (j) { $(this).addClass(value.call(this, j, getClass(this))); });
      const classNames = classesToArray(value);
      if (classNames.length) {
        return this.each(function () {
          const curValue = getClass(this);
          let cur = this.nodeType === 1 && (' ' + stripAndCollapse(curValue) + ' ');
          if (cur) {
            for (const c of classNames) if (cur.indexOf(' ' + c + ' ') < 0) cur += c + ' ';
            const finalValue = stripAndCollapse(cur);
            if (curValue !== finalValue) this.setAttribute('class', finalValue);
          }
        });
      }
      return this;
    },
    removeClass(value) {
      if (isFn(value)) return this.each(function (j) { $(this).removeClass(value.call(this, j, getClass(this))); });
      if (!arguments.length) return this.attr('class', '');
      const classNames = classesToArray(value);
      if (classNames.length) {
        return this.each(function () {
          const curValue = getClass(this);
          let cur = this.nodeType === 1 && (' ' + stripAndCollapse(curValue) + ' ');
          if (cur) {
            for (const c of classNames) while (cur.indexOf(' ' + c + ' ') > -1) cur = cur.replace(' ' + c + ' ', ' ');
            const finalValue = stripAndCollapse(cur);
            if (curValue !== finalValue) this.setAttribute('class', finalValue);
          }
        });
      }
      return this;
    },
    toggleClass(value, stateVal) {
      const type = typeof value, isValidValue = type === 'string' || Array.isArray(value);
      if (isFn(value)) return this.each(function (i) { $(this).toggleClass(value.call(this, i, getClass(this), stateVal), stateVal); });
      if (typeof stateVal === 'boolean' && isValidValue) return stateVal ? this.addClass(value) : this.removeClass(value);
      const classNames = classesToArray(value);
      return this.each(function () {
        if (isValidValue) {
          const self = $(this);
          for (const c of classNames) { if (self.hasClass(c)) self.removeClass(c); else self.addClass(c); }
        } else if (value === undefined || type === 'boolean') {
          const className = getClass(this);
          if (className) dataPriv.set(this, '__className__', className);
          if (this.setAttribute) this.setAttribute('class', className || value === false ? '' : dataPriv.get(this, '__className__') || '');
        }
      });
    },
    hasClass(selector) {
      const className = ' ' + selector + ' ';
      for (const elem of this) if (elem.nodeType === 1 && (' ' + stripAndCollapse(getClass(elem)) + ' ').indexOf(className) > -1) return true;
      return false;
    },
    val(value) {
      let hooks, ret;
      const elem = this[0];
      if (!arguments.length) {
        if (elem) {
          hooks = $.valHooks[elem.type] || $.valHooks[elem.nodeName.toLowerCase()];
          if (hooks && 'get' in hooks && (ret = hooks.get(elem, 'value')) !== undefined) return ret;
          ret = elem.value;
          if (typeof ret === 'string') return ret.replace(/\r/g, '');
          return ret == null ? '' : ret;
        }
        return;
      }
      const valueIsFunction = isFn(value);
      return this.each(function (i) {
        if (this.nodeType !== 1) return;
        let val = valueIsFunction ? value.call(this, i, $(this).val()) : value;
        if (val == null) val = '';
        else if (typeof val === 'number') val += '';
        else if (Array.isArray(val)) val = $.map(val, v => v == null ? '' : v + '');
        hooks = $.valHooks[this.type] || $.valHooks[this.nodeName.toLowerCase()];
        if (!hooks || !('set' in hooks) || hooks.set(this, val, 'value') === undefined) this.value = val;
      });
    },
  });
  $.extend({
    valHooks: {
      option: {
        get(elem) { const val = $.find.attr(elem, 'value'); return val != null ? val : stripAndCollapse($.text(elem)); },
      },
      select: {
        get(elem) {
          const options = elem.options, index = elem.selectedIndex, one = elem.type === 'select-one';
          const values = one ? null : [], max = one ? index + 1 : options.length;
          let i = index < 0 ? max : one ? index : 0;
          for (; i < max; i++) {
            const option = options[i];
            if ((option.selected || i === index) && !option.disabled && (!option.parentNode.disabled || !nodeName(option.parentNode, 'optgroup'))) {
              const v = $(option).val();
              if (one) return v;
              values.push(v);
            }
          }
          return values;
        },
        set(elem, value) {
          let optionSet;
          const options = elem.options, values = $.makeArray(value);
          let i = options.length;
          while (i--) {
            const option = options[i];
            if ((option.selected = $.inArray($.valHooks.option.get(option), values) > -1)) optionSet = true;
          }
          if (!optionSet) elem.selectedIndex = -1;
          return values;
        },
      },
    },
  });
  for (const t of ['radio', 'checkbox']) {
    $.valHooks[t] = { set(elem, value) { if (Array.isArray(value)) return (elem.checked = $.inArray($(elem).val(), value) > -1); } };
    if (!support.checkOn) $.valHooks[t].get = elem => elem.getAttribute('value') === null ? 'on' : elem.value;
  }

  /* ============================================================
   * TRAVERSAL
   * ============================================================ */
  function winnow(elements, qualifier, not) {
    if (isFn(qualifier)) return $.grep(elements, (elem, i) => !!qualifier.call(elem, i, elem) !== not);
    if (qualifier.nodeType) return $.grep(elements, elem => (elem === qualifier) !== not);
    if (typeof qualifier !== 'string') return $.grep(elements, elem => (Array.prototype.indexOf.call(qualifier, elem) > -1) !== not);
    return $.filter(qualifier, elements, not);
  }
  $.filter = function (expr, elems, not) {
    const elem = elems[0];
    if (not) expr = ':not(' + expr + ')';
    if (elems.length === 1 && elem.nodeType === 1) return $.find.matchesSelector(elem, expr) ? [elem] : [];
    return $.find.matches(expr, $.grep(elems, e => e.nodeType === 1));
  };
  $.fn.extend({
    find(selector) {
      const len = this.length, self = this;
      if (typeof selector !== 'string') {
        return this.pushStack($(selector).filter(function () { for (let i = 0; i < len; i++) if ($.contains(self[i], this)) return true; }));
      }
      const ret = this.pushStack([]);
      for (let i = 0; i < len; i++) $.find(selector, self[i], ret);
      return len > 1 ? $.uniqueSort(ret) : ret;
    },
    filter(selector) { return this.pushStack(winnow(this, selector || [], false)); },
    not(selector) { return this.pushStack(winnow(this, selector || [], true)); },
    is(selector) { return !!winnow(this, typeof selector === 'string' && rneedsContext.test(selector) ? $(selector) : selector || [], false).length; },
    has(target) {
      const targets = $(target, this), l = targets.length;
      return this.filter(function () { for (let i = 0; i < l; i++) if ($.contains(this, targets[i])) return true; });
    },
    closest(selectors, context) {
      const matched = [], targets = typeof selectors !== 'string' && $(selectors);
      if (!rneedsContext.test(selectors)) {
        for (let i = 0, l = this.length; i < l; i++) {
          for (let cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
            if (cur.nodeType < 11 && (targets ? targets.index(cur) > -1 : cur.nodeType === 1 && $.find.matchesSelector(cur, selectors))) { matched.push(cur); break; }
          }
        }
      }
      return this.pushStack(matched.length > 1 ? $.uniqueSort(matched) : matched);
    },
    index(elem) {
      if (!elem) return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
      if (typeof elem === 'string') return Array.prototype.indexOf.call($(elem), this[0]);
      return Array.prototype.indexOf.call(this, elem instanceof KJ ? elem[0] : elem);
    },
    add(selector, context) { return this.pushStack($.uniqueSort($.merge(this.get(), $(selector, context)))); },
    addBack(selector) { return this.add(selector == null ? this.prevObject : this.prevObject.filter(selector)); },
  });
  $.fn.andSelf = $.fn.addBack;
  function dir(elem, d, until) {
    const matched = [], truncate = until !== undefined;
    while ((elem = elem[d]) && elem.nodeType !== 9) {
      if (elem.nodeType === 1) { if (truncate && $(elem).is(until)) break; matched.push(elem); }
    }
    return matched;
  }
  function siblingsOf(n, elem) { const matched = []; for (; n; n = n.nextSibling) if (n.nodeType === 1 && n !== elem) matched.push(n); return matched; }
  function sibling(cur, d) { while ((cur = cur[d]) && cur.nodeType !== 1); return cur; }
  const guaranteedUnique = { children: true, contents: true, next: true, prev: true };
  $.each({
    parent: elem => { const p = elem.parentNode; return p && p.nodeType !== 11 ? p : null; },
    parents: elem => dir(elem, 'parentNode'),
    parentsUntil: (elem, _i, until) => dir(elem, 'parentNode', until),
    next: elem => sibling(elem, 'nextSibling'),
    prev: elem => sibling(elem, 'previousSibling'),
    nextAll: elem => dir(elem, 'nextSibling'),
    prevAll: elem => dir(elem, 'previousSibling'),
    nextUntil: (elem, _i, until) => dir(elem, 'nextSibling', until),
    prevUntil: (elem, _i, until) => dir(elem, 'previousSibling', until),
    siblings: elem => siblingsOf((elem.parentNode || {}).firstChild, elem),
    children: elem => siblingsOf(elem.firstChild),
    contents: elem => {
      if (elem.contentDocument != null && Object.getPrototypeOf(elem.contentDocument)) return elem.contentDocument;
      if (nodeName(elem, 'template')) elem = elem.content || elem;
      return $.merge([], elem.childNodes);
    },
  }, (name, fn) => {
    $.fn[name] = function (until, selector) {
      let matched = $.map(this, fn, until);
      if (name.slice(-5) !== 'Until') selector = until;
      if (selector && typeof selector === 'string') matched = $.filter(selector, matched);
      if (this.length > 1) {
        if (!guaranteedUnique[name]) $.uniqueSort(matched);
        if (/^(?:parents|prev(?:Until|All))/.test(name)) matched.reverse();
      }
      return this.pushStack(matched);
    };
  });

  /* ============================================================
   * MANIPULATION
   * ============================================================ */
  const rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i, rscriptType = /^$|^module$|\/(?:java|ecma)script/i, rhtml = /<|&#?\w+;/,
    rcheckableType = /^(?:checkbox|radio)$/i, rnoInnerhtml = /<script|<style|<link/i, rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
    rcleanScript = /^\s*<!\[CDATA\[|\]\]>\s*$/g;
  const wrapMap = {
    thead: [1, '<table>', '</table>'], col: [2, '<table><colgroup>', '</colgroup></table>'],
    tr: [2, '<table><tbody>', '</tbody></table>'], td: [3, '<table><tbody><tr>', '</tr></tbody></table>'], _default: [0, '', ''],
  };
  wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
  wrapMap.th = wrapMap.td;
  if (!support.option) wrapMap.optgroup = wrapMap.option = [1, "<select multiple='multiple'>", '</select>'];
  function getAll(context, tag) {
    let ret;
    if (typeof context.getElementsByTagName !== 'undefined') ret = context.getElementsByTagName(tag || '*');
    else if (typeof context.querySelectorAll !== 'undefined') ret = context.querySelectorAll(tag || '*');
    else ret = [];
    if (tag === undefined || (tag && nodeName(context, tag))) return $.merge([context], ret);
    return ret;
  }
  function setGlobalEval(elems, refElements) {
    for (let i = 0, l = elems.length; i < l; i++) dataPriv.set(elems[i], 'globalEval', !refElements || dataPriv.get(refElements[i], 'globalEval'));
  }
  function buildFragment(elems, context, scripts, selection, ignored) {
    let elem, tmp, j;
    const fragment = context.createDocumentFragment(), nodes = [];
    for (let i = 0, l = elems.length; i < l; i++) {
      elem = elems[i];
      if (elem || elem === 0) {
        if (toType(elem) === 'object') $.merge(nodes, elem.nodeType ? [elem] : elem);
        else if (!rhtml.test(elem)) nodes.push(context.createTextNode(elem));
        else {
          tmp = tmp || fragment.appendChild(context.createElement('div'));
          const tag = (rtagName.exec(elem) || ['', ''])[1].toLowerCase();
          const wrap = wrapMap[tag] || wrapMap._default;
          tmp.innerHTML = wrap[1] + $.htmlPrefilter(elem) + wrap[2];
          j = wrap[0];
          while (j--) tmp = tmp.lastChild;
          $.merge(nodes, tmp.childNodes);
          tmp = fragment.firstChild;
          tmp.textContent = '';
        }
      }
    }
    fragment.textContent = '';
    let i = 0;
    while ((elem = nodes[i++])) {
      if (selection && $.inArray(elem, selection) > -1) { if (ignored) ignored.push(elem); continue; }
      const attached = isAttached(elem);
      tmp = getAll(fragment.appendChild(elem), 'script');
      if (attached) setGlobalEval(tmp);
      if (scripts) { j = 0; while ((elem = tmp[j++])) if (rscriptType.test(elem.type || '')) scripts.push(elem); }
    }
    return fragment;
  }
  $.parseHTML = function (data, context, keepScripts) {
    if (typeof data !== 'string') return [];
    if (typeof context === 'boolean') { keepScripts = context; context = false; }
    if (!context) {
      if (support.createHTMLDocument) {
        context = document.implementation.createHTMLDocument('');
        const base = context.createElement('base'); base.href = document.location.href; context.head.appendChild(base);
      } else context = document;
    }
    let parsed = rsingleTag.exec(data);
    const scripts = !keepScripts && [];
    if (parsed) return [context.createElement(parsed[1])];
    parsed = buildFragment([data], context, scripts);
    if (scripts && scripts.length) $(scripts).remove();
    return $.merge([], parsed.childNodes);
  };
  const parseHTMLNodes = html => $.parseHTML(html, document, true);
  $.parseXML = function (data) {
    let xml, parserErrorElem;
    if (!data || typeof data !== 'string') return null;
    try { xml = (new DOMParser()).parseFromString(data, 'text/xml'); } catch (e) { /* invalid */ }
    parserErrorElem = xml && xml.getElementsByTagName('parsererror')[0];
    if (!xml || parserErrorElem) $.error('Invalid XML: ' + (parserErrorElem ? [...parserErrorElem.childNodes].map(el => el.textContent).join('\n') : data));
    return xml;
  };

  function manipulationTarget(elem, content) {
    if (nodeName(elem, 'table') && nodeName(content.nodeType !== 11 ? content : content.firstChild, 'tr')) return $(elem).children('tbody')[0] || elem;
    return elem;
  }
  function disableScript(elem) { elem.type = (elem.getAttribute('type') !== null) + '/' + elem.type; return elem; }
  function restoreScript(elem) { if ((elem.type || '').slice(0, 5) === 'true/') elem.type = elem.type.slice(5); else elem.removeAttribute('type'); return elem; }
  function cloneCopyEvent(src, dest) {
    if (dest.nodeType !== 1) return;
    if (dataPriv.hasData(src)) {
      const events = dataPriv.get(src).events;
      if (events) {
        dataPriv.remove(dest, 'handle events');
        for (const type in events) for (let i = 0, l = events[type].length; i < l; i++) $.event.add(dest, type, events[type][i]);
      }
    }
    if (dataUser.hasData(src)) dataUser.set(dest, $.extend({}, dataUser.access(src)));
  }
  function fixInput(src, dest) {
    const n = dest.nodeName.toLowerCase();
    if (n === 'input' && rcheckableType.test(src.type)) dest.checked = src.checked;
    else if (n === 'input' || n === 'textarea') dest.defaultValue = src.defaultValue;
  }
  function domManip(collection, args, callback, ignored) {
    args = [].concat(...[...args].map(a => Array.isArray(a) && !(a instanceof KJ) ? a : [a]));
    let fragment, first, scripts, hasScripts, node, doc, i = 0;
    const l = collection.length, iNoClone = l - 1, value = args[0], valueIsFunction = isFn(value);
    if (valueIsFunction || (l > 1 && typeof value === 'string' && !support.checkClone && rchecked.test(value))) {
      return collection.each(function (index) {
        const self = collection.eq(index);
        if (valueIsFunction) args[0] = value.call(this, index, self.html());
        domManip(self, args, callback, ignored);
      });
    }
    if (l) {
      fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
      first = fragment.firstChild;
      if (fragment.childNodes.length === 1) fragment = first;
      if (first || ignored) {
        scripts = $.map(getAll(fragment, 'script'), disableScript);
        hasScripts = scripts.length;
        for (; i < l; i++) {
          node = fragment;
          if (i !== iNoClone) { node = $.clone(node, true, true); if (hasScripts) $.merge(scripts, getAll(node, 'script')); }
          callback.call(collection[i], node, i);
        }
        if (hasScripts) {
          doc = scripts[scripts.length - 1].ownerDocument;
          $.map(scripts, restoreScript);
          for (i = 0; i < hasScripts; i++) {
            node = scripts[i];
            if (rscriptType.test(node.type || '') && !dataPriv.access(node, 'globalEval') && $.contains(doc, node)) {
              if (node.src && (node.type || '').toLowerCase() !== 'module') {
                if ($._evalUrl && !node.noModule) $._evalUrl(node.src, { nonce: node.nonce || node.getAttribute('nonce') }, doc);
              } else DOMEval(node.textContent.replace(rcleanScript, ''), node, doc);
            }
          }
        }
      }
    }
    return collection;
  }
  function removeNodes(elem, selector, keepData) {
    const nodes = selector ? $.filter(selector, elem) : elem;
    for (let i = 0, node; (node = nodes[i]) != null; i++) {
      if (!keepData && node.nodeType === 1) $.cleanData(getAll(node));
      if (node.parentNode) {
        if (keepData && isAttached(node)) setGlobalEval(getAll(node, 'script'));
        node.parentNode.removeChild(node);
      }
    }
    return elem;
  }
  // Scripts inside HTML swapped in by Hyper / innerHTML don't run on their own: re-create them so they do
  function runScripts(nodes) {
    for (const n of nodes) {
      if (!isEl(n)) continue;
      const scripts = n.tagName === 'SCRIPT' ? [n] : [...n.querySelectorAll('script')];
      for (const old of scripts) {
        if (!old.isConnected || old.dataset.kjRan || !rscriptType.test(old.type || '')) continue;
        const s = document.createElement('script');
        for (const a of old.attributes) s.setAttribute(a.name, a.value);
        s.dataset.kjRan = '1';
        s.textContent = old.textContent;
        old.replaceWith(s);
      }
    }
  }
  $.extend({
    htmlPrefilter: html => html,
    clone(elem, dataAndEvents, deepDataAndEvents) {
      let srcElements, destElements;
      const clone = elem.cloneNode(true), inPage = isAttached(elem);
      if (!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !$.isXMLDoc(elem)) {
        destElements = getAll(clone); srcElements = getAll(elem);
        for (let i = 0, l = srcElements.length; i < l; i++) fixInput(srcElements[i], destElements[i]);
      }
      if (dataAndEvents) {
        if (deepDataAndEvents) {
          srcElements = srcElements || getAll(elem); destElements = destElements || getAll(clone);
          for (let i = 0, l = srcElements.length; i < l; i++) cloneCopyEvent(srcElements[i], destElements[i]);
        } else cloneCopyEvent(elem, clone);
      }
      destElements = getAll(clone, 'script');
      if (destElements.length > 0) setGlobalEval(destElements, !inPage && getAll(elem, 'script'));
      return clone;
    },
    // remove events and data — and run jsKjs cleanups (Pulse effects, Hyper polling…) first
    cleanData(elems) {
      const special = $.event.special;
      for (let i = 0, elem; (elem = elems[i]) !== undefined; i++) {
        if (!elem || !acceptData(elem)) continue;
        const data = dataPriv.map.get(elem);
        if (data) {
          if (data.cleanups) { const c = data.cleanups.splice(0); c.reverse().forEach(f => { try { f(); } catch (e) { warn('cleanup', e); } }); }
          if (data.events) for (const type in data.events) { if (special[type]) $.event.remove(elem, type); else $.removeEvent(elem, type, data.handle); }
          dataPriv.discard(elem);
        }
        if (dataUser.map.get(elem)) dataUser.discard(elem);
      }
    },
  });
  const cloneNodeDeep = (node, withEvents, deep) => $.clone(node, withEvents, deep ?? withEvents);
  $.fn.extend({
    detach(selector) { return removeNodes(this, selector, true); },
    remove(selector) { return removeNodes(this, selector); },
    text(value) {
      return access(this, function (v) {
        return v === undefined ? $.text(this) : this.empty().each(function () {
          if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) this.textContent = v;
        });
      }, null, value, arguments.length);
    },
    append(...a) { return domManip(this, a, function (elem) { if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) manipulationTarget(this, elem).appendChild(elem); }); },
    prepend(...a) { return domManip(this, a, function (elem) { if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) { const t = manipulationTarget(this, elem); t.insertBefore(elem, t.firstChild); } }); },
    before(...a) { return domManip(this, a, function (elem) { if (this.parentNode) this.parentNode.insertBefore(elem, this); }); },
    after(...a) { return domManip(this, a, function (elem) { if (this.parentNode) this.parentNode.insertBefore(elem, this.nextSibling); }); },
    empty() {
      for (let i = 0, elem; (elem = this[i]) != null; i++) if (elem.nodeType === 1) { $.cleanData(getAll(elem, false)); elem.textContent = ''; }
      return this;
    },
    clone(dataAndEvents, deepDataAndEvents) {
      dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
      deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
      return this.map(function () { return $.clone(this, dataAndEvents, deepDataAndEvents); });
    },
    html(value) {
      return access(this, function (v) {
        let elem = this[0] || {}, i = 0;
        const l = this.length;
        if (v === undefined && elem.nodeType === 1) return elem.innerHTML;
        if (typeof v === 'string' && !rnoInnerhtml.test(v) && !wrapMap[(rtagName.exec(v) || ['', ''])[1].toLowerCase()]) {
          v = $.htmlPrefilter(v);
          try {
            for (; i < l; i++) { elem = this[i] || {}; if (elem.nodeType === 1) { $.cleanData(getAll(elem, false)); elem.innerHTML = v; } }
            elem = 0;
          } catch (e) { /* fall back to append */ }
        }
        if (elem) this.empty().append(v);
      }, null, value, arguments.length);
    },
    replaceWith(...a) {
      const ignored = [];
      return domManip(this, a, function (elem) {
        const parent = this.parentNode;
        if ($.inArray(this, ignored) < 0) { $.cleanData(getAll(this)); if (parent) parent.replaceChild(elem, this); }
      }, ignored);
    },
  });
  $.each({ appendTo: 'append', prependTo: 'prepend', insertBefore: 'before', insertAfter: 'after', replaceAll: 'replaceWith' }, (name, original) => {
    $.fn[name] = function (selector) {
      const ret = [], insert = $(selector), last = insert.length - 1;
      for (let i = 0; i <= last; i++) {
        const elems = i === last ? this : this.clone(true);
        $(insert[i])[original](elems);
        Array.prototype.push.apply(ret, elems.get());
      }
      return this.pushStack(ret);
    };
  });
  $.fn.extend({
    wrapAll(html) {
      if (this[0]) {
        if (isFn(html)) html = html.call(this[0]);
        const wrap = $(html, this[0].ownerDocument).eq(0).clone(true);
        if (this[0].parentNode) wrap.insertBefore(this[0]);
        wrap.map(function () { let elem = this; while (elem.firstElementChild) elem = elem.firstElementChild; return elem; }).append(this);
      }
      return this;
    },
    wrapInner(html) {
      if (isFn(html)) return this.each(function (i) { $(this).wrapInner(html.call(this, i)); });
      return this.each(function () { const self = $(this), contents = self.contents(); if (contents.length) contents.wrapAll(html); else self.append(html); });
    },
    wrap(html) {
      const htmlIsFunction = isFn(html);
      return this.each(function (i) { $(this).wrapAll(htmlIsFunction ? html.call(this, i) : html); });
    },
    unwrap(selector) { this.parent(selector).not('body').each(function () { $(this).replaceWith(this.childNodes); }); return this; },
  });
  rootjQuery = $(document);

  /* ============================================================
   * CSS, VISIBILITY, DIMENSIONS, OFFSETS
   * ============================================================ */
  const pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
  const rcssNum = new RegExp('^(?:([+-])=|)(' + pnum + ')([a-z%]*)$', 'i');
  const rnumnonpx = new RegExp('^(' + pnum + ')(?!px)[a-z%]+$', 'i');
  const rcustomProp = /^--/;
  const cssExpand = ['Top', 'Right', 'Bottom', 'Left'];
  const rboxStyle = new RegExp(cssExpand.join('|'), 'i');
  const rtrimCSS = new RegExp('^' + whitespace + '+|((?:^|[^\\\\])(?:\\\\.)*)' + whitespace + '+$', 'g');
  const getStyles = elem => { let view = elem.ownerDocument.defaultView; if (!view || !view.opener) view = window; return view.getComputedStyle(elem); };
  function swap(elem, options, callback) {
    const old = {};
    for (const name in options) { old[name] = elem.style[name]; elem.style[name] = options[name]; }
    const ret = callback.call(elem);
    for (const name in options) elem.style[name] = old[name];
    return ret;
  }
  // support tests (evaluated lazily, like jQuery)
  (function () {
    let pixelPositionVal, boxSizingReliableVal, scrollboxSizeVal, pixelBoxStylesVal, reliableTrDimensionsVal, reliableMarginLeftVal;
    const container = document.createElement('div');
    let div = document.createElement('div');
    function computeStyleTests() {
      if (!div) return;
      container.style.cssText = 'position:absolute;left:-11111px;width:60px;margin-top:1px;padding:0;border:0';
      div.style.cssText = 'position:relative;display:block;box-sizing:border-box;overflow:scroll;margin:auto;border:1px;padding:1px;width:60%;top:1%';
      documentElement.appendChild(container).appendChild(div);
      const divStyle = window.getComputedStyle(div), round = m => Math.round(parseFloat(m));
      pixelPositionVal = divStyle.top !== '1%';
      reliableMarginLeftVal = round(divStyle.marginLeft) === 12;
      div.style.right = '60%';
      pixelBoxStylesVal = round(divStyle.right) === 36;
      boxSizingReliableVal = round(divStyle.width) === 36;
      div.style.position = 'absolute';
      scrollboxSizeVal = round(div.offsetWidth / 3) === 12;
      documentElement.removeChild(container);
      div = null;
    }
    div.style.backgroundClip = 'content-box';
    div.cloneNode(true).style.backgroundClip = '';
    support.clearCloneStyle = div.style.backgroundClip === 'content-box';
    Object.assign(support, {
      boxSizingReliable() { computeStyleTests(); return boxSizingReliableVal; },
      pixelBoxStyles() { computeStyleTests(); return pixelBoxStylesVal; },
      pixelPosition() { computeStyleTests(); return pixelPositionVal; },
      reliableMarginLeft() { computeStyleTests(); return reliableMarginLeftVal; },
      scrollboxSize() { computeStyleTests(); return scrollboxSizeVal; },
      reliableTrDimensions() {
        if (reliableTrDimensionsVal == null) {
          const table = document.createElement('table'), tr = document.createElement('tr'), trChild = document.createElement('div');
          table.style.cssText = 'position:absolute;left:-11111px;border-collapse:separate';
          tr.style.cssText = 'box-sizing:content-box;border:1px solid';
          tr.style.height = '1px'; trChild.style.height = '9px'; trChild.style.display = 'block';
          documentElement.appendChild(table).appendChild(tr).appendChild(trChild);
          const trStyle = window.getComputedStyle(tr);
          reliableTrDimensionsVal = (parseInt(trStyle.height, 10) + parseInt(trStyle.borderTopWidth, 10) + parseInt(trStyle.borderBottomWidth, 10)) === tr.offsetHeight;
          documentElement.removeChild(table);
        }
        return reliableTrDimensionsVal;
      },
    });
  })();
  function curCSS(elem, name, computed) {
    let ret;
    const isCustomProp = rcustomProp.test(name), style = elem.style;
    computed = computed || getStyles(elem);
    if (computed) {
      ret = computed.getPropertyValue(name) || computed[name];
      if (isCustomProp && ret) ret = ret.replace(rtrimCSS, '$1') || undefined;
      if (ret === '' && !isAttached(elem)) ret = $.style(elem, name);
      if (!support.pixelBoxStyles() && rnumnonpx.test(ret) && rboxStyle.test(name)) {
        const width = style.width, minWidth = style.minWidth, maxWidth = style.maxWidth;
        style.minWidth = style.maxWidth = style.width = ret;
        ret = computed.width;
        style.width = width; style.minWidth = minWidth; style.maxWidth = maxWidth;
      }
    }
    return ret !== undefined ? ret + '' : ret;
  }
  function addGetHookIf(conditionFn, hookFn) {
    return { get() { if (conditionFn()) { delete this.get; return; } return (this.get = hookFn).apply(this, arguments); } };
  }
  const emptyStyle = document.createElement('div').style, vendorProps = {};
  function finalPropName(name) {
    const final = $.cssProps[name] || vendorProps[name];
    if (final) return final;
    if (name in emptyStyle) return name;
    const cap = name[0].toUpperCase() + name.slice(1);
    for (const p of ['Webkit', 'Moz', 'ms']) if ((p + cap) in emptyStyle) return (vendorProps[name] = p + cap);
    return (vendorProps[name] = name);
  }
  function adjustCSS(elem, prop, valueParts, tween) {
    let adjusted, scale, maxIterations = 20;
    const currentValue = tween ? () => tween.cur() : () => $.css(elem, prop, '');
    let initial = currentValue(), unit = (valueParts && valueParts[3]) || ($.cssNumber[prop] ? '' : 'px'),
      initialInUnit = elem.nodeType && ($.cssNumber[prop] || (unit !== 'px' && +initial)) && rcssNum.exec($.css(elem, prop));
    if (initialInUnit && initialInUnit[3] !== unit) {
      initial = initial / 2;
      unit = unit || initialInUnit[3];
      initialInUnit = +initial || 1;
      while (maxIterations--) {
        $.style(elem, prop, initialInUnit + unit);
        if ((1 - scale) * (1 - (scale = currentValue() / initial || 0.5)) <= 0) maxIterations = 0;
        initialInUnit = initialInUnit / scale;
      }
      initialInUnit = initialInUnit * 2;
      $.style(elem, prop, initialInUnit + unit);
      valueParts = valueParts || [];
    }
    if (valueParts) {
      initialInUnit = +initialInUnit || +initial || 0;
      adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];
      if (tween) { tween.unit = unit; tween.start = initialInUnit; tween.end = adjusted; }
    }
    return adjusted;
  }
  const rdisplayswap = /^(none|table(?!-c[ea]).+)/, cssShow = { position: 'absolute', visibility: 'hidden', display: 'block' },
    cssNormalTransform = { letterSpacing: '0', fontWeight: '400' };
  function setPositiveNumber(_elem, value, subtract) {
    const matches = rcssNum.exec(value);
    return matches ? Math.max(0, matches[2] - (subtract || 0)) + (matches[3] || 'px') : value;
  }
  function boxModelAdjustment(elem, dimension, box, isBorderBox, styles, computedVal) {
    let i = dimension === 'width' ? 1 : 0, extra = 0, delta = 0, marginDelta = 0;
    if (box === (isBorderBox ? 'border' : 'content')) return 0;
    for (; i < 4; i += 2) {
      if (box === 'margin') marginDelta += $.css(elem, box + cssExpand[i], true, styles);
      if (!isBorderBox) {
        delta += $.css(elem, 'padding' + cssExpand[i], true, styles);
        if (box !== 'padding') delta += $.css(elem, 'border' + cssExpand[i] + 'Width', true, styles);
        else extra += $.css(elem, 'border' + cssExpand[i] + 'Width', true, styles);
      } else {
        if (box === 'content') delta -= $.css(elem, 'padding' + cssExpand[i], true, styles);
        if (box !== 'margin') delta -= $.css(elem, 'border' + cssExpand[i] + 'Width', true, styles);
      }
    }
    if (!isBorderBox && computedVal >= 0) {
      delta += Math.max(0, Math.ceil(elem['offset' + dimension[0].toUpperCase() + dimension.slice(1)] - computedVal - delta - extra - 0.5)) || 0;
    }
    return delta + marginDelta;
  }
  function getWidthOrHeight(elem, dimension, extra) {
    const styles = getStyles(elem), boxSizingNeeded = !support.boxSizingReliable() || extra;
    let isBorderBox = boxSizingNeeded && $.css(elem, 'boxSizing', false, styles) === 'border-box',
      valueIsBorderBox = isBorderBox, val = curCSS(elem, dimension, styles);
    const offsetProp = 'offset' + dimension[0].toUpperCase() + dimension.slice(1);
    if (rnumnonpx.test(val)) { if (!extra) return val; val = 'auto'; }
    if ((!support.boxSizingReliable() && isBorderBox || !support.reliableTrDimensions() && nodeName(elem, 'tr') || val === 'auto' ||
      (!parseFloat(val) && $.css(elem, 'display', false, styles) === 'inline')) && elem.getClientRects().length) {
      isBorderBox = $.css(elem, 'boxSizing', false, styles) === 'border-box';
      valueIsBorderBox = offsetProp in elem;
      if (valueIsBorderBox) val = elem[offsetProp];
    }
    val = parseFloat(val) || 0;
    return (val + boxModelAdjustment(elem, dimension, extra || (isBorderBox ? 'border' : 'content'), valueIsBorderBox, styles, val)) + 'px';
  }
  $.extend({
    cssHooks: { opacity: { get(elem, computed) { if (computed) { const ret = curCSS(elem, 'opacity'); return ret === '' ? '1' : ret; } } } },
    cssNumber: { animationIterationCount: true, aspectRatio: true, borderImageSlice: true, columnCount: true, flexGrow: true, flexShrink: true,
      fontWeight: true, gridArea: true, gridColumn: true, gridColumnEnd: true, gridColumnStart: true, gridRow: true, gridRowEnd: true,
      gridRowStart: true, lineHeight: true, opacity: true, order: true, orphans: true, scale: true, widows: true, zIndex: true, zoom: true,
      fillOpacity: true, floodOpacity: true, stopOpacity: true, strokeMiterlimit: true, strokeOpacity: true },
    cssProps: {},
    style(elem, name, value, extra) {
      if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) return;
      let ret, type;
      const origName = camel(name), isCustomProp = rcustomProp.test(name), style = elem.style;
      if (!isCustomProp) name = finalPropName(origName);
      const hooks = $.cssHooks[name] || $.cssHooks[origName];
      if (value !== undefined) {
        type = typeof value;
        if (type === 'string' && (ret = rcssNum.exec(value)) && ret[1]) { value = adjustCSS(elem, name, ret); type = 'number'; }
        if (value == null || value !== value) return;
        if (type === 'number' && !isCustomProp) value += (ret && ret[3]) || ($.cssNumber[origName] ? '' : 'px');
        if (!support.clearCloneStyle && value === '' && name.indexOf('background') === 0) style[name] = 'inherit';
        if (!hooks || !('set' in hooks) || (value = hooks.set(elem, value, extra)) !== undefined) {
          if (isCustomProp) style.setProperty(name, value); else style[name] = value;
        }
      } else {
        if (hooks && 'get' in hooks && (ret = hooks.get(elem, false, extra)) !== undefined) return ret;
        return isCustomProp ? style.getPropertyValue(name) : style[name];
      }
    },
    css(elem, name, extra, styles) {
      let val;
      const origName = camel(name), isCustomProp = rcustomProp.test(name);
      if (!isCustomProp) name = finalPropName(origName);
      const hooks = $.cssHooks[name] || $.cssHooks[origName];
      if (hooks && 'get' in hooks) val = hooks.get(elem, true, extra);
      if (val === undefined) val = curCSS(elem, name, styles);
      if (val === 'normal' && name in cssNormalTransform) val = cssNormalTransform[name];
      if (extra === '' || extra) { const num = parseFloat(val); return extra === true || isFinite(num) ? num || 0 : val; }
      return val;
    },
  });
  for (const dimension of ['height', 'width']) {
    $.cssHooks[dimension] = {
      get(elem, computed, extra) {
        if (computed) {
          return rdisplayswap.test($.css(elem, 'display')) && (!elem.getClientRects().length || !elem.getBoundingClientRect().width)
            ? swap(elem, cssShow, () => getWidthOrHeight(elem, dimension, extra)) : getWidthOrHeight(elem, dimension, extra);
        }
      },
      set(elem, value, extra) {
        let matches;
        const styles = getStyles(elem), scrollboxSizeBuggy = !support.scrollboxSize() && styles.position === 'absolute',
          boxSizingNeeded = scrollboxSizeBuggy || extra,
          isBorderBox = boxSizingNeeded && $.css(elem, 'boxSizing', false, styles) === 'border-box';
        let subtract = extra ? boxModelAdjustment(elem, dimension, extra, isBorderBox, styles) : 0;
        if (isBorderBox && scrollboxSizeBuggy) {
          subtract -= Math.ceil(elem['offset' + dimension[0].toUpperCase() + dimension.slice(1)] - parseFloat(styles[dimension]) - boxModelAdjustment(elem, dimension, 'border', false, styles) - 0.5);
        }
        if (subtract && (matches = rcssNum.exec(value)) && (matches[3] || 'px') !== 'px') { elem.style[dimension] = value; value = $.css(elem, dimension); }
        return setPositiveNumber(elem, value, subtract);
      },
    };
  }
  $.cssHooks.marginLeft = addGetHookIf(support.reliableMarginLeft, (elem, computed) => {
    if (computed) return (parseFloat(curCSS(elem, 'marginLeft')) || elem.getBoundingClientRect().left - swap(elem, { marginLeft: 0 }, () => elem.getBoundingClientRect().left)) + 'px';
  });
  $.each({ margin: '', padding: '', border: 'Width' }, (prefix, suffix) => {
    $.cssHooks[prefix + suffix] = {
      expand(value) {
        const expanded = {}, parts = typeof value === 'string' ? value.split(' ') : [value];
        for (let i = 0; i < 4; i++) expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
        return expanded;
      },
    };
    if (prefix !== 'margin') $.cssHooks[prefix + suffix].set = setPositiveNumber;
  });
  $.fn.extend({
    css(name, value) {
      return access(this, (elem, nm, v) => {
        if (Array.isArray(nm)) { const styles = getStyles(elem), map = {}; for (const n of nm) map[n] = $.css(elem, n, false, styles); return map; }
        return v !== undefined ? $.style(elem, nm, v) : $.css(elem, nm);
      }, name, value, arguments.length > 1);
    },
  });

  /* ---------------- show / hide ---------------- */
  const isHiddenWithinTree = (elem, el) => {
    elem = el || elem;
    return elem.style.display === 'none' || (elem.style.display === '' && isAttached(elem) && $.css(elem, 'display') === 'none');
  };
  const defaultDisplayMap = {};
  function defaultDisplay(elem) {
    const doc = elem.ownerDocument, name = elem.nodeName;
    let display = defaultDisplayMap[name];
    if (display) return display;
    const temp = doc.body.appendChild(doc.createElement(name));
    display = $.css(temp, 'display');
    temp.parentNode.removeChild(temp);
    if (display === 'none') display = 'block';
    return (defaultDisplayMap[name] = display);
  }
  function showHide(elements, show) {
    const values = [], length = elements.length;
    for (let index = 0; index < length; index++) {
      const elem = elements[index];
      if (!elem.style) continue;
      const display = elem.style.display;
      if (show) {
        if (display === 'none') { values[index] = dataPriv.get(elem, 'display') || null; if (!values[index]) elem.style.display = ''; }
        if (elem.style.display === '' && isHiddenWithinTree(elem)) values[index] = defaultDisplay(elem);
      } else if (display !== 'none') { values[index] = 'none'; dataPriv.set(elem, 'display', display); }
    }
    for (let index = 0; index < length; index++) if (values[index] != null) elements[index].style.display = values[index];
    return elements;
  }
  $.fn.extend({
    show() { return showHide(this, true); },
    hide() { return showHide(this); },
    toggle(state) {
      if (typeof state === 'boolean') return state ? this.show() : this.hide();
      return this.each(function () { if (isHiddenWithinTree(this)) $(this).show(); else $(this).hide(); });
    },
  });
  // helpers used by Hyper / Pulse
  const showEl = el => { if (isEl(el)) showHide([el], true); };
  const hideEl = el => { if (isEl(el)) showHide([el]); };
  const isHidden = el => isEl(el) && isHiddenWithinTree(el);
  const cssNumber = { has: k => !!$.cssNumber[k] };

  /* ---------------- dimensions ---------------- */
  $.each({ Height: 'height', Width: 'width' }, (name, type) => {
    $.each({ padding: 'inner' + name, content: type, '': 'outer' + name }, (defaultExtra, funcName) => {
      $.fn[funcName] = function (margin, value) {
        const chainable = arguments.length && (defaultExtra || typeof margin !== 'boolean'),
          extra = defaultExtra || (margin === true || value === true ? 'margin' : 'border');
        return access(this, (elem, t, v) => {
          if (isWindow(elem)) return funcName.indexOf('outer') === 0 ? elem['inner' + name] : elem.document.documentElement['client' + name];
          if (elem.nodeType === 9) {
            const doc = elem.documentElement;
            return Math.max(elem.body['scroll' + name], doc['scroll' + name], elem.body['offset' + name], doc['offset' + name], doc['client' + name]);
          }
          return v === undefined ? $.css(elem, t, extra) : $.style(elem, t, v, extra);
        }, type, chainable ? margin : undefined, chainable);
      };
    });
  });

  /* ---------------- offsets & scrolling ---------------- */
  $.offset = {
    setOffset(elem, options, i) {
      let curTop, curLeft;
      const position = $.css(elem, 'position'), curElem = $(elem), props = {};
      if (position === 'static') elem.style.position = 'relative';
      const curOffset = curElem.offset(), curCSSTop = $.css(elem, 'top'), curCSSLeft = $.css(elem, 'left');
      const calculatePosition = (position === 'absolute' || position === 'fixed') && (curCSSTop + curCSSLeft).indexOf('auto') > -1;
      if (calculatePosition) { const p = curElem.position(); curTop = p.top; curLeft = p.left; }
      else { curTop = parseFloat(curCSSTop) || 0; curLeft = parseFloat(curCSSLeft) || 0; }
      if (isFn(options)) options = options.call(elem, i, $.extend({}, curOffset));
      if (options.top != null) props.top = (options.top - curOffset.top) + curTop;
      if (options.left != null) props.left = (options.left - curOffset.left) + curLeft;
      if ('using' in options) options.using.call(elem, props); else curElem.css(props);
    },
  };
  $.fn.extend({
    offset(options) {
      if (arguments.length) return options === undefined ? this : this.each(function (i) { $.offset.setOffset(this, options, i); });
      const elem = this[0];
      if (!elem) return;
      if (!elem.getClientRects().length) return { top: 0, left: 0 };
      const rect = elem.getBoundingClientRect(), win = elem.ownerDocument.defaultView;
      return { top: rect.top + win.pageYOffset, left: rect.left + win.pageXOffset };
    },
    position() {
      if (!this[0]) return;
      let offsetParent, offset, parentOffset = { top: 0, left: 0 };
      const elem = this[0];
      if ($.css(elem, 'position') === 'fixed') offset = elem.getBoundingClientRect();
      else {
        offset = this.offset();
        const doc = elem.ownerDocument;
        offsetParent = elem.offsetParent || doc.documentElement;
        while (offsetParent && (offsetParent === doc.body || offsetParent === doc.documentElement) && $.css(offsetParent, 'position') === 'static') offsetParent = offsetParent.parentNode;
        if (offsetParent && offsetParent !== elem && offsetParent.nodeType === 1) {
          parentOffset = $(offsetParent).offset();
          parentOffset.top += $.css(offsetParent, 'borderTopWidth', true);
          parentOffset.left += $.css(offsetParent, 'borderLeftWidth', true);
        }
      }
      return { top: offset.top - parentOffset.top - $.css(elem, 'marginTop', true), left: offset.left - parentOffset.left - $.css(elem, 'marginLeft', true) };
    },
    offsetParent() {
      return this.map(function () {
        let op = this.offsetParent;
        while (op && $.css(op, 'position') === 'static') op = op.offsetParent;
        return op || documentElement;
      });
    },
  });
  $.each({ scrollLeft: 'pageXOffset', scrollTop: 'pageYOffset' }, (method, prop) => {
    const top = prop === 'pageYOffset';
    $.fn[method] = function (val) {
      return access(this, (elem, m, v) => {
        let win;
        if (isWindow(elem)) win = elem; else if (elem.nodeType === 9) win = elem.defaultView;
        if (v === undefined) return win ? win[prop] : elem[m];
        if (win) win.scrollTo(!top ? v : win.pageXOffset, top ? v : win.pageYOffset); else elem[m] = v;
      }, method, val, arguments.length);
    };
  });
  for (const prop of ['top', 'left']) {
    $.cssHooks[prop] = addGetHookIf(support.pixelPosition, (elem, computed) => {
      if (computed) { computed = curCSS(elem, prop); return rnumnonpx.test(computed) ? $(elem).position()[prop] + 'px' : computed; }
    });
  }

  /* ============================================================
   * EVENTS — jQuery's event system: one native listener per element and
   * type, namespaces, delegation, special events, jQuery.Event objects.
   * ============================================================ */
  const rtypenamespace = /^([^.]*)(?:\.(.+)|)/;
  const returnTrue = () => true, returnFalse = () => false;
  function on(elem, types, selector, data, fn, one) {
    if (typeof types === 'object') {
      if (typeof selector !== 'string') { data = data || selector; selector = undefined; }
      for (const type in types) on(elem, type, selector, data, types[type], one);
      return elem;
    }
    if (data == null && fn == null) { fn = selector; data = selector = undefined; }
    else if (fn == null) {
      if (typeof selector === 'string') { fn = data; data = undefined; }
      else { fn = data; data = selector; selector = undefined; }
    }
    if (fn === false) fn = returnFalse;
    else if (!fn) return elem;
    if (one === 1) {
      const origFn = fn;
      fn = function (event) { $().off(event); return origFn.apply(this, arguments); };
      fn.guid = origFn.guid || (origFn.guid = $.guid++);
    }
    return elem.each(function () { $.event.add(this, types, fn, data, selector); });
  }

  $.event = {
    global: {},
    add(elem, types, handler, data, selector) {
      let handleObjIn, eventHandle, events, handlers;
      const elemData = dataPriv.get(elem);
      if (!acceptData(elem)) return;
      if (handler.handler) { handleObjIn = handler; handler = handleObjIn.handler; selector = handleObjIn.selector; }
      if (selector) $.find.matchesSelector(documentElement, selector);        // throw early on invalid selectors
      if (!handler.guid) handler.guid = $.guid++;
      if (!(events = elemData.events)) events = elemData.events = Object.create(null);
      if (!(eventHandle = elemData.handle)) {
        eventHandle = elemData.handle = function (e) {
          return $.event.triggered !== e.type ? $.event.dispatch.apply(elem, arguments) : undefined;
        };
      }
      types = (types || '').match(rnothtmlwhite) || [''];
      let t = types.length;
      while (t--) {
        const tmp = rtypenamespace.exec(types[t]) || [];
        let type = tmp[1];
        const origType = type, namespaces = (tmp[2] || '').split('.').sort();
        if (!type) continue;
        let special = $.event.special[type] || {};
        type = (selector ? special.delegateType : special.bindType) || type;
        special = $.event.special[type] || {};
        const handleObj = $.extend({
          type, origType, data, handler, guid: handler.guid, selector,
          needsContext: selector && $.expr.match.needsContext.test(selector), namespace: namespaces.join('.'),
        }, handleObjIn);
        if (!(handlers = events[type])) {
          handlers = events[type] = [];
          handlers.delegateCount = 0;
          if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
            if (elem.addEventListener) elem.addEventListener(type, eventHandle);
          }
        }
        if (special.add) { special.add.call(elem, handleObj); if (!handleObj.handler.guid) handleObj.handler.guid = handler.guid; }
        if (selector) handlers.splice(handlers.delegateCount++, 0, handleObj); else handlers.push(handleObj);
        $.event.global[type] = true;
      }
    },
    remove(elem, types, handler, selector, mappedTypes) {
      let events;
      const elemData = dataPriv.hasData(elem) && dataPriv.get(elem);
      if (!elemData || !(events = elemData.events)) return;
      types = (types || '').match(rnothtmlwhite) || [''];
      let t = types.length;
      while (t--) {
        let tmp = rtypenamespace.exec(types[t]) || [];
        let type = tmp[1];
        const origType = type, namespaces = (tmp[2] || '').split('.').sort();
        if (!type) { for (type in events) $.event.remove(elem, type + types[t], handler, selector, true); continue; }
        const special = $.event.special[type] || {};
        type = (selector ? special.delegateType : special.bindType) || type;
        const handlers = events[type] || [];
        tmp = tmp[2] && new RegExp('(^|\\.)' + namespaces.join('\\.(?:.*\\.|)') + '(\\.|$)');
        const origCount = handlers.length;
        let j = origCount;
        while (j--) {
          const handleObj = handlers[j];
          if ((mappedTypes || origType === handleObj.origType) && (!handler || handler.guid === handleObj.guid) &&
            (!tmp || tmp.test(handleObj.namespace)) && (!selector || selector === handleObj.selector || (selector === '**' && handleObj.selector))) {
            handlers.splice(j, 1);
            if (handleObj.selector) handlers.delegateCount--;
            if (special.remove) special.remove.call(elem, handleObj);
          }
        }
        if (origCount && !handlers.length) {
          if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) $.removeEvent(elem, type, elemData.handle);
          delete events[type];
        }
      }
      if ($.isEmptyObject(events)) dataPriv.remove(elem, 'handle events');
    },
    dispatch(nativeEvent) {
      let matched, handleObj, ret;
      const args = new Array(arguments.length), event = $.event.fix(nativeEvent);
      const handlers = (dataPriv.get(this, 'events') || Object.create(null))[event.type] || [];
      const special = $.event.special[event.type] || {};
      args[0] = event;
      for (let i = 1; i < arguments.length; i++) args[i] = arguments[i];
      // jsKjs: a native CustomEvent's detail arrives as the handler's second argument (e.g. Hyper's kj:* events)
      if (args.length === 1 && !event.isTrigger && event.originalEvent && event.originalEvent.detail != null && typeof event.originalEvent.detail === 'object'
        && event.originalEvent instanceof CustomEvent) args.push(event.originalEvent.detail);
      event.delegateTarget = this;
      if (special.preDispatch && special.preDispatch.call(this, event) === false) return;
      const handlerQueue = $.event.handlers.call(this, event, handlers);
      let i = 0;
      while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
        event.currentTarget = matched.elem;
        let j = 0;
        while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
          if (!event.rnamespace || handleObj.namespace === false || event.rnamespace.test(handleObj.namespace)) {
            event.handleObj = handleObj;
            event.data = handleObj.data;
            ret = (($.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(matched.elem, args);
            if (ret !== undefined) {
              if ((event.result = ret) === false) { event.preventDefault(); event.stopPropagation(); }
            }
          }
        }
      }
      if (special.postDispatch) special.postDispatch.call(this, event);
      return event.result;
    },
    handlers(event, handlers) {
      const handlerQueue = [], delegateCount = handlers.delegateCount;
      let cur = event.target;
      if (delegateCount && cur.nodeType && !(event.type === 'click' && event.button >= 1)) {
        for (; cur !== this; cur = cur.parentNode || this) {
          if (cur.nodeType === 1 && !(event.type === 'click' && cur.disabled === true)) {
            const matchedHandlers = [], matchedSelectors = {};
            for (let i = 0; i < delegateCount; i++) {
              const handleObj = handlers[i], sel = handleObj.selector + ' ';
              if (matchedSelectors[sel] === undefined) {
                matchedSelectors[sel] = handleObj.needsContext ? $(sel, this).index(cur) > -1 : $.find(sel, this, null, [cur]).length;
              }
              if (matchedSelectors[sel]) matchedHandlers.push(handleObj);
            }
            if (matchedHandlers.length) handlerQueue.push({ elem: cur, handlers: matchedHandlers });
          }
        }
      }
      cur = this;
      if (delegateCount < handlers.length) handlerQueue.push({ elem: cur, handlers: handlers.slice(delegateCount) });
      return handlerQueue;
    },
    addProp(name, hook) {
      Object.defineProperty($.Event.prototype, name, {
        enumerable: true, configurable: true,
        get: isFn(hook) ? function () { if (this.originalEvent) return hook(this.originalEvent); } : function () { if (this.originalEvent) return this.originalEvent[name]; },
        set(value) { Object.defineProperty(this, name, { enumerable: true, configurable: true, writable: true, value }); },
      });
    },
    fix: originalEvent => originalEvent[$.expando] ? originalEvent : new $.Event(originalEvent),
    special: {
      load: { noBubble: true },
      click: {
        setup(data) { const el = this || data; if (rcheckableType.test(el.type) && el.click && nodeName(el, 'input')) leverageNative(el, 'click', true); return false; },
        trigger(data) { const el = this || data; if (rcheckableType.test(el.type) && el.click && nodeName(el, 'input')) leverageNative(el, 'click'); return true; },
        _default(event) {
          const target = event.target;
          return (rcheckableType.test(target.type) && target.click && nodeName(target, 'input') && dataPriv.get(target, 'click')) || nodeName(target, 'a');
        },
      },
      beforeunload: { postDispatch(event) { if (event.result !== undefined && event.originalEvent) event.originalEvent.returnValue = event.result; } },
    },
  };
  // Run native focus/blur/click (so state changes) while jQuery handlers see the triggered event's data
  function leverageNative(el, type, isSetup) {
    if (!isSetup) { if (dataPriv.get(el, type) === undefined) $.event.add(el, type, returnTrue); return; }
    dataPriv.set(el, type, false);
    $.event.add(el, type, {
      namespace: false,
      handler(event) {
        let result, saved = dataPriv.get(this, type);
        if ((event.isTrigger & 1) && this[type]) {
          if (!saved) {
            saved = Array.prototype.slice.call(arguments);
            dataPriv.set(this, type, saved);
            this[type]();
            result = dataPriv.get(this, type);
            dataPriv.set(this, type, false);
            if (saved !== result) { event.stopImmediatePropagation(); event.preventDefault(); return result; }
          } else if (($.event.special[type] || {}).delegateType) event.stopPropagation();
        } else if (saved) {
          dataPriv.set(this, type, $.event.trigger(saved[0], saved.slice(1), this));
          event.stopPropagation();
          event.isImmediatePropagationStopped = returnTrue;
        }
      },
    });
  }
  $.removeEvent = (elem, type, handle) => { if (elem.removeEventListener) elem.removeEventListener(type, handle); };

  $.Event = function (src, props) {
    if (!(this instanceof $.Event)) return new $.Event(src, props);
    if (src && src.type) {
      this.originalEvent = src;
      this.type = src.type;
      this.isDefaultPrevented = src.defaultPrevented || (src.defaultPrevented === undefined && src.returnValue === false) ? returnTrue : returnFalse;
      this.target = (src.target && src.target.nodeType === 3) ? src.target.parentNode : src.target;
      this.currentTarget = src.currentTarget;
      this.relatedTarget = src.relatedTarget;
    } else this.type = src;
    if (props) $.extend(this, props);
    this.timeStamp = (src && src.timeStamp) || Date.now();
    this[$.expando] = true;
  };
  $.Event.prototype = {
    constructor: $.Event,
    isDefaultPrevented: returnFalse, isPropagationStopped: returnFalse, isImmediatePropagationStopped: returnFalse, isSimulated: false,
    preventDefault() { const e = this.originalEvent; this.isDefaultPrevented = returnTrue; if (e && !this.isSimulated) e.preventDefault(); },
    stopPropagation() { const e = this.originalEvent; this.isPropagationStopped = returnTrue; if (e && !this.isSimulated) e.stopPropagation(); },
    stopImmediatePropagation() { const e = this.originalEvent; this.isImmediatePropagationStopped = returnTrue; if (e && !this.isSimulated) e.stopImmediatePropagation(); this.stopPropagation(); },
  };
  ['altKey', 'bubbles', 'cancelable', 'changedTouches', 'ctrlKey', 'detail', 'eventPhase', 'metaKey', 'pageX', 'pageY', 'shiftKey', 'view', 'char',
    'code', 'charCode', 'key', 'keyCode', 'button', 'buttons', 'clientX', 'clientY', 'offsetX', 'offsetY', 'pointerId', 'pointerType',
    'screenX', 'screenY', 'targetTouches', 'toElement', 'touches', 'which', 'deltaX', 'deltaY', 'deltaMode', 'dataTransfer', 'state', 'data']
    .forEach(n => $.event.addProp(n, true));

  // focus/blur: delegate through focusin/focusout; focusin/out are simulated from capturing focus/blur
  $.each({ focus: 'focusin', blur: 'focusout' }, (type, delegateType) => {
    function focusMappedHandler(nativeEvent) { $.event.simulate(delegateType, nativeEvent.target, $.event.fix(nativeEvent)); }
    $.event.special[type] = {
      setup() { leverageNative(this, type, true); return false; },
      trigger() { leverageNative(this, type); return true; },
      teardown() { return false; },
      _default(event) { return dataPriv.get(event.target, type); },
      delegateType,
    };
    $.event.special[delegateType] = {
      setup() {
        const doc = this.ownerDocument || this.document || this, attaches = dataPriv.get(doc, delegateType);
        if (!attaches) doc.addEventListener(type, focusMappedHandler, true);
        dataPriv.set(doc, delegateType, (attaches || 0) + 1);
      },
      teardown() {
        const doc = this.ownerDocument || this.document || this, attaches = dataPriv.get(doc, delegateType) - 1;
        if (!attaches) { doc.removeEventListener(type, focusMappedHandler, true); dataPriv.remove(doc, delegateType); }
        else dataPriv.set(doc, delegateType, attaches);
      },
    };
  });
  $.each({ mouseenter: 'mouseover', mouseleave: 'mouseout', pointerenter: 'pointerover', pointerleave: 'pointerout' }, (orig, fix) => {
    $.event.special[orig] = {
      delegateType: fix, bindType: fix,
      handle(event) {
        let ret;
        const target = this, related = event.relatedTarget, handleObj = event.handleObj;
        if (!related || (related !== target && !$.contains(target, related))) {
          event.type = handleObj.origType;
          ret = handleObj.handler.apply(this, arguments);
          event.type = fix;
        }
        return ret;
      },
    };
  });

  /* ---------------- trigger ---------------- */
  const rfocusMorph = /^(?:focusinfocus|focusoutblur)$/, stopPropagationCallback = e => e.stopPropagation();
  $.extend($.event, {
    trigger(event, data, elem, onlyHandlers) {
      let i, cur, tmp, bubbleType, ontype, handle, lastElement;
      const eventPath = [elem || document];
      let type = Object.prototype.hasOwnProperty.call(event, 'type') ? event.type : event;
      let namespaces = Object.prototype.hasOwnProperty.call(event, 'namespace') ? event.namespace.split('.') : [];
      cur = lastElement = tmp = elem = elem || document;
      if (elem.nodeType === 3 || elem.nodeType === 8) return;
      if (rfocusMorph.test(type + $.event.triggered)) return;
      if (type.indexOf('.') > -1) { namespaces = type.split('.'); type = namespaces.shift(); namespaces.sort(); }
      ontype = type.indexOf(':') < 0 && 'on' + type;
      event = event[$.expando] ? event : new $.Event(type, typeof event === 'object' && event);
      event.isTrigger = onlyHandlers ? 2 : 3;
      event.namespace = namespaces.join('.');
      event.rnamespace = event.namespace ? new RegExp('(^|\\.)' + namespaces.join('\\.(?:.*\\.|)') + '(\\.|$)') : null;
      event.result = undefined;
      if (!event.target) event.target = elem;
      data = data == null ? [event] : $.makeArray(data, [event]);
      const special = $.event.special[type] || {};
      if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) return;
      if (!onlyHandlers && !special.noBubble && !isWindow(elem)) {
        bubbleType = special.delegateType || type;
        if (!rfocusMorph.test(bubbleType + type)) cur = cur.parentNode;
        for (; cur; cur = cur.parentNode) { eventPath.push(cur); tmp = cur; }
        if (tmp === (elem.ownerDocument || document)) eventPath.push(tmp.defaultView || tmp.parentWindow || window);
      }
      i = 0;
      while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {
        lastElement = cur;
        event.type = i > 1 ? bubbleType : special.bindType || type;
        handle = (dataPriv.get(cur, 'events') || Object.create(null))[event.type] && dataPriv.get(cur, 'handle');
        if (handle) handle.apply(cur, data);
        handle = ontype && cur[ontype];
        if (handle && handle.apply && acceptData(cur)) {
          event.result = handle.apply(cur, data);
          if (event.result === false) event.preventDefault();
        }
      }
      event.type = type;
      if (!onlyHandlers && !event.isDefaultPrevented()) {
        if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && acceptData(elem)) {
          if (ontype && isFn(elem[type]) && !isWindow(elem)) {
            tmp = elem[ontype];
            if (tmp) elem[ontype] = null;
            $.event.triggered = type;
            if (event.isPropagationStopped()) lastElement.addEventListener(type, stopPropagationCallback);
            elem[type]();
            if (event.isPropagationStopped()) lastElement.removeEventListener(type, stopPropagationCallback);
            $.event.triggered = undefined;
            if (tmp) elem[ontype] = tmp;
          }
        }
      }
      return event.result;
    },
    simulate(type, elem, event) {
      const e = $.extend(new $.Event(), event, { type, isSimulated: true });
      $.event.trigger(e, null, elem);
    },
  });
  $.fn.extend({
    on(types, selector, data, fn) { return on(this, types, selector, data, fn); },
    one(types, selector, data, fn) { return on(this, types, selector, data, fn, 1); },
    off(types, selector, fn) {
      if (types && types.preventDefault && types.handleObj) {
        const handleObj = types.handleObj;
        $(types.delegateTarget).off(handleObj.namespace ? handleObj.origType + '.' + handleObj.namespace : handleObj.origType, handleObj.selector, handleObj.handler);
        return this;
      }
      if (typeof types === 'object') { for (const type in types) this.off(type, selector, types[type]); return this; }
      if (selector === false || typeof selector === 'function') { fn = selector; selector = undefined; }
      if (fn === false) fn = returnFalse;
      return this.each(function () { $.event.remove(this, types, fn, selector); });
    },
    trigger(type, data) { return this.each(function () { $.event.trigger(type, data, this); }); },
    triggerHandler(type, data) { const elem = this[0]; if (elem) return $.event.trigger(type, data, elem, true); },
    bind(types, data, fn) { return this.on(types, null, data, fn); },
    unbind(types, fn) { return this.off(types, null, fn); },
    delegate(selector, types, data, fn) { return this.on(types, selector, data, fn); },
    undelegate(selector, types, fn) { return arguments.length === 1 ? this.off(selector, '**') : this.off(types, selector || '**', fn); },
    hover(fnOver, fnOut) { return this.on('mouseenter', fnOver).on('mouseleave', fnOut || fnOver); },
  });
  ('blur focus focusin focusout resize scroll click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
    'change select submit keydown keypress keyup contextmenu').split(' ').forEach(name => {
    $.fn[name] = function (data, fn) { return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name); };
  });

  // Native CustomEvent dispatch (reaches addEventListener listeners *and* jQuery handlers). Returns the event.
  function triggerOn(el, name, detail, bubbles = true) {
    const ev = new CustomEvent(name, { bubbles, cancelable: true, composed: true, detail });
    (el && el.dispatchEvent ? el : document).dispatchEvent(ev);
    return ev;
  }

  /* ============================================================
   * CALLBACKS, DEFERRED, WHEN — jQuery 3 semantics (Promises/A+ .then,
   * synchronous .done/.fail/.progress, .pipe, notify, resolveWith…)
   * ============================================================ */
  function flagsOf(o) {
    if (isStr(o)) { const r = {}; o.split(/\s+/).filter(Boolean).forEach(f => { r[f] = true; }); return r; }
    return Object.assign({}, o);
  }
  $.Callbacks = function (options) {
    options = flagsOf(options);
    let firing = false, memory, fired = false, locked, list = [], queue = [], firingIndex = -1;
    const fire = () => {
      locked = locked || options.once;
      fired = firing = true;
      for (; queue.length; firingIndex = -1) {
        memory = queue.shift();
        while (++firingIndex < list.length) {
          if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) { firingIndex = list.length; memory = false; }
        }
      }
      if (!options.memory) memory = false;
      firing = false;
      if (locked) list = memory ? [] : '';
    };
    const self = {
      add(...args) {
        if (list) {
          if (memory && !firing) { firingIndex = list.length - 1; queue.push(memory); }
          (function add(a) {
            for (const arg of a) {
              if (isFn(arg)) { if (!options.unique || !self.has(arg)) list.push(arg); }
              else if (arg && arg.length && !isStr(arg)) add(Array.from(arg));
            }
          })(args);
          if (memory && !firing) fire();
        }
        return this;
      },
      remove(...args) {
        for (const arg of args) {
          let i = 0;
          while ((i = list.indexOf(arg, i)) > -1) { list.splice(i, 1); if (i <= firingIndex) firingIndex--; }
        }
        return this;
      },
      has(fn) { return fn ? list.indexOf(fn) > -1 : list.length > 0; },
      empty() { if (list) list = []; return this; },
      disable() { locked = queue = []; list = memory = ''; return this; },
      disabled() { return !list; },
      lock() { locked = queue = []; if (!memory && !firing) list = memory = ''; return this; },
      locked() { return !!locked; },
      fireWith(context, args) {
        if (!locked) {
          args = args || [];
          queue.push([context, args.slice ? args.slice() : args]);
          if (!firing) fire();
        }
        return this;
      },
      fire(...a) { self.fireWith(this, a); return this; },
      fired() { return !!fired; },
    };
    return self;
  };

  const Identity = v => v, Thrower = e => { throw e; };
  function adoptValue(value, resolve, reject, noValue) {
    let method;
    try {
      if (value && isFn(method = value.promise)) method.call(value).done(resolve).fail(reject);
      else if (value && isFn(method = value.then)) method.call(value, resolve, reject);
      else resolve.apply(undefined, [value].slice(noValue));
    } catch (e) { reject.apply(undefined, [e]); }
  }

  $.Deferred = function (func) {
    const tuples = [
      ['notify', 'progress', $.Callbacks('memory'), $.Callbacks('memory'), 2],
      ['resolve', 'done', $.Callbacks('once memory'), $.Callbacks('once memory'), 0, 'resolved'],
      ['reject', 'fail', $.Callbacks('once memory'), $.Callbacks('once memory'), 1, 'rejected'],
    ];
    let state = 'pending';
    const deferred = {};
    const promise = {
      state: () => state,
      always(...a) { deferred.done(...a).fail(...a); return this; },
      catch(fn) { return promise.then(null, fn); },
      // deprecated in jQuery 3, still widely used: synchronous filters
      pipe(...fns) {
        return $.Deferred(newDefer => {
          tuples.forEach(tuple => {
            const fn = isFn(fns[tuple[4]]) && fns[tuple[4]];
            deferred[tuple[1]](function (...args) {
              const returned = fn && fn.apply(this, args);
              if (returned && isFn(returned.promise)) returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
              else newDefer[tuple[0] + 'With'](this, fn ? [returned] : args);
            });
          });
          fns = null;
        }).promise();
      },
      then(onFulfilled, onRejected, onProgress) {
        let maxDepth = 0;
        function resolve(depth, defer, handler, special) {
          return function (...args) {
            let that = this;
            const mightThrow = function () {
              if (depth < maxDepth) return;
              const returned = handler.apply(that, args);
              if (returned === defer.promise()) throw new TypeError('Thenable self-resolution');
              const then = returned && (typeof returned === 'object' || typeof returned === 'function') && returned.then;
              if (isFn(then)) {
                if (special) then.call(returned, resolve(maxDepth, defer, Identity, special), resolve(maxDepth, defer, Thrower, special));
                else {
                  maxDepth++;
                  then.call(returned, resolve(maxDepth, defer, Identity, special), resolve(maxDepth, defer, Thrower, special),
                    resolve(maxDepth, defer, Identity, defer.notifyWith));
                }
              } else {
                if (handler !== Identity) { that = undefined; args = [returned]; }
                (special || defer.resolveWith)(that, args);
              }
            };
            const process = special ? mightThrow : function () {
              try { mightThrow(); } catch (e) {
                if ($.Deferred.exceptionHook) $.Deferred.exceptionHook(e, process.error);
                if (depth + 1 >= maxDepth) {
                  if (handler !== Thrower) { that = undefined; args = [e]; }
                  defer.rejectWith(that, args);
                }
              }
            };
            if (depth) process();
            else {
              if ($.Deferred.getErrorHook) process.error = $.Deferred.getErrorHook();
              else if ($.Deferred.getStackHook) process.error = $.Deferred.getStackHook();
              window.setTimeout(process);
            }
          };
        }
        return $.Deferred(newDefer => {
          tuples[0][3].add(resolve(0, newDefer, isFn(onProgress) ? onProgress : Identity, newDefer.notifyWith));
          tuples[1][3].add(resolve(0, newDefer, isFn(onFulfilled) ? onFulfilled : Identity));
          tuples[2][3].add(resolve(0, newDefer, isFn(onRejected) ? onRejected : Thrower));
        }).promise();
      },
      promise(obj) { return obj != null ? Object.assign(obj, promise) : promise; },
    };
    tuples.forEach((tuple, i) => {
      const list = tuple[2], stateString = tuple[5];
      promise[tuple[1]] = list.add;
      if (stateString) {
        list.add(() => { state = stateString; }, tuples[3 - i][2].disable, tuples[3 - i][3].disable, tuples[0][2].lock, tuples[0][3].lock);
      }
      list.add(tuple[3].fire);
      deferred[tuple[0]] = function (...a) { deferred[tuple[0] + 'With'](this === deferred ? undefined : this, a); return this; };
      deferred[tuple[0] + 'With'] = list.fireWith;
    });
    promise.promise(deferred);
    if (func) func.call(deferred, deferred);
    return deferred;
  };
  const rErrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
  $.Deferred.exceptionHook = (error, asyncError) => {
    if (window.console && console.warn && error && rErrorNames.test(error.name)) console.warn('jsKjs.Deferred exception: ' + error.message, error.stack, asyncError);
  };

  $.when = function (singleValue) {
    let remaining = arguments.length, i = remaining;
    const resolveContexts = Array(i), resolveValues = Array.prototype.slice.call(arguments);
    const primary = $.Deferred();
    const updateFunc = idx => function (...value) {
      resolveContexts[idx] = this;
      resolveValues[idx] = value.length > 1 ? value : value[0];
      if (!(--remaining)) primary.resolveWith(resolveContexts, resolveValues);
    };
    if (remaining <= 1) {
      adoptValue(singleValue, primary.done(updateFunc(i)).resolve, primary.reject, !remaining);
      if (primary.state() === 'pending' || isFn(resolveValues[i] && resolveValues[i].then)) return primary.then();
    }
    while (i--) adoptValue(resolveValues[i], updateFunc(i), primary.reject);
    return primary.promise();
  };

  /* ---------------- READY (needs Deferred) ---------------- */
  readyList = $.Deferred();
  pendingReady.splice(0).forEach(fn => ready(fn));
  $.ready.then = readyList.then;
  {
    const completed = () => {
      document.removeEventListener('DOMContentLoaded', completed);
      window.removeEventListener('load', completed);
      $.ready();
    };
    if (document.readyState === 'complete' || (document.readyState !== 'loading' && !documentElement.doScroll)) window.setTimeout($.ready);
    else { document.addEventListener('DOMContentLoaded', completed); window.addEventListener('load', completed); }
  }

  /* ============================================================
   * QUEUES
   * ============================================================ */
  $.extend({
    queue(elem, type, data) {
      if (elem) {
        type = (type || 'fx') + 'queue';
        let queue = dataPriv.get(elem, type);
        if (data) {
          if (!queue || Array.isArray(data)) queue = dataPriv.access(elem, type, $.makeArray(data));
          else queue.push(data);
        }
        return queue || [];
      }
    },
    dequeue(elem, type) {
      type = type || 'fx';
      const queue = $.queue(elem, type), hooks = $._queueHooks(elem, type), next = () => $.dequeue(elem, type);
      let startLength = queue.length, fn = queue.shift();
      if (fn === 'inprogress') { fn = queue.shift(); startLength--; }
      if (fn) {
        if (type === 'fx') queue.unshift('inprogress');
        delete hooks.stop;
        fn.call(elem, next, hooks);
      }
      if (!startLength && hooks) hooks.empty.fire();
    },
    _queueHooks(elem, type) {
      const key = type + 'queueHooks';
      return dataPriv.get(elem, key) || dataPriv.access(elem, key, {
        empty: $.Callbacks('once memory').add(() => { dataPriv.remove(elem, [type + 'queue', key]); }),
      });
    },
  });
  $.fn.extend({
    queue(type, data) {
      let setter = 2;
      if (typeof type !== 'string') { data = type; type = 'fx'; setter--; }
      if (arguments.length < setter) return $.queue(this[0], type);
      return data === undefined ? this : this.each(function () {
        const queue = $.queue(this, type, data);
        $._queueHooks(this, type);
        if (type === 'fx' && queue[0] !== 'inprogress') $.dequeue(this, type);
      });
    },
    dequeue(type) { return this.each(function () { $.dequeue(this, type); }); },
    clearQueue(type) { return this.queue(type || 'fx', []); },
    promise(type, obj) {
      let count = 1;
      const defer = $.Deferred(), elements = this;
      const resolve = () => { if (!(--count)) defer.resolveWith(elements, [elements]); };
      if (typeof type !== 'string') { obj = type; type = undefined; }
      type = type || 'fx';
      for (let i = this.length; i--;) {
        const tmp = dataPriv.get(elements[i], type + 'queueHooks');
        if (tmp && tmp.empty) { count++; tmp.empty.add(resolve); }
      }
      resolve();
      return defer.promise(obj);
    },
    delay(time, type) {
      time = $.fx ? $.fx.speeds[time] || time : time;
      type = type || 'fx';
      return this.queue(type, function (next, hooks) {
        const timeout = window.setTimeout(next, time);
        hooks.stop = () => window.clearTimeout(timeout);
      });
    },
  });

  /* ============================================================
   * EFFECTS — jQuery's .animate() engine (Tween, Animation, timers),
   * so step/progress callbacks, hooks and the fx queue behave exactly as before.
   * Easing names also accept GSAP-style eases ("power2.out", "back.inOut(2)")
   * and CSS ones ("ease-in-out", "cubic-bezier(…)", "steps(4)").
   * ============================================================ */
  let fxNow, inProgress;
  const rfxtypes = /^(?:toggle|show|hide)$/, rrun = /queueHooks$/;
  function schedule() {
    if (inProgress) {
      if (document.hidden === false && window.requestAnimationFrame) window.requestAnimationFrame(schedule);
      else window.setTimeout(schedule, $.fx.interval);
      $.fx.tick();
    }
  }
  function createFxNow() { window.setTimeout(() => { fxNow = undefined; }); return (fxNow = Date.now()); }
  function genFx(type, includeWidth) {
    const attrs = { height: type };
    includeWidth = includeWidth ? 1 : 0;
    for (let i = 0; i < 4; i += 2 - includeWidth) { const which = cssExpand[i]; attrs['margin' + which] = attrs['padding' + which] = type; }
    if (includeWidth) attrs.opacity = attrs.width = type;
    return attrs;
  }
  function createTween(value, prop, animation) {
    const collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners['*']);
    for (const t of collection) { const tween = t.call(animation, prop, value); if (tween) return tween; }
  }
  function defaultPrefilter(elem, props, opts) {
    let prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display;
    const isBox = 'width' in props || 'height' in props, anim = this, orig = {}, style = elem.style;
    let hidden = elem.nodeType && isHiddenWithinTree(elem), dataShow = dataPriv.get(elem, 'fxshow');
    if (!opts.queue) {
      hooks = $._queueHooks(elem, 'fx');
      if (hooks.unqueued == null) {
        hooks.unqueued = 0;
        oldfire = hooks.empty.fire;
        hooks.empty.fire = () => { if (!hooks.unqueued) oldfire(); };
      }
      hooks.unqueued++;
      anim.always(() => { anim.always(() => { hooks.unqueued--; if (!$.queue(elem, 'fx').length) hooks.empty.fire(); }); });
    }
    for (prop in props) {
      value = props[prop];
      if (rfxtypes.test(value)) {
        delete props[prop];
        toggle = toggle || value === 'toggle';
        if (value === (hidden ? 'hide' : 'show')) {
          if (value === 'show' && dataShow && dataShow[prop] !== undefined) hidden = true;
          else continue;
        }
        orig[prop] = (dataShow && dataShow[prop]) || $.style(elem, prop);
      }
    }
    propTween = !$.isEmptyObject(props);
    if (!propTween && $.isEmptyObject(orig)) return;
    if (isBox && elem.nodeType === 1) {
      opts.overflow = [style.overflow, style.overflowX, style.overflowY];
      restoreDisplay = dataShow && dataShow.display;
      if (restoreDisplay == null) restoreDisplay = dataPriv.get(elem, 'display');
      display = $.css(elem, 'display');
      if (display === 'none') {
        if (restoreDisplay) display = restoreDisplay;
        else { showHide([elem], true); restoreDisplay = elem.style.display || restoreDisplay; display = $.css(elem, 'display'); showHide([elem]); }
      }
      if (display === 'inline' || (display === 'inline-block' && restoreDisplay != null)) {
        if ($.css(elem, 'float') === 'none') {
          if (!propTween) {
            anim.done(() => { style.display = restoreDisplay; });
            if (restoreDisplay == null) { display = style.display; restoreDisplay = display === 'none' ? '' : display; }
          }
          style.display = 'inline-block';
        }
      }
    }
    if (opts.overflow) {
      style.overflow = 'hidden';
      anim.always(() => { style.overflow = opts.overflow[0]; style.overflowX = opts.overflow[1]; style.overflowY = opts.overflow[2]; });
    }
    propTween = false;
    for (prop in orig) {
      if (!propTween) {
        if (dataShow) { if ('hidden' in dataShow) hidden = dataShow.hidden; }
        else dataShow = dataPriv.access(elem, 'fxshow', { display: restoreDisplay });
        if (toggle) dataShow.hidden = !hidden;
        if (hidden) showHide([elem], true);
        anim.done(() => {
          if (!hidden) showHide([elem]);
          dataPriv.remove(elem, 'fxshow');
          for (const p in orig) $.style(elem, p, orig[p]);
        });
      }
      propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
      if (!(prop in dataShow)) {
        dataShow[prop] = propTween.start;
        if (hidden) { propTween.end = propTween.start; propTween.start = 0; }
      }
    }
  }
  function propFilter(props, specialEasing) {
    for (let index in props) {
      const name = camel(index);
      let easing = specialEasing[name], value = props[index];
      if (Array.isArray(value)) { easing = value[1]; value = props[index] = value[0]; }
      if (index !== name) { props[name] = value; delete props[index]; }
      const hooks = $.cssHooks[name];
      if (hooks && 'expand' in hooks) {
        value = hooks.expand(value);
        delete props[name];
        for (index in value) if (!(index in props)) { props[index] = value[index]; specialEasing[index] = easing; }
      } else specialEasing[name] = easing;
    }
  }
  function Animation(elem, properties, options) {
    let stopped;
    const deferred = $.Deferred().always(() => { delete tick.elem; });
    const tick = function () {
      if (stopped) return false;
      const currentTime = fxNow || createFxNow(),
        remaining = Math.max(0, animation.startTime + animation.duration - currentTime),
        temp = remaining / animation.duration || 0, percent = 1 - temp, length = animation.tweens.length;
      for (let index = 0; index < length; index++) animation.tweens[index].run(percent);
      deferred.notifyWith(elem, [animation, percent, remaining]);
      if (percent < 1 && length) return remaining;
      if (!length) deferred.notifyWith(elem, [animation, 1, 0]);
      deferred.resolveWith(elem, [animation]);
      return false;
    };
    const animation = deferred.promise({
      elem,
      props: $.extend({}, properties),
      opts: $.extend(true, { specialEasing: {}, easing: $.easing._default }, options),
      originalProperties: properties,
      originalOptions: options,
      startTime: fxNow || createFxNow(),
      duration: options.duration,
      tweens: [],
      createTween(prop, end) {
        const tween = $.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
        animation.tweens.push(tween);
        return tween;
      },
      stop(gotoEnd) {
        const length = gotoEnd ? animation.tweens.length : 0;
        if (stopped) return this;
        stopped = true;
        for (let index = 0; index < length; index++) animation.tweens[index].run(1);
        if (gotoEnd) { deferred.notifyWith(elem, [animation, 1, 0]); deferred.resolveWith(elem, [animation, gotoEnd]); }
        else deferred.rejectWith(elem, [animation, gotoEnd]);
        return this;
      },
    });
    const props = animation.props;
    propFilter(props, animation.opts.specialEasing);
    for (let index = 0; index < Animation.prefilters.length; index++) {
      const result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
      if (result) {
        if (isFn(result.stop)) $._queueHooks(animation.elem, animation.opts.queue).stop = result.stop.bind(result);
        return result;
      }
    }
    $.map(props, createTween, animation);
    if (isFn(animation.opts.start)) animation.opts.start.call(elem, animation);
    animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
    $.fx.timer($.extend(tick, { elem, anim: animation, queue: animation.opts.queue }));
    return animation;
  }
  $.Animation = $.extend(Animation, {
    tweeners: { '*': [function (prop, value) { const tween = this.createTween(prop, value); adjustCSS(tween.elem, prop, rcssNum.exec(value), tween); return tween; }] },
    tweener(props, callback) {
      if (isFn(props)) { callback = props; props = ['*']; } else props = props.match(rnothtmlwhite);
      for (const prop of props) { Animation.tweeners[prop] = Animation.tweeners[prop] || []; Animation.tweeners[prop].unshift(callback); }
    },
    prefilters: [defaultPrefilter],
    prefilter(callback, prepend) { if (prepend) Animation.prefilters.unshift(callback); else Animation.prefilters.push(callback); },
  });
  $.speed = function (speed, easing, fn) {
    const opt = speed && typeof speed === 'object' ? $.extend({}, speed) : {
      complete: fn || (!fn && easing) || (isFn(speed) && speed),
      duration: speed,
      easing: (fn && easing) || (easing && !isFn(easing) && easing),
    };
    if ($.fx.off) opt.duration = 0;
    else if (typeof opt.duration !== 'number') opt.duration = opt.duration in $.fx.speeds ? $.fx.speeds[opt.duration] : $.fx.speeds._default;
    if (opt.queue == null || opt.queue === true) opt.queue = 'fx';
    opt.old = opt.complete;
    opt.complete = function () { if (isFn(opt.old)) opt.old.call(this); if (opt.queue) $.dequeue(this, opt.queue); };
    return opt;
  };
  $.fn.extend({
    fadeTo(speed, to, easing, callback) {
      return this.filter(isHiddenWithinTree).css('opacity', 0).show().end().animate({ opacity: to }, speed, easing, callback);
    },
    animate(prop, speed, easing, callback) {
      const empty = $.isEmptyObject(prop), optall = $.speed(speed, easing, callback);
      const doAnimation = function () {
        const anim = Animation(this, $.extend({}, prop), optall);
        if (empty || dataPriv.get(this, 'finish')) anim.stop(true);
      };
      doAnimation.finish = doAnimation;
      return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
    },
    stop(type, clearQueue, gotoEnd) {
      const stopQueue = hooks => { const stop = hooks.stop; delete hooks.stop; stop(gotoEnd); };
      if (typeof type !== 'string') { gotoEnd = clearQueue; clearQueue = type; type = undefined; }
      if (clearQueue) this.queue(type || 'fx', []);
      return this.each(function () {
        let dequeue = true, index = type != null && type + 'queueHooks';
        const timers = $.timers, data = dataPriv.get(this);
        if (index) { if (data[index] && data[index].stop) stopQueue(data[index]); }
        else for (index in data) if (data[index] && data[index].stop && rrun.test(index)) stopQueue(data[index]);
        for (index = timers.length; index--;) {
          if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
            timers[index].anim.stop(gotoEnd); dequeue = false; timers.splice(index, 1);
          }
        }
        if (dequeue || !gotoEnd) $.dequeue(this, type);
      });
    },
    finish(type) {
      if (type !== false) type = type || 'fx';
      return this.each(function () {
        const data = dataPriv.get(this), queue = data[type + 'queue'], hooks = data[type + 'queueHooks'], timers = $.timers, length = queue ? queue.length : 0;
        data.finish = true;
        $.queue(this, type, []);
        if (hooks && hooks.stop) hooks.stop.call(this, true);
        for (let index = timers.length; index--;) {
          if (timers[index].elem === this && timers[index].queue === type) { timers[index].anim.stop(true); timers.splice(index, 1); }
        }
        for (let index = 0; index < length; index++) if (queue[index] && queue[index].finish) queue[index].finish.call(this);
        delete data.finish;
      });
    },
  });
  ['toggle', 'show', 'hide'].forEach(name => {
    const cssFn = $.fn[name];
    $.fn[name] = function (speed, easing, callback) {
      return speed == null || typeof speed === 'boolean' ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
    };
  });
  $.each({ slideDown: genFx('show'), slideUp: genFx('hide'), slideToggle: genFx('toggle'), fadeIn: { opacity: 'show' }, fadeOut: { opacity: 'hide' }, fadeToggle: { opacity: 'toggle' } },
    (name, props) => { $.fn[name] = function (speed, easing, callback) { return this.animate(props, speed, easing, callback); }; });

  function Tween(elem, options, prop, end, easing) { return new Tween.prototype.init(elem, options, prop, end, easing); }
  $.Tween = Tween;
  Tween.prototype = {
    constructor: Tween,
    init: function (elem, options, prop, end, easing, unit) {
      this.elem = elem; this.prop = prop; this.easing = easing || $.easing._default;
      this.options = options; this.start = this.now = this.cur(); this.end = end;
      this.unit = unit || ($.cssNumber[prop] ? '' : 'px');
    },
    cur() { const hooks = Tween.propHooks[this.prop]; return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this); },
    run(percent) {
      let eased;
      const hooks = Tween.propHooks[this.prop];
      if (this.options.duration) this.pos = eased = easingFn(this.easing)(percent, this.options.duration * percent, 0, 1, this.options.duration);
      else this.pos = eased = percent;
      this.now = (this.end - this.start) * eased + this.start;
      if (this.options.step) this.options.step.call(this.elem, this.now, this);
      if (hooks && hooks.set) hooks.set(this); else Tween.propHooks._default.set(this);
      return this;
    },
  };
  Tween.prototype.init.prototype = Tween.prototype;
  Tween.propHooks = {
    _default: {
      get(tween) {
        if (tween.elem.nodeType !== 1 || (tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null)) return tween.elem[tween.prop];
        const result = $.css(tween.elem, tween.prop, '');
        return !result || result === 'auto' ? 0 : result;
      },
      set(tween) {
        if ($.fx.step[tween.prop]) $.fx.step[tween.prop](tween);
        else if (tween.elem.nodeType === 1 && ($.cssHooks[tween.prop] || tween.elem.style[finalPropName(tween.prop)] != null)) $.style(tween.elem, tween.prop, tween.now + tween.unit);
        else tween.elem[tween.prop] = tween.now;
      },
    },
  };
  Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = { set(tween) { if (tween.elem.nodeType && tween.elem.parentNode) tween.elem[tween.prop] = tween.now; } };
  $.easing = { linear: p => p, swing: p => 0.5 - Math.cos(p * Math.PI) / 2, _default: 'swing' };
  // unknown names fall back to the Motion parser (GSAP / CSS eases)
  const easingFn = name => {
    const f = $.easing[name];
    if (f) return f;
    if ($.parseEase) { const e = $.parseEase(name); const g = p => e(p); g.kjFromParse = true; return ($.easing[name] = g); }
    return $.easing.swing;
  };
  $.fx = Tween.prototype.init;
  $.fx.step = {};
  $.timers = [];
  $.fx.tick = function () {
    let timer;
    const timers = $.timers;
    fxNow = Date.now();
    for (let i = 0; i < timers.length; i++) { timer = timers[i]; if (!timer() && timers[i] === timer) timers.splice(i--, 1); }
    if (!timers.length) $.fx.stop();
    fxNow = undefined;
  };
  $.fx.timer = timer => { $.timers.push(timer); $.fx.start(); };
  $.fx.interval = 13;
  $.fx.start = () => { if (inProgress) return; inProgress = true; schedule(); };
  $.fx.stop = () => { inProgress = null; };
  $.fx.speeds = { slow: 600, fast: 200, _default: 400 };
  $.fx.off = false;

  /* ============================================================
   * AJAX — jQuery's $.ajax, faithfully: jqXHR (a Deferred promise),
   * prefilters, transports, converters, global events, JSONP, statusCode,
   * ifModified, sync requests. Hyper uses the small fetch() helper below.
   * ============================================================ */
  const sameOrigin = url => { try { return new URL(url, location.href).origin === location.origin; } catch (e) { return true; } };

  // jQuery-style decoration for native promises
  function decoratePromise(p, failArgs = e => [e]) {
    const quiet = x => x.catch(() => {});
    p.done = (...fns) => { quiet(p.then(v => fns.flat().forEach(f => f(v)))); return p; };
    p.fail = (...fns) => { p.catch(e => fns.flat().forEach(f => f(...failArgs(e)))); return p; };
    p.always = (...fns) => { quiet(p.then(v => fns.flat().forEach(f => f(v)), e => fns.flat().forEach(f => f(...failArgs(e))))); return p; };
    p.progress = () => p;
    return p;
  }

  /* ---------------- fetch() helper for Hyper: resolves { data, res, status, text } ---------------- */
  function request(o) {
    const url = o.url || location.href;
    const method = String(o.method || 'GET').toUpperCase();
    const headers = new Headers();
    for (const k in o.headers || {}) if (o.headers[k] != null) headers.set(k, o.headers[k]);
    let body = method === 'GET' || method === 'HEAD' ? undefined : o.data;
    if (body instanceof URLSearchParams) { headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8'); body = body.toString(); }
    const controller = new AbortController();
    if (o.signal) o.signal.addEventListener('abort', () => controller.abort());
    let timedOut = false, timer;
    if (o.timeout > 0) timer = setTimeout(() => { timedOut = true; controller.abort(); }, o.timeout);
    return fetch(url, { method, headers, body, signal: controller.signal, credentials: o.credentials || 'same-origin' })
      .then(async res => {
        clearTimeout(timer);
        const text = await res.text();
        if (!res.ok) throw Object.assign(new Error(res.statusText || 'error'), { status: res.status, statusText: res.statusText, responseText: text, response: res });
        return { data: text, res, status: res.status, text };
      }, err => {
        clearTimeout(timer);
        const aborted = err && err.name === 'AbortError';
        throw Object.assign(new Error(timedOut ? 'timeout' : (err && err.message) || 'error'), { cause: err, status: 0,
          statusText: timedOut ? 'timeout' : aborted ? 'abort' : 'error', name: aborted ? 'AbortError' : 'Error', responseText: '' });
      });
  }

  /* ---------------- jQuery.ajax ---------------- */
  const r20 = /%20/g, rHash = /#.*$/, rAntiCache = /([?&])_=[^&]*/, rHeaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,
    rNoContent = /^(?:GET|HEAD)$/, rProtocol = /^\/\//, rQuery = /\?/, rJsonp = /(=)\?(?=&|$)|\?\?/;
  const prefilters = {}, transports = {}, allTypes = '*/'.concat('*');
  let ajaxNonce = Date.now();
  function addToPrefiltersOrTransports(structure) {
    return (dataTypeExpression, func) => {
      if (!isStr(dataTypeExpression)) { func = dataTypeExpression; dataTypeExpression = '*'; }
      const types = dataTypeExpression.toLowerCase().match(/\S+/g) || [];
      if (!isFn(func)) return;
      for (let dt of types) {
        if (dt[0] === '+') { dt = dt.slice(1) || '*'; (structure[dt] = structure[dt] || []).unshift(func); }
        else (structure[dt] = structure[dt] || []).push(func);
      }
    };
  }
  function inspect(structure, options, originalOptions, jqXHR) {
    const inspected = {}, seekingTransport = structure === transports;
    function go(dataType) {
      let selected;
      inspected[dataType] = true;
      (structure[dataType] || []).some(factory => {
        const r = factory(options, originalOptions, jqXHR);
        if (isStr(r) && !seekingTransport && !inspected[r]) { options.dataTypes.unshift(r); go(r); return false; }
        else if (seekingTransport) { selected = r; return !!selected; }
        return false;
      });
      return selected;
    }
    return go(options.dataTypes[0]) || (!inspected['*'] && go('*'));
  }
  function ajaxExtend(target, src) {
    let deep;
    const flat = $.ajaxSettings.flatOptions || {};
    for (const key in src) if (src[key] !== undefined) (flat[key] ? target : (deep || (deep = {})))[key] = src[key];
    if (deep) $.extend(true, target, deep);
    return target;
  }
  function handleResponses(s, jqXHR, responses) {
    let ct, finalDataType, firstDataType;
    const contents = s.contents, dataTypes = s.dataTypes;
    while (dataTypes[0] === '*') { dataTypes.shift(); if (ct === undefined) ct = s.mimeType || jqXHR.getResponseHeader('Content-Type'); }
    if (ct) for (const type in contents) if (contents[type] && contents[type].test(ct)) { dataTypes.unshift(type); break; }
    if (dataTypes[0] in responses) finalDataType = dataTypes[0];
    else {
      for (const type in responses) {
        if (!dataTypes[0] || s.converters[type + ' ' + dataTypes[0]]) { finalDataType = type; break; }
        if (!firstDataType) firstDataType = type;
      }
      finalDataType = finalDataType || firstDataType;
    }
    if (finalDataType) { if (finalDataType !== dataTypes[0]) dataTypes.unshift(finalDataType); return responses[finalDataType]; }
  }
  function ajaxConvert(s, response, jqXHR, isSuccess) {
    let current, prev, conv;
    const converters = {}, dataTypes = s.dataTypes.slice();
    if (dataTypes[1]) for (const c in s.converters) converters[c.toLowerCase()] = s.converters[c];
    current = dataTypes.shift();
    while (current) {
      if (s.responseFields[current]) jqXHR[s.responseFields[current]] = response;
      if (!prev && isSuccess && s.dataFilter) response = s.dataFilter(response, s.dataType);
      prev = current;
      current = dataTypes.shift();
      if (!current) break;
      if (current === '*') { current = prev; continue; }
      if (prev !== '*' && prev !== current) {
        conv = converters[prev + ' ' + current] || converters['* ' + current];
        if (!conv) {
          for (const conv2 in converters) {
            const tmp = conv2.split(' ');
            if (tmp[1] === current) {
              conv = converters[prev + ' ' + tmp[0]] || converters['* ' + tmp[0]];
              if (conv) {
                if (conv === true) conv = converters[conv2];
                else if (converters[conv2] !== true) { current = tmp[0]; dataTypes.unshift(tmp[1]); }
                break;
              }
            }
          }
        }
        if (conv !== true) {
          if (conv && s.throws) response = conv(response);
          else {
            try { response = conv(response); }
            catch (e) { return { state: 'parsererror', error: conv ? e : 'No conversion from ' + prev + ' to ' + current }; }
          }
        }
      }
    }
    return { state: 'success', data: response };
  }

  $.active = 0;
  $.lastModified = {};
  $.etag = {};
  const oldCallbacks = [];
  $.ajaxSettings = {
    url: location.href, type: 'GET', isLocal: /^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(location.protocol),
    global: true, processData: true, async: true, contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    accepts: { '*': allTypes, text: 'text/plain', html: 'text/html', xml: 'application/xml, text/xml', json: 'application/json, text/javascript',
      script: 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript' },
    contents: { xml: /\bxml\b/, html: /\bhtml/, json: /\bjson\b/, script: /\b(?:java|ecma)script\b/ },
    responseFields: { xml: 'responseXML', text: 'responseText', json: 'responseJSON' },
    converters: { '* text': String, 'text html': true, 'text json': JSON.parse, 'text xml': s => $.parseXML(s),
      'text script': text => { globalEval(text); return text; } },
    flatOptions: { url: true, context: true },
    jsonp: 'callback',
    jsonpCallback() { const cb = oldCallbacks.pop() || ($.expando + '_' + (ajaxNonce++)); this[cb] = true; return cb; },
    xhr: () => new window.XMLHttpRequest(),
  };
  $.ajaxSetup = (target, settings) => settings ? ajaxExtend(ajaxExtend(target, $.ajaxSettings), settings) : ajaxExtend($.ajaxSettings, target);
  $.ajaxPrefilter = addToPrefiltersOrTransports(prefilters);
  $.ajaxTransport = addToPrefiltersOrTransports(transports);

  $.ajax = function (url, options) {
    if (typeof url === 'object') { options = url; url = undefined; }
    options = options || {};
    let transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, completed, uncached, fireGlobals;
    const s = $.ajaxSetup({}, options);
    // jsKjs extra: { json: true } sends the data as a JSON body
    if (s.json && s.data != null && !isStr(s.data)) { s.data = JSON.stringify(s.data); s.contentType = 'application/json'; s.processData = false; }
    const callbackContext = s.context || s;
    const globalEventContext = s.context && (callbackContext.nodeType || callbackContext instanceof KJ) ? $(callbackContext) : $(document);
    const deferred = $.Deferred(), completeDeferred = $.Callbacks('once memory');
    let statusCode = s.statusCode || {};
    const requestHeaders = {}, requestHeadersNames = {};
    let strAbort = 'canceled';
    const jqXHR = {
      readyState: 0,
      getResponseHeader(key) {
        if (!completed) return null;
        if (!responseHeaders) {
          responseHeaders = {};
          let m;
          rHeaders.lastIndex = 0;
          while ((m = rHeaders.exec(responseHeadersString))) { const k = m[1].toLowerCase() + ' '; responseHeaders[k] = (responseHeaders[k] || []).concat(m[2]); }
        }
        const v = responseHeaders[key.toLowerCase() + ' '];
        return v == null ? null : v.join(', ');
      },
      getAllResponseHeaders() { return completed ? responseHeadersString : null; },
      setRequestHeader(name, value) {
        if (completed == null) { name = requestHeadersNames[name.toLowerCase()] = requestHeadersNames[name.toLowerCase()] || name; requestHeaders[name] = value; }
        return this;
      },
      overrideMimeType(type) { if (completed == null) s.mimeType = type; return this; },
      statusCode(map) {
        if (map) {
          if (completed) jqXHR.always(map[jqXHR.status]);
          else for (const code in map) statusCode[code] = [statusCode[code], map[code]];
        }
        return this;
      },
      abort(statusText) {
        const finalText = statusText || strAbort;
        if (transport) transport.abort(finalText);
        done(0, finalText);
        return this;
      },
    };
    deferred.promise(jqXHR);
    s.url = ((url || s.url || location.href) + '').replace(rProtocol, location.protocol + '//');
    s.type = options.method || options.type || s.method || s.type;
    s.dataTypes = (s.dataType || '*').toLowerCase().match(/\S+/g) || [''];
    if (s.crossDomain == null) {
      try { const u = new URL(s.url, location.href); s.crossDomain = u.protocol + '//' + u.host !== location.protocol + '//' + location.host; }
      catch (e) { s.crossDomain = true; }
    }
    if (s.data && s.processData && !isStr(s.data)) s.data = $.param(s.data, s.traditional);
    inspect(prefilters, s, options, jqXHR);
    if (completed) return jqXHR;
    fireGlobals = $.event && s.global;
    if (fireGlobals && $.active++ === 0) $(document).trigger('ajaxStart');
    s.type = s.type.toUpperCase();
    s.hasContent = !rNoContent.test(s.type);
    cacheURL = s.url.replace(rHash, '');
    if (!s.hasContent) {
      uncached = s.url.slice(cacheURL.length);
      if (s.data && (s.processData || isStr(s.data))) { cacheURL += (rQuery.test(cacheURL) ? '&' : '?') + s.data; delete s.data; }
      if (s.cache === false) { cacheURL = cacheURL.replace(rAntiCache, '$1'); uncached = (rQuery.test(cacheURL) ? '&' : '?') + '_=' + (ajaxNonce++) + uncached; }
      s.url = cacheURL + uncached;
    } else if (s.data && s.processData && (s.contentType || '').indexOf('application/x-www-form-urlencoded') === 0) s.data = s.data.replace(r20, '+');
    if (s.ifModified) {
      if ($.lastModified[cacheURL]) jqXHR.setRequestHeader('If-Modified-Since', $.lastModified[cacheURL]);
      if ($.etag[cacheURL]) jqXHR.setRequestHeader('If-None-Match', $.etag[cacheURL]);
    }
    if ((s.data && s.hasContent && s.contentType !== false) || options.contentType) jqXHR.setRequestHeader('Content-Type', s.contentType);
    jqXHR.setRequestHeader('Accept', s.dataTypes[0] && s.accepts[s.dataTypes[0]]
      ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== '*' ? ', ' + allTypes + '; q=0.01' : '') : s.accepts['*']);
    for (const h in s.headers) jqXHR.setRequestHeader(h, s.headers[h]);
    if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || completed)) return jqXHR.abort();
    strAbort = 'abort';
    completeDeferred.add(s.complete);
    jqXHR.done(s.success);
    jqXHR.fail(s.error);
    transport = inspect(transports, s, options, jqXHR);
    if (!transport) done(-1, 'No Transport');
    else {
      jqXHR.readyState = 1;
      if (fireGlobals) globalEventContext.trigger('ajaxSend', [jqXHR, s]);
      if (completed) return jqXHR;
      if (s.async && s.timeout > 0) timeoutTimer = window.setTimeout(() => jqXHR.abort('timeout'), s.timeout);
      try { completed = false; transport.send(requestHeaders, done); }
      catch (e) { if (completed) throw e; done(-1, e); }
    }
    function done(status, nativeStatusText, responses, headers) {
      let isSuccess, success, error, response, statusText = nativeStatusText;
      if (completed) return;
      completed = true;
      if (timeoutTimer) window.clearTimeout(timeoutTimer);
      transport = undefined;
      responseHeadersString = headers || '';
      jqXHR.readyState = status > 0 ? 4 : 0;
      isSuccess = status >= 200 && status < 300 || status === 304;
      if (responses) response = handleResponses(s, jqXHR, responses);
      if (!isSuccess && s.dataTypes.indexOf('script') > -1 && s.dataTypes.indexOf('json') < 0) s.converters['text script'] = () => {};
      response = ajaxConvert(s, response, jqXHR, isSuccess);
      if (isSuccess) {
        if (s.ifModified) {
          let m = jqXHR.getResponseHeader('Last-Modified'); if (m) $.lastModified[cacheURL] = m;
          m = jqXHR.getResponseHeader('etag'); if (m) $.etag[cacheURL] = m;
        }
        if (status === 204 || s.type === 'HEAD') statusText = 'nocontent';
        else if (status === 304) statusText = 'notmodified';
        else { statusText = response.state; success = response.data; error = response.error; isSuccess = !error; }
      } else {
        error = statusText;
        if (status || !statusText) { statusText = 'error'; if (status < 0) status = 0; }
      }
      jqXHR.status = status;
      jqXHR.statusText = (nativeStatusText || statusText) + '';
      if (isSuccess) deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
      else deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
      jqXHR.statusCode(statusCode);
      statusCode = undefined;
      if (fireGlobals) globalEventContext.trigger(isSuccess ? 'ajaxSuccess' : 'ajaxError', [jqXHR, s, isSuccess ? success : error]);
      completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);
      if (fireGlobals) {
        globalEventContext.trigger('ajaxComplete', [jqXHR, s]);
        if (!(--$.active)) $(document).trigger('ajaxStop');
      }
    }
    return jqXHR;
  };

  /* ---------------- built-in transports & prefilters ---------------- */
  const xhrSuccessStatus = { 0: 200, 1223: 204 };
  $.ajaxTransport(options => {
    let callback, errorCallback;
    return {
      send(headers, complete) {
        const xhr = options.xhr();
        xhr.open(options.type, options.url, options.async, options.username, options.password);
        if (options.xhrFields) for (const i in options.xhrFields) xhr[i] = options.xhrFields[i];
        if (options.mimeType && xhr.overrideMimeType) xhr.overrideMimeType(options.mimeType);
        if (!options.crossDomain && !headers['X-Requested-With']) headers['X-Requested-With'] = 'XMLHttpRequest';
        for (const i in headers) xhr.setRequestHeader(i, headers[i]);
        callback = type => () => {
          if (!callback) return;
          callback = errorCallback = xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = xhr.onreadystatechange = null;
          if (type === 'abort') xhr.abort();
          else if (type === 'error') { if (typeof xhr.status !== 'number') complete(0, 'error'); else complete(xhr.status, xhr.statusText); }
          else complete(xhrSuccessStatus[xhr.status] || xhr.status, xhr.statusText,
            (xhr.responseType || 'text') !== 'text' || typeof xhr.responseText !== 'string' ? { binary: xhr.response } : { text: xhr.responseText },
            xhr.getAllResponseHeaders());
        };
        xhr.onload = callback();
        errorCallback = xhr.onerror = xhr.ontimeout = callback('error');
        xhr.onabort = () => { if (xhr.readyState === 4) window.setTimeout(() => { if (callback) errorCallback(); }); else if (errorCallback) errorCallback(); };
        callback = callback('abort');
        try { xhr.send(options.hasContent && options.data || null); } catch (e) { if (callback) throw e; }
      },
      abort() { if (callback) callback(); },
    };
  });
  // a Content-Type given in `headers` wins over `contentType` (gh-4119)
  $.ajaxPrefilter(s => { for (const i in s.headers) if (i.toLowerCase() === 'content-type') s.contentType = s.headers[i] || ''; });
  // scripts: no cache-busting by default; cross-domain scripts load with a <script> element
  $.ajaxPrefilter(s => { if (s.crossDomain) s.contents.script = false; });
  $.ajaxPrefilter('script', s => { if (s.cache === undefined) s.cache = false; if (s.crossDomain) s.type = 'GET'; });
  $.ajaxTransport('script', s => {
    if (!(s.crossDomain || s.scriptAttrs)) return;
    let script, callback;
    return {
      send(_, complete) {
        script = document.createElement('script');
        if (s.scriptAttrs) for (const a in s.scriptAttrs) script.setAttribute(a, s.scriptAttrs[a]);
        if (s.scriptCharset) script.charset = s.scriptCharset;
        script.src = s.url;
        callback = evt => {
          script.removeEventListener('load', callback); script.removeEventListener('error', callback); script.remove(); callback = null;
          if (evt) complete(evt.type === 'error' ? 404 : 200, evt.type);
        };
        script.addEventListener('load', callback); script.addEventListener('error', callback);
        document.head.appendChild(script);
      },
      abort() { if (callback) callback(); },
    };
  });
  // JSONP — still the only way some third-party APIs work cross-origin
  $.ajaxPrefilter('json jsonp', (s, original, jqXHR) => {
    let overwritten, responseContainer;
    const jsonProp = s.jsonp !== false && (rJsonp.test(s.url) ? 'url'
      : isStr(s.data) && (s.contentType || '').indexOf('application/x-www-form-urlencoded') === 0 && rJsonp.test(s.data) && 'data');
    if (!(jsonProp || s.dataTypes[0] === 'jsonp')) return;
    const callbackName = s.jsonpCallback = isFn(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;
    if (jsonProp) s[jsonProp] = s[jsonProp].replace(rJsonp, '$1' + callbackName);
    else if (s.jsonp !== false) s.url += (rQuery.test(s.url) ? '&' : '?') + s.jsonp + '=' + callbackName;
    s.converters['script json'] = () => { if (!responseContainer) $.error(callbackName + ' was not called'); return responseContainer[0]; };
    s.dataTypes[0] = 'json';
    overwritten = window[callbackName];
    window[callbackName] = function () { responseContainer = arguments; };
    jqXHR.always(() => {
      if (overwritten === undefined) { try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; } }
      else window[callbackName] = overwritten;
      if (s[callbackName]) { s.jsonpCallback = original.jsonpCallback; oldCallbacks.push(callbackName); }
      if (responseContainer && isFn(overwritten)) overwritten(responseContainer[0]);
      responseContainer = overwritten = undefined;
    });
    return 'script';
  });

  /* ---------------- shorthands ---------------- */
  for (const method of ['get', 'post']) {
    $[method] = function (url, data, callback, type) {
      if (isFn(data)) { type = type || callback; callback = data; data = undefined; }
      return $.ajax($.extend({ url, type: method, dataType: type, data, success: callback }, $.isPlainObject(url) && url));
    };
  }
  $.getJSON = (url, data, callback) => $.get(url, data, callback, 'json');
  $.getScript = (url, callback) => $.get(url, undefined, callback, 'script');
  $._evalUrl = (url, options, doc) => $.ajax({ url, type: 'GET', dataType: 'script', cache: true, async: false, global: false,
    converters: { 'text script': () => {} }, dataFilter(response) { globalEval(response, options, doc); } });
  function globalEval(code, options, doc) {
    doc = doc || document;
    const s = doc.createElement('script');
    s.text = code;
    if (options && options.nonce) s.nonce = options.nonce;
    doc.head.appendChild(s).parentNode.removeChild(s);
  }
  $.globalEval = globalEval;
  for (const n of ['ajaxStart', 'ajaxStop', 'ajaxComplete', 'ajaxError', 'ajaxSuccess', 'ajaxSend'])
    $.fn[n] = function (fn) { return this.on(n, fn); };

  $.fn.load = function (url, params, callback) {
    let selector, type, response;
    const self = this, off = url.indexOf(' ');
    if (off > -1) { selector = url.slice(off).trim(); url = url.slice(0, off); }
    if (isFn(params)) { callback = params; params = undefined; }
    else if (params && typeof params === 'object') type = 'POST';
    if (self.length > 0) {
      $.ajax({ url, type: type || 'GET', dataType: 'html', data: params }).done(function (responseText) {
        response = arguments;
        self.html(selector ? $('<div>').append($.parseHTML(responseText)).find(selector) : responseText);
      }).always(callback && function (jqXHR, status) {
        self.each(function () { callback.apply(this, response || [jqXHR.responseText, status, jqXHR]); });
      });
    }
    return this;
  };

  /* ---------------- forms ---------------- */
  const rSubmitterTypes = /^(?:submit|button|image|reset|file)$/i, rSubmittable = /^(?:input|select|textarea|keygen)/i,
    rCheckable = /^(?:checkbox|radio)$/i, rCRLF = /\r?\n/g;
  $.fn.serializeArray = function () {
    return this.map(function () { const els = this.elements; return els ? [...els] : this; })
      .filter(function () {
        const type = this.type;
        return this.name && !$(this).is(':disabled') && rSubmittable.test(this.nodeName) && !rSubmitterTypes.test(type) && (this.checked || !rCheckable.test(type));
      })
      .map(function (_i, elem) {
        const val = $(this).val();
        if (val == null) return null;
        if (Array.isArray(val)) return val.map(v => ({ name: elem.name, value: v.replace(rCRLF, '\r\n') }));
        return { name: elem.name, value: val.replace(rCRLF, '\r\n') };
      }).get();
  };
  $.fn.serialize = function () { return $.param(this.serializeArray()); };
  $.fn.serializeObject = function () {
    const o = {};
    for (const { name, value } of this.serializeArray()) {
      if (name.endsWith('[]')) (o[name.slice(0, -2)] = o[name.slice(0, -2)] || []).push(value);
      else if (name in o) o[name] = [].concat(o[name], value);
      else o[name] = value;
    }
    return o;
  };

  // jQuery.param: nested objects/arrays as a[b]=1&a[]=2 (or a=1&a=2 when traditional)
  const rBracket = /\[\]$/;
  function buildParams(prefix, obj, traditional, add) {
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => {
        if (traditional || rBracket.test(prefix)) add(prefix, v);
        else buildParams(prefix + '[' + (typeof v === 'object' && v != null ? i : '') + ']', v, traditional, add);
      });
    } else if (!traditional && toType(obj) === 'object') for (const name in obj) buildParams(prefix + '[' + name + ']', obj[name], traditional, add);
    else add(prefix, obj);
  }
  $.param = function (a, traditional) {
    const s = [];
    const add = (key, valueOrFunction) => {
      const value = isFn(valueOrFunction) ? valueOrFunction() : valueOrFunction;
      s[s.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value == null ? '' : value);
    };
    if (a == null) return '';
    if (Array.isArray(a) || (a instanceof KJ && !$.isPlainObject(a))) Array.from(a).forEach(el => add(el.name, el.value));
    else for (const prefix in a) buildParams(prefix, a[prefix], traditional, add);
    return s.join('&');
  };

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

  /* ============================================================
   * HYPER — htmx's model with kj-* attributes (hx-* also accepted)
   *
   *   <button kj-get="/api/quote" kj-target="#quote" kj-swap="innerHTML">
   *   <input name="q" kj-get="/search" kj-trigger="input changed delay:300ms" kj-target="#hits">
   *   <body kj-boost="true">   → every link & form becomes AJAX with history
   * ============================================================ */
  const HYPER_VERBS = ['get', 'post', 'put', 'patch', 'delete'];
  const PREFIXES = ['kj-', 'hx-', 'data-kj-', 'data-hx-'];
  const hyperConfig = {
    defaultSwapStyle: 'innerHTML', defaultSwapDelay: 0, defaultSettleDelay: 20, historyEnabled: true, historyCacheSize: 10,
    refreshOnHistoryMiss: false, includeIndicatorStyles: true, globalViewTransitions: false, selfRequestsOnly: true,
    scrollIntoViewOnBoost: true, timeout: 0, allowScriptTags: true, addedClass: 'kj-added', settlingClass: 'kj-settling',
    swappingClass: 'kj-swapping', requestClass: 'kj-request', withCredentials: false, defaultFocusScroll: false,
  };
  const VERB_SELECTOR = PREFIXES.flatMap(p => HYPER_VERBS.map(v => '[' + p + v + ']')).join(',');
  const INHERITABLE = new Set(['target', 'swap', 'select', 'select-oob', 'indicator', 'include', 'params', 'headers', 'vals',
    'confirm', 'prompt', 'push-url', 'replace-url', 'boost', 'sync', 'encoding', 'disabled-elt', 'request', 'validate', 'history']);

  function ownAttr(el, name) {
    if (!isEl(el)) return null;
    for (const p of PREFIXES) { const v = el.getAttribute(p + name); if (v != null) return v; }
    return null;
  }
  // htmx-style attribute inheritance: walk up until found; "unset" stops; kj-disinherit blocks
  function hattr(el, name) {
    const r = hattrOwner(el, name);
    return r ? r.value : null;
  }
  function hattrOwner(el, name) {
    if (!INHERITABLE.has(name)) { const v = ownAttr(el, name); return v == null ? null : { value: v, owner: el }; }
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (n !== el) {
        const dis = ownAttr(n, 'disinherit');
        if (dis && (dis.trim() === '*' || dis.split(/\s+/).includes(name))) { const v = ownAttr(n, name); return v == null || v === 'unset' ? null : { value: v, owner: n }; }
      }
      const v = ownAttr(n, name);
      if (v != null) return v === 'unset' ? null : { value: v, owner: n };
    }
    return null;
  }
  const parseTime = (s, dflt = 0) => {
    if (s == null || s === '') return dflt;
    const m = String(s).trim().match(/^(-?[\d.]+)\s*(ms|s|m)?$/);
    return m ? parseFloat(m[1]) * (m[2] === 's' ? 1000 : m[2] === 'm' ? 60000 : 1) : dflt;
  };

  // Extended selectors: this, closest X, find X, next [X], previous [X], document, window, body
  function hyperQuery(el, spec, all) {
    if (spec == null) return all ? [] : null;
    spec = String(spec).trim();
    const out = [];
    for (const part of splitTopLevel(spec)) {
      const s = part.trim(); let m;
      if (s === 'this') out.push(el);
      else if (s === 'document') out.push(document);
      else if (s === 'window') out.push(window);
      else if (s === 'body') out.push(document.body);
      else if ((m = s.match(/^closest\s+(.+)$/))) { const c = el.closest(m[1]); if (c) out.push(c); }
      else if ((m = s.match(/^find\s+(.+)$/))) { if (all) out.push(...qsa(el, m[1])); else { const f = qsa(el, m[1])[0]; if (f) out.push(f); } }
      else if (s === 'next') { if (el.nextElementSibling) out.push(el.nextElementSibling); }
      else if (s === 'previous') { if (el.previousElementSibling) out.push(el.previousElementSibling); }
      else if ((m = s.match(/^next\s+(.+)$/))) { const f = qsa(document, m[1]).find(n => el.compareDocumentPosition(n) & 4); if (f) out.push(f); }
      else if ((m = s.match(/^previous\s+(.+)$/))) { const f = qsa(document, m[1]).filter(n => el.compareDocumentPosition(n) & 2).pop(); if (f) out.push(f); }
      else out.push(...(all ? qsa(document, s) : qsa(document, s).slice(0, 1)));
    }
    return all ? out : out[0] || null;
  }
  function resolveRel(el, attrName) {
    const r = hattrOwner(el, attrName);
    if (!r) return null;
    return { owner: r.owner, value: r.value };
  }
  function getTarget(el, boosted) {
    const r = resolveRel(el, 'target');
    if (!r) return boosted ? document.body : el;
    return hyperQuery(r.owner === el ? el : (r.value.trim() === 'this' ? r.owner : el), r.value, false);
  }

  /* ---------------- swap spec ---------------- */
  function parseSwap(str, boosted) {
    const spec = { style: hyperConfig.defaultSwapStyle, swapDelay: hyperConfig.defaultSwapDelay, settleDelay: hyperConfig.defaultSettleDelay,
      transition: hyperConfig.globalViewTransitions, focusScroll: hyperConfig.defaultFocusScroll };
    if (boosted && !str && hyperConfig.scrollIntoViewOnBoost) { spec.show = 'top'; spec.showTarget = 'window'; }
    if (!str) return spec;
    for (const tok of String(str).trim().split(/\s+/)) {
      const [k, ...rest] = tok.split(':'), v = rest.join(':');
      if (!rest.length) { spec.style = tok; continue; }
      if (k === 'swap') spec.swapDelay = parseTime(v);
      else if (k === 'settle') spec.settleDelay = parseTime(v);
      else if (k === 'transition') spec.transition = v === 'true';
      else if (k === 'ignoreTitle') spec.ignoreTitle = v === 'true';
      else if (k === 'focus-scroll') spec.focusScroll = v === 'true';
      else if (k === 'scroll' || k === 'show') {
        const i = v.lastIndexOf(':');
        if (i > 0) { spec[k] = v.slice(i + 1); spec[k + 'Target'] = v.slice(0, i); } else spec[k] = v;
      }
    }
    return spec;
  }

  /* ---------------- parameters ---------------- */
  function addInputs(fd, node, seenForms) {
    if (!node || !isEl(node)) return;
    if (node.tagName === 'FORM') { if (seenForms.has(node)) return; seenForms.add(node); for (const [k, v] of new FormData(node)) fd.append(k, v); return; }
    if (node.name && 'value' in node && !node.disabled && node.matches('input,select,textarea,button')) {
      if (node.type === 'checkbox' || node.type === 'radio') { if (node.checked) fd.append(node.name, node.value); }
      else if (node.type === 'file') [...(node.files || [])].forEach(f => fd.append(node.name, f));
      else if (node.tagName === 'SELECT' && node.multiple) [...node.selectedOptions].forEach(o => fd.append(node.name, o.value));
      else fd.append(node.name, node.value);
      return;
    }
    node.querySelectorAll('input,select,textarea').forEach(n => { if (!n.closest('form') || !seenForms.has(n.closest('form'))) addInputs(fd, n, seenForms); });
  }
  function parseJsonish(el, raw, evt) {
    if (!raw) return {};
    let s = raw.trim();
    const js = s.match(/^(?:js|javascript):([\s\S]*)$/);
    if (js) {
      s = js[1].trim();
      try { return new Function('event', 'return (' + (s.startsWith('{') ? s : '{' + s + '}') + ')').call(el, evt) || {}; }
      catch (e) { warn('bad js: value', raw, e); return {}; }
    }
    try { return JSON.parse(s.startsWith('{') ? s : '{' + s + '}'); } catch (e) { warn('invalid JSON in attribute', raw); return {}; }
  }
  // merged inherited JSON attributes (parent first, child overrides)
  function mergedJson(el, name, evt) {
    const chain = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const v = ownAttr(n, name);
      if (v === 'unset') break;
      if (v != null) chain.unshift([n, v]);
      if (n !== el) { const dis = ownAttr(n, 'disinherit'); if (dis && (dis.trim() === '*' || dis.split(/\s+/).includes(name))) break; }
    }
    return Object.assign({}, ...chain.map(([n, v]) => parseJsonish(n, v, evt)));
  }
  function collectParams(el, verb, evt) {
    const fd = new FormData(), seen = new Set();
    const form = el.tagName === 'FORM' ? el : (verb !== 'get' && el.closest('form'));
    if (form) addInputs(fd, form, seen);
    if (el !== form) addInputs(fd, el.matches && el.matches('input,select,textarea,button') ? el : null, seen);
    const submitter = evt && evt.submitter;
    if (submitter && submitter.name) fd.append(submitter.name, submitter.value);
    const inc = resolveRel(el, 'include');
    if (inc) hyperQuery(inc.value.trim() === 'this' ? inc.owner : el, inc.value, true).forEach(n => addInputs(fd, n, seen));
    const vals = mergedJson(el, 'vals', evt);
    for (const k in vals) { fd.delete(k); [].concat(vals[k]).forEach(v => fd.append(k, isObj(v) && !(v instanceof Blob) ? JSON.stringify(v) : v)); }
    const filter = hattr(el, 'params');
    if (filter && filter !== '*') {
      const names = [...new Set(fd.keys())];
      const not = /^not\s+/.test(filter), list = filter.replace(/^not\s+/, '').split(',').map(s => s.trim());
      names.forEach(n => { if (filter === 'none' || (not ? list.includes(n) : !list.includes(n))) fd.delete(n); });
    }
    return fd;
  }
  const fdToObj = fd => { const o = {}; for (const [k, v] of fd) k in o ? (o[k] = [].concat(o[k], v)) : (o[k] = v); return o; };
  const objToFd = o => { const fd = new FormData(); for (const k in o) [].concat(o[k]).forEach(v => v != null && fd.append(k, v)); return fd; };

  /* ---------------- events ---------------- */
  function hfire(el, name, detail) {
    const node = el && (el.isConnected || el === document || el === window) ? el : document;
    const ev = triggerOn(node, name, detail, true);
    return !(ev && ev.defaultPrevented);
  }

  /* ---------------- request pipeline ---------------- */
  const syncState = el => { const d = nodeData(el); return d.hsync || (d.hsync = { busy: false, queue: [], ctrl: null, abortable: false }); };

  function issueRequest(el, verb, url, opts = {}) {
    if (!el.isConnected && el !== document.body) return Promise.resolve();
    // sync strategy (default: queue the last event while one is in flight)
    const syncRaw = hattr(el, 'sync');
    let syncEl = el, strategy = opts.queue ? 'queue ' + opts.queue : 'queue last';
    if (syncRaw) {
      const i = syncRaw.lastIndexOf(':');
      const selPart = i > 0 ? syncRaw.slice(0, i) : syncRaw, strat = i > 0 ? syncRaw.slice(i + 1) : 'drop';
      syncEl = hyperQuery(el, selPart, false) || el; strategy = strat;
    }
    const st = syncState(syncEl);
    if (st.busy && !opts.fromQueue) {
      const run = () => issueRequest(el, verb, url, Object.assign({}, opts, { fromQueue: true }));
      if (strategy === 'drop' || strategy === 'queue none') return Promise.resolve();
      if (strategy === 'abort') { if (st.abortable && st.ctrl) st.ctrl.abort(); else return Promise.resolve(); }
      else if (strategy === 'replace') { if (st.ctrl) st.ctrl.abort(); }
      else if (strategy === 'queue first') { if (!st.queue.length) st.queue.push(run); return Promise.resolve(); }
      else if (strategy === 'queue all') { st.queue.push(run); return Promise.resolve(); }
      else { st.queue = [run]; return Promise.resolve(); }
    }
    return runRequest(el, verb, url, opts, st, strategy);
  }

  async function runRequest(el, verb, url, opts, st, strategy) {
    const evt = opts.event;
    // validation
    const form = el.tagName === 'FORM' ? el : null;
    const v = hattr(el, 'validate');
    if (((form && !form.noValidate && v !== 'false') || v === 'true') && isFn(el.checkValidity) && !el.checkValidity()) {
      el.reportValidity && el.reportValidity(); hfire(el, 'kj:validation:failed', { elt: el }); return;
    }
    // prompt / confirm (kj:confirm lets you plug in a custom dialog)
    const promptMsg = hattr(el, 'prompt');
    let promptVal = null;
    if (promptMsg && !opts.skipConfirm) { promptVal = window.prompt(promptMsg); if (promptVal === null) return; }
    const question = hattr(el, 'confirm');
    if (!opts.skipConfirm) {
      const cdetail = { elt: el, question, path: url, verb, triggeringEvent: evt,
        issueRequest: skip => { if (skip !== false) issueRequest(el, verb, url, Object.assign({}, opts, { skipConfirm: true, promptVal })); } };
      if (!hfire(el, 'kj:confirm', cdetail)) return;
      if (question && !window.confirm(question)) return;
    }
    if (opts.promptVal !== undefined && opts.promptVal !== null) promptVal = opts.promptVal;

    const target = opts.target !== undefined ? opts.target : getTarget(el, opts.boosted);
    const fd = opts.values ? objToFd(Object.assign(fdToObj(collectParams(el, verb, evt)), opts.values)) : collectParams(el, verb, evt);
    const headers = {
      'HX-Request': 'true', 'HX-Current-URL': location.href,
      ...(el.id ? { 'HX-Trigger': el.id } : {}), ...(el.getAttribute && el.getAttribute('name') ? { 'HX-Trigger-Name': el.getAttribute('name') } : {}),
      ...(target && target.id ? { 'HX-Target': target.id } : {}), ...(opts.boosted ? { 'HX-Boosted': 'true' } : {}),
      ...(promptVal != null ? { 'HX-Prompt': promptVal } : {}),
    };
    Object.assign(headers, mergedJson(el, 'headers', evt), opts.headers);
    const reqCfg = mergedJson(el, 'request', evt);
    if (reqCfg.noHeaders) for (const k in headers) if (k.startsWith('HX-')) delete headers[k];
    const detail = { elt: el, verb, path: url, url, target, headers, parameters: fdToObj(fd), triggeringEvent: evt, boosted: !!opts.boosted };
    if (!hfire(el, 'kj:config', detail)) return;
    url = detail.path !== url ? detail.path : detail.url; verb = detail.verb;
    if (hyperConfig.selfRequestsOnly && !sameOrigin(url)) { hfire(el, 'kj:error', { elt: el, url, verb, error: new Error('cross-origin request blocked (selfRequestsOnly)') }); return; }
    if (!hfire(el, 'kj:before', detail)) return;

    // encoding
    const params = objToFd(detail.parameters);
    const hasFile = [...params.values()].some(x => x instanceof Blob);
    const enc = hattr(el, 'encoding') || (form && form.getAttribute('enctype'));
    const multipart = hasFile || enc === 'multipart/form-data';
    const useQuery = verb === 'get' || verb === 'delete';
    let finalUrl = url, data;
    if (useQuery) {
      const qs = new URLSearchParams([...params].map(([k, x]) => [k, String(x)])).toString();
      if (qs) finalUrl = url.split('#')[0] + (url.includes('?') ? '&' : '?') + qs;
    } else data = multipart ? params : new URLSearchParams([...params].map(([k, x]) => [k, String(x)]));

    // indicators & disabled elements
    const indRel = resolveRel(el, 'indicator');
    const indicators = indRel ? hyperQuery(indRel.value.trim() === 'this' ? indRel.owner : el, indRel.value, true) : [el];
    const shownByUs = [];
    indicators.forEach(ind => {
      const d = nodeData(ind); d.reqCount = (d.reqCount || 0) + 1; ind.classList.add(hyperConfig.requestClass);
      if (ind !== el && isHidden(ind) && !ind.classList.contains('kj-indicator')) { showEl(ind); shownByUs.push(ind); }
    });
    const disRel = resolveRel(el, 'disabled-elt');
    const disabled = disRel ? hyperQuery(disRel.value.trim() === 'this' ? disRel.owner : el, disRel.value, true).filter(n => !n.disabled) : [];
    disabled.forEach(n => { n.disabled = true; });
    if (isEl(el)) el.setAttribute('aria-busy', 'true');

    const ctrl = new AbortController();
    st.busy = true; st.ctrl = ctrl; st.abortable = strategy === 'abort';
    const onAbort = () => ctrl.abort();
    el.addEventListener && el.addEventListener('kj:abort', onAbort);
    const cleanup = () => {
      indicators.forEach(ind => { const d = nodeData(ind); if (--d.reqCount <= 0) { d.reqCount = 0; ind.classList.remove(hyperConfig.requestClass); } });
      shownByUs.forEach(n => { if (!nodeData(n).reqCount) hideEl(n); });
      disabled.forEach(n => { n.disabled = false; });
      if (isEl(el)) el.removeAttribute('aria-busy');
      el.removeEventListener && el.removeEventListener('kj:abort', onAbort);
      st.busy = false; st.ctrl = null;
      const next = st.queue.shift(); if (next) next();
    };

    let r, failed = null;
    try {
      r = await request({ url: finalUrl, method: verb.toUpperCase(), data, headers: detail.headers, dataType: 'text', global: false,
        timeout: reqCfg.timeout || hyperConfig.timeout, signal: ctrl.signal, processData: false,
        credentials: reqCfg.credentials || hyperConfig.withCredentials ? 'include' : 'same-origin', contentType: false });
    } catch (err) {
      failed = err;
      if (err.response) r = { data: err.responseText, text: err.responseText, res: err.response, status: err.status };
    }
    try {
      if (!r) {
        hfire(el, 'kj:after', Object.assign({}, detail, { successful: false, failed: true, error: failed }));
        hfire(el, failed && failed.name === 'AbortError' ? 'kj:abort:done' : 'kj:error', Object.assign({}, detail, { error: failed, status: 0 }));
        if (failed && failed.name !== 'AbortError') hfire(el, 'kj:sendError', Object.assign({}, detail, { error: failed }));
        return;
      }
      await handleResponse(el, verb, finalUrl, url, r, failed, detail, opts);
    } finally { cleanup(); }
  }

  const H = (res, name) => res && res.headers && (res.headers.get('HX-' + name) ?? res.headers.get('KJ-' + name));
  function triggerHeader(el, raw) {
    if (!raw) return;
    try {
      const obj = JSON.parse(raw);
      for (const k in obj) { const d = obj[k]; const tgt = isObj(d) && d.target ? document.querySelector(d.target) : el; hfire(tgt || el, k, isObj(d) ? d : { value: d }); }
    } catch (e) { raw.split(',').forEach(n => n.trim() && hfire(el, n.trim(), {})); }
  }

  async function handleResponse(el, verb, finalUrl, url, r, failed, detail, opts) {
    const res = r.res, status = r.status, text = r.text == null ? '' : r.text;
    const isError = status >= 400 || !!failed;
    hfire(el, 'kj:after', Object.assign({}, detail, { html: text, status, xhr: res, successful: !isError, failed: isError }));
    if (status === 286) nodeData(el).hyperStop = true;
    triggerHeader(el, H(res, 'Trigger'));
    const redirect = H(res, 'Redirect');
    if (redirect) { location.href = redirect; return; }
    if (H(res, 'Refresh') === 'true') { location.reload(); return; }
    const loc = H(res, 'Location');
    if (loc) {
      let spec; try { spec = JSON.parse(loc); } catch (e) { spec = { path: loc }; }
      await $.hyper.ajax('get', spec.path, Object.assign({ target: spec.target || 'body', swap: spec.swap, select: spec.select, values: spec.values, headers: spec.headers }, { source: spec.source }));
      pushHistory(spec.path, false);
      return;
    }
    let target = detail.target;
    const retarget = H(res, 'Retarget'); if (retarget) target = hyperQuery(el, retarget, false);
    const swapStr = H(res, 'Reswap') || opts.swap || hattr(el, 'swap');
    const spec = parseSwap(swapStr, opts.boosted);
    const select = H(res, 'Reselect') || opts.select || hattr(el, 'select');
    if (isError) hfire(el, 'kj:error', Object.assign({}, detail, { error: failed, status, html: text, xhr: res }));
    const swapDetail = Object.assign({}, detail, { shouldSwap: !isError && status !== 204, isError, serverResponse: text, target, xhr: res, swapSpec: spec, status });
    if (!hfire(el, 'kj:beforeSwap', swapDetail) || !swapDetail.shouldSwap || !swapDetail.target) return;
    target = swapDetail.target;

    // history
    let push = H(res, 'Push-Url') || (opts.push !== undefined ? opts.push : hattr(el, 'push-url'));
    let replace = H(res, 'Replace-Url') || hattr(el, 'replace-url');
    if (opts.boosted && push == null && replace == null) push = 'true';
    const histUrl = v => v === 'true' ? (verb === 'get' ? finalUrl : url) : v;
    if (push && push !== 'false') saveHistorySnapshot();

    await swapResponse(target, text, spec, { select, selectOob: hattr(el, 'select-oob'), source: el, settleDetail: swapDetail, res });
    if (push && push !== 'false') pushHistory(histUrl(push), false);
    else if (replace && replace !== 'false') pushHistory(histUrl(replace), true);
  }

  /* ---------------- swapping ---------------- */
  function makeFragment(text) {
    let title = null, frag;
    const full = /^\s*(?:<!doctype[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<(?:html|head|body)\b/i.test(text);
    if (full) {
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const t = doc.querySelector('head > title') || doc.querySelector('title'); if (t) title = t.textContent;
      frag = document.createDocumentFragment();
      [...doc.body.childNodes].forEach(n => frag.append(document.importNode(n, true)));
      frag._fullDoc = doc;
    } else {
      const tpl = document.createElement('template'); tpl.innerHTML = text;
      frag = tpl.content;
      const t = [...frag.children].find(c => c.tagName === 'TITLE'); if (t) { title = t.textContent; t.remove(); }
    }
    return { frag, title };
  }
  function oobSwap(node, valueAttr, source) {
    const value = ownAttr(node, 'swap-oob') ?? valueAttr ?? 'true';
    PREFIXES.forEach(p => node.removeAttribute(p + 'swap-oob'));
    let style = value === 'true' ? 'outerHTML' : value, sel = null;
    const i = value.indexOf(':');
    if (i > 0) { style = value.slice(0, i); sel = value.slice(i + 1); }
    const targets = sel ? qsa(document, sel) : node.id ? [document.getElementById(node.id)].filter(Boolean) : [];
    if (!targets.length) { hfire(document.body, 'kj:oobErrorNoTarget', { content: node }); return; }
    targets.forEach(t => {
      const f = document.createDocumentFragment();
      if (style === 'outerHTML') f.append(node.cloneNode(true)); else [...node.cloneNode(true).childNodes].forEach(c => f.append(c));
      hfire(t, 'kj:oobBeforeSwap', { target: t, fragment: f, elt: source });
      doSwap(t, f, style, parseSwap(style));
      hfire(t.isConnected ? t : document.body, 'kj:oobAfterSwap', { target: t, elt: source });
    });
  }
  function handlePreserve(frag) {
    frag.querySelectorAll && [...frag.querySelectorAll('[id]')].forEach(n => {
      if (ownAttr(n, 'preserve') == null) return;
      const old = document.getElementById(n.id);
      if (old && old !== n) n.replaceWith(old);
    });
  }
  function activateScripts(frag, loadedSrcs) {
    if (!hyperConfig.allowScriptTags) { frag.querySelectorAll('script').forEach(s => s.remove()); return; }
    frag.querySelectorAll('script').forEach(s => { if (s.src && loadedSrcs.has(s.src)) s.dataset.kjRan = '1'; });
  }
  function doSwap(target, frag, style, spec) {
    const nodes = [...frag.childNodes];
    switch (style) {
      case 'outerHTML':
        if (target === document.body) { target.replaceChildren(frag); break; }
        target.replaceWith(frag); break;
      case 'beforebegin': target.before(frag); break;
      case 'afterbegin': target.prepend(frag); break;
      case 'beforeend': target.append(frag); break;
      case 'afterend': target.after(frag); break;
      case 'delete': target.remove(); return [];
      case 'none': return [];
      case 'textContent': target.textContent = nodes.map(n => n.textContent).join(''); return [];
      default:
        if (swapExtensions[style]) return swapExtensions[style](target, frag, spec) || nodes;
        target.replaceChildren(frag);
    }
    return nodes;
  }
  const swapExtensions = {};
  const SETTLE_ATTRS = ['class', 'style', 'width', 'height'];

  function swapResponse(target, text, spec, ctx = {}) {
    return new Promise(resolveSwap => {
      const style = spec.style;
      const { frag, title } = style === 'textContent' ? { frag: (() => { const f = document.createDocumentFragment(); f.append(text); return f; })(), title: null } : makeFragment(text);
      // out-of-band pieces first
      if (style !== 'textContent') {
        if (ctx.selectOob) splitTopLevel(ctx.selectOob).forEach(part => {
          const [sel, st] = part.trim().split(':');
          const n = frag.querySelector(sel); if (!n) return;
          n.remove(); n.setAttribute('kj-swap-oob', st || 'true'); oobSwap(n, st || 'true', ctx.source);
        });
        [...frag.querySelectorAll(PREFIXES.map(p => '[' + p + 'swap-oob]').join(','))].forEach(n => { n.remove(); oobSwap(n, null, ctx.source); });
      }
      let content = frag;
      if (ctx.select && style !== 'textContent') {
        content = document.createDocumentFragment();
        qsa(frag, ctx.select).forEach(n => content.append(n));
      }
      handlePreserve(content);
      const loaded = new Set([...document.scripts].map(s => s.src).filter(Boolean));
      if (style !== 'textContent') activateScripts(content, loaded);

      const swapTarget = target;
      const hadClassAttr = swapTarget.hasAttribute && swapTarget.hasAttribute('class');
      swapTarget.classList && swapTarget.classList.add(hyperConfig.swappingClass);
      const perform = () => {
        // remember focus so live-search inputs keep the caret when re-rendered
        const ae = document.activeElement, aeId = ae && ae.id;
        let selStart = null, selEnd = null;
        try { if (ae && 'selectionStart' in ae) { selStart = ae.selectionStart; selEnd = ae.selectionEnd; } } catch (e) {}
        // settle: copy attributes of old elements with the same id so CSS transitions run
        const oldById = new Map();
        if (style === 'innerHTML' || style === 'outerHTML') {
          const scope = style === 'outerHTML' ? [swapTarget] : [];
          [...scope, ...(swapTarget.querySelectorAll ? swapTarget.querySelectorAll('[id]') : [])].forEach(o => { if (o.id) oldById.set(o.id, o); });
        }
        const parent = swapTarget.parentElement;
        const nodes = doSwap(swapTarget, content, style, spec);
        const settleTasks = [];
        nodes.filter(isEl).forEach(n => {
          [n, ...n.querySelectorAll('[id]')].forEach(nn => {
            const old = nn.id && oldById.get(nn.id);
            if (!old || old === nn) return;
            const saved = SETTLE_ATTRS.map(a => [a, nn.getAttribute(a)]);
            SETTLE_ATTRS.forEach(a => { const ov = old.getAttribute(a); ov == null ? nn.removeAttribute(a) : nn.setAttribute(a, ov); });
            settleTasks.push(() => saved.forEach(([a, val]) => val == null ? nn.removeAttribute(a) : nn.setAttribute(a, val)));
          });
          n.classList.add(hyperConfig.addedClass);
        });
        if (swapTarget.classList) { swapTarget.classList.remove(hyperConfig.swappingClass); if (!hadClassAttr && !swapTarget.classList.length) swapTarget.removeAttribute('class'); }
        if (title != null && !spec.ignoreTitle) document.title = title;
        runScripts(nodes);
        nodes.filter(isEl).forEach(n => { if (n.isConnected) $.process(n); });
        if (aeId && (!ae.isConnected)) {
          const n = document.getElementById(aeId);
          if (n && n !== ae) { n.focus({ preventScroll: !spec.focusScroll }); try { if (selStart != null) n.setSelectionRange(selStart, selEnd); } catch (e) {} }
        }
        const landed = swapTarget.isConnected ? swapTarget : (nodes.find(n => isEl(n) && n.isConnected) || parent || document.body);
        hfire(landed, 'kj:afterSwap', Object.assign({}, ctx.settleDetail, { target: landed, elt: ctx.source }));
        triggerHeader(ctx.source || landed, H(ctx.res, 'Trigger-After-Swap'));
        // scrolling
        if (spec.scroll) {
          const st = spec.scrollTarget ? (spec.scrollTarget === 'window' ? window : hyperQuery(landed, spec.scrollTarget, false)) : landed;
          if (st === window) window.scrollTo(0, spec.scroll === 'top' ? 0 : document.documentElement.scrollHeight);
          else if (st) st.scrollTop = spec.scroll === 'top' ? 0 : st.scrollHeight;
        }
        if (spec.show && spec.show !== 'none') {
          const st = spec.showTarget ? (spec.showTarget === 'window' ? window : hyperQuery(landed, spec.showTarget, false)) : landed;
          if (st === window) window.scrollTo({ top: spec.show === 'top' ? 0 : document.documentElement.scrollHeight, behavior: 'instant' });
          else if (st && st.scrollIntoView) st.scrollIntoView({ block: spec.show === 'top' ? 'start' : 'end' });
        }
        const kjLoadOn = swapTarget.isConnected ? swapTarget : (parent && parent.isConnected ? parent : landed);
        hfire(kjLoadOn, 'kj:load', Object.assign({}, ctx.settleDetail, { elt: kjLoadOn }));
        nodes.filter(isEl).forEach(n => onLoadFns.forEach(fn => { try { fn(n); } catch (e) { warn('onLoad', e); } }));
        if (landed.classList) landed.classList.add(hyperConfig.settlingClass);
        setTimeout(() => {
          settleTasks.forEach(f => f());
          nodes.filter(isEl).forEach(n => { n.classList.remove(hyperConfig.addedClass); if (!n.classList.length) n.removeAttribute('class'); });
          if (landed.classList) { landed.classList.remove(hyperConfig.settlingClass); if (!landed.classList.length) landed.removeAttribute('class'); }
          hfire(landed, 'kj:afterSettle', Object.assign({}, ctx.settleDetail, { target: landed, elt: ctx.source }));
          triggerHeader(ctx.source || landed, H(ctx.res, 'Trigger-After-Settle'));
          resolveSwap(nodes);
        }, spec.settleDelay);
      };
      const go = () => {
        if (spec.transition && document.startViewTransition) {
          const vt = document.startViewTransition(() => perform());
          vt.ready && vt.ready.catch(() => {});
        } else perform();
      };
      spec.swapDelay > 0 ? setTimeout(go, spec.swapDelay) : go();
    });
  }
  const onLoadFns = [];

  /* ---------------- history ---------------- */
  const HIST_KEY = 'kj-history-cache';
  let memHistory = [];
  const historyElt = () => document.querySelector(PREFIXES.map(p => '[' + p + 'history-elt]').join(',')) || document.body;
  function readHistCache() { try { return JSON.parse(sessionStorage.getItem(HIST_KEY)) || []; } catch (e) { return memHistory; } }
  function writeHistCache(c) { memHistory = c; try { sessionStorage.setItem(HIST_KEY, JSON.stringify(c)); } catch (e) { /* quota or blocked: memory only */ } }
  function saveHistorySnapshot() {
    if (!hyperConfig.historyEnabled) return;
    const elt = historyElt();
    if (document.querySelector(PREFIXES.map(p => '[' + p + 'history="false"]').join(','))) return;
    if (!hfire(elt, 'kj:beforeHistorySave', { historyElt: elt })) return;
    const clone = elt.cloneNode(true);
    clone.querySelectorAll('.' + hyperConfig.requestClass).forEach(n => n.classList.remove(hyperConfig.requestClass));
    const entry = { url: location.href, content: clone.innerHTML, title: document.title, scroll: window.scrollY };
    const cache = readHistCache().filter(e => e.url !== entry.url);
    cache.push(entry);
    writeHistCache(cache.slice(-hyperConfig.historyCacheSize));
  }
  let historyPrimed = false;
  function pushHistory(url, replace) {
    if (!url || !hyperConfig.historyEnabled) return;
    if (!historyPrimed) { historyPrimed = true; try { history.replaceState({ kj: true }, '', location.href); } catch (e) {} }
    try { history[replace ? 'replaceState' : 'pushState']({ kj: true }, '', url); } catch (e) { warn('history', e); return; }
    hfire(document.body, replace ? 'kj:replacedInHistory' : 'kj:pushedIntoHistory', { path: url });
  }
  async function restoreHistory() {
    const url = location.href, elt = historyElt();
    const hit = readHistCache().find(e => e.url === url);
    if (hit) {
      elt.innerHTML = hit.content; document.title = hit.title;
      runScripts([...elt.children]);
      $.process(elt);
      setTimeout(() => window.scrollTo(0, hit.scroll), 0);
      hfire(elt, 'kj:historyRestore', { path: url, cacheHit: true });
      return;
    }
    if (hyperConfig.refreshOnHistoryMiss) { location.reload(); return; }
    try {
      const r = await request({ url, headers: { 'HX-Request': 'true', 'HX-History-Restore-Request': 'true' }, dataType: 'text', global: false });
      const doc = new DOMParser().parseFromString(r.text, 'text/html');
      const src = doc.querySelector(PREFIXES.map(p => '[' + p + 'history-elt]').join(',')) || doc.body;
      elt.innerHTML = src.innerHTML;
      const t = doc.querySelector('title'); if (t) document.title = t.textContent;
      runScripts([...elt.children]);
      $.process(elt);
      hfire(elt, 'kj:historyRestore', { path: url, cacheHit: false });
    } catch (e) { location.reload(); }
  }
  window.addEventListener('popstate', e => { if (e.state && e.state.kj) { saveHistoryOnPop(); restoreHistory(); } });
  function saveHistoryOnPop() { /* the page we are leaving was already snapshotted when we navigated away from it */ }

  /* ---------------- boost ---------------- */
  function isBoostable(el) {
    if (el.tagName === 'A') {
      const href = el.getAttribute('href');
      return !!href && !href.startsWith('#') && !/^(javascript|mailto|tel):/i.test(href) && (!el.target || el.target === '_self') && !el.hasAttribute('download') && sameOrigin(el.href);
    }
    if (el.tagName === 'FORM') return sameOrigin(el.action || location.href) && (!el.target || el.target === '_self');
    return false;
  }
  const hasVerb = el => HYPER_VERBS.some(v => ownAttr(el, v) != null);
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target && e.target.closest && e.target.closest('a[href]');
    if (!a || hasVerb(a) || hattr(a, 'boost') !== 'true' || !isBoostable(a) || inDisabledZone(a)) return;
    if (a.pathname === location.pathname && a.search === location.search && a.hash) return;     // same-page anchor
    e.preventDefault();
    issueRequest(a, 'get', a.href, { boosted: true, event: e });
  });
  document.addEventListener('submit', e => {
    const f = e.target;
    if (e.defaultPrevented || !f || f.tagName !== 'FORM' || hasVerb(f) || hattr(f, 'boost') !== 'true' || !isBoostable(f) || inDisabledZone(f)) return;
    e.preventDefault();
    const method = ((e.submitter && e.submitter.getAttribute('formmethod')) || f.getAttribute('method') || 'get').toLowerCase();
    const action = (e.submitter && e.submitter.getAttribute('formaction')) || f.getAttribute('action') || location.href;
    issueRequest(f, method === 'dialog' ? 'get' : method, new URL(action, location.href).href, { boosted: true, event: e });
  });
  const inDisabledZone = el => !!el.closest(PREFIXES.map(p => '[' + p + 'disable]').join(','));

  /* ---------------- triggers ---------------- */
  function defaultTrigger(el) {
    if (el.tagName === 'FORM') return 'submit';
    if (el.matches('input:not([type=button]):not([type=submit]):not([type=reset]):not([type=image]),select,textarea')) return 'change';
    return 'click';
  }
  function parseTriggers(spec) {
    return splitTopLevel(spec).map(s => s.trim()).filter(Boolean).map(part => {
      const t = { mods: {} };
      let m = part.match(/^every\s+(\S+)(?:\s*\[([\s\S]*)\])?/);
      if (m) { t.every = parseTime(m[1]); t.filter = m[2]; return t; }
      m = part.match(/^([^\s\[]+)(?:\[([\s\S]*?)\])?\s*([\s\S]*)$/);
      t.event = m[1]; t.filter = m[2];
      const toks = m[3].split(/\s+/).filter(Boolean);
      for (let i = 0; i < toks.length; i++) {
        const tok = toks[i]; const [k, ...rest] = tok.split(':'); let v = rest.join(':');
        if (!rest.length) { t.mods[tok] = true; continue; }
        if ((k === 'from' || k === 'target' || k === 'root') && /^(closest|find|next|previous)$/.test(v) && toks[i + 1]) v += ' ' + toks[++i];
        t.mods[k] = v;
      }
      return t;
    });
  }
  function makeFilter(expr, el) {
    if (!expr) return null;
    let fn; try { fn = new Function('event', 'with(event){ return (' + expr + ') }'); } catch (e) { warn('bad trigger filter', expr); return () => false; }
    return evt => { try { return !!fn.call(el, evt); } catch (e) { warn('trigger filter', expr, e); return false; } };
  }

  function processHyperElement(el) {
    const d = nodeData(el);
    if (d.hyperBound) return;
    const verb = HYPER_VERBS.find(v => ownAttr(el, v) != null);
    if (!verb) return;
    d.hyperBound = true;
    const cleanups = d.cleanups || (d.cleanups = []);
    const go = (evt, extra) => issueRequest(el, verb, ownAttr(el, verb) || location.href, Object.assign({ event: evt }, extra));
    const triggers = parseTriggers(ownAttr(el, 'trigger') || defaultTrigger(el));
    for (const t of triggers) {
      const filter = makeFilter(t.filter, el);
      if (t.every) {
        const id = setInterval(() => {
          if (!el.isConnected || nodeData(el).hyperStop) { clearInterval(id); return; }
          if (filter && !filter({ target: el })) return;
          go(undefined);
        }, t.every);
        cleanups.push(() => clearInterval(id));
        continue;
      }
      const mods = t.mods;
      let fired = false, lastVal, throttleUntil = 0, timer;
      const fire = evt => {
        if (mods.once && fired) return;
        fired = true;
        const q = mods.queue;
        const run = () => go(evt, q ? { queue: q } : undefined);
        if (mods.delay) { clearTimeout(timer); timer = setTimeout(run, parseTime(mods.delay)); }
        else if (mods.throttle) { const n = Date.now(); if (n < throttleUntil) return; throttleUntil = n + parseTime(mods.throttle); run(); }
        else run();
      };
      if (t.event === 'load') { const run = () => fire(new CustomEvent('load')); mods.delay ? setTimeout(run, 0) : queueMicrotask(run); continue; }
      if (t.event === 'revealed' || t.event === 'intersect') {
        if (!window.IntersectionObserver) { fire(); continue; }
        const io = new IntersectionObserver(entries => entries.forEach(en => {
          if (!en.isIntersecting) return;
          if (filter && !filter(en)) return;
          if (t.event === 'revealed' || mods.once) io.disconnect();
          fire(en);
        }), { root: mods.root ? hyperQuery(el, mods.root, false) : null, threshold: mods.threshold ? parseFloat(mods.threshold) : 0 });
        io.observe(el);
        cleanups.push(() => io.disconnect());
        continue;
      }
      const sources = mods.from ? hyperQuery(el, mods.from, true) : [el];
      const handler = evt => {
        if (filter && !filter(evt)) return;
        if (mods.target && !(evt.target && evt.target.matches && evt.target.matches(mods.target))) return;
        if (mods.changed) {
          const v = (mods.from ? evt.target : el).value;
          if (v === lastVal) return; lastVal = v;
        }
        if (mods.consume) evt.stopPropagation();
        if (evt.type === 'submit' || (el.tagName === 'A' && evt.type === 'click' && el.getAttribute('href')) ||
          (evt.type === 'click' && el.closest('form') && el.matches('button:not([type]),[type=submit]'))) evt.preventDefault();
        fire(evt);
      };
      if (mods.changed) lastVal = el.value;
      sources.forEach(src => { src.addEventListener(t.event, handler); cleanups.push(() => src.removeEventListener(t.event, handler)); });
    }
  }
  function processHyper(root) {
    if (!root || !root.querySelectorAll) return;
    const els = (isEl(root) && root.matches(VERB_SELECTOR) ? [root] : []).concat(qsa(root, VERB_SELECTOR));
    for (const el of els) {
      if (inDisabledZone(el) || el.closest('template')) continue;
      processHyperElement(el);
    }
  }

  /* ---------------- public API ---------------- */
  $.hyper = {
    config: hyperConfig,
    // $.hyper.ajax('get', '/x', '#target') · ('post', '/x', { source, target, swap, values, headers, select })
    ajax(verb, url, ctx) {
      verb = String(verb).toLowerCase();
      if (isStr(ctx) || isNode(ctx)) ctx = { target: ctx };
      ctx = ctx || {};
      const source = ctx.source ? $(ctx.source)[0] : (ctx.target ? $(ctx.target)[0] : document.body);
      const target = ctx.target ? (isStr(ctx.target) ? hyperQuery(source || document.body, ctx.target, false) : $(ctx.target)[0]) : undefined;
      return issueRequest(source || document.body, verb, url, { target, swap: ctx.swap, values: ctx.values, headers: ctx.headers, select: ctx.select, push: ctx.push });
    },
    swap(target, html, swap) { return swapResponse($(target)[0], html, parseSwap(swap || 'innerHTML')); },
    // swap every top-level element of an HTML string into the element with the same id (or per its kj-swap-oob)
    oob(html, source) { const { frag } = makeFragment(html); [...frag.children].forEach(n => oobSwap(n, null, source)); },
    process: el => processHyper($(el)[0] || document),
    find: (el, sel) => hyperQuery($(el)[0] || document.body, sel, false),
    findAll: (el, sel) => hyperQuery($(el)[0] || document.body, sel, true),
    trigger: (el, name, detail) => hfire($(el)[0], name, detail),
    onLoad: fn => { onLoadFns.push(fn); },
    defineSwap(name, fn) { swapExtensions[name] = fn; },
    parseSwap, parseTriggers, restoreHistory, saveHistorySnapshot,
  };
  $.onLoad = $.hyper.onLoad;

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
