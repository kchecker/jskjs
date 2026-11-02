/*!
 * jsKjs Split add-on — split text into lines, words and characters for animation (SplitText-style).
 * https://jskjs.org/features/split-text/ · MIT · load after jskjs.js
 *
 *   const split = $.splitText('h1', { type: 'words,chars', mask: 'words' });
 *   $.from(split.chars, { y: '100%', stagger: 0.02 });
 *   split.revert();                                       // restore the original markup
 */
(function (factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else factory(window.jsKjs);
})(function ($) {
  'use strict';
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const graphemes = s => seg ? [...seg.segment(s)].map(x => x.segment) : Array.from(s);
  const SKIP = /^(SCRIPT|STYLE|SVG|svg|TEXTAREA|INPUT|SELECT|IMG|VIDEO|CANVAS|IFRAME)$/;

  class SplitText {
    constructor(target, vars = {}) {
      this.vars = Object.assign({ type: 'chars,words,lines', aria: 'auto', tag: 'span' }, vars);
      this.elements = $(target).get();
      this._orig = this.elements.map(el => ({ el, html: el.innerHTML, label: el.getAttribute('aria-label') }));
      this.split();
      if (this.vars.autoSplit && /lines/.test(this.vars.type)) {
        let w = this.elements.map(e => e.offsetWidth), t;
        this._ro = new ResizeObserver(() => {
          clearTimeout(t);
          t = setTimeout(() => {
            const nw = this.elements.map(e => e.offsetWidth);
            if (nw.some((x, i) => x !== w[i])) { w = nw; this.revert(true); this.split(); this.vars.onSplit && this.vars.onSplit(this); }
          }, 100);
        });
        this.elements.forEach(e => this._ro.observe(e));
      }
      if (this.vars.onSplit) this.vars.onSplit(this);
    }
    split() {
      const v = this.vars, types = String(v.type).split(',').map(s => s.trim());
      const wantChars = types.includes('chars'), wantWords = types.includes('words') || types.includes('lines') || wantChars, wantLines = types.includes('lines');
      this.chars = []; this.words = []; this.lines = []; this.masks = [];
      const make = (cls, i, text) => {
        const s = document.createElement(v.tag);
        s.className = cls; s.style.display = 'inline-block';
        if (v.propIndex) s.style.setProperty('--' + cls.split(' ')[0] + '-i', i);
        if (text != null) s.textContent = text;
        return s;
      };
      for (const el of this.elements) {
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        if (v.aria === 'auto' && !el.hasAttribute('aria-label')) el.setAttribute('aria-label', text);
        const walk = node => {
          for (const child of [...node.childNodes]) {
            if (child.nodeType === 3) {
              const frag = document.createDocumentFragment();
              child.textContent.split(/(\s+)/).forEach(part => {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return; }
                if (!wantWords) { frag.append(part); return; }
                const w = make(v.wordsClass || 'word', this.words.length);
                if (wantChars) graphemes(part).forEach(g => { const c = make(v.charsClass || 'char', this.chars.length, g); this.chars.push(c); w.append(c); });
                else w.textContent = part;
                this.words.push(w); frag.append(w);
              });
              child.replaceWith(frag);
            } else if (child.nodeType === 1 && !SKIP.test(child.tagName) && child.tagName !== 'BR') walk(child);
          }
        };
        walk(el);
        if (v.aria === 'auto' || v.aria === 'hidden') [...el.children].forEach(c => c.setAttribute('aria-hidden', 'true'));
        if (wantLines) {
          // group top-level children by their rendered line
          const groups = []; let cur = null, lastTop = null;
          for (const n of [...el.childNodes]) {
            if (n.nodeType === 1 && n.tagName === 'BR') { n.remove(); lastTop = null; cur = null; continue; }
            const top = n.nodeType === 1 ? n.getBoundingClientRect().top : lastTop;
            if (cur === null || (top !== null && lastTop !== null && Math.abs(top - lastTop) > 2)) { cur = []; groups.push(cur); }
            if (n.nodeType === 1) lastTop = top;
            cur.push(n);
          }
          groups.forEach(g => {
            while (g.length && g[g.length - 1].nodeType === 3 && !g[g.length - 1].textContent.trim()) g.pop().remove();
            if (!g.length) return;
            const line = make(v.linesClass || 'line', this.lines.length);
            line.style.display = 'block';
            if (v.aria === 'auto') line.setAttribute('aria-hidden', 'true');
            g[0].before(line); g.forEach(n => line.append(n));
            this.lines.push(line);
          });
          [...el.childNodes].forEach(n => { if (n.nodeType === 3 && !n.textContent.trim()) n.remove(); });
        }
      }
      if (v.mask) {
        const list = this[v.mask] || [];
        list.forEach(n => {
          const m = document.createElement(v.tag);
          m.className = (v.maskClass || n.className.split(' ')[0] + '-mask');
          m.style.cssText = 'display:' + (v.mask === 'lines' ? 'block' : 'inline-block') + ';overflow:clip;vertical-align:top;';
          n.before(m); m.append(n); this.masks.push(m);
        });
      }
      this.isSplit = true;
      return this;
    }
    revert(keepObserver) {
      this._orig.forEach(o => { o.el.innerHTML = o.html; if (o.label == null) o.el.removeAttribute('aria-label'); else o.el.setAttribute('aria-label', o.label); });
      this.chars = []; this.words = []; this.lines = []; this.masks = []; this.isSplit = false;
      if (!keepObserver && this._ro) { this._ro.disconnect(); this._ro = null; }
      return this;
    }
  }
  $.SplitText = SplitText;
  $.splitText = (target, vars) => new SplitText(target, typeof vars === 'string' ? { type: vars } : vars);
  $.fn.splitText = function (vars) { return $.splitText(this, vars); };
  return SplitText;
});
