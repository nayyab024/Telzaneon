/* ==========================================================================
   Telza: Industry pages (shared by all six industry pages)
   1. Hero dashboard: the illustrative conversation plays in a loop and the activity rows light up
      (only while the hero is on screen and the tab is visible; static with reduced motion)
   2. Scroll motion (GSAP + ScrollTrigger, same gating as the product pages):
      - every device with motion allowed: cards arrive one by one, CTA headline reveal (homepage values)
      - mouse/trackpad screens (window.TELZA_STORY_MQ): hero entrance + drift, CTA tilt
   Shared behaviour (nav, reveals, CTA form) comes from script.js.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STORY_MQ = window.TELZA_STORY_MQ
    || '(min-width: 768px) and (min-height: 420px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

  /* ---------- 1. Hero dashboard ---------- */
  function initDash() {
    const convo = $('.ind-convo');
    const bubbles = convo ? $$('.ind-b', convo) : [];
    const rows = $$('[data-ind-row]');
    const scene = $('.ind-scene');
    if (!scene || reduceMotion) return;

    convo.classList.add('ind-play');
    let step = 0;
    let row = 0;
    let timer = 0;
    let visible = true;
    const tick = () => {
      // conversation: one bubble at a time, hold the full exchange, then start again
      if (step < bubbles.length) bubbles[step].classList.add('is-in');
      step += 1;
      if (step > bubbles.length + 2) { bubbles.forEach((b) => b.classList.remove('is-in')); step = 0; }
      // activity feed: the highlighted row moves down the list
      rows.forEach((r, k) => r.classList.toggle('is-hot', k === row));
      row = (row + 1) % Math.max(rows.length, 1);
    };
    const sync = () => {
      const run = visible && !document.hidden;
      if (run && !timer) { tick(); timer = setInterval(tick, 1300); }
      if (!run && timer) { clearInterval(timer); timer = 0; }
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(scene);
    document.addEventListener('visibilitychange', sync);
    sync();
  }

  /* ---------- Masked words (same technique as the homepage's headings) ---------- */
  function splitWords(h) {
    h.classList.add('ed');
    const words = h.textContent.trim().split(/\s+/);
    h.textContent = '';
    words.forEach((word, i) => {
      const w = document.createElement('span');
      const inner = document.createElement('span');
      w.className = 'w';
      inner.textContent = word;
      w.appendChild(inner);
      h.appendChild(w);
      if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
    });
    return $$('.w > span', h);
  }
  function toLines(words) {
    const lines = [];
    let top = null;
    words.forEach((w) => {
      const t = Math.round(w.parentNode.getBoundingClientRect().top);
      if (top === null || Math.abs(t - top) > 6) { lines.push([]); top = t; }
      lines[lines.length - 1].push(w);
    });
    return lines;
  }

  /* ---------- 2. Scroll motion ---------- */
  function initMotion() {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (!gsap || !ST || reduceMotion) return;
    gsap.registerPlugin(ST);
    const mm = gsap.matchMedia();

    // 2a. Every device with motion allowed
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // section headings and card grids arrive one by one
      $$('.ind-head').forEach((head) => {
        gsap.fromTo(head.children, { y: 34, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: head, start: 'top 90%', end: 'top 60%', scrub: 0.8 },
        });
      });
      [['.ind-challenges__grid', '.ind-chal'], ['.ind-solutions__grid', '.ind-sol'], ['.ind-steps__grid', '.ind-step'], ['.ind-benefits__grid', '.ind-ben']].forEach(([grid, item]) => {
        const g = $(grid);
        if (!g) return;
        gsap.fromTo($$(item, g), { y: 60, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: g, start: 'top 90%', end: 'top 45%', scrub: 0.8 },
        });
      });

      // CTA: the homepage's "Get started" motion (same values as on the homepage)
      const cta = $('#cta .cta');
      const ctaTitle = cta && $('h2', cta);
      if (ctaTitle) {
        const words = splitWords(ctaTitle);
        const eyebrow = $('.eyebrow', cta);
        const lead = $(':scope > p:not(.form-msg)', cta);
        gsap.set(words, { y: 0, yPercent: 120, rotation: 3 });
        if (eyebrow) gsap.set(eyebrow, { autoAlpha: 0, y: 14 });
        if (lead) gsap.set(lead, { autoAlpha: 0, y: 26 });
        ST.create({
          trigger: cta, start: 'top 82%', once: true,
          onEnter: () => {
            const tl = gsap.timeline();
            if (eyebrow) tl.to(eyebrow, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0);
            toLines(words).forEach((line, i) => tl.to(line, { y: 0, yPercent: 0, rotation: 0, duration: 1.15, ease: 'expo.out', stagger: 0.035 }, 0.08 + i * 0.14));
            if (lead) tl.to(lead, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0.45);
          },
        });
      }
    });

    // 2b. Mouse/trackpad screens: hero entrance + drift, CTA tilt
    mm.add(STORY_MQ, () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.ind-hero .ind-kicker', { y: 16, autoAlpha: 0, duration: 0.8 }, 0)
        .from('.ind-hero__title .ind-line__in', { yPercent: 110, duration: 1.1, stagger: 0.12 }, 0.1)
        .from('.ind-hero__lead, .ind-hero__cta', { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 0.45)
        .from('.ind-hero__stripes', { scaleY: 0.4, autoAlpha: 0, duration: 1.4, ease: 'expo.out' }, 0.2)
        .from('.ind-dash', { y: 80, autoAlpha: 0, duration: 1.3, ease: 'expo.out' }, 0.5)
        .from('.ind-feed li', { x: 24, autoAlpha: 0, duration: 0.6, stagger: 0.1 }, 1.1);
      gsap.timeline({ scrollTrigger: { trigger: '.ind-hero', start: 'top top', end: 'bottom top', scrub: 0.8 } })
        .to('.ind-hero__copy', { y: -60, ease: 'none' }, 0);

      const ctaBox = $('#cta .cta');
      if (ctaBox) {
        ctaBox.classList.add('ind-dz');
        gsap.fromTo(ctaBox, { '--dy': '80px', '--drx': '16deg', '--ds': 0.92 }, {
          '--dy': '0px', '--drx': '0deg', '--ds': 1, ease: 'power2.out',
          scrollTrigger: { trigger: '#cta', start: 'top bottom', end: 'top 35%', scrub: 1.2 },
        });
      }

      const refresh = () => ST.refresh();
      window.addEventListener('load', refresh);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      return () => {
        if (ctaBox) { ctaBox.classList.remove('ind-dz'); ['--dy', '--drx', '--ds'].forEach((v) => ctaBox.style.removeProperty(v)); }
        window.removeEventListener('load', refresh);
      };
    });
  }

  function boot() {
    initDash();
    initMotion();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
