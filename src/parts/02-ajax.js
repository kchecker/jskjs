  /* ============================================================
   * AJAX — jQuery's $.ajax, faithfully: jqXHR (a Deferred promise),
   * prefilters, transports, converters, global events, JSONP, statusCode,
   * ifModified, sync requests. Hyper uses the small fetch() helper below.
   * ============================================================ */
  const sameOrigin = url => { try { return new URL(url, location.href).origin === location.origin; } catch (e) { return true; } };

  // jQuery-style decoration for native promises
  function decoratePromise(p, failArgs = e => [e]) {
    const quiet = x => x.catch(() => {});
    p.done = (...fns) => { quiet(p.then(v => fns.flat().forEach(f => f(v)))); return p; };
    p.fail = (...fns) => { p.catch(e => fns.flat().forEach(f => f(...failArgs(e)))); return p; };
    p.always = (...fns) => { quiet(p.then(v => fns.flat().forEach(f => f(v)), e => fns.flat().forEach(f => f(...failArgs(e))))); return p; };
    p.progress = () => p;
    return p;
  }

  /* ---------------- fetch() helper for Hyper: resolves { data, res, status, text } ---------------- */
  function request(o) {
    const url = o.url || location.href;
    const method = String(o.method || 'GET').toUpperCase();
    const headers = new Headers();
    for (const k in o.headers || {}) if (o.headers[k] != null) headers.set(k, o.headers[k]);
    let body = method === 'GET' || method === 'HEAD' ? undefined : o.data;
    if (body instanceof URLSearchParams) { headers.set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8'); body = body.toString(); }
    const controller = new AbortController();
    if (o.signal) o.signal.addEventListener('abort', () => controller.abort());
    let timedOut = false, timer;
    if (o.timeout > 0) timer = setTimeout(() => { timedOut = true; controller.abort(); }, o.timeout);
    return fetch(url, { method, headers, body, signal: controller.signal, credentials: o.credentials || 'same-origin' })
      .then(async res => {
        clearTimeout(timer);
        const text = await res.text();
        if (!res.ok) throw Object.assign(new Error(res.statusText || 'error'), { status: res.status, statusText: res.statusText, responseText: text, response: res });
        return { data: text, res, status: res.status, text };
      }, err => {
        clearTimeout(timer);
        const aborted = err && err.name === 'AbortError';
        throw Object.assign(new Error(timedOut ? 'timeout' : (err && err.message) || 'error'), { cause: err, status: 0,
          statusText: timedOut ? 'timeout' : aborted ? 'abort' : 'error', name: aborted ? 'AbortError' : 'Error', responseText: '' });
      });
  }

  /* ---------------- jQuery.ajax ---------------- */
  const r20 = /%20/g, rHash = /#.*$/, rAntiCache = /([?&])_=[^&]*/, rHeaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,
    rNoContent = /^(?:GET|HEAD)$/, rProtocol = /^\/\//, rQuery = /\?/, rJsonp = /(=)\?(?=&|$)|\?\?/;
  const prefilters = {}, transports = {}, allTypes = '*/'.concat('*');
  let ajaxNonce = Date.now();
  function addToPrefiltersOrTransports(structure) {
    return (dataTypeExpression, func) => {
      if (!isStr(dataTypeExpression)) { func = dataTypeExpression; dataTypeExpression = '*'; }
      const types = dataTypeExpression.toLowerCase().match(/\S+/g) || [];
      if (!isFn(func)) return;
      for (let dt of types) {
        if (dt[0] === '+') { dt = dt.slice(1) || '*'; (structure[dt] = structure[dt] || []).unshift(func); }
        else (structure[dt] = structure[dt] || []).push(func);
      }
    };
  }
  function inspect(structure, options, originalOptions, jqXHR) {
    const inspected = {}, seekingTransport = structure === transports;
    function go(dataType) {
      let selected;
      inspected[dataType] = true;
      (structure[dataType] || []).some(factory => {
        const r = factory(options, originalOptions, jqXHR);
        if (isStr(r) && !seekingTransport && !inspected[r]) { options.dataTypes.unshift(r); go(r); return false; }
        else if (seekingTransport) { selected = r; return !!selected; }
        return false;
      });
      return selected;
    }
    return go(options.dataTypes[0]) || (!inspected['*'] && go('*'));
  }
  function ajaxExtend(target, src) {
    let deep;
    const flat = $.ajaxSettings.flatOptions || {};
    for (const key in src) if (src[key] !== undefined) (flat[key] ? target : (deep || (deep = {})))[key] = src[key];
    if (deep) $.extend(true, target, deep);
    return target;
  }
  function handleResponses(s, jqXHR, responses) {
    let ct, finalDataType, firstDataType;
    const contents = s.contents, dataTypes = s.dataTypes;
    while (dataTypes[0] === '*') { dataTypes.shift(); if (ct === undefined) ct = s.mimeType || jqXHR.getResponseHeader('Content-Type'); }
    if (ct) for (const type in contents) if (contents[type] && contents[type].test(ct)) { dataTypes.unshift(type); break; }
    if (dataTypes[0] in responses) finalDataType = dataTypes[0];
    else {
      for (const type in responses) {
        if (!dataTypes[0] || s.converters[type + ' ' + dataTypes[0]]) { finalDataType = type; break; }
        if (!firstDataType) firstDataType = type;
      }
      finalDataType = finalDataType || firstDataType;
    }
    if (finalDataType) { if (finalDataType !== dataTypes[0]) dataTypes.unshift(finalDataType); return responses[finalDataType]; }
  }
  function ajaxConvert(s, response, jqXHR, isSuccess) {
    let current, prev, conv;
    const converters = {}, dataTypes = s.dataTypes.slice();
    if (dataTypes[1]) for (const c in s.converters) converters[c.toLowerCase()] = s.converters[c];
    current = dataTypes.shift();
    while (current) {
      if (s.responseFields[current]) jqXHR[s.responseFields[current]] = response;
      if (!prev && isSuccess && s.dataFilter) response = s.dataFilter(response, s.dataType);
      prev = current;
      current = dataTypes.shift();
      if (!current) break;
      if (current === '*') { current = prev; continue; }
      if (prev !== '*' && prev !== current) {
        conv = converters[prev + ' ' + current] || converters['* ' + current];
        if (!conv) {
          for (const conv2 in converters) {
            const tmp = conv2.split(' ');
            if (tmp[1] === current) {
              conv = converters[prev + ' ' + tmp[0]] || converters['* ' + tmp[0]];
              if (conv) {
                if (conv === true) conv = converters[conv2];
                else if (converters[conv2] !== true) { current = tmp[0]; dataTypes.unshift(tmp[1]); }
                break;
              }
            }
          }
        }
        if (conv !== true) {
          if (conv && s.throws) response = conv(response);
          else {
            try { response = conv(response); }
            catch (e) { return { state: 'parsererror', error: conv ? e : 'No conversion from ' + prev + ' to ' + current }; }
          }
        }
      }
    }
    return { state: 'success', data: response };
  }

  $.active = 0;
  $.lastModified = {};
  $.etag = {};
  const oldCallbacks = [];
  $.ajaxSettings = {
    url: location.href, type: 'GET', isLocal: /^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(location.protocol),
    global: true, processData: true, async: true, contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    accepts: { '*': allTypes, text: 'text/plain', html: 'text/html', xml: 'application/xml, text/xml', json: 'application/json, text/javascript',
      script: 'text/javascript, application/javascript, application/ecmascript, application/x-ecmascript' },
    contents: { xml: /\bxml\b/, html: /\bhtml/, json: /\bjson\b/, script: /\b(?:java|ecma)script\b/ },
    responseFields: { xml: 'responseXML', text: 'responseText', json: 'responseJSON' },
    converters: { '* text': String, 'text html': true, 'text json': JSON.parse, 'text xml': s => $.parseXML(s),
      'text script': text => { globalEval(text); return text; } },
    flatOptions: { url: true, context: true },
    jsonp: 'callback',
    jsonpCallback() { const cb = oldCallbacks.pop() || ($.expando + '_' + (ajaxNonce++)); this[cb] = true; return cb; },
    xhr: () => new window.XMLHttpRequest(),
  };
  $.ajaxSetup = (target, settings) => settings ? ajaxExtend(ajaxExtend(target, $.ajaxSettings), settings) : ajaxExtend($.ajaxSettings, target);
  $.ajaxPrefilter = addToPrefiltersOrTransports(prefilters);
  $.ajaxTransport = addToPrefiltersOrTransports(transports);

  $.ajax = function (url, options) {
    if (typeof url === 'object') { options = url; url = undefined; }
    options = options || {};
    let transport, cacheURL, responseHeadersString, responseHeaders, timeoutTimer, completed, uncached, fireGlobals;
    const s = $.ajaxSetup({}, options);
    // jsKjs extra: { json: true } sends the data as a JSON body
    if (s.json && s.data != null && !isStr(s.data)) { s.data = JSON.stringify(s.data); s.contentType = 'application/json'; s.processData = false; }
    const callbackContext = s.context || s;
    const globalEventContext = s.context && (callbackContext.nodeType || callbackContext instanceof KJ) ? $(callbackContext) : $(document);
    const deferred = $.Deferred(), completeDeferred = $.Callbacks('once memory');
    let statusCode = s.statusCode || {};
    const requestHeaders = {}, requestHeadersNames = {};
    let strAbort = 'canceled';
    const jqXHR = {
      readyState: 0,
      getResponseHeader(key) {
        if (!completed) return null;
        if (!responseHeaders) {
          responseHeaders = {};
          let m;
          rHeaders.lastIndex = 0;
          while ((m = rHeaders.exec(responseHeadersString))) { const k = m[1].toLowerCase() + ' '; responseHeaders[k] = (responseHeaders[k] || []).concat(m[2]); }
        }
        const v = responseHeaders[key.toLowerCase() + ' '];
        return v == null ? null : v.join(', ');
      },
      getAllResponseHeaders() { return completed ? responseHeadersString : null; },
      setRequestHeader(name, value) {
        if (completed == null) { name = requestHeadersNames[name.toLowerCase()] = requestHeadersNames[name.toLowerCase()] || name; requestHeaders[name] = value; }
        return this;
      },
      overrideMimeType(type) { if (completed == null) s.mimeType = type; return this; },
      statusCode(map) {
        if (map) {
          if (completed) jqXHR.always(map[jqXHR.status]);
          else for (const code in map) statusCode[code] = [statusCode[code], map[code]];
        }
        return this;
      },
      abort(statusText) {
        const finalText = statusText || strAbort;
        if (transport) transport.abort(finalText);
        done(0, finalText);
        return this;
      },
    };
    deferred.promise(jqXHR);
    s.url = ((url || s.url || location.href) + '').replace(rProtocol, location.protocol + '//');
    s.type = options.method || options.type || s.method || s.type;
    s.dataTypes = (s.dataType || '*').toLowerCase().match(/\S+/g) || [''];
    if (s.crossDomain == null) {
      try { const u = new URL(s.url, location.href); s.crossDomain = u.protocol + '//' + u.host !== location.protocol + '//' + location.host; }
      catch (e) { s.crossDomain = true; }
    }
    if (s.data && s.processData && !isStr(s.data)) s.data = $.param(s.data, s.traditional);
    inspect(prefilters, s, options, jqXHR);
    if (completed) return jqXHR;
    fireGlobals = $.event && s.global;
    if (fireGlobals && $.active++ === 0) $(document).trigger('ajaxStart');
    s.type = s.type.toUpperCase();
    s.hasContent = !rNoContent.test(s.type);
    cacheURL = s.url.replace(rHash, '');
    if (!s.hasContent) {
      uncached = s.url.slice(cacheURL.length);
      if (s.data && (s.processData || isStr(s.data))) { cacheURL += (rQuery.test(cacheURL) ? '&' : '?') + s.data; delete s.data; }
      if (s.cache === false) { cacheURL = cacheURL.replace(rAntiCache, '$1'); uncached = (rQuery.test(cacheURL) ? '&' : '?') + '_=' + (ajaxNonce++) + uncached; }
      s.url = cacheURL + uncached;
    } else if (s.data && s.processData && (s.contentType || '').indexOf('application/x-www-form-urlencoded') === 0) s.data = s.data.replace(r20, '+');
    if (s.ifModified) {
      if ($.lastModified[cacheURL]) jqXHR.setRequestHeader('If-Modified-Since', $.lastModified[cacheURL]);
      if ($.etag[cacheURL]) jqXHR.setRequestHeader('If-None-Match', $.etag[cacheURL]);
    }
    if ((s.data && s.hasContent && s.contentType !== false) || options.contentType) jqXHR.setRequestHeader('Content-Type', s.contentType);
    jqXHR.setRequestHeader('Accept', s.dataTypes[0] && s.accepts[s.dataTypes[0]]
      ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== '*' ? ', ' + allTypes + '; q=0.01' : '') : s.accepts['*']);
    for (const h in s.headers) jqXHR.setRequestHeader(h, s.headers[h]);
    if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || completed)) return jqXHR.abort();
    strAbort = 'abort';
    completeDeferred.add(s.complete);
    jqXHR.done(s.success);
    jqXHR.fail(s.error);
    transport = inspect(transports, s, options, jqXHR);
    if (!transport) done(-1, 'No Transport');
    else {
      jqXHR.readyState = 1;
      if (fireGlobals) globalEventContext.trigger('ajaxSend', [jqXHR, s]);
      if (completed) return jqXHR;
      if (s.async && s.timeout > 0) timeoutTimer = window.setTimeout(() => jqXHR.abort('timeout'), s.timeout);
      try { completed = false; transport.send(requestHeaders, done); }
      catch (e) { if (completed) throw e; done(-1, e); }
    }
    function done(status, nativeStatusText, responses, headers) {
      let isSuccess, success, error, response, statusText = nativeStatusText;
      if (completed) return;
      completed = true;
      if (timeoutTimer) window.clearTimeout(timeoutTimer);
      transport = undefined;
      responseHeadersString = headers || '';
      jqXHR.readyState = status > 0 ? 4 : 0;
      isSuccess = status >= 200 && status < 300 || status === 304;
      if (responses) response = handleResponses(s, jqXHR, responses);
      if (!isSuccess && s.dataTypes.indexOf('script') > -1 && s.dataTypes.indexOf('json') < 0) s.converters['text script'] = () => {};
      response = ajaxConvert(s, response, jqXHR, isSuccess);
      if (isSuccess) {
        if (s.ifModified) {
          let m = jqXHR.getResponseHeader('Last-Modified'); if (m) $.lastModified[cacheURL] = m;
          m = jqXHR.getResponseHeader('etag'); if (m) $.etag[cacheURL] = m;
        }
        if (status === 204 || s.type === 'HEAD') statusText = 'nocontent';
        else if (status === 304) statusText = 'notmodified';
        else { statusText = response.state; success = response.data; error = response.error; isSuccess = !error; }
      } else {
        error = statusText;
        if (status || !statusText) { statusText = 'error'; if (status < 0) status = 0; }
      }
      jqXHR.status = status;
      jqXHR.statusText = (nativeStatusText || statusText) + '';
      if (isSuccess) deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
      else deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
      jqXHR.statusCode(statusCode);
      statusCode = undefined;
      if (fireGlobals) globalEventContext.trigger(isSuccess ? 'ajaxSuccess' : 'ajaxError', [jqXHR, s, isSuccess ? success : error]);
      completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);
      if (fireGlobals) {
        globalEventContext.trigger('ajaxComplete', [jqXHR, s]);
        if (!(--$.active)) $(document).trigger('ajaxStop');
      }
    }
    return jqXHR;
  };

  /* ---------------- built-in transports & prefilters ---------------- */
  const xhrSuccessStatus = { 0: 200, 1223: 204 };
  $.ajaxTransport(options => {
    let callback, errorCallback;
    return {
      send(headers, complete) {
        const xhr = options.xhr();
        xhr.open(options.type, options.url, options.async, options.username, options.password);
        if (options.xhrFields) for (const i in options.xhrFields) xhr[i] = options.xhrFields[i];
        if (options.mimeType && xhr.overrideMimeType) xhr.overrideMimeType(options.mimeType);
        if (!options.crossDomain && !headers['X-Requested-With']) headers['X-Requested-With'] = 'XMLHttpRequest';
        for (const i in headers) xhr.setRequestHeader(i, headers[i]);
        callback = type => () => {
          if (!callback) return;
          callback = errorCallback = xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = xhr.onreadystatechange = null;
          if (type === 'abort') xhr.abort();
          else if (type === 'error') { if (typeof xhr.status !== 'number') complete(0, 'error'); else complete(xhr.status, xhr.statusText); }
          else complete(xhrSuccessStatus[xhr.status] || xhr.status, xhr.statusText,
            (xhr.responseType || 'text') !== 'text' || typeof xhr.responseText !== 'string' ? { binary: xhr.response } : { text: xhr.responseText },
            xhr.getAllResponseHeaders());
        };
        xhr.onload = callback();
        errorCallback = xhr.onerror = xhr.ontimeout = callback('error');
        xhr.onabort = () => { if (xhr.readyState === 4) window.setTimeout(() => { if (callback) errorCallback(); }); else if (errorCallback) errorCallback(); };
        callback = callback('abort');
        try { xhr.send(options.hasContent && options.data || null); } catch (e) { if (callback) throw e; }
      },
      abort() { if (callback) callback(); },
    };
  });
  // a Content-Type given in `headers` wins over `contentType` (gh-4119)
  $.ajaxPrefilter(s => { for (const i in s.headers) if (i.toLowerCase() === 'content-type') s.contentType = s.headers[i] || ''; });
  // scripts: no cache-busting by default; cross-domain scripts load with a <script> element
  $.ajaxPrefilter(s => { if (s.crossDomain) s.contents.script = false; });
  $.ajaxPrefilter('script', s => { if (s.cache === undefined) s.cache = false; if (s.crossDomain) s.type = 'GET'; });
  $.ajaxTransport('script', s => {
    if (!(s.crossDomain || s.scriptAttrs)) return;
    let script, callback;
    return {
      send(_, complete) {
        script = document.createElement('script');
        if (s.scriptAttrs) for (const a in s.scriptAttrs) script.setAttribute(a, s.scriptAttrs[a]);
        if (s.scriptCharset) script.charset = s.scriptCharset;
        script.src = s.url;
        callback = evt => {
          script.removeEventListener('load', callback); script.removeEventListener('error', callback); script.remove(); callback = null;
          if (evt) complete(evt.type === 'error' ? 404 : 200, evt.type);
        };
        script.addEventListener('load', callback); script.addEventListener('error', callback);
        document.head.appendChild(script);
      },
      abort() { if (callback) callback(); },
    };
  });
  // JSONP — still the only way some third-party APIs work cross-origin
  $.ajaxPrefilter('json jsonp', (s, original, jqXHR) => {
    let overwritten, responseContainer;
    const jsonProp = s.jsonp !== false && (rJsonp.test(s.url) ? 'url'
      : isStr(s.data) && (s.contentType || '').indexOf('application/x-www-form-urlencoded') === 0 && rJsonp.test(s.data) && 'data');
    if (!(jsonProp || s.dataTypes[0] === 'jsonp')) return;
    const callbackName = s.jsonpCallback = isFn(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback;
    if (jsonProp) s[jsonProp] = s[jsonProp].replace(rJsonp, '$1' + callbackName);
    else if (s.jsonp !== false) s.url += (rQuery.test(s.url) ? '&' : '?') + s.jsonp + '=' + callbackName;
    s.converters['script json'] = () => { if (!responseContainer) $.error(callbackName + ' was not called'); return responseContainer[0]; };
    s.dataTypes[0] = 'json';
    overwritten = window[callbackName];
    window[callbackName] = function () { responseContainer = arguments; };
    jqXHR.always(() => {
      if (overwritten === undefined) { try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; } }
      else window[callbackName] = overwritten;
      if (s[callbackName]) { s.jsonpCallback = original.jsonpCallback; oldCallbacks.push(callbackName); }
      if (responseContainer && isFn(overwritten)) overwritten(responseContainer[0]);
      responseContainer = overwritten = undefined;
    });
    return 'script';
  });

  /* ---------------- shorthands ---------------- */
  for (const method of ['get', 'post']) {
    $[method] = function (url, data, callback, type) {
      if (isFn(data)) { type = type || callback; callback = data; data = undefined; }
      return $.ajax($.extend({ url, type: method, dataType: type, data, success: callback }, $.isPlainObject(url) && url));
    };
  }
  $.getJSON = (url, data, callback) => $.get(url, data, callback, 'json');
  $.getScript = (url, callback) => $.get(url, undefined, callback, 'script');
  $._evalUrl = (url, options, doc) => $.ajax({ url, type: 'GET', dataType: 'script', cache: true, async: false, global: false,
    converters: { 'text script': () => {} }, dataFilter(response) { globalEval(response, options, doc); } });
  function globalEval(code, options, doc) {
    doc = doc || document;
    const s = doc.createElement('script');
    s.text = code;
    if (options && options.nonce) s.nonce = options.nonce;
    doc.head.appendChild(s).parentNode.removeChild(s);
  }
  $.globalEval = globalEval;
  for (const n of ['ajaxStart', 'ajaxStop', 'ajaxComplete', 'ajaxError', 'ajaxSuccess', 'ajaxSend'])
    $.fn[n] = function (fn) { return this.on(n, fn); };

  $.fn.load = function (url, params, callback) {
    let selector, type, response;
    const self = this, off = url.indexOf(' ');
    if (off > -1) { selector = url.slice(off).trim(); url = url.slice(0, off); }
    if (isFn(params)) { callback = params; params = undefined; }
    else if (params && typeof params === 'object') type = 'POST';
    if (self.length > 0) {
      $.ajax({ url, type: type || 'GET', dataType: 'html', data: params }).done(function (responseText) {
        response = arguments;
        self.html(selector ? $('<div>').append($.parseHTML(responseText)).find(selector) : responseText);
      }).always(callback && function (jqXHR, status) {
        self.each(function () { callback.apply(this, response || [jqXHR.responseText, status, jqXHR]); });
      });
    }
    return this;
  };

  /* ---------------- forms ---------------- */
  const rSubmitterTypes = /^(?:submit|button|image|reset|file)$/i, rSubmittable = /^(?:input|select|textarea|keygen)/i,
    rCheckable = /^(?:checkbox|radio)$/i, rCRLF = /\r?\n/g;
  $.fn.serializeArray = function () {
    return this.map(function () { const els = this.elements; return els ? [...els] : this; })
      .filter(function () {
        const type = this.type;
        return this.name && !$(this).is(':disabled') && rSubmittable.test(this.nodeName) && !rSubmitterTypes.test(type) && (this.checked || !rCheckable.test(type));
      })
      .map(function (_i, elem) {
        const val = $(this).val();
        if (val == null) return null;
        if (Array.isArray(val)) return val.map(v => ({ name: elem.name, value: v.replace(rCRLF, '\r\n') }));
        return { name: elem.name, value: val.replace(rCRLF, '\r\n') };
      }).get();
  };
  $.fn.serialize = function () { return $.param(this.serializeArray()); };
  $.fn.serializeObject = function () {
    const o = {};
    for (const { name, value } of this.serializeArray()) {
      if (name.endsWith('[]')) (o[name.slice(0, -2)] = o[name.slice(0, -2)] || []).push(value);
      else if (name in o) o[name] = [].concat(o[name], value);
      else o[name] = value;
    }
    return o;
  };

  // jQuery.param: nested objects/arrays as a[b]=1&a[]=2 (or a=1&a=2 when traditional)
  const rBracket = /\[\]$/;
  function buildParams(prefix, obj, traditional, add) {
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => {
        if (traditional || rBracket.test(prefix)) add(prefix, v);
        else buildParams(prefix + '[' + (typeof v === 'object' && v != null ? i : '') + ']', v, traditional, add);
      });
    } else if (!traditional && toType(obj) === 'object') for (const name in obj) buildParams(prefix + '[' + name + ']', obj[name], traditional, add);
    else add(prefix, obj);
  }
  $.param = function (a, traditional) {
    const s = [];
    const add = (key, valueOrFunction) => {
      const value = isFn(valueOrFunction) ? valueOrFunction() : valueOrFunction;
      s[s.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value == null ? '' : value);
    };
    if (a == null) return '';
    if (Array.isArray(a) || (a instanceof KJ && !$.isPlainObject(a))) Array.from(a).forEach(el => add(el.name, el.value));
    else for (const prefix in a) buildParams(prefix, a[prefix], traditional, add);
    return s.join('&');
  };
