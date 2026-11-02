/*!
 * jsKjs Drag add-on — pointer, touch and keyboard dragging in the style of GSAP's Draggable.
 * https://jskjs.org/features/draggable/ · MIT · load after jskjs.js
 *
 *   $.Draggable.create('.knob', { type: 'x', bounds: '.track', snap: { x: v => Math.round(v / 20) * 20 }, onDrag() { … } });
 *   $('.card').draggable({ bounds: 'body', inertia: true });
 */
(function (factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else factory(window.jsKjs);
})(function ($) {
  'use strict';
  if (!$ || !$.motion) throw new Error('jskjs.drag.js needs jskjs.js loaded first');
  const instances = new WeakMap();
  const clamp = (a, b, v) => v < a ? a : v > b ? b : v;
  const snapVal = (s, v) => s == null ? v : typeof s === 'function' ? s(v) : Array.isArray(s) ? $.utils.snap(s, v) : typeof s === 'number' ? Math.round(v / s) * s : v;

  class Draggable {
    constructor(target, vars = {}) {
      const el = this.target = $(target)[0];
      this.vars = vars;
      this.type = String(vars.type || 'x,y');
      this.axes = { x: /\bx\b|left/.test(this.type), y: /\by\b|top/.test(this.type), rot: /rotat/.test(this.type) };
      this.useLeftTop = /left|top/.test(this.type);
      this.handle = vars.trigger ? $(vars.trigger)[0] : el;
      this.enabled = false; this.isDragging = false; this.isPressed = false;
      const st = $.motion.getTransformState(el);
      this.x = this.useLeftTop ? (parseFloat(getComputedStyle(el).left) || 0) : st.x;
      this.y = this.useLeftTop ? (parseFloat(getComputedStyle(el).top) || 0) : st.y;
      this.rotation = st.rotate;
      this._down = this._down.bind(this); this._move = this._move.bind(this); this._up = this._up.bind(this); this._key = this._key.bind(this);
      this._clickBlock = e => { if (this._moved) { e.preventDefault(); e.stopPropagation(); this._moved = false; } };
      instances.set(el, this);
      if (vars.zIndexBoost !== false) this._z = 1000;
      this.enable();
    }
    enable() {
      if (this.enabled) return this;
      this.enabled = true;
      const h = this.handle;
      h.addEventListener('pointerdown', this._down);
      h.addEventListener('click', this._clickBlock, true);
      h.style.touchAction = this.axes.x && !this.axes.y ? 'pan-y' : this.axes.y && !this.axes.x ? 'pan-x' : 'none';
      h.style.cursor = this.vars.cursor || 'grab';
      h.style.userSelect = 'none';
      if (this.vars.keyboard !== false) {
        if (!h.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT)$/.test(h.tagName)) h.setAttribute('tabindex', '0');
        if (!h.hasAttribute('role')) h.setAttribute('role', this.axes.rot ? 'slider' : 'button');
        if (!h.hasAttribute('aria-roledescription')) h.setAttribute('aria-roledescription', 'draggable');
        h.addEventListener('keydown', this._key);
      }
      return this;
    }
    disable() {
      this.enabled = false;
      const h = this.handle;
      h.removeEventListener('pointerdown', this._down);
      h.removeEventListener('click', this._clickBlock, true);
      h.removeEventListener('keydown', this._key);
      h.style.cursor = '';
      return this;
    }
    kill() { this.disable(); instances.delete(this.target); return this; }
    _bounds() {
      const b = this.vars.bounds; if (!b) return null;
      if (b.minX !== undefined || b.maxX !== undefined || b.minY !== undefined || b.maxY !== undefined || b.minRotation !== undefined) {
        return { minX: b.minX ?? -Infinity, maxX: b.maxX ?? Infinity, minY: b.minY ?? -Infinity, maxY: b.maxY ?? Infinity, minR: b.minRotation ?? -Infinity, maxR: b.maxRotation ?? Infinity };
      }
      const be = b === window || b === 'window' ? null : $(b)[0];
      const br = be ? be.getBoundingClientRect() : { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
      const cs = be ? getComputedStyle(be) : null;
      const pl = cs ? parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth) : 0, pt = cs ? parseFloat(cs.paddingTop) + parseFloat(cs.borderTopWidth) : 0;
      const pr = cs ? parseFloat(cs.paddingRight) + parseFloat(cs.borderRightWidth) : 0, pb = cs ? parseFloat(cs.paddingBottom) + parseFloat(cs.borderBottomWidth) : 0;
      const r = this.target.getBoundingClientRect();
      const baseL = r.left - this.x, baseT = r.top - this.y;      // where the element would be at x = y = 0
      return { minX: br.left + pl - baseL, maxX: br.right - pr - r.width - baseL, minY: br.top + pt - baseT, maxY: br.bottom - pb - r.height - baseT, minR: -Infinity, maxR: Infinity };
    }
    _apply(x, y, rot) {
      const el = this.target;
      if (this.axes.rot) { this.rotation = rot; $.set(el, { rotate: rot }); return; }
      if (this.axes.x) this.x = x;
      if (this.axes.y) this.y = y;
      if (this.useLeftTop) { if (this.axes.x) el.style.left = this.x + 'px'; if (this.axes.y) el.style.top = this.y + 'px'; }
      else $.set(el, { x: this.x, y: this.y });
    }
    _resist(v, lo, hi) {
      if (v >= lo && v <= hi) return v;
      const r = this.vars.edgeResistance ?? 1;
      return v < lo ? lo - (lo - v) * (1 - r) : hi + (v - hi) * (1 - r);
    }
    _fire(name, e) { const f = this.vars[name]; if (f) f.call(this, e, this); $(this.target).trigger('kj:' + name.slice(2).toLowerCase(), [this]); }
    _down(e) {
      if (!this.enabled || (e.button !== undefined && e.button !== 0)) return;
      if (this.vars.dragClickables === false && e.target.closest('a,button,input,select,textarea,[contenteditable]') && e.target !== this.handle) return;
      if (this._tween) { this._tween.kill(); this._tween = null; }
      this.isPressed = true; this._moved = false;
      this.pointerX = this.startPointerX = e.clientX; this.pointerY = this.startPointerY = e.clientY;
      this.startX = this.x; this.startY = this.y; this.startRot = this.rotation;
      const r = this.target.getBoundingClientRect();
      this._center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      this._startAngle = Math.atan2(e.clientY - this._center.y, e.clientX - this._center.x) * 180 / Math.PI;
      this._b = this._bounds();
      this._samples = [{ t: performance.now(), x: this.x, y: this.y, r: this.rotation }];
      this._lock = null;
      try { this.handle.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
      this.handle.addEventListener('pointermove', this._move);
      this.handle.addEventListener('pointerup', this._up);
      this.handle.addEventListener('pointercancel', this._up);
      this._fire('onPress', e);
    }
    _move(e) {
      if (!this.isPressed) return;
      this.pointerX = e.clientX; this.pointerY = e.clientY;
      let dx = e.clientX - this.startPointerX, dy = e.clientY - this.startPointerY;
      if (!this.isDragging) {
        if (Math.hypot(dx, dy) < (this.vars.minimumMovement ?? 2)) return;
        this.isDragging = true; this._moved = true;
        if (this._z) { this.target.style.zIndex = String(++Draggable.zIndex); }
        this.handle.style.cursor = this.vars.activeCursor || 'grabbing';
        this._fire('onDragStart', e);
      }
      if (this.vars.lockAxis && !this._lock) this._lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (this._lock === 'x') dy = 0; if (this._lock === 'y') dx = 0;
      const b = this._b, live = this.vars.liveSnap, snap = this.vars.snap || {};
      let x = this.startX + dx, y = this.startY + dy, rot = this.rotation;
      if (this.axes.rot) {
        const a = Math.atan2(e.clientY - this._center.y, e.clientX - this._center.x) * 180 / Math.PI;
        let d = a - this._startAngle; rot = this.startRot + d;
        if (b) rot = this._resist(rot, b.minR, b.maxR);
        if (live) rot = snapVal(live === true ? (snap.rotation ?? snap) : (live.rotation ?? live), rot);
      } else {
        if (b) { x = this._resist(x, b.minX, b.maxX); y = this._resist(y, b.minY, b.maxY); }
        if (live) { const L = live === true ? snap : live; const one = typeof L === 'function' || Array.isArray(L) || typeof L === 'number'; x = snapVal(one ? L : L.x, x); y = snapVal(one ? L : L.y, y); }
      }
      this._apply(x, y, rot);
      this._samples.push({ t: performance.now(), x: this.x, y: this.y, r: this.rotation });
      if (this._samples.length > 6) this._samples.shift();
      this._fire('onDrag', e);
    }
    _up(e) {
      if (!this.isPressed) return;
      this.isPressed = false;
      this.handle.removeEventListener('pointermove', this._move);
      this.handle.removeEventListener('pointerup', this._up);
      this.handle.removeEventListener('pointercancel', this._up);
      this.handle.style.cursor = this.vars.cursor || 'grab';
      const wasDragging = this.isDragging;
      this.isDragging = false;
      this._fire('onRelease', e);
      if (!wasDragging) { this._fire('onClick', e); return; }
      this._settle();
      this._fire('onDragEnd', e);
    }
    // after release: momentum (inertia), bounds and snapping, animated with Motion
    _settle() {
      const b = this._b || this._bounds(), snap = this.vars.snap || {}, s = this._samples, v = { x: 0, y: 0, r: 0 };
      if (s.length > 1) { const a = s[0], z = s[s.length - 1], dt = Math.max(16, z.t - a.t) / 1000; v.x = (z.x - a.x) / dt; v.y = (z.y - a.y) / dt; v.r = (z.r - a.r) / dt; }
      this.velocity = v;
      const throwT = this.vars.inertia ? 0.35 : 0;
      let x = this.x + v.x * throwT, y = this.y + v.y * throwT, r = this.rotation + v.r * throwT;
      if (b) { x = clamp(b.minX, b.maxX, x); y = clamp(b.minY, b.maxY, y); r = clamp(b.minR, b.maxR, r); }
      if (typeof snap === 'function' || Array.isArray(snap) || typeof snap === 'number') { x = snapVal(snap, x); y = snapVal(snap, y); r = snapVal(snap, r); }
      else { x = snapVal(snap.x, x); y = snapVal(snap.y, y); r = snapVal(snap.rotation, r); if (snap.points) { let best = null, bd = snap.radius ?? Infinity; snap.points.forEach(pt => { const d = Math.hypot(pt.x - x, pt.y - y); if (d <= bd) { bd = d; best = pt; } }); if (best) { x = best.x; y = best.y; } } }
      const same = Math.abs(x - this.x) < 0.5 && Math.abs(y - this.y) < 0.5 && Math.abs(r - this.rotation) < 0.5;
      if (same) { this._apply(x, y, r); return; }
      const proxy = { x: this.x, y: this.y, r: this.rotation };
      this._tween = $.to(proxy, { x, y, r, duration: this.vars.inertia ? Math.min(1.2, 0.3 + Math.hypot(v.x, v.y) / 4000) : 0.25, ease: 'power3.out',
        onUpdate: () => { this._apply(proxy.x, proxy.y, proxy.r); this.vars.onThrowUpdate && this.vars.onThrowUpdate.call(this, this); },
        onComplete: () => { this._tween = null; this.vars.onThrowComplete && this.vars.onThrowComplete.call(this, this); } });
    }
    _key(e) {
      const step = e.shiftKey ? 50 : 10, map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const m = map[e.key]; if (!m) return;
      e.preventDefault();
      const b = this._bounds();
      if (this.axes.rot) { const r = this.rotation + (m[0] || -m[1]) / 2; this._apply(0, 0, b ? clamp(b.minR, b.maxR, r) : r); }
      else { let x = this.x + (this.axes.x ? m[0] : 0), y = this.y + (this.axes.y ? m[1] : 0); if (b) { x = clamp(b.minX, b.maxX, x); y = clamp(b.minY, b.maxY, y); } this._apply(x, y, 0); }
      this._fire('onDrag', e); this._fire('onDragEnd', e);
    }
    update() { const st = $.motion.getTransformState(this.target); this.x = st.x; this.y = st.y; this.rotation = st.rotate; return this; }
    hitTest(other, threshold) { return Draggable.hitTest(this.target, other, threshold); }
    getDirection() { const dx = this.x - this.startX, dy = this.y - this.startY; return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'); }
    static create(targets, vars) { return $(targets).get().map(el => new Draggable(el, vars)); }
    static get(el) { return instances.get($(el)[0]); }
    // true if the two overlap; threshold "50%" requires that much of the smaller box to overlap, a number is px
    static hitTest(a, b, threshold = 0) {
      const ra = $(a)[0].getBoundingClientRect(), rb = b && b.clientX !== undefined ? { left: b.clientX, right: b.clientX, top: b.clientY, bottom: b.clientY, width: 0, height: 0 } : $(b)[0].getBoundingClientRect();
      const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (w < 0 || h < 0) return false;
      if (typeof threshold === 'string' && threshold.endsWith('%')) { const min = Math.min(ra.width * ra.height, rb.width * rb.height) || 1; return w * h / min * 100 >= parseFloat(threshold); }
      return w >= threshold && h >= threshold;
    }
  }
  Draggable.zIndex = 1000;
  $.Draggable = Draggable;
  $.fn.draggable = function (vars) { this.each((_, el) => { new Draggable(el, vars); }); return this; };
  return Draggable;
});
