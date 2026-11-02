  /* ---------------- READY (needs Deferred) ---------------- */
  readyList = $.Deferred();
  pendingReady.splice(0).forEach(fn => ready(fn));
  $.ready.then = readyList.then;
  {
    const completed = () => {
      document.removeEventListener('DOMContentLoaded', completed);
      window.removeEventListener('load', completed);
      $.ready();
    };
    if (document.readyState === 'complete' || (document.readyState !== 'loading' && !documentElement.doScroll)) window.setTimeout($.ready);
    else { document.addEventListener('DOMContentLoaded', completed); window.addEventListener('load', completed); }
  }

  /* ============================================================
   * QUEUES
   * ============================================================ */
  $.extend({
    queue(elem, type, data) {
      if (elem) {
        type = (type || 'fx') + 'queue';
        let queue = dataPriv.get(elem, type);
        if (data) {
          if (!queue || Array.isArray(data)) queue = dataPriv.access(elem, type, $.makeArray(data));
          else queue.push(data);
        }
        return queue || [];
      }
    },
    dequeue(elem, type) {
      type = type || 'fx';
      const queue = $.queue(elem, type), hooks = $._queueHooks(elem, type), next = () => $.dequeue(elem, type);
      let startLength = queue.length, fn = queue.shift();
      if (fn === 'inprogress') { fn = queue.shift(); startLength--; }
      if (fn) {
        if (type === 'fx') queue.unshift('inprogress');
        delete hooks.stop;
        fn.call(elem, next, hooks);
      }
      if (!startLength && hooks) hooks.empty.fire();
    },
    _queueHooks(elem, type) {
      const key = type + 'queueHooks';
      return dataPriv.get(elem, key) || dataPriv.access(elem, key, {
        empty: $.Callbacks('once memory').add(() => { dataPriv.remove(elem, [type + 'queue', key]); }),
      });
    },
  });
  $.fn.extend({
    queue(type, data) {
      let setter = 2;
      if (typeof type !== 'string') { data = type; type = 'fx'; setter--; }
      if (arguments.length < setter) return $.queue(this[0], type);
      return data === undefined ? this : this.each(function () {
        const queue = $.queue(this, type, data);
        $._queueHooks(this, type);
        if (type === 'fx' && queue[0] !== 'inprogress') $.dequeue(this, type);
      });
    },
    dequeue(type) { return this.each(function () { $.dequeue(this, type); }); },
    clearQueue(type) { return this.queue(type || 'fx', []); },
    promise(type, obj) {
      let count = 1;
      const defer = $.Deferred(), elements = this;
      const resolve = () => { if (!(--count)) defer.resolveWith(elements, [elements]); };
      if (typeof type !== 'string') { obj = type; type = undefined; }
      type = type || 'fx';
      for (let i = this.length; i--;) {
        const tmp = dataPriv.get(elements[i], type + 'queueHooks');
        if (tmp && tmp.empty) { count++; tmp.empty.add(resolve); }
      }
      resolve();
      return defer.promise(obj);
    },
    delay(time, type) {
      time = $.fx ? $.fx.speeds[time] || time : time;
      type = type || 'fx';
      return this.queue(type, function (next, hooks) {
        const timeout = window.setTimeout(next, time);
        hooks.stop = () => window.clearTimeout(timeout);
      });
    },
  });

  /* ============================================================
   * EFFECTS — jQuery's .animate() engine (Tween, Animation, timers),
   * so step/progress callbacks, hooks and the fx queue behave exactly as before.
   * Easing names also accept GSAP-style eases ("power2.out", "back.inOut(2)")
   * and CSS ones ("ease-in-out", "cubic-bezier(…)", "steps(4)").
   * ============================================================ */
  let fxNow, inProgress;
  const rfxtypes = /^(?:toggle|show|hide)$/, rrun = /queueHooks$/;
  function schedule() {
    if (inProgress) {
      if (document.hidden === false && window.requestAnimationFrame) window.requestAnimationFrame(schedule);
      else window.setTimeout(schedule, $.fx.interval);
      $.fx.tick();
    }
  }
  function createFxNow() { window.setTimeout(() => { fxNow = undefined; }); return (fxNow = Date.now()); }
  function genFx(type, includeWidth) {
    const attrs = { height: type };
    includeWidth = includeWidth ? 1 : 0;
    for (let i = 0; i < 4; i += 2 - includeWidth) { const which = cssExpand[i]; attrs['margin' + which] = attrs['padding' + which] = type; }
    if (includeWidth) attrs.opacity = attrs.width = type;
    return attrs;
  }
  function createTween(value, prop, animation) {
    const collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners['*']);
    for (const t of collection) { const tween = t.call(animation, prop, value); if (tween) return tween; }
  }
  function defaultPrefilter(elem, props, opts) {
    let prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display;
    const isBox = 'width' in props || 'height' in props, anim = this, orig = {}, style = elem.style;
    let hidden = elem.nodeType && isHiddenWithinTree(elem), dataShow = dataPriv.get(elem, 'fxshow');
    if (!opts.queue) {
      hooks = $._queueHooks(elem, 'fx');
      if (hooks.unqueued == null) {
        hooks.unqueued = 0;
        oldfire = hooks.empty.fire;
        hooks.empty.fire = () => { if (!hooks.unqueued) oldfire(); };
      }
      hooks.unqueued++;
      anim.always(() => { anim.always(() => { hooks.unqueued--; if (!$.queue(elem, 'fx').length) hooks.empty.fire(); }); });
    }
    for (prop in props) {
      value = props[prop];
      if (rfxtypes.test(value)) {
        delete props[prop];
        toggle = toggle || value === 'toggle';
        if (value === (hidden ? 'hide' : 'show')) {
          if (value === 'show' && dataShow && dataShow[prop] !== undefined) hidden = true;
          else continue;
        }
        orig[prop] = (dataShow && dataShow[prop]) || $.style(elem, prop);
      }
    }
    propTween = !$.isEmptyObject(props);
    if (!propTween && $.isEmptyObject(orig)) return;
    if (isBox && elem.nodeType === 1) {
      opts.overflow = [style.overflow, style.overflowX, style.overflowY];
      restoreDisplay = dataShow && dataShow.display;
      if (restoreDisplay == null) restoreDisplay = dataPriv.get(elem, 'display');
      display = $.css(elem, 'display');
      if (display === 'none') {
        if (restoreDisplay) display = restoreDisplay;
        else { showHide([elem], true); restoreDisplay = elem.style.display || restoreDisplay; display = $.css(elem, 'display'); showHide([elem]); }
      }
      if (display === 'inline' || (display === 'inline-block' && restoreDisplay != null)) {
        if ($.css(elem, 'float') === 'none') {
          if (!propTween) {
            anim.done(() => { style.display = restoreDisplay; });
            if (restoreDisplay == null) { display = style.display; restoreDisplay = display === 'none' ? '' : display; }
          }
          style.display = 'inline-block';
        }
      }
    }
    if (opts.overflow) {
      style.overflow = 'hidden';
      anim.always(() => { style.overflow = opts.overflow[0]; style.overflowX = opts.overflow[1]; style.overflowY = opts.overflow[2]; });
    }
    propTween = false;
    for (prop in orig) {
      if (!propTween) {
        if (dataShow) { if ('hidden' in dataShow) hidden = dataShow.hidden; }
        else dataShow = dataPriv.access(elem, 'fxshow', { display: restoreDisplay });
        if (toggle) dataShow.hidden = !hidden;
        if (hidden) showHide([elem], true);
        anim.done(() => {
          if (!hidden) showHide([elem]);
          dataPriv.remove(elem, 'fxshow');
          for (const p in orig) $.style(elem, p, orig[p]);
        });
      }
      propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
      if (!(prop in dataShow)) {
        dataShow[prop] = propTween.start;
        if (hidden) { propTween.end = propTween.start; propTween.start = 0; }
      }
    }
  }
  function propFilter(props, specialEasing) {
    for (let index in props) {
      const name = camel(index);
      let easing = specialEasing[name], value = props[index];
      if (Array.isArray(value)) { easing = value[1]; value = props[index] = value[0]; }
      if (index !== name) { props[name] = value; delete props[index]; }
      const hooks = $.cssHooks[name];
      if (hooks && 'expand' in hooks) {
        value = hooks.expand(value);
        delete props[name];
        for (index in value) if (!(index in props)) { props[index] = value[index]; specialEasing[index] = easing; }
      } else specialEasing[name] = easing;
    }
  }
  function Animation(elem, properties, options) {
    let stopped;
    const deferred = $.Deferred().always(() => { delete tick.elem; });
    const tick = function () {
      if (stopped) return false;
      const currentTime = fxNow || createFxNow(),
        remaining = Math.max(0, animation.startTime + animation.duration - currentTime),
        temp = remaining / animation.duration || 0, percent = 1 - temp, length = animation.tweens.length;
      for (let index = 0; index < length; index++) animation.tweens[index].run(percent);
      deferred.notifyWith(elem, [animation, percent, remaining]);
      if (percent < 1 && length) return remaining;
      if (!length) deferred.notifyWith(elem, [animation, 1, 0]);
      deferred.resolveWith(elem, [animation]);
      return false;
    };
    const animation = deferred.promise({
      elem,
      props: $.extend({}, properties),
      opts: $.extend(true, { specialEasing: {}, easing: $.easing._default }, options),
      originalProperties: properties,
      originalOptions: options,
      startTime: fxNow || createFxNow(),
      duration: options.duration,
      tweens: [],
      createTween(prop, end) {
        const tween = $.Tween(elem, animation.opts, prop, end, animation.opts.specialEasing[prop] || animation.opts.easing);
        animation.tweens.push(tween);
        return tween;
      },
      stop(gotoEnd) {
        const length = gotoEnd ? animation.tweens.length : 0;
        if (stopped) return this;
        stopped = true;
        for (let index = 0; index < length; index++) animation.tweens[index].run(1);
        if (gotoEnd) { deferred.notifyWith(elem, [animation, 1, 0]); deferred.resolveWith(elem, [animation, gotoEnd]); }
        else deferred.rejectWith(elem, [animation, gotoEnd]);
        return this;
      },
    });
    const props = animation.props;
    propFilter(props, animation.opts.specialEasing);
    for (let index = 0; index < Animation.prefilters.length; index++) {
      const result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
      if (result) {
        if (isFn(result.stop)) $._queueHooks(animation.elem, animation.opts.queue).stop = result.stop.bind(result);
        return result;
      }
    }
    $.map(props, createTween, animation);
    if (isFn(animation.opts.start)) animation.opts.start.call(elem, animation);
    animation.progress(animation.opts.progress).done(animation.opts.done, animation.opts.complete).fail(animation.opts.fail).always(animation.opts.always);
    $.fx.timer($.extend(tick, { elem, anim: animation, queue: animation.opts.queue }));
    return animation;
  }
  $.Animation = $.extend(Animation, {
    tweeners: { '*': [function (prop, value) { const tween = this.createTween(prop, value); adjustCSS(tween.elem, prop, rcssNum.exec(value), tween); return tween; }] },
    tweener(props, callback) {
      if (isFn(props)) { callback = props; props = ['*']; } else props = props.match(rnothtmlwhite);
      for (const prop of props) { Animation.tweeners[prop] = Animation.tweeners[prop] || []; Animation.tweeners[prop].unshift(callback); }
    },
    prefilters: [defaultPrefilter],
    prefilter(callback, prepend) { if (prepend) Animation.prefilters.unshift(callback); else Animation.prefilters.push(callback); },
  });
  $.speed = function (speed, easing, fn) {
    const opt = speed && typeof speed === 'object' ? $.extend({}, speed) : {
      complete: fn || (!fn && easing) || (isFn(speed) && speed),
      duration: speed,
      easing: (fn && easing) || (easing && !isFn(easing) && easing),
    };
    if ($.fx.off) opt.duration = 0;
    else if (typeof opt.duration !== 'number') opt.duration = opt.duration in $.fx.speeds ? $.fx.speeds[opt.duration] : $.fx.speeds._default;
    if (opt.queue == null || opt.queue === true) opt.queue = 'fx';
    opt.old = opt.complete;
    opt.complete = function () { if (isFn(opt.old)) opt.old.call(this); if (opt.queue) $.dequeue(this, opt.queue); };
    return opt;
  };
  $.fn.extend({
    fadeTo(speed, to, easing, callback) {
      return this.filter(isHiddenWithinTree).css('opacity', 0).show().end().animate({ opacity: to }, speed, easing, callback);
    },
    animate(prop, speed, easing, callback) {
      const empty = $.isEmptyObject(prop), optall = $.speed(speed, easing, callback);
      const doAnimation = function () {
        const anim = Animation(this, $.extend({}, prop), optall);
        if (empty || dataPriv.get(this, 'finish')) anim.stop(true);
      };
      doAnimation.finish = doAnimation;
      return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
    },
    stop(type, clearQueue, gotoEnd) {
      const stopQueue = hooks => { const stop = hooks.stop; delete hooks.stop; stop(gotoEnd); };
      if (typeof type !== 'string') { gotoEnd = clearQueue; clearQueue = type; type = undefined; }
      if (clearQueue) this.queue(type || 'fx', []);
      return this.each(function () {
        let dequeue = true, index = type != null && type + 'queueHooks';
        const timers = $.timers, data = dataPriv.get(this);
        if (index) { if (data[index] && data[index].stop) stopQueue(data[index]); }
        else for (index in data) if (data[index] && data[index].stop && rrun.test(index)) stopQueue(data[index]);
        for (index = timers.length; index--;) {
          if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
            timers[index].anim.stop(gotoEnd); dequeue = false; timers.splice(index, 1);
          }
        }
        if (dequeue || !gotoEnd) $.dequeue(this, type);
      });
    },
    finish(type) {
      if (type !== false) type = type || 'fx';
      return this.each(function () {
        const data = dataPriv.get(this), queue = data[type + 'queue'], hooks = data[type + 'queueHooks'], timers = $.timers, length = queue ? queue.length : 0;
        data.finish = true;
        $.queue(this, type, []);
        if (hooks && hooks.stop) hooks.stop.call(this, true);
        for (let index = timers.length; index--;) {
          if (timers[index].elem === this && timers[index].queue === type) { timers[index].anim.stop(true); timers.splice(index, 1); }
        }
        for (let index = 0; index < length; index++) if (queue[index] && queue[index].finish) queue[index].finish.call(this);
        delete data.finish;
      });
    },
  });
  ['toggle', 'show', 'hide'].forEach(name => {
    const cssFn = $.fn[name];
    $.fn[name] = function (speed, easing, callback) {
      return speed == null || typeof speed === 'boolean' ? cssFn.apply(this, arguments) : this.animate(genFx(name, true), speed, easing, callback);
    };
  });
  $.each({ slideDown: genFx('show'), slideUp: genFx('hide'), slideToggle: genFx('toggle'), fadeIn: { opacity: 'show' }, fadeOut: { opacity: 'hide' }, fadeToggle: { opacity: 'toggle' } },
    (name, props) => { $.fn[name] = function (speed, easing, callback) { return this.animate(props, speed, easing, callback); }; });

  function Tween(elem, options, prop, end, easing) { return new Tween.prototype.init(elem, options, prop, end, easing); }
  $.Tween = Tween;
  Tween.prototype = {
    constructor: Tween,
    init: function (elem, options, prop, end, easing, unit) {
      this.elem = elem; this.prop = prop; this.easing = easing || $.easing._default;
      this.options = options; this.start = this.now = this.cur(); this.end = end;
      this.unit = unit || ($.cssNumber[prop] ? '' : 'px');
    },
    cur() { const hooks = Tween.propHooks[this.prop]; return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this); },
    run(percent) {
      let eased;
      const hooks = Tween.propHooks[this.prop];
      if (this.options.duration) this.pos = eased = easingFn(this.easing)(percent, this.options.duration * percent, 0, 1, this.options.duration);
      else this.pos = eased = percent;
      this.now = (this.end - this.start) * eased + this.start;
      if (this.options.step) this.options.step.call(this.elem, this.now, this);
      if (hooks && hooks.set) hooks.set(this); else Tween.propHooks._default.set(this);
      return this;
    },
  };
  Tween.prototype.init.prototype = Tween.prototype;
  Tween.propHooks = {
    _default: {
      get(tween) {
        if (tween.elem.nodeType !== 1 || (tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null)) return tween.elem[tween.prop];
        const result = $.css(tween.elem, tween.prop, '');
        return !result || result === 'auto' ? 0 : result;
      },
      set(tween) {
        if ($.fx.step[tween.prop]) $.fx.step[tween.prop](tween);
        else if (tween.elem.nodeType === 1 && ($.cssHooks[tween.prop] || tween.elem.style[finalPropName(tween.prop)] != null)) $.style(tween.elem, tween.prop, tween.now + tween.unit);
        else tween.elem[tween.prop] = tween.now;
      },
    },
  };
  Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = { set(tween) { if (tween.elem.nodeType && tween.elem.parentNode) tween.elem[tween.prop] = tween.now; } };
  $.easing = { linear: p => p, swing: p => 0.5 - Math.cos(p * Math.PI) / 2, _default: 'swing' };
  // unknown names fall back to the Motion parser (GSAP / CSS eases)
  const easingFn = name => {
    const f = $.easing[name];
    if (f) return f;
    if ($.parseEase) { const e = $.parseEase(name); const g = p => e(p); g.kjFromParse = true; return ($.easing[name] = g); }
    return $.easing.swing;
  };
  $.fx = Tween.prototype.init;
  $.fx.step = {};
  $.timers = [];
  $.fx.tick = function () {
    let timer;
    const timers = $.timers;
    fxNow = Date.now();
    for (let i = 0; i < timers.length; i++) { timer = timers[i]; if (!timer() && timers[i] === timer) timers.splice(i--, 1); }
    if (!timers.length) $.fx.stop();
    fxNow = undefined;
  };
  $.fx.timer = timer => { $.timers.push(timer); $.fx.start(); };
  $.fx.interval = 13;
  $.fx.start = () => { if (inProgress) return; inProgress = true; schedule(); };
  $.fx.stop = () => { inProgress = null; };
  $.fx.speeds = { slow: 600, fast: 200, _default: 400 };
  $.fx.off = false;
