/* Glen Private Label Service — site behaviour.
   Plain JavaScript, no dependencies. Ported from glen-final.html; changes marked [FIX]. */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  /* ── NAV ─────────────────────────────────────────────── */
  const nav = $('#nav'), ham = $('#ham'), mmenu = $('#mmenu');
  addEventListener('scroll', () => nav.classList.toggle('shadow', scrollY > 10), { passive: true });

  // [FIX] state lives in classes + aria-expanded; the X icon is drawn by CSS
  function setMenu(open) {
    mmenu.classList.toggle('open', open);
    ham.classList.toggle('open', open);
    ham.setAttribute('aria-expanded', String(open));
    ham.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  }
  ham.addEventListener('click', () => setMenu(!mmenu.classList.contains('open')));
  $$('#mmenu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && mmenu.classList.contains('open')) { setMenu(false); ham.focus(); }
  });
  matchMedia('(min-width:801px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ── COUNTERS ────────────────────────────────────────────
     The final numbers are in the HTML, so crawlers and no-JS visitors see them.
     With JS they reset to 0 and count up when scrolled into view. */
  const counters = $$('[data-count]');
  function runCount(el) {
    const target = +el.dataset.count, dur = 1400;
    let start = null;
    requestAnimationFrame(function step(ts) {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.floor(eased * target).toLocaleString('en-US') + '+';
      if (p < 1) requestAnimationFrame(step); else el.textContent = target.toLocaleString('en-US') + '+';
    });
  }
  if (hasIO && !reduceMotion) {
    const cObs = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { runCount(e.target); cObs.unobserve(e.target); }
    }), { threshold: .5 });
    counters.forEach(el => { el.textContent = '0+'; cObs.observe(el); });
  }

  /* ── REVEAL ON SCROLL ────────────────────────────────── */
  const revs = $$('.rev');
  if (hasIO && !reduceMotion) {
    const rObs = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); rObs.unobserve(e.target); }
    }), { threshold: .06 });
    revs.forEach(el => rObs.observe(el));
  } else {
    revs.forEach(el => el.classList.add('in'));
  }

  /* ── FAQ ─────────────────────────────────────────────── */
  $$('.faq-q').forEach(btn => btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    $$('.faq-item.open').forEach(i => {
      i.classList.remove('open');
      $('.faq-q', i).setAttribute('aria-expanded', 'false');
    });
    if (!wasOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
  }));

  /* ── PORTFOLIO FILTER ────────────────────────────────────
     data-cat holds one or more space-separated categories. */
  const filts = $$('.filt');
  filts.forEach(btn => btn.addEventListener('click', () => {
    filts.forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
    btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true');
    const f = btn.dataset.f;
    $$('.port-item').forEach(item => {
      item.hidden = !(f === 'all' || item.dataset.cat.split(' ').includes(f));
    });
  }));

  /* ── CATEGORY PAGE PRODUCT FILTER ────────────────────────
     Same behaviour as the portfolio filter, for the .chip buttons on the
     category pages (skincare, haircare, …). */
  const chips = $$('.chip');
  chips.forEach(btn => btn.addEventListener('click', () => {
    chips.forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
    btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true');
    const f = btn.dataset.f;
    $$('.prod').forEach(item => {
      item.hidden = !(f === 'all' || (item.dataset.cat || '').split(' ').includes(f));
    });
  }));

  /* ── SERVICE CARD LINKS → contact form with category pre-selected ── */
  $$('[data-category]').forEach(a => a.addEventListener('click', () => {
    const sel = $('#f-category');
    if (sel) sel.value = a.dataset.category;   // no matching option → stays on the placeholder
  }));

  /* Quote buttons on the sub-pages link to /?category=Packaging%20%26%20Labeling#contact (etc.),
     so the form arrives with that category already chosen. */
  (() => {
    const sel = $('#f-category'), wanted = new URLSearchParams(location.search).get('category');
    if (sel && wanted) sel.value = wanted;   // unknown value → stays on the placeholder
  })();

  /* ── TESTIMONIAL CAROUSEL ────────────────────────────────
     [FIX] The mockup hard-coded 3 slides, so on phones (one card visible) cards 4 and 5
     could never be reached. The number of positions is now derived from the layout,
     the dots are generated to match, and touch swipe is supported. */
  (() => {
    const wrap = $('.testi-wrap'), track = $('#ttrack'), dotsBox = $('#tdots');
    if (!wrap || !track || !dotsBox) return;
    const cards = $$('.testi-card', track), GAP = 20;
    let cur = 0, positions = 1, timer = null;

    const step = () => cards[0].offsetWidth + GAP;
    const perView = () => Math.max(1, Math.round((wrap.clientWidth + GAP) / step()));

    function goTo(n) {
      cur = ((n % positions) + positions) % positions;
      const maxShift = Math.max(0, track.scrollWidth - wrap.clientWidth);
      track.style.transform = `translateX(${-Math.min(cur * step(), maxShift)}px)`;
      $$('.dot', dotsBox).forEach((d, i) => {
        d.classList.toggle('on', i === cur);
        d.setAttribute('aria-current', i === cur ? 'true' : 'false');
      });
    }
    function build() {
      positions = Math.max(1, cards.length - perView() + 1);
      dotsBox.innerHTML = '';
      for (let i = 0; i < positions; i++) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'dot';
        b.setAttribute('aria-label', `Show testimonial group ${i + 1} of ${positions}`);
        b.addEventListener('click', () => { goTo(i); restart(); });
        dotsBox.appendChild(b);
      }
      goTo(Math.min(cur, positions - 1));
    }
    function stop()  { clearInterval(timer); timer = null; }
    function start() { if (!reduceMotion && !timer && positions > 1) timer = setInterval(() => goTo(cur + 1), 5000); }
    function restart() { stop(); start(); }

    wrap.addEventListener('mouseenter', stop);
    wrap.addEventListener('mouseleave', start);
    wrap.addEventListener('focusin', stop);
    wrap.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

    let x0 = null;
    wrap.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    wrap.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { goTo(cur + (dx < 0 ? 1 : -1)); restart(); }
    }, { passive: true });

    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(build, 150); });
    build(); start();
  })();

  /* ── CONTACT FORM ────────────────────────────────────────
     [FIX] The mockup showed "Message received" without sending anything. This version posts to
     the endpoint in the form's data-endpoint attribute and only shows success when the server
     says OK. With no endpoint configured it shows the error message instead of faking success. */
  (() => {
    const form = $('#cform');
    if (!form) return;
    const ok = $('#form-ok'), err = $('#form-err'), btn = $('button[type="submit"]', form);
    const loadedAt = Date.now();

    function fail(reason) {
      if (reason) console.warn('[contact form]', reason);
      err.hidden = false;
      btn.disabled = false; btn.textContent = btn.dataset.label;
    }
    btn.dataset.label = btn.textContent;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      err.hidden = true;
      if (!form.reportValidity()) return;

      const data = Object.fromEntries(new FormData(form).entries());
      data.elapsed_ms = Date.now() - loadedAt;
      data.page = location.href;

      // Honeypot filled in → almost certainly a bot. Pretend it worked and send nothing.
      if (data.website) { form.hidden = true; ok.hidden = false; return; }

      const endpoint = form.dataset.endpoint;
      if (!endpoint) return fail('No endpoint set. Add the form handler URL to data-endpoint on #cform.');

      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.hidden = true; ok.hidden = false; ok.focus();
      } catch (ex) {
        fail(ex.message);
      }
    });
  })();

  /* ── FOOTER YEAR ─────────────────────────────────────── */
  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
