/* jskjs.org site chrome — built with jsKjs itself.
   Pulse components: themeSwitch, mobileMenu · Motion: scroll entrances · Core: copy, filters, header. */
(function () {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  const saved = () => { try { return localStorage.getItem('kj-theme'); } catch (e) { return null; } };
  const current = () => root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');

  /* ---- Pulse: theme switch ---------------------------------------- */
  $.component('themeSwitch', () => ({
    dark: current() === 'dark',
    init() {
      // follow the OS until the visitor chooses
      systemDark.addEventListener('change', e => { if (!saved()) this.dark = e.matches; });
    },
    toggle() {
      this.dark = !this.dark;
      const theme = this.dark ? 'dark' : 'light';
      root.classList.add('theming');                         // brief colour transition
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem('kj-theme', theme); } catch (e) {}
      setTimeout(() => root.classList.remove('theming'), 450);
      if (!reduce) $.fromTo('#theme-toggle .ico', { rotate: -90, scale: .6 }, { rotate: 0, scale: 1, duration: .35, ease: 'back.out' });
    },
  }));

  /* ---- Pulse: mobile menu ----------------------------------------- */
  $.component('mobileMenu', () => ({
    open: false,
    toggle() {
      this.open = !this.open;
      if (this.open && !reduce) $.fromTo('#mnav-panel', { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: .2, ease: 'power2.out' });
      if (this.open) setTimeout(() => $('#mnav-panel a').first().focus(), 30);
    },
    close() { if (this.open) { this.open = false; $('.mnav-btn').focus(); } },
  }));

  $(function () {
    /* close the menu when clicking elsewhere */
    $(document).on('click', e => {
      if (!e.target.closest || e.target.closest('.mnav')) return;
      const menu = document.querySelector('.mnav');
      if (menu && $('#mnav-panel').css('display') !== 'none') $('.mnav-btn').trigger('click');
    });

    /* header lifts off the page once you scroll */
    const lift = () => $('.site-header').toggleClass('scrolled', window.scrollY > 8);
    $(window).on('scroll', $.throttle(lift, 80));
    lift();

    /* copy buttons on every code block — one delegated listener */
    $(document).on('click', '.copy-btn', async function () {
      const code = document.getElementById($(this).data('copy'));
      const $btn = $(this);
      try { await navigator.clipboard.writeText(code.innerText); $btn.text('Copied ✓'); }
      catch (e) {
        const r = document.createRange(); r.selectNodeContents(code);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r); $btn.text('Selected');
      }
      setTimeout(() => $btn.text('Copy'), 1600);
    });

    /* hub filters: <input data-filter="#grid"> + [data-filter-mod] buttons */
    $('[data-filter]').each(function () {
      const $input = $(this), grid = $input.data('filter');
      let mod = 'all';
      const apply = () => {
        const q = $.trim($input.val().toLowerCase());
        let shown = 0;
        $(grid).children().each(function () {
          const hay = (this.dataset.search || this.textContent).toLowerCase();
          const ok = (!q || hay.includes(q)) && (mod === 'all' || this.dataset.mod === mod);
          $(this).toggle(ok); if (ok) shown++;
        });
        $('#filter-count').text(shown + ' shown');
      };
      $input.on('input', $.debounce(apply, 120));
      $('[data-filter-mod]').on('click', function () {
        mod = $(this).data('filter-mod');
        $('[data-filter-mod]').attr('aria-pressed', 'false');
        $(this).attr('aria-pressed', 'true');
        apply();
      });
    });

    /* Motion: scroll entrances for content below the fold */
    if (reduce || !('IntersectionObserver' in window)) return;
    const targets = $('main .plate, main .card, main .stage, main .api-item, main .verdict, main .table-wrap, main .feature-row > div, main .note, main .size-row')
      .filter((i, el) => el.getBoundingClientRect().top > window.innerHeight && !el.closest('.stage-body, .reveal, .legacy-demo .panel .panel'));
    targets.css('opacity', 0);
    const io = new IntersectionObserver(entries => {
      const shown = entries.filter(e => e.isIntersecting).map(e => e.target);
      if (!shown.length) return;
      shown.forEach(el => io.unobserve(el));
      $.fromTo(shown, { y: 22 }, { y: 0, opacity: 1, duration: .55, stagger: .06, ease: 'power2.out' })
        .then(() => $(shown).css('transform', ''));       // leave no transform behind (fixed-position children)
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.each((i, el) => io.observe(el));
  });
})();
