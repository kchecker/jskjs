/* /download/: drum roll, then reveal the GitHub link */
(function () {
  var reveal = document.getElementById('reveal');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var done = false, audio;
  reveal.inert = true;                         // teaser only: nothing focusable until revealed
  function caption(t) { $('#drum-caption').text(t); }
  function snare(ctx, t, vol) {
    var len = 0.06, buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    var src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 1200;
    src.buffer = buf; g.gain.value = vol; src.connect(f).connect(g).connect(ctx.destination); src.start(t);
  }
  function crash(ctx, t) {
    var len = 1.6, buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
    var src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 4000; src.buffer = buf; g.gain.value = .22;
    src.connect(f).connect(g).connect(ctx.destination); src.start(t);
  }
  function playSound() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audio = audio || new AC();
      var t = audio.currentTime + .05, gap = .11;
      while (gap > .028 && t < audio.currentTime + 2.7) { snare(audio, t, .1 + (2.7 - gap * 20) * .03); t += gap; gap *= .955; }
      crash(audio, audio.currentTime + 2.9);
    } catch (e) {}
  }
  function confetti() {
    if (reduce) return;
    var colors = ['#4D7CFF', '#FF4F8B', '#22CFA2', '#FFB224'];
    for (var i = 0; i < 70; i++) {
      var $c = $('<span class="confetti" aria-hidden="true">').css({ background: colors[i % 4], left: (window.innerWidth / 2) + 'px', top: (window.innerHeight * .35) + 'px' }).appendTo(document.body);
      (function ($c) {
        $.to($c, { x: (Math.random() - .5) * window.innerWidth * 1.1, y: Math.random() * window.innerHeight * .7 - 120, rotate: Math.random() * 720 - 360, duration: 1.2 + Math.random() * .8, ease: 'power2.out' })
          .then(function () { return $.to($c, { opacity: 0, duration: .4 }); })
          .then(function () { $c.remove(); });
      })($c);
    }
  }
  function show() {
    if (done) return; done = true;
    reveal.removeAttribute('data-staged');
    reveal.inert = false;
    $('#drum-count').text('');
    caption('Here it is.');
    if (!reduce) $.fromTo('#reveal', { scale: .96 }, { scale: 1, duration: .6, ease: 'back.out' });
    confetti();
    $('#roll').prop('disabled', true);
    setTimeout(function () { document.getElementById('repo-link').focus(); }, 50);
  }
  $('#roll-skip').on('click', show);
  $('#roll').on('click', async function () {
    if (done) return;
    $(this).prop('disabled', true);
    if ($('#roll-sound').prop('checked')) playSound();
    if (reduce) { caption('Four libraries… one dollar sign…'); setTimeout(show, 600); return; }
    var lines = ['Four libraries…', '…one dollar sign…', '…zero build steps.'];
    var hits = 0, speed = .16;
    var tap = async function () {
      while (!done && hits < 34) {
        hits++;
        var side = hits % 2 ? '#stick-l' : '#stick-r';
        await $.to(side, { rotate: hits % 2 ? 18 : -18, duration: speed / 2 });
        $.to(side, { rotate: 0, duration: speed / 2 });
        $.fromTo('#drum-head', { scaleY: .9 }, { scaleY: 1, duration: speed });
        speed = Math.max(.035, speed * .93);
      }
    };
    tap();
    for (var n = 3; n >= 1; n--) {
      caption(lines[3 - n]);
      $('#drum-count').text(n);
      await $.fromTo('#drum-count', { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: .5, ease: 'back.out' });
      await new Promise(function (r) { setTimeout(r, 380); });
    }
    show();
  });
})();
