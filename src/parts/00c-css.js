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
