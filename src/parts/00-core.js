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
