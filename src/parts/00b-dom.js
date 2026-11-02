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
