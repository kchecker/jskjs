/*!
 * jsKjs Live add-on — Server-Sent Events and WebSockets for Hyper (htmx's sse & ws extensions).
 * https://jskjs.org/features/server-sent-events/ · MIT · load after jskjs.js
 *
 *   <div kj-sse-connect="/api/stream.php">
 *     <ul kj-sse-swap="message" kj-swap="beforeend"></ul>      ← each "message" event's data is swapped in
 *     <button kj-get="/latest" kj-trigger="sse:refresh">…</button>  ← an SSE event as a request trigger
 *   </div>
 *   <div kj-ws-connect="/chat">  <form kj-ws-send>…</form>  <div id="log"></div>  </div>
 */
(function (factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else factory(window.jsKjs);
})(function ($) {
  'use strict';
  if (!$ || !$.hyper) throw new Error('jskjs.live.js needs jskjs.js loaded first');
  const P = ['kj-', 'hx-', 'data-kj-'];
  const attr = (el, n) => { for (const p of P) { const v = el.getAttribute(p + n); if (v != null) return v; } return null; };
  const sel = n => P.map(p => '[' + p + n + ']').join(',');
  const bound = new WeakSet();
  const live = $.live = { sources: new Set(), sockets: new Set(), maxBackoff: 30000 };

  function closestWithin(root, el, name) { const c = el.closest(sel(name)); return c === root; }

  /* ---------------- SSE ---------------- */
  function connectSSE(root) {
    const url = attr(root, 'sse-connect');
    let es = null, tries = 0, closed = false, listeners = new Map();
    const swapTargets = () => [root, ...root.querySelectorAll(sel('sse-swap'))].filter(n => attr(n, 'sse-swap') != null && closestWithin(root, n, 'sse-connect'));
    const triggerTargets = () => [root, ...root.querySelectorAll('[kj-trigger*="sse:"],[hx-trigger*="sse:"],[data-kj-trigger*="sse:"]')].filter(n => closestWithin(root, n, 'sse-connect'));
    const wanted = () => {
      const names = new Set();
      swapTargets().forEach(n => attr(n, 'sse-swap').split(',').forEach(s => names.add(s.trim())));
      triggerTargets().forEach(n => ((attr(n, 'trigger') || '').match(/sse:([\w.-]+)/g) || []).forEach(s => names.add(s.slice(4))));
      const close = attr(root, 'sse-close'); if (close) names.add(close);
      return names;
    };
    const handle = name => e => {
      if (!root.isConnected) { shutdown(); return; }
      $.hyper.trigger(root, 'kj:sseMessage', { type: name, data: e.data, lastEventId: e.lastEventId });
      swapTargets().forEach(n => {
        if (!attr(n, 'sse-swap').split(',').map(s => s.trim()).includes(name)) return;
        $.hyper.swap(n, e.data, attr(n, 'swap') || 'innerHTML');
      });
      triggerTargets().forEach(n => n.dispatchEvent(new CustomEvent('sse:' + name, { detail: { data: e.data } })));
      if (attr(root, 'sse-close') === name) shutdown();
    };
    const open = () => {
      if (closed) return;
      es = new EventSource(url, { withCredentials: attr(root, 'sse-credentials') === 'true' });
      live.sources.add(es);
      listeners = new Map();
      wanted().forEach(name => { const h = handle(name); listeners.set(name, h); es.addEventListener(name, h); });
      es.onopen = () => { tries = 0; $.hyper.trigger(root, 'kj:sseOpen', { source: es }); };
      es.onerror = () => {
        $.hyper.trigger(root, 'kj:sseError', { source: es });
        if (es.readyState === EventSource.CLOSED && !closed) { live.sources.delete(es); setTimeout(open, Math.min(live.maxBackoff, 500 * 2 ** tries++)); }
      };
    };
    const shutdown = () => { closed = true; if (es) { es.close(); live.sources.delete(es); } $.hyper.trigger(root.isConnected ? root : document.body, 'kj:sseClose', { url }); };
    open();
    $.addCleanup(root, shutdown);
    root._kjSSE = { close: shutdown, get source() { return es; } };
  }

  /* ---------------- WebSocket ---------------- */
  function wsUrl(u) { const url = new URL(u, location.href); if (url.protocol === 'http:') url.protocol = 'ws:'; if (url.protocol === 'https:') url.protocol = 'wss:'; return url.href; }
  function connectWS(root) {
    const url = wsUrl(attr(root, 'ws-connect'));
    let ws = null, tries = 0, closed = false;
    const queue = [];
    const open = () => {
      if (closed) return;
      ws = new WebSocket(url);
      live.sockets.add(ws);
      ws.onopen = () => { tries = 0; $.hyper.trigger(root, 'kj:wsOpen', { socket: ws }); while (queue.length && ws.readyState === 1) ws.send(queue.shift()); };
      ws.onmessage = e => {
        if (!root.isConnected) { shutdown(); return; }
        const d = { message: e.data, socket: ws };
        if (!$.hyper.trigger(root, 'kj:wsBeforeMessage', d)) return;
        if (typeof e.data === 'string' && /^\s*</.test(e.data)) $.hyper.oob(e.data, root);
        $.hyper.trigger(root, 'kj:wsAfterMessage', d);
      };
      ws.onclose = ev => {
        live.sockets.delete(ws);
        $.hyper.trigger(root.isConnected ? root : document.body, 'kj:wsClose', { code: ev.code });
        if (!closed && ev.code !== 1000) setTimeout(open, Math.min(live.maxBackoff, 500 * 2 ** tries++));
      };
      ws.onerror = () => $.hyper.trigger(root, 'kj:wsError', { socket: ws });
    };
    const send = data => { const s = typeof data === 'string' ? data : JSON.stringify(data); if (ws && ws.readyState === 1) ws.send(s); else queue.push(s); };
    const shutdown = () => { closed = true; if (ws) ws.close(1000); };
    open();
    $.addCleanup(root, shutdown);
    root._kjWS = { send, close: shutdown, get socket() { return ws; } };
  }
  function bindSend(el) {
    const root = el.closest(sel('ws-connect'));
    if (!root) return;
    const evt = attr(el, 'trigger') || (el.tagName === 'FORM' ? 'submit' : 'click');
    const h = e => {
      e.preventDefault();
      const values = el.tagName === 'FORM' ? $(el).serializeObject() : (el.name ? { [el.name]: el.value } : {});
      let vals = {}; try { vals = JSON.parse(attr(el, 'vals') || '{}'); } catch (err) { /* ignore */ }
      const payload = Object.assign(values, vals, { HEADERS: { 'HX-Request': 'true', 'HX-Trigger': el.id || null, 'HX-Current-URL': location.href } });
      const d = { message: payload, elt: el };
      if (!$.hyper.trigger(el, 'kj:wsConfigSend', d)) return;
      root._kjWS && root._kjWS.send(d.message);
      if (el.tagName === 'FORM' && attr(el, 'ws-reset') !== 'false') el.reset();
    };
    el.addEventListener(evt, h);
    $.addCleanup(el, () => el.removeEventListener(evt, h));
  }

  function scan(root) {
    const scope = root.nodeType === 9 ? root.documentElement : root;
    const pick = name => [...(scope.matches && scope.matches(sel(name)) ? [scope] : []), ...scope.querySelectorAll(sel(name))];
    pick('sse-connect').forEach(n => { if (!bound.has(n)) { bound.add(n); connectSSE(n); } });
    pick('ws-connect').forEach(n => { if (!bound.has(n)) { bound.add(n); connectWS(n); } });
    pick('ws-send').forEach(n => { if (!bound.has(n)) { bound.add(n); bindSend(n); } });
  }
  $.onProcess(scan);
  live.close = el => { const n = $(el)[0]; n && n._kjSSE && n._kjSSE.close(); n && n._kjWS && n._kjWS.close(); };
  live.send = (el, data) => { const n = $(el).closest(sel('ws-connect'))[0] || $(el)[0]; n && n._kjWS && n._kjWS.send(data); };
  return live;
});
