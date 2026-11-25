/* ==========================================================================
   Telza: Fillo product page
   1. Rotating hero word (form · lead · TCPA check · WhatsApp flow · CRM update)
   2. "How it works" slider: buttons, dots, drag/swipe, keyboard
   3. Scroll motion (GSAP + ScrollTrigger):
      - every device with motion allowed: wave text, statement lines + highlighter,
        collage depth, hand-drawn arrow, table rows, footer word
      - mouse/trackpad screens (same query as the homepage, window.TELZA_STORY_MQ):
        hero card tilt-away and the pinned six-service sequence
   Shared behaviour (nav, accordion, counters, contact form) comes from script.js.
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STORY_MQ = window.TELZA_STORY_MQ
    || '(min-width: 768px) and (min-height: 420px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

  /* ---------- 1. Rotating hero word (Fillo's own rotation, every 2.2s) ---------- */
  function initRotator() {
    const rot = $('[data-ff-rotator]');
    const word = rot && $('.ff-rot__word', rot);
    if (!word) return;
    const WORDS = ['form.', 'lead.', 'TCPA check.', 'WhatsApp flow.', 'CRM update.'];
    const line = rot.closest('.ff-line');

    // Shrink a word that is wider than its line (font-size only; the line's height is fixed by the headline)
    const fit = () => {
      word.style.fontSize = '';
      const avail = line.clientWidth;
      const w = word.scrollWidth;
      if (w > avail && avail > 0) word.style.fontSize = `${Math.floor((avail / w) * 1000) / 1000}em`;
    };
    fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    if (reduceMotion) return;

    let i = 0;
    const gsap = window.gsap;
    setInterval(() => {
      if (document.hidden) return;
      i = (i + 1) % WORDS.length;
      const swap = () => { word.textContent = WORDS[i]; fit(); };
      if (!gsap) { swap(); return; }
      gsap.timeline()
        .to(word, { yPercent: -60, autoAlpha: 0, filter: 'blur(6px)', duration: 0.35, ease: 'power2.in' })
        .add(swap)
        .fromTo(word, { yPercent: 60, autoAlpha: 0, filter: 'blur(6px)' }, { yPercent: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out' });
    }, 2200);
  }

  /* ---------- 2. How it works slider ---------- */
  function initSlider() {
    const vp = $('[data-ff-slider]');
    const track = vp && $('[data-ff-track]', vp);
    if (!track) return;
    const slides = $$('[data-ff-step]', track);
    const dots = $$('[data-ff-dot]');
    const prev = $('[data-ff-prev]');
    const next = $('[data-ff-next]');
    const count = $('[data-ff-how-count]');
    let index = 0;

    const offsetOf = (i) => slides[i].offsetLeft - slides[0].offsetLeft;
    const go = (i) => {
      index = Math.max(0, Math.min(slides.length - 1, i));
      track.style.transform = `translate3d(${-offsetOf(index)}px, 0, 0)`;
      slides.forEach((s, k) => { s.classList.toggle('is-active', k === index); s.setAttribute('aria-hidden', k === index ? 'false' : 'true'); });
      dots.forEach((d, k) => d.setAttribute('aria-selected', k === index ? 'true' : 'false'));
      if (count) count.textContent = String(index + 1).padStart(2, '0');
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index === slides.length - 1;
    };
    prev?.addEventListener('click', () => go(index - 1));
    next?.addEventListener('click', () => go(index + 1));
    dots.forEach((d, k) => d.addEventListener('click', () => go(k)));
    slides.forEach((s, k) => s.addEventListener('click', () => { if (!moved && k !== index) go(k); }));
    vp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    });

    // Drag / swipe (horizontal only; vertical page scroll stays native via touch-action: pan-y)
    let startX = 0;
    let dx = 0;
    let dragging = false;
    let moved = false;
    vp.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true; moved = false; startX = e.clientX; dx = 0;
      vp.classList.add('is-dragging');
      vp.setPointerCapture?.(e.pointerId);
    });
    vp.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dx = e.clientX - startX;
      if (Math.abs(dx) > 6) moved = true;
      const edge = (index === 0 && dx > 0) || (index === slides.length - 1 && dx < 0) ? 0.35 : 1; // resist at the ends
      track.style.transform = `translate3d(${-offsetOf(index) + dx * edge}px, 0, 0)`;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      vp.classList.remove('is-dragging');
      const threshold = Math.min(120, vp.clientWidth * 0.12);
      if (dx < -threshold) go(index + 1);
      else if (dx > threshold) go(index - 1);
      else go(index);
    };
    vp.addEventListener('pointerup', end);
    vp.addEventListener('pointercancel', end);
    window.addEventListener('resize', () => go(index));
    go(0);
  }

  /* ---------- Masked word helpers (same technique as the homepage's headings) ---------- */
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

  /* ---------- Who does what: curved connection lines between the layers ---------- */
  // Drawn from the planes' real on-screen positions, so they follow the stack as it opens and as a layer lifts.
  let redrawLinks = null;
  function initStack() {
    const stack = $('[data-ff-stack]');
    const svg = stack && $('[data-ff-links]', stack);
    if (!svg) return;
    const planes = $$('.ff-plane', stack);
    const NS = 'http://www.w3.org/2000/svg';
    // points inside each diamond, as fractions of its half-width / half-height
    const PTS = [[-0.42, 0.12], [0.18, 0.3], [0.46, -0.08], [-0.12, -0.34], [0.3, 0.16], [-0.3, -0.06]];
    const f = (n) => n.toFixed(1);
    let queued = false;
    const draw = () => {
      queued = false;
      svg.textContent = '';
      if (window.innerWidth <= 760) return; // phones: compact rows, no lines
      const box = stack.getBoundingClientRect();
      const geo = planes.map((p) => {
        const r = p.getBoundingClientRect();
        return { cx: r.left - box.left + r.width / 2, cy: r.top - box.top + r.height / 2, hw: r.width / 2, hh: r.height / 2 };
      });
      for (let i = geo.length - 1; i > 0; i--) {
        const lo = geo[i];
        const up = geo[i - 1];
        for (let k = 0; k < 3; k++) {
          const a = PTS[(i * 3 + k) % PTS.length];
          const b = PTS[(i * 3 + k + 2) % PTS.length];
          const x1 = lo.cx + a[0] * lo.hw;
          const y1 = lo.cy + a[1] * lo.hh;
          const x2 = up.cx + b[0] * up.hw;
          const y2 = up.cy + b[1] * up.hh;
          const my = (y1 + y2) / 2;
          const d = `M${f(x1)} ${f(y1)}C${f(x1)} ${f(my)} ${f(x2)} ${f(my)} ${f(x2)} ${f(y2)}`;
          const line = document.createElementNS(NS, 'path');
          line.setAttribute('d', d);
          svg.appendChild(line);
          if (k !== 1 && !reduceMotion) { // data flowing upwards on two of the three links
            const flow = document.createElementNS(NS, 'path');
            flow.setAttribute('d', d);
            flow.setAttribute('class', 'is-flow');
            svg.appendChild(flow);
          }
        }
      }
    };
    redrawLinks = () => { if (!queued) { queued = true; requestAnimationFrame(draw); } };
    window.addEventListener('resize', redrawLinks);
    window.addEventListener('load', redrawLinks);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawLinks);
    // a hovered layer lifts with a CSS transition: follow it for the length of the transition
    const follow = () => [0, 120, 260, 420, 560].forEach((t) => setTimeout(redrawLinks, t));
    stack.addEventListener('pointerover', follow);
    stack.addEventListener('pointerout', follow);
    stack.addEventListener('focusin', follow);
    stack.addEventListener('focusout', follow);
    redrawLinks();
  }

  /* ---------- 3. Scroll motion ---------- */
  function initMotion() {
    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    if (!gsap || !ST || reduceMotion) return;
    gsap.registerPlugin(ST);
    const mm = gsap.matchMedia();

    // 3a. Every device with motion allowed (no pinning)
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      // Wave: the marquee text slides along its curve with the scroll
      const tp = $('[data-ff-wave]');
      if (tp) {
        gsap.fromTo(tp, { attr: { startOffset: 0 } }, {
          attr: { startOffset: -1800 }, ease: 'none',
          scrollTrigger: { trigger: '.ff-wave', start: 'top bottom', end: () => `+=${window.innerHeight * 2.2}`, scrub: 0.6 },
        });
      }

      // Statement: lines rise out of their masks, then the highlighter sweeps
      const st = $('.ff-statement');
      if (st) {
        gsap.timeline({ scrollTrigger: { trigger: st, start: 'top 85%', end: 'top 25%', scrub: 0.8 } })
          .fromTo($$('.ff-line__in', st), { yPercent: 110 }, { yPercent: 0, stagger: 0.15, duration: 0.6, ease: 'power3.out' })
          .fromTo($('.ff-statement__lead', st), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 }, 0.4)
          .fromTo($('.ff-mark', st), { '--mk': '0%' }, { '--mk': '100%', duration: 0.5, ease: 'power2.inOut' }, 0.5);
      }

      // Collage: the tilted cards drift at different depths and lean as they pass
      $$('[data-ff-depth]').forEach((el) => {
        const d = parseFloat(el.dataset.ffDepth) || 0;
        gsap.fromTo(el, { y: d, rotation: d > 0 ? 3 : -3 }, {
          y: -d, rotation: 0, ease: 'none',
          scrollTrigger: { trigger: '.ff-collage', start: 'top bottom', end: 'bottom top', scrub: 1 },
        });
      });
      const copy = $('.ff-collage__copy');
      if (copy) {
        gsap.fromTo(copy.children, { y: 40, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: { trigger: copy, start: 'top 85%', end: 'top 40%', scrub: 0.8 },
        });
      }

      // Hand-drawn arrow draws itself
      $$('[data-ff-draw]').forEach((path) => {
        const len = path.getTotalLength();
        gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, {
          strokeDashoffset: 0, ease: 'none',
          scrollTrigger: { trigger: path.closest('.ff-note'), start: 'top 90%', end: 'top 45%', scrub: 0.8 },
        });
      });

      // Who does what: highlighter + rows arrive one by one
      const cmp = $('.ff-compare');
      if (cmp) {
        gsap.fromTo($('.ff-mark', cmp), { '--mk': '0%' }, {
          '--mk': '100%', ease: 'power2.inOut',
          scrollTrigger: { trigger: cmp, start: 'top 70%', end: 'top 30%', scrub: 0.8 },
        });
      }

      // CTA: the homepage's "Get started" motion (same values as story.js on the homepage):
      // heading words rise line by line out of masks, eyebrow and paragraph fade up
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

    // 3a+. Who does what: the stack explodes open with the scroll (mouse/trackpad screens);
    // touch screens get a simple row-by-row rise
    mm.add({ story: STORY_MQ, motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
      const { story, motion } = ctx.conditions;
      const stack = $('[data-ff-stack]');
      if (!motion || !stack) return;
      const rows = $$('.ff-stack__row', stack);
      if (story) {
        const visuals = rows.map((r) => $('.ff-stack__visual', r));
        gsap.timeline({
          scrollTrigger: { trigger: stack, start: 'top 85%', end: 'center 55%', scrub: 1, onUpdate: () => redrawLinks?.(), onRefresh: () => redrawLinks?.() },
        })
          .fromTo(visuals, { y: (i) => (2 - i) * 80, scale: 0.9 }, { y: 0, scale: 1, ease: 'power2.out', duration: 1 }, 0)
          .fromTo(rows.map((r) => $('.ff-stack__label', r)), { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out' }, 0.25)
          .fromTo(rows.map((r) => $('.ff-stack__note', r)), { x: 40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out' }, 0.3)
          .fromTo('[data-ff-links]', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.7);
      } else {
        rows.forEach((r) => gsap.fromTo(r, { y: 30, autoAlpha: 0 }, {
          y: 0, autoAlpha: 1, ease: 'power2.out',
          scrollTrigger: { trigger: r, start: 'top 94%', end: 'top 66%', scrub: 0.8 },
        }));
      }
      return () => redrawLinks?.();
    });

    // 3b. Mouse/trackpad screens: hero tilt-away + pinned services sequence
    mm.add(STORY_MQ, () => {
      const root = document.documentElement;
      root.classList.add('ff-story-on');

      // Hero: headline lines rise on load, the card arrives; on scroll the card tilts and sinks away
      const hero = $('.ff-hero');
      const product = $('[data-ff-product]');
      const lines = $$('.ff-hero__title .ff-line__in');
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from(lines, { yPercent: 110, duration: 1.1, stagger: 0.12 }, 0.1)
        .from('.ff-live, .ff-hero__lead, .ff-hero__cta', { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 0.5)
        .from(product, { y: 80, rotationY: -40, autoAlpha: 0, duration: 1.4, ease: 'expo.out' }, 0.25)
        .from('.ff-tag', { scale: 0.6, autoAlpha: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(2)' }, 0.9);
      gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.8 } })
        .to('.ff-hero__stage', { y: 140, rotationX: 14, rotationY: 18, scale: 0.86, ease: 'none' }, 0)
        .to('.ff-hero__copy', { y: -90, ease: 'none' }, 0)
        .to('.ff-tag--1, .ff-tag--3', { x: -50, ease: 'none' }, 0)
        .to('.ff-tag--2, .ff-tag--4', { x: 50, ease: 'none' }, 0)
        .to('.ff-hero__word', { xPercent: -14, ease: 'none' }, 0);

      // Services: pinned stage (CSS sticky). Cards enter from alternating sides, the device
      // in the middle switches to the matching service and turns, the background shifts.
      const seq = $('.ff-seq');
      const stage = $('.ff-seq__stage');
      const cards = $$('[data-ff-card]');
      const panels = $$('[data-ff-panel]');
      const device = $('[data-ff-device]');
      const count = $('[data-ff-seq-count]');
      const BG = ['#031614', '#04201d', '#03140f', '#06261f', '#021a17', '#052b26'];
      const N = cards.length;
      let shown = -1;
      const show = (i) => {
        if (i === shown) return;
        shown = i;
        panels.forEach((p, k) => p.classList.toggle('is-on', k === i));
        if (count) count.textContent = String(i + 1).padStart(2, '0');
      };
      gsap.set(cards, { autoAlpha: 0 });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: seq, start: 'top 55%', end: 'bottom bottom', scrub: 1, invalidateOnRefresh: true,
          onUpdate: (self) => show(Math.min(N - 1, Math.floor(self.progress * N * 1.0001))),
        },
      });
      cards.forEach((card, i) => {
        const side = i % 2 ? 1 : -1; // odd index → right card
        tl.fromTo(card, { autoAlpha: 0, x: side * 90, rotation: side * 4, scale: 1, y: 0 }, { autoAlpha: 1, x: 0, rotation: 0, duration: 0.3, ease: 'power3.out' }, i)
          .to(device, { rotationY: side * -12, rotationX: 4, y: i % 2 ? -10 : 10, duration: 0.5, ease: 'power2.inOut' }, i)
          .to(stage, { backgroundColor: BG[i], duration: 0.5, ease: 'none' }, i);
        // the previous service stays on its side, dimmed, until the next card on that side replaces it
        if (i < N - 1) tl.to(card, { autoAlpha: 0.32, scale: 0.92, y: -24, duration: 0.3, ease: 'power2.inOut' }, i + 1);
        if (i < N - 2) tl.to(card, { autoAlpha: 0, y: -60, duration: 0.2, ease: 'power2.in' }, i + 1.8);
      });
      tl.to({}, { duration: 0.4 }); // short hold on the last service
      show(0);

      // CTA box tilts into place in perspective (same values as the homepage's depth effect)
      const ctaBox = $('#cta .cta');
      if (ctaBox) {
        ctaBox.classList.add('ff-dz');
        gsap.fromTo(ctaBox, { '--dy': '80px', '--drx': '16deg', '--ds': 0.92 }, {
          '--dy': '0px', '--drx': '0deg', '--ds': 1, ease: 'power2.out',
          scrollTrigger: { trigger: '#cta', start: 'top bottom', end: 'top 35%', scrub: 1.2 },
        });
      }

      const refresh = () => ST.refresh();
      window.addEventListener('load', refresh);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
      return () => {
        root.classList.remove('ff-story-on');
        if (ctaBox) { ctaBox.classList.remove('ff-dz'); ['--dy', '--drx', '--ds'].forEach((v) => ctaBox.style.removeProperty(v)); }
        panels.forEach((p, k) => p.classList.toggle('is-on', k === 0));
        window.removeEventListener('load', refresh);
      };
    });
  }

  function boot() {
    initRotator();
    initSlider();
    initStack();
    initMotion();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
