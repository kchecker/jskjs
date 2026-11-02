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
