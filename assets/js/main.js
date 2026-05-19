/* LeverageIQ — UI behavior: nav blur, reveal-on-scroll, counters, multi-step form */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav blur on scroll ---------- */
  const nav = $('#nav');
  const updateNav = () => {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Counters ---------- */
  const counters = $$('[data-count]');
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const val = Math.round(target * easeOutCubic(p));
      el.textContent = `${prefix}${val}${suffix}`;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(e.target);
          co.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => co.observe(el));
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Smooth anchor offset for fixed nav ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const navH = nav ? nav.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navH + 1;
    window.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', id);
  });

  /* ---------- Multi-step signup form ---------- */
  const form = $('#signup-form');
  if (form) {
    const track = $('.form__track', form);
    const dots = $$('.form__dots li', form);
    const bar = $('.form__bar i', form);
    const prevBtn = $('[data-prev]', form);
    const nextBtn = $('[data-next]', form);
    const submitBtn = $('[data-submit]', form);
    const panels = $$('.step-panel', form);
    const totalSteps = 4; // 4 input steps + done panel
    let step = 1;

    const go = (s) => {
      step = Math.max(1, Math.min(s, totalSteps + 1));
      const offset = -(step - 1) * 20; // each panel is 20% of 500% track
      track.style.transform = `translateX(${offset}%)`;
      dots.forEach((d, i) => d.classList.toggle('is-active', i < step));
      bar.style.width = `${Math.min(step / totalSteps, 1) * 100}%`;
      prevBtn.disabled = step <= 1 || step > totalSteps;
      if (step > totalSteps) {
        nextBtn.hidden = true;
        submitBtn.hidden = true;
        prevBtn.hidden = true;
      } else if (step === totalSteps) {
        nextBtn.hidden = true;
        submitBtn.hidden = false;
      } else {
        nextBtn.hidden = false;
        submitBtn.hidden = true;
      }
      // focus first field of new step
      const active = panels[step - 1];
      if (active) {
        const first = active.querySelector('input,select,textarea');
        if (first) setTimeout(() => first.focus({ preventScroll: true }), 350);
      }
    };

    const validateStep = () => {
      const panel = panels[step - 1];
      if (!panel) return true;
      const required = $$('[required]', panel);
      let ok = true;
      required.forEach((el) => {
        if (el.type === 'checkbox' && !el.checked) { ok = false; flash(el); }
        else if (!el.value) { ok = false; flash(el); }
      });
      return ok;
    };
    const flash = (el) => {
      const host = el.closest('label') || el;
      host.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
        { duration: 280, easing: 'ease-out' },
      );
      el.style.borderColor = '#ff5b5b';
      setTimeout(() => { el.style.borderColor = ''; }, 1200);
    };

    nextBtn.addEventListener('click', () => { if (validateStep()) go(step + 1); });
    prevBtn.addEventListener('click', () => go(step - 1));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateStep()) return;

      const data = Object.fromEntries(new FormData(form).entries());
      // collect pain checkboxes
      data.pain = $$('input[name="pain"]:checked', form).map((i) => i.value);

      try {
        const all = JSON.parse(localStorage.getItem('liq_signups') || '[]');
        all.push({ ...data, ts: new Date().toISOString() });
        localStorage.setItem('liq_signups', JSON.stringify(all));
      } catch (_) { /* ignore */ }

      go(totalSteps + 1);
    });

    // initialize
    go(1);
  }
})();
