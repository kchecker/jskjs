/* Home hero: draw patch cables from each module into the $ output */
(function () {
  var bay = document.getElementById('bay');
  if (!bay) return;
  var svg = bay.querySelector('.cables');
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw(animate) {
    var b = bay.getBoundingClientRect();
    var jin = bay.querySelector('.jack-in').getBoundingClientRect();
    var ox = jin.left + jin.width / 2 - b.left, oy = jin.top + jin.height / 2 - b.top;
    svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
    svg.innerHTML = '';
    var paths = [];
    $('.module', bay).each(function (i, m) {
      var j = m.querySelector('.jack-out').getBoundingClientRect();
      var x = j.left + j.width / 2 - b.left, y = j.top + j.height / 2 - b.top;
      var sag = 50 + i * 16;
      var d = 'M' + x + ' ' + y + ' C ' + x + ' ' + (y + sag) + ', ' + ox + ' ' + (oy - sag) + ', ' + ox + ' ' + oy;
      ['shadow', ''].forEach(function (cls) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        if (cls) p.setAttribute('class', cls);
        else p.setAttribute('stroke', getComputedStyle(m).getPropertyValue('--mod').trim());
        svg.appendChild(p); paths.push(p);
      });
    });
    if (animate && !reduce) {
      paths.forEach(function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
      $.to(paths, { strokeDashoffset: 0, duration: .9, stagger: .06, delay: .45, ease: 'power2.inOut' });
    }
  }
  if (!reduce) {
    $.from('#bay .module', { y: 16, opacity: 0, duration: .45, stagger: .08, ease: 'power2.out' });
    $.fromTo('#bay .output', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5, delay: 1.2, ease: 'back.out' });
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(function () { draw(true); });
  $(window).on('resize', $.debounce(function () { draw(false); }, 150));
})();
