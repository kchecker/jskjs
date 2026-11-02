  /* ============================================================
   * CALLBACKS, DEFERRED, WHEN — jQuery 3 semantics (Promises/A+ .then,
   * synchronous .done/.fail/.progress, .pipe, notify, resolveWith…)
   * ============================================================ */
  function flagsOf(o) {
    if (isStr(o)) { const r = {}; o.split(/\s+/).filter(Boolean).forEach(f => { r[f] = true; }); return r; }
    return Object.assign({}, o);
  }
  $.Callbacks = function (options) {
    options = flagsOf(options);
    let firing = false, memory, fired = false, locked, list = [], queue = [], firingIndex = -1;
    const fire = () => {
      locked = locked || options.once;
      fired = firing = true;
      for (; queue.length; firingIndex = -1) {
        memory = queue.shift();
        while (++firingIndex < list.length) {
          if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) { firingIndex = list.length; memory = false; }
        }
      }
      if (!options.memory) memory = false;
      firing = false;
      if (locked) list = memory ? [] : '';
    };
    const self = {
      add(...args) {
        if (list) {
          if (memory && !firing) { firingIndex = list.length - 1; queue.push(memory); }
          (function add(a) {
            for (const arg of a) {
              if (isFn(arg)) { if (!options.unique || !self.has(arg)) list.push(arg); }
              else if (arg && arg.length && !isStr(arg)) add(Array.from(arg));
            }
          })(args);
          if (memory && !firing) fire();
        }
        return this;
      },
      remove(...args) {
        for (const arg of args) {
          let i = 0;
          while ((i = list.indexOf(arg, i)) > -1) { list.splice(i, 1); if (i <= firingIndex) firingIndex--; }
        }
        return this;
      },
      has(fn) { return fn ? list.indexOf(fn) > -1 : list.length > 0; },
      empty() { if (list) list = []; return this; },
      disable() { locked = queue = []; list = memory = ''; return this; },
      disabled() { return !list; },
      lock() { locked = queue = []; if (!memory && !firing) list = memory = ''; return this; },
      locked() { return !!locked; },
      fireWith(context, args) {
        if (!locked) {
          args = args || [];
          queue.push([context, args.slice ? args.slice() : args]);
          if (!firing) fire();
        }
        return this;
      },
      fire(...a) { self.fireWith(this, a); return this; },
      fired() { return !!fired; },
    };
    return self;
  };

  const Identity = v => v, Thrower = e => { throw e; };
  function adoptValue(value, resolve, reject, noValue) {
    let method;
    try {
      if (value && isFn(method = value.promise)) method.call(value).done(resolve).fail(reject);
      else if (value && isFn(method = value.then)) method.call(value, resolve, reject);
      else resolve.apply(undefined, [value].slice(noValue));
    } catch (e) { reject.apply(undefined, [e]); }
  }

  $.Deferred = function (func) {
    const tuples = [
      ['notify', 'progress', $.Callbacks('memory'), $.Callbacks('memory'), 2],
      ['resolve', 'done', $.Callbacks('once memory'), $.Callbacks('once memory'), 0, 'resolved'],
      ['reject', 'fail', $.Callbacks('once memory'), $.Callbacks('once memory'), 1, 'rejected'],
    ];
    let state = 'pending';
    const deferred = {};
    const promise = {
      state: () => state,
      always(...a) { deferred.done(...a).fail(...a); return this; },
      catch(fn) { return promise.then(null, fn); },
      // deprecated in jQuery 3, still widely used: synchronous filters
      pipe(...fns) {
        return $.Deferred(newDefer => {
          tuples.forEach(tuple => {
            const fn = isFn(fns[tuple[4]]) && fns[tuple[4]];
            deferred[tuple[1]](function (...args) {
              const returned = fn && fn.apply(this, args);
              if (returned && isFn(returned.promise)) returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
              else newDefer[tuple[0] + 'With'](this, fn ? [returned] : args);
            });
          });
          fns = null;
        }).promise();
      },
      then(onFulfilled, onRejected, onProgress) {
        let maxDepth = 0;
        function resolve(depth, defer, handler, special) {
          return function (...args) {
            let that = this;
            const mightThrow = function () {
              if (depth < maxDepth) return;
              const returned = handler.apply(that, args);
              if (returned === defer.promise()) throw new TypeError('Thenable self-resolution');
              const then = returned && (typeof returned === 'object' || typeof returned === 'function') && returned.then;
              if (isFn(then)) {
                if (special) then.call(returned, resolve(maxDepth, defer, Identity, special), resolve(maxDepth, defer, Thrower, special));
                else {
                  maxDepth++;
                  then.call(returned, resolve(maxDepth, defer, Identity, special), resolve(maxDepth, defer, Thrower, special),
                    resolve(maxDepth, defer, Identity, defer.notifyWith));
                }
              } else {
                if (handler !== Identity) { that = undefined; args = [returned]; }
                (special || defer.resolveWith)(that, args);
              }
            };
            const process = special ? mightThrow : function () {
              try { mightThrow(); } catch (e) {
                if ($.Deferred.exceptionHook) $.Deferred.exceptionHook(e, process.error);
                if (depth + 1 >= maxDepth) {
                  if (handler !== Thrower) { that = undefined; args = [e]; }
                  defer.rejectWith(that, args);
                }
              }
            };
            if (depth) process();
            else {
              if ($.Deferred.getErrorHook) process.error = $.Deferred.getErrorHook();
              else if ($.Deferred.getStackHook) process.error = $.Deferred.getStackHook();
              window.setTimeout(process);
            }
          };
        }
        return $.Deferred(newDefer => {
          tuples[0][3].add(resolve(0, newDefer, isFn(onProgress) ? onProgress : Identity, newDefer.notifyWith));
          tuples[1][3].add(resolve(0, newDefer, isFn(onFulfilled) ? onFulfilled : Identity));
          tuples[2][3].add(resolve(0, newDefer, isFn(onRejected) ? onRejected : Thrower));
        }).promise();
      },
      promise(obj) { return obj != null ? Object.assign(obj, promise) : promise; },
    };
    tuples.forEach((tuple, i) => {
      const list = tuple[2], stateString = tuple[5];
      promise[tuple[1]] = list.add;
      if (stateString) {
        list.add(() => { state = stateString; }, tuples[3 - i][2].disable, tuples[3 - i][3].disable, tuples[0][2].lock, tuples[0][3].lock);
      }
      list.add(tuple[3].fire);
      deferred[tuple[0]] = function (...a) { deferred[tuple[0] + 'With'](this === deferred ? undefined : this, a); return this; };
      deferred[tuple[0] + 'With'] = list.fireWith;
    });
    promise.promise(deferred);
    if (func) func.call(deferred, deferred);
    return deferred;
  };
  const rErrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;
  $.Deferred.exceptionHook = (error, asyncError) => {
    if (window.console && console.warn && error && rErrorNames.test(error.name)) console.warn('jsKjs.Deferred exception: ' + error.message, error.stack, asyncError);
  };

  $.when = function (singleValue) {
    let remaining = arguments.length, i = remaining;
    const resolveContexts = Array(i), resolveValues = Array.prototype.slice.call(arguments);
    const primary = $.Deferred();
    const updateFunc = idx => function (...value) {
      resolveContexts[idx] = this;
      resolveValues[idx] = value.length > 1 ? value : value[0];
      if (!(--remaining)) primary.resolveWith(resolveContexts, resolveValues);
    };
    if (remaining <= 1) {
      adoptValue(singleValue, primary.done(updateFunc(i)).resolve, primary.reject, !remaining);
      if (primary.state() === 'pending' || isFn(resolveValues[i] && resolveValues[i].then)) return primary.then();
    }
    while (i--) adoptValue(resolveValues[i], updateFunc(i), primary.reject);
    return primary.promise();
  };
