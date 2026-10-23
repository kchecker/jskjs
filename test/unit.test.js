const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<!DOCTYPE html><body>
  <div id="app" class="box">
    <ul id="list"><li class="item">A</li><li class="item active">B</li><li class="item">C</li></ul>
    <input id="name" value="hello">
    <form id="f"><input name="q" value="42"></form>
    <div id="comp" kj-data="{ count: 2, open: true }">
      <span kj-text="count"></span>
      <button @click="count++">+</button>
      <p kj-show="open">visible</p>
    </div>
  </div>
</body>`, { url: 'http://localhost/', pretendToBeVisual: true });

global.window = dom.window;
const $ = require('../src/jskjs.js');

let pass = 0, fail = 0;
function t(name, cond) { cond ? (pass++) : (fail++, console.log('FAIL:', name)); }

setTimeout(() => {
  // selectors & collection
  t('select length', $('.item').length === 3);
  t('id select', $('#app').length === 1);
  t('context', $('.item', '#list').length === 3);
  t('html create', $('<p>hi</p>')[0].tagName === 'P');

  // content
  t('text get', $('.item').first().text() === 'A');
  $('.item').last().text('Z');
  t('text set', $('#list li').eq(2).text() === 'Z');
  t('html get', $('#list').html().includes('<li'));
  t('val get', $('#name').val() === 'hello');
  $('#name').val('world');
  t('val set', $('#name').val() === 'world');

  // classes & attrs & css
  t('hasClass', $('.item.active').hasClass('active'));
  $('#app').addClass('one two').removeClass('box').toggleClass('three');
  const cls = $('#app')[0].className;
  t('class ops', cls.includes('one') && cls.includes('three') && !cls.includes('box'));
  $('#app').attr('data-x', '5').attr({ role: 'main' });
  t('attr', $('#app').attr('data-x') === '5' && $('#app').attr('role') === 'main');
  $('#app').css({ marginTop: 10, opacity: 0.5 });
  t('css units', $('#app')[0].style.marginTop === '10px' && $('#app')[0].style.opacity === '0.5');
  $('#app').data('user', { id: 1 });
  t('data store', $('#app').data('user').id === 1);

  // traversal
  t('find', $('#app').find('li').length === 3);
  t('filter', $('.item').filter('.active').length === 1);
  t('not', $('.item').not('.active').length === 2);
  t('closest', $('.active').closest('#app').length === 1);
  t('parent', $('.active').parent()[0].id === 'list');
  t('children', $('#list').children().length === 3);
  t('siblings', $('.active').siblings().length === 2);
  t('next/prev', $('.item').first().next().hasClass('active') && $('.active').prev().text() === 'A');
  t('eq negative', $('.item').eq(-1).text() === 'Z');
  t('is', $('.active').is('.item'));

  // insertion
  $('#list').append('<li class="item">D</li>').prepend($('<li class="item">Pre</li>'));
  t('append/prepend', $('#list li').length === 5 && $('#list li').first().text() === 'Pre');
  $('#list li').last().remove();
  t('remove', $('#list li').length === 4);
  const clone = $('#list').clone();
  t('clone', clone.find('li').length === 4);

  // events + delegation + trigger
  let clicks = 0, delegated = 0;
  $('#app').on('click', () => clicks++);
  $('#list').on('click', '.item', function () { delegated++; });
  $('.active').trigger('click');
  t('event bubble + delegate', clicks === 1 && delegated === 1);
  $('#app').off('click');
  $('.active').trigger('click');
  t('off', clicks === 1);
  let once = 0;
  $('#app').one('custom', () => once++);
  $('#app').trigger('custom').trigger('custom');
  t('one', once === 1);
  let payload;
  $('#app').on('boom', (e, d) => payload = d);
  $('#app').trigger('boom', { x: 9 });
  t('trigger detail', payload.x === 9);

  // serialize
  t('serialize', $('#f').serialize() === 'q=42');
  t('serializeObject', $('#f').serializeObject().q === '42');

  // utilities
  t('extend deep', $.extend(true, { a: { b: 1 } }, { a: { c: 2 } }).a.b === 1);
  t('param', $.param({ a: 1, b: 'x y' }) === 'a=1&b=x+y');
  t('escape', $.escape('<b>') === '&lt;b&gt;');
  $.extend(true, {}, JSON.parse('{"__proto__": {"polluted": "yes"}}'));
  t('extend blocks prototype pollution', ({}).polluted === undefined);
  const srcObj = { a: { b: 1 } }; const copy = $.extend(true, {}, srcObj); copy.a.b = 2;
  t('deep extend clones nested objects', srcObj.a.b === 1);
  // .not / .is with functions, elements and collections
  t('not(fn)', $('.item').not((i, el) => el.classList.contains('active')).length === $('.item').length - 1);
  t('not(element)', $('.item').not($('.active')[0]).length === $('.item').length - 1);
  t('is(fn)', $('.item').is((i, el) => el.classList.contains('active')));
  // CSS custom properties: read back, no auto-px
  $('#app').css('--hue', 200);
  t('css custom prop set w/o px', $('#app')[0].style.getPropertyValue('--hue') === '200');
  t('css custom prop get', $('#app').css('--hue') === '200');
  // registered components with arguments
  t('easings exposed', typeof $.easings['bounce.out'] === 'function' && $.easings.linear(.5) === .5);

  // reactivity (Pulse)
  const span = dom.window.document.querySelector('#comp span');
  t('kj-text initial', span.textContent === '2');
  dom.window.document.querySelector('#comp button').dispatchEvent(new dom.window.Event('click', { bubbles: true }));
  setTimeout(() => {
    t('kj-text reactive after click', span.textContent === '3');
    t('kj-show', dom.window.document.querySelector('#comp p').style.display !== 'none');

    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }, 20);
}, 50);
