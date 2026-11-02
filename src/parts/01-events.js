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
