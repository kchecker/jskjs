/*!
 * jsKjs Scroll add-on — scroll-linked animation in the style of GSAP's ScrollTrigger.
 * https://jskjs.org/features/scroll-trigger/ · MIT · load after jskjs.js
 *
 *   $.to('.panel', { x: 400, scrollTrigger: { trigger: '.panel', start: 'top 80%', end: 'top 20%', scrub: true } });
 *   $.scrollTrigger({ trigger: '#hero', pin: true, end: '+=600', onUpdate: st => … });
 *   $.scrollTo('#pricing', { duration: 0.8, offset: 72 });
 */
(function (factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else factory(window.jsKjs);
})(function ($) {
  'use strict';
  if (!$ || !$.motion) throw new Error('jskjs.scroll.js needs jskjs.js loaded first');
  const win = window, doc = document;
  const all = [];
  const isWin = s => s === win || s === doc || s === doc.documentElement || s === doc.body;
  const el = v => v == null ? null : typeof v === 'string' ? doc.querySelector(v) : (v.jquery || v.jskjs) ? v[0] : v;
  const clamp = (a, b, v) => v < a ? a : v > b ? b : v;
  let uid = 0;

  function scrollPos(scroller, horiz) {
    if (isWin(scroller)) return horiz ? win.scrollX : win.scrollY;
    return horiz ? scroller.scrollLeft : scroller.scrollTop;
  }
  function viewportSize(scroller, horiz) {
    if (isWin(scroller)) return horiz ? win.innerWidth : win.innerHeight;
    return horiz ? scroller.clientWidth : scroller.clientHeight;
  }
  function maxScroll(scroller, horiz) {
    if (isWin(scroller)) { const d = doc.documentElement; return horiz ? d.scrollWidth - win.innerWidth : d.scrollHeight - win.innerHeight; }
    return horiz ? scroller.scrollWidth - scroller.clientWidth : scroller.scrollHeight - scroller.clientHeight;
  }
  // "top", "center", "bottom", "80%", "120px", "top+=40", "center-=10%"
  function parseEdge(spec, size) {
    const m = String(spec).trim().match(/^([a-z]+|-?[\d.]+(?:px|%)?)(?:([+-])=(-?[\d.]+)(px|%)?)?$/);
    if (!m) return 0;
    const base = m[1] === 'top' || m[1] === 'left' ? 0 : m[1] === 'center' ? size / 2 : m[1] === 'bottom' || m[1] === 'right' ? size
      : m[1].endsWith('%') ? parseFloat(m[1]) / 100 * size : parseFloat(m[1]);
    if (!m[2]) return base;
    const n = m[4] === '%' ? parseFloat(m[3]) / 100 * size : parseFloat(m[3]);
    return base + (m[2] === '-' ? -n : n);
  }
  function offsetIn(node, scroller, horiz) {
    const r = node.getBoundingClientRect();
    if (isWin(scroller)) return (horiz ? r.left : r.top) + scrollPos(scroller, horiz);
    const sr = scroller.getBoundingClientRect();
    return (horiz ? r.left - sr.left : r.top - sr.top) + scrollPos(scroller, horiz);
  }

  const ACTIONS = ['onEnter', 'onLeave', 'onEnterBack', 'onLeaveBack'];
  class ScrollTrigger {
    constructor(vars, animation) {
      this.vars = vars = Object.assign({}, vars);
      this.id = vars.id || 'st' + (++uid);
      this.animation = animation || (vars.animation) || null;
      this.trigger = el(vars.trigger) || (this.animation && this.animation.targets && this.animation.targets[0]) || null;
      this.scroller = el(vars.scroller) || win;
      this.horizontal = !!vars.horizontal;
      this.progress = 0; this.direction = 1; this.isActive = false; this.enabled = true;
      this._state = 'before';
      this.toggleActions = String(vars.toggleActions || 'play none none none').split(/\s+/);
      if (this.animation) {
        this.animation.pause();
        if (vars.scrub) this.animation.progress(0);
      }
      if (vars.pin) this._setupPin();
      if (vars.markers) this._setupMarkers();
      this._onScroll = () => this._schedule();
      (isWin(this.scroller) ? win : this.scroller).addEventListener('scroll', this._onScroll, { passive: true });
      all.push(this);
      this.refresh();
      ensureGlobal();
    }
    _schedule() { if (this._raf) return; this._raf = requestAnimationFrame(() => { this._raf = 0; this.update(); }); }
    refresh() {
      const v = this.vars, horiz = this.horizontal, sc = this.scroller;
      const pinned = this._pinState;
      if (pinned) this._unpinForMeasure();
      const vp = viewportSize(sc, horiz);
      const trig = this._spacer && this.trigger === this.pin ? this._spacer : this.trigger;
      const [ts, vs] = String(v.start || (v.pin ? 'top top' : 'top bottom')).split(/\s+(?=[a-z\d-])/).concat('top').slice(0, 2);
      if (typeof v.start === 'number') this.start = v.start;
      else if (isFn(v.start)) this.start = v.start(this);
      else if (trig) {
        const size = horiz ? trig.offsetWidth : trig.offsetHeight;
        this.start = offsetIn(trig, sc, horiz) + parseEdge(ts, size) - parseEdge(vs, vp);
      } else this.start = 0;
      const endSpec = v.end == null ? (v.pin ? '+=' + (horiz ? trig.offsetWidth : trig.offsetHeight) : 'bottom top') : v.end;
      if (typeof endSpec === 'number') this.end = endSpec;
      else if (isFn(endSpec)) this.end = endSpec(this);
      else if (/^\+=/.test(endSpec)) this.end = this.start + parseEdge(endSpec.slice(2).replace(/^(-?[\d.]+)$/, '$1px'), vp);
      else if (v.endTrigger || trig) {
        const et = el(v.endTrigger) || trig;
        const [te, ve] = String(endSpec).split(/\s+(?=[a-z\d-])/).concat('top').slice(0, 2);
        const size = horiz ? et.offsetWidth : et.offsetHeight;
        this.end = offsetIn(et, sc, horiz) + parseEdge(te, size) - parseEdge(ve, vp);
      }
      if (this.end <= this.start) this.end = this.start + 1;
      this.start = Math.max(0, this.start);
      if (this._spacer) this._sizeSpacer();
      if (this._markers) this._placeMarkers();
      this._state = null;            // force re-evaluation
      this.update(true);
      if (pinned && this._pinState === pinned) this._applyPin(pinned, true);
    }
    update(force) {
      if (!this.enabled && !force) return;
      const pos = scrollPos(this.scroller, this.horizontal);
      const prevP = this.progress;
      const p = clamp(0, 1, (pos - this.start) / (this.end - this.start));
      this.direction = pos >= (this._lastPos ?? pos) ? 1 : -1;
      this._lastPos = pos;
      const state = pos < this.start ? 'before' : pos > this.end ? 'after' : 'active';
      const prev = this._state;
      this.progress = p;
      if (prev !== state) {
        this._state = state;
        const was = prev === 'active', is = state === 'active';
        let action = null;
        if (prev !== null || state !== 'before') {
          if (is && prev === 'before') action = 'onEnter';
          else if (is && prev === 'after') action = 'onEnterBack';
          else if (was && state === 'after') action = 'onLeave';
          else if (was && state === 'before') action = 'onLeaveBack';
          else if (prev === 'before' && state === 'after') { this._fire('onEnter'); action = 'onLeave'; }
          else if (prev === 'after' && state === 'before') { this._fire('onEnterBack'); action = 'onLeaveBack'; }
          else if (prev === null && state === 'after') action = 'onLeave';
          else if (prev === null && is) action = 'onEnter';
        }
        if (was !== is) { this.isActive = is; if (this.vars.onToggle) this.vars.onToggle(this); this._toggleClass(is); }
        if (action) this._fire(action);
        if (this.vars.pin) this._applyPin(state);
        if (this.vars.once && state === 'after') { const a = this.animation; if (a && !this.vars.scrub) a.progress(1); this.kill(true); return; }
      }
      if (this.vars.scrub && this.animation) this._scrub(p, force);
      if (p !== prevP || force) this.vars.onUpdate && this.vars.onUpdate(this);
      if (this.vars.snap && !force) this._queueSnap();
    }
    _fire(name) {
      const cb = this.vars[name]; if (cb) cb(this);
      if (this.animation && !this.vars.scrub) {
        const act = this.toggleActions[ACTIONS.indexOf(name)];
        const a = this.animation;
        switch (act) {
          case 'play': a.play(); break;
          case 'pause': a.pause(); break;
          case 'resume': a.resume(); break;
          case 'reverse': a.reverse(); break;
          case 'restart': a.restart(); break;
          case 'reset': a.pause(0); break;
          case 'complete': a.progress(1).pause(); break;
        }
      }
    }
    _toggleClass(on) {
      const tc = this.vars.toggleClass; if (!tc) return;
      const cls = typeof tc === 'string' ? tc : tc.className;
      const targets = typeof tc === 'string' ? [this.trigger] : $(tc.targets).get();
      targets.forEach(t => t && t.classList.toggle(cls, on));
    }
    _scrub(p, force) {
      const a = this.animation, s = this.vars.scrub;
      if (s === true || force || typeof s !== 'number') { if (this._scrubTween) this._scrubTween.kill(); a.totalProgress(p); return; }
      if (this._scrubTween) this._scrubTween.kill();
      const proxy = { p: a.totalProgress() };
      this._scrubTween = $.to(proxy, { p, duration: s, ease: 'power3.out', overwrite: false, onUpdate: () => a.totalProgress(proxy.p) });
    }
    _queueSnap() {
      clearTimeout(this._snapT);
      this._snapT = setTimeout(() => {
        if (this._state !== 'active') return;
        let snap = this.vars.snap, target = null;
        const cfg = typeof snap === 'object' && !Array.isArray(snap) ? snap : { snapTo: snap };
        const to = cfg.snapTo;
        if (typeof to === 'number') target = Math.round(this.progress / to) * to;
        else if (Array.isArray(to)) target = $.utils.snap(to, this.progress);
        else if (to === 'labels' && this.animation && this.animation.labels) {
          const d = this.animation.duration() || 1;
          target = $.utils.snap(Object.values(this.animation.labels).map(t => t / d), this.progress);
        } else if (typeof to === 'function') target = to(this.progress, this);
        if (target == null || Math.abs(target - this.progress) < 0.001) return;
        $.scrollTo(this.start + (this.end - this.start) * target, { scroller: this.scroller, horizontal: this.horizontal, duration: cfg.duration ?? 0.4, ease: cfg.ease || 'power1.inOut' });
      }, (typeof this.vars.snap === 'object' && this.vars.snap.delay != null ? this.vars.snap.delay * 1000 : 150));
    }
    /* ---- pinning: the element is wrapped in a spacer that keeps its place in the layout ---- */
    _setupPin() {
      const pin = this.pin = this.vars.pin === true ? this.trigger : el(this.vars.pin);
      if (!pin) return;
      const sp = this._spacer = doc.createElement('div');
      sp.className = 'kj-pin-spacer';
      const cs = getComputedStyle(pin);
      sp.style.cssText = 'position:relative;box-sizing:border-box;display:' + (cs.display === 'inline' ? 'inline-block' : cs.display === 'flex' || cs.display === 'grid' ? 'block' : cs.display) + ';margin:' + cs.margin + ';';
      pin.parentNode.insertBefore(sp, pin);
      sp.appendChild(pin);
      pin.style.margin = '0';
      this._pinOrig = pin.getAttribute('style') || '';
      if (this.trigger === pin) this.trigger = pin;
    }
    _sizeSpacer() {
      const pin = this.pin, sp = this._spacer;
      const r = pin.getBoundingClientRect();
      const spacing = this.vars.pinSpacing === false ? 0 : this.end - this.start;
      sp.style.width = r.width + 'px';
      sp.style[this.horizontal ? 'width' : 'height'] = (this.horizontal ? r.width : r.height) + spacing + 'px';
      this._pinBox = { w: r.width, h: r.height };
    }
    _unpinForMeasure() { if (this.pin) { this.pin.setAttribute('style', this._pinOrig); this.pin.style.margin = '0'; } }
    _applyPin(state) {
      const pin = this.pin, sp = this._spacer; if (!pin) return;
      this._pinState = state;
      this._unpinForMeasure();
      const box = this._pinBox || { w: pin.offsetWidth, h: pin.offsetHeight };
      if (state === 'active') {
        if (isWin(this.scroller)) {
          const r = sp.getBoundingClientRect();
          const scrolled = scrollPos(this.scroller, this.horizontal) - this.start;
          pin.style.position = 'fixed';
          pin.style.width = box.w + 'px';
          pin.style.top = (this.horizontal ? r.top : r.top + scrolled) + 'px';
          pin.style.left = (this.horizontal ? r.left + scrolled : r.left) + 'px';
          pin.style.zIndex = pin.style.zIndex || '1';
        } else {
          const off = scrollPos(this.scroller, this.horizontal) - this.start;
          pin.style.transform = this.horizontal ? 'translateX(' + off + 'px)' : 'translateY(' + off + 'px)';
        }
      } else if (state === 'after') {
        pin.style.position = 'relative';
        pin.style[this.horizontal ? 'left' : 'top'] = (this.vars.pinSpacing === false ? 0 : this.end - this.start) + 'px';
      }
    }
    _setupMarkers() {
      const color = (this.vars.markers && this.vars.markers.startColor) || 'green', endColor = (this.vars.markers && this.vars.markers.endColor) || 'red';
      const mk = (txt, c, fixed) => { const m = doc.createElement('div'); m.className = 'kj-marker'; m.textContent = txt + (this.vars.id ? ' ' + this.vars.id : '');
        m.style.cssText = 'position:' + (fixed ? 'fixed' : 'absolute') + ';z-index:10000;font:11px/1.2 monospace;color:' + c + ';border-top:1px solid ' + c + ';padding:0 4px;pointer-events:none;' + (fixed ? 'right:0;' : 'right:40px;'); doc.body.appendChild(m); return m; };
      this._markers = { s: mk('start', color), e: mk('end', endColor), ss: mk('scroller-start', color, true), se: mk('scroller-end', endColor, true) };
    }
    _placeMarkers() {
      const m = this._markers, v = this.vars, vp = viewportSize(this.scroller, this.horizontal);
      const [, vs] = String(v.start || 'top bottom').split(/\s+(?=[a-z\d-])/).concat('top');
      const [, ve] = String(v.end && !/^\+=/.test(v.end) ? v.end : 'bottom top').split(/\s+(?=[a-z\d-])/).concat('top');
      m.ss.style.top = parseEdge(vs || 'top', vp) + 'px';
      m.se.style.top = parseEdge(/^\+=/.test(v.end || '') ? vs : (ve || 'top'), vp) + 'px';
      m.s.style.top = this.start + parseEdge(vs || 'top', vp) + 'px';
      m.e.style.top = this.end + parseEdge(/^\+=/.test(v.end || '') ? vs : (ve || 'top'), vp) + 'px';
    }
    getVelocity() { return this._velocity || 0; }
    enable() { this.enabled = true; this.refresh(); return this; }
    disable(revert) { this.enabled = false; if (revert !== false && this.pin) this._unpinForMeasure(); return this; }
    kill(keepAnimation) {
      (isWin(this.scroller) ? win : this.scroller).removeEventListener('scroll', this._onScroll);
      const i = all.indexOf(this); if (i >= 0) all.splice(i, 1);
      if (this._markers) Object.values(this._markers).forEach(m => m.remove());
      if (this._spacer && !this.vars.once) { this.pin.setAttribute('style', this._pinOrig); this._spacer.replaceWith(this.pin); this._spacer = null; }
      if (!keepAnimation && this.animation && this.vars.scrub) this.animation.kill();
      return this;
    }
    static create(vars) { return new ScrollTrigger(vars); }
    static getAll() { return all.slice(); }
    static getById(id) { return all.find(s => s.vars.id === id); }
    static refresh() { all.slice().sort((a, b) => (a._spacer ? 0 : 1) - (b._spacer ? 0 : 1)).forEach(s => s.refresh()); }
    static killAll() { all.slice().forEach(s => s.kill()); }
    static update() { all.forEach(s => s.update()); }
    static isInViewport(node, ratio = 0) { const r = el(node).getBoundingClientRect(); const h = win.innerHeight; return r.bottom - r.height * ratio > 0 && r.top + r.height * ratio < h; }
    static positionInViewport(node, ref = 'top') { const r = el(node).getBoundingClientRect(); return (r.top + parseEdge(ref, r.height)) / win.innerHeight; }
  }
  const isFn = f => typeof f === 'function';

  let globalBound = false;
  function ensureGlobal() {
    if (globalBound) return; globalBound = true;
    let t;
    win.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(ScrollTrigger.refresh, 150); });
    win.addEventListener('load', () => ScrollTrigger.refresh());
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  // tweens & timelines accept `scrollTrigger: { … }` (or a selector string as shorthand for { trigger })
  $.motion.hooks.push((anim, vars) => {
    if (!vars || !vars.scrollTrigger) return;
    const cfg = typeof vars.scrollTrigger === 'string' || vars.scrollTrigger.nodeType ? { trigger: vars.scrollTrigger } : vars.scrollTrigger;
    anim.scrollTrigger = new ScrollTrigger(cfg, anim);
  });

  $.ScrollTrigger = ScrollTrigger;
  $.scrollTrigger = vars => new ScrollTrigger(vars);
  $.fn.scrollTrigger = function (vars) { return this.each((_, n) => { new ScrollTrigger(Object.assign({ trigger: n }, vars)); }); };

  // $.scrollTo(target | y, { duration, offset, ease, scroller, horizontal }) → tween (thenable)
  $.scrollTo = (target, opts = {}) => {
    if (typeof opts === 'number') opts = { duration: opts };
    const sc = el(opts.scroller) || win, horiz = !!opts.horizontal;
    let to = typeof target === 'number' ? target : target === 'max' ? maxScroll(sc, horiz) : offsetIn(el(target), sc, horiz);
    to = clamp(0, maxScroll(sc, horiz), to - (opts.offset || 0));
    const reduce = win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const proxy = { v: scrollPos(sc, horiz) };
    const set = v => isWin(sc) ? win.scrollTo(horiz ? v : win.scrollX, horiz ? win.scrollY : v) : (sc[horiz ? 'scrollLeft' : 'scrollTop'] = v);
    return $.to(proxy, { v: to, duration: reduce ? 0 : (opts.duration ?? 0.8), ease: opts.ease || 'power2.inOut', onUpdate: () => set(proxy.v), onComplete: opts.onComplete });
  };
  $.fn.scrollTo = function (opts) { return $.scrollTo(this[0], opts); };
  return ScrollTrigger;
});
