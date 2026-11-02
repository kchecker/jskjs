/*!
 * jsKjs Flip add-on — animate layout changes (First, Last, Invert, Play), in the style of GSAP's Flip.
 * https://jskjs.org/features/flip/ · MIT · load after jskjs.js
 *
 *   const state = $.Flip.getState('.card');
 *   $('#grid').toggleClass('list');                    // change layout however you like
 *   $.Flip.from(state, { duration: 0.6, ease: 'power2.inOut', stagger: 0.03 });
 *   // or in one go:  $('.card').flip(() => $('#grid').toggleClass('list'), { duration: 0.6 });
 */
(function (factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else factory(window.jsKjs);
})(function ($) {
  'use strict';
  if (!$ || !$.motion) throw new Error('jskjs.flip.js needs jskjs.js loaded first');
  const flipping = new WeakMap();
  const key = el => el.getAttribute('data-flip-id') || el;
  const visible = el => el.isConnected && !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  const toEls = t => $(t).get();
  function clearTransform(el) {
    const st = $.motion.getTransformState(el);
    Object.assign(st, { x: 0, y: 0, xPercent: 0, yPercent: 0, scaleX: 1, scaleY: 1, rotate: 0, skewX: 0, skewY: 0 });
    $.motion.applyTransform(el);
  }
  function record(el, props) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const o = { el, id: key(el), left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height,
      visible: visible(el), opacity: parseFloat(cs.opacity), props: {} };
    props.forEach(p => { o.props[p] = cs[p]; });
    return o;
  }
  class FlipState {
    constructor(targets, opts = {}) {
      this.props = typeof opts.props === 'string' ? opts.props.split(',').map(s => s.trim()) : (opts.props || []);
      this.items = toEls(targets).map(el => record(el, this.props));
      this.byId = new Map(this.items.map(i => [i.id, i]));
    }
    getElementState(el) { return this.byId.get(key(el)); }
    update() { this.items = this.items.map(i => record(i.el, this.props)); this.byId = new Map(this.items.map(i => [i.id, i])); return this; }
    clear() { this.items = []; this.byId.clear(); return this; }
  }
  const getState = (targets, opts) => new FlipState(targets, typeof opts === 'string' ? { props: opts } : opts);

  function from(state, vars = {}) {
    vars = Object.assign({ duration: 0.5, ease: 'power1.inOut' }, vars);
    const { scale = true, absolute = false, onEnter, onLeave, spin, props: _p, targets, simple, prune, toggleClass, ...tlVars } = vars;
    const doc = document;
    const current = targets ? toEls(targets) : state.items.map(i => {
      if (typeof i.id === 'string') return doc.querySelector('[data-flip-id="' + CSS.escape(i.id) + '"]') || i.el;
      return i.el;
    });
    const tl = $.timeline({ onComplete: tlVars.onComplete, onStart: tlVars.onStart, onUpdate: tlVars.onUpdate, paused: tlVars.paused, delay: tlVars.delay });
    const entering = [], leaving = [], moving = [];
    current.forEach(el => {
      if (!el.isConnected) return;
      const old = state.byId.get(key(el));
      if (!old || !old.visible) { if (visible(el)) entering.push(el); return; }
      if (!visible(el)) { leaving.push(el); return; }
      moving.push([el, old]);
    });
    state.items.forEach(i => { if (i.visible && !current.some(c => key(c) === i.id) && i.el.isConnected && !visible(i.el)) leaving.push(i.el); });
    // measure the new layout with transforms cleared
    moving.forEach(([el]) => { (flipping.get(el) || []).forEach(t => t.kill()); clearTransform(el); });
    const measured = moving.map(([el, old]) => {
      const r = el.getBoundingClientRect();
      return { el, old, now: { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height } };
    });
    const restore = [];
    if (absolute) measured.forEach(({ el }) => {
      const s = el.getAttribute('style');
      restore.push(() => s == null ? el.removeAttribute('style') : el.setAttribute('style', s));
      const left = el.offsetLeft, top = el.offsetTop, w = el.offsetWidth, h = el.offsetHeight;
      Object.assign(el.style, { position: 'absolute', left: left + 'px', top: top + 'px', width: w + 'px', height: h + 'px', margin: '0', boxSizing: 'border-box' });
    });
    const each = tlVars.duration, ease = tlVars.ease, stagger = tlVars.stagger || 0;
    measured.forEach(({ el, old, now }, i) => {
      const dx = old.left - now.left, dy = old.top - now.top;
      const fromV = { x: dx, y: dy }, toV = { x: 0, y: 0, duration: each, ease };
      if (scale) {
        el.style.transformOrigin = '0 0';
        fromV.scaleX = now.width ? old.width / now.width : 1; fromV.scaleY = now.height ? old.height / now.height : 1;
        toV.scaleX = 1; toV.scaleY = 1;
      } else if (!simple) {
        fromV.width = old.width; fromV.height = old.height; toV.width = now.width; toV.height = now.height;
      }
      if (spin) { fromV.rotate = typeof spin === 'number' ? spin * 360 : 360; toV.rotate = 0; }
      state.props.forEach(p => { if (old.props[p] !== undefined) { fromV[p] = old.props[p]; toV[p] = getComputedStyle(el)[p]; } });
      if (prune && Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(old.width - now.width) < 1 && Math.abs(old.height - now.height) < 1) return;
      const tw = $.fromTo(el, fromV, Object.assign(toV, { immediateRender: true, overwrite: false, paused: true }));
      flipping.set(el, [tw]);
      tl.add(tw, i * (typeof stagger === 'number' ? stagger : (stagger.each || 0)));
    });
    if (onEnter && entering.length) { const a = onEnter(entering); if (a && a.totalDuration) tl.add(a, 0); }
    if (onLeave && leaving.length) { const a = onLeave(leaving); if (a && a.totalDuration) tl.add(a, 0); }
    if (toggleClass) { [...measured.map(m => m.el), ...entering].forEach(e => e.classList.add(toggleClass)); }
    tl.call(() => {
      restore.forEach(f => f());
      measured.forEach(({ el }) => { if (!scale && !simple) { el.style.width = ''; el.style.height = ''; } clearTransform(el); el.style.transformOrigin = ''; flipping.delete(el); if (toggleClass) el.classList.remove(toggleClass); });
      entering.forEach(e => toggleClass && e.classList.remove(toggleClass));
    });
    return tl;
  }
  // Move/scale `el` so it visually matches `target` (an element or a recorded state)
  function fit(el, target, vars = {}) {
    el = $(el)[0];
    const t = target instanceof FlipState ? target.items[0] : (() => { const r = $(target)[0].getBoundingClientRect(); return { left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height }; })();
    clearTransform(el);
    const r = el.getBoundingClientRect();
    const v = { x: t.left - (r.left + scrollX), y: t.top - (r.top + scrollY), scaleX: r.width ? t.width / r.width : 1, scaleY: r.height ? t.height / r.height : 1 };
    el.style.transformOrigin = '0 0';
    return vars.duration ? $.to(el, Object.assign(v, vars)) : $.set(el, v);
  }
  const Flip = { getState, from, fit,
    to(state, vars) { const now = getState(state.items.map(i => i.el), { props: state.props }); return from(now, vars); },
    isFlipping: el => flipping.has($(el)[0]), killFlipsOf: el => toEls(el).forEach(e => (flipping.get(e) || []).forEach(t => t.kill())),
    FlipState };
  $.Flip = Flip;
  $.flip = (targets, change, vars) => { const s = getState(targets, vars && vars.props); change(); return from(s, vars); };
  $.fn.flip = function (change, vars) { return $.flip(this, change, vars); };
  return Flip;
});
